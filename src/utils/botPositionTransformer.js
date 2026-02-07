
/**
 * Utility to transform raw Candle Strike Bot positions into the unified trade format
 * expected by the TradesTable component.
 */

export const transformBotPositionToTrade = (botPosition) => {
  if (!botPosition) return null;

  // Use stored entry price if available (which should be locked upon activation)
  // Fallback to 0 if not set (Waiting state)
  const entryPrice = parseFloat(botPosition.entryPrice || 0);
  
  // Current price defaults to entry price if no live update yet, or 0
  const currentPrice = parseFloat(botPosition.currentPrice || entryPrice);
  
  const margin = parseFloat(botPosition.margin || botPosition.investment || 0);
  const leverage = parseFloat(botPosition.leverage || 1);
  
  // Determine direction standard
  let direction = 'LONG';
  if (botPosition.direction === 'Red Candles' || botPosition.direction === 'Short Only') {
    direction = 'SHORT';
  } else if (botPosition.direction === 'Auto (Follow Color)') {
    if ((botPosition.currentRedStreak || 0) > (botPosition.currentGreenStreak || 0)) {
       direction = 'SHORT';
    }
  }

  // Calculate PnL
  // If we have explicit PnL from storage/live update, use it
  let pnl = parseFloat(botPosition.unrealizedPnl || 0);
  let pnlPercent = parseFloat(botPosition.pnlPercentage || 0);

  // If status is ACTIVE and we have prices but no PnL, calculate on the fly
  // (Though ideally the source component updates this)
  if (botPosition.status === 'ACTIVE' && entryPrice > 0 && currentPrice > 0) {
      if (currentPrice !== entryPrice && pnl === 0) {
        const diff = (currentPrice - entryPrice) / entryPrice;
        const side = direction === 'LONG' ? 1 : -1;
        pnlPercent = diff * side * leverage * 100;
        pnl = (pnlPercent / 100) * margin;
      }
  }

  return {
    id: botPosition.id,
    originalId: botPosition.id,
    botId: botPosition.id, // Explicit reference to source bot ID
    sourceKey: 'activeCandleStrikeBots', // Key used in localStorage
    botType: 'STRIKE', // Specific marker for the table
    botName: 'Candle Strike',
    symbol: botPosition.symbol || 'UNKNOWN',
    entryPrice: entryPrice,
    isEntryPriceLocked: botPosition.isEntryPriceLocked || false,
    entryPriceLockedAt: botPosition.entryPriceLockedAt || null,
    currentPrice: currentPrice,
    amount: margin, // Invested amount
    quantity: (margin * leverage) / (entryPrice || 1), // Approximate quantity
    leverage: leverage,
    pnl: pnl,
    pnlPercent: pnlPercent,
    status: botPosition.status || 'WAITING',
    direction: direction,
    timeActivated: botPosition.createdAt || Date.now(),
    takeProfit: parseFloat(botPosition.takeProfit || 0),
    stopLoss: parseFloat(botPosition.stopLoss || 0),
    
    // Bot specific metadata for detailed views or tooltips
    _botDetails: {
      timeframe: botPosition.timeframe,
      strategy: botPosition.direction,
      streaks: {
        green: botPosition.currentGreenStreak || 0,
        red: botPosition.currentRedStreak || 0
      }
    }
  };
};
