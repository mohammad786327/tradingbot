
import React from 'react';
import { cn } from '@/lib/utils';
import { Activity, CheckCircle, Clock, PauseCircle, XCircle } from 'lucide-react';

const PositionStatusBadge = ({ status, className }) => {
  const normalizedStatus = (status || 'UNKNOWN').toUpperCase();

  const getStatusConfig = (s) => {
    switch (s) {
      case 'ACTIVE':
      case 'OPEN':
      case 'RUNNING':
        return {
          color: 'text-green-400',
          bg: 'bg-green-500/10',
          border: 'border-green-500/20',
          icon: Activity,
          label: 'Active'
        };
      case 'PENDING':
      case 'WAITING':
        return {
          color: 'text-yellow-400',
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/20',
          icon: Clock,
          label: 'Pending'
        };
      case 'STOPPED':
      case 'PAUSED':
        return {
          color: 'text-orange-400',
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/20',
          icon: PauseCircle,
          label: 'Stopped'
        };
      case 'CLOSED':
      case 'COMPLETED':
        return {
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          icon: CheckCircle,
          label: 'Closed'
        };
      case 'ERROR':
      case 'FAILED':
        return {
          color: 'text-red-400',
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
          icon: XCircle,
          label: 'Error'
        };
      default:
        return {
          color: 'text-gray-400',
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/20',
          icon: Activity,
          label: status
        };
    }
  };

  const config = getStatusConfig(normalizedStatus);
  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wide",
      config.bg,
      config.color,
      config.border,
      className
    )}>
      <Icon size={12} className={cn(normalizedStatus === 'ACTIVE' || normalizedStatus === 'OPEN' ? 'animate-pulse' : '')} />
      <span>{config.label}</span>
    </div>
  );
};

export default PositionStatusBadge;
