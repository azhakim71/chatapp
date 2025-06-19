import express from 'express';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { EncryptionUtils } from '../utils/encryption.js';

const router = express.Router();

// Get user's chats
router.get('/', authenticateToken, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
      isActive: true
    })
    .populate('participants', 'username isOnline lastSeen')
    .populate('messages.sender', 'username')
    .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get public chat
router.get('/public', authenticateToken, async (req, res) => {
  try {
    let publicChat = await Chat.findOne({ type: 'public' })
      .populate('messages.sender', 'username')
      .sort({ 'messages.createdAt': -1 });

    if (!publicChat) {
      publicChat = new Chat({
        type: 'public',
        participants: [],
        messages: []
      });
      await publicChat.save();
    }

    res.json(publicChat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create private chat
router.post('/private', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if users are friends
    const friend = req.user.friends.find(f => f.user.toString() === userId && f.status === 'accepted');
    if (!friend) {
      return res.status(403).json({ message: 'You can only chat with friends' });
    }

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      type: 'private',
      participants: { $all: [req.user._id, userId], $size: 2 }
    });

    if (existingChat) {
      return res.json(existingChat);
    }

    // Create new private chat
    const chat = new Chat({
      type: 'private',
      participants: [req.user._id, userId],
      messages: []
    });

    await chat.save();
    await chat.populate('participants', 'username isOnline lastSeen');

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create group chat
router.post('/group', authenticateToken, async (req, res) => {
  try {
    const { name, participants } = req.body;

    if (!name || !participants || !Array.isArray(participants)) {
      return res.status(400).json({ message: 'Name and participants are required' });
    }

    // Verify all participants are friends
    const friendIds = req.user.friends
      .filter(f => f.status === 'accepted')
      .map(f => f.user.toString());

    const invalidParticipants = participants.filter(p => !friendIds.includes(p));
    if (invalidParticipants.length > 0) {
      return res.status(403).json({ message: 'You can only add friends to group chats' });
    }

    // Generate group encryption key
    const groupKey = EncryptionUtils.generateAESKey();

    // Create group chat
    const chat = new Chat({
      type: 'group',
      name,
      participants: [req.user._id, ...participants],
      admins: [req.user._id],
      groupKey,
      messages: []
    });

    await chat.save();
    await chat.populate('participants', 'username isOnline lastSeen');

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get chat messages
router.get('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user has access to this chat
    if (chat.type !== 'public' && !chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = chat.messages
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice((page - 1) * limit, page * limit)
      .reverse();

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;