
/**
 * Utility to manage and retrieve Bot Template Data
 * Used to lookup configuration details (Margin, Leverage, Settings) for active trades
 */

const STORAGE_KEYS = [
  'candleStrikeBots',       // Configs for Candle Strike Bots
  'activeCandleStrikeBots', // Instances of Candle Strike Bots
  'rsiTradingBots',         // Configs for RSI Bots
  'dcaBots',                // Configs for DCA Bots
  'gridPositions',          // Grid Positions (often self-contained, but acting as templates too)
  'activePositions'         // Generic active positions
];

/**
 * Retrieves a single bot template by ID scanning all bot storages
 * @param {string} botId 
 * @returns {Object|null}
 */
export const getBotTemplateById = (botId) => {
  if (!botId) return null;

  for (const key of STORAGE_KEYS) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      const found = data.find(item => item.id === botId);
      if (found) return found;
    } catch (e) {
      console.error(`Error parsing ${key} for template lookup`, e);
    }
  }
  return null;
};

/**
 * Retrieves all bot templates mapped by ID for efficient lookup
 * @returns {Object} Map of { botId: templateData }
 */
export const getAllBotTemplates = () => {
  const templates = {};
  
  STORAGE_KEYS.forEach(key => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item && item.id) {
            // Store the template/bot config using its ID
            templates[item.id] = item;
          }
        });
      }
    } catch (e) {
      // Ignore errors for individual keys
      console.warn(`Failed to parse storage key: ${key}`, e);
    }
  });
  
  return templates;
};
