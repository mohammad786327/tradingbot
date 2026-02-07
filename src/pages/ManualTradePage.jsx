import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { TrendingUp, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

import ExchangeAccountSelector from '@/components/ExchangeAccountSelector';
import TradeTypeToggle from '@/components/TradeTypeToggle';
import TradingStatsCounters from '@/components/TradingStatsCounters';
import OpenOrdersTable from '@/components/OpenOrdersTable';
import MultiSymbolTradePanel from '@/components/MultiSymbolTradePanel';
import { useExchangeAccounts } from '@/context/ExchangeAccountsContext';

const ManualTradePage = () => {
  const { accounts } = useExchangeAccounts();
  const { toast } = useToast();
  const [selectedAccountId, setSelectedAccountId] = useState(accounts.length > 0 ? accounts[0].id : null);
  const [tradeType, setTradeType] = useState('Spot');
  
  // State for multi-symbol panel
  const [selectedSymbols, setSelectedSymbols] = useState(['BTCUSDT', 'ETHUSDT']);
  
  // Mock Data for Stats & Orders
  const [openOrders, setOpenOrders] = useState([
      { id: '1', symbol: 'BTCUSDT', side: 'Buy', type: 'Limit', price: '62500.00', currentPrice: '63120.50', quantity: '0.05', pnl: '0.00', pnlPercent: '0.00', status: 'Pending', marginType: 'Spot' },
      { id: '2', symbol: 'ETHUSDT', side: 'Long', type: 'Market', price: '3150.00', currentPrice: '3210.00', quantity: '1.5', pnl: '+90.00', pnlPercent: '1.90', status: 'Active', marginType: 'Cross 20x' },
      { id: '3', symbol: 'SOLUSDT', side: 'Short', type: 'Limit', price: '145.50', currentPrice: '142.20', quantity: '25', pnl: '+82.50', pnlPercent: '2.27', status: 'Active', marginType: 'Iso 10x' }
  ]);

  const stats = {
      openOrders: openOrders.length,
      winRate: 68.5,
      totalPnL: '+1,245.80',
      avgDuration: '4h 12m'
  };

  const handleCancelOrder = (id) => {
      setOpenOrders(prev => prev.filter(o => o.id !== id));
      toast({
          title: "Order Cancelled",
          description: `Order #${id} has been cancelled successfully.`,
      });
  };

  const handleEditOrder = (order) => {
      toast({
          title: "Edit Order",
          description: `Editing ${order.symbol} order... (Functionality simulated)`,
          variant: "info"
      });
  };

  return (
    <>
      <Helmet>
        <title>Manual Trade - CryptoBot</title>
      </Helmet>

      {/* Removed max-w-[1920px] and mx-auto constraints, ensure full width usage */}
      <div className="h-full w-full p-4 md:p-6 lg:p-8 space-y-8 min-h-[calc(100vh-64px)] overflow-x-hidden">
        
        {/* Top Header Section */}
        <div className="flex flex-col xl:flex-row gap-6 justify-between xl:items-start">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Manual Trading Terminal</h1>
                <p className="text-gray-400">Execute trades and manage active positions across multiple pairs.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Global Trade Type Preference (Acts as default for new panels or general context) */}
                <div className="w-full sm:w-64">
                    <TradeTypeToggle activeType={tradeType} onChange={setTradeType} />
                </div>
                <ExchangeAccountSelector 
                      selectedAccountId={selectedAccountId} 
                      onAccountChange={setSelectedAccountId} 
                />
            </div>
        </div>

        {/* Stats Section */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full"
        >
            <TradingStatsCounters 
                openOrdersCount={stats.openOrders}
                winRate={stats.winRate}
                totalPnL={stats.totalPnL}
                avgDuration={stats.avgDuration}
            />
        </motion.div>

        {/* Multi-Panel Trading Grid */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full"
        >
             <MultiSymbolTradePanel 
                 selectedSymbols={selectedSymbols} 
                 onSymbolsChange={setSelectedSymbols}
             />
        </motion.div>

        {/* Open Orders Table */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pb-8 w-full"
        >
            <OpenOrdersTable 
                orders={openOrders}
                onCancelOrder={handleCancelOrder}
                onEditOrder={handleEditOrder}
            />
        </motion.div>

      </div>
    </>
  );
};

export default ManualTradePage;