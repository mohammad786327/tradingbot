import React, { createContext, useContext, useEffect, useRef } from 'react';
import { usePositionManager } from '@/hooks/usePositionManager';
import { positionUpdateManager } from '@/utils/positionUpdateManager';

const PositionContext = createContext();

export const usePositions = () => {
  const context = useContext(PositionContext);
  if (!context) {
    throw new Error('usePositions must be used within a PositionProvider');
  }
  return context;
};

export const PositionProvider = ({ children }) => {
  const manager = usePositionManager();
  const { positions, updatePositionsState } = manager;
  
  // Ref to track if we're already subscribed to avoid frequent re-subscriptions
  const subscribedPositionsRef = useRef([]);

  // Integrate with PositionUpdateManager for live PnL
  useEffect(() => {
    const openPositions = positions.filter(p => p.status === 'OPEN');
    
    // Check if meaningful change in open positions (e.g. new symbol added)
    const currentIds = openPositions.map(p => p.id).sort().join(',');
    const prevIds = subscribedPositionsRef.current.map(p => p.id).sort().join(',');

    if (currentIds !== prevIds) {
        positionUpdateManager.registerPositions(openPositions, (updates) => {
            updatePositionsState(updates);
        });
        subscribedPositionsRef.current = openPositions;
    }

    return () => {
        // We don't necessarily want to unregister on every render, 
        // but if component unmounts we should.
        // positionUpdateManager.unregisterAll(); 
    };
  }, [positions, updatePositionsState]);

  // Cleanup on unmount
  useEffect(() => {
      return () => {
          positionUpdateManager.unregisterAll();
      }
  }, []);

  return (
    <PositionContext.Provider value={manager}>
      {children}
    </PositionContext.Provider>
  );
};