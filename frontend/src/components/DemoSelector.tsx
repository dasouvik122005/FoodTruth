import React from 'react';

interface DemoSelectorProps {
  samples: string[];
  selectedSample: string;
  setSelectedSample: (sample: string) => void;
}

export const DemoSelector: React.FC<DemoSelectorProps> = ({ samples, selectedSample, setSelectedSample }) => (
  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
    <h2 className="font-semibold mb-2">Try Demo Sample</h2>
    <select 
      className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
      value={selectedSample}
      onChange={(e) => setSelectedSample(e.target.value)}
    >
      {samples.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
  </div>
);
