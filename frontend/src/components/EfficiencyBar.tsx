import React from 'react';

interface EfficiencyBarProps {
  efficiencyPct: number;
  classification: string;
}

export const EfficiencyBar: React.FC<EfficiencyBarProps> = ({ efficiencyPct, classification }) => {
  const getBarColor = (pct: number) => {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col justify-between">
      <div>
        <h3 className="font-bold text-lg mb-2">🔥 Protein Efficiency</h3>
        <p className="text-sm mb-4"><strong>Classification:</strong> {classification}</p>
      </div>
      
      <div>
        <div className="flex justify-between items-end mb-1">
          <span>Efficiency</span>
          <span className="font-bold">{efficiencyPct}%</span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-2.5 rounded-full ${getBarColor(efficiencyPct)} transition-all duration-500`} 
            style={{ width: `${Math.min(100, Math.max(0, efficiencyPct))}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
