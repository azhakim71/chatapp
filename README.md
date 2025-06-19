# SecureChat - End-to-End Encrypted Chat Application

A secure, real-time chat application with end-to-end encryption, built for XAMPP deployment.

## 🚀 Features

- **End-to-End Encryption**: RSA key exchange + AES message encryption
- **Real-time Messaging**: Socket.io powered chat
- **Friend System**: Send/accept friend requests
- **Group Chats**: Create encrypted group conversations
- **Public Chat**: Unencrypted public chat room
- **Admin Panel**: User management and broadcasting
- **XAMPP Compatible**: Easy deployment on local servers

## 📋 Requirements

- Node.js 16+ 
- MongoDB (Local or Atlas)
- XAMPP (optional, for local deployment)

## 🛠️ Installation

### Option 1: XAMPP Deployment

1. **Clone the repository** to your XAMPP htdocs folder:
   ```bash
   cd C:\xampp\htdocs
   git clone <repository-url> securechat
   cd securechat
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start MongoDB** (if using local MongoDB):
   - Start MongoDB service in XAMPP or separately

4. **Run the application**:
   ```bash
   npm run xampp
   ```

5. **Open your browser** and go to:
   ```
   http://localhost:3001
   ```

6. **Complete the database setup**:
   - The app will show a database setup screen
   - Enter your MongoDB connection string
   - Click "Test Connection" then "Connect"
   - Initialize the database with sample data

### Option 2: Development Mode

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd secure-chat-app
   npm install
   ```

2. **Run in development mode**:
   ```bash
   npm run dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## 🔧 Database Setup

The application includes an automatic database setup interface:

### MongoDB Connection Options:

1. **Local MongoDB (XAMPP)**:
   ```
   mongodb://localhost:27017/chatapp
   ```

2. **MongoDB Atlas**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/chatapp?retryWrites=true&w=majority
   ```

3. **Custom MongoDB**:
   ```
   mongodb://your-host:port/chatapp
   ```

### Sample Data Created:

The setup automatically creates:

- **Admin User**: `admin` / `admin123`
- **Test User 1**: `testuser` / `test123`  
- **Test User 2**: `alice` / `alice123`
- Sample chat data and friend relationships
- Public chat with welcome messages

## 👥 Default User Accounts

| Username | Password | Role | Access |
|----------|----------|------|--------|
| admin | admin123 | Administrator | Full admin panel access |
| testuser | test123 | Regular user | Standard chat features |
| alice | alice123 | Regular user | Standard chat features |

## 🔒 Security Features

- **RSA-2048** key pairs for each user
- **AES-256** encryption for messages
- **JWT** authentication with 7-day expiry
- **Bcrypt** password hashing (12 rounds)
- **End-to-end encryption** for private/group chats
- **Unencrypted public chat** (by design)

## 📱 Application Structure

```
src/
├── components/
│   ├── auth/          # Login/Register forms
│   ├── chat/          # Chat interface components
│   ├── admin/         # Admin panel
│   ├── setup/         # Database setup interface
│   └── ui/            # Reusable UI components
├── contexts/          # React contexts (Auth, Socket)
└── main.tsx          # Application entry point

server/
├── config/           # Database configuration
├── models/           # MongoDB schemas
├── routes/           # API endpoints
├── socket/           # Socket.io handlers
├── utils/            # Encryption utilities
└── index.js          # Server entry point
```

## 🌐 API Endpoints

### Setup Endpoints
- `POST /api/setup/test-connection` - Test database connection
- `POST /api/setup/connect` - Connect to database
- `POST /api/setup/initialize` - Initialize with sample data
- `GET /api/setup/status` - Get connection status

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### User Management
- `GET /api/users/profile` - Get user profile
- `GET /api/users/search` - Search users
- `POST /api/users/friend-request` - Send friend request
- `POST /api/users/friend-request/respond` - Accept/reject request

### Chat System
- `GET /api/chats` - Get user's chats
- `GET /api/chats/public` - Get public chat
- `POST /api/chats/private` - Create private chat
- `POST /api/chats/group` - Create group chat

### Admin Panel
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/stats` - Get platform statistics
- `POST /api/admin/broadcast` - Send broadcast notification

## 🔧 Configuration

### Environment Variables (.env)
```env
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
NODE_ENV=development
```

### MongoDB Connection
Set through the web interface or environment variable:
```env
MONGO_URI=mongodb://localhost:27017/chatapp
```

## 🚀 Deployment

### XAMPP Deployment
1. Copy files to `htdocs/securechat`
2. Install Node.js dependencies
3. Start MongoDB service
4. Run `npm run xampp`
5. Access via `http://localhost:3001`

### Production Deployment
1. Set production environment variables
2. Use a process manager (PM2)
3. Configure reverse proxy (Nginx)
4. Enable HTTPS
5. Use MongoDB Atlas for database

## 🛡️ Privacy & Security

- **Private messages** are end-to-end encrypted
- **Group chats** use shared encryption keys
- **Public chat** messages are not encrypted
- **Friend lists** are private
- **Admins cannot** view private messages
- **User data** is securely stored with encryption

## 🐛 Troubleshooting

### Common Issues:

1. **"Failed to fetch" errors**:
   - Check if server is running on port 3001
   - Verify CORS configuration
   - Ensure MongoDB is connected

2. **Database connection fails**:
   - Verify MongoDB is running
   - Check connection string format
   - Ensure network access (for Atlas)

3. **Socket connection issues**:
   - Check firewall settings
   - Verify port 3001 is accessible
   - Clear browser cache

### Debug Mode:
Enable detailed logging by setting:
```env
NODE_ENV=development
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the console logs
3. Verify database connection
4. Check network connectivity

---

**SecureChat** - Secure messaging made simple! 🔒💬