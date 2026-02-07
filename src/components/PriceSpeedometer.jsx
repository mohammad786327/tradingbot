import React, { useEffect, useState, useRef } from 'react';
import SpeedometerMeter from './SpeedometerMeter';
import { binanceWS } from '@/utils/binanceWebSocket';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const PriceSpeedometer = ({ symbol, dollarTarget = 0, className }) => {
  const [data, setData] = useState({
    current: 0,
    open: 0,
    change: 0
  });
  const [loading, setLoading] = useState(true);
  const subRef = useRef(null);

  useEffect(() => {
    if (!symbol) return;
    
    setLoading(true);
    let isMounted = true;
    
    // Subscribe to kline 1m to get Open and Close(Current) prices
    const handleKline = (update) => {
        if (!isMounted) return;
        if (update && update.k) {
            const k = update.k;
            const current = parseFloat(k.c);
            const open = parseFloat(k.o);
            const change = current - open;
            
            setData({
                current,
                open,
                change
            });
            setLoading(false);
        }
    };
    
    // Initial fetch to populate data immediately
    const fetchInitialData = async () => {
        try {
            const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=1`);
            const klines = await response.json();
            
            if (isMounted && klines && klines.length > 0) {
                const lastKline = klines[0]; 
                const current = parseFloat(lastKline[4]);
                const open = parseFloat(lastKline[1]);
                
                setData({
                    current,
                    open,
                    change: current - open
                });
                setLoading(false);
            }
        } catch (err) {
            console.error("[PriceSpeedometer] Initial fetch failed:", err);
        }
    };

    fetchInitialData();

    // Subscribe to WebSocket
    subRef.current = binanceWS.subscribe([symbol], 'kline', '1m', handleKline);
    
    return () => {
        isMounted = false;
        if (subRef.current) {
            binanceWS.unsubscribe(subRef.current);
            subRef.current = null;
        }
    };
  }, [symbol]);

  if (loading && !data.current) {
      return (
          <div className={cn("absolute z-20 flex items-center justify-center p-2 bg-[#0f0f0f]/50 rounded-lg backdrop-blur-sm", className)}>
              <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
          </div>
      );
  }

  // Determine effective range/threshold for the gauge
  const targetVal = parseFloat(dollarTarget);
  const effectiveThreshold = !isNaN(targetVal) && targetVal > 0 
      ? targetVal 
      : (data.current * 0.005); 

  return (
    <div className={cn("absolute z-20 transition-all duration-300 hover:opacity-10 opacity-90 hover:pointer-events-none origin-top-left", className)}>
        <SpeedometerMeter 
            value={data.change}
            min={-effectiveThreshold}
            max={effectiveThreshold}
            currentPrice={data.current}
            dollarTarget={effectiveThreshold}
        />
    </div>
  );
};

export default PriceSpeedometer;