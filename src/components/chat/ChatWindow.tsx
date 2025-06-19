import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { Send, Lock, Users, MoreVertical } from 'lucide-react';

interface Message {
  _id: string;
  sender: {
    _id: string;
    username: string;
  };
  content: string;
  encrypted: boolean;
  createdAt: string;
}

interface Chat {
  _id: string;
  type: 'private' | 'group';
  name?: string;
  participants: Array<{
    _id: string;
    username: string;
    isOnline: boolean;
  }>;
  messages: Message[];
}

interface ChatWindowProps {
  chatId: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatId }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, token } = useAuth();
  const { socket } = useSocket();

  useEffect(() => {
    fetchChat();
    fetchMessages();
  }, [chatId]);

  useEffect(() => {
    if (socket) {
      socket.emit('join_chat', chatId);

      socket.on('new_message', (data) => {
        if (data.chatId === chatId) {
          setMessages(prev => [...prev, data.message]);
        }
      });

      socket.on('user_typing', (data) => {
        setTyping(prev => {
          if (data.isTyping) {
            return prev.includes(data.username) ? prev : [...prev, data.username];
          } else {
            return prev.filter(username => username !== data.username);
          }
        });
      });

      return () => {
        socket.off('new_message');
        socket.off('user_typing');
      };
    }
  }, [socket, chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChat = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/chats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const chats = await response.json();
        const currentChat = chats.find((c: Chat) => c._id === chatId);
        setChat(currentChat);
      }
    } catch (error) {
      console.error('Failed to fetch chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/chats/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    socket.emit('send_message', {
      chatId,
      content: newMessage,
      encrypted: chat?.type !== 'public'
    });

    setNewMessage('');
  };

  const handleTyping = (isTyping: boolean) => {
    if (socket) {
      socket.emit('typing', { chatId, isTyping });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getChatTitle = () => {
    if (!chat) return 'Loading...';
    
    if (chat.type === 'group') {
      return chat.name || 'Group Chat';
    }
    
    const otherParticipant = chat.participants.find(p => p._id !== user?.id);
    return otherParticipant?.username || 'Unknown User';
  };

  const getParticipantStatus = () => {
    if (!chat) return '';
    
    if (chat.type === 'group') {
      const onlineCount = chat.participants.filter(p => p.isOnline).length;
      return `${chat.participants.length} members, ${onlineCount} online`;
    }
    
    const otherParticipant = chat.participants.find(p => p._id !== user?.id);
    return otherParticipant?.isOnline ? 'Online' : 'Offline';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading chat...</div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Chat not found</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {getChatTitle().charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900">{getChatTitle()}</h2>
              <p className="text-sm text-gray-500 flex items-center">
                {chat.type !== 'public' && <Lock className="w-3 h-3 mr-1" />}
                {getParticipantStatus()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {chat.type === 'group' && (
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                <Users className="w-5 h-5" />
              </button>
            )}
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex ${message.sender._id === user?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.sender._id === user?.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {chat.type === 'group' && message.sender._id !== user?.id && (
                <p className="text-xs font-medium mb-1 opacity-70">
                  {message.sender.username}
                </p>
              )}
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.sender._id === user?.id ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {new Date(message.createdAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
        
        {typing.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-2xl">
              <p className="text-sm text-gray-600">
                {typing.join(', ')} {typing.length === 1 ? 'is' : 'are'} typing...
              </p>
            </div>
          </div>
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
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping(e.target.value.length > 0);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                  handleTyping(false);
                }
              }}
              onBlur={() => handleTyping(false)}
              placeholder="Type a message..."
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => {
              sendMessage();
              handleTyping(false);
            }}
            disabled={!newMessage.trim()}
            className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;