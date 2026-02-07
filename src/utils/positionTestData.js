import { createNewPosition, STRATEGY_TYPES, TRADE_DIRECTION, POSITION_STATUS } from './positionSchema';

export const generateMockPosition = (overrides = {}) => {
  const defaults = {
    botId: 'test_bot_1',
    strategyType: STRATEGY_TYPES.MANUAL,
    symbol: 'BTCUSDT',
    entryPrice: 42000,
    entryQuantity: 0.1,
    direction: TRADE_DIRECTION.LONG,
    leverage: 10,
    templateSettings: { stopLoss: 40000, takeProfit: 45000 },
    botName: 'Test Bot',
    templateName: 'Test Template'
  };

  const params = { ...defaults, ...overrides };
  
  const pos = createNewPosition(
    params.botId,
    params.strategyType,
    params.symbol,
    params.entryPrice,
    params.entryQuantity,
    params.direction,
    params.leverage,
    params.templateSettings,
    params.botName,
    params.templateName
  );

  if (overrides.status) pos.status = overrides.status;
  if (overrides.id) pos.id = overrides.id;
  
  return pos;
};

export const generateMultipleMockPositions = (count = 5) => {
  const strategies = Object.values(STRATEGY_TYPES);
  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ADAUSDT'];
  
  return Array.from({ length: count }).map((_, i) => {
    return generateMockPosition({
      botId: `bot_${i}`,
      symbol: symbols[i % symbols.length],
      strategyType: strategies[i % strategies.length],
      direction: Math.random() > 0.5 ? TRADE_DIRECTION.LONG : TRADE_DIRECTION.SHORT,
      entryPrice: 1000 + Math.random() * 50000,
      status: Math.random() > 0.7 ? POSITION_STATUS.CLOSED : POSITION_STATUS.OPEN,
      botName: `Demo Bot ${i + 1}`
    });
  });
};

export const INITIAL_TEST_DATA = [
    generateMockPosition({ symbol: 'BTCUSDT', entryPrice: 65000, direction: TRADE_DIRECTION.SHORT, leverage: 20, botName: 'BTC Scalper', strategyType: STRATEGY_TYPES.PRICE_MOVEMENT }),
    generateMockPosition({ symbol: 'ETHUSDT', entryPrice: 3500, direction: TRADE_DIRECTION.LONG, leverage: 10, botName: 'ETH Grid', strategyType: STRATEGY_TYPES.GRID }),
    generateMockPosition({ symbol: 'SOLUSDT', entryPrice: 140, direction: TRADE_DIRECTION.LONG, leverage: 5, botName: 'Solana Moon', strategyType: STRATEGY_TYPES.DCA })
];