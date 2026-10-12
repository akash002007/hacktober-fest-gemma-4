import { useState, useEffect, useRef } from 'react';
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
  Info
} from 'lucide-react';
import { PDFHighlightLayer } from './PDFHighlightLayer';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export function ContractViewer() {
  const { file, clauses, selectedClauseId, isAnalyzing } = useContractStore();
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfError, setPdfError] = useState<boolean>(false);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);

  const pageContainerRef = useRef<HTMLDivElement | null>(null);

  const maxClausePage = clauses.reduce((max, c) => Math.max(max, c.page_number), 1);
  const totalPages = numPages || Math.max(10, maxClausePage);

  useEffect(() => {
    if (selectedClauseId) {
      const selected = clauses.find((c) => c.id === selectedClauseId);
      if (selected && selected.page_number) {
        setCurrentPage(selected.page_number);
      }
    }
  }, [selectedClauseId, clauses]);

  useEffect(() => {
    setCurrentPage(1);
    setPdfError(false);
  }, [file]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfError(false);
  };

  const onDocumentLoadError = () => {
    setPdfError(true);
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.15, 2.2));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.15, 0.5));
  const handleResetZoom = () => setScale(1.0);
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const currentPageClauses = clauses.filter((c) => c.page_number === currentPage);

  const renderFallbackMockDocument = () => {
    const paperWidth = Math.floor(540 * scale);
    const paperHeight = Math.floor(760 * scale);

    return (
      <div
        style={{ width: `${paperWidth}px`, height: `${paperHeight}px`, minHeight: '600px' }}
        className="bg-zinc-950 border border-zinc-800 rounded-md p-8 sm:p-10 relative flex flex-col justify-between select-none mx-auto transition-all duration-200 overflow-hidden text-zinc-300"
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none text-white font-serif font-bold text-6xl select-none rotate-45">
          CONTRACTLENS
        </div>

        <div>
          <div className="border-b border-zinc-800 pb-3 mb-5 flex justify-between items-end text-xs text-zinc-500 font-mono">
            <span>MASTER COMMERCIAL SERVICES AGREEMENT</span>
            <span>PAGE {currentPage} OF {totalPages}</span>
          </div>

          <div className="space-y-2 mb-6">
            <h2 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-400" />
              Section {currentPage}: {currentPage === 3 ? 'Indemnification & Unlimited Liability' : currentPage === 5 ? 'Termination & Convenience Covenants' : currentPage === 8 ? 'Governing Law & Dispute Resolution' : 'General Legal & Commercial Terms'}
            </h2>
            <p className="text-[11px] text-zinc-500 italic font-mono">
              * Document canvas rendering via inspection workbench. Highlights map directly to resolutions on right pane.
            </p>
          </div>

          <div className="space-y-4 text-zinc-600">
            <div className="space-y-2">
              <div className="h-2 w-full bg-zinc-800/80 rounded-sm" />
              <div className="h-2 w-11/12 bg-zinc-800/80 rounded-sm" />
              <div className="h-2 w-4/5 bg-zinc-800/80 rounded-sm" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-2 w-full bg-zinc-800/80 rounded-sm" />
              <div className="h-2 w-5/6 bg-zinc-800/80 rounded-sm" />
              <div className="h-2 w-3/4 bg-zinc-800/80 rounded-sm" />
              <div className="h-2 w-full bg-zinc-800/80 rounded-sm" />
            </div>
            <div className="space-y-2 pt-4">
              <div className="h-2 w-9/10 bg-zinc-800/80 rounded-sm" />
              <div className="h-2 w-full bg-zinc-800/80 rounded-sm" />
              <div className="h-2 w-2/3 bg-zinc-800/80 rounded-sm" />
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-3 flex justify-between items-center text-[10px] font-mono text-zinc-500">
          <span>CONFIDENTIAL & PROPRIETARY</span>
          <span>DOC REF: CL-2026-MSA-X902</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-black/60 backdrop-blur-xl border border-white/10 border-t-white/20 shadow-2xl rounded-sm overflow-hidden relative">
      {/* HUD Corner Brackets */}
      <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-zinc-500 pointer-events-none z-50" />
      <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-zinc-500 pointer-events-none z-50" />
      <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-zinc-500 pointer-events-none z-50" />
      <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-zinc-500 pointer-events-none z-50" />
      
      {/* Floating Dark Controls Bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-black/90 border border-zinc-800 text-zinc-300 font-mono text-xs rounded-sm px-3 py-1.5 backdrop-blur-md flex items-center gap-3 sm:gap-5 max-w-[95%] shadow-md shrink-0">
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Overlay</span>
          </span>
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            title="Toggle risk heatmap layer"
            className={`inline-flex items-center gap-1 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-sm p-1 transition-colors text-[11px] font-mono px-2 py-0.5 ${
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
            className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-sm p-1 transition-colors disabled:opacity-30 disabled:pointer-events-none"
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
            className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-sm p-1 transition-colors disabled:opacity-30 disabled:pointer-events-none"
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
            className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-sm p-1 transition-colors disabled:opacity-30"
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
            className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-sm p-1 transition-colors disabled:opacity-30"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-zinc-800 mx-0.5 hidden sm:block" />

          <button
            onClick={handleResetZoom}
            className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-sm p-1 transition-colors hidden sm:inline-flex"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Main Document / PDF Canvas Viewer */}
      <div className="flex-1 overflow-auto p-4 pt-16 sm:p-6 sm:pt-16 bg-[#0a0a0a] flex justify-center items-start relative custom-scrollbar scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-black">
        
        {(!file || pdfError) && (
          <div className="absolute bottom-3 right-3 z-30 bg-zinc-900 border border-zinc-800 rounded-sm p-2.5 max-w-xs text-[11px] font-mono text-zinc-300 flex items-start gap-2 pointer-events-none">
            <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-mono text-xs">Simulated Canvas</strong>
              <span className="text-zinc-400 text-[10px] block mt-0.5 leading-normal">
                Click any highlighted region to inspect counter-arguments on right pane.
              </span>
            </div>
          </div>
        )}

        <div className="relative inline-block my-2 transition-all duration-200 overflow-hidden rounded-sm">
          {file && !pdfError ? (
            <div ref={pageContainerRef} className="relative rounded-sm overflow-hidden bg-white shadow-md">
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center p-20 text-zinc-400 font-mono text-xs">
                    Loading PDF Document...
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
          ) : (
            <div ref={pageContainerRef} className="relative">
              {renderFallbackMockDocument()}
              
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

      </div>

      {/* Bottom Status Footer */}
      <div className="bg-black border-t border-zinc-800 text-zinc-500 font-mono text-xs p-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-300">Page {currentPage}:</span>
          {currentPageClauses.length > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-zinc-900 text-zinc-200 font-medium font-mono text-[11px] border border-zinc-800">
              {currentPageClauses.length} Indexed {currentPageClauses.length === 1 ? 'Exposure' : 'Exposures'}
            </span>
          ) : (
            <span className="text-zinc-500 italic text-[11px]">No exposure detected on page {currentPage}</span>
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
