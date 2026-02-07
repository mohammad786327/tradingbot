import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Activity, Zap, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';
import PriceMovementBotBuilder from '@/components/PriceMovementBotBuilder';
import ActivePositionsTablePriceMovement from '@/components/ActivePositionsTablePriceMovement';
import BotChartGrid from '@/components/BotChartGrid';
import { useToast } from '@/components/ui/use-toast';
import { binanceWS } from '@/utils/binanceWebSocket';
import { useBotStatusMonitor } from '@/hooks/useBotStatusMonitor'; // Added Hook

const PriceMovementBotPage = () => {
  const { toast } = useToast();
  const location = useLocation();
  const [bots, setBots] = useState([]);
  const [positions, setPositions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [filterMode, setFilterMode] = useState(null);
  
  // State to track what the builder is currently set to (for charts)
  const [previewSymbols, setPreviewSymbols] = useState(['BTCUSDT']);
  const [previewSettings, setPreviewSettings] = useState({ dollarMovement: 50 });

  const activeSubscriptionRef = useRef(null);

  // --- NEW: Monitor Bot Status for Notifications ---
  // Note: 'OPEN' corresponds to 'ACTIVE' for this specific bot type implementation
  // We might need to normalize statuses or adjust hook. 
  // Let's assume positions with 'OPEN' status are active.
  const monitorPositions = positions.map(p => ({
      ...p,
      status: p.status === 'OPEN' ? 'ACTIVE' : p.status
  }));
  useBotStatusMonitor(monitorPositions, 'Price Movement Bot');
  // -------------------------------------------------

  // Load initial data
  useEffect(() => {
    // Load Templates
    const storedTemplates = localStorage.getItem('tradingTemplates');
    if (storedTemplates) {
      setTemplates(JSON.parse(storedTemplates));
    } else {
        // Fallback demo templates if no user templates exist
        const demoTemplates = [
            { id: 'tmpl_1', name: 'Alpha Scalper', symbols: ['BTCUSDT', 'ETHUSDT'], orderType: 'Scalping' },
            { id: 'tmpl_2', name: 'ETH Grid', symbols: ['ETHUSDT'], orderType: 'Grid' },
            { id: 'tmpl_3', name: 'Solana Momentum', symbols: ['SOLUSDT', 'AVAXUSDT'], orderType: 'Momentum' }
        ];
        setTemplates(demoTemplates);
    }

    // Load Bots
    const storedBots = localStorage.getItem('priceMovementBots');
    if (storedBots) {
      setBots(JSON.parse(storedBots));
    }

    // Load Positions
    const storedPositions = localStorage.getItem('activePositions');
    if (storedPositions) {
        setPositions(JSON.parse(storedPositions));
    } else {
        // Initial Mock Data if nothing in storage
        const mockPositions = [
             {
                id: '1',
                botName: 'Volatility Scalper',
                symbol: 'BNBUSDT',
                entryPrice: 590.50,
                currentPrice: 590.50,
                margin: 50,
                leverage: 10,
                direction: 'Long',
                status: 'OPEN',
                dollarTarget: 50,
                unrealizedPnl: 0,
                pnlPercentage: 0,
                progress: 0
             }
        ];
        setPositions(mockPositions);
    }
  }, []);

  // Handle incoming navigation state
  useEffect(() => {
    if (location.state?.selectedPositionId && positions.length > 0) {
      const pos = positions.find(p => p.id === location.state.selectedPositionId);
      if (pos) {
        setSelectedPosition(pos);
        if (location.state.highlight) {
          toast({
            title: "Bot Selected",
            description: `Now monitoring ${pos.botName || pos.symbol}`,
          });
        }
      }
    }
  }, [location.state, positions, toast]);

  // Persist bots when changed
  useEffect(() => {
    localStorage.setItem('priceMovementBots', JSON.stringify(bots));
  }, [bots]);

  // Persist positions when changed
  useEffect(() => {
     localStorage.setItem('activePositions', JSON.stringify(positions));
  }, [positions]);

  // Real-time Price Updates and PnL Calculation
  useEffect(() => {
    if (positions.length === 0) return;

    // Get unique symbols to subscribe to
    const symbols = [...new Set(positions.filter(p => p.status !== 'CLOSED').map(p => p.symbol))];
    
    if (symbols.length === 0) return;

    // Subscribe
    const subscription = binanceWS.subscribe(symbols, 'ticker', '1m', (data) => {
        if (!data.s || !data.c) return;

        setPositions(prevPositions => {
            return prevPositions.map(pos => {
                if (pos.symbol === data.s && pos.status !== 'CLOSED') {
                    const currentPrice = parseFloat(data.c);
                    const entryPrice = parseFloat(pos.entryPrice) || currentPrice; 
                    const isLong = pos.direction === 'Long';
                    
                    // If entryPrice is 0 (just created), set it to current price
                    const effectiveEntryPrice = entryPrice > 0 ? entryPrice : currentPrice;
                    
                    // PnL Calculation
                    const priceDiff = currentPrice - effectiveEntryPrice;
                    const pnlRaw = isLong ? priceDiff : -priceDiff;
                    // Quantity estimation: (Margin * Leverage) / EntryPrice
                    const quantity = (parseFloat(pos.margin) * (parseFloat(pos.leverage) || 1)) / effectiveEntryPrice;
                    const unrealizedPnl = pnlRaw * quantity;
                    
                    const pnlPercentage = (pnlRaw / effectiveEntryPrice) * 100 * (parseFloat(pos.leverage) || 1);
                    
                    // Price Change % for Badge
                    const priceChangePercent = ((currentPrice - effectiveEntryPrice) / effectiveEntryPrice) * 100;

                    // Progress (towards target profit dollar amount)
                    const dollarTarget = parseFloat(pos.dollarTarget) || 50;
                    const progress = Math.max(0, (unrealizedPnl / dollarTarget) * 100);

                    // Auto-Open if Pending and price moves (Simulated logic)
                    let status = pos.status;
                    if (status === 'PENDING' && Math.abs(pnlPercentage) > 0.1) {
                        status = 'OPEN';
                    }

                    return {
                        ...pos,
                        currentPrice: currentPrice,
                        entryPrice: effectiveEntryPrice,
                        unrealizedPnl,
                        pnlPercentage,
                        priceChangePercent,
                        progress,
                        status
                    };
                }
                return pos;
            });
        });
    });
    
    activeSubscriptionRef.current = subscription;

    return () => {
        if (activeSubscriptionRef.current) {
            binanceWS.unsubscribe(activeSubscriptionRef.current);
        }
    };
  }, [positions.length]); // Re-subscribe if number of positions changes


  const handleCreateBot = useCallback((newBot, newPositions) => {
    setBots(prev => [...prev, newBot]);
    
    if (newPositions && newPositions.length > 0) {
        setPositions(prev => [...newPositions, ...prev]);
        toast({
            title: "Positions Created",
            description: `Started ${newPositions.length} new position trackers.`
        });
    }
  }, [toast]);

  const handleClosePosition = (position) => {
     if (window.confirm(`Are you sure you want to close the position for ${position.symbol}?`)) {
         setPositions(prev => prev.map(p => 
             p.id === position.id ? { ...p, status: 'CLOSED', unrealizedPnl: p.unrealizedPnl } : p
         ));
         toast({ title: "Position Closed", description: `${position.symbol} position has been closed.` });
     }
  };

  const handleDeletePosition = (position) => {
      if (window.confirm("Delete this position from history?")) {
          setPositions(prev => prev.filter(p => p.id !== position.id));
          toast({ title: "Position Deleted", variant: "destructive" });
      }
  };

  const handleViewHistory = (position) => {
      toast({ 
          title: "Trade History", 
          description: `History view for ${position.symbol} is coming soon! Entry: $${position.entryPrice}` 
      });
  };

  const handleCardClick = (mode) => {
      if (filterMode === mode || mode === 'total') {
          setFilterMode(null);
      } else {
          setFilterMode(mode);
      }
  };

  // Filter positions for table
  const filteredPositions = positions.filter(p => {
      if (!filterMode) return true;
      if (filterMode === 'active') return p.status === 'OPEN' || p.status === 'ACTIVE';
      if (filterMode === 'pending') return p.status === 'PENDING';
      if (filterMode === 'profit') return (p.unrealizedPnl || 0) > 0;
      if (filterMode === 'loss') return (p.unrealizedPnl || 0) < 0;
      return true;
  });

  // Calculate stats for counters
  const activeCount = positions.filter(p => p.status === 'OPEN' || p.status === 'ACTIVE').length;
  const pendingCount = positions.filter(p => p.status === 'PENDING').length;
  const totalProfit = positions.reduce((acc, p) => (p.unrealizedPnl || 0) > 0 ? acc + (p.unrealizedPnl || 0) : acc, 0);
  const totalLoss = positions.reduce((acc, p) => (p.unrealizedPnl || 0) < 0 ? acc + (p.unrealizedPnl || 0) : acc, 0);

  const CounterCard = ({ id, label, value, subValue, icon: Icon, color, onClick, isActive }) => (
     <motion.div
        whileHover={{ y: -5 }}
        onClick={() => onClick(id)}
        className={cn(
            "p-5 rounded-2xl border cursor-pointer relative overflow-hidden transition-all duration-300",
            isActive ? `bg-${color}-500/10 border-${color}-500` : `bg-[#1a1a1a] border-[#2a2a2a] hover:border-${color}-500/50`
        )}
     >
        <div className={`absolute top-0 right-0 p-4 opacity-10 text-${color}-500`}>
            <Icon size={64} />
        </div>
        <div className="relative z-10">
            <div className={`w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center text-${color}-500 mb-3`}>
                <Icon size={20} />
            </div>
            <div className="text-2xl font-bold text-white mb-1">{value}</div>
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</div>
            {subValue && <div className={`text-xs mt-1 text-${color}-400 font-mono`}>{subValue}</div>}
        </div>
     </motion.div>
  );

  return (
    <>
      <Helmet>
        <title>Price Movement Bot - CryptoBot</title>
      </Helmet>

      <div className="h-full p-4 md:p-6 space-y-6 max-w-[1920px] mx-auto overflow-y-auto">
         {/* Counters Section */}
         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <CounterCard 
                id="active" 
                label="Active Bots" 
                value={activeCount} 
                icon={Zap} 
                color="emerald" 
                onClick={handleCardClick} 
                isActive={filterMode === 'active'}
            />
            <CounterCard 
                id="pending" 
                label="Pending" 
                value={pendingCount} 
                icon={Activity} 
                color="yellow" 
                onClick={handleCardClick}
                isActive={filterMode === 'pending'}
            />
            <CounterCard 
                id="profit" 
                label="Total Profit" 
                value={`$${totalProfit.toFixed(2)}`} 
                icon={TrendingUp} 
                color="green" 
                onClick={handleCardClick}
                isActive={filterMode === 'profit'}
            />
            <CounterCard 
                id="loss" 
                label="Total Loss" 
                value={`$${Math.abs(totalLoss).toFixed(2)}`} 
                icon={TrendingDown} 
                color="red" 
                onClick={handleCardClick}
                isActive={filterMode === 'loss'}
            />
            <CounterCard 
                id="total" 
                label="Total Positions" 
                value={positions.length} 
                icon={Layers} 
                color="purple" 
                onClick={handleCardClick}
                isActive={filterMode === null}
            />
         </div>

         {/* Main Content Grid - 70/30 split */}
         <div className="grid grid-cols-1 xl:grid-cols-10 gap-6 min-h-[600px]">
            {/* Chart Section (70% width on large screens) */}
            <div className="xl:col-span-7 h-full flex flex-col">
                <BotChartGrid 
                    symbols={(previewSymbols && previewSymbols.length > 0) ? previewSymbols : ['BTCUSDT']}
                    selectedPosition={selectedPosition} 
                    previewDollarTarget={previewSettings.dollarMovement}
                />
            </div>

            {/* Builder Section (30% width) */}
            <div className="xl:col-span-3 h-full min-h-[500px]">
                <PriceMovementBotBuilder 
                    templates={templates} 
                    onCreateBot={handleCreateBot}
                    onPreviewSymbolsChange={setPreviewSymbols} 
                    onSettingsChange={setPreviewSettings}
                />
            </div>
         </div>

         {/* Active Positions Table */}
         <div className="min-h-[300px]">
             <ActivePositionsTablePriceMovement 
                positions={filteredPositions} 
                isLoading={false}
                onClosePosition={handleClosePosition}
                onDeletePosition={handleDeletePosition}
                onViewHistory={handleViewHistory}
             />
         </div>
      </div>
    </>
  );
};

export default PriceMovementBotPage;