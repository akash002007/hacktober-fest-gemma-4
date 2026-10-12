import React, { useState, useEffect } from 'react';
import { useContractStore, type UserProfile } from '../store/useContractStore';
import { X, User, Shield, Cpu } from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const { isSettingsModalOpen, setSettingsModalOpen, user, updateUser, triggerToast } = useContractStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'ai'>('profile');

  // Form states
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [riskPosture, setRiskPosture] = useState<UserProfile['riskPosture']>(user.riskPosture);
  const [autoRedline, setAutoRedline] = useState(user.autoRedline);
  const [enterpriseEncryption, setEnterpriseEncryption] = useState(user.enterpriseEncryption);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setRiskPosture(user.riskPosture);
    setAutoRedline(user.autoRedline);
    setEnterpriseEncryption(user.enterpriseEncryption);
  }, [user, isSettingsModalOpen]);

  if (!isSettingsModalOpen) return null;

  const handleSaveChanges = () => {
    updateUser({
      name,
      email,
      riskPosture,
      autoRedline,
      enterpriseEncryption,
    });
    triggerToast('Settings updated successfully');
    setSettingsModalOpen(false);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      triggerToast('Error: Passwords do not match');
      return;
    }
    triggerToast('Security credentials updated');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="bg-black/80 backdrop-blur-md fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Modal Container */}
      <div className="bg-[#0a0a0a] border border-zinc-800 rounded-sm w-full max-w-2xl shadow-2xl overflow-hidden relative font-mono flex flex-col max-h-[85vh]">
        {/* HUD Corner Ticks */}
        <span className="absolute -top-2 -left-2 text-red-500 font-mono text-xs pointer-events-none select-none z-10">+</span>
        <span className="absolute -top-2 -right-2 text-red-500 font-mono text-xs pointer-events-none select-none z-10">+</span>
        <span className="absolute -bottom-2 -left-2 text-red-500 font-mono text-xs pointer-events-none select-none z-10">+</span>
        <span className="absolute -bottom-2 -right-2 text-red-500 font-mono text-xs pointer-events-none select-none z-10">+</span>

        {/* Modal Header */}
        <div className="border-b border-zinc-800 px-6 py-4 flex justify-between items-center bg-black/60 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <h2 className="font-hud text-white text-sm font-bold tracking-wider uppercase">
              WORKSPACE & USER SETTINGS
            </h2>
          </div>
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-sm p-1 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Tab Navigation Pills */}
        <div className="flex items-center gap-1 p-3 bg-black border-b border-zinc-800 overflow-x-auto shrink-0 custom-scrollbar">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono text-xs transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-white text-black font-bold'
                : 'bg-[#0d0d0d] text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono text-xs transition-colors whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-white text-black font-bold'
                : 'bg-[#0d0d0d] text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Security</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono text-xs transition-colors whitespace-nowrap ${
              activeTab === 'ai'
                ? 'bg-white text-black font-bold'
                : 'bg-[#0d0d0d] text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>AI & Risk Preferences</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          {/* TAB 1: PROFILE & ACCOUNT DETAILS */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-sm">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block font-mono">Current Workspace Status</span>
                  <span className="text-zinc-400 text-xs font-hud tracking-widest uppercase">
                    [ STANDARD WORKBENCH TIER ]
                  </span>
                </div>
                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 font-hud text-[10px] px-2 py-0.5 rounded-sm uppercase">
                  Active
                </span>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-black border border-zinc-800 text-white font-mono text-xs p-2.5 rounded-sm focus:border-white outline-none w-full"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-widest mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-black border border-zinc-800 text-white font-mono text-xs p-2.5 rounded-sm focus:border-white outline-none w-full"
                />
              </div>
            </div>
          )}

          {/* TAB 2: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-sm space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase block">Active Environment Session</span>
                <p className="text-xs text-zinc-300 font-mono">
                  Active session running on <span className="text-white font-bold">localhost:5173</span> (Current Browser)
                </p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <h3 className="text-xs font-hud uppercase tracking-widest text-zinc-300 border-b border-zinc-800 pb-2">
                  Change Password
                </h3>

                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="bg-black border border-zinc-800 text-white font-mono text-xs p-2.5 rounded-sm focus:border-white outline-none w-full"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="bg-black border border-zinc-800 text-white font-mono text-xs p-2.5 rounded-sm focus:border-white outline-none w-full"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 uppercase mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="bg-black border border-zinc-800 text-white font-mono text-xs p-2.5 rounded-sm focus:border-white outline-none w-full"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-mono font-semibold text-xs px-4 py-2 rounded-sm border border-zinc-700 transition-colors"
                >
                  UPDATE PASSWORD
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: AI & AUDIT PREFERENCES */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] text-zinc-400 uppercase tracking-widest mb-2">
                  Default Risk Posture Selector
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['defensive', 'balanced', 'aggressive'] as const).map((posture) => (
                    <button
                      key={posture}
                      type="button"
                      onClick={() => setRiskPosture(posture)}
                      className={`p-3 rounded-sm border text-xs capitalize text-center transition-all ${
                        riskPosture === posture
                          ? 'bg-white text-black font-bold border-white'
                          : 'bg-black text-zinc-400 border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      [ {posture} ]
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-zinc-800 pt-4 space-y-4">
                {/* Auto-Redline Engine Cyber Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-white font-bold block">Auto-Redline Engine</span>
                    <span className="text-[11px] text-zinc-400">Automatically suggest counter-proposals upon PDF upload</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoRedline(!autoRedline)}
                    className={`w-11 h-6 rounded-none transition-all relative border flex items-center p-0.5 cursor-pointer ${
                      autoRedline
                        ? 'bg-white border-white shadow-[0_0_10px_rgba(255,0,0,0.5)]'
                        : 'bg-[#121212] border-zinc-800'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-none transition-transform ${
                        autoRedline ? 'bg-black translate-x-5' : 'bg-zinc-600 translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Enterprise Encryption Mode Cyber Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-white font-bold block">Enterprise Encryption Mode</span>
                    <span className="text-[11px] text-zinc-400">Enable local client-side clause parsing & Zero-retention AI</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnterpriseEncryption(!enterpriseEncryption)}
                    className={`w-11 h-6 rounded-none transition-all relative border flex items-center p-0.5 cursor-pointer ${
                      enterpriseEncryption
                        ? 'bg-white border-white shadow-[0_0_10px_rgba(255,0,0,0.5)]'
                        : 'bg-[#121212] border-zinc-800'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-none transition-transform ${
                        enterpriseEncryption ? 'bg-black translate-x-5' : 'bg-zinc-600 translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions / Footer */}
        <div className="border-t border-zinc-800 px-6 py-4 bg-black/60 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setSettingsModalOpen(false)}
            className="bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono text-xs px-4 py-2 rounded-sm hover:border-zinc-500 transition-colors cursor-pointer"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            className="bg-white text-black font-display font-bold text-xs px-5 py-2 rounded-sm hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            SAVE CHANGES
          </button>
        </div>
      </div>
    </div>
  );
};
