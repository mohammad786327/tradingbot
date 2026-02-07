import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import RSITradingBotBuilder from '@/components/RSITradingBotBuilder';
import ActiveRSIPositionsTable from '@/components/ActiveRSIPositionsTable';
import RSIStrategyPreviewChart from '@/components/RSIStrategyPreviewChart';
import CounterCardsGrid from '@/components/CounterCardsGrid';
import { useToast } from '@/components/ui/use-toast';
import { useBotStatusMonitor } from '@/hooks/useBotStatusMonitor'; // Added Hook

const RSITradingBotPage = () => {
  const { toast } = useToast();
  const [activeBots, setActiveBots] = useState([]);
  const [activePositions, setActivePositions] = useState([]); 
  const [templates, setTemplates] = useState([]);
  const [previewSettings, setPreviewSettings] = useState({
      timeframe: '1m',
      rsiValue: 30,
      limit: 14
  });
  
  // Load initial data
  useEffect(() => {
    // Templates
    const storedTemplates = localStorage.getItem('tradingTemplates');
    if (storedTemplates) setTemplates(JSON.parse(storedTemplates));

    // Active Positions (The table data)
    const storedPositions = localStorage.getItem('activeRSIPositions');
    if (storedPositions) {
        setActivePositions(JSON.parse(storedPositions));
    } else {
        localStorage.setItem('activeRSIPositions', JSON.stringify([]));
    }
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('activeRSIPositions', JSON.stringify(activePositions));
  }, [activePositions]);

  // --- NEW: Monitor Bot Status for Notifications ---
  useBotStatusMonitor(activePositions, 'RSI Bot');
  // -------------------------------------------------

  const handleCreateBot = useCallback((botConfig, newPositions) => {
    // 1. Save Bot Config (Metadata)
    const existingBots = JSON.parse(localStorage.getItem('rsiTradingBots') || '[]');
    const updatedBots = [...existingBots, botConfig];
    localStorage.setItem('rsiTradingBots', JSON.stringify(updatedBots));

    // 2. Add New Positions to State (Table) - Initialize with 'WAITING' status
    const positionsWithStatus = newPositions.map(pos => ({
        ...pos,
        botId: botConfig.id, 
        symbol: botConfig.symbol || pos.symbol || 'UNKNOWN', 
        status: 'WAITING',
        created_at: new Date().toISOString(),
        live_rsi_value: null,
        trigger_snapshot_rsi: null,
        triggered_at: null,
        pnl: 0,
        pnlPercent: 0,
        currentPrice: 0,
        entryPrice: 0,
        positions: 0,
        investment: botConfig.investment,
        leverage: botConfig.leverage
    }));

    setActivePositions(prev => [...positionsWithStatus, ...prev]);
    
    toast({
        title: "RSI Bot Created",
        description: `${positionsWithStatus.length} new position(s) added to Waiting List.`,
        className: "bg-green-600 text-white"
    });
  }, [toast]);

  const handlePreviewUpdate = useCallback((settings) => {
      setPreviewSettings(settings);
  }, []);

  const handleUpdatePositions = (updatedPositions) => {
      setActivePositions(updatedPositions);
  };

  // Metrics Calculation
  const totalCount = activePositions.length;
  const activeCount = activePositions.filter(p => p.status === 'ACTIVE').length;
  const waitingCount = activePositions.filter(p => p.status === 'WAITING').length;
  const totalProfit = activePositions.reduce((acc, p) => acc + (p.pnl > 0 ? p.pnl : 0), 0).toFixed(2);
  const totalLoss = Math.abs(activePositions.reduce((acc, p) => acc + (p.pnl < 0 ? p.pnl : 0), 0)).toFixed(2);

  return (
    <>
      <Helmet>
        <title>RSI Trading Bot - CryptoBot</title>
      </Helmet>

      <div className="h-full p-4 md:p-6 space-y-6 max-w-[1920px] mx-auto overflow-y-auto custom-scrollbar">
         {/* Top Stats */}
         <CounterCardsGrid 
            activeCount={activeCount}
            pendingCount={waitingCount}
            totalProfit={totalProfit}
            totalLoss={totalLoss}
            totalCount={totalCount}
         />

         <div className="grid grid-cols-1 xl:grid-cols-10 gap-6 min-h-[550px]">
            {/* Left: Preview Chart */}
            <div className="xl:col-span-7 h-full min-h-[500px]">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 h-full flex flex-col shadow-lg">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Strategy Preview
                    </h3>
                    <div className="flex-1">
                        <RSIStrategyPreviewChart 
                            symbol="BTCUSDT"
                            timeframe={previewSettings.timeframe}
                            rsiValue={previewSettings.rsiValue}
                            limit={previewSettings.limit}
                        />
                    </div>
                </div>
            </div>

            {/* Right: Builder */}
            <div className="xl:col-span-3 h-full min-h-[500px]">
                <RSITradingBotBuilder 
                    templates={templates} 
                    onCreateBot={handleCreateBot}
                    onPreviewRSI={handlePreviewUpdate}
                />
            </div>
         </div>

         {/* Bottom: Active Positions Table */}
         <div className="min-h-[300px]">
             <ActiveRSIPositionsTable 
                positions={activePositions}
                onUpdatePositions={handleUpdatePositions}
             />
         </div>
      </div>
    </>
  );
};

export default RSITradingBotPage;