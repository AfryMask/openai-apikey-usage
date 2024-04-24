import React from 'react';
import { TooltipProps } from 'recharts';
import './CustomTooltip.css';

const CustomTooltip = ({
  active,
  payload,
  label
}: TooltipProps<any, any>) => {
  if (active && payload && payload.length) {
    const totalValue = payload.reduce((acc, entry) => acc + (entry.value > 0 ? entry.value : 0), 0);
    return (
      <div className="usage-custom-tooltip">
        <div className="tooltip-item">
          <span className="tooltip-header-legend">{label}</span>
          <span className="tooltip-header-value">{totalValue === 0 ? '$0.00' : (totalValue < 0.01 ? '<$0.01' : `$${totalValue.toFixed(2)}`)}</span>
        </div>
        {payload.map((entry, index) => (
          entry.value > 0 && (
            <div key={`item-${index}`} className="tooltip-item">
              <span className="tooltip-item-legend-color" style={{ backgroundColor: entry.color }} />
              <span className="tooltip-item-legend">{entry.name}</span>
              <span className="tooltip-item-value">{entry.value < 0.01 ? '<$0.01' : `$${entry.value.toFixed(2)}`}</span>
            </div>
          )
        ))}
      </div>
    );
  }

  return null;
};

export default CustomTooltip;
