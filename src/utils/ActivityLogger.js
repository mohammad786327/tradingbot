
const LOG_KEY = 'activity_log_events';

class ActivityLogger {
  constructor() {
    this.listeners = new Set();
  }

  log(type, title, description, metadata = {}) {
    const event = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type, // 'BOT_CREATED', 'POSITION_TRIGGER', 'ALERT', 'NOTIFICATION', 'SYSTEM'
      title,
      description,
      metadata,
      read: false
    };

    const existing = this.getRecentEvents(100);
    const updated = [event, ...existing].slice(0, 100); // Keep last 100

    try {
        localStorage.setItem(LOG_KEY, JSON.stringify(updated));
        this.notifyListeners(updated);
    } catch (e) {
        console.error('Failed to log event', e);
    }

    return event;
  }

  getRecentEvents(limit = 20) {
    try {
      const stored = localStorage.getItem(LOG_KEY);
      const events = stored ? JSON.parse(stored) : [];
      return events.slice(0, limit);
    } catch (e) {
      return [];
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(events) {
    this.listeners.forEach(cb => cb(events));
  }
  
  clear() {
      localStorage.removeItem(LOG_KEY);
      this.notifyListeners([]);
  }
}

export const activityLogger = new ActivityLogger();
