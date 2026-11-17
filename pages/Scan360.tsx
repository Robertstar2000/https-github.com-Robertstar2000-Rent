import React, { useState, useRef } from 'react';
import { Camera, RefreshCw, CheckCircle, AlertTriangle, Info, Image as ImageIcon, Box, Search, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useData } from '../contexts/DataContext';
import { ItemStatus } from '../types';

const Scan360: React.FC = () => {
  const { inventory, addMaintenance, updateItemStatus } = useData();
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedAsset = inventory.find(i => i.id === selectedAssetId);

  const startCamera = async () => {
    if (!selectedAssetId) {
      alert("Please select an asset to inspect first.");
      return;
    }
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera failed:', err);
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
        analyzeDamage(dataUrl);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const analyzeDamage = async (base64Image: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const imageData = base64Image.split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { text: `Examine this photo of a ${selectedAsset?.name}. List any visible damage like scratches, dents, or structural issues. If none, state 'No visible damage detected'. Be concise.` },
              { inlineData: { mimeType: 'image/jpeg', data: imageData } }
            ]
          }
        ]
      });

      setAnalysisResult(response.text || "Analysis complete.");
    } catch (err) {
      console.error('Analysis failed:', err);
      setAnalysisResult("AI Analysis failed. Please manually inspect.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApprove = () => {
    if (!selectedAssetId || !analysisResult) return;

    const hasDamage = analysisResult.toLowerCase().includes('damage') || analysisResult.toLowerCase().includes('scratch') || analysisResult.toLowerCase().includes('dent');

    if (hasDamage) {
      addMaintenance({
        itemId: selectedAssetId,
        date: new Date().toISOString().split('T')[0],
        description: `AI Inspection: ${analysisResult}`,
        cost: 0, 
        technician: 'AI System'
      });
      updateItemStatus(selectedAssetId, ItemStatus.MAINTENANCE);
    } else {
      updateItemStatus(selectedAssetId, ItemStatus.AVAILABLE);
    }

    setCapturedImage(null);
    setAnalysisResult(null);
    setSelectedAssetId('');
    alert("Condition Report Saved to database.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Scan360™ Condition Verification</h2>
          <p className="text-slate-500">Document asset integrity with AI-powered visual analysis.</p>
        </div>
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-2xl shadow-sm">
        <div className="flex gap-4">
          <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-xs font-black text-amber-900 uppercase tracking-widest">AI Inspection Protocol</p>
            <p className="text-[11px] text-amber-700 mt-1.5 leading-relaxed font-bold">
              The <span className="italic">Scan360™</span> engine uses Gemini Multimodal AI to identify metallurgical defects, sheave wear, and gate-hook fatigue. Ensure the equipment is well-lit and all serial identifiers are visible. High-confidence defects will automatically trigger a <span className="font-black italic">Maintenance Quarantine</span> status.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
        <label className="text-[10px] font-black text-slate-500 uppercase mb-3 block tracking-widest">Select Asset to Verify</label>
        <div className="relative">
          <Box className="absolute left-4 top-3 text-slate-400" size={20} />
          <select 
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold shadow-inner"
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
          >
            <option value="">Select equipment from enterprise inventory...</option>
            {inventory.map(item => (
              <option key={item.id} value={item.id}>{item.name} ({item.serialNumber})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden aspect-video relative shadow-2xl border-4 border-slate-800">
          {isCameraActive ? (
            <div className="w-full h-full relative">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <button 
                onClick={capturePhoto}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full border-8 border-slate-200/50 flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
              >
                <div className="w-14 h-14 bg-white border-4 border-slate-100 rounded-full"></div>
              </button>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captured asset" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-12 text-center bg-[url('https://www.transparenttextures.com/patterns/grid.png')] bg-opacity-10">
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-xl border border-slate-700">
                <Camera size={44} className="text-slate-600" />
              </div>
              <button 
                disabled={!selectedAssetId}
                onClick={startCamera}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest disabled:opacity-20 shadow-xl shadow-blue-900/30 active:scale-95 transition-all"
              >
                Initialize Capture
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6 h-full flex flex-col">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-full flex flex-col">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
               <ImageIcon size={14} className="text-blue-500" />
               Automated Audit Result
            </h3>
            
            {isAnalyzing ? (
              <div className="py-20 flex flex-col items-center justify-center flex-1 space-y-4">
                <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest animate-pulse">Running Multimodal Engine...</p>
              </div>
            ) : analysisResult ? (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div className={`p-6 rounded-[2rem] border-2 shadow-sm ${analysisResult.toLowerCase().includes('damage') ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                  <p className="font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                     {analysisResult.toLowerCase().includes('damage') ? <AlertTriangle size={14}/> : <CheckCircle size={14}/>}
                     AI Assessment:
                  </p>
                  <p className="text-sm font-medium leading-relaxed">{analysisResult}</p>
                </div>
                <div className="space-y-3">
                  <button 
                    onClick={handleApprove}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                  >
                    Authorize Condition Report
                  </button>
                  <button 
                    onClick={() => {setCapturedImage(null); setAnalysisResult(null); startCamera();}}
                    className="w-full py-4 border-2 border-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Discard & Retake
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center px-6">
                <div className="p-4 bg-slate-50 rounded-2xl mb-4">
                   <Search size={32} className="text-slate-200" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest leading-relaxed">
                  {selectedAssetId ? 'Waiting for photographic capture input...' : 'Selection of enterprise asset required to engage engine.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scan360;