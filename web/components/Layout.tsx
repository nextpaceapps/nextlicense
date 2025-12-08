import React from 'react';
import { LayoutDashboard, Package, Layers, Key, Zap, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'plans', label: 'Plans', icon: Layers },
    { id: 'licenses', label: 'Licenses', icon: Key },
    { id: 'simulator', label: 'API Simulator', icon: Zap },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
            <Key className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold text-gray-800">LicenseMgr</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-100">
           {user && (
             <div className="flex items-center gap-3 mb-4">
                <img 
                  src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full bg-gray-200"
                />
                <div className="flex-1 min-w-0">
                   <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                   <p className="text-xs text-gray-500 truncate flex items-center">
                     {user.role === 'ADMIN' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>}
                     {user.role}
                   </p>
                </div>
             </div>
           )}
           
           <button 
             onClick={logout}
             className="w-full flex items-center justify-center px-4 py-2 border border-gray-200 rounded-lg shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
           >
              <LogOut className="w-3 h-3 mr-2" /> Sign Out
           </button>
        </div>

        <div className="p-4 pt-0">
           <div className="rounded p-3 text-xs border bg-indigo-50 border-indigo-100 text-indigo-700">
              <p className="font-semibold mb-1">Database:</p>
              <p className="flex items-center">
                 <span className="w-2 h-2 rounded-full mr-2 bg-indigo-500"></span>
                 Cloud Firestore
              </p>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="max-w-7xl mx-auto py-8 px-6">
          {children}
        </div>
      </main>
    </div>
  );
};
