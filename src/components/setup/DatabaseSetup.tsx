import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertCircle, Loader, Server, Users, Key } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';

interface DatabaseSetupProps {
  onSetupComplete: () => void;
}

interface SampleUser {
  username: string;
  password: string;
  role: string;
}

const DatabaseSetup: React.FC<DatabaseSetupProps> = ({ onSetupComplete }) => {
  const [step, setStep] = useState<'connection' | 'initialize' | 'complete'>('connection');
  const [mongoUri, setMongoUri] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sampleUsers, setSampleUsers] = useState<SampleUser[]>([]);
  const [connectionTested, setConnectionTested] = useState(false);

  // Check if database is already connected
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/setup/status');
      const data = await response.json();
      
      if (data.success && data.status.connected) {
        setStep('complete');
        setSuccess('Database is already connected and configured');
      }
    } catch (error) {
      // Database not connected, show setup
    }
  };

  const testConnection = async () => {
    if (!mongoUri.trim()) {
      setError('Please enter a MongoDB URI');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:3001/api/setup/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mongoUri }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Connection test successful!');
        setConnectionTested(true);
      } else {
        setError(data.message || 'Connection test failed');
        setConnectionTested(false);
      }
    } catch (error) {
      setError('Failed to test connection');
      setConnectionTested(false);
    } finally {
      setLoading(false);
    }
  };

  const connectDatabase = async () => {
    if (!connectionTested) {
      setError('Please test the connection first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/setup/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mongoUri }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Database connected successfully!');
        setStep('initialize');
      } else {
        setError(data.message || 'Failed to connect to database');
      }
    } catch (error) {
      setError('Failed to connect to database');
    } finally {
      setLoading(false);
    }
  };

  const initializeDatabase = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/setup/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Database initialized with sample data!');
        setSampleUsers(data.users || []);
        setStep('complete');
        
        // Auto-redirect after 3 seconds
        setTimeout(() => {
          onSetupComplete();
        }, 3000);
      } else {
        setError(data.message || 'Failed to initialize database');
      }
    } catch (error) {
      setError('Failed to initialize database');
    } finally {
      setLoading(false);
    }
  };

  const getPresetConnections = () => [
    {
      name: 'XAMPP Local MongoDB',
      uri: 'mongodb://localhost:27017/chatapp'
    },
    {
      name: 'MongoDB Atlas (Sample)',
      uri: 'mongodb+srv://username:password@cluster.mongodb.net/chatapp?retryWrites=true&w=majority'
    },
    {
      name: 'Local MongoDB (Default)',
      uri: 'mongodb://127.0.0.1:27017/chatapp'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
              <Database className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Setup</h1>
            <p className="text-gray-600">Configure your MongoDB connection for SecureChat</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === 'connection' ? 'bg-blue-500 text-white' : 
                step === 'initialize' || step === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-300'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${
                step === 'initialize' || step === 'complete' ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === 'initialize' ? 'bg-blue-500 text-white' : 
                step === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-300'
              }`}>
                2
              </div>
              <div className={`w-16 h-1 ${
                step === 'complete' ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-300'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Step 1: Database Connection */}
          {step === 'connection' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Database Connection</h2>
                
                {/* Preset Connections */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Setup (Click to use)
                  </label>
                  <div className="space-y-2">
                    {getPresetConnections().map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => setMongoUri(preset.uri)}
                        className="w-full text-left p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{preset.name}</div>
                        <div className="text-sm text-gray-500 font-mono">{preset.uri}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MongoDB Connection URI
                  </label>
                  <textarea
                    value={mongoUri}
                    onChange={(e) => {
                      setMongoUri(e.target.value);
                      setConnectionTested(false);
                      setError('');
                      setSuccess('');
                    }}
                    placeholder="mongodb://localhost:27017/chatapp"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For XAMPP: mongodb://localhost:27017/chatapp
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={testConnection}
                    disabled={loading || !mongoUri.trim()}
                    className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <Server className="w-5 h-5 mr-2" />
                        Test Connection
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={connectDatabase}
                    disabled={!connectionTested || loading}
                    className="flex-1 py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <Database className="w-5 h-5 mr-2" />
                    Connect
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Initialize Database */}
          {step === 'initialize' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 2: Initialize Database</h2>
                <p className="text-gray-600 mb-6">
                  This will create the necessary collections and add sample data including admin and test users.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-blue-900 mb-2">What will be created:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Database collections (users, chats, notifications)</li>
                    <li>• Admin user (username: admin, password: admin123)</li>
                    <li>• Test users (testuser/test123, alice/alice123)</li>
                    <li>• Sample chat data and friend relationships</li>
                    <li>• Encryption keys for all users</li>
                  </ul>
                </div>

                <button
                  onClick={initializeDatabase}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Users className="w-5 h-5 mr-2" />
                      Initialize Database
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Setup Complete!</h2>
                <p className="text-gray-600">Your database has been configured successfully.</p>
              </div>

              {sampleUsers.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="font-medium text-green-900 mb-4 flex items-center">
                    <Key className="w-5 h-5 mr-2" />
                    Sample User Accounts
                  </h3>
                  <div className="space-y-3">
                    {sampleUsers.map((user, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium text-gray-900">{user.username}</span>
                            <span className="ml-2 text-sm text-gray-500">({user.role})</span>
                          </div>
                          <div className="text-sm font-mono text-gray-600">
                            Password: {user.password}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={onSetupComplete}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
              >
                Continue to Application
              </button>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-green-600 text-sm">{success}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetup;