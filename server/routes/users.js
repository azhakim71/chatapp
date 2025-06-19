import express from 'express';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('friends.user', 'username isOnline lastSeen');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search users
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      username: { $regex: query, $options: 'i' },
      _id: { $ne: req.user._id }
    }).select('username isOnline lastSeen');

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send friend request
router.post('/friend-request', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already friends or request exists
    const existingFriend = req.user.friends.find(f => f.user.toString() === userId);
    if (existingFriend) {
      return res.status(400).json({ message: 'Friend request already exists or users are already friends' });
    }

    // Add friend request
    req.user.friends.push({ user: userId, status: 'pending' });
    targetUser.friends.push({ user: req.user._id, status: 'pending' });

    await req.user.save();
    await targetUser.save();

    // Create notification
    const notification = new Notification({
      recipient: userId,
      sender: req.user._id,
      type: 'friend_request',
      title: 'New Friend Request',
      message: `${req.user.username} sent you a friend request`
    });

    await notification.save();

    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Accept/reject friend request
router.post('/friend-request/respond', authenticateToken, async (req, res) => {
  try {
    const { userId, action } = req.body;
    
    if (!userId || !action) {
      return res.status(400).json({ message: 'User ID and action are required' });
    }

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be accept or reject' });
    }

    const sender = await User.findById(userId);
    if (!sender) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find friend request
    const friendRequest = req.user.friends.find(f => f.user.toString() === userId && f.status === 'pending');
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    const senderRequest = sender.friends.find(f => f.user.toString() === req.user._id.toString() && f.status === 'pending');

    if (action === 'accept') {
      friendRequest.status = 'accepted';
      if (senderRequest) senderRequest.status = 'accepted';

      // Create notification
      const notification = new Notification({
        recipient: userId,
        sender: req.user._id,
        type: 'friend_accepted',
        title: 'Friend Request Accepted',
        message: `${req.user.username} accepted your friend request`
      });

      await notification.save();
    } else {
      // Remove friend requests
      req.user.friends = req.user.friends.filter(f => f.user.toString() !== userId);
      sender.friends = sender.friends.filter(f => f.user.toString() !== req.user._id.toString());
    }

    await req.user.save();
    await sender.save();

    res.json({ message: `Friend request ${action}ed successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;