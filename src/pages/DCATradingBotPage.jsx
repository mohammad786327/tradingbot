import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import DCATradingBotBuilder from '@/components/DCATradingBotBuilder';
import ActiveDCABotsTable from '@/components/ActiveDCABotsTable';
import DCAChartGrid from '@/components/DCAChartGrid';
import CounterCardsGrid from '@/components/CounterCardsGrid';
import { useToast } from '@/components/ui/use-toast';
import { useBotStatusMonitor } from '@/hooks/useBotStatusMonitor'; // Added Hook

const DCATradingBotPage = () => {
  const { toast } = useToast();
  const [bots, setBots] = useState([]);
  const [activeBots, setActiveBots] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedBot, setSelectedBot] = useState(null);
  const [filterMode, setFilterMode] = useState(null);
  const [previewDCASettings, setPreviewDCASettings] = useState(null);
  
  // Mock live price for builder calculation demo
  const [mockCurrentPrice] = useState(67450.00); 

  // --- NEW: Monitor Bot Status for Notifications ---
  useBotStatusMonitor(activeBots, 'DCA Bot');
  // -------------------------------------------------

  useEffect(() => {
    const storedTemplates = localStorage.getItem('tradingTemplates');
    if (storedTemplates) {
      setTemplates(JSON.parse(storedTemplates));
    }

    const storedBots = localStorage.getItem('dcaTradingBots');
    if (storedBots) {
      setBots(JSON.parse(storedBots));
    }

    // Mock initial or load from storage
    if (!localStorage.getItem('activeDCABots')) {
        const mockBots = [
            {
                id: '1',
                symbol: 'BTCUSDT',
                mode: 'Auto',
                maxOrders: 5,
                ordersExecuted: 2,
                avgPrice: 67200,
                currentPrice: 66800,
                status: 'ACTIVE',
                totalInvested: 1200,
                pnl: -45.50,
                pnlPercent: -3.79,
                riskProfile: 'Conservative',
                stepScale: 1.0 
            }
        ];
        setActiveBots(mockBots);
        localStorage.setItem('activeDCABots', JSON.stringify(mockBots));
    } else {
        setActiveBots(JSON.parse(localStorage.getItem('activeDCABots')));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('dcaTradingBots', JSON.stringify(bots));
  }, [bots]);

  useEffect(() => {
     localStorage.setItem('activeDCABots', JSON.stringify(activeBots));
  }, [activeBots]);

  const handleCreateBot = useCallback((newBotConfig, newActiveBots) => {
    setBots(prev => [...prev, newBotConfig]);
    if (newActiveBots && newActiveBots.length > 0) {
        setActiveBots(prev => [...newActiveBots, ...prev]);
        setSelectedBot(newActiveBots[0]);
    }
  }, []);

  const handleBotSelect = (bot) => {
      if (selectedBot?.id === bot.id) {
          setSelectedBot(null);
      } else {
          setSelectedBot(bot);
      }
  };
  
  const handleCardClick = (mode) => {
      setFilterMode(prev => prev === mode || mode === 'total' ? null : mode);
  };

  const handleEditBot = (bot) => {
    toast({ title: "Edit Mode", description: "Edit functionality coming soon." });
  };

  const handlePreviewDCA = useCallback((settings) => {
      setPreviewDCASettings(settings);
  }, []);

  // Metrics for counters
  const activeCount = activeBots.filter(b => b.status === 'ACTIVE').length;
  const pendingCount = activeBots.filter(b => b.status !== 'ACTIVE').length; 
  const totalProfit = activeBots.reduce((acc, b) => b.pnl > 0 ? acc + b.pnl : acc, 0).toFixed(2);
  const totalLoss = Math.abs(activeBots.reduce((acc, b) => b.pnl < 0 ? acc + b.pnl : acc, 0)).toFixed(2);

  // Memoize settings passed to chart
  const chartSettings = useMemo(() => {
    return selectedBot ? {
        maxOrders: selectedBot.maxOrders,
        stepScale: selectedBot.stepScale,
        volumeScale: selectedBot.volumeScale,
        riskProfile: selectedBot.riskProfile
    } : previewDCASettings;
  }, [selectedBot, previewDCASettings]);

  return (
    <>
      <Helmet>
        <title>DCA Trading Bot - CryptoBot</title>
      </Helmet>

      <div className="h-full p-4 md:p-6 space-y-6 max-w-[1920px] mx-auto">
         {/* Counters Section */}
         <CounterCardsGrid 
            activeCount={activeCount}
            pendingCount={pendingCount}
            totalProfit={totalProfit}
            totalLoss={totalLoss}
            totalCount={activeBots.length}
            onCardClick={handleCardClick}
            filterMode={filterMode}
         />

         {/* Main Content Grid */}
         <div className="grid grid-cols-1 xl:grid-cols-10 gap-6 min-h-[500px]">
            {/* Chart Section */}
            <div className="xl:col-span-7 h-full min-h-[500px]">
                <DCAChartGrid 
                    symbols={[...new Set(activeBots.map(b => b.symbol))]} 
                    selectedBot={selectedBot}
                    dcaSettings={chartSettings}
                    previewMode={!selectedBot}
                    previewSymbol="BTCUSDT"
                />
            </div>

            {/* Builder Section */}
            <div className="xl:col-span-3 h-full min-h-[500px]">
                <DCATradingBotBuilder 
                    templates={templates} 
                    onCreateBot={handleCreateBot}
                    onPreviewDCA={handlePreviewDCA}
                    currentPrice={mockCurrentPrice}
                />
            </div>
         </div>

         {/* Active Bots Table */}
         <div className="min-h-[300px]">
             <ActiveDCABotsTable 
                bots={activeBots} 
                onBotSelect={handleBotSelect}
                filterMode={filterMode}
                onUpdateBots={setActiveBots}
                onEditBot={handleEditBot}
             />
         </div>
      </div>
    </>
  );
};

export default DCATradingBotPage;