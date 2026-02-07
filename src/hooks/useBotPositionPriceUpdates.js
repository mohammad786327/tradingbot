
import { useState, useEffect, useRef } from 'react';
import { binanceWS } from '@/utils/binanceWebSocket';

/**
 * Hook to provide real-time price updates for bot positions.
 * Calculates live PnL based on incoming ticker data.
 * Supports Candle Strike, RSI Bots, and standard trades.
 */
export const useBotPositionPriceUpdates = (initialPositions = []) => {
  const [positions, setPositions] = useState(initialPositions);
  const activeSubscription = useRef(null);

  // Sync with prop changes
  useEffect(() => {
    setPositions(initialPositions);
  }, [initialPositions]);

  useEffect(() => {
    if (positions.length === 0) return;

    // Identify symbols to track
    // Only track symbols for Active positions to save bandwidth
    const activeSymbols = [...new Set(
      positions
        .filter(p => {
            const s = p.status?.toUpperCase();
            return s === 'ACTIVE' || s === 'OPEN' || s === 'RUNNING';
        })
        .map(p => p.symbol)
    )];

    if (activeSymbols.length === 0) return;

    const handlePriceUpdate = (data) => {
        // data.s = symbol, data.c = price
        if (!data.s || !data.c) return;
        
        const currentPrice = parseFloat(data.c);

        setPositions(prevPositions => {
           let hasChanges = false;
           
           const updated = prevPositions.map(pos => {
               // Match symbol and ensure it's a live position
               const isActive = ['ACTIVE', 'OPEN', 'RUNNING'].includes(pos.status?.toUpperCase());

               if (pos.symbol === data.s && isActive) {
                   
                   // Only update if price is different significantly
                   if (Math.abs(pos.currentPrice - currentPrice) > Number.EPSILON) {
                       const entryPrice = pos.entryPrice || currentPrice;
                       
                       // Skip PnL calc if we don't have a valid entry price (waiting state)
                       if (entryPrice <= 0) {
                           if (pos.currentPrice !== currentPrice) {
                               hasChanges = true;
                               return { ...pos, currentPrice };
                           }
                           return pos;
                       }

                       const leverage = pos.leverage || 1;
                       const margin = pos.amount || 0; // Using 'amount' which we mapped to margin
                       const directionMultiplier = (pos.direction === 'LONG' || pos.direction === 'Long') ? 1 : -1;

                       // Calculate PnL
                       const priceChangePct = (currentPrice - entryPrice) / entryPrice;
                       const pnlPercentage = priceChangePct * directionMultiplier * leverage * 100;
                       const pnl = (pnlPercentage / 100) * margin;

                       hasChanges = true;
                       return {
                           ...pos,
                           currentPrice,
                           pnl,
                           pnlPercent: pnlPercentage
                       };
                   }
               }
               return pos;
           });

           return hasChanges ? updated : prevPositions;
        });
    };

    // Subscribe
    activeSubscription.current = binanceWS.subscribe(activeSymbols, 'ticker', null, handlePriceUpdate);

    return () => {
        if (activeSubscription.current) {
            binanceWS.unsubscribe(activeSubscription.current);
        }
    };
  }, [positions.length, JSON.stringify(positions.map(p => p.id))]); 
  // Dependency includes IDs to ensure we resubscribe if list composition changes drastically

  return positions;
};
