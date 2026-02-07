
import React, { useState, useEffect } from 'react';
import { Search, Settings, LogOut, User, Menu, Wallet } from 'lucide-react';
import { useAuth } from '@/context/FirebaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PingIndicator from '@/components/PingIndicator';
import NotificationCenter from '@/components/NotificationCenter';

const Header = ({ toggleSidebar, isSidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(navigator.onLine);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Real-time connectivity listeners
  useEffect(() => {
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-[#1a1a1a]/80 backdrop-blur-md border-b border-[#2a2a2a] px-4 flex items-center justify-between sticky top-0 z-30 transition-all duration-300">
      {/* Left: Logo & Toggle */}
      <div className="flex items-center gap-4">
        {/* Mobile Toggle */}
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors text-gray-400 hover:text-white lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Logo (Visible here since removed from Sidebar) */}
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="text-white font-bold text-lg">C</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent hidden sm:block">
              CryptoBot
            </h1>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-xl mx-4 hidden md:block">
        <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" size={18} />
            <input 
                type="text" 
                placeholder="Search markets, bots, or settings..." 
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] text-sm text-white rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
            />
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Ping Indicator */}
        <div className="hidden sm:block">
          <PingIndicator />
        </div>

        {/* Notification Center */}
        <div className="relative">
          <NotificationCenter />
        </div>

        {/* Profile */}
        <div className="relative">
            <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-1.5 hover:bg-[#2a2a2a] rounded-xl transition-all border border-transparent hover:border-[#3a3a3a]"
            >
                <div className="relative">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold shadow-inner overflow-hidden">
                        {user?.email?.[0].toUpperCase() || <User size={16} />}
                    </div>
                    
                    {/* Ping Indicator - Bottom Right */}
                    <div className="absolute -bottom-0.5 -right-0.5 z-10">
                        <span className="relative flex h-3 w-3">
                            {isConnected && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            )}
                            <span className={`relative inline-flex rounded-full h-3 w-3 border-2 border-[#1a1a1a] ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </span>
                    </div>
                </div>
                <div className="text-left hidden lg:block">
                    <p className="text-xs font-bold text-white leading-none mb-1">Trader</p>
                    <p className="text-[10px] text-gray-500 leading-none">{isConnected ? 'Online' : 'Offline'}</p>
                </div>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isProfileOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsProfileOpen(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-xl overflow-hidden z-50 py-1"
                        >
                            <div className="px-4 py-3 border-b border-[#2a2a2a]">
                                <p className="text-sm font-bold text-white truncate">{user?.email}</p>
                                <p className="text-xs text-gray-500">Free Plan</p>
                            </div>
                            
                            <button 
                                onClick={() => { navigate('/exchange-accounts'); setIsProfileOpen(false); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#252525] flex items-center gap-2 transition-colors"
                            >
                                <Wallet size={16} />
                                My Exchange Accounts
                            </button>

                            <button 
                                onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#252525] flex items-center gap-2 transition-colors"
                            >
                                <Settings size={16} />
                                Settings
                            </button>
                            
                            <div className="h-px bg-[#2a2a2a] my-1"></div>
                            
                            <button 
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
