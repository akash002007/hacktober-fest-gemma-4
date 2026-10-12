import React, { useState, useEffect, useRef } from 'react';
import { useContractStore } from '../store/useContractStore';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  X,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';

const ANALYSIS_HINTS = [
  "Extracting legal clauses and definitions...",
  "Running risk detection models...",
  "Analyzing indemnification & liability terms...",
  "Evaluating termination notice periods...",
  "Scoring clause symmetry and party favorability...",
  "Finalizing comprehensive legal risk profile..."
];

export function UploadZone() {
  const {
    file,
    setFile,
    isAnalyzing,
    setAnalyzing,
    setClauses,
    setSelectedClauseId,
    reset,
    triggerToast,
    setGeneralResponse,
    setScratchpadSummary,
    setIsDemoData,
  } = useContractStore();

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [hintIndex, setHintIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manage animation & hints during analysis state
  useEffect(() => {
    let progressInterval: number;
    let hintInterval: number;

    if (isAnalyzing) {
      setProgress(10);
      setHintIndex(0);

      progressInterval = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 92) return 92;
          return prev + Math.floor(Math.random() * 8) + 3;
        });
      }, 400);

      hintInterval = window.setInterval(() => {
        setHintIndex((prev) => (prev + 1) % ANALYSIS_HINTS.length);
      }, 800);
    } else {
      setProgress(0);
    }

    return () => {
      clearInterval(progressInterval);
      clearInterval(hintInterval);
    };
  }, [isAnalyzing]);

  const validateAndProcessFile = async (selectedFile: File) => {
    setError(null);

    const isPdfOrImage =
      selectedFile.type === 'application/pdf' ||
      selectedFile.name.toLowerCase().endsWith('.pdf') ||
      selectedFile.type.startsWith('image/');

    if (!isPdfOrImage) {
      setError('Invalid file format: Please upload a PDF contract (.pdf) or image scan.');
      return;
    }

    const maxSizeBytes = 15 * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      setError(`File size too large (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB). Maximum limit is 15 MB.`);
      return;
    }

    setFile(selectedFile);
    setAnalyzing(true);
    setProgress(15);

    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned error HTTP ${response.status}`);
      }

      const jsonResult = await response.json();
      const contract = jsonResult.contract;
      const analysisData = jsonResult.data || {};

      const rawFindings = contract?.risks || analysisData.findings || [];

      // STEP 3: Do not use mockData when model returns zero findings.
      if (rawFindings.length === 0) {
        setFile(null);
        setClauses([]);
        setSelectedClauseId(null);
        setIsDemoData(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setError('The model returned no findings for this document. Try again or upload a different file.');
        triggerToast('The model returned no findings for this document. Try again or upload a different file.');
        return;
      }

      // Update store with document summary and scratchpad summary
      if (setGeneralResponse) setGeneralResponse(analysisData.general_response || contract?.generalResponse);
      if (setScratchpadSummary) setScratchpadSummary(analysisData.scratchpad_summary || contract?.scratchpadSummary);

      setProgress(100);
      setIsDemoData(false);
      setClauses(rawFindings);
      setSelectedClauseId(rawFindings[0]?.id || null);

      // Set backend contract ID and file streaming URL if available
      if (contract?.id) {
        useContractStore.setState({
          currentContractId: contract.id,
          currentContract: contract,
          fileUrl: `http://localhost:5000/api/contracts/${contract.id}/file`,
          financialExposure: contract.financialExposure || 'Not assessed',
          activeStep: contract.activeStep || 6,
          executionEvents: contract.executionEvents || [],
        });
        useContractStore.getState().loadContracts();
      }

      triggerToast(`Analysis completed successfully! Indexed ${rawFindings.length} clauses.`);
    } catch (err: any) {
      console.error('Live analysis failed:', err);
      const errMsg = err.message || 'Failed to connect to backend server at http://localhost:5000.';
      setError(`Analysis Error: ${errMsg}`);
      triggerToast(`Analysis Failed: ${errMsg}`);
      setFile(null);
      setClauses([]);
      setSelectedClauseId(null);
      setIsDemoData(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setAnalyzing(false);
    }
  };


  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAnalyzing && !file) {
      setIsDragging(true);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAnalyzing && !file) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isAnalyzing || file) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      validateAndProcessFile(droppedFiles[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    setError(null);
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === 0) return '0.00 MB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // ---------------------------------------------------------------------------
  // STATE 1: ANALYZING CONTRACT FOR RISKS
  // ---------------------------------------------------------------------------
  if (isAnalyzing) {
    return (
      <div className="w-full bg-[#0d0d0d] border border-zinc-800 rounded-md p-8 transition-all duration-200 relative overflow-hidden">
        {/* Laser Document Scanner Effect */}
        <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-red-500 to-transparent animate-scan shadow-[0_0_15px_#ff0000]" />
        </div>
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-5 relative z-10">
          
          <div className="w-12 h-12 rounded-sm bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-200">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>

          <div className="space-y-1.5 w-full">
            <h3 className="text-base font-semibold text-white tracking-tight">
              Analyzing Contract for Risks...
            </h3>
            <p className="text-xs text-zinc-400 font-mono flex items-center justify-center gap-2 min-h-[20px]">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              {ANALYSIS_HINTS[hintIndex]}
            </p>
          </div>

          {/* Clean Enterprise Progress Bar */}
          <div className="w-full space-y-2">
            <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-white rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-zinc-500 px-1">
              <span>Extraction Engine</span>
              <span>{Math.min(progress, 99)}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STATE 2: ACTIVE FILE SUMMARY HEADER/CARD (Analysis Complete)
  // ---------------------------------------------------------------------------
  if (file && !isAnalyzing) {
    return (
      <div className="w-full bg-[#0d0d0d] border border-zinc-800 rounded-md p-4 sm:p-5 transition-all duration-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-sm bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0 text-white">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-mono font-medium bg-zinc-900 text-zinc-300 border border-zinc-700">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Analysis Complete
                </span>
                <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-sm border border-zinc-700">
                  {formatFileSize(file.size)}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white font-mono truncate max-w-md" title={file.name}>
                {file.name}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-medium transition-all duration-150 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
              <span>Reset</span>
            </button>
          </div>
          
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STATE 3: DRAG-AND-DROP UPLOAD AREA (Default / No File - Minimal Dashed Box)
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full flex flex-col gap-3">
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-sm p-3.5 flex items-center justify-between gap-3 text-rose-300 text-xs sm:text-sm font-mono">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-rose-500/20 rounded-sm text-rose-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Clean Minimal Dashed Zinc Box */}
      <div
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full rounded-md border border-dashed p-8 sm:p-10 text-center cursor-pointer flex flex-col items-center justify-center group bg-black/60 backdrop-blur-xl border-white/10 border-t-white/20 shadow-2xl transition-all duration-200 ${
          isDragging
            ? 'border-white bg-zinc-900'
            : 'border-dashed border-zinc-700 hover:border-zinc-500/80 hover:bg-zinc-900/40'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* HUD Corner Brackets */}
        <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-zinc-500 pointer-events-none" />
        <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-zinc-500 pointer-events-none" />
        <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-zinc-500 pointer-events-none" />
        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-zinc-500 pointer-events-none" />

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf,image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 text-white mb-3.5 flex items-center justify-center transition-colors">
          <UploadCloud className="w-6 h-6 text-white" />
        </div>

        <h3 className="text-sm sm:text-base text-white font-display font-bold uppercase tracking-wide mb-1">
          {isDragging ? 'Drop contract or legal notice here...' : 'Upload Contract or Legal Notice for Risk Analysis'}
        </h3>
        
        <p className="font-mono text-xs leading-relaxed text-zinc-300 max-w-sm mx-auto mb-5">
          Drag and drop your PDF or scanned notice image here. Automated clause extraction, risk indexing, and counter-proposals with Gemma 4.
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="inline-flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 font-display font-semibold uppercase tracking-wider text-xs px-4 py-2 rounded-sm transition-colors pointer-events-auto"
        >
          <FolderOpen className="w-4 h-4 text-black" />
          <span>Browse Files</span>
        </button>

        <div className="mt-6 pt-4 border-t border-zinc-800 w-full max-w-sm flex items-center justify-center gap-6">
          <span className="font-hud tracking-widest text-xs uppercase text-zinc-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-zinc-400" /> PDF or image of a notice
          </span>
          <span className="font-hud tracking-widest text-xs uppercase text-zinc-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" /> Max file size: 15MB
          </span>
        </div>

      </div>
    </div>
  );
}
