import React, { useState } from 'react';
import { useContractStore, type UserProfile } from '../store/useContractStore';
import { X, Lock, Mail, Zap, Shield } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { setAuthenticated, updateUser, user, triggerToast } = useContractStore();
  const [email, setEmail] = useState('enterprise.legal@contractlens.ai');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRiskPosture, setSelectedRiskPosture] = useState<UserProfile['riskPosture']>(user.riskPosture || 'defensive');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ riskPosture: selectedRiskPosture });
    setAuthenticated(true);
    triggerToast(`Authenticated as Enterprise Legal Lead (${selectedRiskPosture.toUpperCase()} posture). Launching Workbench...`);
    onClose();
  };

  const handleQuickDemoLogin = () => {
    updateUser({ riskPosture: selectedRiskPosture });
    setAuthenticated(true);
    triggerToast(`Demo Auth Credentials Accepted (${selectedRiskPosture.toUpperCase()} posture). Launching Workbench...`);
    onClose();
  };

  return (
    <div className="bg-black/80 backdrop-blur-md fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Form Container */}
      <div className="bg-[#0a0a0a] border border-zinc-800 rounded-sm p-8 max-w-md w-full shadow-2xl relative">
        {/* HUD Corner Ticks */}
        <span className="absolute -top-2 -left-2 text-red-500 font-mono text-xs pointer-events-none select-none">+</span>
        <span className="absolute -top-2 -right-2 text-red-500 font-mono text-xs pointer-events-none select-none">+</span>
        <span className="absolute -bottom-2 -left-2 text-red-500 font-mono text-xs pointer-events-none select-none">+</span>
        <span className="absolute -bottom-2 -right-2 text-red-500 font-mono text-xs pointer-events-none select-none">+</span>

        {/* Modal Header & Close */}
        <div className="flex items-center justify-between mb-6 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <h2 className="font-hud text-white text-sm tracking-wider uppercase font-bold">
              ENTERPRISE AUTHENTICATION
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-sm p-1 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">
              Work Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="bg-black border border-zinc-800 focus:border-white text-white font-mono text-xs p-3 pl-9 rounded-sm w-full outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5">
              Security Key / Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="bg-black border border-zinc-800 focus:border-white text-white font-mono text-xs p-3 pl-9 rounded-sm w-full outline-none transition-colors"
              />
            </div>
          </div>

          {/* Initial Risk Posture Selector */}
          <div className="pt-2">
            <label className="font-hud text-[11px] text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>INITIAL RISK POSTURE PREFERENCE</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['defensive', 'balanced', 'aggressive'] as const).map((posture) => (
                <button
                  key={posture}
                  type="button"
                  onClick={() => setSelectedRiskPosture(posture)}
                  className={`text-center cursor-pointer transition-all capitalize ${selectedRiskPosture === posture
                    ? 'bg-white text-black font-mono font-bold text-xs py-2 px-3 rounded-sm shadow-lg'
                    : 'bg-[#0d0d0d] border border-zinc-800 text-zinc-400 hover:text-white font-mono text-xs py-2 px-3 rounded-sm'
                    }`}
                >
                  {posture}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="bg-white text-black font-display font-bold text-xs py-3 w-full rounded-sm hover:bg-zinc-200 uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              LOG IN & LAUNCH WORKBENCH
            </button>
          </div>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-zinc-800"></div>
          <span className="flex-shrink mx-3 text-[10px] font-mono text-zinc-500 uppercase">OR PREVIEW</span>
          <div className="flex-grow border-t border-zinc-800"></div>
        </div>

        <button
          type="button"
          onClick={handleQuickDemoLogin}
          className="bg-zinc-900 border border-zinc-700 text-zinc-200 font-hud text-xs py-2 w-full rounded-sm hover:border-zinc-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-zinc-300 fill-current" />
          <span>⚡ ONE-CLICK DEMO LOGIN</span>
        </button>
      </div>
    </div>
  );
};
