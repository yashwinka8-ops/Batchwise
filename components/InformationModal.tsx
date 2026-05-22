
import React from 'react';
import { XIcon, BatchWiseLogo } from './Icons';

interface InformationModalProps {
    onClose: () => void;
}

const InformationModal: React.FC<InformationModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md animate-apple">
            <div className="glass-card w-full max-w-4xl max-h-[80vh] rounded-[2.5rem] flex flex-col overflow-hidden border-[var(--apple-border)]">
                {/* Header */}
                <div className="p-8 border-b border-[var(--apple-border)] flex justify-between items-center bg-[var(--apple-header-bg)]">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-600/20">
                            <BatchWiseLogo className="w-6 h-6 invert" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[var(--apple-text)] tracking-tight uppercase">System Documentation</h2>
                            <p className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest">Version 1.4 Stable Protocol</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="size-10 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                        <XIcon size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12 no-scrollbar">
                    {/* Getting Started */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="material-symbols-outlined text-rose-500">terminal</span>
                            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">Initialisation & Deployment</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-[var(--apple-text)] font-bold">Curriculum Mapping</h4>
                                <p className="text-[var(--apple-text-secondary)] text-sm leading-relaxed">
                                    Create "Batches" as containers for your study roadmap. Each batch can be divided into Subjects, Modules (Chapters), and Sessions (Lectures).
                                </p>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[var(--apple-text)] font-bold">YouTube Autophagy</h4>
                                <p className="text-[var(--apple-text-secondary)] text-sm leading-relaxed">
                                    Import mass-curricula directly from YouTube. Our system extracts timestamps, titles, and descriptions automatically.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Features Matrix */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="material-symbols-outlined text-rose-500">grid_view</span>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">Core Capabilities</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { t: "Cloud Sync", d: "Real-time state persistence across all nodes.", i: "cloud" },
                                { t: "Analytics", d: "Deep metrics on study intensity and progress.", i: "analytics" },
                                { t: "Sharing", d: "Collective intelligence via share codes.", i: "share" },
                                { t: "Library", d: "Shared drive and Telegram resources nexus.", i: "library_books" },
                                { t: "Mocks", d: "NTA-level test simulator (v2 available).", i: "quiz" },
                                { t: "Studio", d: "High-concentration focused study mode.", i: "center_focus_strong" }
                            ].map((feat, i) => (
                                <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                                    <span className="material-symbols-outlined text-rose-500 mb-3">{feat.i}</span>
                                    <h5 className="text-[11px] font-black uppercase tracking-widest text-white mb-2">{feat.t}</h5>
                                    <p className="text-xs text-slate-500 leading-relaxed">{feat.d}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Instructor Protocol */}
                    <section className="p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="material-symbols-outlined text-emerald-500">shield_person</span>
                            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500">Instructor Control Center</h3>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            Verified instructors can broadcast notifications, approve access requests, and monitor student performance via the Command Center. Lead instructors can manage the global Marketplace.
                        </p>
                        <div className="flex gap-4">
                            <div className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">CMD Ready</div>
                            <div className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Auth Verified</div>
                        </div>
                    </section>

                    {/* Keyboard Shortcuts */}
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="material-symbols-outlined text-rose-500">keyboard</span>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">Hotkey Registry</h3>
                        </div>
                        <div className="space-y-3">
                            {[
                                { k: "Esc", d: "Dismiss Modals / Exit Simulator" },
                                { k: "F", d: "Focus Mode (Studio)" },
                                { k: "L", d: "Toggle Completion (Lecture)" },
                                { k: "Space", d: "Play/Pause Video" }
                            ].map((hotkey, i) => (
                                <div key={i} className="flex justify-between items-center p-3 border-b border-white/5">
                                    <span className="text-xs font-medium text-slate-400">{hotkey.d}</span>
                                    <kbd className="px-3 py-1 rounded-md bg-white/10 text-[10px] font-black text-rose-500 border border-white/10 min-w-[50px] text-center">{hotkey.k}</kbd>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-6 bg-black/40 text-center border-t border-white/5">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Proprietary Transmission • End Document</p>
                </div>
            </div>
        </div>
    );
};

export default InformationModal;
