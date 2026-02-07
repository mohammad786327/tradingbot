import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

const ErrorIndicatorFallback = ({ error, indicatorName, onRetry, onRemove }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-[#1a1a1a] border border-red-900/50 rounded-lg min-h-[120px]">
      <div className="flex items-center gap-2 text-red-500 mb-2">
        <AlertTriangle size={20} />
        <h3 className="font-bold text-sm">Failed to load {indicatorName}</h3>
      </div>
      <p className="text-xs text-gray-400 mb-4 text-center max-w-md">
        {error || "An unexpected error occurred while rendering this indicator."}
      </p>
      <div className="flex items-center gap-3">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs rounded transition-colors"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        )}
        {onRemove && (
          <button 
            onClick={onRemove}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 text-xs rounded transition-colors border border-red-900/30"
          >
            <X size={12} />
            Remove
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorIndicatorFallback;