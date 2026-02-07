import { transformBotPositionToTrade } from './botPositionTransformer';

/**
 * Manages fetching and aggregating Bot positions
 * Originally for Candle Strike, now handles aggregation of multiple bot types
 */

// Key where the Candle Strike page saves active bots
const STORAGE_KEY = 'activeCandleStrikeBots';

export const getCandleStrikeBotPositions = () => {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) return [];

    let bots = [];
    try {
        bots = JSON.parse(rawData);
    } catch (e) {
        console.error('Error parsing CandleStrike data', e);
        return [];
    }
    
    if (!Array.isArray(bots)) return [];

    return bots
      .filter(bot => bot.status !== 'DELETED') 
      .map(bot => {
          // Transformer now handles botId addition
          return transformBotPositionToTrade(bot);
      })
      .filter(Boolean);
      
  } catch (error) {
    console.error('Error fetching Candle Strike bots:', error);
    return [];
  }
};

/**
 * Aggregates trades from multiple sources into a single sorted list
 * @param {Array} regularTrades - Standard/Manual trades
 * @param {Array} candleStrikeTrades - Candle Strike Bot trades
 * @param {Array} rsiTrades - RSI Bot trades
 */
export const aggregateBotAndRegularTrades = (regularTrades = [], candleStrikeTrades = [], rsiTrades = []) => {
  // Combine all arrays safely with robust checking
  const safeRegular = Array.isArray(regularTrades) ? regularTrades : [];
  const safeCS = Array.isArray(candleStrikeTrades) ? candleStrikeTrades : [];
  const safeRSI = Array.isArray(rsiTrades) ? rsiTrades : [];

  // Debug logging to track flow (can be removed in prod)
  // console.log(`Aggregating: ${safeRegular.length} regular, ${safeCS.length} CS, ${safeRSI.length} RSI`);

  // Spread ensures botId and other properties are preserved
  const combined = [...safeRegular, ...safeCS, ...safeRSI];
  
  // Sort by time activated (newest first)
  return combined.sort((a, b) => {
    const timeA = new Date(a.timeActivated || 0).getTime();
    const timeB = new Date(b.timeActivated || 0).getTime();
    return timeB - timeA;
  });
};