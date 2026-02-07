// Utility to safely execute user defined indicator code
export const executeCustomIndicator = (code, chartData) => {
  if (!chartData || !Array.isArray(chartData) || chartData.length === 0) return [];

  try {
    // Prepare data arrays
    const open = chartData.map(d => d.open);
    const high = chartData.map(d => d.high);
    const low = chartData.map(d => d.low);
    const close = chartData.map(d => d.close);
    const volume = chartData.map(d => d.volume);
    const times = chartData.map(d => d.time);

    // We wrap the user code in a function body
    // The user code should return an array of values corresponding to the input arrays
    // Example User Code:
    // return close.map((c, i) => c > open[i] ? 1 : 0);
    
    // eslint-disable-next-line no-new-func
    const userFunc = new Function('open', 'high', 'low', 'close', 'volume', code);
    
    const results = userFunc(open, high, low, close, volume);

    if (!Array.isArray(results)) {
        console.warn("[CustomIndicator] Result is not an array");
        return [];
    }

    if (results.length === 0) {
        return [];
    }

    // Map back to time-value pairs for Lightweight Charts
    // Ensure we don't exceed bounds of original data if user returns different length
    const maxLength = Math.min(results.length, times.length);
    const mappedData = [];

    // Assuming user returns array matching end of data (most recent)
    // If lengths differ, we align from the end
    const offset = times.length - results.length;

    for (let i = 0; i < results.length; i++) {
        const timeIndex = i + offset;
        if (timeIndex >= 0 && timeIndex < times.length) {
            const val = results[i];
            if (val !== undefined && val !== null && !isNaN(val)) {
                mappedData.push({
                    time: times[timeIndex],
                    value: Number(val)
                });
            }
        }
    }

    return mappedData;

  } catch (err) {
    console.error("[CustomIndicator] Execution error:", err);
    // Return empty array instead of throwing to prevent crashing the chart
    return [];
  }
};