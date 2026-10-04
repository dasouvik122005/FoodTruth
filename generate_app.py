import os

app_tsx_content = """import React, { useState } from 'react';

const API_BASE = 'http://localhost:8000/api';

export default function App() {
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [showDeepDive, setShowDeepDive] = useState(false);

  const handleAudit = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!frontFile && !backFile) throw new Error("Please provide at least one image.");
      
      const formData = new FormData();
      if (frontFile) formData.append('front_image', frontFile);
      if (backFile) formData.append('back_image', backFile);
      
      const res = await fetch(`${API_BASE}/audit/upload`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Audit failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] text-slate-800 font-sans min-h-screen flex flex-col">
      {/* NAVIGATION */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a className="flex items-center gap-2 font-display font-black tracking-tight text-slate-900 text-lg" href="#">
              <span className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm shadow-sm font-bold">FT</span>
              <span className="">FOODTRUTH</span>
            </a>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              Consumer Truth Engine
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a className="text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors" href="#">How We Test</a>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* MAIN WRAPPER */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* COMPACT INPUT AREA (TOP) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-700 text-[18px]">document_scanner</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dual Package Feed</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">CALIBRATION ISO/IEC 17025</span>
          </div>
          
          {/* Dual Scan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Panel 1: Front of Package */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">1. Front Packaging (PDP)</span>
                <div className="inline-flex rounded-full bg-white p-0.5 border border-slate-200 text-xs shadow-xs relative overflow-hidden">
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => setFrontFile(e.target.files?.[0] || null)} />
                  <button className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-medium flex items-center gap-1 pointer-events-none">
                    <span className="material-symbols-outlined text-[13px]">folder_open</span> Upload
                  </button>
                </div>
              </div>
              <div className="relative bg-slate-100 text-slate-800 rounded-lg h-24 overflow-hidden flex items-center justify-center border-2 border-dashed border-slate-300">
                {frontFile ? (
                  <span className="font-display font-bold text-sm tracking-tight text-slate-800 z-10 px-2 text-center">{frontFile.name}</span>
                ) : (
                  <span className="font-display font-bold text-sm tracking-tight text-slate-400 z-10">Select Front Image</span>
                )}
              </div>
            </div>
            
            {/* Panel 2: Back of Package */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">2. Mandatory Nutrition Panel</span>
                <div className="inline-flex rounded-full bg-white p-0.5 border border-slate-200 text-xs shadow-xs relative overflow-hidden">
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => setBackFile(e.target.files?.[0] || null)} />
                  <button className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-medium flex items-center gap-1 pointer-events-none">
                    <span className="material-symbols-outlined text-[13px]">folder_open</span> Upload
                  </button>
                </div>
              </div>
              <div className="relative bg-slate-100 text-slate-800 rounded-lg h-24 overflow-hidden flex items-center justify-center border-2 border-dashed border-slate-300">
                {backFile ? (
                  <span className="font-mono text-xs font-semibold text-slate-700 z-10 px-2 text-center">{backFile.name}</span>
                ) : (
                  <span className="font-mono text-xs font-semibold text-slate-400 z-10">Select Back Image</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Action Button Centered */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <button disabled={isLoading} onClick={handleAudit} className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 disabled:bg-slate-700 hover:bg-slate-800 active:scale-[0.99] text-white font-medium text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2">
              {isLoading ? (
                <span className="material-symbols-outlined text-[18px] animate-spin text-amber-400">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[18px] text-amber-400">bolt</span>
              )}
              <span className="">{isLoading ? "Processing..." : "Audit Packaging"}</span>
            </button>
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-1 sm:mt-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
              Instant AI & Lab Correlation Ready
            </span>
          </div>
        </section>
        
        {/* Error Banner */}
        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="material-symbols-outlined text-rose-500">error</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-rose-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* RESULTS SECTION */}
        {result && (
          <>
            {/* CARD 1: THE INSTANT VERDICT BANNER */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">Consumer Inspection Report</span>
                  <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-slate-900">
                    {result.product_name || "Analyzed Product"} <span className="text-slate-500 font-normal text-base sm:text-lg">({result.serving_size_str || "Serving Size Unknown"})</span>
                  </h1>
                </div>
                <div className="self-start sm:self-center">
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-black tracking-wide bg-rose-50 text-rose-700 border-2 border-rose-400/70 shadow-sm ring-2 ring-rose-200">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-600 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                    </span>
                    <span className="">{result.verdict?.overall_label || "VERDICT READY"}</span>
                  </span>
                </div>
              </div>
              {/* Exactly ONE punchy takeaway sentence */}
              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100">
                <p className="text-base sm:text-[17px] font-bold text-slate-900 leading-snug">
                  Verdict: <span className="text-slate-900">{result.verdict?.overall_label || "Please review below"}</span>
                </p>
              </div>
            </section>
            
            {/* CARD 2: VISUAL IMPACT METERS */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Meter A: Blood Sugar Spike Risk */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="">Metabolic Impact</span>
                    <span className="material-symbols-outlined text-rose-500 text-[18px]">show_chart</span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-700 mb-3">Blood Sugar Spike Risk</h2>
                  {/* 3-Segment Visual Meter */}
                  <div className="grid grid-cols-3 gap-1.5 h-3 mb-2">
                    <div className={`rounded-sm ${['LOW', 'MODERATE', 'HIGH'].includes(result.sweetener_audit?.overall_glycemic_risk) ? 'bg-rose-400' : 'bg-slate-200'}`} title="Low"></div>
                    <div className={`rounded-sm ${['MODERATE', 'HIGH'].includes(result.sweetener_audit?.overall_glycemic_risk) ? 'bg-rose-500' : 'bg-slate-200'}`} title="Moderate"></div>
                    <div className={`rounded-sm ${result.sweetener_audit?.overall_glycemic_risk === 'HIGH' ? 'bg-rose-600 shadow-xs ring-2 ring-rose-200' : 'bg-slate-200'}`} title="High"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400 uppercase mb-4">
                    <span className="">Low</span>
                    <span className="">Moderate</span>
                    <span className={result.sweetener_audit?.overall_glycemic_risk === 'HIGH' ? "text-rose-600 font-bold" : ""}>High</span>
                  </div>
                  {/* Big status label */}
                  <div className="flex items-center gap-1.5 text-rose-600 font-black text-lg">
                    <span className="material-symbols-outlined text-[20px]">error</span>
                    <span className="">{result.sweetener_audit?.overall_glycemic_risk} SPIKE</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mt-3 pt-3 border-t border-slate-100">
                  Sweeteners Found: {result.sweetener_audit?.sweeteners_found?.map((s:any) => s.name).join(', ') || 'None'}
                </p>
              </div>
              
              {/* Meter B: True Protein Quality */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="">Bioavailability</span>
                    <span className="material-symbols-outlined text-amber-500 text-[18px]">layers</span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-700 mb-3">True Protein Quality</h2>
                  {/* 3-Tier Visual Stack */}
                  <div className="flex items-center gap-1 text-[11px] font-semibold mb-2">
                    <span className={`flex-1 py-1 text-center rounded ${result.protein_audit?.source_tier?.includes('Tier 1') ? 'bg-emerald-500 text-white shadow-xs font-bold ring-2 ring-emerald-200' : 'bg-slate-100 text-slate-400'}`}>Dairy (Whey)</span>
                    <span className="material-symbols-outlined text-slate-300 text-[14px]">arrow_forward</span>
                    <span className={`flex-1 py-1 text-center rounded ${result.protein_audit?.source_tier?.includes('Tier 2') ? 'bg-amber-500 text-white shadow-xs font-bold ring-2 ring-amber-200' : 'bg-slate-100 text-slate-400'}`}>Soy / Plant</span>
                    <span className="material-symbols-outlined text-slate-300 text-[14px]">arrow_forward</span>
                    <span className={`flex-1 py-1 text-center rounded ${result.protein_audit?.source_tier?.includes('Tier 3') ? 'bg-slate-500 text-white shadow-xs font-bold' : 'bg-slate-100 text-slate-400'}`}>Filler</span>
                  </div>
                  <div className="h-1 mb-4"></div>
                  {/* Big status label */}
                  <div className="flex items-center gap-1.5 text-amber-600 font-black text-lg">
                    <span className="material-symbols-outlined text-[20px]">pie_chart</span>
                    <span className="">{result.protein_audit?.true_source?.toUpperCase() || 'UNKNOWN'}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mt-3 pt-3 border-t border-slate-100">
                  {result.protein_audit?.sprinkle_trick_detected ? "Protein Dilution Verified" : "No sprinkle trick detected"}
                </p>
              </div>
              
              {/* Meter C: Calorie Efficiency (P:Cal) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <span className="">P:Cal Density</span>
                    <span className="material-symbols-outlined text-slate-700 text-[18px]">battery_charging_full</span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-700 mb-3">Calorie Efficiency</h2>
                  {/* Horizontal progress bar dial */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-600">Protein Ratio</span>
                      <span className="font-bold text-slate-900">{result.pcal_ratio?.efficiency_pct || 0}% Target Yield</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                      <div className="bg-slate-800 h-full rounded-full transition-all" style={{ width: `${Math.min(100, result.pcal_ratio?.efficiency_pct || 0)}%` }}></div>
                    </div>
                  </div>
                  {/* Big metric label */}
                  <div className="flex items-center gap-1.5 text-slate-900 font-black text-lg">
                    <span className="material-symbols-outlined text-[20px] text-slate-600">fitness_center</span>
                    <span className="">{result.pcal_ratio?.efficiency_pct || 0}% Pure Protein Cal</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mt-3 pt-3 border-t border-slate-100">
                  {result.pcal_ratio?.classification || "Unknown"}
                </p>
              </div>
            </section>
            
            {/* CARD 3: "WILL THIS WORK FOR YOU?" (THE 5-SECOND DECISION) */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Will This Work For You?</h2>
                <p className="text-xs text-slate-500">Fast 5-second clinical indication guide based on current formula testing.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Good For */}
                <div className="rounded-xl border border-emerald-500/80 bg-[#F0FDF4] p-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-bold text-emerald-800">✅ Good For:</span>
                    </div>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-emerald-950 font-medium">
                      {result.verdict?.works_if?.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0 mt-0.5">check_circle</span>
                          <span className="">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {/* Right: Avoid If */}
                <div className="rounded-xl border border-rose-500/80 bg-[#FEF2F2] p-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-bold text-rose-800">⚠️ Avoid If:</span>
                    </div>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-rose-950 font-medium">
                      {result.verdict?.wont_work_if?.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0 mt-0.5">cancel</span>
                          <span className="">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
            
            {/* CARD 4: DEEP-DIVE SCIENCE (COLLAPSIBLE ACCORDION) */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <button className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer" onClick={() => setShowDeepDive(!showDeepDive)}>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-500 text-[20px]">science</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">View Lab Metrics & FSSAI Legal References</span>
                  <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">Raw Science Data</span>
                </div>
                <span className={`material-symbols-outlined text-slate-400 text-[20px] transition-transform duration-200 ${showDeepDive ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
              {/* Collapsible Container */}
              {showDeepDive && (
                <div className="border-t border-slate-200 p-5 bg-slate-50/50">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                          <th className="py-2.5 px-3">Parameter / Instrument</th>
                          <th className="py-2.5 px-3">Recorded Value</th>
                          <th className="py-2.5 px-3">Statutory Rule / Regulatory Citation</th>
                          <th className="py-2.5 px-3 text-right">Severity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80 text-slate-700">
                        {result.fssai_violations?.map((v: any, i: number) => (
                          <tr key={i} className="hover:bg-white transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">FSSAI Violation</td>
                            <td className="py-2.5 px-3 font-mono text-rose-700 font-medium">{v.rule_reference}</td>
                            <td className="py-2.5 px-3 text-slate-500">{v.description}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">Breach</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
      
      {/* CLEAN MINIMAL FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p className="">© 2024 FoodTruth Consumer Forensics • Independent Public Lab Verification</p>
          <div className="flex items-center gap-4">
            <a className="hover:text-slate-600 transition" href="#">Privacy</a>
            <a className="hover:text-slate-600 transition" href="#">Testing Protocol</a>
            <a className="hover:text-slate-600 transition" href="#">FSSAI Index</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
"""

with open(r"C:\Users\RASHMI\FoodTruth\frontend\src\App.tsx", "w", encoding="utf-8") as f:
    f.write(app_tsx_content)
