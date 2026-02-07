import React, { useEffect, useRef, useState } from 'react';
import IndicatorPanel from './IndicatorPanel';
import ErrorIndicatorFallback from './ErrorIndicatorFallback';
import { 
  calculateRSI, calculateStochastic, calculateWilliamsR, calculateROC, 
  calculateCCI, calculateATR, calculateADX, calculateOBV, 
  calculateAccumulationDistribution, calculateMACD, calculateHistoricalVolatility 
} from '@/utils/indicatorCalculations';
import { executeCustomIndicator } from '@/utils/customIndicatorExecutor';

const IndicatorPanelRenderer = ({ 
  panel, 
  chartData, 
  onRemove, 
  onRegister, 
  height 
}) => {
  const chartInstanceRef = useRef(null);
  const seriesRefs = useRef([]);
  const [renderError, setRenderError] = useState(null);

  const updateChart = (chart) => {
    if (!chart) return;
    
    try {
        // Safe clear of previous series
        if (seriesRefs.current.length > 0) {
            seriesRefs.current.forEach(s => {
                try {
                    chart.removeSeries(s);
                } catch(e) {
                    console.warn("Failed to remove series", e);
                }
            });
        }
        seriesRefs.current = [];

        if (!chartData || chartData.length === 0) return;

        const { type, isCustom, code } = panel;
        
        // Custom Script Rendering
        if (isCustom) {
            const data = executeCustomIndicator(code, chartData);
            if (data && data.length > 0) {
                const series = chart.addLineSeries({ 
                    color: panel.color || '#e879f9', 
                    lineWidth: 2 
                });
                series.setData(data);
                seriesRefs.current.push(series);
            }
            return;
        }
        
        // Standard Rendering logic...
        // Wrapped in try-catch by parent function, but individual calculations should be safe too
        if (type === 'RSI') {
            const data = calculateRSI(chartData, 14);
            const series = chart.addLineSeries({ color: '#a78bfa', lineWidth: 2 });
            series.setData(data.filter(d => !isNaN(d.value)));
            
            series.createPriceLine({ price: 70, color: '#ef4444', lineWidth: 1, lineStyle: 2, axisLabelVisible: false });
            series.createPriceLine({ price: 30, color: '#22c55e', lineWidth: 1, lineStyle: 2, axisLabelVisible: false });
            
            seriesRefs.current.push(series);
        }
        else if (type === 'MACD') {
            const data = calculateMACD(chartData);
            
            const histogramSeries = chart.addHistogramSeries({ color: '#26a69a' });
            const macdSeries = chart.addLineSeries({ color: '#2962FF', lineWidth: 2 });
            const signalSeries = chart.addLineSeries({ color: '#FF6D00', lineWidth: 2 });

            const histData = data.map(d => ({ 
                time: d.time, 
                value: d.histogram, 
                color: d.histogram > 0 ? '#26a69a' : '#ef5350' 
            }));
            
            histogramSeries.setData(histData.filter(d => !isNaN(d.value)));
            macdSeries.setData(data.map(d => ({ time: d.time, value: d.macd })).filter(d => !isNaN(d.value)));
            signalSeries.setData(data.map(d => ({ time: d.time, value: d.signal })).filter(d => !isNaN(d.value)));

            seriesRefs.current.push(histogramSeries, macdSeries, signalSeries);
        }
        else if (type === 'Stochastic') {
            const data = calculateStochastic(chartData);
            const kSeries = chart.addLineSeries({ color: '#2962FF', lineWidth: 2 });
            const dSeries = chart.addLineSeries({ color: '#FF6D00', lineWidth: 2 });
            
            kSeries.setData(data.map(d => ({ time: d.time, value: d.k })).filter(d => !isNaN(d.value)));
            dSeries.setData(data.map(d => ({ time: d.time, value: d.d })).filter(d => !isNaN(d.value)));
            
            seriesRefs.current.push(kSeries, dSeries);
        }
        else if (type === 'Volume') {
            const series = chart.addHistogramSeries({ 
                color: '#26a69a',
                priceFormat: { type: 'volume' },
            });
            const volData = chartData.map(d => ({
                time: d.time,
                value: d.volume,
                color: d.close >= d.open ? '#26a69a' : '#ef5350'
            }));
            series.setData(volData);
            seriesRefs.current.push(series);
        }
        else if (['Williams %R', 'ROC', 'CCI', 'ATR', 'OBV', 'Accumulation/Distribution', 'Historical Volatility'].includes(type)) {
            let data = [];
            let color = '#3b82f6';
            
            if (type === 'Williams %R') data = calculateWilliamsR(chartData);
            if (type === 'ROC') data = calculateROC(chartData);
            if (type === 'CCI') { data = calculateCCI(chartData); color = '#f59e0b'; }
            if (type === 'ATR') { data = calculateATR(chartData); color = '#ef4444'; }
            if (type === 'OBV') data = calculateOBV(chartData);
            if (type === 'Accumulation/Distribution') data = calculateAccumulationDistribution(chartData);
            if (type === 'Historical Volatility') data = calculateHistoricalVolatility(chartData);

            const series = chart.addLineSeries({ color, lineWidth: 2 });
            series.setData(data.filter(d => !isNaN(d.value)));
            seriesRefs.current.push(series);
        }
        else if (type === 'ADX') {
            const data = calculateADX(chartData);
            const adxSeries = chart.addLineSeries({ color: '#f59e0b', lineWidth: 2 });
            const diPlusSeries = chart.addLineSeries({ color: '#22c55e', lineWidth: 1 });
            const diMinusSeries = chart.addLineSeries({ color: '#ef4444', lineWidth: 1 });

            adxSeries.setData(data.map(d => ({ time: d.time, value: d.adx })).filter(d => !isNaN(d.value)));
            diPlusSeries.setData(data.map(d => ({ time: d.time, value: d.diPlus })).filter(d => !isNaN(d.value)));
            diMinusSeries.setData(data.map(d => ({ time: d.time, value: d.diMinus })).filter(d => !isNaN(d.value)));

            seriesRefs.current.push(adxSeries, diPlusSeries, diMinusSeries);
        }
    } catch (err) {
        console.error("Error updating indicator chart:", err);
        setRenderError(`Failed to render ${panel.name || panel.type}: ${err.message}`);
    }
  };

  useEffect(() => {
    if (chartInstanceRef.current && !renderError) {
        updateChart(chartInstanceRef.current);
    }
  }, [chartData, panel, renderError]);

  const handleChartReady = (chart) => {
      chartInstanceRef.current = chart;
      updateChart(chart);
      if (onRegister) onRegister(panel.id, chart);
  };

  if (renderError) {
      return (
          <ErrorIndicatorFallback 
            indicatorName={panel.name || panel.type}
            error={renderError}
            onRemove={() => onRemove(panel.id)}
            onRetry={() => setRenderError(null)}
          />
      );
  }

  return (
    <IndicatorPanel 
        title={panel.name || panel.type} 
        onRemove={() => onRemove(panel.id)}
        onChartReady={handleChartReady}
        height={height}
    />
  );
};

export default IndicatorPanelRenderer;