import React from 'react';

interface DecisionMatrixProps {
  worksIf: string[];
  wontWorkIf: string[];
}

export const DecisionMatrix: React.FC<DecisionMatrixProps> = ({ worksIf, wontWorkIf }) => (
  <div className="mt-8 bg-slate-800 p-6 rounded-lg border border-slate-700">
    <h3 className="font-bold text-xl mb-4">Will This Work For You?</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="font-semibold text-green-400 flex items-center gap-2 mb-3">✅ Works if:</h4>
        <ul className="space-y-2 text-sm text-slate-300">
          {worksIf?.map((w, i) => <li key={i}>• {w}</li>)}
        </ul>
      </div>
      <div>
        <h4 className="font-semibold text-yellow-400 flex items-center gap-2 mb-3">⚠️ Won't work if:</h4>
        <ul className="space-y-2 text-sm text-slate-300">
          {wontWorkIf?.map((w, i) => <li key={i}>• {w}</li>)}
        </ul>
      </div>
    </div>
  </div>
);
