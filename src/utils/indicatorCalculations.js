import { calculateSMA, calculateEMA } from './technicalIndicators';

export const calculateRSI = (data, period = 14) => {
  if (data.length < period) return [];
  
  let gains = 0;
  let losses = 0;

  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  const results = [];
  
  // Fill initial NaN
  for (let i = 0; i < period; i++) {
      results.push({ time: data[i].time, value: NaN });
  }

  // Calculate RSI
  for (let i = period; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    let rsi = 100 - (100 / (1 + rs));

    results.push({ time: data[i].time, value: rsi });
  }

  return results;
};

export const calculateStochastic = (data, period = 14, smoothK = 3, smoothD = 3) => {
  const results = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      results.push({ time: data[i].time, k: NaN, d: NaN });
      continue;
    }

    const slice = data.slice(i - period + 1, i + 1);
    const low = Math.min(...slice.map(d => d.low));
    const high = Math.max(...slice.map(d => d.high));
    const currentClose = data[i].close;

    const k = ((currentClose - low) / (high - low)) * 100;
    results.push({ time: data[i].time, rawK: k });
  }

  // Smooth K
  const smoothedK = [];
  for(let i = 0; i < results.length; i++) {
      if (i < period - 1 + smoothK - 1) {
          smoothedK.push({ ...results[i], k: NaN, d: NaN });
          continue;
      }
      // Simple Moving Average of Raw K
      let sum = 0;
      for(let j=0; j<smoothK; j++) {
          sum += results[i-j].rawK;
      }
      smoothedK.push({ ...results[i], k: sum/smoothK });
  }

  // Smooth D (SMA of Smoothed K)
  const finalResults = [];
  for(let i = 0; i < smoothedK.length; i++) {
      if (i < period - 1 + smoothK - 1 + smoothD - 1) {
          finalResults.push({ time: data[i].time, k: NaN, d: NaN });
          continue;
      }
      let sum = 0;
      for(let j=0; j<smoothD; j++) {
          sum += smoothedK[i-j].k;
      }
      finalResults.push({ time: data[i].time, k: smoothedK[i].k, d: sum/smoothD });
  }

  return finalResults;
};

export const calculateWilliamsR = (data, period = 14) => {
  const results = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      results.push({ time: data[i].time, value: NaN });
      continue;
    }
    const slice = data.slice(i - period + 1, i + 1);
    const highestHigh = Math.max(...slice.map(d => d.high));
    const lowestLow = Math.min(...slice.map(d => d.low));
    const close = data[i].close;

    const wr = ((highestHigh - close) / (highestHigh - lowestLow)) * -100;
    results.push({ time: data[i].time, value: wr });
  }
  return results;
};

export const calculateROC = (data, period = 9) => {
  const results = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      results.push({ time: data[i].time, value: NaN });
      continue;
    }
    const roc = ((data[i].close - data[i - period].close) / data[i - period].close) * 100;
    results.push({ time: data[i].time, value: roc });
  }
  return results;
};

export const calculateCCI = (data, period = 20) => {
  const results = [];
  // Typical Price = (H+L+C)/3
  const tp = data.map(d => ({ time: d.time, value: (d.high + d.low + d.close) / 3 }));
  
  // SMA of TP
  const smaTp = calculateSMA(tp.map(d => ({ time: d.time, close: d.value })), period);

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      results.push({ time: data[i].time, value: NaN });
      continue;
    }
    
    const currentTp = tp[i].value;
    const currentSma = smaTp[i].value;

    // Mean Deviation
    let sumDev = 0;
    for (let j = 0; j < period; j++) {
       sumDev += Math.abs(tp[i - j].value - currentSma);
    }
    const meanDev = sumDev / period;

    const cci = (currentTp - currentSma) / (0.015 * meanDev);
    results.push({ time: data[i].time, value: cci });
  }
  return results;
};

export const calculateATR = (data, period = 14) => {
  const tr = [];
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      tr.push(data[i].high - data[i].low);
      continue;
    }
    const hl = data[i].high - data[i].low;
    const hc = Math.abs(data[i].high - data[i - 1].close);
    const lc = Math.abs(data[i].low - data[i - 1].close);
    tr.push(Math.max(hl, hc, lc));
  }

  // Wilder's Smoothing for ATR
  const results = [];
  let atr = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for(let i=0; i<data.length; i++) {
      if (i < period - 1) {
          results.push({ time: data[i].time, value: NaN });
      } else if (i === period - 1) {
          results.push({ time: data[i].time, value: atr });
      } else {
          atr = (atr * (period - 1) + tr[i]) / period;
          results.push({ time: data[i].time, value: atr });
      }
  }
  return results;
};

export const calculateADX = (data, period = 14) => {
  // Simplified ADX
  const tr = [];
  const dmPlus = [];
  const dmMinus = [];

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
        tr.push(0); dmPlus.push(0); dmMinus.push(0);
        continue;
    }
    
    // TR
    const hl = data[i].high - data[i].low;
    const hc = Math.abs(data[i].high - data[i - 1].close);
    const lc = Math.abs(data[i].low - data[i - 1].close);
    tr.push(Math.max(hl, hc, lc));

    // DM
    const upMove = data[i].high - data[i - 1].high;
    const downMove = data[i - 1].low - data[i].low;

    if (upMove > downMove && upMove > 0) dmPlus.push(upMove);
    else dmPlus.push(0);

    if (downMove > upMove && downMove > 0) dmMinus.push(downMove);
    else dmMinus.push(0);
  }

  // Smoothed
  const smooth = (arr, idx, prevVal) => (prevVal * (period - 1) + arr[idx]) / period;
  
  let trS = tr.slice(1, period+1).reduce((a,b)=>a+b,0);
  let dmPlusS = dmPlus.slice(1, period+1).reduce((a,b)=>a+b,0);
  let dmMinusS = dmMinus.slice(1, period+1).reduce((a,b)=>a+b,0);

  const results = [];
  
  const diPlusArr = [];
  const diMinusArr = [];
  const dxArr = [];

  for(let i=0; i<data.length; i++) {
      if (i <= period) {
          results.push({ time: data[i].time, adx: NaN, diPlus: NaN, diMinus: NaN });
          diPlusArr.push(0); diMinusArr.push(0); dxArr.push(0);
          continue;
      }
      
      trS = smooth(tr, i, trS);
      dmPlusS = smooth(dmPlus, i, dmPlusS);
      dmMinusS = smooth(dmMinus, i, dmMinusS);

      const diPlus = 100 * (dmPlusS / trS);
      const diMinus = 100 * (dmMinusS / trS);
      const dx = 100 * Math.abs(diPlus - diMinus) / (diPlus + diMinus);

      diPlusArr.push(diPlus);
      diMinusArr.push(diMinus);
      dxArr.push(dx);

      // ADX is smoothed DX
      if (i < period * 2) {
          results.push({ time: data[i].time, adx: NaN, diPlus, diMinus });
      } else {
          // Ideally simple average of DX for first value, then smoothed
          // Using simple EMA for now
          const adxSlice = dxArr.slice(i - period + 1, i + 1);
          const adx = adxSlice.reduce((a,b)=>a+b,0) / period; 
          // Note: Real ADX smoothing is slightly different but this approximates well
          results.push({ time: data[i].time, adx, diPlus, diMinus });
      }
  }
  return results;
};

export const calculateOBV = (data) => {
  const results = [];
  let obv = 0;
  for (let i = 0; i < data.length; i++) {
    if (i > 0) {
      if (data[i].close > data[i - 1].close) obv += data[i].volume;
      else if (data[i].close < data[i - 1].close) obv -= data[i].volume;
    }
    results.push({ time: data[i].time, value: obv });
  }
  return results;
};

export const calculateAccumulationDistribution = (data) => {
    const results = [];
    let ad = 0;
    for (let i = 0; i < data.length; i++) {
        const h = data[i].high;
        const l = data[i].low;
        const c = data[i].close;
        const v = data[i].volume;
        
        const mfm = ((c - l) - (h - c)) / (h - l === 0 ? 1 : h - l);
        const mfv = mfm * v;
        ad += mfv;
        
        results.push({ time: data[i].time, value: ad });
    }
    return results;
};

export const calculateMACD = (data, fast = 12, slow = 26, signal = 9) => {
    // We already have this in technicalIndicators.js but for consistency of this file:
    // We will assume data availability and use the other utility if needed, 
    // or just implement simply here.
    const fastEMA = calculateEMA(data, fast);
    const slowEMA = calculateEMA(data, slow);
    
    const macdLine = [];
    for(let i=0; i<data.length; i++) {
       const f = fastEMA[i].value;
       const s = slowEMA[i].value;
       if(isNaN(f) || isNaN(s)) {
           macdLine.push({ time: data[i].time, value: NaN });
       } else {
           macdLine.push({ time: data[i].time, value: f - s });
       }
    }

    const signalEMA = calculateEMA(macdLine.map(m => ({ time: m.time, close: m.value })), signal);

    return macdLine.map((m, i) => ({
        time: m.time,
        macd: m.value,
        signal: signalEMA[i].value,
        histogram: m.value - signalEMA[i].value
    }));
};

export const calculateHistoricalVolatility = (data, period = 10) => {
    const results = [];
    const logReturns = [];
    
    for(let i=1; i<data.length; i++) {
        logReturns.push(Math.log(data[i].close / data[i-1].close));
    }
    // Pad first
    logReturns.unshift(0);

    for(let i=0; i<data.length; i++) {
        if(i < period) {
            results.push({ time: data[i].time, value: NaN });
            continue;
        }
        
        const slice = logReturns.slice(i-period+1, i+1);
        const mean = slice.reduce((a,b)=>a+b,0)/period;
        const variance = slice.reduce((a,b)=>a + Math.pow(b-mean, 2), 0) / (period - 1);
        const stdDev = Math.sqrt(variance);
        const hv = stdDev * Math.sqrt(365) * 100; // Annualized

        results.push({ time: data[i].time, value: hv });
    }
    return results;
};