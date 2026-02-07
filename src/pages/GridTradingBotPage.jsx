import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import GridTradingBotBuilder from '@/components/GridTradingBotBuilder';
import ActiveGridPositionsTable from '@/components/ActiveGridPositionsTable';
import GridBotChartGrid from '@/components/GridBotChartGrid';
import CounterCardsGrid from '@/components/CounterCardsGrid';
import GridBotEditModal from '@/components/GridBotEditModal';
import { useToast } from '@/components/ui/use-toast';
import { useBotStatusMonitor } from '@/hooks/useBotStatusMonitor'; // Added Hook

const GridTradingBotPage = () => {
  const { toast } = useToast();
  const [bots, setBots] = useState([]);
  const [positions, setPositions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [filterMode, setFilterMode] = useState(null);
  const [previewGridSettings, setPreviewGridSettings] = useState(null);
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);

  // --- NEW: Monitor Bot Status for Notifications ---
  useBotStatusMonitor(positions, 'Grid Bot');
  // -------------------------------------------------

  useEffect(() => {
    const storedTemplates = localStorage.getItem('tradingTemplates');
    if (storedTemplates) {
      setTemplates(JSON.parse(storedTemplates));
    }

    const storedBots = localStorage.getItem('gridTradingBots');
    if (storedBots) {
      setBots(JSON.parse(storedBots));
    }

    // Mock initial positions or load from storage
    if (!localStorage.getItem('activeGridPositions')) {
        const mockPositions = [
            {
                id: '1',
                symbol: 'BTCUSDT',
                gridType: 'Futures',
                numGrids: 20,
                lowerPrice: 65000,
                upperPrice: 75000,
                currentPrice: 68500,
                status: 'ACTIVE',
                gridProfit: 125.50,
                unrealizedPnl: 450.00,
                pnlPercentage: 3.5,
                gridSpacingType: 'Fixed',
                gridSpacingValue: 500
            }
        ];
        setPositions(mockPositions);
        localStorage.setItem('activeGridPositions', JSON.stringify(mockPositions));
    } else {
        setPositions(JSON.parse(localStorage.getItem('activeGridPositions')));
    }
    
    // Also load the preview settings if any (optional persistence for UX)
    const storedPreview = localStorage.getItem('gridBotPreviewSettings');
    if (storedPreview) {
        setPreviewGridSettings(JSON.parse(storedPreview));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('gridTradingBots', JSON.stringify(bots));
  }, [bots]);

  useEffect(() => {
     localStorage.setItem('activeGridPositions', JSON.stringify(positions));
  }, [positions]);

  // Handler now accepts both the config (for logs/history) and the specific new positions (for active trading)
  const handleCreateBot = useCallback((newBotConfig, newPositions) => {
    // 1. Store the bot configuration
    setBots(prev => [...prev, newBotConfig]);
    
    // 2. Add all new positions to the active list
    // newPositions is already an array of formatted position objects from the builder
    if (newPositions && newPositions.length > 0) {
        setPositions(prev => [...newPositions, ...prev]);
        
        // 3. Automatically select the first new position for viewing
        setSelectedPosition(newPositions[0]);
    }
  }, []);

  const handlePositionSelect = (position) => {
      if (selectedPosition?.id === position.id) {
          setSelectedPosition(null);
      } else {
          setSelectedPosition(position);
      }
  };
  
  const handleCardClick = (mode) => {
      if (filterMode === mode || mode === 'total') {
          setFilterMode(null);
      } else {
          setFilterMode(mode);
      }
  };

  // Wrapped in useCallback to prevent infinite loops in Builder component
  const handlePreviewGrid = useCallback((settings) => {
      // settings contains { lowerPrice, upperPrice, numGrids, gridSpacingType, gridSpacingValue }
      setPreviewGridSettings(settings);
      // Persist for UX continuity
      localStorage.setItem('gridBotPreviewSettings', JSON.stringify(settings));
  }, []);

  // Edit Handlers
  const handleEditPosition = (position) => {
    setEditingPosition(position);
    setIsEditModalOpen(true);
  };

  const handleSavePosition = (updatedPosition) => {
    setPositions(prev => prev.map(p => p.id === updatedPosition.id ? updatedPosition : p));
    toast({
      title: "Bot Updated",
      description: `Settings for ${updatedPosition.symbol} have been updated successfully.`,
      className: "bg-green-500 border-green-600 text-white"
    });
    
    // If we're currently viewing this bot, ensure the chart updates
    if (selectedPosition?.id === updatedPosition.id) {
        setSelectedPosition(updatedPosition);
    }
  };

  const activeCount = positions.filter(p => p.status === 'ACTIVE').length;
  const pendingCount = positions.filter(p => p.status === 'PENDING').length;
  const totalProfit = positions.reduce((acc, p) => p.unrealizedPnl > 0 ? acc + p.unrealizedPnl : acc, 0).toFixed(2);
  const totalLoss = Math.abs(positions.reduce((acc, p) => p.unrealizedPnl < 0 ? acc + p.unrealizedPnl : acc, 0)).toFixed(2);

  // Memoize grid settings to prevent unnecessary re-renders in child components
  const chartGridSettings = useMemo(() => {
    return selectedPosition ? {
        lowerPrice: selectedPosition.lowerPrice,
        upperPrice: selectedPosition.upperPrice,
        numGrids: selectedPosition.numGrids,
        gridSpacingType: selectedPosition.gridSpacingType,
        gridSpacingValue: selectedPosition.gridSpacingValue
    } : previewGridSettings;
  }, [selectedPosition, previewGridSettings]);

  return (
    <>
      <Helmet>
        <title>Grid Trading Bot - CryptoBot</title>
      </Helmet>

      <div className="h-full p-4 md:p-6 space-y-6 max-w-[1920px] mx-auto">
         {/* Counters Section */}
         <CounterCardsGrid 
            activeCount={activeCount}
            pendingCount={pendingCount}
            totalProfit={totalProfit}
            totalLoss={totalLoss}
            totalCount={positions.length}
            onCardClick={handleCardClick}
            filterMode={filterMode}
         />

         {/* Main Content Grid */}
         <div className="grid grid-cols-1 xl:grid-cols-10 gap-6 min-h-[500px]">
            {/* Chart Section */}
            <div className="xl:col-span-7 h-full min-h-[500px]">
                <GridBotChartGrid 
                    symbols={[...new Set(positions.map(p => p.symbol))]} 
                    selectedPosition={selectedPosition}
                    gridSettings={chartGridSettings}
                    previewMode={!selectedPosition}
                    previewSymbol="BTCUSDT" // Default for builder preview
                />
            </div>

            {/* Builder Section */}
            <div className="xl:col-span-3 h-full min-h-[500px]">
                <GridTradingBotBuilder 
                    templates={templates} 
                    onCreateBot={handleCreateBot}
                    onPreviewGrid={handlePreviewGrid}
                />
            </div>
         </div>

         {/* Active Positions Table */}
         <div className="min-h-[300px]">
             <ActiveGridPositionsTable 
                positions={positions} 
                onPositionSelect={handlePositionSelect}
                filterMode={filterMode}
                onUpdatePositions={setPositions}
                onEditPosition={handleEditPosition}
             />
         </div>
      </div>

      <GridBotEditModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        position={editingPosition}
        onSave={handleSavePosition}
      />
    </>
  );
};

export default GridTradingBotPage;