import React, { useState, useRef, useEffect, useCallback } from 'react';
import TechnicalIndicatorsPanel from '@/components/TechnicalIndicatorsPanel';
import RealTimeDataPanel from '@/components/RealTimeDataPanel';
import LiquidationSettingsPanel from '@/components/LiquidationSettingsPanel';
import SymbolSelector from '@/components/SymbolSelector';
import ChartGridLayout from '@/components/ChartGridLayout';
import { Layers, Grid, Square, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/components/ui/use-toast";
import { binanceWS } from '@/utils/binanceWebSocket';

const AdvancedChartPage = () => {
  // State for Layout & Symbols
  const [selectedSymbols, setSelectedSymbols] = useState(['BTCUSDT']);
  const [layoutMode, setLayoutMode] = useState('single'); // 'single' | 'grid'
  const [focusedSymbol, setFocusedSymbol] = useState('BTCUSDT'); // Controls sidebar data
  
  // Chart Settings State
  const [timeframe, setTimeframe] = useState('1h');
  const [activeIndicators, setActiveIndicators] = useState([]);
  
  // Sidebar Data State (for focused symbol)
  const [focusedData, setFocusedData] = useState(null);

  // Liquidation Settings
  const [liquidationSettings, setLiquidationSettings] = useState({
    enabled: false,
    types: {
      long: { enabled: true, style: 'Price Level Markers' },
      short: { enabled: true, style: 'Price Level Markers' },
      total: { enabled: false, style: 'Heatmap' },
    }
  });

  const allChartsRef = useRef(new Map()); 
  const isSyncingRef = useRef(false);
  const { toast } = useToast();

  // 1. Persistence
  useEffect(() => {
    try {
        const savedIndicators = localStorage.getItem('activeIndicators');
        if (savedIndicators) setActiveIndicators(JSON.parse(savedIndicators));
        
        const savedSymbols = localStorage.getItem('selectedSymbols');
        if (savedSymbols) {
            const parsed = JSON.parse(savedSymbols);
            if (Array.isArray(parsed) && parsed.length > 0) setSelectedSymbols(parsed);
        }
    } catch (e) { console.error("Persistence Load Error", e); }
  }, []);

  useEffect(() => {
      localStorage.setItem('activeIndicators', JSON.stringify(activeIndicators));
      localStorage.setItem('selectedSymbols', JSON.stringify(selectedSymbols));
  }, [activeIndicators, selectedSymbols]);

  // Update focused symbol if selection changes
  useEffect(() => {
      if (!selectedSymbols.includes(focusedSymbol)) {
          setFocusedSymbol(selectedSymbols[0] || 'BTCUSDT');
      }
      if (selectedSymbols.length > 1 && layoutMode === 'single') {
          // If we added symbols but are in single mode, maybe stay there or switch?
          // User preference. Keeping current mode is safer.
      }
  }, [selectedSymbols, focusedSymbol, layoutMode]);

  // 2. Fetch data for Side Panel (Focused Symbol) independently 
  // (ChartWrapper handles its own data, but sidebar needs data too. 
  // We can't easily hoist data out of multiple ChartWrappers efficiently without complexity.
  // Easiest is to subscribe to ticker for focused symbol for the sidebar basics)
  useEffect(() => {
      if (!focusedSymbol) return;
      
      // Simple ticker sub for sidebar real-time price
      const sub = binanceWS.subscribe([focusedSymbol], 'ticker', '1m', (data) => {
          if (data.e === '24hrTicker') {
              setFocusedData(prev => ({
                  ...prev,
                  close: parseFloat(data.c),
                  high: parseFloat(data.h),
                  low: parseFloat(data.l),
                  volume: parseFloat(data.v),
                  priceChangePercent: parseFloat(data.P)
              }));
          }
      });
      return () => sub && binanceWS.unsubscribe(sub);
  }, [focusedSymbol]);

  // 3. Chart Synchronization Logic
  const handleTimeScaleChange = useCallback((newRange) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    allChartsRef.current.forEach((chart) => {
      try {
        if (chart) chart.timeScale().setVisibleLogicalRange(newRange);
      } catch(e){}
    });

    isSyncingRef.current = false;
  }, []);

  const registerChart = (id, chart) => {
    if (!chart) return;
    allChartsRef.current.set(id, chart);
    try {
        chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
            handleTimeScaleChange(range);
        });
    } catch(e) {}
  };

  // 4. Handlers
  const handleAddPanel = (item) => {
      const isCustom = typeof item === 'object';
      const type = isCustom ? item.name : item;
      
      const newPanel = { 
          id: Date.now(), 
          type, 
          name: isCustom ? item.name : type,
          isCustom,
          code: isCustom ? item.code : null,
          color: isCustom ? '#e879f9' : undefined,
          isOverlay: false,
          enabled: true,
          settings: {} 
      };
      setActiveIndicators(prev => [...prev, newPanel]);
  };

  const handleRemoveSymbol = (sym) => {
      const newSymbols = selectedSymbols.filter(s => s !== sym);
      setSelectedSymbols(newSymbols);
      if (newSymbols.length === 0) setSelectedSymbols(['BTCUSDT']);
  };

  const visibleSymbols = layoutMode === 'single' ? [selectedSymbols[0]] : selectedSymbols;

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#1a1a1a] p-3 rounded-xl border border-[#2a2a2a] shrink-0 gap-4">
          <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
              <div className="flex items-center gap-2 text-white font-bold shrink-0">
                  <Layers className="text-blue-500" />
                  <span className="hidden md:inline">Advanced Charting</span>
              </div>
              
              {/* Layout Toggles */}
              <div className="flex bg-[#0f0f0f] rounded-lg p-1 border border-[#2a2a2a] shrink-0">
                  <button 
                    onClick={() => setLayoutMode('single')}
                    className={cn(
                        "p-1.5 rounded transition-colors", 
                        layoutMode === 'single' ? "bg-blue-600 text-white" : "text-gray-500 hover:text-white"
                    )}
                    title="Single View"
                  >
                      <Square size={16} />
                  </button>
                  <button 
                    onClick={() => setLayoutMode('grid')}
                    className={cn(
                        "p-1.5 rounded transition-colors", 
                        layoutMode === 'grid' ? "bg-blue-600 text-white" : "text-gray-500 hover:text-white"
                    )}
                    title="Grid View"
                  >
                      <Grid size={16} />
                  </button>
              </div>

              <div className="w-full max-w-md">
                  <SymbolSelector 
                    selectedSymbols={selectedSymbols} 
                    onSymbolsChange={(newSyms) => {
                        setSelectedSymbols(newSyms);
                        if (newSyms.length > 1 && layoutMode === 'single') {
                             setLayoutMode('grid'); // Auto-switch to grid on multi-select
                             toast({ title: "Switched to Grid View", description: "Grid view enabled for multiple symbols." });
                        }
                    }}
                    maxSelections={4}
                  />
              </div>
          </div>
          
          <div className="flex bg-[#0f0f0f] rounded-lg p-1 border border-[#2a2a2a] shrink-0 overflow-x-auto max-w-full">
             {['1m', '15m', '1h', '4h', '1d'].map(tf => (
                 <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={cn(
                        "px-3 py-1 text-xs font-bold rounded transition-colors whitespace-nowrap",
                        timeframe === tf ? "bg-blue-600 text-white shadow-lg" : "text-gray-500 hover:text-white"
                    )}
                 >
                     {tf}
                 </button>
             ))}
          </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
          
          {/* Charts Area */}
          <div className="col-span-12 lg:col-span-9 flex flex-col min-h-0">
             <ChartGridLayout 
                symbols={visibleSymbols}
                timeframe={timeframe}
                activeIndicators={activeIndicators}
                liquidationSettings={liquidationSettings}
                onChartReady={registerChart}
                onRemoveSymbol={handleRemoveSymbol}
                onMaximizeSymbol={(sym) => {
                    handleRemoveSymbol(selectedSymbols.filter(s => s !== sym)); // Actually this just filters out others? No, let's just switch mode
                    const others = selectedSymbols.filter(s => s !== sym);
                    setSelectedSymbols([sym, ...others]); // Move to front
                    setLayoutMode('single');
                }}
             />
          </div>

          {/* Sidebar Tools */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 overflow-hidden h-full">
              {/* Focused Symbol Info */}
              <div className="flex-none">
                  <div className="mb-2 flex items-center gap-2 px-2">
                       <span className="text-xs font-bold text-gray-500">DATA FOR</span>
                       <span className="text-xs font-bold text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-900/50">
                           {focusedSymbol}
                       </span>
                  </div>
                  <RealTimeDataPanel data={focusedData} />
              </div>
              
              <div className="flex-none">
                 <LiquidationSettingsPanel 
                    settings={liquidationSettings}
                    setSettings={setLiquidationSettings}
                 />
              </div>

              <div className="flex-1 min-h-0">
                  <TechnicalIndicatorsPanel 
                    activeIndicators={activeIndicators}
                    onUpdateIndicators={setActiveIndicators} 
                    onAddPanel={handleAddPanel}
                  />
              </div>
          </div>
      </div>
    </div>
  );
};

export default AdvancedChartPage;