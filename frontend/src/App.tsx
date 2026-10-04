import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

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
    fetch(`${API_BASE}/samples`)
      .then(res => res.json())
      .then(data => setSamples(['None', ...data]))
      .catch(err => console.error("Failed to load samples:", err));
  }, []);

  const handleAudit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setRecovery(null);

    try {
      if (selectedSample !== 'None') {
        const formData = new FormData();
        formData.append('payload_name', selectedSample);
        const res = await fetch(`${API_BASE}/audit/demo`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Audit failed');
        setResult(data);
      } else {
        if (!apiKey) throw new Error('API Key is required for live uploads.');
        const formData = new FormData();
        if (frontImage) formData.append('front_image', frontImage);
        if (backImage) formData.append('back_image', backImage);
        
        const res = await fetch(`${API_BASE}/audit/upload`, {
          method: 'POST',
          headers: { 'x-api-key': apiKey },
          body: formData,
        });
        
        if (res.status === 422) {
          const data = await res.json();
          setRecovery(data.detail);
          setLoading(false);
          return;
        }
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Audit failed');
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isDemo = selectedSample !== 'None';
  const canSubmit = isDemo || (apiKey && (frontImage || backImage));

  return (
    <div className="min-h-screen p-4 md:p-8 font-sans max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
      
      {/* SIDEBAR */}
      <div className="w-full md:w-1/4 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">🕵️‍♂️ FoodTruth</h1>
          <p className="text-slate-400 text-sm mt-1">Adversarial Regulatory & Nutritional Compliance Auditor</p>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h2 className="font-semibold mb-2">Configuration</h2>
          <input 
            type="password" 
            placeholder="Gemma 4 API Key (Google AI Studio)"
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

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
      </div>

      {/* MAIN CONTENT */}
      <div className="w-full md:w-3/4 space-y-6">
        <h2 className="text-2xl font-bold">Audit a Product</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* FRONT UPLOAD */}
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold mb-2">Front of Pack</h3>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              onChange={(e) => e.target.files && setFrontImage(e.target.files[0])}
            />
            {frontImage && <p className="text-xs text-green-400 mt-2">Loaded: {frontImage.name}</p>}
          </div>

          {/* BACK UPLOAD */}
          <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold mb-2">Back of Pack (Nutrition/Ingredients)</h3>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              onChange={(e) => e.target.files && setBackImage(e.target.files[0])}
            />
            {backImage && <p className="text-xs text-green-400 mt-2">Loaded: {backImage.name}</p>}
          </div>
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
            {/* Critical Banner */}
            {result.disease_claim_flags?.length > 0 && (
              <div className="bg-red-900 border border-red-500 text-red-100 p-4 rounded-lg shadow-lg">
                <h3 className="font-bold text-lg">🚨 CRITICAL REGULATORY VIOLATION</h3>
                <p className="text-sm mt-1 mb-2">Disease / Medicinal claims detected on packaging:</p>
                <ul className="list-disc pl-5">
                  {result.disease_claim_flags.map((f: any, i: number) => (
                    <li key={i}>"{f.claim_text}" (Violates: {f.regulation_violated})</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Header */}
            <div>
              <h2 className="text-3xl font-bold">{result.product_name}</h2>
              <p className="text-slate-400 mt-1">
                Serving Size: {result.serving_size_str} • Classification: <strong className="text-white">{result.verdict.overall_label}</strong>
              </p>
            </div>

            {/* Core Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Sweetener Card */}
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <h3 className="font-bold text-lg mb-2">🍬 Sugar & Sweeteners</h3>
                <p><strong>Glycemic Risk:</strong> <span className={{
                  'HIGH': 'text-red-500', 'MODERATE': 'text-yellow-500', 'LOW': 'text-green-500', 'NONE': 'text-blue-500'
                }[result.sweetener_audit.overall_glycemic_risk as string]}>{result.sweetener_audit.overall_glycemic_risk}</span></p>
                
                <div className="mt-3 text-sm text-slate-300">
                  {result.sweetener_audit.sweeteners_found.length > 0 ? (
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
              </div>

              {/* Protein Card */}
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <h3 className="font-bold text-lg mb-2">🥩 Protein Audit</h3>
                <p><strong>Declared:</strong> {result.protein_audit.declared_g}g</p>
                <p><strong>Quality:</strong> {result.protein_audit.source_tier}</p>
                {result.protein_audit.true_source && <p><strong>Primary Source:</strong> {result.protein_audit.true_source}</p>}
                
                {result.protein_audit.sprinkle_trick_detected && (
                  <p className="mt-3 text-xs text-yellow-400">⚠️ <strong>Sprinkle Trick:</strong> Premium protein claimed on front is a minor ingredient.</p>
                )}
              </div>

              {/* Efficiency Card */}
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <h3 className="font-bold text-lg mb-2">🔥 Protein Efficiency</h3>
                <p><strong>Efficiency:</strong> {result.pcal_ratio.efficiency_pct}%</p>
                <p className="text-sm mt-1"><strong>Classification:</strong> {result.pcal_ratio.classification}</p>
              </div>

            </div>

            {/* Decision Matrix */}
            <div className="mt-8 bg-slate-800 p-6 rounded-lg border border-slate-700">
              <h3 className="font-bold text-xl mb-4">Will This Work For You?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-green-400 flex items-center gap-2 mb-3">✅ Works if:</h4>
                  <ul className="space-y-2 text-sm text-slate-300">
                    {result.verdict.works_if.map((w: string, i: number) => <li key={i}>• {w}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-400 flex items-center gap-2 mb-3">⚠️ Won't work if:</h4>
                  <ul className="space-y-2 text-sm text-slate-300">
                    {result.verdict.wont_work_if.map((w: string, i: number) => <li key={i}>• {w}</li>)}
                  </ul>
                </div>
              </div>
            </div>

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
