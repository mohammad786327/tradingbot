export const calculateGridLines = (lowerPrice, upperPrice, numGrids, spacingType, spacingValue) => {
  const minPrice = parseFloat(lowerPrice);
  const maxPrice = parseFloat(upperPrice);
  const grids = parseInt(numGrids); // Number of intervals

  if (isNaN(minPrice) || isNaN(maxPrice) || isNaN(grids) || grids < 2 || minPrice >= maxPrice) {
    // console.warn("Invalid grid parameters:", { lowerPrice, upperPrice, numGrids });
    return [];
  }

  const lines = [];
  // Calculate midpoint for static type assignment (Task 2)
  const midpoint = (minPrice + maxPrice) / 2;

  if (spacingType === 'Fixed') {
    // Fixed: Equal spacing
    // Step size = (max - min) / grids
    const step = (maxPrice - minPrice) / grids;
    
    // Generate lines including boundaries (0 to grids)
    for (let i = 0; i <= grids; i++) {
      const price = minPrice + (i * step);
      lines.push({
        price: price,
        label: i === 0 ? 'LOWER' : i === grids ? 'UPPER' : `GRID ${i}`,
        type: price < midpoint ? 'buy' : 'sell'
      });
    }
  } else if (spacingType === 'Percentage') {
    // Percentage: Geometric or fixed percentage step
    const percent = parseFloat(spacingValue);

    // If a valid specific percentage is provided, use it (Task 2 requirement)
    if (!isNaN(percent) && percent > 0) {
        let currentPrice = minPrice;
        // Generate lines starting from lowerPrice
        for (let i = 0; i <= grids; i++) {
             lines.push({
                price: currentPrice,
                label: i === 0 ? 'LOWER' : `GRID ${i}`,
                type: currentPrice < midpoint ? 'buy' : 'sell'
             });
             currentPrice = currentPrice * (1 + (percent / 100));
        }
    } else {
        // Fallback to geometric distribution fitting the range exactly
        // ratio ^ grids = max / min
        const ratio = Math.pow(maxPrice / minPrice, 1 / grids);
        let currentPrice = minPrice;
        
        for (let i = 0; i <= grids; i++) {
             lines.push({
                price: currentPrice,
                label: i === 0 ? 'LOWER' : i === grids ? 'UPPER' : `GRID ${i}`,
                type: currentPrice < midpoint ? 'buy' : 'sell'
             });
             currentPrice = currentPrice * ratio;
        }
    }
  }

  return lines;
};