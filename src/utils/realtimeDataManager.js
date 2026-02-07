import { binanceWS } from './binanceWebSocket';

class RealtimeDataManager {
  constructor() {
    this.subscribers = new Map();
    this.priceCache = new Map();
    this.connection = null;
  }

  subscribe(symbols, callback) {
    // Wrapper around binanceWS to manage multiple components needing same data
    const subscription = binanceWS.subscribe(symbols, 'ticker', '1s', (data) => {
      if (data.e === '24hrTicker') {
        const price = parseFloat(data.c);
        const change = parseFloat(data.P);
        this.priceCache.set(data.s, { price, change });
        callback({ symbol: data.s, price, change, data });
      }
    });
    return subscription;
  }

  unsubscribe(subscription) {
    if (subscription) {
      binanceWS.unsubscribe(subscription);
    }
  }

  getCachedPrice(symbol) {
    return this.priceCache.get(symbol);
  }
}

export const realtimeManager = new RealtimeDataManager();