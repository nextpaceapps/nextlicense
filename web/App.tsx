import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Plans } from './pages/Plans';
import { Licenses } from './pages/Licenses';
import { Simulator } from './pages/Simulator';
import { Login } from './pages/Login';
// Seed data removed - handled by backend if needed
import { AuthProvider, useAuth } from './contexts/AuthContext';
// Database connection check removed - API handles this

const AppContent = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-400">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'products': return <Products />;
      case 'plans': return <Plans />;
      case 'licenses': return <Licenses />;
      case 'simulator': return <Simulator />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
