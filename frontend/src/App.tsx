import { useState, useRef } from 'react';

const API_BASE = 'http://localhost:8000/api';

export default function App() {
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
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
        throw new Error("We need both the front packaging and the nutrition label to tell the truth.");
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
    <div className="min-h-screen bg-[#F6F5F2] text-[#111] flex flex-col md:flex-row font-sans">
      
      {/* LEFT COLUMN: EDITORIAL HERO (Sticky on Desktop) */}
      <div className="w-full md:w-[45%] lg:w-[40%] bg-[#111] text-[#F6F5F2] p-8 md:p-12 lg:p-16 flex flex-col justify-between md:sticky top-0 md:h-screen z-10">
        <div>
          <div className="flex items-center justify-between mb-16">
            <span className="font-bold tracking-tighter text-xl">FT.</span>
            <span className="text-xs uppercase tracking-widest opacity-60"></span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-display leading-[0.95] tracking-tight mb-8">
            The Truth <br />
            <span className="text-[#B5C99A]">Behind</span> <br />
            The Label.
          </h1>
          
          <p className="text-lg opacity-80 max-w-sm leading-relaxed font-light mb-12">
            Brands lie. Ingredients don't. Drop your food packaging below and let AI decode the real metabolic impact of what you're about to eat.
          </p>
        </div>

        <div className="hidden md:block">
          <p className="text-xs font-mono uppercase opacity-50 tracking-widest">System Online / Ready</p>
        </div>
      </div>

      {/* RIGHT COLUMN: SCROLLABLE INTERACTIVE AREA */}
      <div className="w-full md:w-[55%] lg:w-[60%] p-8 md:p-12 lg:p-16 xl:p-24 overflow-y-auto">
        
        <div className="max-w-2xl mx-auto space-y-16">
          
          {/* UPLOAD SECTION (Bespoke layout, no cards) */}
          <section className="space-y-12">
            <div className="border-b-2 border-[#111] pb-4 flex justify-between items-end">
              <h2 className="text-2xl font-bold tracking-tight uppercase">Input</h2>
              <span className="text-sm font-mono opacity-60">01</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Front File */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">Front Branding</span>
                  <button onClick={() => startCamera('front')} className="text-xs font-mono underline hover:text-[#7A9D54] transition-colors">Camera</button>
                </div>
                <div className={`relative h-64 w-full bg-[#E5E4E0] transition-all duration-300 ${frontFile ? 'p-2' : 'hover:bg-[#dcdbd7]'} flex items-center justify-center group overflow-hidden`}>
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => setFrontFile(e.target.files?.[0] || null)} />
                  {frontFile ? (
                    <>
                      <img src={URL.createObjectURL(frontFile)} alt="Front" className="w-full h-full object-cover grayscale opacity-90 transition-all duration-500 group-hover:grayscale-0" />
                      <div className="absolute inset-0 bg-[#111]/80 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center transition-opacity text-[#F6F5F2] p-4 text-center">
                        <span className="text-xs font-mono mb-2 truncate w-full">{frontFile.name}</span>
                        <span className="text-sm font-bold border-b border-[#F6F5F2] pb-0.5">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs uppercase tracking-widest opacity-40 font-bold group-hover:opacity-100 transition-opacity">Select File</span>
                  )}
                </div>
              </div>

              {/* Back File */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">Nutrition & Ingredients</span>
                  <button onClick={() => startCamera('back')} className="text-xs font-mono underline hover:text-[#7A9D54] transition-colors">Camera</button>
                </div>
                <div className={`relative h-64 w-full bg-[#E5E4E0] transition-all duration-300 ${backFile ? 'p-2' : 'hover:bg-[#dcdbd7]'} flex items-center justify-center group overflow-hidden`}>
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => setBackFile(e.target.files?.[0] || null)} />
                  {backFile ? (
                    <>
                      <img src={URL.createObjectURL(backFile)} alt="Back" className="w-full h-full object-cover grayscale opacity-90 transition-all duration-500 group-hover:grayscale-0" />
                      <div className="absolute inset-0 bg-[#111]/80 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center transition-opacity text-[#F6F5F2] p-4 text-center">
                        <span className="text-xs font-mono mb-2 truncate w-full">{backFile.name}</span>
                        <span className="text-sm font-bold border-b border-[#F6F5F2] pb-0.5">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs uppercase tracking-widest opacity-40 font-bold group-hover:opacity-100 transition-opacity">Select File</span>
                  )}
                </div>
              </div>
            </div>

            <button 
              disabled={isLoading || (!frontFile && !backFile)} 
              onClick={handleAudit} 
              className={`w-full py-5 px-8 text-center text-sm font-bold tracking-widest uppercase transition-all duration-500 ${isLoading ? 'bg-[#E5E4E0] text-[#111] cursor-wait' : 'bg-[#111] text-[#F6F5F2] hover:bg-[#7A9D54] hover:text-[#111] disabled:opacity-30 disabled:cursor-not-allowed'}`}
            >
              {isLoading ? "Running AI Audit..." : "Analyze Packaging"}
            </button>
            
            {error && (
              <div className="p-4 border-l-2 border-[#D83F31] bg-[#D83F31]/10 text-[#D83F31] text-sm font-medium">
                {error}
              </div>
            )}
          </section>

          {/* RESULTS SECTION (Editorial flow) */}
          {result && (
            <section className="space-y-16 pt-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              
              {/* Product Header */}
              <div className="border-b-2 border-[#111] pb-8">
                <span className="text-sm font-mono opacity-60 mb-4 block">02 // Analysis Complete</span>
                <h2 className="text-4xl md:text-5xl font-display leading-tight mb-2">
                  {result.product_name || "Unknown Product"}
                </h2>
                <div className="flex gap-4 items-center">
                  <span className="inline-block px-3 py-1 bg-[#111] text-[#F6F5F2] text-xs font-bold uppercase tracking-widest">
                    Serving: {result.serving_size_str || "N/A"}
                  </span>
                </div>
              </div>

              {/* The Verdict */}
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-full md:w-1/3 shrink-0">
                  <div className={`aspect-square w-full max-w-[200px] flex flex-col items-center justify-center p-6 ${result.verdict?.overall_label === 'PASS' ? 'bg-[#B5C99A]' : 'bg-[#E5D283]'} text-[#111]`}>
                    <span className="text-5xl mb-4 font-display font-bold">
                      {result.verdict?.overall_label === 'PASS' ? 'OK' : '!'}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-center border-t border-[#111] pt-2 w-full">
                      Final Verdict
                    </span>
                  </div>
                </div>
                <div className="w-full md:w-2/3 flex flex-col justify-center">
                  <p className="text-2xl font-light leading-relaxed">
                    {result.verdict?.overall_label || "No definitive verdict available. Review metrics below."}
                  </p>
                </div>
              </div>

              {/* Core Metrics Breakdown */}
              <div className="space-y-12 pt-8">
                <h3 className="text-xl font-bold uppercase tracking-wide">Key Findings</h3>
                
                {/* Metric 1: Glycemic */}
                <div className="flex flex-col md:flex-row border-t border-[#111]/20 pt-6 gap-6">
                  <div className="w-full md:w-1/4">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">Metabolic</span>
                    <h4 className="text-lg font-bold mt-1">Sugar Risk</h4>
                  </div>
                  <div className="w-full md:w-3/4">
                    <div className="flex items-center gap-4 mb-3">
                      <span className={`text-3xl font-display ${result.sweetener_audit?.overall_glycemic_risk === 'HIGH' ? 'text-[#D83F31]' : 'text-[#111]'}`}>
                        {result.sweetener_audit?.overall_glycemic_risk || 'UNKNOWN'}
                      </span>
                    </div>
                    <p className="text-sm font-mono opacity-70">
                      Detected Sweeteners: {result.sweetener_audit?.sweeteners_found?.length ? result.sweetener_audit.sweeteners_found.map((s: any) => s.name).join(', ') : 'None'}
                    </p>
                  </div>
                </div>

                {/* Metric 2: Protein Quality */}
                <div className="flex flex-col md:flex-row border-t border-[#111]/20 pt-6 gap-6">
                  <div className="w-full md:w-1/4">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">Source</span>
                    <h4 className="text-lg font-bold mt-1">Protein Quality</h4>
                  </div>
                  <div className="w-full md:w-3/4">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-2xl font-display">
                        {result.protein_audit?.source_tier || 'Unknown Tier'}
                      </span>
                    </div>
                    <p className="text-sm font-mono opacity-70">
                      {result.protein_audit?.sprinkle_trick_detected ? "WARNING: Protein Dilution (Sprinkling) Detected." : "No dilution detected."}
                    </p>
                  </div>
                </div>

                {/* Metric 3: P:Cal */}
                <div className="flex flex-col md:flex-row border-t border-b border-[#111]/20 py-6 gap-6">
                  <div className="w-full md:w-1/4">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">Density</span>
                    <h4 className="text-lg font-bold mt-1">Calorie Yield</h4>
                  </div>
                  <div className="w-full md:w-3/4">
                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-5xl font-display leading-none">{result.pcal_ratio?.efficiency_pct || 0}</span>
                      <span className="text-lg mb-1">%</span>
                    </div>
                    <p className="text-sm font-mono opacity-70">
                      Classification: {result.pcal_ratio?.classification || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actionable Advice Lists */}
              {(result.verdict?.works_if?.length > 0 || result.verdict?.wont_work_if?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                  {result.verdict?.works_if?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#7A9D54]"></span> Optimized For
                      </h4>
                      <ul className="space-y-4">
                        {result.verdict.works_if.map((item: string, i: number) => (
                          <li key={i} className="text-sm leading-relaxed border-l border-[#7A9D54] pl-4 py-1">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.verdict?.wont_work_if?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#D83F31]"></span> Avoid If
                      </h4>
                      <ul className="space-y-4">
                        {result.verdict.wont_work_if.map((item: string, i: number) => (
                          <li key={i} className="text-sm leading-relaxed border-l border-[#D83F31] pl-4 py-1">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Legal / FSSAI Violations */}
              {result.fssai_violations?.length > 0 && (
                <div className="pt-12 border-t border-[#111]/20 mt-12">
                  <h3 className="text-xl font-bold uppercase tracking-wide mb-6">Legal & Regulatory Analysis</h3>
                  <div className="space-y-4">
                    {result.fssai_violations.map((v: any, i: number) => (
                      <div key={i} className="bg-[#111] text-[#F6F5F2] p-6 flex flex-col md:flex-row gap-4 justify-between items-start">
                        <div>
                          <span className="text-xs font-mono opacity-60 uppercase tracking-widest block mb-1">{v.rule_reference}</span>
                          <p className="text-sm leading-relaxed">{v.description}</p>
                        </div>
                        <span className="shrink-0 px-3 py-1 bg-[#D83F31] text-[#F6F5F2] text-xs font-bold uppercase tracking-widest">
                          Violation
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </section>
          )}

        </div>
      </div>

      {/* Hidden inputs for mobile camera capture */}
      <input type="file" accept="image/*" capture="environment" id="hidden-camera-front" className="hidden" style={{ display: 'none' }} onChange={(e) => setFrontFile(e.target.files?.[0] || null)} />
      <input type="file" accept="image/*" capture="environment" id="hidden-camera-back" className="hidden" style={{ display: 'none' }} onChange={(e) => setBackFile(e.target.files?.[0] || null)} />

      {/* CAMERA MODAL */}
      {cameraActive && (
        <div className="fixed inset-0 z-[100] bg-[#111] flex flex-col">
          <div className="p-6 flex justify-between items-center text-[#F6F5F2]">
            <h3 className="font-bold tracking-widest uppercase text-sm">Scanner Active</h3>
            <button onClick={stopCamera} className="uppercase text-xs font-mono underline">Close</button>
          </div>
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            <video
              id="camera-video"
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              ref={(vid) => { if (vid && videoStream && vid.srcObject !== videoStream) vid.srcObject = videoStream; }}
            />
            {/* Minimal viewfinder lines */}
            <div className="absolute inset-0 pointer-events-none p-12">
              <div className="w-full h-full border border-[#F6F5F2]/30 relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#F6F5F2]"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#F6F5F2]"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#F6F5F2]"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#F6F5F2]"></div>
              </div>
            </div>
          </div>
          <div className="p-8 flex justify-center bg-[#111]">
            <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-[#F6F5F2] flex items-center justify-center hover:bg-[#F6F5F2] group transition-colors">
              <div className="w-16 h-16 rounded-full bg-[#F6F5F2] group-hover:bg-[#111] transition-colors"></div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
