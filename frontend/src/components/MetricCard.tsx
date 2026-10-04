import React from 'react';

interface MetricCardProps {
  title: string;
  children: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, children }) => (
  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
    <h3 className="font-bold text-lg mb-2">{title}</h3>
    {children}
  </div>
);
