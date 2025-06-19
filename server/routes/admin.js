import express from 'express';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Notification from '../models/Notification.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select('username isOnline lastSeen createdAt isAdmin')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get platform statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ isOnline: true });
    const totalChats = await Chat.countDocuments({ type: { $ne: 'public' } });
    const totalMessages = await Chat.aggregate([
      { $unwind: '$messages' },
      { $count: 'total' }
    ]);

    const stats = {
      totalUsers,
      onlineUsers,
      totalChats,
      totalMessages: totalMessages[0]?.total || 0
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send notification to all users
router.post('/broadcast', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const users = await User.find({ isAdmin: false }).select('_id');
    
    const notifications = users.map(user => ({
      recipient: user._id,
      sender: req.user._id,
      type: 'admin_notification',
      title,
      message
    }));

    await Notification.insertMany(notifications);

    res.json({ 
      message: 'Notification sent successfully',
      recipientCount: users.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle user admin status
router.patch('/users/:userId/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isAdmin },
      { new: true }
    ).select('username isAdmin');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;