
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
import { useBotStatusMonitor } from '@/hooks/useBotStatusMonitor'; 
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { getAuth } from 'firebase/auth';

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
  const botStateRef = useRef({}); // Refs to hold dynamic bot state for trigger logic

  // --- Monitor Bot Status for Notifications ---
  const monitorPositions = positions.map(p => ({
      ...p,
      status: p.status === 'OPEN' ? 'ACTIVE' : p.status
  }));
  useBotStatusMonitor(monitorPositions, 'Price Movement Bot');
  
  // 1. Initial Load from Firestore
  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const botsRef = collection(db, 'bots');
    const qBots = query(botsRef, where('uid', '==', currentUser.uid), where('status', '==', 'ACTIVE'));

    const unsubscribeBots = onSnapshot(qBots, (snapshot) => {
        const loadedBots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBots(loadedBots);
        // Update Ref for easy access in ws callback
        loadedBots.forEach(b => {
            botStateRef.current[b.id] = b;
        });
    });

    const posRef = collection(db, 'positions');
    const qPos = query(posRef, where('uid', '==', currentUser.uid));

    const unsubscribePos = onSnapshot(qPos, (snapshot) => {
        const loadedPos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPositions(loadedPos);
    });

    // Load Templates
    const storedTemplates = localStorage.getItem('tradingTemplates');
    if (storedTemplates) {
      setTemplates(JSON.parse(storedTemplates));
    } else {
        const demoTemplates = [
            { id: 'tmpl_1', name: 'Alpha Scalper', symbols: ['BTCUSDT', 'ETHUSDT'], orderType: 'Scalping' },
            { id: 'tmpl_2', name: 'ETH Grid', symbols: ['ETHUSDT'], orderType: 'Grid' },
            { id: 'tmpl_3', name: 'Solana Momentum', symbols: ['SOLUSDT', 'AVAXUSDT'], orderType: 'Momentum' }
        ];
        setTemplates(demoTemplates);
    }

    return () => {
        unsubscribeBots();
        unsubscribePos();
    };
  }, []);

  // 2. Real-time Price Updates, Trigger Logic & PnL
  useEffect(() => {
    const activePositionSymbols = positions.filter(p => p.status !== 'CLOSED').map(p => p.symbol);
    const botTriggerSymbols = bots.map(b => b.movementCoin);
    
    const allSymbols = [...new Set([...activePositionSymbols, ...botTriggerSymbols])];
    
    if (allSymbols.length === 0) return;
    
    const subscription = binanceWS.subscribe(allSymbols, 'kline_1m', '1m', async (data) => {
        if (!data.s) return;

        const symbol = data.s;
        const currentPrice = parseFloat(data.c);
        const openPrice = parseFloat(data.o); 
        
        // --- A. CHECK TRIGGERS (For Bots) ---
        // Access latest bot state from ref to avoid closure staleness
        const relevantBotIds = Object.keys(botStateRef.current).filter(id => botStateRef.current[id].movementCoin === symbol);
        
        for (const botId of relevantBotIds) {
            const bot = botStateRef.current[botId];
            if (!bot) continue;

            const threshold = parseFloat(bot.dollarMovement);
            const isLong = bot.directionMode === 'Long';
            
            const movement = currentPrice - openPrice;
            
            let isConditionMet = false;
            if (isLong && movement >= threshold) isConditionMet = true;
            if (!isLong && movement <= -threshold) isConditionMet = true;
            
            // Calculate Cooldown
            const lastTrigger = bot.lastTriggerTime ? new Date(bot.lastTriggerTime).getTime() : 0;
            const now = Date.now();
            
            let cooldownMs = 0;
            const cooldownVal = parseFloat(bot.cooldown) || 0;
            if (bot.cooldownUnit === 'Sec') cooldownMs = cooldownVal * 1000;
            else if (bot.cooldownUnit === 'Min') cooldownMs = cooldownVal * 60 * 1000;
            else if (bot.cooldownUnit === 'Hour') cooldownMs = cooldownVal * 60 * 60 * 1000;
            
            const timeSinceLast = now - lastTrigger;
            const isCooldownActive = timeSinceLast < cooldownMs;

            // Debug Logging
            console.log(`Bot: ${bot.id} | Price: ${currentPrice} | Threshold: ${threshold} | HasTriggered: ${bot.hasTriggered} | LastTrigger: ${bot.lastTriggerTime} | SafetyPeriod: ${cooldownVal}${bot.cooldownUnit}`);

            // RESET LOGIC: If price falls below threshold, reset the hasTriggered flag
            if (!isConditionMet && bot.hasTriggered) {
                console.log(`[RESET] Bot ${bot.id} trigger reset (Price pulled back)`);
                // Update Firestore
                updateDoc(doc(db, 'bots', bot.id), { hasTriggered: false });
                
                // Optimistic local update
                botStateRef.current[bot.id] = { ...bot, hasTriggered: false };
                continue;
            }

            // TRIGGER LOGIC
            if (isConditionMet && !bot.hasTriggered) {
                console.log(`[CHECK] Bot ${bot.id} trigger condition met. Checking cooldown...`);
                console.log(`Safety period check: ${isCooldownActive ? 'ACTIVE' : 'EXPIRED'} | Time since last trigger: ${(timeSinceLast/1000).toFixed(1)}s | Cooldown req: ${(cooldownMs/1000).toFixed(1)}s`);

                if (isCooldownActive) {
                    console.log("Cooldown active, skipping trigger");
                    // We DO NOT set hasTriggered = true here, allowing it to check again if price stays high after cooldown?
                    // OR we set it to prevent spamming logs?
                    // Requirement: "If elapsed time < safetyTimePeriod: SKIP trigger"
                    // Requirement: "Only create position if hasTriggered = false"
                    // If we skip, we just return. Next tick will check again.
                    continue; 
                }

                console.log("Cooldown expired, trigger allowed");

                // Execute Trigger
                const pendingPositions = positions.filter(p => p.botId === bot.id && p.status === 'PENDING');
                
                if (pendingPositions.length > 0) {
                    console.log(`[TRIGGER] Bot ${bot.id} triggered! ${symbol} moved ${movement.toFixed(2)} (>${threshold})`);
                    
                    const updates = pendingPositions.map(p => {
                       return updateDoc(doc(db, 'positions', p.id), {
                           status: 'ACTIVE', 
                           entryPrice: 0, 
                           activatedAt: new Date().toISOString()
                       });
                    });
                    
                    // Update Bot State in Firestore
                    await updateDoc(doc(db, 'bots', bot.id), { 
                        hasTriggered: true,
                        lastTriggerTime: new Date().toISOString()
                    });
                    
                    // Optimistic update
                    botStateRef.current[bot.id] = { 
                        ...bot, 
                        hasTriggered: true, 
                        lastTriggerTime: new Date().toISOString() 
                    };

                    await Promise.all(updates);
                    toast({
                        title: "Bot Triggered!",
                        description: `${bot.templateName} activated on ${symbol} movement.`,
                        className: "bg-purple-600 text-white"
                    });
                } else {
                    // Even if no positions pending (maybe max trades reached?), we should update bot state to avoid infinite loop
                     await updateDoc(doc(db, 'bots', bot.id), { hasTriggered: true });
                     botStateRef.current[bot.id] = { ...bot, hasTriggered: true };
                }
            } else if (isConditionMet && bot.hasTriggered) {
                 console.log("Trigger blocked - already triggered");
            }
        }

        // --- B. UPDATE POSITIONS (PnL) ---
        setPositions(prevPositions => {
            return prevPositions.map(pos => {
                if (pos.symbol === symbol && (pos.status === 'ACTIVE' || pos.status === 'OPEN')) {
                    
                    let effectiveEntry = pos.entryPrice;
                    if (!effectiveEntry || effectiveEntry === 0) {
                        effectiveEntry = currentPrice;
                    }

                    const isLong = pos.direction === 'Long';
                    const priceDiff = currentPrice - effectiveEntry;
                    const pnlRaw = isLong ? priceDiff : -priceDiff;
                    
                    const leverage = parseFloat(pos.leverage) || 1;
                    const quantity = (parseFloat(pos.margin) * leverage) / effectiveEntry;
                    
                    const unrealizedPnl = pnlRaw * quantity;
                    const pnlPercentage = (pnlRaw / effectiveEntry) * 100 * leverage;
                    
                    const dollarTarget = parseFloat(pos.dollarTarget) || 50;
                    const progress = Math.max(0, (unrealizedPnl / dollarTarget) * 100);

                    return {
                        ...pos,
                        currentPrice: currentPrice,
                        entryPrice: effectiveEntry,
                        unrealizedPnl,
                        pnlPercentage,
                        progress
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
  }, [bots, positions.length]); // Re-run if bots or position count changes significantly


  const handleCreateBot = useCallback((newBot, newPositions) => {
    // State updates handled by Firestore listener
  }, []);

  const handleClosePosition = async (position) => {
     if (window.confirm(`Are you sure you want to close the position for ${position.symbol}?`)) {
         try {
             await updateDoc(doc(db, 'positions', position.id), {
                 status: 'CLOSED',
                 closedAt: new Date().toISOString(),
                 finalPnl: position.unrealizedPnl
             });
             toast({ title: "Position Closed", description: `${position.symbol} position has been closed.` });
         } catch (e) {
             console.error("Error closing position:", e);
             toast({ title: "Error", description: "Failed to close position", variant: "destructive" });
         }
     }
  };

  const handleDeletePosition = async (position) => {
      toast({ title: "Info", description: "Deletion enabled in admin panel only." });
  };

  const handleViewHistory = (position) => {
      toast({ 
          title: "Trade History", 
          description: `Entry: $${position.entryPrice?.toFixed(2) || 'N/A'}` 
      });
  };

  const handleCardClick = (mode) => {
      setFilterMode(prev => prev === mode ? null : mode);
  };

  // Filter positions for table
  const filteredPositions = positions.filter(p => {
      if (!filterMode) return true;
      if (filterMode === 'active') return p.status === 'ACTIVE' || p.status === 'OPEN';
      if (filterMode === 'pending') return p.status === 'PENDING';
      if (filterMode === 'profit') return (p.unrealizedPnl || 0) > 0;
      if (filterMode === 'loss') return (p.unrealizedPnl || 0) < 0;
      return true;
  });

  const activeCount = positions.filter(p => p.status === 'ACTIVE' || p.status === 'OPEN').length;
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

         <div className="grid grid-cols-1 xl:grid-cols-10 gap-6 min-h-[600px]">
            <div className="xl:col-span-7 h-full flex flex-col">
                <BotChartGrid 
                    symbols={(previewSymbols && previewSymbols.length > 0) ? previewSymbols : ['BTCUSDT']}
                    selectedPosition={selectedPosition} 
                    previewDollarTarget={previewSettings.dollarMovement}
                />
            </div>

            <div className="xl:col-span-3 h-full min-h-[500px]">
                <PriceMovementBotBuilder 
                    templates={templates} 
                    onCreateBot={handleCreateBot}
                    onPreviewSymbolsChange={setPreviewSymbols} 
                    onSettingsChange={setPreviewSettings}
                />
            </div>
         </div>

         <div className="min-h-[300px]">
             <ActivePositionsTablePriceMovement 
                positions={filteredPositions} 
                isLoading={false}
                onClosePosition={handleClosePosition}
                onDeletePosition={handleDeletePosition}
                onViewHistory={handleViewHistory}
                bots={bots} // Passing bots for cooldown lookup
             />
         </div>
      </div>
    </>
  );
};

export default PriceMovementBotPage;
