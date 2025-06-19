import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export class DatabaseManager {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async testConnection(uri) {
    try {
      const testConnection = await mongoose.createConnection(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // 5 second timeout
      });
      
      await testConnection.db.admin().command({ ping: 1 });
      await testConnection.close();
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async connect(uri) {
    try {
      if (this.connection) {
        await this.connection.close();
      }

      this.connection = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      this.isConnected = true;
      console.log('✅ Database connected successfully');
      return { success: true, message: 'Database connected successfully' };
    } catch (error) {
      this.isConnected = false;
      console.error('❌ Database connection failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  async initializeDatabase() {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      // Import models to ensure they're registered
      const User = (await import('../models/User.js')).default;
      const Chat = (await import('../models/Chat.js')).default;
      const Notification = (await import('../models/Notification.js')).default;
      const { EncryptionUtils } = await import('../utils/encryption.js');

      console.log('🔄 Initializing database...');

      // Create indexes
      await User.createIndexes();
      await Chat.createIndexes();
      await Notification.createIndexes();

      // Check if sample data already exists
      const existingUsers = await User.countDocuments();
      if (existingUsers > 0) {
        console.log('📊 Sample data already exists');
        return { success: true, message: 'Database already initialized with sample data' };
      }

      // Create sample users
      const sampleUsers = [
        {
          username: 'admin',
          password: 'admin123',
          isAdmin: true,
          role: 'Administrator'
        },
        {
          username: 'testuser',
          password: 'test123',
          isAdmin: false,
          role: 'Regular user'
        },
        {
          username: 'alice',
          password: 'alice123',
          isAdmin: false,
          role: 'Regular user'
        }
      ];

      const createdUsers = [];

      for (const userData of sampleUsers) {
        const { publicKey } = EncryptionUtils.generateKeyPair();
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        const user = new User({
          username: userData.username,
          password: hashedPassword,
          publicKey,
          isAdmin: userData.isAdmin
        });

        await user.save();
        createdUsers.push({
          id: user._id,
          username: user.username,
          role: userData.role,
          password: userData.password // Only for initial setup info
        });

        console.log(`👤 Created ${userData.role}: ${userData.username}`);
      }

      // Create a sample public chat
      const publicChat = new Chat({
        type: 'public',
        participants: [],
        messages: [
          {
            sender: createdUsers[0].id,
            content: 'Welcome to SecureChat! This is the public chat room where all users can communicate.',
            encrypted: false,
            createdAt: new Date()
          },
          {
            sender: createdUsers[1].id,
            content: 'Hello everyone! Great to be here.',
            encrypted: false,
            createdAt: new Date(Date.now() + 1000)
          }
        ]
      });

      await publicChat.save();
      console.log('💬 Created sample public chat');

      // Create friend relationship between test users
      const testUser = await User.findOne({ username: 'testuser' });
      const alice = await User.findOne({ username: 'alice' });

      if (testUser && alice) {
        testUser.friends.push({
          user: alice._id,
          status: 'accepted',
          createdAt: new Date()
        });

        alice.friends.push({
          user: testUser._id,
          status: 'accepted',
          createdAt: new Date()
        });

        await testUser.save();
        await alice.save();

        // Create a sample private chat between them
        const privateChat = new Chat({
          type: 'private',
          participants: [testUser._id, alice._id],
          messages: [
            {
              sender: testUser._id,
              content: 'Hi Alice! This is our private encrypted chat.',
              encrypted: true,
              createdAt: new Date()
            },
            {
              sender: alice._id,
              content: 'Hello! Yes, our messages are end-to-end encrypted here.',
              encrypted: true,
              createdAt: new Date(Date.now() + 1000)
            }
          ]
        });

        await privateChat.save();
        console.log('🔒 Created sample private chat');
      }

      console.log('✅ Database initialization complete!');

      return {
        success: true,
        message: 'Database initialized successfully with sample data',
        users: createdUsers.map(u => ({
          username: u.username,
          password: u.password,
          role: u.role
        }))
      };

    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      return { success: false, message: error.message };
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };
  }
}

export const dbManager = new DatabaseManager();