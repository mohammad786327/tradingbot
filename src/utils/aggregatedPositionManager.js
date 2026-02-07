
import { v4 as uuidv4 } from 'uuid';

// Helper to safely parse localStorage
const safeParse = (key, fallback = []) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error parsing ${key}:`, e);
    return fallback;
  }
};

// Map raw data to unified Position structure
const normalizePosition = (item, source) => {
  let type = 'Unknown';
  let pnl = 0;
  let pnlPercent = 0;
  
  // Determine Type & PnL based on source structure
  switch(source) {
    case 'activePositions': // Price Movement & Manual
      type = item.strategyType || (item.botName ? 'Price Movement' : 'Manual');
      pnl = parseFloat(item.unrealizedPnl || item.currentPnL || 0);
      pnlPercent = parseFloat(item.pnlPercentage || item.currentPnLPercentage || 0);
      break;
    case 'gridPositions':
      type = 'Grid Bot';
      pnl = parseFloat(item.unrealizedPnl || 0);
      pnlPercent = parseFloat(item.pnlPercentage || 0);
      break;
    case 'dcaBots':
      type = 'DCA Bot';
      pnl = parseFloat(item.pnl || 0);
      pnlPercent = parseFloat(item.pnlPercent || 0);
      break;
    case 'candleStrikePositions':
      type = 'Candle Strike';
      pnl = parseFloat(item.unrealizedPnl || 0);
      pnlPercent = parseFloat(item.pnlPercentage || 0);
      break;
    default:
      type = 'Custom';
  }

  return {
    id: item.id,
    originalId: item.id, // Keep original ID for deletions
    sourceKey: source,   // Track which localStorage key this came from
    botType: type,
    botName: item.botName || item.name || type,
    symbol: item.symbol || 'UNKNOWN',
    entryPrice: parseFloat(item.entryPrice || item.avgPrice || 0),
    isEntryPriceLocked: item.isEntryPriceLocked || false,
    entryPriceLockedAt: item.entryPriceLockedAt || null,
    currentPrice: parseFloat(item.currentPrice || 0),
    quantity: parseFloat(item.quantity || item.totalInvested || 0), 
    amount: parseFloat(item.margin || item.totalInvested || 0),
    pnl: pnl,
    pnlPercent: pnlPercent,
    status: item.status || 'UNKNOWN',
    direction: item.direction || (item.mode ? item.mode.toUpperCase() : 'LONG'),
    leverage: item.leverage || 1,
    timeActivated: item.createdAt || item.startTime || Date.now(),
    // Keep raw item for specific restores or details
    _raw: item 
  };
};

export const aggregatedPositionManager = {
  // Fetch all positions from all known keys
  getAllPositions: () => {
    const priceMovement = safeParse('activePositions').map(i => normalizePosition(i, 'activePositions'));
    const grid = safeParse('gridPositions').map(i => normalizePosition(i, 'gridPositions'));
    const dca = safeParse('dcaBots').map(i => normalizePosition(i, 'dcaBots'));
    const candleStrike = safeParse('candleStrikePositions').map(i => normalizePosition(i, 'candleStrikePositions'));
    
    // Merge and sort by time (newest first)
    return [...priceMovement, ...grid, ...dca, ...candleStrike].sort((a, b) => {
        const timeA = new Date(a.timeActivated).getTime();
        const timeB = new Date(b.timeActivated).getTime();
        return timeB - timeA;
    });
  },

  // Delete a position from its specific source storage
  deletePosition: (positionId, sourceKey) => {
    if (!sourceKey) return false;
    
    try {
      const items = safeParse(sourceKey);
      const filtered = items.filter(item => item.id !== positionId);
      
      if (filtered.length !== items.length) {
        localStorage.setItem(sourceKey, JSON.stringify(filtered));
        return true;
      }
      return false;
    } catch (e) {
      console.error(`Failed to delete position ${positionId} from ${sourceKey}`, e);
      return false;
    }
  },

  // Update status (e.g. force close)
  updatePositionStatus: (positionId, sourceKey, newStatus) => {
      try {
        const items = safeParse(sourceKey);
        const index = items.findIndex(item => item.id === positionId);
        
        if (index !== -1) {
            items[index].status = newStatus;
            localStorage.setItem(sourceKey, JSON.stringify(items));
            return true;
        }
        return false;
      } catch (e) {
          console.error(`Failed to update status for ${positionId}`, e);
          return false;
      }
  }
};
