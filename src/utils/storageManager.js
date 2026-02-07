const STORAGE_KEYS = {
  PORTFOLIO: 'dashboard_portfolio',
  ACCOUNTS: 'dashboard_accounts',
  POSITIONS: 'dashboard_positions',
  WATCHLIST: 'dashboard_watchlist',
  TRADES: 'dashboard_trades',
  NOTIFICATIONS: 'dashboard_notifications',
  SETTINGS: 'dashboard_settings'
};

// Helper to generate realistic dummy positions
const generatePositions = () => {
  const bots = ['Trend Master', 'Grid Scalper', 'RSI Hunter', 'DCA Bot', 'Candle Strike'];
  const symbols = [
    { s: 'BTCUSDT', p: 42000 },
    { s: 'ETHUSDT', p: 2200 },
    { s: 'SOLUSDT', p: 95 },
    { s: 'BNBUSDT', p: 310 },
    { s: 'XRPUSDT', p: 0.55 },
    { s: 'ADAUSDT', p: 0.48 },
    { s: 'AVAXUSDT', p: 35 },
    { s: 'DOTUSDT', p: 7.2 }
  ];

  return Array.from({ length: 45 }).map((_, i) => {
    const symData = symbols[i % symbols.length];
    const isLong = i % 3 !== 0; // Mostly longs
    const entryPrice = symData.p * (1 + (Math.random() * 0.1 - 0.05));
    const leverage = [5, 10, 20, 50][i % 4];
    
    // Calculate SL/TP based on entry
    const slDist = entryPrice * 0.02;
    const tpDist = entryPrice * 0.05;
    const sl = isLong ? entryPrice - slDist : entryPrice + slDist;
    const tp = isLong ? entryPrice + tpDist : entryPrice - tpDist;

    return {
      id: i + 1,
      symbol: symData.s,
      entryPrice: parseFloat(entryPrice.toFixed(4)),
      amount: (Math.random() * (1000 / symData.p)).toFixed(4), // Roughly $1000 position size
      type: isLong ? 'Long' : 'Short',
      leverage: leverage,
      bot: bots[i % bots.length],
      status: 'Open',
      entryTime: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
      sl: parseFloat(sl.toFixed(4)),
      tp: parseFloat(tp.toFixed(4)),
      riskReward: '1:2.5'
    };
  });
};

// Initial Mock Data Seeder
const seedData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.PORTFOLIO)) {
    localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify({
      totalBalance: 124500.50,
      dailyPnL: 3250.75,
      dailyPnLPercent: 2.68,
      allocation: [
        { name: 'BTC', value: 45 },
        { name: 'ETH', value: 30 },
        { name: 'SOL', value: 15 },
        { name: 'USDT', value: 10 },
      ]
    }));
  }

  if (!localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify([
      { id: 1, name: 'Binance Main', balance: 85000, equity: 87500, usedMargin: 45000, status: 'connected' },
      { id: 2, name: 'Bybit Futures', balance: 35000, equity: 32000, usedMargin: 12000, status: 'connected' },
      { id: 3, name: 'KuCoin Bot', balance: 4500, equity: 4500, usedMargin: 0, status: 'disconnected' },
    ]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.WATCHLIST)) {
    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ADAUSDT', 'XRPUSDT']));
  }

  if (!localStorage.getItem(STORAGE_KEYS.POSITIONS)) {
    localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(generatePositions()));
  }
};

export const storageManager = {
  init: () => seedData(),
  
  get: (key) => {
    try {
      const item = localStorage.getItem(STORAGE_KEYS[key]);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error(`Error reading ${key}`, e);
      return null;
    }
  },

  set: (key, data) => {
    try {
      localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
      // Dispatch event for real-time updates across components
      window.dispatchEvent(new Event('storage-update'));
    } catch (e) {
      console.error(`Error writing ${key}`, e);
    }
  },

  // Specific Getters
  getPortfolio: () => storageManager.get('PORTFOLIO'),
  getAccounts: () => storageManager.get('ACCOUNTS'),
  getPositions: () => storageManager.get('POSITIONS') || [],
  getWatchlist: () => storageManager.get('WATCHLIST') || [],
  getNotifications: () => storageManager.get('NOTIFICATIONS') || [],

  // Helpers
  addToWatchlist: (symbol) => {
    const list = storageManager.getWatchlist();
    if (!list.includes(symbol)) {
      storageManager.set('WATCHLIST', [...list, symbol]);
    }
  },
  
  removeFromWatchlist: (symbol) => {
    const list = storageManager.getWatchlist();
    storageManager.set('WATCHLIST', list.filter(s => s !== symbol));
  },

  addNotification: (notification) => {
    const list = storageManager.getNotifications();
    const newItem = { ...notification, id: Date.now(), timestamp: new Date().toISOString(), read: false };
    storageManager.set('NOTIFICATIONS', [newItem, ...list].slice(0, 50)); // Keep last 50
  }
};