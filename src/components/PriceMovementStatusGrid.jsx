import React from 'react';
import StatusDisplayBox from './StatusDisplayBox';

const PriceMovementStatusGrid = ({ upwardData, downwardData, dollarTarget }) => {
  return (
    <div className="grid grid-cols-2 gap-2 mt-2 w-full">
      <StatusDisplayBox 
        type="UPWARD"
        priceChange={upwardData?.change || 0}
        dollarNeeded={upwardData?.needed || dollarTarget}
        progress={upwardData?.progress || 0}
        target={dollarTarget}
      />
      <StatusDisplayBox 
        type="DOWNWARD"
        priceChange={downwardData?.change || 0}
        dollarNeeded={downwardData?.needed || dollarTarget}
        progress={downwardData?.progress || 0}
        target={dollarTarget}
      />
    </div>
  );
};

export default PriceMovementStatusGrid;