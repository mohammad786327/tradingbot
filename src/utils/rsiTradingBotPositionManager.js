
import { getBotTemplateById } from './botTemplateDataManager';

/**
 * Utility to manage RSI Trading Bot positions
 * Fetches active positions and merges with template data for complete trade records
 */

const POSITIONS_KEY = 'activeRSIPositions';
const TEMPLATES_KEY = 'rsiTradingBots';

export const transformRSIBotPositionToTrade = (position, template = null) => {
  if (!position) return null;

  // 1. Resolve Data Sources
  // Template data overrides generic position data for static config (Symbol, Margin)
  // Position data overrides template for dynamic state (Entry Price, Status)
  
  const resolvedTemplate = template || {};
  
  // 2. Symbol Resolution
  // Fetch actual coin symbol (e.g., BTCUSDT) from template if missing in position
  const symbol = resolvedTemplate.symbol || position.symbol || 'UNKNOWN';
  
  // 3. Status Resolution
  let status = position.status || 'WAITING';
  if (position.deleted) status = 'DELETED';
  
  // 4. Price Resolution
  const entryPrice = parseFloat(position.entryPrice || 0);
  // Initial current price: use stored current, or entry, or 0
  // If status is active, we ensure currentPrice has at least a fallback to avoid $0
  let currentPrice = parseFloat(position.currentPrice || 0);
  if (currentPrice === 0 && entryPrice > 0) currentPrice = entryPrice;

  // 5. Margin & Leverage
  // RSI bots usually have 'investment' in their template. We map this to 'amount'.
  // Using template value ensures we don't get "-"
  const margin = parseFloat(resolvedTemplate.investment || position.investment || position.margin || 0);
  const leverage = parseFloat(resolvedTemplate.leverage || position.leverage || 1);
  
  // 6. Direction
  let direction = resolvedTemplate.direction || position.direction || 'LONG';
  direction = direction.toUpperCase();

  // 7. PnL Calculation
  // Recalculate if we have prices but PnL is stale
  let pnl = parseFloat(position.pnl || 0);
  let pnlPercent = parseFloat(position.pnlPercent || 0);
  
  if (status === 'ACTIVE' && entryPrice > 0 && currentPrice > 0) {
      if (currentPrice !== entryPrice && pnl === 0) {
         const priceDiff = (currentPrice - entryPrice) / entryPrice;
         const dirMult = direction === 'LONG' ? 1 : -1;
         pnlPercent = priceDiff * dirMult * leverage * 100;
         pnl = (pnlPercent / 100) * margin;
      }
  }

  return {
    id: position.id,
    originalId: position.id,
    botId: position.botId || resolvedTemplate.id, // Ensure link is preserved
    sourceKey: POSITIONS_KEY,
    botType: 'RSI_BOT',
    botName: resolvedTemplate.name || position.name || 'RSI Bot',
    symbol: symbol,
    entryPrice: entryPrice,
    isEntryPriceLocked: position.isEntryPriceLocked || false,
    entryPriceLockedAt: position.entryPriceLockedAt || null,
    currentPrice: currentPrice,
    amount: margin, // Fixed: Populated from template investment
    quantity: (margin * leverage) / (entryPrice || 1),
    leverage: leverage,
    pnl: pnl,
    pnlPercent: pnlPercent,
    status: status,
    direction: direction,
    timeActivated: position.createdAt || position.created_at || Date.now(),
    takeProfit: parseFloat(resolvedTemplate.takeProfit || position.takeProfit || 0),
    stopLoss: parseFloat(resolvedTemplate.stopLoss || position.stopLoss || 0),
    
    // RSI Specific Metadata
    _rsiDetails: {
      period: resolvedTemplate.rsiPeriod || position.rsiPeriod || 14,
      targetRsi: resolvedTemplate.rsiValue || position.rsiValue || 30,
      currentRSI: position.live_rsi_value || 0
    }
  };
};

export const getRSIBotPositions = () => {
  try {
    // Fetch live positions (Active/Waiting instances)
    const rawPositions = localStorage.getItem(POSITIONS_KEY);
    const positions = rawPositions ? JSON.parse(rawPositions) : [];
    
    // Fetch templates for metadata lookup (Configuration)
    const rawTemplates = localStorage.getItem(TEMPLATES_KEY);
    const templates = rawTemplates ? JSON.parse(rawTemplates) : [];
    
    // Create quick lookup map for templates
    const templatesMap = templates.reduce((acc, t) => {
        if(t.id) acc[t.id] = t;
        return acc;
    }, {});

    if (!Array.isArray(positions)) return [];

    return positions
      .filter(pos => !pos.deleted)
      .map(pos => {
          // Attempt to find template by botId
          const template = templatesMap[pos.botId];
          return transformRSIBotPositionToTrade(pos, template);
      })
      .filter(Boolean);
      
  } catch (error) {
    console.error('Error fetching RSI positions:', error);
    return [];
  }
};
