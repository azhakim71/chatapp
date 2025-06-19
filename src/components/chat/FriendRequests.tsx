import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Search, UserPlus, Check, X, Users } from 'lucide-react';

interface User {
  _id: string;
  username: string;
  isOnline: boolean;
}

interface Friend {
  user: User;
  status: 'pending' | 'accepted';
  createdAt: string;
}

interface Notification {
  _id: string;
  sender: {
    _id: string;
    username: string;
  };
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const FriendRequests: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchUsers, setSearchUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    fetchFriends();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchForUsers();
    } else {
      setSearchUsers([]);
    }
  }, [searchTerm]);

  const fetchFriends = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setFriends(userData.friends || []);
      }
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/users/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.filter((n: Notification) => n.type === 'friend_request'));
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const searchForUsers = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/search?query=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchUsers(data);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/users/friend-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Remove user from search results after sending request
        setSearchUsers(prev => prev.filter(u => u._id !== userId));
        fetchFriends(); // Refresh friends list
      }
    } catch (error) {
      console.error('Failed to send friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  const respondToFriendRequest = async (userId: string, action: 'accept' | 'reject') => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/users/friend-request/respond', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, action }),
      });

      if (response.ok) {
        fetchFriends();
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to respond to friend request:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptedFriends = friends.filter(f => f.status === 'accepted');
  const pendingRequests = notifications.filter(n => !n.read);

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
          <Users className="w-6 h-6 text-gray-400" />
        </div>

        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'friends'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Friends ({acceptedFriends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'requests'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Requests ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Add Friends
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'friends' && (
          <div className="space-y-4">
            {acceptedFriends.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No friends yet</p>
                <p className="text-sm text-gray-400">Start by searching for users to add as friends</p>
              </div>
            ) : (
              acceptedFriends.map((friend) => (
                <div key={friend.user._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {friend.user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900">{friend.user.username}</h3>
                      <p className={`text-sm ${friend.user.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                        {friend.user.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Friends since {new Date(friend.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No pending requests</p>
              </div>
            ) : (
              pendingRequests.map((notification) => (
                <div key={notification._id} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {notification.sender.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <h3 className="font-medium text-gray-900">{notification.sender.username}</h3>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => respondToFriendRequest(notification.sender._id, 'accept')}
                      disabled={loading}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => respondToFriendRequest(notification.sender._id, 'reject')}
                      disabled={loading}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for users by username..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-4">
              {searchTerm.length < 2 ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">Type at least 2 characters to search</p>
                </div>
              ) : searchUsers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No users found</p>
                </div>
              ) : (
                searchUsers.map((user) => {
                  const existingFriend = friends.find(f => f.user._id === user._id);
                  const isFriend = existingFriend?.status === 'accepted';
                  const hasPendingRequest = existingFriend?.status === 'pending';

                  return (
                    <div key={user._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <h3 className="font-medium text-gray-900">{user.username}</h3>
                          <p className={`text-sm ${user.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                            {user.isOnline ? 'Online' : 'Offline'}
                          </p>
                        </div>
                      </div>
                      <div>
                        {isFriend ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            Friends
                          </span>
                        ) : hasPendingRequest ? (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                            Pending
                          </span>
                        ) : (
                          <button
                            onClick={() => sendFriendRequest(user._id)}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendRequests;