"use client";

import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileText, 
  Languages, 
  ArrowRight, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  X,
  FileDown,
  Sparkles,
  Globe2,
  Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'it', name: 'Italian' },
  { code: 'ko', name: 'Korean' },
  { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'th', name: 'Thai' },
].sort((a, b) => a.name.localeCompare(b.name));

const outputFormats = ['docx', 'pdf', 'txt'];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [targetLang, setTargetLang] = useState("Spanish");
  const [outputFormat, setOutputFormat] = useState("docx");
  const [status, setStatus] = useState<"idle" | "uploading" | "translating" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ fileName: string, downloadUrl: string } | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError("File size exceeds 50MB limit.");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleTranslate = async () => {
    if (!file) return;

    setStatus("translating");
    setProgress(20);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("targetLanguage", targetLang);
    formData.append("outputFormat", outputFormat);

    try {
      setTimeout(() => setProgress(45), 1000);
      setTimeout(() => setProgress(75), 3000);

      const response = await fetch(`${API_BASE_URL}/api/translate`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Translation failed");
      }

      const data = await response.json();
      setResult({
        fileName: data.fileName,
        downloadUrl: `${API_BASE_URL}${data.downloadUrl}`
      });
      setPreviewText(data.translatedText);
      setStatus("success");
      setProgress(100);
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
    }
  };

  const reset = () => {
    setFile(null);
    setStatus("idle");
    setResult(null);
    setPreviewText(null);
    setError(null);
    setProgress(0);
    setShowPreview(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden selection:bg-indigo-500/30">
      {/* Background Elements */}
      <div className="bg-blob blob-1 animate-float" />
      <div className="bg-blob blob-2 animate-float-delayed" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

      <main className="max-w-6xl mx-auto px-6 py-12 lg:py-20 relative z-10">
        {/* Navbar-ish Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-16"
        >
          <div className="flex items-center gap-3 px-6 py-2 rounded-2xl glass border-white/10">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Languages className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">LingoShift</span>
          </div>
        </motion.div>

        {/* Header Section */}
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-8"
          >
            <Sparkles size={14} className="animate-pulse" />
            <span>Next-Generation Translation Engine</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease: "easeOut" }}
            className="text-6xl lg:text-8xl font-black mb-8 leading-[1.1]"
          >
            Breaking <span className="gradient-text">Barriers</span><br />
            with <span className="text-white italic">Precision</span> AI.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg lg:text-2xl max-w-3xl mx-auto leading-relaxed"
          >
            Experience seamless document translation that preserves style, structure, and semantic integrity across 100+ global dialects.
          </motion.p>
        </div>

        {/* Main Interface Grid */}
        <div className="grid lg:grid-cols-12 gap-10 items-stretch">
          
          {/* Left Column: Input Card */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="lg:col-span-7 flex flex-col"
          >
            <div className="glass rounded-[3rem] p-4 lg:p-8 flex-1 relative group">
              {/* Card Glow Effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[3rem] opacity-0 group-hover:opacity-10 transition duration-1000 blur-xl px-4 lg:p-8"></div>
              
              <div className="relative h-full flex flex-col">
                <div className="flex items-center justify-between mb-8 px-2">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <Upload size={18} className="text-indigo-400" />
                    </div>
                    Source Document
                  </h2>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-tighter text-slate-500 uppercase">PDF</span>
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-tighter text-slate-500 uppercase">DOCX</span>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {status === 'idle' || status === 'error' ? (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.02 }}
                      className="flex-1 flex flex-col"
                    >
                      {!file ? (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 border-2 border-dashed border-white/5 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all rounded-[2rem] p-12 text-center cursor-pointer group flex flex-col items-center justify-center min-h-[400px]"
                        >
                          <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden" 
                            accept=".pdf,.docx,.txt,image/*"
                          />
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mb-8 border border-white/5 group-hover:border-indigo-500/30 shadow-2xl transition-all"
                          >
                            <Upload className="text-slate-500 group-hover:text-indigo-400 w-10 h-10" />
                          </motion.div>
                          <h3 className="text-3xl font-bold mb-3 tracking-tight">Drop your masterpiece</h3>
                          <p className="text-slate-500 text-lg max-w-xs mx-auto">Upload any document up to 50MB and let AI do the rest.</p>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 px-8">
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass-card w-full max-w-md p-8 rounded-[2rem] flex items-center gap-6 mb-8 relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16" />
                            <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-500/20">
                              <FileText className="text-indigo-400 w-10 h-10" />
                            </div>
                            <div className="flex-1 min-w-0 pr-10">
                              <p className="text-2xl font-bold truncate mb-1">{file.name}</p>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-indigo-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                <span className="text-sm font-medium text-slate-500 tracking-wider uppercase">{file.name.split('.').pop()}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => setFile(null)}
                              className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-red-500/10 rounded-xl text-slate-500 hover:text-red-400 transition-all border border-white/5 hover:border-red-500/20"
                            >
                             <X size={20} />
                            </button>
                          </motion.div>
                        </div>
                      )}

                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-6 flex items-center gap-3 text-red-400 text-sm p-5 bg-red-400/5 border border-red-400/10 rounded-2xl"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-400/10 flex items-center justify-center shrink-0">
                            <AlertCircle size={18} />
                          </div>
                          <span className="font-medium text-base">{error}</span>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : status === 'translating' ? (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex flex-col items-center justify-center py-20"
                    >
                      <div className="relative mb-12">
                        <div className="absolute inset-0 bg-indigo-500/30 blur-[60px] rounded-full animate-pulse" />
                        <Loader2 className="w-24 h-24 text-indigo-500 animate-spin relative z-10" />
                      </div>
                      <h3 className="text-4xl font-black mb-4 tracking-tight">Processing Matrix...</h3>
                      <p className="text-slate-400 text-xl font-medium mb-12">Our AI is re-weaving the context in {targetLang}</p>
                      
                      <div className="w-full max-w-lg">
                        <div className="flex justify-between items-end mb-4">
                          <span className="text-indigo-400 font-black text-sm uppercase tracking-widest">Global Synchronization</span>
                          <span className="text-white font-black text-2xl">{progress}%</span>
                        </div>
                        <div className="h-4 w-full bg-slate-900 border border-white/5 rounded-full overflow-hidden p-1">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ type: "spring", stiffness: 50 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      className="flex-1 flex flex-col items-center justify-center py-20"
                    >
                      <div className="w-32 h-32 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-10 relative">
                        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 relative z-10" />
                      </div>
                      <h3 className="text-4xl font-black mb-3 tracking-tight">Translation Perfected</h3>
                      <p className="text-slate-400 text-xl font-medium mb-8 italic">Ready to bridge the gap in {targetLang}.</p>
                      
                      {previewText && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="w-full max-w-2xl mb-10 overflow-hidden"
                        >
                          <div className="flex items-center justify-between mb-3 px-4">
                            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Translation Preview</span>
                            <button 
                              onClick={() => setShowPreview(!showPreview)}
                              className="text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-2"
                            >
                              {showPreview ? "Hide Preview" : "Show Preview"}
                            </button>
                          </div>
                          
                          <AnimatePresence>
                            {showPreview && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="glass-card rounded-3xl p-6 text-slate-300 text-sm leading-relaxed max-h-60 overflow-y-auto border border-white/5 scrollbar-hide">
                                  {previewText}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <a 
                          href={result?.downloadUrl} 
                          download={result?.fileName}
                          className="group relative inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-[2rem] font-black text-lg transition-all hover:scale-105 active:scale-95 overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-indigo-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                          <Download size={22} className="relative z-10 group-hover:text-white transition-colors" />
                          <span className="relative z-10 group-hover:text-white transition-colors">Download Evolution</span>
                        </a>
                        <button 
                          onClick={reset}
                          className="px-10 py-5 rounded-[2rem] border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white font-bold transition-all"
                        >
                          Translate Again
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Config & Utils */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:col-span-5 flex flex-col gap-10"
          >
            {/* Configuration Card */}
            <div className="glass rounded-[3rem] p-4 lg:p-8 space-y-10 border-white/10">
              <div className="px-2">
                <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-[0.2em] mb-6">
                  <Globe2 size={14} />
                  Global Configuration
                </div>
                
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-lg font-bold">Target Language</label>
                      <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">AUTO-DETECT SRC</span>
                    </div>
                    <div className="relative group">
                      <select 
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-5 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer font-bold text-lg"
                      >
                        {languages.map(lang => (
                          <option key={lang.code} value={lang.name} className="bg-slate-900">{lang.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                        <Globe2 size={20} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-lg font-bold">Evolution Format</label>
                    <div className="grid grid-cols-3 gap-3">
                      {outputFormats.map(format => (
                        <button
                          key={format}
                          onClick={() => setOutputFormat(format)}
                          className={`py-4 rounded-2xl border-2 font-black transition-all text-xs tracking-widest ${
                            outputFormat === format 
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.2)]' 
                            : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'
                          }`}
                        >
                          {format.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-2">
                <button 
                  disabled={!file || status === 'translating'}
                  onClick={handleTranslate}
                  className={`w-full py-6 rounded-3xl font-black text-xl transition-all flex items-center justify-center gap-4 group relative overflow-hidden ${
                    !file || status === 'translating'
                    ? 'bg-slate-900 border border-white/5 text-slate-700 cursor-not-allowed'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40 active:scale-[0.98]'
                  }`}
                >
                  {status === 'translating' ? (
                    <>
                      <Loader2 className="animate-spin" />
                      SYNCHRONIZING...
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-white/10 skew-x-[45deg] -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 pointer-events-none" />
                      <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
                      INITIATE SHIFT
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Tech Specs / Stats */}
            <div className="glass rounded-[2rem] p-6 lg:p-8 flex items-center gap-6 border-white/5 relative overflow-hidden group">
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 opacity-20 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 group-hover:border-indigo-500/20 transition-all">
                <Cpu size={28} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-2">Neural Engine V2</h4>
                <p className="text-slate-500 text-sm font-medium leading-relaxed italic">Preserving 99.8% structural fidelity including tables, charts, and embedded media.</p>
              </div>
            </div>

            {/* Quick Guidelines */}
            <div className="glass-card rounded-[2rem] p-6 flex flex-col gap-4 border-white/5">
              <div className="flex items-center gap-3 text-slate-300 font-bold mb-2">
                <FileDown size={18} />
                Protocol Guidelines
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  "Semantic Preserve Implementation",
                  "OCR Precision Auto-Correction",
                  "Secure Encryption Sandbox"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-slate-500 font-bold tracking-tight">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/40" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Footer Polish */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-20 text-center"
        >
          <div className="h-px w-full max-w-xs mx-auto bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />
          <p className="text-slate-600 text-xs font-black tracking-[0.4em] uppercase">Powered by LingoShift Quantum Core</p>
        </motion.div>
      </main>
    </div>
  );
}
