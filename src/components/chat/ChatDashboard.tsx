import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import FriendRequests from './FriendRequests';
import PublicChat from './PublicChat';
import UserProfile from './UserProfile';
import { MessageSquare, Users, Globe, UserCircle, Settings, LogOut } from 'lucide-react';

interface ChatDashboardProps {
  onShowAdmin?: () => void;
}

type ActiveView = 'chats' | 'friends' | 'public' | 'profile';

const ChatDashboard: React.FC<ChatDashboardProps> = ({ onShowAdmin }) => {
  const [activeView, setActiveView] = useState<ActiveView>('chats');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  const menuItems = [
    { id: 'chats' as ActiveView, label: 'Chats', icon: MessageSquare },
    { id: 'friends' as ActiveView, label: 'Friends', icon: Users },
    { id: 'public' as ActiveView, label: 'Public', icon: Globe },
    { id: 'profile' as ActiveView, label: 'Profile', icon: UserCircle },
  ];

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <div className="w-16 lg:w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="ml-3 font-semibold text-gray-900 hidden lg:block">SecureChat</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveView(item.id);
                      setSelectedChat(null);
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                      activeView === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="ml-3 hidden lg:block">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="ml-2 text-sm text-gray-600 hidden lg:block">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            {user?.isAdmin && onShowAdmin && (
              <button
                onClick={onShowAdmin}
                className="w-full flex items-center px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="ml-3 hidden lg:block">Admin</span>
              </button>
            )}
            
            <button
              onClick={logout}
              className="w-full flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="ml-3 hidden lg:block">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {activeView === 'chats' && (
          <>
            <Sidebar
              onSelectChat={(chatId) => setSelectedChat(chatId)}
              selectedChat={selectedChat}
            />
            <div className="flex-1">
              {selectedChat ? (
                <ChatWindow chatId={selectedChat} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a chat to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeView === 'friends' && (
          <div className="flex-1">
            <FriendRequests />
          </div>
        )}

        {activeView === 'public' && (
          <div className="flex-1">
            <PublicChat />
          </div>
        )}

        {activeView === 'profile' && (
          <div className="flex-1">
            <UserProfile />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDashboard;