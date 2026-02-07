// Simple LRU-like cache for chart data
const cache = new Map();
const MAX_CACHE_SIZE = 50;

export const ChartDataCache = {
  getKey: (symbol, timeframe) => `${symbol}-${timeframe}`,

  get: (symbol, timeframe) => {
    const key = ChartDataCache.getKey(symbol, timeframe);
    const item = cache.get(key);
    if (!item) return null;
    
    // Check if stale (e.g., older than 5 minutes for short TFs, 1 hour for long)
    const now = Date.now();
    if (now - item.timestamp > 300000) { // 5 mins
       // cache.delete(key);
       // return null; 
       // Better: return data but flag it? For now, return valid data, let component decide refresh.
    }
    return item.data;
  },

  set: (symbol, timeframe, data) => {
    const key = ChartDataCache.getKey(symbol, timeframe);
    
    // Evict oldest if full
    if (cache.size >= MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    cache.set(key, {
      timestamp: Date.now(),
      data: data
    });
  },

  clear: () => {
    cache.clear();
  }
};