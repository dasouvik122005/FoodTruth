import { useState } from 'react';

const API_BASE = 'http://localhost:8000/api';

export default function App() {
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [cameraActive, setCameraActive] = useState<'front' | 'back' | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const startCamera = async (target: 'front' | 'back') => {
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      const hiddenInput = document.getElementById(`hidden-camera-${target}`);
      if (hiddenInput) hiddenInput.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setVideoStream(stream);
      setCameraActive(target);
    } catch (err) {
      alert("Camera access denied or unavailable on this device.");
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(t => t.stop());
    }
    setVideoStream(null);
    setCameraActive(null);
  };

  const capturePhoto = () => {
    const video = document.getElementById('camera-video') as HTMLVideoElement;
    if (video) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `${cameraActive}_captured.jpg`, { type: 'image/jpeg' });
            if (cameraActive === 'front') setFrontFile(file);
            else setBackFile(file);
            stopCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleAudit = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!frontFile || !backFile) {
        throw new Error("Please select both front and back packaging images.");
      }

      const formData = new FormData();
      formData.append("front_image", frontFile, frontFile.name || "front.jpg");
      formData.append("back_image", backFile, backFile.name || "back.jpg");

      const res = await fetch(`${API_BASE}/audit/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        let errorDetail = `Server Error (${res.status})`;
        try {
          const data = await res.json();
          if (typeof data.detail === "string") {
            errorDetail = data.detail;
          } else if (Array.isArray(data.detail)) {
            errorDetail = data.detail.map((e: any) => `${e.loc?.slice(1).join(".") || "field"}: ${e.msg}`).join(" | ");
          } else if (data.detail) {
            errorDetail = JSON.stringify(data.detail);
          } else {
            errorDetail = JSON.stringify(data);
          }
        } catch {
          errorDetail = await res.text();
        }
        throw new Error(errorDetail);
      }
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-100/50 blur-[100px] animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-cyan-100/50 blur-[100px] animate-float-delayed"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* NAVIGATION */}
        <header className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a className="flex items-center gap-3" href="#">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 p-[1px] shadow-sm">
                  <div className="w-full h-full bg-white rounded-[11px] flex items-center justify-center text-slate-800 font-bold text-sm">
                    FT
                  </div>
                </div>
                <span className="font-display font-bold tracking-tight text-slate-900 text-xl">FoodTruth</span>
              </a>
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                Powered by Gemini
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors" href="#">How We Test</a>
              <a href="https://github.com/dasouvik122005/FoodTruth" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full glass-button flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">code</span>
              </a>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col items-center">
          
          {/* HERO SECTION */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h1 className="text-4xl sm:text-6xl font-display font-black tracking-tight text-slate-900 mb-6 leading-tight">
              Discover the <span className="text-gradient">Truth</span> <br className="hidden sm:block" /> Behind Your Food
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed px-4">
              Upload your packaging. Let our AI instantly decode the ingredients, detect hidden sugars, and analyze true protein quality.
            </p>
          </div>

          {/* INPUT AREA */}
          <section className="w-full max-w-4xl glass-card rounded-3xl p-6 sm:p-8 mb-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500"></div>
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm">
                  <span className="material-symbols-outlined text-emerald-600">document_scanner</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Dual Package Analysis</h2>
                  <p className="text-xs text-slate-500">Upload front branding and back nutrition panel</p>
                </div>
              </div>
            </div>

            {/* Dual Scan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Panel 1: Front of Package */}
              <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 flex flex-col group hover:border-emerald-300 transition-colors shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] border border-slate-200">1</span>
                    Front Packaging
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" onChange={(e) => setFrontFile(e.target.files?.[0] || null)} />
                      <button className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                        <span className="material-symbols-outlined text-[14px]">upload_file</span> Upload
                      </button>
                    </div>
                    <button onClick={() => startCamera('front')} className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                      <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                    </button>
                  </div>
                </div>
                <div className="relative bg-slate-50 rounded-xl h-40 overflow-hidden flex items-center justify-center border border-dashed border-slate-300 group-hover:border-emerald-400 transition-colors">
                  {frontFile ? (
                    <>
                      <img src={URL.createObjectURL(frontFile)} alt="Front Preview" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                      <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <span className="font-bold text-sm text-slate-900 mb-3 text-center px-4 truncate w-full">{frontFile.name}</span>
                        <button onClick={() => setFrontFile(null)} className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors">Remove</button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-60 text-slate-300">add_photo_alternate</span>
                      <span className="text-xs font-semibold">No image selected</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Panel 2: Back of Package */}
              <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 flex flex-col group hover:border-cyan-300 transition-colors shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] border border-slate-200">2</span>
                    Nutrition Panel
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" onChange={(e) => setBackFile(e.target.files?.[0] || null)} />
                      <button className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                        <span className="material-symbols-outlined text-[14px]">upload_file</span> Upload
                      </button>
                    </div>
                    <button onClick={() => startCamera('back')} className="px-3 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-700 text-xs font-semibold flex items-center gap-1.5 transition-colors">
                      <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                    </button>
                  </div>
                </div>
                <div className="relative bg-slate-50 rounded-xl h-40 overflow-hidden flex items-center justify-center border border-dashed border-slate-300 group-hover:border-cyan-400 transition-colors">
                  {backFile ? (
                    <>
                      <img src={URL.createObjectURL(backFile)} alt="Back Preview" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                      <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <span className="font-bold text-sm text-slate-900 mb-3 text-center px-4 truncate w-full">{backFile.name}</span>
                        <button onClick={() => setBackFile(null)} className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors">Remove</button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-60 text-slate-300">receipt_long</span>
                      <span className="text-xs font-semibold">No image selected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button Centered */}
            <div className="mt-8 flex justify-center">
              <button 
                disabled={isLoading} 
                onClick={handleAudit} 
                className="group relative px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm sm:text-base rounded-full shadow-lg hover:shadow-xl hover:shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity z-0"></div>
                <div className="relative z-10 flex items-center gap-2">
                  {isLoading ? (
                    <span className="material-symbols-outlined text-[20px] animate-spin text-emerald-400">autorenew</span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px] text-emerald-400">science</span>
                  )}
                  <span>{isLoading ? "Running AI Audit..." : "Analyze Packaging"}</span>
                </div>
              </button>
            </div>
          </section>

          {/* Error Banner */}
          {error && (
            <div className="w-full max-w-4xl glass-card border-rose-200 bg-rose-50 p-5 rounded-2xl mb-8 flex items-start gap-4">
              <span className="material-symbols-outlined text-rose-500 text-2xl">error_outline</span>
              <div>
                <h3 className="text-rose-800 font-bold mb-1">Analysis Failed</h3>
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            </div>
          )}

          {/* RESULTS SECTION */}
          {result && (
            <div className="w-full max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              {/* CARD 1: THE INSTANT VERDICT BANNER */}
              <section className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-white">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-100 blur-[80px] rounded-full"></div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                  <div>
                    <span className="text-xs font-mono text-slate-400 tracking-widest uppercase block mb-2 font-semibold">AI Audit Complete</span>
                    <h1 className="text-2xl sm:text-4xl font-display font-black text-slate-900 mb-2">
                      {result.product_name || "Analyzed Product"}
                    </h1>
                    <span className="text-slate-500 bg-slate-50 px-3 py-1 rounded-full text-sm border border-slate-200 font-medium">
                      Serving: {result.serving_size_str || "Unknown"}
                    </span>
                  </div>
                  <div className="shrink-0">
                    <div className="inline-flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 border-slate-100 bg-white shadow-lg shadow-slate-200/50">
                      <span className="text-3xl mb-1">{result.verdict?.overall_label === 'PASS' ? '✅' : '⚠️'}</span>
                      <span className="text-xs font-bold text-slate-400 tracking-wider">VERDICT</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-5 rounded-2xl bg-emerald-50 border border-emerald-100 border-l-4 border-l-emerald-500">
                  <p className="text-lg font-semibold text-emerald-900 leading-relaxed">
                    {result.verdict?.overall_label || "Please review the detailed metrics below."}
                  </p>
                </div>
              </section>

              {/* CARD 2: VISUAL IMPACT METERS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Meter A: Blood Sugar Spike Risk */}
                <div className="glass-card bg-white rounded-2xl p-6 flex flex-col justify-between group hover:shadow-2xl hover:shadow-slate-200/50 transition-shadow border border-slate-100">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 mb-4 border border-rose-100">
                      <span className="material-symbols-outlined text-[20px]">show_chart</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Blood Sugar Risk</h2>
                    <p className="text-xs text-slate-500 font-medium mb-6">Metabolic impact level</p>
                    
                    <div className="space-y-2 mb-6">
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/50">
                        <div className={`h-full ${['LOW', 'MODERATE', 'HIGH'].includes(result.sweetener_audit?.overall_glycemic_risk) ? 'bg-emerald-400' : 'bg-transparent'} w-1/3 border-r border-slate-200/50`}></div>
                        <div className={`h-full ${['MODERATE', 'HIGH'].includes(result.sweetener_audit?.overall_glycemic_risk) ? 'bg-amber-400' : 'bg-transparent'} w-1/3 border-r border-slate-200/50`}></div>
                        <div className={`h-full ${result.sweetener_audit?.overall_glycemic_risk === 'HIGH' ? 'bg-rose-500' : 'bg-transparent'} w-1/3`}></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Low</span>
                        <span>Med</span>
                        <span>High</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      <span className="text-slate-800 font-semibold">Sweeteners: </span>
                      {result.sweetener_audit?.sweeteners_found?.map((s: any) => s.name).join(', ') || 'None detected'}
                    </p>
                  </div>
                </div>

                {/* Meter B: True Protein Quality */}
                <div className="glass-card bg-white rounded-2xl p-6 flex flex-col justify-between group hover:shadow-2xl hover:shadow-slate-200/50 transition-shadow border border-slate-100">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 mb-4 border border-amber-100">
                      <span className="material-symbols-outlined text-[20px]">layers</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Protein Quality</h2>
                    <p className="text-xs text-slate-500 font-medium mb-6">Bioavailability score</p>
                    
                    <div className="flex flex-col gap-2 mb-6">
                      <div className={`py-1.5 px-3 text-xs text-center rounded-lg font-bold border ${result.protein_audit?.source_tier?.includes('Tier 1') ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>High (Whey/Dairy)</div>
                      <div className={`py-1.5 px-3 text-xs text-center rounded-lg font-bold border ${result.protein_audit?.source_tier?.includes('Tier 2') ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>Med (Soy/Plant)</div>
                      <div className={`py-1.5 px-3 text-xs text-center rounded-lg font-bold border ${result.protein_audit?.source_tier?.includes('Tier 3') ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>Low (Fillers)</div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      <span className="text-slate-800 font-semibold">Verdict: </span>
                      {result.protein_audit?.sprinkle_trick_detected ? "Dilution Detected" : "Pure Source"}
                    </p>
                  </div>
                </div>

                {/* Meter C: Calorie Efficiency */}
                <div className="glass-card bg-white rounded-2xl p-6 flex flex-col justify-between group hover:shadow-2xl hover:shadow-slate-200/50 transition-shadow border border-slate-100">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 mb-4 border border-blue-100">
                      <span className="material-symbols-outlined text-[20px]">battery_charging_full</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Calorie Efficiency</h2>
                    <p className="text-xs text-slate-500 font-medium mb-6">P:Cal density ratio</p>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between items-end">
                        <span className="text-3xl font-display font-black text-slate-900">{result.pcal_ratio?.efficiency_pct || 0}%</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Target Yield</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                        <div className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, result.pcal_ratio?.efficiency_pct || 0)}%` }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      <span className="text-slate-800 font-semibold">Class: </span>
                      {result.pcal_ratio?.classification || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD 3: "WILL THIS WORK FOR YOU?" */}
              <section className="glass-card bg-white rounded-3xl p-6 sm:p-8 border border-slate-100">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Actionable Summary</h2>
                  <p className="text-sm text-slate-500">Fast clinical indication guide based on current formula testing.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Good For */}
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm">
                    <h3 className="text-emerald-700 font-bold mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined">check_circle</span> Good For
                    </h3>
                    <ul className="space-y-3">
                      {result.verdict?.works_if?.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-emerald-900 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 shadow-sm"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Right: Avoid If */}
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-sm">
                    <h3 className="text-rose-700 font-bold mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined">cancel</span> Avoid If
                    </h3>
                    <ul className="space-y-3">
                      {result.verdict?.wont_work_if?.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-rose-900 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0 shadow-sm"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>

        <footer className="mt-auto py-8 text-center text-sm text-slate-400 border-t border-slate-200 relative z-10">
          <p className="font-medium">© 2026 FoodTruth. Built with Gemini AI.</p>
        </footer>
      </div>

      {/* Hidden inputs for mobile camera capture */}
      <input type="file" accept="image/*" capture="environment" id="hidden-camera-front" className="hidden" style={{ display: 'none' }} onChange={(e) => setFrontFile(e.target.files?.[0] || null)} />
      <input type="file" accept="image/*" capture="environment" id="hidden-camera-back" className="hidden" style={{ display: 'none' }} onChange={(e) => setBackFile(e.target.files?.[0] || null)} />

      {/* CAMERA MODAL (DESKTOP) */}
      {cameraActive && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900">Capture Image</h3>
              <button onClick={stopCamera} className="text-slate-400 hover:text-slate-900 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="relative bg-slate-900 aspect-[4/3] flex items-center justify-center overflow-hidden">
              <video
                id="camera-video"
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                ref={(vid) => { if (vid && videoStream && vid.srcObject !== videoStream) vid.srcObject = videoStream; }}
              />
              <div className="absolute inset-0 pointer-events-none border-[40px] border-slate-900/20">
                <div className="w-full h-full border-2 border-white/80 border-dashed rounded-xl shadow-[0_0_10px_rgba(0,0,0,0.3)]"></div>
              </div>
            </div>
            <div className="p-6 flex justify-center bg-slate-50">
              <button onClick={capturePhoto} className="px-8 py-3 bg-slate-900 text-white hover:bg-slate-800 font-bold rounded-full flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-slate-900/20">
                <span className="material-symbols-outlined">camera</span>
                Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
