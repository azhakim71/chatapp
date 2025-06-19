import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Shield, Key, Clock, CheckCircle } from 'lucide-react';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [showPublicKey, setShowPublicKey] = useState(false);

  return (
    <div className="h-full bg-white overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">
              {user?.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{user?.username}</h1>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-green-600 font-medium">Online</span>
          </div>
          {user?.isAdmin && (
            <div className="mt-3 inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              <Shield className="w-4 h-4 mr-1" />
              Administrator
            </div>
          )}
        </div>

        {/* Profile Information */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Account Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Username:</span>
                <span className="font-medium text-gray-900">{user?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Type:</span>
                <span className="font-medium text-gray-900">
                  {user?.isAdmin ? 'Administrator' : 'User'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Member Since:</span>
                <span className="font-medium text-gray-900">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Security Information */}
          <div className="bg-green-50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-600" />
              Security & Encryption
            </h2>
            <div className="space-y-4">
              <div className="flex items-center text-green-700">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>End-to-end encryption enabled</span>
              </div>
              <div className="flex items-center text-green-700">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>RSA-2048 key pair generated</span>
              </div>
              <div className="flex items-center text-green-700">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>AES-256 message encryption</span>
              </div>
              <div className="flex items-center text-green-700">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>JWT authentication active</span>
              </div>
            </div>
          </div>

          {/* Public Key */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Key className="w-5 h-5 mr-2 text-blue-600" />
              Public Key
            </h2>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Your public key is used by other users to encrypt messages sent to you.
              </p>
              <button
                onClick={() => setShowPublicKey(!showPublicKey)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                {showPublicKey ? 'Hide Public Key' : 'Show Public Key'}
              </button>
              {showPublicKey && (
                <div className="mt-3">
                  <textarea
                    value={user?.publicKey || ''}
                    readOnly
                    className="w-full h-32 p-3 bg-white border border-gray-300 rounded-lg text-xs font-mono text-gray-700 resize-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Privacy Notice</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Private messages are end-to-end encrypted</li>
              <li>• Group chats use shared encryption keys</li>
              <li>• Public chat messages are not encrypted</li>
              <li>• Your friend list is private and not visible to others</li>
              <li>• Only administrators can see the user list (usernames only)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;