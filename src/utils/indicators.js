
/**
 * Calculates the Relative Strength Index (RSI) for an array of closing prices.
 * Uses the Wilder's Smoothing method.
 * 
 * @param {number[]} closePrices - Array of closing prices (chronological order)
 * @param {number} period - RSI period (default 14)
 * @returns {number[]} Array of RSI values corresponding to the input prices
 */
export const calculateRSI = (closePrices, period = 14) => {
  if (!closePrices || closePrices.length < period + 1) {
    return Array(closePrices ? closePrices.length : 0).fill(NaN);
  }

  const rsiData = [];
  let avgGain = 0;
  let avgLoss = 0;

  // Initial Calculation (Simple Moving Average for first period)
  for (let i = 1; i <= period; i++) {
    const change = closePrices[i] - closePrices[i - 1];
    if (change > 0) {
      avgGain += change;
    } else {
      avgLoss += Math.abs(change);
    }
  }

  avgGain /= period;
  avgLoss /= period;

  let rs = avgGain / avgLoss;
  let rsi = 100 - (100 / (1 + rs));
  
  // Fill initial NaN values for the first 'period' indices
  for (let i = 0; i < period; i++) {
      rsiData.push(NaN);
  }
  rsiData.push(rsi);

  // Subsequent Calculations (Wilder's Smoothing)
  for (let i = period + 1; i < closePrices.length; i++) {
    const change = closePrices[i] - closePrices[i - 1];
    let gain = 0;
    let loss = 0;

    if (change > 0) {
      gain = change;
    } else {
      loss = Math.abs(change);
    }

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi = 100;
    } else {
      rs = avgGain / avgLoss;
      rsi = 100 - (100 / (1 + rs));
    }
    
    rsiData.push(rsi);
  }

  return rsiData;
};

/**
 * Checks if a trigger condition is met based on RSI mode
 */
export const checkRSITrigger = (currentRSI, previousRSI, threshold, mode, direction) => {
  if (!currentRSI || isNaN(currentRSI)) return false;

  const isBuy = direction === 'Long'; // Looking for oversold
  // Oversold threshold (e.g. 30), Overbought threshold (e.g. 70)
  
  if (mode === 'Touch') {
     // Simple cross
     if (isBuy) return currentRSI <= threshold;
     else return currentRSI >= threshold;
  } 
  else if (mode === 'Bounce') {
     // Crossed previously and now returning? 
     // Or simply turning point? 
     // Common Def: Touched threshold and ticked back up (for buy)
     if (isBuy) {
        return previousRSI <= threshold && currentRSI > previousRSI; 
     } else {
        return previousRSI >= threshold && currentRSI < previousRSI;
     }
  }
  
  return false;
};
