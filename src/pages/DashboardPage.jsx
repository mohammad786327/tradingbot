import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { storageManager } from '@/utils/storageManager';

// Hooks
import { useRealTimePositionData } from '@/hooks/useRealTimePositionData';
import { useRealTimeBotMetrics } from '@/hooks/useRealTimeBotMetrics';

// Components
import DashboardOverviewCards from '@/components/DashboardOverviewCards';
import DashboardStatsGrid from '@/components/DashboardStatsGrid';
import ComprehensivePositionsTable from '@/components/ComprehensivePositionsTable';
import BotPerformanceCharts from '@/components/BotPerformanceCharts';
import RecentActivityLog from '@/components/RecentActivityLog';
import MultiAccountWallet from '@/components/MultiAccountWallet';
import { activityLogger } from '@/utils/ActivityLogger';

const DashboardPage = () => {
  // 1. Data Hooks
  const { positions, refreshPositions } = useRealTimePositionData();
  const metrics = useRealTimeBotMetrics(positions);

  // 2. Init
  useEffect(() => {
    storageManager.init();
    activityLogger.log('SYSTEM', 'Dashboard Loaded', 'User accessed the command center');
  }, []);

  return (
    <>
      <Helmet>
        <title>Command Center - CryptoBot</title>
        <meta name="description" content="Real-time cryptocurrency trading dashboard and command center" />
      </Helmet>

      <div className="min-h-screen bg-[#0f0f0f] text-white p-4 lg:p-6 custom-scrollbar pb-20">
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
               <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded border border-green-500/30 animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> System Online
               </span>
               <span className="text-xs text-gray-500 font-mono">v3.0.0-RT</span>
            </div>
          </div>

          {/* 1. Top Section: Overview Cards */}
          <section>
             <DashboardOverviewCards metrics={metrics} />
          </section>

          {/* 2. Middle Grid Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
             
             {/* Left Column: Stats & Charts (3 cols) */}
             <div className="xl:col-span-3 space-y-6">
                {/* Stats Grid */}
                <DashboardStatsGrid metrics={metrics} />
                
                {/* Main Positions Table */}
                <ComprehensivePositionsTable positions={positions} />
                
                {/* Bottom Charts */}
                <div className="h-64">
                    <BotPerformanceCharts metrics={metrics} />
                </div>
             </div>

             {/* Right Column: Sidebar (1 col) */}
             <div className="xl:col-span-1 space-y-6 flex flex-col">
                <div className="flex-none">
                    <MultiAccountWallet />
                </div>
                <div className="flex-1 min-h-[400px]">
                    <RecentActivityLog />
                </div>
             </div>
             
          </div>

        </div>
      </div>
    </>
  );
};

export default DashboardPage;