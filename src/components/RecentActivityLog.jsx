
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, Zap, Bell, Activity } from 'lucide-react';
import { activityLogger } from '@/utils/ActivityLogger';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const EventIcon = ({ type }) => {
  switch (type) {
    case 'BOT_CREATED': return <Zap size={14} className="text-blue-400" />;
    case 'POSITION_TRIGGER': return <Activity size={14} className="text-green-400" />;
    case 'ALERT': return <AlertTriangle size={14} className="text-orange-400" />;
    case 'NOTIFICATION': return <Bell size={14} className="text-purple-400" />;
    case 'SYSTEM': return <CheckCircle size={14} className="text-gray-400" />;
    default: return <Clock size={14} className="text-gray-500" />;
  }
};

const RecentActivityLog = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Initial load
    setEvents(activityLogger.getRecentEvents(20));

    // Subscribe to live events
    const unsubscribe = activityLogger.subscribe((newEvents) => {
      setEvents(newEvents.slice(0, 20));
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] flex flex-col h-full shadow-lg overflow-hidden">
      <div className="p-4 border-b border-[#2a2a2a] flex justify-between items-center bg-[#1a1a1a]">
        <h3 className="text-white font-bold uppercase text-xs tracking-wide flex items-center gap-2">
           <Activity size={14} className="text-blue-500" /> System Activity
        </h3>
        <span className="text-[10px] text-gray-500 font-mono">LIVE</span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 max-h-[400px]">
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-[#111] border border-[#252525] rounded-lg p-3 hover:border-[#333] transition-colors group"
            >
              <div className="flex justify-between items-start mb-1">
                 <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-[#1a1a1a] border border-[#2a2a2a]">
                       <EventIcon type={event.type} />
                    </div>
                    <span className="text-xs font-bold text-gray-200">{event.title}</span>
                 </div>
                 <span className="text-[10px] text-gray-600 font-mono whitespace-nowrap">
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                 </span>
              </div>
              <p className="text-xs text-gray-500 ml-8 line-clamp-2">{event.description}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {events.length === 0 && (
          <div className="text-center py-8 text-gray-600 text-xs">
            No recent activity recorded.
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivityLog;
