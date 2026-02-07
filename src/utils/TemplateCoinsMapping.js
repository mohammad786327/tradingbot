
/**
 * Defines the mapping between Movement Coins (Trigger Source) and Execution Coins (Active Trades)
 * for different strategy templates.
 */

export const TEMPLATE_MAPPINGS = [
  {
    id: 'volatility_scalper',
    name: 'Volatility Scalper',
    description: 'High frequency scalping based on leader volatility',
    orderType: 'Scalping',
    mappings: {
      'BTCUSDT': ['ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'AVAXUSDT'],
      'ETHUSDT': ['BTCUSDT', 'XRPUSDT', 'ADAUSDT', 'MATICUSDT'],
      'SOLUSDT': ['AVAXUSDT', 'NEARUSDT', 'DOTUSDT'],
      'BNBUSDT': ['CAKEUSDT', 'BAKEUSDT'],
      'XRPUSDT': ['XLMUSDT', 'TRXUSDT'],
      'ADAUSDT': ['DOTUSDT', 'ATOMUSDT'],
      'LINKUSDT': ['UNIUSDT', 'AAVEUSDT'],
      'UNIUSDT': ['SUSHIUSDT', 'CRVUSDT']
    }
  },
  {
    id: 'momentum_trader',
    name: 'Momentum Trader',
    description: 'Follows strong trend momentum from market leaders',
    orderType: 'Momentum',
    mappings: {
      'BTCUSDT': ['LTCUSDT', 'BCHUSDT', 'DOGEUSDT'],
      'ETHUSDT': ['ETCUSDT', 'LDOUSDT', 'OPUSDT', 'ARBUSDT'],
      'SOLUSDT': ['RAYUSDT', 'SRMUSDT', 'FIDAUSDT'],
      'BNBUSDT': ['SXPUSDT', 'XVSUSDT'],
      'XRPUSDT': ['ALGOUSDT', 'HBARUSDT']
    }
  },
  {
    id: 'grid_scalper',
    name: 'Grid Scalper',
    description: 'Executes grid levels based on movement coin ranges',
    orderType: 'Grid',
    mappings: {
      'BTCUSDT': ['BTCUSDT'], // Trades itself
      'ETHUSDT': ['ETHUSDT'],
      'SOLUSDT': ['SOLUSDT'],
      'BNBUSDT': ['BNBUSDT'],
      'XRPUSDT': ['XRPUSDT'],
      'ADAUSDT': ['ADAUSDT']
    }
  }
];

export const AVAILABLE_MOVEMENT_COINS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 
  'XRPUSDT', 'ADAUSDT', 'LINKUSDT', 'UNIUSDT'
];

/**
 * Returns the list of execution coins for a given template and movement coin.
 * @param {string} templateId 
 * @param {string} movementCoin 
 * @returns {Array<string>|null} List of coins or null if no mapping exists
 */
export const getExecutionCoins = (templateId, movementCoin) => {
  const template = TEMPLATE_MAPPINGS.find(t => t.id === templateId);
  if (!template) return null;
  
  return template.mappings[movementCoin] || null;
};

/**
 * Checks if a mapping exists for the given pair.
 * @param {string} templateId 
 * @param {string} movementCoin 
 * @returns {boolean}
 */
export const hasCoinMapping = (templateId, movementCoin) => {
  const coins = getExecutionCoins(templateId, movementCoin);
  return coins && coins.length > 0;
};
