import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { NOTIFICATION_TYPES } from '@/utils/notificationTypes';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

const MAX_NOTIFICATIONS = 30;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    // Initial sample notification
    {
      id: 'init-1',
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'Welcome to CryptoBot',
      message: 'System is online and ready.',
      timestamp: new Date().toISOString(),
      read: false
    }
  ]);

  const addNotification = useCallback((type, title, message, metadata = {}) => {
    const newNotification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      title,
      message,
      metadata,
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      if (updated.length > MAX_NOTIFICATIONS) {
        return updated.slice(0, MAX_NOTIFICATIONS);
      }
      return updated;
    });

    return newNotification.id;
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
};