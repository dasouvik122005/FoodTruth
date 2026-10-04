import React from 'react';

interface HeaderProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ apiKey, setApiKey }) => (
  <>
    <div>
      <h1 className="text-3xl font-bold flex items-center gap-2">🕵️‍♂️ FoodTruth</h1>
      <p className="text-slate-400 text-sm mt-1">Powered by Gemma 4 • Adversarial Regulatory & Nutritional Compliance Auditor</p>
    </div>

    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
      <h2 className="font-semibold mb-2">Configuration</h2>
      <input 
        type="password" 
        placeholder="Gemini API Key (for Gemma 4 via Google AI Studio)"
        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />
    </div>
  </>
);
