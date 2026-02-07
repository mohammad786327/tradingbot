
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const BotActivationToast = () => {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const handleNewNotification = (e) => {
      // Only show toast for new notifications added to top of list
      const latest = e.detail[0];
      // Simple check to ensure we don't spam toasts for old loaded data if full list dispatched
      if (latest && new Date(latest.timestamp).getTime() > Date.now() - 2000) {
        addToast(latest);
      }
    };

    window.addEventListener('notification-update', handleNewNotification);
    return () => window.removeEventListener('notification-update', handleNewNotification);
  }, []);

  const addToast = (notification) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, ...notification }]);
    
    // Auto dismiss
    setTimeout(() => {
      removeToast(id);
    }, 8000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleToastClick = (toast) => {
      removeToast(toast.id);
      
      const routes = {
        'RSI Bot': '/rsi-bot',
        'Candle Strike Bot': '/candle-strike-bot',
        'Price Movement Bot': '/price-movement-bot',
        'Grid Bot': '/grid-trading',
        'DCA Bot': '/dca-trading'
      };

      if (routes[toast.botType]) {
        navigate(routes[toast.botType]);
      }
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            layout
            className="pointer-events-auto w-80 bg-[#151515]/95 backdrop-blur-md border border-green-500/30 rounded-xl shadow-2xl overflow-hidden cursor-pointer group"
            onClick={() => handleToastClick(toast)}
          >
            {/* Progress bar */}
            <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 8, ease: "linear" }}
                className="h-1 bg-gradient-to-r from-green-500 to-emerald-400"
            />
            
            <div className="p-4 flex gap-3">
                {/* Icon */}
                <div className="shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 animate-pulse border border-green-500/30">
                    <Zap size={20} fill="currentColor" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white text-sm">Bot Triggered!</h4>
                        <span className="text-[10px] font-mono text-gray-500">Just now</span>
                    </div>
                    
                    <p className="text-xs text-gray-300 mt-1 font-medium truncate">
                        {toast.botName || toast.botType}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                         <span className="font-bold text-sm text-white">{toast.symbol}</span>
                         {toast.side && (
                             <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", 
                                toast.side === 'LONG' ? "text-green-400 border-green-500/30 bg-green-500/10" : "text-red-400 border-red-500/30 bg-red-500/10"
                             )}>
                                 {toast.side}
                             </span>
                         )}
                    </div>

                    <div className="mt-2 text-[10px] text-gray-400 bg-white/5 p-1.5 rounded border border-white/5">
                        Trigger: <span className="text-gray-300 font-mono">{toast.triggerReason || 'Target Reached'}</span>
                    </div>
                </div>

                {/* Close Button */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        removeToast(toast.id);
                    }}
                    className="shrink-0 text-gray-500 hover:text-white transition-colors self-start -mt-1 -mr-1 p-1"
                >
                    <X size={14} />
                </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default BotActivationToast;
