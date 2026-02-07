
/**
 * NotificationService Utility
 * Manages creation, storage, and retrieval of bot activation notifications.
 */

const STORAGE_KEY = 'botNotifications';
const MAX_HISTORY = 100;

class NotificationService {
  constructor() {
    this.notifications = this.loadNotifications();
  }

  loadNotifications() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load notifications:', e);
      return [];
    }
  }

  saveNotifications() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (e) {
      console.error('Failed to save notifications:', e);
    }
  }

  /**
   * Create a new notification
   * @param {Object} data - { botType, botName, symbol, side, exchange, timeframe, triggerReason, status }
   */
  createNotification(data) {
    const notification = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: new Date().toISOString(),
      read: false,
      ...data
    };

    // Add to beginning of array
    this.notifications.unshift(notification);

    // Limit history
    if (this.notifications.length > MAX_HISTORY) {
      this.notifications = this.notifications.slice(0, MAX_HISTORY);
    }

    this.saveNotifications();
    
    // Dispatch custom event for real-time UI updates
    window.dispatchEvent(new CustomEvent('notification-update', { detail: this.notifications }));

    return notification;
  }

  getAll() {
    return this.notifications;
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  markAsRead(id) {
    this.notifications = this.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.saveNotifications();
    window.dispatchEvent(new CustomEvent('notification-update', { detail: this.notifications }));
  }

  markAllAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.saveNotifications();
    window.dispatchEvent(new CustomEvent('notification-update', { detail: this.notifications }));
  }

  clearAll() {
    this.notifications = [];
    this.saveNotifications();
    window.dispatchEvent(new CustomEvent('notification-update', { detail: this.notifications }));
  }
}

export const notificationService = new NotificationService();
