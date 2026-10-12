import React, { useState } from 'react';
import { LoginModal } from './LoginModal';
import { ShieldAlert, ArrowRight, Layers, Lock, Cpu } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black bg-[radial-gradient(#222222_1px,transparent_1px)] [background-size:16px_16px] text-white font-mono flex flex-col justify-between relative selection:bg-neutral-800 selection:text-white">
      {/* Top Navigation Header */}
      <header className="h-16 border-b border-zinc-800 bg-black/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="ContractLens Logo" className="w-6 h-6 object-contain" />
          <h1 className="font-display font-bold text-white text-lg tracking-wider">
            CONTRACTLENS <span className="text-red-500">.</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-flex items-center gap-1.5 font-hud text-xs text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            V2.4_ENTERPRISE_READY
          </span>
          <button
            onClick={() => setLoginModalOpen(true)}
            className="bg-zinc-900 border border-zinc-700 hover:border-white text-white font-hud text-xs px-4 py-2 rounded-sm transition-all cursor-pointer"
          >
            SIGN IN
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 max-w-6xl mx-auto w-full my-auto space-y-16">
        
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-4xl mx-auto relative pt-6">
          {/* Subtle HUD Bracket Framing */}
          <div className="inline-flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-sm px-3 py-1 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            <span className="font-hud text-zinc-400 text-xs tracking-widest uppercase">
              [ SYSTEM STATUS: ONLINE ]
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-extrabold text-white tracking-tight uppercase leading-none max-w-3xl mx-auto">
            NEXT-GEN CONTRACT <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
              RISK INTELLIGENCE
            </span>
          </h1>

          <p className="font-mono text-zinc-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Automated clause indexing, real-time risk heatmaps, and defensive redline generation powered by legal AI.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setLoginModalOpen(true)}
              className="bg-white text-black hover:bg-zinc-200 font-display font-bold text-sm px-6 py-3 rounded-sm tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer"
            >
              <span>ACCESS WORKBENCH</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </div>
        </section>

        {/* Feature Highlights Grid (3 Core Value Props) */}
        <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Card 1 */}
          <div className="bg-[#0a0a0a]/80 border border-zinc-800 p-6 rounded-sm hover:border-zinc-600 transition-all flex flex-col justify-between group relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-zinc-400 font-hud text-xs tracking-widest border-b border-zinc-800/80 pb-3">
                <span className="text-white font-bold group-hover:text-red-400 transition-colors">01 / CLAUSE INDEXING</span>
                <Cpu className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </div>
              <p className="font-mono text-xs text-zinc-300 leading-relaxed pt-1">
                Detect uncapped liabilities, non-standard indemnities, and SLA exposures in seconds.
              </p>
            </div>
            <div className="pt-6 font-hud text-[10px] text-zinc-400 flex items-center gap-1.5 uppercase">
              <span>[ AUTOMATED EXTRACTOR ]</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#0a0a0a]/80 border border-zinc-800 p-6 rounded-sm hover:border-zinc-600 transition-all flex flex-col justify-between group relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-zinc-400 font-hud text-xs tracking-widest border-b border-zinc-800/80 pb-3">
                <span className="text-white font-bold group-hover:text-red-400 transition-colors">02 / RISK HEATMAPS</span>
                <ShieldAlert className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </div>
              <p className="font-mono text-xs text-zinc-300 leading-relaxed pt-1">
                Interactive split-canvas mapping flagged clauses directly to defensive counter-proposals.
              </p>
            </div>
            <div className="pt-6 font-hud text-[10px] text-zinc-400 flex items-center gap-1.5 uppercase">
              <span>[ REAL-TIME ANALYSIS ]</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#0a0a0a]/80 border border-zinc-800 p-6 rounded-sm hover:border-zinc-600 transition-all flex flex-col justify-between group relative overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-zinc-400 font-hud text-xs tracking-widest border-b border-zinc-800/80 pb-3">
                <span className="text-white font-bold group-hover:text-red-400 transition-colors">03 / EXECUTIVE REDLINES</span>
                <Layers className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              </div>
              <p className="font-mono text-xs text-zinc-300 leading-relaxed pt-1">
                One-click generation of fully redlined legal agreements with executive audit summaries.
              </p>
            </div>
            <div className="pt-6 font-hud text-[10px] text-zinc-400 flex items-center gap-1.5 uppercase">
              <span>[ REDLINE GENERATOR ]</span>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-black/90 p-4 text-center font-hud text-xs text-zinc-400 flex flex-col sm:flex-row items-center justify-between px-6 gap-2">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-zinc-400" />
          <span>ENTERPRISE GRADE ENCRYPTION (AES-256)</span>
        </div>
        <div>
          <span>© 2026 CONTRACTLENS AI. ALL RIGHTS RESERVED.</span>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
    </div>
  );
};
