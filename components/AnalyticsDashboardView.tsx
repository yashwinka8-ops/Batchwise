import React, { useState, useEffect } from 'react';
import { getGlobalAnalytics } from '../services/firestoreService';

const AnalyticsDashboardView: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [latency, setLatency] = useState<number>(0);

    useEffect(() => {
        const fetchStats = async () => {
            const start = Date.now();
            try {
                const data = await getGlobalAnalytics();
                setLatency(Date.now() - start);
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch global analytics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="size-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Synchronizing Neural Data...</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="py-20 text-center rounded-[2rem] bg-white/[0.01] border border-dashed border-white/5 animate-in fade-in">
                <span className="material-symbols-outlined text-slate-800 text-4xl mb-4">analytics</span>
                <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">Awaiting System Telemetry...</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-6 px-6 py-2 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase text-slate-400 rounded-lg transition-all"
                >
                    Reinitialize Uplink
                </button>
            </div>
        );
    }

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="size-2 bg-emerald-500 rounded-full animate-ping"></span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Live System Telemetry</span>
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tighter italic">Strategic <span className="text-[var(--primary)]">Overview</span></h2>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
                    <div className="px-4 py-2 text-center border-r border-white/10">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">DAU</p>
                        <p className="text-lg font-black text-white">{stats.dau}</p>
                    </div>
                    <div className="px-4 py-2 text-center border-r border-white/10">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">MAU</p>
                        <p className="text-lg font-black text-white">{stats.mau}</p>
                    </div>
                    <div className="px-4 py-2 text-center">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Retention</p>
                        <p className="text-lg font-black text-emerald-500">{stats.mau > 0 ? Math.round((stats.dau / stats.mau) * 100) : 0}%</p>
                    </div>
                </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Students', value: stats.totalStudents, icon: 'groups', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Avg Completion', value: `${stats.avgProgress}%`, icon: 'verified', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Study Volume', value: formatTime(stats.totalStudyTime), icon: 'history_toggle_off', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                    { label: 'Active Batches', value: stats.popularBatches.length, icon: 'layers', color: 'text-rose-500', bg: 'bg-rose-500/10' }
                ].map((m, i) => (
                    <div key={i} className="glass-card p-6 border-white/5 relative group overflow-hidden hover:border-white/20 transition-all">
                        <div className={`absolute -right-4 -top-4 size-24 rounded-full ${m.bg} blur-2xl group-hover:scale-150 transition-transform`}></div>
                        <span className={`material-symbols-outlined ${m.color} mb-4 text-3xl`}>{m.icon}</span>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{m.label}</p>
                        <p className="text-3xl font-black text-white italic">{m.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Popular Batches Table */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">Marketplace Dominance</h3>
                        <div className="flex-1 h-px bg-white/5"></div>
                    </div>
                    <div className="bg-[#0b0f1a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/[0.02] border-b border-white/5">
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Batch Node</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Imports</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Avg Progress</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Growth</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {stats.popularBatches.map((batch: any, i: number) => (
                                    <tr key={batch.id} className="hover:bg-white/[0.01] transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 bg-slate-900 border border-white/10 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-500">
                                                    0{i + 1}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white group-hover:text-[var(--primary)] transition-colors">{batch.name}</p>
                                                    <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">{batch.creatorName || 'Anonymous'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-black text-white">{batch.importCount || 0}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden max-w-[60px]">
                                                    <div className="h-full bg-[var(--primary)]" style={{ width: `${batch.avgCompletion || 0}%` }}></div>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400">{batch.avgCompletion || 0}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-[9px] font-black text-emerald-500 flex items-center gap-1">
                                                Active
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {stats.popularBatches.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-700 text-[9px] font-black uppercase tracking-widest italic">
                                            No marketplace data has synchronized yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Health / Distribution */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">Node Health</h3>
                        <div className="flex-1 h-px bg-white/5"></div>
                    </div>
                    <div className="glass-card p-8 border-white/5 space-y-8 bg-gradient-to-br from-white/[0.02] to-transparent">
                        <div className="flex flex-col items-center text-center">
                            <div className="size-32 rounded-full border-4 border-white/5 border-t-[var(--primary)] border-r-emerald-500 flex flex-col items-center justify-center mb-6 relative">
                                <div className="absolute inset-0 rounded-full bg-[var(--primary)]/5 blur-xl"></div>
                                <p className="text-4xl font-black text-white tracking-tighter italic">{stats.avgProgress}%</p>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Efficiency</p>
                            </div>
                            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">Global Sync Pulse</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed">Average syllabus completion rate across all active student nodes.</p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { l: 'Cloud Latency', v: `${latency}ms`, c: latency < 500 ? 'bg-emerald-500' : 'bg-amber-500' },
                                { l: 'Network Protocol', v: 'HTTPS/WSS', c: 'bg-emerald-500' },
                                { l: 'Security Rule', v: 'V2', c: 'bg-blue-500' }
                            ].map((s, i) => (
                                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{s.l}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-white">{s.v}</span>
                                        <div className={`size-1.5 rounded-full ${s.c}`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboardView;
