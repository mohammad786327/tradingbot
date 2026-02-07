
/**
 * Position Data Structure and Validation
 */

export const POSITION_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  WAITING: 'WAITING',
};

export const STRATEGY_TYPES = {
  PRICE_MOVEMENT: 'Price Movement',
  GRID: 'Grid',
  DCA: 'DCA',
  RSI: 'RSI',
  CANDLE_STRIKE: 'Candle Strike',
  MANUAL: 'Manual',
};

export const TRADE_DIRECTION = {
  LONG: 'LONG',
  SHORT: 'SHORT',
};

export const DEFAULT_POSITION = {
  id: '',
  botId: '',
  strategyType: STRATEGY_TYPES.MANUAL,
  symbol: '',
  entryPrice: 0,
  entryTime: 0,
  entryQuantity: 0,
  leverage: 1,
  margin: 0,
  currentPrice: 0,
  currentPnL: 0,
  currentPnLPercentage: 0,
  status: POSITION_STATUS.PENDING,
  exitPrice: null,
  exitTime: null,
  direction: TRADE_DIRECTION.LONG,
  templateSettings: {},
  createdAt: 0,
  updatedAt: 0,
  botName: '',
  templateName: '',
  // Locking fields
  isEntryPriceLocked: false,
  entryPriceLockedAt: null
};

export const validatePositionData = (position) => {
  const errors = [];
  
  if (!position.id) errors.push('Missing ID');
  if (!position.symbol) errors.push('Missing Symbol');
  
  // Only validate entry price strictly if it is locked or open
  if (position.isEntryPriceLocked && (typeof position.entryPrice !== 'number' || position.entryPrice <= 0)) {
     errors.push('Invalid Locked Entry Price');
  }
  
  if (typeof position.entryQuantity !== 'number' || position.entryQuantity < 0) errors.push('Invalid Quantity');
  
  // Allow for bot statuses that might not be in the strict POSITION_STATUS enum (e.g. specialized bot statuses)
  // but generally warn if it's completely unknown
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const createNewPosition = (
  botId, 
  strategyType, 
  symbol,
  entryPrice, 
  entryQuantity, 
  direction, 
  leverage = 1,
  templateSettings = {},
  botName = 'Manual Trade',
  templateName = 'Manual'
) => {
  const now = Date.now();
  const margin = (entryPrice * entryQuantity) / leverage;

  return {
    ...DEFAULT_POSITION,
    id: `pos_${now}_${Math.random().toString(36).substr(2, 9)}`,
    botId: botId || `manual_${now}`,
    strategyType,
    symbol: symbol.toUpperCase(),
    entryPrice: parseFloat(entryPrice),
    entryTime: now,
    entryQuantity: parseFloat(entryQuantity),
    leverage: parseFloat(leverage),
    margin: parseFloat(margin),
    currentPrice: parseFloat(entryPrice),
    currentPnL: 0,
    currentPnLPercentage: 0,
    status: POSITION_STATUS.OPEN,
    direction,
    templateSettings,
    createdAt: now,
    updatedAt: now,
    botName,
    templateName,
    // Initialize locked state for manual trades as they open immediately
    isEntryPriceLocked: true,
    entryPriceLockedAt: now
  };
};
