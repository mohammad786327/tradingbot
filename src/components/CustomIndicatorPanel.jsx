import React, { useState } from 'react';
import { Save, Code, X, CheckSquare, Square } from 'lucide-react';

const DEFAULT_SCRIPT = `// Custom Indicator Script
// Inputs: open, high, low, close, volume (Arrays)
// Output: Return an array of values same length as inputs

// Example: Simple Moving Average (SMA 14)
const period = 14;
const result = [];

for (let i = 0; i < close.length; i++) {
  if (i < period - 1) {
    result.push(NaN);
    continue;
  }
  let sum = 0;
  for (let j = 0; j < period; j++) {
    sum += close[i - j];
  }
  result.push(sum / period);
}

return result;
`;

const CustomIndicatorPanel = ({ onClose, onSave }) => {
  const [name, setName] = useState('My Custom Indicator');
  const [code, setCode] = useState(DEFAULT_SCRIPT);
  const [isOverlay, setIsOverlay] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = () => {
    if (!name.trim()) {
      setError("Please provide a name");
      return;
    }
    if (!code.trim()) {
        setError("Code cannot be empty");
        return;
    }

    try {
        // Basic validation syntax check using Function constructor
        new Function('open', 'high', 'low', 'close', 'volume', code);
        
        onSave({
            id: Date.now(),
            name,
            code,
            isOverlay,
            isCustom: true
        });
        onClose();
    } catch (e) {
        setError(e.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-[#1f1f1f] border-b border-[#2a2a2a]">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Code size={16} className="text-purple-400" />
            Create Custom Indicator
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={16} />
        </button>
      </div>

      {/* Form Area */}
      <div className="p-3 grid gap-4 bg-[#151515] border-b border-[#2a2a2a]">
         <div>
             <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Indicator Name</label>
             <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded p-2 text-xs text-white focus:border-purple-500 outline-none"
                placeholder="e.g. My Super Trend"
             />
         </div>
         
         <div className="flex items-center gap-2">
             <button 
                onClick={() => setIsOverlay(!isOverlay)}
                className="flex items-center gap-2 text-xs text-gray-300 hover:text-white"
             >
                 {isOverlay ? <CheckSquare size={14} className="text-purple-500" /> : <Square size={14} />}
                 <span>Overlay on Main Chart?</span>
             </button>
             <span className="text-[10px] text-gray-500">(If unchecked, appears in separate panel)</span>
         </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
         <textarea 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-full bg-[#0f0f0f] text-gray-300 font-mono text-xs p-3 outline-none resize-none"
            spellCheck="false"
         />
      </div>

      {/* Footer / Status */}
      <div className="p-3 bg-[#1f1f1f] border-t border-[#2a2a2a] flex justify-between items-center">
         <span className="text-xs text-red-400 max-w-[200px] truncate">
             {error}
         </span>
         <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded transition-colors"
         >
             <Save size={14} />
             Save Indicator
         </button>
      </div>
    </div>
  );
};

export default CustomIndicatorPanel;