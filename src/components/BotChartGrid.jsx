import React, { useState, useEffect, useRef, useMemo } from 'react';
import ChartPanel from './ChartPanel';
import PriceSpeedometer from './PriceSpeedometer';
import PriceMovementStatusGrid from './PriceMovementStatusGrid';
import { Activity, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { binanceWS } from '@/utils/binanceWebSocket';

// Defined outside to prevent re-creation on render
const TIMEFRAME_OPTIONS = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'];

// Individual Card Component to handle subscription and state per symbol
const MonitoringCard = ({ symbol, timeframe, dollarTarget, selectedPosition }) => {
  const [marketData, setMarketData] = useState({
    price: 0,
    open: 0,
    change: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;
    
    setLoading(true);
    let isMounted = true;
    
    const handleKline = (data) => {
        if (!isMounted) return;
        if (data.k) {
            const k = data.k;
            const current = parseFloat(k.c);
            const open = parseFloat(k.o);
            const change = current - open;
            
            setMarketData({
                price: current,
                open: open,
                change: change
            });
            setLoading(false);
        }
    };

    // Initial fetch to avoid waiting for first socket message
    const fetchInitial = async () => {
        try {
            const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=1`);
            const data = await res.json();
            if (isMounted && data && data.length > 0) {
                const k = data[0]; // [time, open, high, low, close...]
                const current = parseFloat(k[4]);
                const open = parseFloat(k[1]);
                setMarketData({
                    price: current,
                    open: open,
                    change: current - open
                });
                setLoading(false);
            }
        } catch (e) {
            console.error("Initial fetch failed", e);
        }
    };

    fetchInitial();

    const sub = binanceWS.subscribe([symbol], 'kline', timeframe, handleKline);

    return () => {
        isMounted = false;
        if (sub) {
            binanceWS.unsubscribe(sub);
        }
    };
  }, [symbol, timeframe]);

  // Calculations for Status Grid
  const upwardStats = useMemo(() => {
    // If change is positive, we have progress. If negative, progress is 0.
    const change = marketData.change;
    const isPositive = change > 0;
    
    // Progress towards target
    // If movement is +10 and target is 50, progress is 20%
    const progress = isPositive ? (change / dollarTarget) * 100 : 0;
    const needed = Math.max(0, dollarTarget - (isPositive ? change : 0));
    
    return {
        change: isPositive ? change : 0,
        needed: needed,
        progress: progress
    };
  }, [marketData.change, dollarTarget]);

  const downwardStats = useMemo(() => {
    // If change is negative, we have progress (absolute value).
    const change = marketData.change;
    const isNegative = change < 0;
    const absChange = Math.abs(change);
    
    const progress = isNegative ? (absChange / dollarTarget) * 100 : 0;
    const needed = Math.max(0, dollarTarget - (isNegative ? absChange : 0));
    
    return {
        change: isNegative ? change : 0,
        needed: needed,
        progress: progress
    };
  }, [marketData.change, dollarTarget]);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full min-h-[450px] relative group"
    >
        {/* Chart Container - Flex grow to take available space */}
        <div className="relative flex-1 min-h-[300px] rounded-2xl overflow-hidden border border-[#2a2a2a] bg-[#1a1a1a]">
             {/* Speedometer Overlay */}
             <PriceSpeedometer 
                symbol={symbol} 
                dollarTarget={dollarTarget}
                className="top-[52px] left-4 scale-75 origin-top-left md:scale-90"
             />
             
             <ChartPanel 
                  symbol={symbol} 
                  timeframe={timeframe} 
                  entryPrice={selectedPosition?.entryPrice}
                  stopLoss={null}
                  takeProfit={null}
              />
        </div>

        {/* Status Grid - Fixed height at bottom */}
        <div className="shrink-0 pt-2">
            <PriceMovementStatusGrid 
                upwardData={upwardStats}
                downwardData={downwardStats}
                dollarTarget={dollarTarget}
            />
        </div>
    </motion.div>
  );
};

const BotChartGrid = ({ symbols, selectedPosition, previewDollarTarget }) => {
  const [timeframe, setTimeframe] = useState('15m');

  // Determine which symbols to display
  const displaySymbols = selectedPosition 
    ? (selectedPosition.symbols || [selectedPosition.symbol]) 
    : (symbols || []);
  
  // Filter out any undefined/null symbols
  const validSymbols = displaySymbols.filter(Boolean);
  
  // Extract dollar target logic
  const dollarTarget = selectedPosition 
      ? parseFloat(selectedPosition.dollarTarget || selectedPosition.margin || 0)
      : parseFloat(previewDollarTarget || 0);

  if (validSymbols.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#2a2a2a] h-full min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <Activity size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {selectedPosition 
              ? 'No symbols in selected position.' 
              : 'Select a template or custom symbol to preview charts.'}
          </p>
        </div>
      </div>
    );
  }

  // Determine grid columns
  const getGridClass = (count) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'; // 3 cols for 5+ items
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] p-4 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 px-2 gap-4 sm:gap-0">
         <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
           {selectedPosition ? (
             <>
               <span className="text-blue-400">Monitoring:</span>
               <span>{selectedPosition.botName || 'Selected Bot'}</span>
             </>
           ) : (
             'Strategy Preview'
           )}
         </h3>
         <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
            {/* Timeframe Selector - Inline for stability */}
            <div className="flex bg-[#0f0f0f] p-1 rounded-xl border border-[#2a2a2a] scale-90 sm:scale-100 origin-right">
              {TIMEFRAME_OPTIONS.map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                    timeframe === tf
                      ? 'bg-[#2a2a2a] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs text-green-500 font-mono">Connected</span>
            </div>
         </div>
      </div>
      
      <div className={`grid ${getGridClass(validSymbols.length)} gap-4 h-full min-h-[400px] auto-rows-fr transition-all duration-500 ease-in-out`}>
        <AnimatePresence mode="popLayout">
          {validSymbols.map(symbol => (
            <MonitoringCard 
                key={symbol}
                symbol={symbol}
                timeframe={timeframe}
                dollarTarget={dollarTarget}
                selectedPosition={selectedPosition}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BotChartGrid;