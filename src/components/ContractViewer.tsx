import { useState, useEffect, useRef, useMemo } from 'react';
import { useContractStore } from '../store/useContractStore';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  FileText,
  Eye,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { PDFHighlightLayer } from './PDFHighlightLayer';

// Configure PDF.js worker using the verified local worker asset matching react-pdf (4.8.69)
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export function ContractViewer() {
  const { file, fileUrl, currentContract, clauses, selectedClauseId, isAnalyzing } = useContractStore();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfError, setPdfError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [imageObjectUrl, setImageObjectUrl] = useState<string | null>(null);

  const pageContainerRef = useRef<HTMLDivElement | null>(null);

  const maxClausePage = clauses.reduce((max, c) => Math.max(max, c.page_number || 1), 1);
  const totalPages = numPages || Math.max(1, maxClausePage);

  const isImage = Boolean(
    (file && file.type?.startsWith('image/')) ||
    (currentContract && currentContract.mimeType?.startsWith('image/'))
  );

  // Manage Blob URL safely for image files with automatic cleanup to prevent memory leaks
  useEffect(() => {
    if (isImage && file && file.size > 0) {
      const url = URL.createObjectURL(file);
      setImageObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setImageObjectUrl(null);
    }
  }, [isImage, file]);

  // Determine active document source:
  // Prefer in-memory File object if available with valid content (zero network roundtrips).
  // Otherwise, use the file streaming URL from the server.
  const activeDocSource = useMemo(() => {
    if (file && file.size > 0) {
      return file;
    }
    if (fileUrl) {
      return fileUrl;
    }
    return null;
  }, [file, fileUrl]);

  // Unique key identifying the current document to ensure clean remounting on contract switch or retry
  const activeDocKey = useMemo(() => {
    if (currentContract?.id) return currentContract.id;
    if (file && file.size > 0) return `${file.name}-${file.size}-${file.lastModified}`;
    if (fileUrl) return fileUrl;
    return 'empty';
  }, [currentContract?.id, file, fileUrl]);

  // Synchronize current page when a clause is selected in the review drawer
  useEffect(() => {
    if (selectedClauseId) {
      const selected = clauses.find((c) => c.id === selectedClauseId);
      if (selected && selected.page_number) {
        setCurrentPage(selected.page_number);
      }
    }
  }, [selectedClauseId, clauses]);

  // Reset state when switching contracts
  useEffect(() => {
    setCurrentPage(1);
    setPdfError(false);
    setErrorMessage(null);
    setRetryCount(0);
    if (activeDocSource) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
      setNumPages(null);
    }
  }, [activeDocKey]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfError(false);
    setErrorMessage(null);
    setIsLoading(false);
    setIsRetrying(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('[ContractViewer] Document render failure:', error);
    setPdfError(true);
    setIsLoading(false);
    setIsRetrying(false);

    let friendlyMessage = error?.message || 'Unable to parse and render PDF binary canvas in browser.';
    if (error?.name === 'MissingPDFException' || friendlyMessage.toLowerCase().includes('missing')) {
      friendlyMessage = 'The requested contract document could not be found or retrieved from the server.';
    } else if (error?.name === 'InvalidPDFException' || friendlyMessage.toLowerCase().includes('invalid pdf')) {
      friendlyMessage = 'The document binary appears corrupted or does not conform to valid PDF specifications.';
    } else if (error?.name === 'UnexpectedResponseException') {
      friendlyMessage = 'Server returned an invalid or unexpected response when streaming document data.';
    }
    setErrorMessage(friendlyMessage);
  };

  const handleRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setPdfError(false);
    setErrorMessage(null);
    setIsLoading(true);

    // If source is a URL, verify reachability before remounting
    if (typeof activeDocSource === 'string') {
      try {
        const check = await fetch(activeDocSource, { method: 'HEAD' });
        if (!check.ok) {
          throw new Error(`Document server returned HTTP ${check.status} (${check.statusText})`);
        }
      } catch (err: any) {
        console.warn('[ContractViewer] Revalidation warning:', err);
      }
    }

    // Increment retry count to force clean unmount and fresh remount of react-pdf Document
    setRetryCount((prev) => prev + 1);
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.15, 2.2));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.15, 0.5));
  const handleResetZoom = () => setScale(1.0);
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const currentPageClauses = clauses.filter((c) => c.page_number === currentPage);

  return (
    <div className="flex flex-col h-full w-full bg-black/60 backdrop-blur-xl border border-white/10 border-t-white/20 shadow-2xl rounded-sm overflow-hidden relative">
      {/* HUD Corner Brackets */}
      <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-zinc-500 pointer-events-none z-50" />
      <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-zinc-500 pointer-events-none z-50" />
      <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-zinc-500 pointer-events-none z-50" />
      <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-zinc-500 pointer-events-none z-50" />
      
      {/* Floating Dark Controls Bar */}
      {activeDocSource && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-black/90 border border-zinc-800 text-zinc-300 font-mono text-xs rounded-sm px-3 py-1.5 backdrop-blur-md flex items-center gap-3 sm:gap-5 max-w-[95%] shadow-md shrink-0">
          
          {isLoading && (
            <>
              <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-300" />
                <span className="hidden sm:inline">Loading...</span>
              </div>
              <div className="h-4 w-px bg-zinc-800" />
            </>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Overlay</span>
            </span>

            <button
              onClick={() => setShowOverlay(!showOverlay)}
              title="Toggle risk heatmap layer"
              className={`inline-flex items-center gap-1 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-sm p-1 transition-colors text-[11px] font-mono px-2 py-0.5 cursor-pointer ${
                showOverlay
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'bg-zinc-950 border border-zinc-800'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>{showOverlay ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-sm p-1 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="text-xs font-mono font-medium text-zinc-300 px-1.5 select-none whitespace-nowrap">
              Page <span className="text-white font-bold">{currentPage}</span> of {totalPages}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-sm p-1 transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

          <div className="flex items-center gap-1 text-zinc-400">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-sm p-1 transition-colors disabled:opacity-30 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="text-[11px] font-mono w-9 text-center text-zinc-300">
              {Math.round(scale * 100)}%
            </span>

            <button
              onClick={handleZoomIn}
              disabled={scale >= 2.2}
              className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-sm p-1 transition-colors disabled:opacity-30 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <div className="h-3 w-px bg-zinc-800 mx-0.5 hidden sm:block" />

            <button
              onClick={handleResetZoom}
              className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-sm p-1 transition-colors hidden sm:inline-flex cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}

      {/* Main Document / PDF Canvas Viewer */}
      <div className="flex-1 overflow-auto p-4 pt-16 sm:p-6 sm:pt-16 bg-[#0a0a0a] flex justify-center items-start relative custom-scrollbar scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-black min-h-0">
        
        {/* Empty Workspace State */}
        {!activeDocSource && (
          <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto my-auto border border-dashed border-zinc-800 rounded-sm bg-zinc-950/60 font-mono">
            <div className="w-12 h-12 rounded-sm bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3 text-zinc-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-bold text-zinc-200 mb-1 uppercase tracking-widest">No Contract Loaded</h3>
            <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
              Upload a contract PDF or notice image in the zone above, or select a previous analysis from the sidebar to inspect clauses.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-zinc-600">
              <span>SUPPORTED: PDF / PNG / JPG</span>
              <span>•</span>
              <span>MAX: 15MB</span>
            </div>
          </div>
        )}

        {/* PDF Render Failure Error State */}
        {activeDocSource && pdfError && !isImage && (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-auto border border-red-900/50 rounded-sm bg-red-950/20 font-mono">
            <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
            <h4 className="text-sm font-bold text-red-400 mb-1">Canvas Render Notice</h4>
            <p className="text-xs text-zinc-300 mb-2 leading-relaxed">
              {errorMessage || 'Unable to render PDF binary canvas in browser.'}
            </p>
            {clauses.length > 0 && (
              <p className="text-[11px] text-zinc-400 mb-4 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-sm">
                Extracted legal findings and {clauses.length} counter-proposals remain active and accessible in the review drawer below.
              </p>
            )}
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs rounded border border-zinc-700 font-mono transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying Canvas Render...' : 'Retry Canvas Render'}
            </button>
          </div>
        )}

        {/* Real Document Render (PDF or Image Scan) */}
        {activeDocSource && !pdfError && (
          <div className="relative inline-block my-2 transition-all duration-200 overflow-hidden rounded-sm">
            {isImage ? (
              <div ref={pageContainerRef} className="relative rounded-sm overflow-hidden bg-zinc-900 shadow-md">
                <img
                  src={imageObjectUrl || (typeof activeDocSource === 'string' ? activeDocSource : '')}
                  alt={currentContract?.filename || file?.name || 'Contract Notice'}
                  className="max-w-full h-auto object-contain block mx-auto rounded-sm"
                  style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
                />
                <PDFHighlightLayer
                  clauses={currentPageClauses}
                  containerRef={pageContainerRef}
                  scale={scale}
                  showOverlay={showOverlay}
                />
              </div>
            ) : (
              <div ref={pageContainerRef} className="relative rounded-sm overflow-hidden bg-white shadow-md">
                <Document
                  key={`pdf-doc-${activeDocKey}-${retryCount}`}
                  file={activeDocSource}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex flex-col items-center justify-center p-20 text-zinc-400 font-mono text-xs gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                      <span>Loading PDF Document Canvas...</span>
                    </div>
                  }
                >
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </Document>

                <PDFHighlightLayer
                  clauses={currentPageClauses}
                  containerRef={pageContainerRef}
                  scale={scale}
                  showOverlay={showOverlay}
                />
              </div>
            )}

            {/* Laser Document Scanner Effect */}
            {isAnalyzing && (
              <div className="absolute left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-red-500 to-transparent animate-scan shadow-[0_0_15px_#ff0000] z-20 pointer-events-none" />
            )}
          </div>
        )}

      </div>

      {/* Bottom Status Footer */}
      <div className="bg-black border-t border-zinc-800 text-zinc-500 font-mono text-xs p-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {activeDocSource ? (
            <>
              <span className="font-semibold text-zinc-300">Page {currentPage}:</span>
              {currentPageClauses.length > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-zinc-900 text-zinc-200 font-medium font-mono text-[11px] border border-zinc-800">
                  {currentPageClauses.length} Indexed {currentPageClauses.length === 1 ? 'Exposure' : 'Exposures'}
                </span>
              ) : (
                <span className="text-zinc-500 italic text-[11px]">No exposure detected on page {currentPage}</span>
              )}
            </>
          ) : (
            <span className="text-zinc-500 italic text-[11px]">No contract active in workbench</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-red-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_6px_rgba(255,0,0,0.8)] inline-block" /> Critical
          </span>
          <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-zinc-600 inline-block" /> Moderate
          </span>
          <span className="flex items-center gap-1.5 text-zinc-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-zinc-600 inline-block" /> Low
          </span>
        </div>
      </div>

    </div>
  );
}
