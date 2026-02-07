export const calculateSMA = (data, period) => {
  if (!data || data.length === 0 || period <= 0) return [];
  const results = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      results.push({ time: data[i].time, value: NaN });
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    results.push({ time: data[i].time, value: sum / period });
  }
  return results;
};

export const calculateEMA = (data, period) => {
  if (!data || data.length === 0 || period <= 0) return [];
  const results = [];
  const k = 2 / (period + 1);
  let ema = data[0].close;
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      results.push({ time: data[i].time, value: ema });
      continue;
    }
    ema = data[i].close * k + ema * (1 - k);
    results.push({ time: data[i].time, value: ema });
  }
  return results;
};

export const calculateBollingerBands = (data, period = 20, multiplier = 2) => {
  if (!data || data.length === 0 || period <= 0) return [];
  const sma = calculateSMA(data, period);
  const results = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      results.push({ time: data[i].time, upper: NaN, lower: NaN, middle: NaN });
      continue;
    }

    const slice = data.slice(i - period + 1, i + 1);
    const mean = sma[i].value;
    
    // StdDev
    const squaredDiffs = slice.map(d => Math.pow(d.close - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const stdDev = Math.sqrt(variance);

    results.push({
      time: data[i].time,
      middle: mean,
      upper: mean + (stdDev * multiplier),
      lower: mean - (stdDev * multiplier)
    });
  }
  return results;
};