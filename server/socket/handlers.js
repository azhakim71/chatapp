import jwt from 'jsonwebtoken';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import { JWT_SECRET } from '../index.js';
import { EncryptionUtils } from '../utils/encryption.js';

const connectedUsers = new Map();

export const handleSocketConnection = (socket, io) => {
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user) {
        socket.userId = user._id.toString();
        socket.username = user.username;
        connectedUsers.set(socket.userId, socket.id);
        
        // Update user online status
        await User.findByIdAndUpdate(user._id, { 
          isOnline: true,
          lastSeen: new Date()
        });

        socket.emit('authenticated', { success: true });
        
        // Broadcast user online status to friends
        const friends = user.friends.filter(f => f.status === 'accepted');
        friends.forEach(friend => {
          const friendSocketId = connectedUsers.get(friend.user.toString());
          if (friendSocketId) {
            io.to(friendSocketId).emit('friend_online', {
              userId: user._id,
              username: user.username,
              isOnline: true
            });
          }
        });
      } else {
        socket.emit('authenticated', { success: false, message: 'User not found' });
      }
    } catch (error) {
      socket.emit('authenticated', { success: false, message: 'Invalid token' });
    }
  });

  socket.on('join_chat', async (chatId) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      // Check if user has access to this chat
      if (chat.type !== 'public' && !chat.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      socket.join(chatId);
      socket.emit('joined_chat', { chatId });
    } catch (error) {
      socket.emit('error', { message: 'Failed to join chat' });
    }
  });

  socket.on('send_message', async (data) => {
    try {
      const { chatId, content, encrypted = true } = data;
      
      const chat = await Chat.findById(chatId);
      if (!chat) {
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      // Check if user has access to this chat
      if (chat.type !== 'public' && !chat.participants.includes(socket.userId)) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      const message = {
        sender: socket.userId,
        content,
        encrypted: chat.type !== 'public' && encrypted,
        createdAt: new Date()
      };

      chat.messages.push(message);
      await chat.save();

      const populatedMessage = await Chat.findById(chatId)
        .select('messages')
        .populate('messages.sender', 'username')
        .then(c => c.messages[c.messages.length - 1]);

      // Emit to all users in the chat
      io.to(chatId).emit('new_message', {
        chatId,
        message: populatedMessage
      });

      // Send push notifications to offline participants
      if (chat.type !== 'public') {
        const offlineParticipants = await User.find({
          _id: { $in: chat.participants },
          _id: { $ne: socket.userId },
          isOnline: false
        });

        // Here you would integrate with a push notification service
        // For now, we'll just log it
        console.log(`Would send push notification to ${offlineParticipants.length} users`);
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing', (data) => {
    const { chatId, isTyping } = data;
    socket.to(chatId).emit('user_typing', {
      userId: socket.userId,
      username: socket.username,
      isTyping
    });
  });

  socket.on('disconnect', async () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      
      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, { 
        isOnline: false,
        lastSeen: new Date()
      });

      // Broadcast user offline status to friends
      const user = await User.findById(socket.userId);
      if (user) {
        const friends = user.friends.filter(f => f.status === 'accepted');
        friends.forEach(friend => {
          const friendSocketId = connectedUsers.get(friend.user.toString());
          if (friendSocketId) {
            io.to(friendSocketId).emit('friend_online', {
              userId: socket.userId,
              username: socket.username,
              isOnline: false
            });
          }
        });
      }
    }
  });
};