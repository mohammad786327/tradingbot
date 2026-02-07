import React, { useEffect, useRef } from 'react';

// This component is designed to be a "Logic Component" or sub-renderer
// It doesn't render its own DOM if passed a chart instance, 
// OR it manages a synced chart if used separately.
// Per best practices with lightweight-charts for "Volume under price", 
// we typically add a HistogramSeries to the MAIN chart with a separate priceScaleId.

const VolumeChart = ({ chart, data, visible }) => {
  const seriesRef = useRef(null);

  useEffect(() => {
    if (!chart || !data) return;

    if (!seriesRef.current) {
      // Create volume series on the main chart
      seriesRef.current = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume', // Separate scale
      });

      // Configure the volume scale to sit at the bottom
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8, // Highest volume bar is at 80% down (leaving top 80% for price)
          bottom: 0,
        },
        visible: false, // Hide the numbers on the axis
      });
    }

    // Format data for volume (color coding)
    const volumeData = data.map((d, i) => {
        const prev = i > 0 ? data[i-1].close : d.open;
        const color = d.close >= prev ? 'rgba(74, 222, 128, 0.5)' : 'rgba(248, 113, 113, 0.5)';
        return {
            time: d.time,
            value: d.volume, // Ensure your data provider includes 'volume'
            color: color
        };
    });

    seriesRef.current.setData(volumeData);
    
    if (visible === false) {
        seriesRef.current.applyOptions({ visible: false });
    } else {
        seriesRef.current.applyOptions({ visible: true });
    }

    return () => {
      if (seriesRef.current && chart) {
        chart.removeSeries(seriesRef.current);
        seriesRef.current = null;
      }
    };
  }, [chart, data, visible]);

  return null; // Logic-only component that manipulates the parent chart
};

export default VolumeChart;