
import { v4 as uuidv4 } from 'uuid';

const generateMockTrades = () => {
  const sources = ['PriceMovement', 'Grid', 'DCA', 'RSI', 'CandleStrike'];
  const statuses = ['Active', 'Waiting', 'Pending Order', 'Limit Order', 'Activated'];
  const coins = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'MATIC/USDT', 'DOT/USDT'];
  
  return Array.from({ length: 15 }).map((_, index) => {
    const isLong = Math.random() > 0.5;
    const entryPrice = Math.random() * 50000 + 1000;
    const pnl = (Math.random() * 200) - 50; // Range -50 to +150
    
    return {
      id: uuidv4(),
      coinName: coins[Math.floor(Math.random() * coins.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      entryPrice: entryPrice,
      stopLoss: entryPrice * (isLong ? 0.95 : 1.05),
      takeProfit: entryPrice * (isLong ? 1.1 : 0.9),
      pnl: pnl,
      pnlPercent: (pnl / 1000) * 100, // Assuming 1000 margin
      timeActivated: Date.now() - Math.floor(Math.random() * 1000000000),
      board: 'Main Board',
      source: sources[Math.floor(Math.random() * sources.length)],
      margin: Math.floor(Math.random() * 500) + 50,
      direction: isLong ? 'Long' : 'Short',
      history: [
        { date: Date.now() - 100000, action: 'Order Created', details: 'Limit order placed' },
        { date: Date.now() - 50000, action: 'Order Filled', details: `Filled at ${entryPrice.toFixed(2)}` },
      ]
    };
  });
};

export const generateActivePositions = () => {
  return [
    {
      id: 'pos_btc_01',
      botName: 'BTC Trend Alpha',
      symbol: 'BTCUSDT',
      entryPrice: 65000.00,
      currentPrice: 67500.00,
      stopLoss: 64000.00,
      takeProfit: 70000.00,
      status: 'ACTIVE',
      direction: 'LONG',
      leverage: 10,
      margin: 1000,
      quantity: 0.153, // Approx (1000 * 10) / 65000
      unrealizedPnl: 382.50,
      pnlPercentage: 38.25,
      strategyType: 'Price Movement'
    },
    {
      id: 'pos_eth_02',
      botName: 'ETH Smart Grid',
      symbol: 'ETHUSDT',
      entryPrice: 3500.00,
      currentPrice: 3450.00,
      stopLoss: 3600.00,
      takeProfit: 3200.00,
      status: 'ACTIVE',
      direction: 'SHORT',
      leverage: 20,
      margin: 500,
      quantity: 2.857, // (500 * 20) / 3500
      unrealizedPnl: 142.85, // Profit on short: (3500 - 3450) * 2.857
      pnlPercentage: 28.57,
      strategyType: 'Grid'
    },
    {
      id: 'pos_ada_03',
      botName: 'ADA Momentum',
      symbol: 'ADAUSDT',
      entryPrice: 0.5500,
      currentPrice: 0.5200,
      stopLoss: 0.5000,
      takeProfit: 0.6500,
      status: 'ACTIVE',
      direction: 'LONG',
      leverage: 5,
      margin: 200,
      quantity: 1818.18,
      unrealizedPnl: -54.54,
      pnlPercentage: -27.27,
      strategyType: 'Price Movement'
    },
    {
      id: 'pos_xrp_04',
      botName: 'XRP Breakout',
      symbol: 'XRPUSDT',
      entryPrice: 0.6200,
      currentPrice: 0.6250,
      stopLoss: 0.6000,
      takeProfit: 0.7000,
      status: 'MOVING',
      direction: 'LONG',
      leverage: 10,
      margin: 300,
      quantity: 4838.7,
      unrealizedPnl: 24.19,
      pnlPercentage: 8.06,
      strategyType: 'Candle Strike'
    },
    {
      id: 'pos_doge_05',
      botName: 'DOGE Scalper',
      symbol: 'DOGEUSDT',
      entryPrice: 0.1200,
      currentPrice: 0.1180,
      stopLoss: 0.1150,
      takeProfit: 0.1300,
      status: 'ACTIVE',
      direction: 'LONG',
      leverage: 50,
      margin: 100,
      quantity: 41666.6,
      unrealizedPnl: -83.33,
      pnlPercentage: -83.33,
      strategyType: 'DCA'
    }
  ];
};

export const mockTrades = generateMockTrades();

export const getMockTrades = () => {
    return new Promise((resolve) => {
        setTimeout(() => resolve(mockTrades), 500);
    });
};
