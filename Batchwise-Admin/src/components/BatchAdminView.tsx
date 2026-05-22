
import React, { useState, useEffect } from 'react';
import { Batch, ViewMode } from '../types';
import { subscribeToBatchMembers, subscribeToBatchStats, sendBatchNotification, revokeBatchAccess } from '../services/firestoreService';
import { XIcon, TrashIcon, ChevronLeftIcon } from './Icons';

interface BatchAdminViewProps {
    batch: Batch;
    onBack: () => void;
    setLoading: (loading: boolean) => void;
}

const BatchAdminView: React.FC<BatchAdminViewProps> = ({ batch, onBack, setLoading }) => {
    const [members, setMembers] = useState<any[]>([]);
    const [stats, setStats] = useState<any[]>([]);
    const [notifTitle, setNotifTitle] = useState('');
    const [notifBody, setNotifBody] = useState('');

    useEffect(() => {
        if (batch.inviteCode) {
            const unsubMembers = subscribeToBatchMembers(batch.inviteCode, setMembers);
            const unsubStats = subscribeToBatchStats(batch.inviteCode, setStats);
            return () => {
                unsubMembers();
                unsubStats();
            };
        }
    }, [batch.inviteCode]);

    const handleBroadcast = async () => {
        if (!notifTitle.trim() || !notifBody.trim() || !batch.inviteCode) return;
        setLoading(true);
        try {
            await sendBatchNotification(batch.inviteCode, notifTitle, notifBody, batch.creatorId || 'admin');
            alert("Broadcast transmitted successfully!");
            setNotifTitle('');
            setNotifBody('');
        } catch (e) {
            console.error(e);
            alert("Broadcast failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (reqId: string) => {
        if (window.confirm("Are you sure you want to revoke access? The student will lose access immediately.")) {
            try {
                await revokeBatchAccess(reqId);
            } catch (e) {
                console.error(e);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 lg:p-12 pb-32">
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5 px-6 lg:px-12 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all">
                        <ChevronLeftIcon size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black italic uppercase tracking-tighter">Admin <span className="text-[var(--primary)]">Command Center</span></h1>
                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{batch.name}</p>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto pt-24 space-y-12">
                
                {/* Statistics Overview */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 flex flex-col gap-2">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Active Students</p>
                        <h3 className="text-4xl font-black italic">{members.length}</h3>
                    </div>
                    <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 flex flex-col gap-2">
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Avg. Progress</p>
                        <h3 className="text-4xl font-black italic">
                            {stats.length > 0 ? Math.round(stats.reduce((acc, s) => acc + (s.progress || 0), 0) / stats.length) : 0}%
                        </h3>
                    </div>
                    <div className="rounded-3xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-8 flex flex-col gap-2 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 size-24 bg-[var(--primary)]/10 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
                        <p className="text-[var(--primary)] text-[10px] font-black uppercase tracking-widest">Node Health</p>
                        <h3 className="text-4xl font-black italic text-white flex items-center gap-2">
                             94.2 <span className="text-xs text-[var(--primary)] not-italic uppercase tracking-widest">Active Sync</span>
                        </h3>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Left Column: Member Registry */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Student <span className="text-[var(--primary)]">Registry</span></h2>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Monitor individual deployment status and curriculum coverage.</p>
                        </div>

                        <div className="space-y-4">
                            {members.length > 0 ? members.map(member => {
                                const userStats = stats.find(s => s.userId === member.userId);
                                const progress = userStats?.progress || 0;
                                
                                return (
                                    <div key={member.id} className="group relative rounded-2xl border border-white/5 bg-white/[0.01] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-white/[0.03] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-white font-black text-sm uppercase">
                                                {member.userName?.charAt(0) || '?'}
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="text-base font-black text-white italic">{member.userName || 'Unknown Student'}</p>
                                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{member.userEmail}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-10 flex-1 sm:justify-center">
                                            <div className="flex flex-col gap-1 w-full max-w-[160px]">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Node Coverage</span>
                                                    <span className="text-[10px] font-black text-[var(--primary)]">{progress}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 p-0.5">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-[var(--primary)] to-cyan-500 rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] transition-all duration-1000"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <p className="text-[8px] font-bold text-slate-500 mt-2 uppercase">
                                                    {userStats?.completedCount || 0} OF {userStats?.totalCount || 0} OBJECTIVES SECURED
                                                </p>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={() => handleRevoke(member.id)}
                                            className="px-6 py-3 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 hover:bg-rose-500 text-slate-500 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all border border-white/5 hover:border-rose-500"
                                        >
                                            Revoke Node
                                        </button>
                                    </div>
                                );
                            }) : (
                                <div className="py-24 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                                    <span className="material-symbols-outlined text-slate-800 text-6xl mb-6">sensors_off</span>
                                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em]">No Active Transmissions</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Broadcast Controls */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">Strategic <span className="text-amber-500">Broadcast</span></h2>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Send instant briefings to all synchronized students.</p>
                        </div>

                        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8 flex flex-col gap-6 shadow-[0_0_50px_rgba(245,158,11,0.05)]">
                             <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-amber-500/50 uppercase tracking-widest ml-1">Briefing Target</label>
                                    <input 
                                        type="text" 
                                        placeholder="Headline (e.g. Schedule Update)"
                                        value={notifTitle}
                                        onChange={(e) => setNotifTitle(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-black placeholder:text-slate-700 focus:border-amber-500/50 outline-none transition-all"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                     <label className="text-[9px] font-black text-amber-500/50 uppercase tracking-widest ml-1">Instruction Data</label>
                                    <textarea 
                                        placeholder="Enter strategic message details..."
                                        value={notifBody}
                                        onChange={(e) => setNotifBody(e.target.value)}
                                        rows={5}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-medium placeholder:text-slate-700 focus:border-amber-500/50 outline-none transition-all resize-none"
                                    />
                                </div>
                                <button 
                                    onClick={handleBroadcast}
                                    className="w-full py-5 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl shadow-amber-900/30 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
                                    disabled={!notifTitle.trim() || !notifBody.trim()}
                                >
                                    <span className="material-symbols-outlined text-lg group-hover:animate-ping">campaign</span>
                                    Initiate Broadcast
                                </button>
                                <p className="text-slate-600 text-[8px] font-black uppercase tracking-widest text-center mt-4">
                                    * Messages are delivered instantly to active student nodes.
                                </p>
                             </div>
                        </div>

                        {/* Node Metadata */}
                        <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-8 space-y-6">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-4">Internal Node Data</p>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-[9px] font-bold text-slate-600 uppercase">Synchronized ID</span>
                                    <span className="text-[9px] font-black text-white font-mono">{batch.inviteCode}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[9px] font-bold text-slate-600 uppercase">Privacy Protocol</span>
                                    <span className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest">{batch.importPermission || 'Public'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[9px] font-bold text-slate-600 uppercase">Encryption</span>
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BatchAdminView;
