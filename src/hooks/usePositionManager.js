import { useState, useEffect, useCallback } from 'react';
import * as storage from '@/utils/positionStorage';
import * as schema from '@/utils/positionSchema';
import { generateMockPosition } from '@/utils/positionTestData';

export const usePositionManager = () => {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load positions on mount
  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = useCallback(() => {
    try {
      setLoading(true);
      const data = storage.loadAllPositions();
      
      // If no data, load some test data for development
      if (data.length === 0) {
         // const testData = [generateMockPosition()];
         // storage.savePosition(testData[0]);
         // setPositions(testData);
         setPositions([]);
      } else {
        setPositions(data);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load positions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPosition = useCallback((positionData) => {
    try {
      // If positionData is incomplete, try to use factory
      // But typically we expect a full object or mostly full. 
      // Let's assume passed data might need schema validation or construction
      
      let newPos = positionData;
      if (!positionData.id) {
          // If no ID, assume it's raw params
          newPos = schema.createNewPosition(
              positionData.botId,
              positionData.strategyType,
              positionData.symbol,
              positionData.entryPrice,
              positionData.entryQuantity,
              positionData.direction,
              positionData.leverage,
              positionData.templateSettings,
              positionData.botName,
              positionData.templateName
          );
      }

      storage.savePosition(newPos);
      setPositions(prev => [newPos, ...prev]);
      return newPos;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const updatePosition = useCallback((id, updates) => {
    try {
      const updated = storage.updatePosition(id, updates);
      setPositions(prev => prev.map(p => p.id === id ? updated : p));
      return updated;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const deletePosition = useCallback((id) => {
    try {
      storage.deletePosition(id);
      setPositions(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);
  
  // Specific getters acting on state
  const getPosition = useCallback((id) => positions.find(p => p.id === id), [positions]);
  const getPositionsByBot = useCallback((botId) => positions.filter(p => p.botId === botId), [positions]);
  const getPositionsByStrategy = useCallback((strategy) => positions.filter(p => p.strategyType === strategy), [positions]);

  // Bulk update for live prices (doesn't persist to storage for perf, only state)
  const updatePositionsState = useCallback((updates) => {
      setPositions(prev => {
          // Create a map of updates for faster lookup
          const updateMap = new Map(updates.map(u => [u.id, u]));
          
          let hasChanges = false;
          const newPositions = prev.map(p => {
              if (updateMap.has(p.id)) {
                  const updated = updateMap.get(p.id);
                  // Only update if price changed significantly or PnL changed
                  if (updated.currentPrice !== p.currentPrice) {
                      hasChanges = true;
                      return { ...p, ...updated };
                  }
              }
              return p;
          });
          
          return hasChanges ? newPositions : prev;
      });
  }, []);

  return {
    positions,
    loading,
    error,
    createPosition,
    updatePosition,
    deletePosition,
    getPosition,
    getPositionsByBot,
    getPositionsByStrategy,
    refreshPositions: loadPositions,
    updatePositionsState
  };
};