import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical, Edit2, Trash2, RefreshCw, CheckCircle, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExchangeAccounts } from '@/context/ExchangeAccountsContext';

const ExchangeLogo = ({ exchange }) => {
  const name = exchange?.toLowerCase() || '';

  // Binance Logo (Yellow/Gold)
  if (name.includes('binance')) {
    return (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0L20.8 4.8L16 9.6L11.2 4.8L16 0ZM4.8 11.2L9.6 16L4.8 20.8L0 16L4.8 11.2ZM27.2 11.2L32 16L27.2 20.8L22.4 16L27.2 11.2ZM16 22.4L20.8 27.2L16 32L11.2 27.2L16 22.4ZM16 13.4L18.6 16L16 18.6L13.4 16L16 13.4Z" fill="#F0B90B"/>
      </svg>
    );
  }

  // Coinbase Logo (Blue)
  if (name.includes('coinbase')) {
    return (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z" fill="#0052FF"/>
        <path d="M16 22.5C19.5899 22.5 22.5 19.5899 22.5 16C22.5 12.4101 19.5899 9.5 16 9.5C12.4101 9.5 9.5 12.4101 9.5 16C9.5 19.5899 12.4101 22.5 16 22.5Z" fill="white"/>
      </svg>
    );
  }

  // Kraken Logo (Purple)
  if (name.includes('kraken')) {
    return (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 32C24.837 32 32 24.837 32 16C32 7.163 24.837 0 16 0C7.163 0 0 7.163 0 16C0 24.837 7.163 32 16 32Z" fill="#5741D9"/>
        <path d="M16.94 9.17H14.98V15.53L10.48 11.03L9.07 12.44L14.33 17.7C13.88 18.27 13.2 18.63 12.43 18.63H9.41V20.63H12.43C13.98 20.63 15.31 19.82 16 18.63C16.69 19.82 18.02 20.63 19.57 20.63H22.59V18.63H19.57C18.8 18.63 18.12 18.27 17.67 17.7L22.93 12.44L21.52 11.03L16.94 15.61V9.17Z" fill="white"/>
      </svg>
    );
  }

  // OKX (Black/White check pattern style simplified)
  if (name.includes('okx')) {
    return (
        <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="16" fill="white"/>
            <path d="M9 9H14V14H9V9Z" fill="black"/>
            <path d="M18 9H23V14H18V9Z" fill="black"/>
            <path d="M9 18H14V23H9V18Z" fill="black"/>
            <path d="M18 18H23V23H18V18Z" fill="black"/>
            <path d="M14 14H18V18H14V14Z" fill="black"/>
        </svg>
    );
  }

  // Bybit (Yellow/Black)
  if (name.includes('bybit')) {
    return (
        <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="16" fill="#17181E"/>
            <path d="M16 6L24.6603 11V21L16 26L7.33975 21V11L16 6Z" fill="#F7A600"/>
            <path d="M16 9L21.1962 12V18L16 21L10.8038 18V12L16 9Z" fill="#17181E"/>
            <path d="M16 12L18.5981 13.5V16.5L16 18L13.4019 16.5V13.5L16 12Z" fill="#F7A600"/>
        </svg>
    );
  }
  
  // KuCoin (Green)
  if (name.includes('kucoin')) {
    return (
      <svg viewBox="0 0 32 32" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
         <circle cx="16" cy="16" r="16" fill="#24AE8F"/>
         <path d="M16.0001 6.5L24.2274 11.25V20.75L16.0001 25.5L7.77283 20.75V11.25L16.0001 6.5Z" stroke="white" strokeWidth="2.5"/>
         <path d="M16 12L19.4641 14V18L16 20L12.5359 18V14L16 12Z" fill="white"/>
      </svg>
    );
  }

  // Fallback for unknown
  return <span className="font-bold text-lg text-gray-300">{exchange.charAt(0)}</span>;
};


const ExchangeAccountCard = ({ account, onEdit, onDelete, onTest }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const getStatusConfig = (status) => {
      switch(status) {
          case 'connected': return { color: 'bg-green-500', text: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle, label: 'Connected' };
          case 'error': return { color: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-500/10', icon: AlertTriangle, label: 'Error' };
          default: return { color: 'bg-yellow-500', text: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: WifiOff, label: 'Disconnected' };
      }
  };

  const statusConfig = getStatusConfig(account.status);
  const StatusIcon = statusConfig.icon;

  const handleTest = async () => {
    setIsTesting(true);
    try {
        await onTest(account.id);
    } catch(e) {
        // Error handled in parent/context
    } finally {
        setIsTesting(false);
        setIsMenuOpen(false);
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02, y: -4, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)" }}
      className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 relative group overflow-hidden shadow-lg transition-all duration-300"
    >
        {/* Gradient Header Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80"></div>

        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#252525] flex items-center justify-center border border-[#333] overflow-hidden shrink-0">
                    <ExchangeLogo exchange={account.exchange} />
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg leading-tight">{account.name}</h3>
                    <p className="text-xs text-gray-400">{account.exchange}</p>
                </div>
            </div>
            
            {/* Action Menu */}
            <div className="relative">
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors"
                >
                    <MoreVertical size={18} />
                </button>
                
                {isMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                        <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute right-0 mt-2 w-48 bg-[#252525] border border-[#3a3a3a] rounded-xl shadow-xl z-20 overflow-hidden py-1"
                        >
                            <button 
                                onClick={() => { onEdit(account); setIsMenuOpen(false); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#333] flex items-center gap-2"
                            >
                                <Edit2 size={14} /> Edit Details
                            </button>
                            <button 
                                onClick={handleTest}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[#333] flex items-center gap-2"
                            >
                                <RefreshCw size={14} className={isTesting ? "animate-spin" : ""} /> 
                                {isTesting ? "Testing..." : "Test Connection"}
                            </button>
                            <div className="h-px bg-[#3a3a3a] my-1"></div>
                            <button 
                                onClick={() => { onDelete(account.id); setIsMenuOpen(false); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2"
                            >
                                <Trash2 size={14} /> Delete Account
                            </button>
                        </motion.div>
                    </>
                )}
            </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between mt-6">
            <div className={cn("px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border border-transparent", statusConfig.bg, statusConfig.text)}>
                <StatusIcon size={12} />
                {statusConfig.label}
            </div>
            <p className="text-[10px] text-gray-500 font-mono">
               Synced: {getTimeAgo(account.lastSynced)}
            </p>
        </div>

        {/* Masked Key Preview */}
        <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">API Key</p>
            <div className="flex items-center gap-1">
                <span className="text-gray-600 text-sm">•••• •••• ••••</span>
                <span className="text-gray-400 text-xs font-mono">{account.apiKey.slice(-4)}</span>
            </div>
        </div>
        
        {/* Quick Actions (visible on hover/desktop) */}
        <div className="flex gap-2 mt-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
             <button 
                onClick={handleTest}
                className="flex-1 py-2 bg-[#252525] hover:bg-[#333] border border-[#3a3a3a] rounded-lg text-xs font-medium text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-1"
             >
                {isTesting ? <RefreshCw size={12} className="animate-spin" /> : <Wifi size={12} />}
                Test
             </button>
             <button 
                onClick={() => onEdit(account)}
                className="flex-1 py-2 bg-[#252525] hover:bg-[#333] border border-[#3a3a3a] rounded-lg text-xs font-medium text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-1"
             >
                <Edit2 size={12} />
                Edit
             </button>
        </div>
    </motion.div>
  );
};

export default ExchangeAccountCard;