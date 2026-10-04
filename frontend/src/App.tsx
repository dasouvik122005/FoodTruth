import React, { useState, useEffect } from 'react';
import { fetchSamples, auditDemo, auditUpload } from './api';
import { Header } from './components/Header';
import { DemoSelector } from './components/DemoSelector';
import { Uploader } from './components/Uploader';
import { CriticalBanner } from './components/CriticalBanner';
import { MetricCard } from './components/MetricCard';
import { EfficiencyBar } from './components/EfficiencyBar';
import { DecisionMatrix } from './components/DecisionMatrix';

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [samples, setSamples] = useState<string[]>([]);
  const [selectedSample, setSelectedSample] = useState('None');
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [recovery, setRecovery] = useState<any | null>(null);

  useEffect(() => {
    fetchSamples()
      .then(data => setSamples(['None', ...data]))
      .catch(err => console.error(err));
  }, []);

  const handleAudit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setRecovery(null);

    try {
      if (selectedSample !== 'None') {
        const data = await auditDemo(selectedSample);
        setResult(data);
      } else {
        if (!frontImage && !backImage) throw new Error('At least one image is required.');
        const data = await auditUpload(apiKey, frontImage, backImage);
        setResult(data);
      }
    } catch (err: any) {
      if (err.status === 422) {
        setRecovery(err.detail);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const isDemo = selectedSample !== 'None';
  const canSubmit = isDemo || (frontImage || backImage);

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
      
      {/* SIDEBAR */}
      <div className="w-full md:w-1/4 space-y-6">
        <Header apiKey={apiKey} setApiKey={setApiKey} />
        <DemoSelector 
          samples={samples} 
          selectedSample={selectedSample} 
          setSelectedSample={setSelectedSample} 
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="w-full md:w-3/4 space-y-6">
        <h2 className="text-2xl font-bold">Audit a Product</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Uploader 
            title="Front of Pack" 
            file={frontImage} 
            setFile={setFrontImage} 
          />
          <Uploader 
            title="Back of Pack" 
            subTitle="(Nutrition/Ingredients)"
            file={backImage} 
            setFile={setBackImage} 
          />
        </div>

        <button 
          disabled={!canSubmit || loading}
          onClick={handleAudit}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Analyzing packaging...' : '🔍 Audit This Product'}
        </button>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {recovery && (
          <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-200 p-4 rounded-lg">
            <h3 className="text-lg font-bold">⚠️ Image Not Usable</h3>
            <p className="mt-1"><strong>Status:</strong> {recovery.status}</p>
            <p><strong>Reason:</strong> {recovery.reason || "Unknown"}</p>
            <div className="mt-4 pt-4 border-t border-yellow-700/50">
              <h4 className="font-bold">Tips to retake:</h4>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Flatten the packaging fully</li>
                <li>Move to indirect natural lighting</li>
                <li>Disable camera flash</li>
                <li>Ensure both ingredient list and nutrition table are visible</li>
              </ul>
            </div>
          </div>
        )}

        {/* RESULT RENDERER */}
        {result && (
          <div className="space-y-6 mt-8 animate-fade-in">
            <CriticalBanner flags={result.disease_claim_flags} />

            {/* Header */}
            <div>
              <h2 className="text-3xl font-bold">{result.product_name}</h2>
              <p className="text-slate-400 mt-1">
                Serving Size: {result.serving_size_str} • Classification: <strong className="text-white">{result.verdict.overall_label}</strong>
              </p>
            </div>

            {/* Core Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <MetricCard title="🍬 Sugar & Sweeteners">
                <p><strong>Glycemic Risk:</strong> <span className={{
                  'HIGH': 'text-red-500', 'MODERATE': 'text-yellow-500', 'LOW': 'text-green-500', 'NONE': 'text-blue-500'
                }[result.sweetener_audit.overall_glycemic_risk as string]}>{result.sweetener_audit.overall_glycemic_risk}</span></p>
                
                <div className="mt-3 text-sm text-slate-300">
                  {result.sweetener_audit.sweeteners_found?.length > 0 ? (
                    <>
                      <p className="font-semibold mb-1 text-slate-200">Detected Sweeteners:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {result.sweetener_audit.sweeteners_found.map((s: any, i: number) => (
                          <li key={i}>{s.name} (GI: {s.gi_value})</li>
                        ))}
                      </ul>
                    </>
                  ) : <p>No added sweeteners detected.</p>}
                </div>
                
                {result.sweetener_audit.fssai_misalignment_flagged && (
                  <p className="mt-3 text-xs text-yellow-400">⚠️ <strong>FSSAI Misalignment:</strong> Front claims 'No Sugar' but hidden sugars found.</p>
                )}
              </MetricCard>

              <MetricCard title="🥩 Protein Audit">
                <p><strong>Declared:</strong> {result.protein_audit.declared_g}g</p>
                <p><strong>Quality:</strong> {result.protein_audit.source_tier}</p>
                {result.protein_audit.true_source && <p><strong>Primary Source:</strong> {result.protein_audit.true_source}</p>}
                
                {result.protein_audit.sprinkle_trick_detected && (
                  <p className="mt-3 text-xs text-yellow-400">⚠️ <strong>Sprinkle Trick:</strong> Premium protein claimed on front is a minor ingredient.</p>
                )}
              </MetricCard>

              <EfficiencyBar 
                efficiencyPct={result.pcal_ratio.efficiency_pct} 
                classification={result.pcal_ratio.classification} 
              />

            </div>

            <DecisionMatrix 
              worksIf={result.verdict.works_if} 
              wontWorkIf={result.verdict.wont_work_if} 
            />

            {/* FSSAI Footnote */}
            {result.fssai_violations?.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-700 text-sm text-slate-400">
                <strong className="text-slate-300">FSSAI Regulatory Discrepancies Noted:</strong>
                <ul className="mt-2 space-y-1">
                  {result.fssai_violations.map((v: any, i: number) => (
                    <li key={i}>• {v.rule_reference}: {v.description}</li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
