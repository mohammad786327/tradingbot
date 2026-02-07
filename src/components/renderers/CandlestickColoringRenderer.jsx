// Applies coloring to candlesticks based on liquidation intensity
export const colorCandlesticks = ({ series, type, liquidationData, chartData }) => {
    if (!series || !liquidationData || !chartData || chartData.length === 0) return null;
    
    const relevantLiqs = liquidationData.filter(d => type === 'total' || d.type === type);
    if (relevantLiqs.length === 0) return null;

    const maxVol = Math.max(...relevantLiqs.map(d => d.volume));

    // Create a new data array with color properties
    const coloredData = chartData.map(candle => {
        // Find liquidations that fall within this candle's range (Low to High)
        // We add a small buffer (0.1%) to catch levels just touching
        const rangeBuffer = candle.close * 0.001; 
        const low = candle.low - rangeBuffer;
        const high = candle.high + rangeBuffer;

        const intersectingLiqs = relevantLiqs.filter(l => l.price >= low && l.price <= high);
        
        if (intersectingLiqs.length > 0) {
            // Calculate total intensity for this candle
            const totalVol = intersectingLiqs.reduce((sum, l) => sum + l.volume, 0);
            const normalizedVol = Math.min(totalVol / maxVol, 1); // Cap at 1

            // Determine color based on intensity
            let candleColor, wickColor;
            
            if (normalizedVol < 0.33) {
                 // Low intensity: Green-ish tint
                 candleColor = '#4ade80'; 
                 wickColor = '#4ade80';
            } else if (normalizedVol < 0.66) {
                 // Medium intensity: Yellow/Orange
                 candleColor = '#facc15';
                 wickColor = '#facc15';
            } else {
                 // High intensity: Red/Purple
                 candleColor = '#f43f5e';
                 wickColor = '#f43f5e';
            }

            return {
                ...candle,
                color: candleColor,
                wickColor: wickColor,
                borderColor: wickColor
            };
        }
        
        // Return original candle if no intersection (undefined colors revert to series default)
        // Explicitly undefined to ensure default series styling applies if needed, 
        // OR we can explicitly set them to null/default if we want to reset.
        // Lightweight charts uses specific property names. If omitted, it uses series options.
        // However, if we are mixing colored and uncolored, best to leave standard ones alone.
        return {
            ...candle,
            color: undefined, 
            wickColor: undefined, 
            borderColor: undefined
        };
    });

    return coloredData;
};