import React, { useState } from 'react';
import { Code, Play, Save } from 'lucide-react';

const DEFAULT_SCRIPT = `// Simple Script Example
// Available: open, high, low, close, volume (arrays)

const lastClose = close[close.length - 1];
const prevClose = close[close.length - 2];

if (lastClose > prevClose) {
  return "Bullish Candle";
} else {
  return "Bearish Candle";
}
`;

const CustomIndicatorScriptEditor = ({ onRunScript }) => {
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [output, setOutput] = useState('');

  const handleRun = () => {
    onRunScript(script, (result) => setOutput(result));
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl flex flex-col h-full overflow-hidden">
        <div className="p-3 border-b border-[#2a2a2a] flex justify-between items-center bg-[#1f1f1f]">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Code size={14} className="text-purple-500" />
                Script Editor (JS)
            </h3>
            <div className="flex gap-2">
                <button 
                   onClick={handleRun}
                   className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                   title="Run Script"
                >
                    <Play size={14} />
                </button>
            </div>
        </div>
        
        <div className="flex-1 relative">
            <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="w-full h-full bg-[#0f0f0f] text-gray-300 font-mono text-xs p-3 outline-none resize-none"
                spellCheck="false"
            />
        </div>

        <div className="p-2 border-t border-[#2a2a2a] bg-[#151515]">
            <span className="text-[10px] text-gray-500 uppercase tracking-wide block mb-1">Console Output</span>
            <div className="font-mono text-xs text-yellow-500">
                {output || '> Ready'}
            </div>
        </div>
    </div>
  );
};

export default CustomIndicatorScriptEditor;