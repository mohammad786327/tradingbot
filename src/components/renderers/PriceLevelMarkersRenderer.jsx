import React from 'react';
// Logic-only file.

const COLORS = {
  long: '#ef4444',
  short: '#22c55e',
  total: '#3b82f6',
};

export const renderPriceLevelMarkers = ({ series, type, liquidationData }) => {
  if (!series || !liquidationData) return [];

  const markers = [];
  const relevantLiqs = liquidationData.filter(d => type === 'total' || d.type === type);

  // Take top 5 levels to avoid clutter
  relevantLiqs.slice(0, 5).forEach(level => {
    const priceLine = {
      price: level.price,
      color: COLORS[type],
      lineWidth: 1,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: `${(level.volume / 1000000).toFixed(1)}M`,
    };

    const lineObj = series.createPriceLine(priceLine);
    markers.push(lineObj);
  });

  return markers;
};