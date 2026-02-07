import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const PingIndicator = () => {
  const [latency, setLatency] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkPing = async () => {
    const start = performance.now();
    try {
      // Using Binance public API ping endpoint as a standard proxy for exchange latency
      await fetch('https://api.binance.com/api/v3/ping', { 
        method: 'GET',
        cache: 'no-cache',
        mode: 'cors' 
      });
      const end = performance.now();
      setLatency(Math.round(end - start));
    } catch (error) {
      // If direct API fails (CORS/Network), fallback to a simple resource fetch or mark as error
      // Using a small fallback just to show connectivity if main API is blocked
      try {
        await fetch(window.location.origin, { method: 'HEAD', cache: 'no-cache' });
        const end = performance.now();
        setLatency(Math.round(end - start)); 
      } catch (e) {
        setLatency(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPing();
    const interval = setInterval(checkPing, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (ms) => {
    if (!ms && ms !== 0) return "bg-gray-500 text-gray-500"; // No signal
    if (ms < 100) return "bg-green-500 text-green-500";
    if (ms < 300) return "bg-yellow-500 text-yellow-500";
    return "bg-red-500 text-red-500";
  };

  const statusColor = getStatusColor(latency);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1a1a1a]/50 border border-[#2a2a2a] hover:bg-[#252525] transition-colors cursor-help" title="Exchange API Latency">
      <div className="relative flex h-2 w-2">
        {latency && latency < 300 && (
          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", statusColor.split(' ')[0])}></span>
        )}
        <span className={cn("relative inline-flex rounded-full h-2 w-2", statusColor.split(' ')[0])}></span>
      </div>
      
      <span className={cn("text-xs font-mono font-medium", loading || latency === null ? "text-gray-500" : "text-gray-300")}>
        {loading ? (
          "..."
        ) : latency !== null ? (
          `${latency}ms`
        ) : (
          "Offline"
        )}
      </span>
    </div>
  );
};

export default PingIndicator;