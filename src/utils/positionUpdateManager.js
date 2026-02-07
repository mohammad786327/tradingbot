
import { calculatePnL, calculatePnLPercentage } from './positionCalculations';
import { binanceWS } from '@/utils/binanceWebSocket';

/**
 * Recalculate PnL for a position based on new price
 */
export const recalculatePositionPnL = (position, newPrice) => {
  if (!position || !newPrice) return position;

  let updatedEntryPrice = position.entryPrice;
  let isLocked = position.isEntryPriceLocked;
  let lockedAt = position.entryPriceLockedAt;

  // Logic to lock entry price if it was just activated/opened but not locked yet
  if (position.status === 'OPEN' || position.status === 'ACTIVE') {
      if (!isLocked) {
          updatedEntryPrice = newPrice; // Capture current price as entry
          isLocked = true;
          lockedAt = Date.now();
      }
  }

  // If entry price is 0 or invalid, force update it regardless of lock (sanity check)
  if (updatedEntryPrice <= 0) {
      updatedEntryPrice = newPrice;
      isLocked = true;
      lockedAt = Date.now();
  }

  const currentPnL = calculatePnL(
    updatedEntryPrice,
    newPrice,
    position.entryQuantity || position.quantity, // Handle both field names
    position.direction,
    position.leverage
  );

  const currentPnLPercentage = calculatePnLPercentage(
    updatedEntryPrice,
    newPrice,
    position.direction,
    position.leverage
  );

  return {
    ...position,
    entryPrice: updatedEntryPrice,
    isEntryPriceLocked: isLocked,
    entryPriceLockedAt: lockedAt,
    currentPrice: newPrice,
    currentPnL,
    pnl: currentPnL, // Map to both for compatibility
    currentPnLPercentage,
    pnlPercentage: currentPnLPercentage, // Map to both for compatibility
    updatedAt: Date.now()
  };
};

/**
 * Position Update Manager Class
 * Handles subscriptions to WS and manages batch updates
 */
class PositionUpdateManager {
  constructor() {
    this.subscribers = new Map(); // positionId -> callback
    this.activeSymbols = new Set();
    this.wsSubscription = null;
    this.positionMap = new Map(); // positionId -> position
  }

  registerPositions(positions, onUpdateCallback) {
    this.positionMap.clear();
    const symbolsToTrack = new Set();

    positions.forEach(p => {
      // Track OPEN, ACTIVE, RUNNING states
      const s = (p.status || '').toUpperCase();
      if (s === 'OPEN' || s === 'ACTIVE' || s === 'RUNNING') {
        this.positionMap.set(p.id, p);
        if (p.symbol) symbolsToTrack.add(p.symbol);
      }
    });

    // Unsubscribe old if different
    if (this.wsSubscription) {
        binanceWS.unsubscribe(this.wsSubscription);
        this.wsSubscription = null;
    }

    if (symbolsToTrack.size > 0) {
        const symbols = Array.from(symbolsToTrack);
        
        this.wsSubscription = binanceWS.subscribe(symbols, 'ticker', null, (data) => {
             // data.s = symbol, data.c = current price
             if (!data || !data.s || !data.c) return;
             
             const symbol = data.s;
             const price = parseFloat(data.c);
             const updates = [];

             this.positionMap.forEach(position => {
                 if (position.symbol === symbol) {
                     const updatedPosition = recalculatePositionPnL(position, price);
                     updates.push(updatedPosition);
                     // Update internal map to avoid recalculating on stale data
                     this.positionMap.set(position.id, updatedPosition); 
                 }
             });

             if (updates.length > 0 && onUpdateCallback) {
                 onUpdateCallback(updates);
             }
        });
    }
  }

  unregisterAll() {
      if (this.wsSubscription) {
          binanceWS.unsubscribe(this.wsSubscription);
          this.wsSubscription = null;
      }
      this.positionMap.clear();
  }
}

export const positionUpdateManager = new PositionUpdateManager();
