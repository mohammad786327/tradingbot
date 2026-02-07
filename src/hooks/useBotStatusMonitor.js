
import { useEffect, useRef } from 'react';
import { notificationService } from '@/utils/NotificationService';
import { soundManager } from '@/utils/SoundManager';

/**
 * Hook to monitor bot status changes (Waiting -> Active)
 * Triggers notifications and sounds.
 * 
 * @param {Array} bots - Array of bot objects to monitor
 * @param {string} botType - Type of bot (e.g., 'RSI Bot')
 */
export const useBotStatusMonitor = (bots, botType) => {
  // We use a ref to store the previous state of bots to compare against
  // Storing as Map: ID -> Status
  const prevStatusesRef = useRef(new Map());

  useEffect(() => {
    const currentStatuses = new Map();
    let hasActivations = false;

    bots.forEach(bot => {
      // Store current status
      currentStatuses.set(bot.id, bot.status);

      // Check for transition
      const prevStatus = prevStatusesRef.current.get(bot.id);
      
      // LOGIC: Transition from WAITING/PENDING -> ACTIVE
      if (prevStatus && 
          (prevStatus === 'WAITING' || prevStatus === 'PENDING') && 
          bot.status === 'ACTIVE') {
          
          hasActivations = true;
          handleActivation(bot);
      }
    });

    // Update ref for next render
    prevStatusesRef.current = currentStatuses;

    if (hasActivations) {
        // Play sound once per batch update
        const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
        const soundId = settings.soundId || 'chime';
        soundManager.play(soundId);
    }

  }, [bots, botType]);

  const handleActivation = (bot) => {
      // Extract specific trigger reasons based on bot type
      let triggerReason = 'Conditions Met';
      let side = bot.side || bot.direction || 'LONG';

      if (botType === 'RSI Bot') {
          triggerReason = `RSI target ${bot.rsiValue || 'hit'}`;
      } else if (botType === 'Candle Strike Bot') {
          const streak = bot.consecutiveCandles || 3;
          triggerReason = `${streak} Candle Streak matched`;
          if (bot.direction === 'Green Candles') side = 'LONG';
          else if (bot.direction === 'Red Candles') side = 'SHORT';
      } else if (botType === 'Grid Bot') {
          triggerReason = `Price entered grid range`;
      } else if (botType === 'DCA Bot') {
          triggerReason = `DCA Interval Executed`;
      } else if (botType === 'Price Movement Bot') {
          triggerReason = `Movement Target Reached`;
      }

      // Create Notification
      notificationService.createNotification({
          botType,
          botName: bot.botName || bot.symbol, // Fallback if no specific name
          symbol: bot.symbol,
          side: side.toUpperCase(),
          exchange: bot.exchange || 'Binance',
          timeframe: bot.timeframe || '1m',
          triggerReason,
          status: 'ACTIVE',
          botId: bot.id
      });
  };
};
