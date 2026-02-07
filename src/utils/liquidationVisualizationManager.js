import { renderHeatmap } from '@/components/renderers/HeatmapRenderer';
import { renderOverlayBands } from '@/components/renderers/OverlayBandsRenderer';
import { renderPriceLevelMarkers } from '@/components/renderers/PriceLevelMarkersRenderer';
import { colorCandlesticks } from '@/components/renderers/CandlestickColoringRenderer';

const visualizationRenderers = {
  Heatmap: renderHeatmap,
  'Overlay Bands': renderOverlayBands,
  'Price Level Markers': renderPriceLevelMarkers,
  'Candlestick Coloring': colorCandlesticks,
  'Separate Panel': () => null, // Handled by React component
};

// State to keep track of chart series/markers added by this manager
const managedChartElements = {
  bands: [],
  markers: [], // Used for both PriceMarkers and Heatmap lines
  isColored: false,
};

const clearVisualizations = (chart, series, originalData) => {
  if (!chart && !series) return;

  // Clear Bands (Custom Series)
  Object.values(managedChartElements.bands).flat().forEach(band => {
      try {
          chart.removeSeries(band);
      } catch (e) {
          console.warn("Failed to remove band series", e);
      }
  });
  managedChartElements.bands = [];

  // Clear Markers/Heatmap Lines (PriceLines)
  Object.values(managedChartElements.markers).flat().forEach(marker => {
      try {
          series.removePriceLine(marker);
      } catch (e) {
         console.warn("Failed to remove price line", e);
      }
  });
  managedChartElements.markers = [];

  // Reset Candle Colors if they were modified
  if (managedChartElements.isColored && originalData && series) {
      series.setData(originalData);
      managedChartElements.isColored = false;
  }
};

export const updateLiquidationVisualizations = (chart, series, settings, liquidationData, chartData) => {
  if (!chart || !series) return;

  // Always clear first
  clearVisualizations(chart, series, chartData);

  if (!settings.enabled || !liquidationData || liquidationData.length === 0) {
    return;
  }
  
  const activeTypes = ['long', 'short', 'total'].filter(type => settings.types[type].enabled);
  
  // Track if we've applied coloring to avoid overwriting or conflict
  let coloringApplied = false;

  for (const type of activeTypes) {
    const vizStyle = settings.types[type].style;
    
    // Special handling for Candlestick Coloring
    if (vizStyle === 'Candlestick Coloring') {
        if (!coloringApplied) { // Only apply once per update to avoid conflict, or could merge logic
            const coloredData = colorCandlesticks({ series, type, liquidationData, chartData });
            if (coloredData) {
                series.setData(coloredData);
                managedChartElements.isColored = true;
                coloringApplied = true;
            }
        }
        continue; 
    }

    const renderer = visualizationRenderers[vizStyle];
    
    if (renderer) {
      const result = renderer({
        chart,
        series,
        type,
        liquidationData,
        chartData
      });

      if (result) {
        if (vizStyle === 'Overlay Bands') {
             if (!managedChartElements.bands[type]) managedChartElements.bands[type] = [];
             managedChartElements.bands[type].push(...result);
        } else if (vizStyle === 'Price Level Markers' || vizStyle === 'Heatmap') {
             // Both use PriceLines attached to the series
             if (!managedChartElements.markers[type]) managedChartElements.markers[type] = [];
             managedChartElements.markers[type].push(...result);
        }
      }
    }
  }
};