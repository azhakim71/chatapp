import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { X, Search, UserPlus, Users } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  isOnline: boolean;
}

interface CreateChatModalProps {
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

const CreateChatModal: React.FC<CreateChatModalProps> = ({ onClose, onChatCreated }) => {
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        const acceptedFriends = userData.friends
          .filter((friend: any) => friend.status === 'accepted')
          .map((friend: any) => friend.user);
        setFriends(acceptedFriends);
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

  const handleCreateChat = async () => {
    if (selectedFriends.length === 0) return;

    setLoading(true);
    try {
      if (isGroupChat && selectedFriends.length > 1) {
        // Create group chat
        const response = await fetch('http://localhost:3001/api/chats/group', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: groupName || 'New Group',
            participants: selectedFriends,
          }),
        });

        if (response.ok) {
          const chat = await response.json();
          onChatCreated(chat._id);
        }
      } else {
        // Create private chat
        const response = await fetch('http://localhost:3001/api/chats/private', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: selectedFriends[0],
          }),
        });

        if (response.ok) {
          const chat = await response.json();
          onChatCreated(chat._id);
        }
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">New Chat</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setIsGroupChat(false)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                !isGroupChat
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Private Chat
            </button>
            <button
              onClick={() => setIsGroupChat(true)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                isGroupChat
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Group Chat
            </button>
          </div>

          {isGroupChat && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Friends {isGroupChat ? `(${selectedFriends.length} selected)` : ''}
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search friends..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredFriends.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p>No friends found</p>
                </div>
              ) : (
                filteredFriends.map((friend) => (
                  <label
                    key={friend._id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type={isGroupChat ? 'checkbox' : 'radio'}
                      name="selectedFriends"
                      checked={selectedFriends.includes(friend._id)}
                      onChange={() => toggleFriendSelection(friend._id)}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {friend.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{friend.username}</p>
                        <p className={`text-xs ${friend.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                          {friend.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateChat}
              disabled={selectedFriends.length === 0 || loading}
              className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Chat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateChatModal;