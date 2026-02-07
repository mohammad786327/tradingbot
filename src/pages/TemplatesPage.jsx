import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import CounterCards from '@/components/CounterCards';
import ChartGrid from '@/components/ChartGrid';
import TemplateBuilder from '@/components/TemplateBuilder';
import TemplatesTable from '@/components/TemplatesTable';
import ExchangeAccountSelector from '@/components/ExchangeAccountSelector';
import LivePriceTicker from '@/components/LivePriceTicker';
import { useToast } from '@/components/ui/use-toast';
import { useExchangeAccounts } from '@/context/ExchangeAccountsContext';

const TemplatesPage = () => {
  const { toast } = useToast();
  const { accounts } = useExchangeAccounts();
  const [templates, setTemplates] = useState([]);
  const [selectedSymbols, setSelectedSymbols] = useState(['BTCUSDT', 'ETHUSDT']); 
  const [timeframe, setTimeframe] = useState('15m');
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  // New state for account selection
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  
  // New state for filtering from CounterCards
  const [filterMode, setFilterMode] = useState(null); // 'active', 'pending', 'profitable', 'loss', null

  useEffect(() => {
    const stored = localStorage.getItem('tradingTemplates');
    if (stored) {
      setTemplates(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    // If no account is selected but we have accounts, select the first one
    if (!selectedAccountId && accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (templates.length > 0) {
      localStorage.setItem('tradingTemplates', JSON.stringify(templates));
    }
  }, [templates]);

  const handleSaveTemplate = (template) => {
    // Ensure template has the current account ID
    const templateWithAccount = {
        ...template,
        exchangeAccountId: selectedAccountId
    };

    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === template.id ? templateWithAccount : t));
      setEditingTemplate(null);
    } else {
      setTemplates(prev => [...prev, templateWithAccount]);
    }

    if (template.symbols.length > 0) {
      setSelectedSymbols(template.symbols);
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    if (template.exchangeAccountId) {
        setSelectedAccountId(template.exchangeAccountId);
    }
    
    if (template.symbols && template.symbols.length > 0) {
      setSelectedSymbols(template.symbols);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTemplate = (id) => {
    const template = templates.find(t => t.id === id);
    if (template.deleted) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast({
        title: 'Template Deleted',
        description: 'Permanently removed from storage.'
      });
    } else {
      setTemplates(prev => prev.map(t => 
        t.id === id ? { ...t, deleted: true } : t
      ));
      toast({
        title: 'Template Trashed',
        description: 'Moved to trash bin.'
      });
    }
  };

  const handleBuilderSymbolsChange = (symbols) => {
    if (symbols.length > 0) {
        setSelectedSymbols(symbols);
    }
  };
  
  const handleSelectFilter = (filter) => {
      if (filter === 'total') {
          setFilterMode(null);
      } else {
          setFilterMode(filter);
      }
  };

  const timeframeOptions = ['1m', '5m', '15m', '1h', '4h', '1d'];

  return (
    <>
      <Helmet>
        <title>Templates - CryptoBot</title>
      </Helmet>

      <div className="h-full p-4 md:p-8 space-y-6 max-w-[1920px] mx-auto overflow-x-hidden">
        
        {/* Header Area with Account Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div>
                <h1 className="text-2xl font-bold text-white">Strategy Templates</h1>
                <p className="text-gray-400 text-sm">Create and manage your trading strategies per exchange account.</p>
            </div>
            
            <ExchangeAccountSelector 
                selectedAccountId={selectedAccountId} 
                onAccountChange={setSelectedAccountId} 
            />
        </div>

        {/* Top Row: Counters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <CounterCards 
            templates={templates.filter(t => !selectedAccountId || t.exchangeAccountId === selectedAccountId || !t.exchangeAccountId)} 
            selectedFilter={filterMode} 
            onSelectFilter={handleSelectFilter}
          />
        </motion.div>

        {/* Middle Row: Charts (70%) & Builder (30%) */}
        <div className="grid grid-cols-1 xl:grid-cols-10 gap-6 min-h-[650px]">
          
          {/* Charts Section */}
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="xl:col-span-7 flex flex-col bg-[#1a1a1a] rounded-2xl p-6 border border-[#2a2a2a] shadow-lg overflow-hidden"
          >
            {/* Chart Header Row */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-white shrink-0">Chart Preview</h2>
              
              <div className="flex bg-[#0f0f0f] p-1.5 rounded-xl border border-[#2a2a2a] shrink-0">
                {timeframeOptions.map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 text-xs sm:text-sm font-bold rounded-lg transition-all ${
                      timeframe === tf
                        ? 'bg-[#2a2a2a] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Ticker Row */}
            {selectedSymbols.length > 0 && (
                <div className="w-full overflow-hidden mb-4 pb-2 border-b border-[#2a2a2a]/40 min-h-[50px]">
                    <LivePriceTicker symbols={selectedSymbols} />
                </div>
            )}
            
            {/* Chart Grid Area */}
            <div className="flex-1 w-full min-h-[500px]">
              <ChartGrid symbols={selectedSymbols} timeframe={timeframe} />
            </div>
          </motion.div>

          {/* Builder Section */}
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="xl:col-span-3 h-full overflow-hidden"
          >
            <TemplateBuilder 
              onSave={handleSaveTemplate} 
              editingTemplate={editingTemplate}
              onCancelEdit={() => setEditingTemplate(null)}
              onSymbolsChange={handleBuilderSymbolsChange}
              selectedAccountId={selectedAccountId}
            />
          </motion.div>
        </div>

        {/* Bottom Row: Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full pb-8"
        >
          <TemplatesTable
            templates={templates}
            onEdit={handleEditTemplate}
            onDelete={handleDeleteTemplate}
            filterMode={filterMode}
            selectedAccountId={selectedAccountId}
          />
        </motion.div>
      </div>
    </>
  );
};

export default TemplatesPage;