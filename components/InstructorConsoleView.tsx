
import React from 'react';
import { Batch, ViewMode } from '../types';
import { ChevronLeftIcon, BatchWiseLogo } from './Icons';

interface InstructorConsoleViewProps {
    batches: Batch[];
    onManageBatch: (batchId: string) => void;
    onAccessRequests: () => void;
    onBack: () => void;
}

const InstructorConsoleView: React.FC<InstructorConsoleViewProps> = ({ batches, onManageBatch, onAccessRequests, onBack }) => {
    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 lg:p-12 pb-32">
            <header className="flex flex-col gap-4 mb-12">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all">
                        <ChevronLeftIcon size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Instructor <span className="text-amber-500">Panel</span></h1>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Global Batch Oversight & Student Management</p>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto space-y-12">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-8 flex flex-col gap-1">
                        <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest">Total Batches</p>
                        <h3 className="text-3xl font-black italic">{batches.length}</h3>
                    </div>
                    <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-8 flex flex-col gap-1">
                        <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest">Global Reach</p>
                        <h3 className="text-3xl font-black italic">
                            {batches.reduce((acc, b) => acc + (b.importCount || 0), 0)} <span className="text-xs text-slate-500 not-italic uppercase tracking-widest">Students</span>
                        </h3>
                    </div>
                    <div 
                        onClick={onAccessRequests}
                        className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8 flex flex-col gap-1 cursor-pointer hover:bg-rose-500/10 transition-all group"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-rose-600 text-[9px] font-black uppercase tracking-widest">Pending Access</p>
                            <span className="material-symbols-outlined text-rose-500 text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </div>
                        <h3 className="text-3xl font-black italic">Requests</h3>
                    </div>
                </div>

                {/* Batch Management Grid */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <h2 className="text-xl font-black uppercase italic tracking-widest">Your <span className="text-amber-500">Deployments</span></h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {batches.length > 0 ? batches.map(batch => (
                            <div 
                                key={batch.id} 
                                onClick={() => onManageBatch(batch.id)}
                                className="group bg-[#0b0f1a] border border-white/5 rounded-3xl p-8 hover:border-amber-500/30 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute -right-12 -bottom-12 size-40 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all" />
                                
                                <div className="flex items-start justify-between mb-8">
                                    <div className="size-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-amber-500">
                                        <span className="material-symbols-outlined text-2xl">shield_person</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Active Node</span>
                                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">ID: {batch.inviteCode}</span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-white italic group-hover:text-amber-400 transition-colors uppercase mb-2">{batch.name}</h3>
                                <p className="text-xs text-slate-500 font-medium mb-8 line-clamp-2 italic">Strategic management of this node is active. Proceed to command center for data synchronization.</p>

                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Subscribers</span>
                                        <span className="text-sm font-black text-white">{batch.importCount || 0}</span>
                                    </div>
                                    <button className="bg-amber-500 hover:bg-amber-400 text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-amber-900/20">
                                        Manage Node
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-24 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                                <span className="material-symbols-outlined text-slate-800 text-6xl mb-6">inventory_2</span>
                                <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] mb-2">No Managed Batches Found</p>
                                <p className="text-[9px] text-slate-700 font-bold uppercase tracking-widest">Batches you create and share will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorConsoleView;
