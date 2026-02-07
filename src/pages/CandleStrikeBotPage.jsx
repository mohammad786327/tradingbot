import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import CandleStrikeBotBuilder from '@/components/CandleStrikeBotBuilder';
import ActiveCandleStrikeBots from '@/components/ActiveCandleStrikeBots';
import CandleStrikeBotChartGrid from '@/components/CandleStrikeBotChartGrid';
import CounterCardsGrid from '@/components/CounterCardsGrid';
import CandleMonitorPanel from '@/components/CandleMonitorPanel';
import { useToast } from '@/components/ui/use-toast';
import { binanceWS } from '@/utils/binanceWebSocket';
import { useBotStatusMonitor } from '@/hooks/useBotStatusMonitor'; // Added Hook

const CandleStrikeBotPage = () => {
  const { toast } = useToast();
  const [bots, setBots] = useState([]);
  const [activeBots, setActiveBots] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedBot, setSelectedBot] = useState(null);
  const [filterMode, setFilterMode] = useState(null);
  const [previewSettings, setPreviewSettings] = useState(null);
  
  // Monitoring State for the Main Panel
  const [greenCandlesCount, setGreenCandlesCount] = useState(0);
  const [redCandlesCount, setRedCandlesCount] = useState(0);

  // --- NEW: Monitor Bot Status for Notifications ---
  useBotStatusMonitor(activeBots, 'Candle Strike Bot');
  // -------------------------------------------------

  useEffect(() => {
    const storedTemplates = localStorage.getItem('tradingTemplates');
    if (storedTemplates) {
      setTemplates(JSON.parse(storedTemplates));
    }

    const storedBots = localStorage.getItem('candleStrikeBots');
    if (storedBots) {
      setBots(JSON.parse(storedBots));
    }

    // Initialize with realistic mock data for testing if empty
    if (!localStorage.getItem('activeCandleStrikeBots')) {
        const mockBots = [
            {
                id: '1',
                botId: 'mock-template-1',
                symbol: 'ETHUSDT',
                timeframe: '5m',
                direction: 'Green Candles',
                consecutiveCandles: 3,
                status: 'ACTIVE',
                entryPrice: 2000.00,
                currentPrice: 2050.00,
                takeProfit: 2100.00,
                stopLoss: 1950.00,
                margin: 500,
                leverage: 10,
                unrealizedPnl: 125.00,
                pnlPercentage: 25.00,
                currentGreenStreak: 3,
                currentRedStreak: 0,
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                botId: 'mock-template-2',
                symbol: 'BTCUSDT',
                timeframe: '15m',
                direction: 'Red Candles',
                consecutiveCandles: 4,
                status: 'ACTIVE',
                entryPrice: 65000.00,
                currentPrice: 65500.00,
                takeProfit: 63000.00,
                stopLoss: 66000.00,
                margin: 1000,
                leverage: 20,
                unrealizedPnl: -153.85, 
                pnlPercentage: -15.38,
                currentGreenStreak: 1,
                currentRedStreak: 2,
                createdAt: new Date().toISOString()
            }
        ];
        setActiveBots(mockBots);
        localStorage.setItem('activeCandleStrikeBots', JSON.stringify(mockBots));
    } else {
        const loadedBots = JSON.parse(localStorage.getItem('activeCandleStrikeBots'));
        const sanitizedBots = loadedBots.map(bot => ({
             ...bot,
             entryPrice: bot.entryPrice || 0,
             currentPrice: bot.currentPrice || 0,
             takeProfit: bot.takeProfit || 0,
             stopLoss: bot.stopLoss || 0,
             unrealizedPnl: bot.unrealizedPnl || 0,
             pnlPercentage: bot.pnlPercentage || 0,
        }));
        setActiveBots(sanitizedBots);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('candleStrikeBots', JSON.stringify(bots));
  }, [bots]);

  useEffect(() => {
     localStorage.setItem('activeCandleStrikeBots', JSON.stringify(activeBots));
  }, [activeBots]);

  // Real-time price updates for active bots
  useEffect(() => {
    const activeSymbols = [...new Set(activeBots.filter(b => b.status === 'ACTIVE').map(b => b.symbol))];
    
    if (activeSymbols.length === 0) return;

    const subscription = binanceWS.subscribe(activeSymbols, 'ticker', null, (data) => {
      setActiveBots(prevBots => {
        let hasChanges = false;
        const updatedBots = prevBots.map(bot => {
          if (bot.status === 'ACTIVE' && bot.symbol.toLowerCase() === data.s.toLowerCase()) {
            const currentPrice = parseFloat(data.c);
            const entryPrice = parseFloat(bot.entryPrice);
            
            if (currentPrice !== bot.currentPrice && entryPrice > 0) {
              const leverage = bot.leverage || 1;
              const margin = bot.margin || 100;
              
              const isLong = bot.direction === 'Green Candles' || bot.direction === 'Long Only' || 
                           (bot.direction === 'Auto (Follow Color)' && (bot.currentGreenStreak > bot.currentRedStreak));
              const directionMultiplier = isLong ? 1 : -1;
              
              const priceChangePct = (currentPrice - entryPrice) / entryPrice;
              const pnlPercentage = priceChangePct * directionMultiplier * leverage * 100;
              const unrealizedPnl = (pnlPercentage / 100) * margin;

              hasChanges = true;
              return {
                ...bot,
                currentPrice: currentPrice,
                pnlPercentage: parseFloat(pnlPercentage.toFixed(2)),
                unrealizedPnl: parseFloat(unrealizedPnl.toFixed(2))
              };
            }
          }
          return bot;
        });

        return hasChanges ? updatedBots : prevBots;
      });
    });

    return () => {
      if (subscription) binanceWS.unsubscribe(subscription);
    };
  }, [activeBots.length]);

  const handleCreateBot = useCallback((newBotConfig, newActiveBots) => {
    // Save the config
    setBots(prev => [...prev, newBotConfig]);
    
    if (newActiveBots && newActiveBots.length > 0) {
        // Initialize new instances
        const initializedBots = newActiveBots.map(b => ({
            ...b,
            botId: newBotConfig.id, // Critical: Link to template
            margin: newBotConfig.investment, // Snapshot critical data
            leverage: newBotConfig.leverage,
            currentGreenStreak: 0,
            currentRedStreak: 0,
            status: 'WAITING',
            entryPrice: 0,
            currentPrice: 0,
            takeProfit: 0,
            stopLoss: 0,
            unrealizedPnl: 0,
            pnlPercentage: 0
        }));
        setActiveBots(prev => [...initializedBots, ...prev]);
        setSelectedBot(initializedBots[0]);
    }
  }, []);

  const handleBotSelect = (bot) => {
      if (selectedBot?.id === bot.id) {
          setSelectedBot(null);
          setGreenCandlesCount(0);
          setRedCandlesCount(0);
      } else {
          setSelectedBot(bot);
          if (bot.currentGreenStreak !== undefined) setGreenCandlesCount(bot.currentGreenStreak);
          if (bot.currentRedStreak !== undefined) setRedCandlesCount(bot.currentRedStreak);
      }
  };
  
  const handleCardClick = (mode) => {
      setFilterMode(prev => prev === mode || mode === 'total' ? null : mode);
  };

  const handleEditBot = (bot) => {
    toast({ title: "Edit Mode", description: "Edit functionality coming soon." });
  };

  const handlePreviewBot = useCallback((settings) => {
      setPreviewSettings(settings);
  }, []);
  
  const handleCandleCountUpdate = useCallback(({ symbol, green, red, closePrice }) => {
      if (selectedBot && selectedBot.symbol === symbol) {
          setGreenCandlesCount(green);
          setRedCandlesCount(red);
      }

      setActiveBots(prevBots => {
          return prevBots.map(bot => {
              if (bot.symbol === symbol && bot.status !== 'INACTIVE' && bot.status !== 'CLOSED') {
                  const target = bot.consecutiveCandles || 3;
                  const isTriggered = (green >= target && (bot.direction === 'Green Candles' || bot.direction === 'Auto (Follow Color)')) ||
                                    (red >= target && (bot.direction === 'Red Candles' || bot.direction === 'Auto (Follow Color)'));
                  
                  const newStatus = isTriggered ? 'ACTIVE' : 'WAITING';

                  const changes = {};
                  let hasChanges = false;

                  if (bot.currentGreenStreak !== green || bot.currentRedStreak !== red) {
                      changes.currentGreenStreak = green;
                      changes.currentRedStreak = red;
                      hasChanges = true;
                  }

                  if (bot.status !== 'ACTIVE' && newStatus === 'ACTIVE') {
                      changes.status = newStatus;
                      changes.entryPrice = closePrice;
                      changes.currentPrice = closePrice;
                      if (!bot.takeProfit) changes.takeProfit = bot.direction === 'Green Candles' ? closePrice * 1.015 : closePrice * 0.985;
                      if (!bot.stopLoss) changes.stopLoss = bot.direction === 'Green Candles' ? closePrice * 0.99 : closePrice * 1.01;
                      
                      hasChanges = true;
                  } else if (bot.status !== newStatus && bot.status === 'WAITING') {
                      changes.status = newStatus;
                      hasChanges = true;
                  }
                  
                  if (closePrice && bot.status === 'ACTIVE') {
                      changes.currentPrice = closePrice;
                      hasChanges = true;
                  }

                  if (hasChanges) {
                      return { ...bot, ...changes };
                  }
              }
              return bot;
          });
      });
  }, [selectedBot]);

  const activeCount = activeBots.filter(b => b.status === 'ACTIVE').length;
  const pendingCount = activeBots.filter(b => b.status === 'WAITING' || b.status === 'PENDING').length; 
  const totalProfit = activeBots.reduce((acc, b) => (b.unrealizedPnl || 0) > 0 ? acc + (b.unrealizedPnl || 0) : acc, 0).toFixed(2);
  const totalLoss = Math.abs(activeBots.reduce((acc, b) => (b.unrealizedPnl || 0) < 0 ? acc + (b.unrealizedPnl || 0) : acc, 0)).toFixed(2);

  const chartSettings = useMemo(() => {
    return selectedBot ? {
        timeframe: selectedBot.timeframe,
        direction: selectedBot.direction,
        consecutiveCandles: selectedBot.consecutiveCandles || 3
    } : previewSettings;
  }, [selectedBot, previewSettings]);

  const monitorDirection = selectedBot ? selectedBot.direction : (previewSettings ? previewSettings.direction : 'Auto (Follow Color)');

  return (
    <>
      <Helmet>
        <title>Candle Strike Bot - CryptoBot</title>
      </Helmet>

      <div className="h-full p-4 md:p-6 space-y-6 max-w-[1920px] mx-auto">
         <CounterCardsGrid 
            activeCount={activeCount}
            pendingCount={pendingCount}
            totalProfit={totalProfit}
            totalLoss={totalLoss}
            totalCount={activeBots.length}
            onCardClick={handleCardClick}
            filterMode={filterMode}
         />

         <div className="grid grid-cols-1 xl:grid-cols-10 gap-6 min-h-[600px]">
            <div className="xl:col-span-7 flex flex-col gap-6">
                <div className="h-[500px] xl:h-[600px]">
                    <CandleStrikeBotChartGrid 
                        symbols={[...new Set(activeBots.map(b => b.symbol))]} 
                        selectedBot={selectedBot}
                        botSettings={chartSettings}
                        previewMode={!selectedBot}
                        previewSymbol="ETHUSDT"
                        onCandleCountUpdate={handleCandleCountUpdate}
                    />
                </div>
                
                <CandleMonitorPanel 
                    greenCount={greenCandlesCount}
                    redCount={redCandlesCount}
                    targetCount={chartSettings?.consecutiveCandles || 3}
                    direction={monitorDirection}
                />
            </div>

            <div className="xl:col-span-3 h-auto xl:h-[750px] overflow-hidden">
                <CandleStrikeBotBuilder 
                    templates={templates} 
                    onCreateBot={handleCreateBot}
                    onPreviewBot={handlePreviewBot}
                />
            </div>
         </div>

         <div className="min-h-[300px]">
             {/* Updated Props: positions and onUpdatePositions */}
             <ActiveCandleStrikeBots 
                positions={activeBots} 
                onPositionSelect={handleBotSelect}
                filterMode={filterMode}
                onUpdatePositions={setActiveBots}
                onEditPosition={handleEditBot}
             />
         </div>
      </div>
    </>
  );
};

export default CandleStrikeBotPage;