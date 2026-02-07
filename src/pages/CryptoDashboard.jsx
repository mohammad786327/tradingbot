import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { storageManager } from '@/utils/storageManager';

// Components
import PortfolioOverview from '@/components/PortfolioOverview';
import MultiAccountWallet from '@/components/MultiAccountWallet';
import OpenPositions from '@/components/OpenPositions';
import Watchlist from '@/components/Watchlist';
import AdvancedChart from '@/components/AdvancedChart';
import MarketHeatMap from '@/components/MarketHeatMap';
import OrderBookVisualization from '@/components/OrderBookVisualization';
import RiskManagementPanel from '@/components/RiskManagementPanel';
import BotPerformanceMetrics from '@/components/BotPerformanceMetrics';
import RecentTrades from '@/components/RecentTrades';
import NotificationCenter from '@/components/NotificationCenter';
import MarketOverview from '@/components/MarketOverview';

const CryptoDashboard = () => {
  useEffect(() => {
    storageManager.init();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-4 lg:p-6 custom-scrollbar">
      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              Command Center
            </h1>
            <p className="text-gray-500 text-sm">Real-time market intelligence & portfolio tracking</p>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded border border-green-500/30 animate-pulse">
                ● System Online
             </span>
             <span className="text-xs text-gray-500 font-mono">v2.4.0-stable</span>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Top Row: Portfolio & Wallets */}
          <div className="col-span-12 lg:col-span-8">
            <PortfolioOverview />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <MultiAccountWallet />
          </div>

          {/* Middle Row: Charts & Tables */}
          <div className="col-span-12 lg:col-span-9 grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Chart takes up full width of this sub-grid on mobile, half on desktop */}
             <div className="col-span-1 lg:col-span-2 h-[450px]">
                 <AdvancedChart />
             </div>
             
             <div className="col-span-1 h-[400px]">
                 <OpenPositions />
             </div>
             
             <div className="col-span-1 h-[400px]">
                 <MarketHeatMap />
             </div>
          </div>

          {/* Right Sidebar Column */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
             <Watchlist />
             <MarketOverview />
             <NotificationCenter />
          </div>

          {/* Bottom Row: Utilities */}
          <div className="col-span-12 md:col-span-4">
              <RiskManagementPanel />
          </div>
          <div className="col-span-12 md:col-span-4">
              <BotPerformanceMetrics />
          </div>
          <div className="col-span-12 md:col-span-4">
              <OrderBookVisualization />
          </div>
          
          {/* Full Width Footer Table */}
          <div className="col-span-12">
              <RecentTrades />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoDashboard;