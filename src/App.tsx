import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ChatDashboard from './components/chat/ChatDashboard';
import AdminPanel from './components/admin/AdminPanel';
import DatabaseSetup from './components/setup/DatabaseSetup';
import LoadingSpinner from './components/ui/LoadingSpinner';

function AppContent() {
  const { user, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    checkDatabaseSetup();
  }, []);

  const checkDatabaseSetup = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/setup/status');
      const data = await response.json();
      
      if (!data.success || !data.status.connected) {
        setSetupRequired(true);
      }
    } catch (error) {
      // If setup endpoint fails, assume setup is required
      setSetupRequired(true);
    } finally {
      setCheckingSetup(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Checking system status...</p>
        </div>
      </div>
    );
  }

  if (setupRequired) {
    return <DatabaseSetup onSetupComplete={() => setSetupRequired(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {showRegister ? (
            <RegisterForm onToggleMode={() => setShowRegister(false)} />
          ) : (
            <LoginForm onToggleMode={() => setShowRegister(true)} />
          )}
        </div>
      </div>
    );
  }

  if (showAdmin && user.isAdmin) {
    return <AdminPanel onClose={() => setShowAdmin(false)} />;
  }

  return (
    <SocketProvider>
      <ChatDashboard 
        onShowAdmin={user.isAdmin ? () => setShowAdmin(true) : undefined}
      />
    </SocketProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;