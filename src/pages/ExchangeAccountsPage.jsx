import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Wallet, ShieldCheck, Info } from 'lucide-react';
import { useExchangeAccounts } from '@/context/ExchangeAccountsContext';
import ExchangeAccountCard from '@/components/ExchangeAccountCard';
import ExchangeAccountModal from '@/components/ExchangeAccountModal';
import TestConnectionModal from '@/components/TestConnectionModal';

const ExchangeAccountsPage = () => {
  const { accounts, addAccount, updateAccount, deleteAccount, testConnection } = useExchangeAccounts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  
  // Test Result Modal State
  const [testModal, setTestModal] = useState({
      isOpen: false,
      status: 'loading', // loading | success | error
      message: '',
      timestamp: null
  });

  const handleAddClick = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    if (editingAccount) {
      await updateAccount(editingAccount.id, formData);
    } else {
      await addAccount(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this exchange account? This will stop any active bots associated with it.')) {
        deleteAccount(id);
    }
  };

  const handleTestConnection = async (id) => {
      setTestModal({ isOpen: true, status: 'loading', message: 'Connecting to exchange...', timestamp: null });
      try {
          const result = await testConnection(id);
          setTestModal({ 
              isOpen: true, 
              status: 'success', 
              message: result.message, 
              timestamp: new Date().toISOString() 
          });
      } catch (error) {
          setTestModal({ 
              isOpen: true, 
              status: 'error', 
              message: error.message || 'Failed to connect.', 
              timestamp: new Date().toISOString() 
          });
      }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">My Exchange Accounts</h1>
          <p className="text-gray-400 text-sm max-w-2xl">
            Manage your API connections to external exchanges. Ensure your keys have "Spot Trading" enabled but "Withdrawals" disabled for security.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddClick}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all"
        >
          <Plus size={20} />
          Add New Account
        </motion.button>
      </div>

      {/* Security Banner */}
      <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-4 flex gap-4 items-center shadow-sm">
         <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="text-green-500" size={20} />
         </div>
         <div>
            <h3 className="text-sm font-bold text-gray-200">Security First</h3>
            <p className="text-xs text-gray-500 mt-0.5">Your API keys are encrypted locally and never shared. We recommend using IP whitelisting for maximum security.</p>
         </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode='popLayout'>
            {accounts.map(account => (
                <ExchangeAccountCard 
                    key={account.id}
                    account={account}
                    onEdit={handleEditClick}
                    onDelete={handleDelete}
                    onTest={handleTestConnection}
                />
            ))}
        </AnimatePresence>

        {/* Empty State Card (if no accounts, or as an 'Add' placeholder) */}
        {accounts.length === 0 && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-[#2a2a2a] rounded-xl bg-[#1a1a1a]/30"
            >
                <div className="w-16 h-16 rounded-full bg-[#252525] flex items-center justify-center mb-4 text-gray-600">
                    <Wallet size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Exchange Accounts</h3>
                <p className="text-gray-400 text-sm max-w-md mb-6">
                    Connect your first exchange account to start using trading bots and tracking your portfolio.
                </p>
                <button 
                    onClick={handleAddClick}
                    className="text-blue-400 hover:text-blue-300 font-medium text-sm flex items-center gap-2"
                >
                    <Plus size={16} /> Connect Account
                </button>
            </motion.div>
        )}
      </div>

      {/* Modals */}
      <ExchangeAccountModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingAccount}
        onSubmit={handleSubmit}
        title={editingAccount ? "Edit Exchange Account" : "Connect New Exchange"}
      />

      <TestConnectionModal 
        isOpen={testModal.isOpen}
        status={testModal.status}
        message={testModal.message}
        timestamp={testModal.timestamp}
        onClose={() => setTestModal(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
};

export default ExchangeAccountsPage;