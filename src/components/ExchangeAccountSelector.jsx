import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Wallet, Search, X } from 'lucide-react';
import { useExchangeAccounts } from '@/context/ExchangeAccountsContext';
import { cn } from '@/lib/utils';

// Reusing the Logo logic for consistency
const ExchangeLogo = ({ exchange }) => {
  const name = exchange?.toLowerCase() || '';

  if (name.includes('binance')) return (
      <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 0L20.8 4.8L16 9.6L11.2 4.8L16 0ZM4.8 11.2L9.6 16L4.8 20.8L0 16L4.8 11.2ZM27.2 11.2L32 16L27.2 20.8L22.4 16L27.2 11.2ZM16 22.4L20.8 27.2L16 32L11.2 27.2L16 22.4ZM16 13.4L18.6 16L16 18.6L13.4 16L16 13.4Z" fill="#F0B90B"/></svg>
  );
  if (name.includes('coinbase')) return (
      <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32Z" fill="#0052FF"/><path d="M16 22.5C19.5899 22.5 22.5 19.5899 22.5 16C22.5 12.4101 19.5899 9.5 16 9.5C12.4101 9.5 9.5 12.4101 9.5 16C9.5 19.5899 12.4101 22.5 16 22.5Z" fill="white"/></svg>
  );
  if (name.includes('kraken')) return (
      <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 32C24.837 32 32 24.837 32 16C32 7.163 24.837 0 16 0C7.163 0 0 7.163 0 16C0 24.837 7.163 32 16 32Z" fill="#5741D9"/><path d="M16.94 9.17H14.98V15.53L10.48 11.03L9.07 12.44L14.33 17.7C13.88 18.27 13.2 18.63 12.43 18.63H9.41V20.63H12.43C13.98 20.63 15.31 19.82 16 18.63C16.69 19.82 18.02 20.63 19.57 20.63H22.59V18.63H19.57C18.8 18.63 18.12 18.27 17.67 17.7L22.93 12.44L21.52 11.03L16.94 15.61V9.17Z" fill="white"/></svg>
  );
  if (name.includes('bybit')) return (
      <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" rx="16" fill="#17181E"/><path d="M16 6L24.6603 11V21L16 26L7.33975 21V11L16 6Z" fill="#F7A600"/><path d="M16 9L21.1962 12V18L16 21L10.8038 18V12L16 9Z" fill="#17181E"/><path d="M16 12L18.5981 13.5V16.5L16 18L13.4019 16.5V13.5L16 12Z" fill="#F7A600"/></svg>
  );
  if (name.includes('okx')) return (
      <svg viewBox="0 0 32 32" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" rx="16" fill="white"/><path d="M9 9H14V14H9V9Z" fill="black"/><path d="M18 9H23V14H18V9Z" fill="black"/><path d="M9 18H14V23H9V18Z" fill="black"/><path d="M18 18H23V23H18V18Z" fill="black"/><path d="M14 14H18V18H14V14Z" fill="black"/></svg>
  );
  
  return <Wallet className="w-5 h-5 text-gray-400" />;
};

const ExchangeAccountSelector = ({ selectedAccountId, onAccountChange }) => {
  const { accounts, isLoading } = useExchangeAccounts();
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  if (isLoading) {
      return <div className="h-10 w-48 bg-[#2a2a2a] animate-pulse rounded-xl"></div>;
  }

  if (accounts.length === 0) {
      return (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-500 text-sm">
              <Wallet size={16} />
              <span>No Accounts</span>
          </div>
      );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] hover:border-[#3a3a3a] text-white px-4 py-2.5 rounded-xl transition-all shadow-sm group min-w-[240px]"
      >
        <div className="w-8 h-8 rounded-lg bg-[#2a2a2a] flex items-center justify-center border border-[#333] group-hover:border-[#444] transition-colors">
            {selectedAccount ? <ExchangeLogo exchange={selectedAccount.exchange} /> : <Wallet size={16} />}
        </div>
        
        <div className="flex-1 text-left">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider leading-none mb-1">Active Account</p>
            <p className="text-sm font-bold truncate max-w-[140px] leading-none">
                {selectedAccount ? selectedAccount.name : 'Select Account'}
            </p>
        </div>

        <ChevronDown 
            size={16} 
            className="text-gray-500 group-hover:text-white transition-colors" 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
                 <h2 className="text-lg font-bold text-white">Select Account</h2>
                 <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-[#252525] transition-colors">
                   <X size={20} />
                 </button>
              </div>

              <div className="p-4">
                  <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input 
                          type="text" 
                          placeholder="Search accounts..." 
                          className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-gray-600"
                      />
                  </div>

                  <div className="max-h-[320px] overflow-y-auto custom-scrollbar space-y-2">
                    {accounts.map(account => (
                      <button
                        key={account.id}
                        onClick={() => {
                            onAccountChange(account.id);
                            setIsOpen(false);
                        }}
                        className={cn(
                            "w-full flex items-center gap-4 p-3 rounded-xl transition-all text-left border group",
                            selectedAccountId === account.id 
                                ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)]" 
                                : "bg-[#252525] border-transparent hover:border-[#3a3a3a] hover:bg-[#2a2a2a]"
                        )}
                      >
                         <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center border border-[#333] shrink-0">
                             <ExchangeLogo exchange={account.exchange} />
                         </div>
                         
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <span className={cn(
                                    "font-bold text-sm truncate",
                                    selectedAccountId === account.id ? "text-blue-400" : "text-white"
                                )}>
                                    {account.name}
                                </span>
                                {selectedAccountId === account.id && <Check size={16} className="text-blue-500" />}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-[#1a1a1a] border border-[#333] text-gray-400 px-1.5 py-0.5 rounded uppercase tracking-wider">{account.exchange}</span>
                                <div className="flex items-center gap-1">
                                    <span className={cn("w-1.5 h-1.5 rounded-full", account.status === 'connected' ? "bg-green-500" : "bg-red-500")}></span>
                                    <span className="text-[10px] text-gray-500 capitalize">{account.status}</span>
                                </div>
                            </div>
                         </div>
                      </button>
                    ))}
                  </div>
              </div>
              
              <div className="p-4 bg-[#0f0f0f] border-t border-[#2a2a2a] text-center">
                  <p className="text-xs text-gray-500">Manage your accounts in <span className="text-blue-400 hover:underline cursor-pointer">Exchange Settings</span></p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ExchangeAccountSelector;