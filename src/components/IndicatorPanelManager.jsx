import React from 'react';
import IndicatorPanelRenderer from './IndicatorPanelRenderer';

const IndicatorPanelManager = ({ 
  panels, 
  chartData, 
  onRemovePanel, 
  onRegisterSync,
  availableHeight 
}) => {
  // Distribute height: if we have 3 panels and 300px, each gets 100px.
  // We'll set a min height of 100px and allow scrolling if needed.
  const panelHeight = Math.max(160, Math.floor(availableHeight / (panels.length || 1)));

  return (
    <div className="flex flex-col w-full bg-[#1a1a1a]">
      {panels.map(panel => (
        <IndicatorPanelRenderer
            key={panel.id}
            panel={panel}
            chartData={chartData}
            onRemove={onRemovePanel}
            onRegister={onRegisterSync}
            height={panelHeight}
        />
      ))}
    </div>
  );
};

export default IndicatorPanelManager;