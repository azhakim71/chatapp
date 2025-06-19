import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { Send, Globe, Users } from 'lucide-react';

interface Message {
  _id: string;
  sender: {
    _id: string;
    username: string;
  };
  content: string;
  createdAt: string;
}

const PublicChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, token } = useAuth();
  const { socket } = useSocket();

  useEffect(() => {
    fetchPublicChat();
  }, []);

  useEffect(() => {
    if (socket) {
      // Join public chat room
      socket.emit('join_chat', 'public');

      socket.on('new_message', (data) => {
        if (data.chatId === 'public' || !data.chatId) {
          setMessages(prev => [...prev, data.message]);
        }
      });

      return () => {
        socket.off('new_message');
      };
    }
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchPublicChat = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/chats/public', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const chat = await response.json();
        setMessages(chat.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch public chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    socket.emit('send_message', {
      chatId: 'public',
      content: newMessage,
      encrypted: false
    });

    setNewMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading public chat...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900">Public Chat</h2>
              <p className="text-sm text-gray-600 flex items-center">
                <Users className="w-3 h-3 mr-1" />
                Open to all users • Messages are not encrypted
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400">Be the first to start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const showAvatar = index === 0 || messages[index - 1].sender._id !== message.sender._id;
            const isOwn = message.sender._id === user?.id;

            return (
              <div
                key={message._id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end max-w-xs lg:max-w-md`}>
                  {showAvatar && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                      isOwn 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 ml-2' 
                        : 'bg-gradient-to-r from-green-500 to-blue-500 mr-2'
                    }`}>
                      {message.sender.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div className={`px-4 py-2 rounded-2xl ${
                    isOwn
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                  } ${!showAvatar ? (isOwn ? 'mr-10' : 'ml-10') : ''}`}>
                    {!isOwn && showAvatar && (
                      <p className="text-xs font-medium mb-1 text-gray-600">
                        {message.sender.username}
                      </p>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isOwn ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-4 py-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
              placeholder="Send a message to everyone..."
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="p-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-full hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            ⚠️ Messages in public chat are visible to all users and not encrypted
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicChat;