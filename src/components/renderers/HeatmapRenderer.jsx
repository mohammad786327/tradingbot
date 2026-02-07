import React from 'react';

// Renders a liquidation heatmap using semi-transparent price lines to simulate density
export const renderHeatmap = ({ series, type, liquidationData }) => {
  if (!series || !liquidationData || liquidationData.length === 0) return [];

  const markers = [];
  const relevantLiqs = liquidationData.filter(d => type === 'total' || d.type === type);
  
  if (relevantLiqs.length === 0) return [];

  // 1. Calculate max volume for normalization
  const maxVol = Math.max(...relevantLiqs.map(d => d.volume));

  // 2. Create heatmap lines
  relevantLiqs.forEach(level => {
    const intensity = level.volume / maxVol;
    
    // Color mapping: Green (Low) -> Yellow (Med) -> Red (High)
    let color;
    if (intensity < 0.33) {
       // Green with varying opacity
       color = `rgba(34, 197, 94, ${0.1 + intensity})`; 
    } else if (intensity < 0.66) {
       // Yellow
       color = `rgba(234, 179, 8, ${0.1 + intensity})`;
    } else {
       // Red
       color = `rgba(239, 68, 68, ${0.1 + intensity})`;
    }

    const priceLine = {
      price: level.price,
      color: color,
      lineWidth: 2, // Thicker lines for heatmap effect
      lineStyle: 0, // Solid
      axisLabelVisible: false, // Don't clutter axis
      title: '',
    };

    const lineObj = series.createPriceLine(priceLine);
    markers.push(lineObj);
  });

  return markers;
};