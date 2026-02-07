import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Activity, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { aggregatedPositionManager } from '@/utils/aggregatedPositionManager';
import { getCandleStrikeBotPositions, aggregateBotAndRegularTrades } from '@/utils/candleStrikeBotPositionManager';
import { getRSIBotPositions } from '@/utils/rsiTradingBotPositionManager';
import { useBotPositionPriceUpdates } from '@/hooks/useBotPositionPriceUpdates';

import PositionFiltersPanel from '@/components/PositionFiltersPanel';
import TradesTable from '@/components/TradesTable';
import TradeActionsModal from '@/components/TradeActionsModal';

const PositionsPage = () => {
  const { toast } = useToast();
  
  // Separate state for each data source to avoid race conditions
  const [regularPositions, setRegularPositions] = useState([]);
  const [csPositions, setCsPositions] = useState([]);
  const [rsiPositions, setRsiPositions] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    status: 'All',
    source: 'All', 
    sort: 'time_desc'
  });

  // Action Modal State
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: null,
    selectedTrade: null
  });

  // 1. Fetch Data Function
  // Memoized to prevent recreation on every render
  const fetchAllPositions = useCallback(() => {
    try {
      setError(null);
      // Fetch regular positions (Price Movement, Grid, etc.)
      const allGeneric = aggregatedPositionManager.getAllPositions();
      const filteredGeneric = allGeneric.filter(p => 
          p.botType !== 'Candle Strike' && 
          p.botType !== 'STRIKE' &&
          p.botType !== 'RSI_BOT'
      );
      setRegularPositions(filteredGeneric);

      // Fetch specialized bots
      const candleStrikeBots = getCandleStrikeBotPositions();
      setCsPositions(candleStrikeBots);

      const rsiBots = getRSIBotPositions();
      setRsiPositions(rsiBots);
      
    } catch (err) {
      console.error("Failed to fetch positions:", err);
      setError("Failed to load some positions. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Initial Fetch
  useEffect(() => {
    fetchAllPositions();
    
    // Polling interval - reduced frequency to prevent freezing
    const interval = setInterval(fetchAllPositions, 10000); 
    
    // Only refresh on focus, but debounce it slightly
    const onFocus = () => {
        setTimeout(fetchAllPositions, 500);
    };
    
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchAllPositions]);

  // 3. Aggregate for Hook
  // Combine CS and RSI for price updates. 
  // We use useMemo to ensure array reference stability if contents haven't changed.
  // This is CRITICAL for preventing infinite loops in the hook.
  const allBotPositionsForHook = useMemo(() => {
      return [...csPositions, ...rsiPositions];
  }, [csPositions, rsiPositions]); // Only re-create if source arrays change
  
  // 4. Real-time updates Hook
  // This hook handles subscription and returns a NEW array with updated prices
  const liveBotPositions = useBotPositionPriceUpdates(allBotPositionsForHook);

  // 5. Final Aggregation for Display
  // Merge regular positions with the LIVE (price-updated) bot positions
  const allPositions = useMemo(() => {
      // Filter live positions back into types if needed, or pass them directly if aggregator handles it
      // The aggregator simply merges arrays.
      // We need to split liveBotPositions back into CS and RSI to match signature, OR just pass empty to 2nd arg and all bots to 3rd arg.
      // Better: filter properly.
      
      const liveCS = liveBotPositions.filter(p => p.botType === 'STRIKE' || p.botType === 'Candle Strike');
      const liveRSI = liveBotPositions.filter(p => p.botType === 'RSI_BOT');
      
      return aggregateBotAndRegularTrades(regularPositions, liveCS, liveRSI);
  }, [regularPositions, liveBotPositions]); // Re-aggregate only when inputs change

  // 6. Filtering & Sorting
  // Memoized to prevent calculation on every render (e.g. tooltips/hovers)
  const filteredData = useMemo(() => {
      return allPositions.filter(trade => {
        const searchLower = filters.search.toLowerCase();
        const searchMatch = (trade.symbol?.toLowerCase().includes(searchLower)) || 
                            (trade.botType?.toLowerCase().includes(searchLower));
        
        // Status Filter
        let statusMatch = true;
        const statusUpper = trade.status ? trade.status.toUpperCase() : 'UNKNOWN';
        if (filters.status !== 'All') {
            if (filters.status === 'Active') statusMatch = ['ACTIVE', 'OPEN', 'RUNNING'].includes(statusUpper);
            else if (filters.status === 'Waiting') statusMatch = ['WAITING', 'PENDING'].includes(statusUpper);
            else if (filters.status === 'Closed') statusMatch = ['CLOSED', 'COMPLETED', 'STOPPED'].includes(statusUpper);
            else statusMatch = statusUpper === filters.status.toUpperCase();
        }
        
        // Source Filter
        let sourceMatch = true;
        if (filters.source !== 'All') {
            if (filters.source === 'Regular Trades') sourceMatch = trade.botType !== 'STRIKE' && trade.botType !== 'RSI_BOT';
            else if (filters.source === 'Bot Trades') sourceMatch = trade.botType === 'STRIKE' || trade.botType === 'RSI_BOT';
            else if (filters.source === 'CandleStrike') sourceMatch = trade.botType === 'STRIKE';
            else if (filters.source === 'RSI Bot') sourceMatch = trade.botType === 'RSI_BOT';
            else sourceMatch = trade.botType === filters.source;
        }
        
        return searchMatch && statusMatch && sourceMatch;
      }).sort((a, b) => {
        switch(filters.sort) {
           case 'time_desc': return (b.timeActivated || 0) - (a.timeActivated || 0);
           case 'time_asc': return (a.timeActivated || 0) - (b.timeActivated || 0);
           case 'pnl_desc': return (b.pnl || 0) - (a.pnl || 0);
           case 'pnl_asc': return (a.pnl || 0) - (b.pnl || 0);
           default: return 0;
        }
      });
  }, [allPositions, filters]);

  // Handlers
  const handleAction = useCallback((action, payload) => {
    if (action === 'bulk_delete') {
        // Payload is array of IDs
        let deletedCount = 0;
        payload.forEach(id => {
            const pos = allPositions.find(p => p.id === id);
            
            // Handle specialized deletion for Candle Strike
            if (pos?.sourceKey === 'activeCandleStrikeBots') {
                 const currentBots = JSON.parse(localStorage.getItem('activeCandleStrikeBots') || '[]');
                 const updatedBots = currentBots.filter(b => b.id !== id);
                 if (currentBots.length !== updatedBots.length) {
                     localStorage.setItem('activeCandleStrikeBots', JSON.stringify(updatedBots));
                     deletedCount++;
                 }
            } 
            // Handle specialized deletion for RSI Bots
            else if (pos?.sourceKey === 'rsiTradingBots') {
                 const currentBots = JSON.parse(localStorage.getItem('rsiTradingBots') || '[]');
                 // Hard delete for "Delete Record" action here
                 const updatedBots = currentBots.filter(b => b.id !== id);
                 if (currentBots.length !== updatedBots.length) {
                     localStorage.setItem('rsiTradingBots', JSON.stringify(updatedBots));
                     deletedCount++;
                 }
            }
            else if (pos && pos.sourceKey) {
                // Fallback for regular aggregated positions
                if (aggregatedPositionManager.deletePosition(id, pos.sourceKey)) {
                    deletedCount++;
                }
            }
        });
        
        if (deletedCount > 0) {
            toast({
                title: "Bulk Delete",
                description: `Successfully deleted ${deletedCount} records.`,
                className: "bg-green-500 border-green-600 text-white"
            });
            // Force refresh immediately
            fetchAllPositions();
        }
        return;
    }

    if (action === 'close') {
        setModalState({ isOpen: true, action: 'close', selectedTrade: payload });
    }
  }, [allPositions, fetchAllPositions, toast]);

  const handleCloseModal = () => {
    setModalState({ ...modalState, isOpen: false, action: null });
  };

  const handleConfirmClose = (trade) => {
     if (trade) {
         try {
             if (trade.sourceKey === 'activeCandleStrikeBots') {
                 const currentBots = JSON.parse(localStorage.getItem('activeCandleStrikeBots') || '[]');
                 const updatedBots = currentBots.map(b => b.id === trade.id ? { ...b, status: 'CLOSED' } : b);
                 localStorage.setItem('activeCandleStrikeBots', JSON.stringify(updatedBots));
             } 
             else if (trade.sourceKey === 'rsiTradingBots') {
                 const currentBots = JSON.parse(localStorage.getItem('rsiTradingBots') || '[]');
                 // Usually closing an RSI bot means stopping it or resetting its position
                 const updatedBots = currentBots.map(b => b.id === trade.id ? { ...b, status: 'STOPPED', entryPrice: 0 } : b);
                 localStorage.setItem('rsiTradingBots', JSON.stringify(updatedBots));
             }
             else if (trade.sourceKey) {
                 aggregatedPositionManager.updatePositionStatus(trade.id, trade.sourceKey, 'CLOSED');
             }
             
             toast({
                title: "Position Closed",
                description: `Position for ${trade.symbol} marked as closed.`,
             });
             fetchAllPositions();
         } catch (e) {
             console.error("Error closing position", e);
             toast({
                 title: "Error",
                 description: "Failed to close position.",
                 variant: "destructive"
             });
         }
     }
  };

  return (
    <>
      <Helmet>
        <title>Unified Positions - CryptoBot</title>
        <meta name="description" content="View and manage all your crypto bot positions in one place." />
      </Helmet>

      <div className="h-full bg-[#0f0f0f] text-white p-4 lg:p-6 custom-scrollbar overflow-y-auto">
         <div className="max-w-[1920px] mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30 text-blue-400">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Position Manager</h1>
                        <p className="text-gray-500 text-sm">Aggregated view of all bot strategies including Candle Strike and RSI</p>
                    </div>
                </div>
                <button 
                    onClick={fetchAllPositions}
                    className="p-2 bg-[#1a1a1a] border border-[#333] rounded-lg hover:bg-[#252525] text-gray-400 hover:text-white transition-colors"
                >
                    <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Filters */}
            <PositionFiltersPanel 
               filters={filters} 
               setFilters={setFilters} 
               onReset={() => setFilters({ search: '', status: 'All', source: 'All', sort: 'time_desc' })}
            />

            {/* Table */}
            {isLoading && allPositions.length === 0 ? (
                <div className="flex items-center justify-center p-20">
                    <RefreshCw className="animate-spin text-blue-500" size={32} />
                </div>
            ) : (
                <TradesTable 
                   trades={filteredData} 
                   onAction={handleAction} 
                />
            )}

            {/* Action Modals */}
            {modalState.isOpen && (
               <TradeActionsModal 
                  activeAction={modalState.action}
                  onClose={handleCloseModal}
                  onConfirmClose={handleConfirmClose}
                  trade={modalState.selectedTrade}
               />
            )}

         </div>
      </div>
    </>
  );
};

export default PositionsPage;