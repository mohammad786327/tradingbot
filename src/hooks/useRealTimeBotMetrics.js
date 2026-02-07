
import { useMemo } from 'react';

export const useRealTimeBotMetrics = (positions) => {
  return useMemo(() => {
    // Initial metrics
    const metrics = {
      totalActiveBots: 0,
      totalActivePositions: 0,
      totalPortfolioValue: 0, // This would ideally fetch wallet balance too, but here we sum position values
      totalPnL: 0,
      winRate: 0,
      totalVolume: 0,
      
      botsByType: {},
      positionsByStatus: { WAITING: 0, ACTIVE: 0, CLOSED: 0 },
      positionsBySide: { LONG: 0, SHORT: 0 },
      
      winCount: 0,
      lossCount: 0,
      totalClosed: 0
    };

    if (!positions || positions.length === 0) return metrics;

    positions.forEach(pos => {
      // 1. Bots by Type
      const type = pos.botType || 'Unknown';
      metrics.botsByType[type] = (metrics.botsByType[type] || 0) + 1;

      // 2. Positions by Status
      const status = pos.status || 'UNKNOWN';
      if (metrics.positionsByStatus[status] !== undefined) {
          metrics.positionsByStatus[status]++;
      } else {
          // Handle loose statuses map to canonical ones if needed
          if (status === 'OPEN') metrics.positionsByStatus.ACTIVE++;
          else metrics.positionsByStatus[status] = (metrics.positionsByStatus[status] || 0) + 1;
      }

      // 3. Positions by Side
      const side = (pos.direction || 'LONG').toUpperCase();
      if (metrics.positionsBySide[side] !== undefined) {
          metrics.positionsBySide[side]++;
      }

      // 4. Aggregates
      if (status === 'ACTIVE' || status === 'OPEN') {
        metrics.totalActivePositions++;
        const margin = pos.amount || 0;
        const pnl = pos.pnl || 0;
        metrics.totalPortfolioValue += (margin + pnl);
        metrics.totalPnL += pnl;
      }

      // 5. Historical Stats (Closed positions)
      if (status === 'CLOSED') {
        metrics.totalClosed++;
        const pnl = pos.pnl || 0;
        metrics.totalPnL += pnl; // Add realized PnL too
        
        if (pnl > 0) metrics.winCount++;
        else metrics.lossCount++;
      }
      
      // 6. Volume
      // Volume = Position Size (Margin * Leverage)
      const leverage = pos.leverage || 1;
      const margin = pos.amount || 0;
      metrics.totalVolume += (margin * leverage);
    });

    metrics.totalActiveBots = Object.values(metrics.botsByType).reduce((a, b) => a + b, 0);
    metrics.winRate = metrics.totalClosed > 0 
      ? ((metrics.winCount / metrics.totalClosed) * 100).toFixed(1) 
      : 0;

    return metrics;
  }, [positions]);
};
