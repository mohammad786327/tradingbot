// Mock data manager for Liquidation Levels

export const generateLiquidationData = (currentPrice = 65000) => {
  const levels = [];
  const range = currentPrice * 0.05; // 5% range
  
  // Generate Short Liquidations (Above current price)
  for (let i = 0; i < 15; i++) {
    const price = currentPrice + (Math.random() * range);
    const volume = Math.floor(Math.random() * 5000000) + 500000;
    levels.push({
      id: `short-${i}`,
      type: 'short',
      price: price,
      volume: volume,
      leverage: [10, 25, 50, 100][Math.floor(Math.random() * 4)] + 'x'
    });
  }

  // Generate Long Liquidations (Below current price)
  for (let i = 0; i < 15; i++) {
    const price = currentPrice - (Math.random() * range);
    const volume = Math.floor(Math.random() * 5000000) + 500000;
    levels.push({
      id: `long-${i}`,
      type: 'long',
      price: price,
      volume: volume,
      leverage: [10, 25, 50, 100][Math.floor(Math.random() * 4)] + 'x'
    });
  }

  // Sort by price
  return levels.sort((a, b) => b.price - a.price);
};

export const calculateLiquidationStats = (data) => {
  const shorts = data.filter(d => d.type === 'short');
  const longs = data.filter(d => d.type === 'long');
  
  const totalShortVol = shorts.reduce((acc, curr) => acc + curr.volume, 0);
  const totalLongVol = longs.reduce((acc, curr) => acc + curr.volume, 0);

  return {
    totalVolume: totalShortVol + totalLongVol,
    shortVolume: totalShortVol,
    longVolume: totalLongVol,
    shortCount: shorts.length,
    longCount: longs.length,
    dominantSide: totalShortVol > totalLongVol ? 'short' : 'long',
    ratio: totalLongVol > 0 ? (totalShortVol / totalLongVol).toFixed(2) : 0
  };
};

// Cache to prevent jittery updates
let cachedData = null;
let lastUpdate = 0;

export const getLiquidationData = (currentPrice) => {
  const now = Date.now();
  if (!cachedData || now - lastUpdate > 10000) { // Update every 10 seconds
    cachedData = generateLiquidationData(currentPrice);
    lastUpdate = now;
  }
  return cachedData;
};