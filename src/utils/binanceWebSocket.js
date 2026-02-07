class BinanceWebSocketService {
  constructor() {
    this.connections = new Map(); // streamId -> WebSocket
    this.subscribers = new Map(); // streamId -> Map<subId, callback>
    this.reconnectTimers = new Map();
    this.reconnectAttempts = new Map();
    this.MAX_RECONNECT_ATTEMPTS = 5;
    this.BASE_RECONNECT_DELAY = 1000; // 1 second
  }

  subscribe(symbols, type, timeframe, callback) {
    if (!symbols || symbols.length === 0 || !callback) return null;

    try {
      const streams = symbols.map(symbol => {
        const symbolLower = symbol.toLowerCase();
        if (type === 'kline') {
          return `${symbolLower}@kline_${timeframe}`;
        }
        return `${symbolLower}@ticker`;
      });

      const streamId = streams.join('/');
      const subId = Date.now().toString(36) + Math.random().toString(36).substr(2);

      if (!this.subscribers.has(streamId)) {
        this.subscribers.set(streamId, new Map());
      }

      this.subscribers.get(streamId).set(subId, callback);

      if (!this.connections.has(streamId)) {
        this.connect(streamId);
      } else {
        const ws = this.connections.get(streamId);
        if (ws && (ws.readyState !== WebSocket.OPEN && ws.readyState !== WebSocket.CONNECTING)) {
          this.connect(streamId);
        }
      }

      return { streamId, subId };
    } catch (error) {
      console.error('[BinanceWS] Subscribe error:', error);
      return null;
    }
  }

  unsubscribe(subscription) {
    if (!subscription || !subscription.streamId || !subscription.subId) return;
    const { streamId, subId } = subscription;

    try {
      if (this.subscribers.has(streamId)) {
        const streamSubs = this.subscribers.get(streamId);
        if (streamSubs) {
            streamSubs.delete(subId);

            if (streamSubs.size === 0) {
              this.subscribers.delete(streamId);
              this.closeConnection(streamId);
            }
        }
      }
    } catch (error) {
      console.error('[BinanceWS] Unsubscribe error:', error);
    }
  }

  connect(streamId) {
    if (this.reconnectTimers.has(streamId)) {
      clearTimeout(this.reconnectTimers.get(streamId));
      this.reconnectTimers.delete(streamId);
    }

    const wsUrl = `wss://fstream.binance.com/stream?streams=${streamId}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        // console.log(`[BinanceWS] Connected: ${streamId}`);
        this.reconnectAttempts.set(streamId, 0); 
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.data && this.subscribers.has(streamId)) {
            const streamSubs = this.subscribers.get(streamId);
            if (streamSubs) {
                streamSubs.forEach(callback => {
                if (typeof callback === 'function') {
                    try {
                        callback(payload.data);
                    } catch (cbError) {
                        console.error('[BinanceWS] Error in subscriber callback:', cbError);
                    }
                }
                });
            }
          }
        } catch (error) {
          // console.error('[BinanceWS] Message parse error:', error);
        }
      };

      ws.onerror = (event) => {
        console.warn(`[BinanceWS] Error for ${streamId}`);
      };

      ws.onclose = (event) => {
        this.connections.delete(streamId);
        if (this.subscribers.has(streamId)) {
          this.attemptReconnect(streamId);
        }
      };

      this.connections.set(streamId, ws);
    } catch (error) {
      console.error(`[BinanceWS] Connection failed for ${streamId}:`, error);
      this.attemptReconnect(streamId);
    }
  }

  attemptReconnect(streamId) {
    const attempts = this.reconnectAttempts.get(streamId) || 0;

    if (attempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.warn(`[BinanceWS] Max reconnect attempts reached for ${streamId}`);
      return;
    }

    const delay = this.BASE_RECONNECT_DELAY * Math.pow(2, attempts);
    
    const timerId = setTimeout(() => {
      this.reconnectAttempts.set(streamId, attempts + 1);
      this.connect(streamId);
    }, delay);

    this.reconnectTimers.set(streamId, timerId);
  }

  closeConnection(streamId) {
    if (this.reconnectTimers.has(streamId)) {
      clearTimeout(this.reconnectTimers.get(streamId));
      this.reconnectTimers.delete(streamId);
    }

    const ws = this.connections.get(streamId);
    if (ws) {
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      try { ws.close(); } catch(e){}
      this.connections.delete(streamId);
    }
    this.reconnectAttempts.delete(streamId);
  }

  unsubscribeAll() {
    try {
      this.reconnectTimers.forEach(timer => clearTimeout(timer));
      this.reconnectTimers.clear();
      
      this.connections.forEach((ws) => {
        ws.onclose = null;
        try { ws.close(); } catch(e){}
      });
      this.connections.clear();
      this.subscribers.clear();
      this.reconnectAttempts.clear();
    } catch (error) {
      console.error('[BinanceWS] Error during unsubscribeAll:', error);
    }
  }
}

export const binanceWS = new BinanceWebSocketService();