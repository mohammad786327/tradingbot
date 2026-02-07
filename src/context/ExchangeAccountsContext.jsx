import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

const ExchangeAccountsContext = createContext();

export const useExchangeAccounts = () => {
  const context = useContext(ExchangeAccountsContext);
  if (!context) {
    throw new Error('useExchangeAccounts must be used within ExchangeAccountsProvider');
  }
  return context;
};

export const ExchangeAccountsProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('exchangeAccounts');
    if (stored) {
      setAccounts(JSON.parse(stored));
    } else {
      // Default demo account
      const demo = {
         id: 'demo-1',
         name: 'Demo Exchange Account',
         exchange: 'Binance',
         status: 'connected',
         lastSynced: new Date().toISOString(),
         apiKey: 'demo_key_abc123',
         apiSecret: 'demo_secret_xyz789',
         passphrase: null
      };
      setAccounts([demo]);
      localStorage.setItem('exchangeAccounts', JSON.stringify([demo]));
    }
    setIsLoading(false);
  }, []);

  // Save to local storage on change
  useEffect(() => {
     if(!isLoading) {
        localStorage.setItem('exchangeAccounts', JSON.stringify(accounts));
     }
  }, [accounts, isLoading]);

  const addAccount = (accountData) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const newAccount = {
                ...accountData,
                id: Date.now().toString(),
                status: 'connected', // Mock success for demo
                lastSynced: new Date().toISOString()
            };
            setAccounts(prev => [...prev, newAccount]);
            toast({ 
                title: "Account Added", 
                description: `${accountData.exchange} account connected successfully.` 
            });
            resolve(true);
        }, 1000);
    });
  };

  const updateAccount = (id, updates) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updates, lastSynced: new Date().toISOString() } : acc));
            toast({ title: "Account Updated", description: "Exchange account details updated." });
            resolve(true);
        }, 800);
    });
  };

  const deleteAccount = (id) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
    toast({ title: "Account Deleted", description: "Exchange account removed.", variant: "destructive" });
  };

  const testConnection = async (id) => {
      // Mock network request with random success/fail for realism
      return new Promise((resolve, reject) => {
          setTimeout(() => {
              // Always succeed for demo purposes unless specifically named "fail"
              const account = accounts.find(a => a.id === id);
              const shouldFail = account?.name?.toLowerCase().includes('fail');
              
              if (!shouldFail) {
                  // Update last synced
                  setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, lastSynced: new Date().toISOString(), status: 'connected' } : acc));
                  resolve({ success: true, message: "Connection successful! API permissions verified." });
              } else {
                   setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, status: 'error' } : acc));
                  reject({ success: false, message: "API Key invalid or IP not whitelisted." });
              }
          }, 2000);
      });
  };

  return (
    <ExchangeAccountsContext.Provider value={{ accounts, isLoading, addAccount, updateAccount, deleteAccount, testConnection }}>
      {children}
    </ExchangeAccountsContext.Provider>
  );
};