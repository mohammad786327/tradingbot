import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Trash2, X, Clock, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationService } from '@/utils/NotificationService';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initial load
    updateState();

    // Listen for updates
    const handleUpdate = (e) => {
        setNotifications(e.detail);
        setUnreadCount(e.detail.filter(n => !n.read).length);
    };

    window.addEventListener('notification-update', handleUpdate);
    
    // Also listen for clicks outside to close
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
        window.removeEventListener('notification-update', handleUpdate);
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const updateState = () => {
    const all = notificationService.getAll();
    setNotifications(all);
    setUnreadCount(all.filter(n => !n.read).length);
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationService.clearAll();
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
        notificationService.markAsRead(notification.id);
    }
    
    // Navigate to relevant page if possible
    setIsOpen(false);
    
    // Mapping bot types to routes
    const routes = {
        'RSI Bot': '/rsi-bot',
        'Candle Strike Bot': '/candle-strike-bot',
        'Price Movement Bot': '/price-movement-bot',
        'Grid Bot': '/grid-trading',
        'DCA Bot': '/dca-trading'
    };

    if (routes[notification.botType]) {
        navigate(routes[notification.botType], { 
            state: { highlightId: notification.botId || null } 
        });
    }
  };

  const groupNotifications = (notifs) => {
      const groups = {
          'Today': [],
          'Yesterday': [],
          'Older': []
      };

      notifs.forEach(n => {
          const date = new Date(n.timestamp);
          if (isToday(date)) groups['Today'].push(n);
          else if (isYesterday(date)) groups['Yesterday'].push(n);
          else groups['Older'].push(n);
      });

      return groups;
  };

  const grouped = groupNotifications(notifications);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleOpen}
        className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-colors relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1a1a1a] shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[80vh]"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#2a2a2a] flex justify-between items-center bg-[#151515] shrink-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30 font-mono">
                            {unreadCount} New
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button 
                        onClick={handleMarkAllRead}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded transition-colors"
                        title="Mark all as read"
                    >
                        <CheckCheck size={16} />
                    </button>
                    <button 
                        onClick={handleClearAll}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-[#2a2a2a] rounded transition-colors"
                        title="Clear all"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto custom-scrollbar flex-1 bg-[#1a1a1a]">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-3">
                        <div className="w-12 h-12 bg-[#222] rounded-full flex items-center justify-center">
                            <Bell size={20} className="opacity-50" />
                        </div>
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : (
                    Object.entries(grouped).map(([label, group]) => (
                        group.length > 0 && (
                            <div key={label}>
                                <div className="px-4 py-1.5 bg-[#111] text-[10px] font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-10 border-y border-[#222]">
                                    {label}
                                </div>
                                <div>
                                    {group.map(notification => (
                                        <div 
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={cn(
                                                "p-4 border-b border-[#2a2a2a] hover:bg-[#202020] transition-colors cursor-pointer group relative",
                                                !notification.read ? "bg-[#1f1f1f]" : ""
                                            )}
                                        >
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={cn(
                                                            "w-2 h-2 rounded-full",
                                                            !notification.read ? "bg-purple-500" : "bg-transparent"
                                                        )} />
                                                        <span className={cn("text-xs font-bold uppercase tracking-wide", 
                                                            notification.botType === 'RSI Bot' ? "text-blue-400" :
                                                            notification.botType === 'Candle Strike Bot' ? "text-pink-400" :
                                                            "text-gray-400"
                                                        )}>
                                                            {notification.botType}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 ml-auto">
                                                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    
                                                    <p className={cn("text-sm font-medium mb-1 truncate", !notification.read ? "text-white" : "text-gray-300")}>
                                                        {notification.symbol} Activated {notification.side && <span className={notification.side === 'LONG' ? "text-green-500" : "text-red-500"}>({notification.side})</span>}
                                                    </p>
                                                    
                                                    <p className="text-xs text-gray-500 line-clamp-2">
                                                        Trigger: <span className="text-gray-400">{notification.triggerReason || 'Strategy conditions met'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <ExternalLink size={14} className="text-gray-500" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ))
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;