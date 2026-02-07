
import { useState, useEffect } from 'react';
import { binanceWS } from '@/utils/binanceWebSocket';

export const useTradesPNL = (trades = []) => {
  const [updatedTrades, setUpdatedTrades] = useState(trades);
  const [prices, setPrices] = useState({});

  useEffect(() => {
    // Initialize with current trades, preserving any existing price data if available
    setUpdatedTrades(prev => {
       // If trades haven't changed by ID, keep the price info
       return trades.map(t => {
          const prevTrade = prev.find(p => p.id === t.id);
          return prevTrade ? { ...t, currentPrice: prevTrade.currentPrice, pnl: prevTrade.pnl } : t;
       });
    });
  }, [trades]);

  useEffect(() => {
    if (!trades.length) return;

    // Extract symbols from either coinName or symbol property
    const symbols = [...new Set(trades.map(t => {
        if (t.symbol) return t.symbol.toUpperCase();
        if (t.coinName) return t.coinName.replace('/', '').toUpperCase();
        return '';
    }).filter(Boolean))];
    
    if (symbols.length === 0) return;

    // Subscribe to Binance WS
    const subscription = binanceWS.subscribe(symbols, 'ticker', '1m', (data) => {
       if (data.e === '24hrTicker') {
         setPrices(prev => ({
           ...prev,
           [data.s]: parseFloat(data.c)
         }));
       }
    });

    return () => {
      if (subscription) {
         binanceWS.unsubscribe(subscription);
      }
    };
  }, [trades]);

  useEffect(() => {
    if (Object.keys(prices).length === 0) return;

    setUpdatedTrades(currentTrades => {
      return currentTrades.map(trade => {
        // Determine symbol for lookup
        let symbol = '';
        if (trade.symbol) symbol = trade.symbol.toUpperCase();
        else if (trade.coinName) symbol = trade.coinName.replace('/', '').toUpperCase();

        const currentPrice = prices[symbol];

        // If no live price yet, fallback to existing or entry
        if (!currentPrice) return trade;

        const isLong = (trade.direction === 'Long' || trade.direction === 'LONG');
        const entryPrice = parseFloat(trade.entryPrice);
        const margin = parseFloat(trade.margin || 0);
        const leverage = parseFloat(trade.leverage || 1);
        
        // PnL Calculation
        // Long: (Current - Entry) / Entry * Margin * Leverage
        // Short: (Entry - Current) / Entry * Margin * Leverage
        
        let diffPercent = 0;
        if (entryPrice > 0) {
            diffPercent = (currentPrice - entryPrice) / entryPrice;
        }

        const pnlPercent = (isLong ? diffPercent : -diffPercent) * 100 * leverage;
        const pnl = (pnlPercent / 100) * margin;

        // Price Change % (Raw market movement)
        const priceChangePercent = diffPercent * 100;

        return {
          ...trade,
          currentPrice,
          pnl: pnl,
          pnlPercent: pnlPercent,
          priceChangePercent: priceChangePercent
        };
      });
    });
  }, [prices, trades]); // Added trades to dependency to ensure we map over latest trade objects

  return { updatedTrades, prices };
};
