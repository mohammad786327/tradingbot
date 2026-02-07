
import { useState, useEffect, useCallback, useMemo } from 'react';
import { binanceWS } from '@/utils/binanceWebSocket';
import { aggregatedPositionManager } from '@/utils/aggregatedPositionManager';

export const useRealTimePositionData = () => {
  const [positions, setPositions] = useState([]);
  const [prices, setPrices] = useState({});
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // 1. Initial Load & Refresh Logic
  const refreshPositions = useCallback(() => {
    const allPositions = aggregatedPositionManager.getAllPositions();
    setPositions(allPositions);
  }, []);

  useEffect(() => {
    refreshPositions();
    // Listen for storage updates (triggered by other tabs or components saving data)
    window.addEventListener('storage-update', refreshPositions);
    return () => window.removeEventListener('storage-update', refreshPositions);
  }, [refreshPositions]);

  // 2. Real-time Price Subscription
  useEffect(() => {
    const activeSymbols = [...new Set(
      positions
        .filter(p => p.status === 'ACTIVE' || p.status === 'WAITING')
        .map(p => p.symbol)
    )];

    if (activeSymbols.length === 0) return;

    const handlePriceUpdate = (data) => {
      // data.s is symbol, data.c is close price
      setPrices(prev => ({
        ...prev,
        [data.s]: parseFloat(data.c)
      }));
      setLastUpdate(Date.now());
    };

    // Subscribe to all symbols needed
    const subscription = binanceWS.subscribe(activeSymbols, 'ticker', null, handlePriceUpdate);

    return () => {
      if (subscription) binanceWS.unsubscribe(subscription);
    };
  }, [positions.length, JSON.stringify(positions.map(p => p.symbol))]);

  // 3. Derived Data with Live Prices
  const enrichedPositions = useMemo(() => {
    return positions.map(pos => {
      const currentPrice = prices[pos.symbol] || pos.currentPrice || pos.entryPrice;
      const entryPrice = pos.entryPrice;
      
      let pnl = pos.pnl;
      let pnlPercent = pos.pnlPercent;

      // Recalculate PnL if active and we have prices
      if (pos.status === 'ACTIVE' && entryPrice > 0 && currentPrice > 0) {
        const directionMultiplier = pos.direction === 'LONG' || pos.direction === 'BUY' ? 1 : -1;
        const priceChangePct = (currentPrice - entryPrice) / entryPrice;
        
        pnlPercent = priceChangePct * directionMultiplier * pos.leverage * 100;
        
        // Calculate raw PnL based on amount/margin
        const margin = pos.amount || pos.quantity * entryPrice / pos.leverage;
        if (!isNaN(margin)) {
            pnl = (pnlPercent / 100) * margin;
        }
      }

      return {
        ...pos,
        currentPrice,
        pnl: pnl || 0,
        pnlPercent: pnlPercent || 0,
        lastUpdate: Date.now()
      };
    });
  }, [positions, prices]);

  return { positions: enrichedPositions, refreshPositions, lastUpdate };
};
