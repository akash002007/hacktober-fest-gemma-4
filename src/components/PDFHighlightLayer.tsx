import React, { useState, useEffect } from 'react';
import { useContractStore } from '../store/useContractStore';
import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Clause } from '../types/contract';

interface PDFHighlightLayerProps {
  clauses: Clause[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  scale: number;
  showOverlay: boolean;
}

export function PDFHighlightLayer({
  clauses,
  containerRef,
  scale,
  showOverlay
}: PDFHighlightLayerProps) {
  const { selectedClauseId, setSelectedClauseId } = useContractStore();
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [hoveredClauseId, setHoveredClauseId] = useState<string | null>(null);

  // Use ResizeObserver to track exact rendered dimensions during resizing or zooming
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateDimensions = () => {
      if (el) {
        setDimensions({
          width: el.clientWidth || el.offsetWidth || 0,
          height: el.clientHeight || el.offsetHeight || 0,
        });
      }
    };

    updateDimensions();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        } else {
          updateDimensions();
        }
      }
    });

    observer.observe(el);
    window.addEventListener('resize', updateDimensions);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [containerRef, scale]);

  if (!showOverlay || clauses.length === 0 || dimensions.width === 0 || dimensions.height === 0) {
    return null;
  }

  const getHighlightStyles = (level: Clause['risk_level'], isSelected: boolean, isHovered: boolean) => {
    const activeRing = isSelected || isHovered
      ? "ring-2 ring-white ring-offset-2 ring-offset-black z-40 scale-[1.005] shadow-[0_0_20px_rgba(255,0,0,0.35)] transition-shadow duration-300 before:content-['+'] before:absolute before:-top-2 before:-left-2 before:text-red-500 before:font-mono before:text-xs after:content-['+'] after:absolute after:-top-2 after:-right-2 after:text-red-500 after:font-mono after:text-xs"
      : "z-20 transition-shadow duration-300";

    switch (level) {
      case 'high':
        return `bg-red-600/20 border border-red-500/80 ${isSelected || isHovered ? '' : 'shadow-[0_0_12px_rgba(255,0,0,0.15)]'} ${activeRing} text-red-200`;
      case 'medium':
        return `bg-zinc-100/15 border border-zinc-400 ${activeRing} text-zinc-200`;
      case 'low':
        return `bg-zinc-800/30 border border-zinc-600 ${activeRing} text-zinc-300`;
    }
  };

  const getRiskBadge = (level: Clause['risk_level']) => {
    switch (level) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.5 rounded-sm font-hud tracking-widest text-xs uppercase font-bold relative before:absolute before:inset-0 before:rounded-sm before:bg-red-600/40 before:animate-[pulse_0.8s_ease-in-out_3]">
            <ShieldAlert className="w-3 h-3 text-red-500 relative z-10" />
            <span className="relative z-10">CRITICAL</span>
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-300 border border-zinc-600 px-1.5 py-0.5 rounded-sm font-hud tracking-widest text-xs uppercase font-bold">
            <AlertTriangle className="w-3 h-3 text-zinc-300" />
            MODERATE
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 bg-zinc-900 text-zinc-300 border border-zinc-700 px-1.5 py-0.5 rounded-sm font-hud tracking-widest text-xs uppercase font-bold">
            <CheckCircle2 className="w-3 h-3 text-zinc-400" />
            LOW RISK
          </span>
        );
    }
  };

  const getTagBg = (level: Clause['risk_level']) => {
    switch (level) {
      case 'high':
        return 'bg-red-600 text-white border border-red-500 shadow-[0_0_6px_rgba(255,0,0,0.8)] relative before:absolute before:inset-0 before:rounded-sm before:bg-red-600/40 before:animate-[pulse_0.8s_ease-in-out_3]';
      case 'medium':
        return 'bg-zinc-200 text-black border border-white font-bold';
      case 'low':
        return 'bg-zinc-900 text-zinc-300 border border-zinc-700';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-md z-30">
      {clauses.map((clause, idx) => {
        // Calculate exact pixel values based on relative percentages (0-100)
        const leftPx = (clause.position.x / 100) * dimensions.width;
        const topPx = (clause.position.y / 100) * dimensions.height;
        const widthPx = (clause.position.width / 100) * dimensions.width;
        const heightPx = (clause.position.height / 100) * dimensions.height;

        const isSelected = selectedClauseId === clause.id;
        const isHovered = hoveredClauseId === clause.id;

        return (
          <div
            key={clause.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedClauseId(clause.id);
            }}
            onMouseEnter={() => setHoveredClauseId(clause.id)}
            onMouseLeave={() => setHoveredClauseId(null)}
            style={{
              left: `${leftPx}px`,
              top: `${topPx}px`,
              width: `${widthPx}px`,
              height: `${heightPx}px`,
            }}
            className={`absolute rounded-sm cursor-pointer transition-all duration-150 pointer-events-auto flex items-start justify-between p-1.5 backdrop-blur-[1px] ${getHighlightStyles(
              clause.risk_level,
              isSelected,
              isHovered
            )}`}
          >
            {(isSelected || isHovered) && (
              <>
                <span className="absolute -bottom-2 -left-2 text-red-500 font-mono text-xs pointer-events-none">+</span>
                <span className="absolute -bottom-2 -right-2 text-red-500 font-mono text-xs pointer-events-none">+</span>
              </>
            )}
            {/* Corner Index Tag */}
            <div className="flex items-center gap-1 max-w-full overflow-hidden">
              <span className={`px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-semibold truncate ${getTagBg(clause.risk_level)}`}>
                {clause.index_tag || `#${idx + 1}`}
              </span>
            </div>

            {/* Hover Tooltip */}
            {(isHovered || isSelected) && (
              <div className="absolute -top-9 left-0 z-50 bg-black border border-zinc-700 text-white font-mono text-[11px] px-2.5 py-1 rounded-sm shadow-2xl whitespace-nowrap flex items-center gap-2 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                <span className="font-bold text-white tracking-tight">{clause.clause_name}</span>
                {getRiskBadge(clause.risk_level)}
                <span className="font-hud tracking-widest text-xs uppercase text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded-sm border border-zinc-800">
                  Pg {clause.page_number}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
