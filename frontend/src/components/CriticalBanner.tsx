import React from 'react';

interface Flag {
  claim_text: string;
  regulation_violated: string;
}

interface CriticalBannerProps {
  flags: Flag[];
}

export const CriticalBanner: React.FC<CriticalBannerProps> = ({ flags }) => {
  if (!flags || flags.length === 0) return null;
  
  return (
    <div className="bg-red-900 border border-red-500 text-red-100 p-4 rounded-lg shadow-lg">
      <h3 className="font-bold text-lg">🚨 CRITICAL REGULATORY VIOLATION</h3>
      <p className="text-sm mt-1 mb-2">Disease / Medicinal claims detected on packaging:</p>
      <ul className="list-disc pl-5">
        {flags.map((f, i) => (
          <li key={i}>"{f.claim_text}" (Violates: {f.regulation_violated})</li>
        ))}
      </ul>
    </div>
  );
};
