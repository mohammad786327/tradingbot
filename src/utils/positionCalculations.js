import { TRADE_DIRECTION } from './positionSchema';

/**
 * Calculate Profit/Loss in currency
 */
export const calculatePnL = (entryPrice, currentPrice, quantity, direction, leverage = 1) => {
  if (!entryPrice || !currentPrice || !quantity) return 0;
  
  const priceDiff = direction === TRADE_DIRECTION.LONG 
    ? currentPrice - entryPrice 
    : entryPrice - currentPrice;
    
  return priceDiff * quantity;
};

/**
 * Calculate P&L as percentage relative to initial margin
 */
export const calculatePnLPercentage = (entryPrice, currentPrice, direction, leverage = 1) => {
  if (!entryPrice || !currentPrice) return 0;

  const priceDiffPercent = (currentPrice - entryPrice) / entryPrice;
  const directionalPercent = direction === TRADE_DIRECTION.LONG ? priceDiffPercent : -priceDiffPercent;
  
  return directionalPercent * leverage * 100;
};

/**
 * Calculate total position value (Notional Value)
 */
export const calculatePositionValue = (currentPrice, quantity) => {
  return currentPrice * quantity;
};

/**
 * Calculate Return on Investment (ROI)
 */
export const calculateROI = (pnl, initialMargin) => {
  if (!initialMargin || initialMargin === 0) return 0;
  return (pnl / initialMargin) * 100;
};

/**
 * Validate price inputs
 */
export const validatePriceData = (entryPrice, currentPrice, quantity, leverage) => {
  if (entryPrice <= 0) return { valid: false, error: 'Entry price must be positive' };
  if (currentPrice < 0) return { valid: false, error: 'Current price cannot be negative' }; // 0 is technically possible
  if (quantity <= 0) return { valid: false, error: 'Quantity must be positive' };
  if (leverage < 1) return { valid: false, error: 'Leverage must be at least 1x' };
  
  return { valid: true };
};