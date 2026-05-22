import React, { useState, useEffect } from 'react';
import { Batch, Doubt, BatchStaff } from '../types';
import { 
    subscribeToBatchMembers, 
    subscribeToBatchStats, 
    sendBatchNotification, 
    revokeBatchAccess,
    subscribeToDoubts,
    resolveDoubt,
    getBatchAnalytics,
    getBatchStaff,
    addBatchStaff
} from '../services/firestoreService';
import { ChevronLeftIcon, XIcon } from './Icons';

interface BatchAdminViewProps {
    batch: Batch;
    onBack: () => void;
    setLoading: (loading: boolean) => void;
    onUpdateBatch: (batchId: string, updates: Partial<Batch>) => Promise<void>;
}

// Sub-component for Marketplace Ops
const MarketplaceOpsTab: React.FC<{ batch: Batch, onUpdate: (updates: Partial<Batch>) => void }> = ({ batch, onUpdate }) => {
    const [isPublic, setIsPublic] = useState(batch.isPublic || false);
    const [isFree, setIsFree] = useState(batch.isFree || false);

    const handleTogglePublic = () => {
        const next = !isPublic;
        setIsPublic(next);
        onUpdate({ isPublic: next });
    };

    const handleToggleFree = () => {
        const next = !isFree;
        setIsFree(next);
        onUpdate({ isFree: next });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 max-w-2xl">
            <div className="border-b border-white/5 pb-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic text-amber-500">Marketplace <span className="text-white">Ops</span></h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Control your batch visibility in the Global Discover nexus.</p>
            </div>

            <div className="space-y-4">
                <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className={`size-12 rounded-2xl flex items-center justify-center transition-all ${isPublic ? 'bg-emerald-500/10 text-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-slate-900 text-slate-600'}`}>
                            <span className="material-symbols-outlined text-2xl">{isPublic ? 'visibility' : 'visibility_off'}</span>
                        </div>
                        <div>
                            <p className="text-sm font-black text-white italic">Public Discoverability</p>
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Toggle batch visibility in the global marketplace.</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleTogglePublic}
                        className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${isPublic ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white'}`}
                    >
                        {isPublic ? 'Remove Access' : 'Authorize Listing'}
                    </button>
                </div>

                <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className={`size-12 rounded-2xl flex items-center justify-center transition-all ${isFree ? 'bg-blue-500/10 text-blue-500 shadow-lg shadow-blue-500/10' : 'bg-amber-500/10 text-amber-500'}`}>
                            <span className="material-symbols-outlined text-2xl">payments</span>
                        </div>
                        <div>
                            <p className="text-sm font-black text-white italic">Monetisation Protocol</p>
                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Free batches are automatically synchronized to user nodes.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">{isFree ? 'FREE' : 'PAID'}</span>
                        <div 
                            onClick={handleToggleFree}
                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${isFree ? 'bg-emerald-500' : 'bg-slate-800'}`}
                        >
                            <div className={`size-4 bg-white rounded-full transition-all transform ${isFree ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </div>
                </div>

                <div className="p-8 rounded-3xl bg-amber-500/5 border border-amber-500/10 mt-8">
                    <div className="flex items-center gap-3 mb-4 text-amber-500">
                        <span className="material-symbols-outlined text-xl">info</span>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em]">Deployment Intelligence</p>
                    </div>
                    <p className="text-xs text-amber-500/70 leading-relaxed font-medium">
                        Listing your batch in the marketplace allows other students to discover your curriculum. If set to FREE, students can immediately synchronise the data. If set to PAID, you must manually approve each request after verification.
                    </p>
                </div>
            </div>
        </div>
    );
};

// Sub-component for Content Logistics
const ContentLogisticsTab: React.FC<{ subjects: any[], setSubjects: any, onDeploy: (subs: any[]) => void }> = ({ subjects, setSubjects, onDeploy }) => {
    const [selectedSubIndex, setSelectedSubIndex] = useState<number | null>(null);
    const [selectedChapId, setSelectedChapId] = useState<string | null>(null);
    const [isEditingLecture, setIsEditingLecture] = useState<any>(null);

    const addSubject = () => {
        const name = prompt("Enter Subject Name:");
        if (name) {
            const newSubjects = [...subjects, { id: Math.random().toString(36).substr(2, 9), name, chapters: [] }];
            setSubjects(newSubjects);
            onDeploy(newSubjects);
        }
    };

    const addChapter = (subIdx: number) => {
        const name = prompt("Enter Chapter Name:");
        if (name) {
            const newSubjects = [...subjects];
            newSubjects[subIdx].chapters.push({ id: Math.random().toString(36).substr(2, 9), name, lectures: [] });
            setSubjects(newSubjects);
            onDeploy(newSubjects);
        }
    };

    const addLecture = (subIdx: number, chapIdx: number) => {
        const title = prompt("Enter Lecture Title:");
        if (title) {
            const newSubjects = [...subjects];
            newSubjects[subIdx].chapters[chapIdx].lectures.push({ 
                id: Math.random().toString(36).substr(2, 9), 
                title, 
                youtubeUrl: '', 
                embedUrl: '', 
                completed: false 
            });
            setSubjects(newSubjects);
            onDeploy(newSubjects);
        }
    };

    const removeLecture = (subIdx: number, chapIdx: number, lecIdx: number) => {
        if (confirm("Delete this lecture?")) {
            const newSubjects = [...subjects];
            newSubjects[subIdx].chapters[chapIdx].lectures.splice(lecIdx, 1);
            setSubjects(newSubjects);
            onDeploy(newSubjects);
        }
    };

    const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const rows = text.split('\n').filter(r => r.trim()).slice(1);
            const newSubjects = [...subjects];
            
            rows.forEach(row => {
                // Handling CSV with potential double quotes from Export
                const parts = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                if (!parts || parts.length < 3) return;
                
                const clean = (s: string) => s.replace(/^"|"$/g, '').trim();
                const sub = clean(parts[0]);
                const chap = clean(parts[1]);
                const lec = clean(parts[2]);
                const url = parts[3] ? clean(parts[3]) : '';
                const pdf = parts[4] ? clean(parts[4]) : '';
                const unlock = parts[5] ? clean(parts[5]) : '';
                const demo = parts[6] ? clean(parts[6]) : 'false';

                if (!sub || !chap || !lec) return;
                
                let sIdx = newSubjects.findIndex(s => s.name === sub);
                if (sIdx === -1) {
                    newSubjects.push({ id: `s_${Date.now()}_${Math.random()}`, name: sub, chapters: [] });
                    sIdx = newSubjects.length - 1;
                }
                
                let cIdx = newSubjects[sIdx].chapters.findIndex((c: any) => c.name === chap);
                if (cIdx === -1) {
                    newSubjects[sIdx].chapters.push({ id: `c_${Date.now()}_${Math.random()}`, name: chap, lectures: [] });
                    cIdx = newSubjects[sIdx].chapters.length - 1;
                }
                
                let lIdx = newSubjects[sIdx].chapters[cIdx].lectures.findIndex((l: any) => l.title === lec);
                if (lIdx !== -1) {
                    // Update existing lecture metadata (Smart Merge)
                    newSubjects[sIdx].chapters[cIdx].lectures[lIdx] = {
                        ...newSubjects[sIdx].chapters[cIdx].lectures[lIdx],
                        youtubeUrl: url || newSubjects[sIdx].chapters[cIdx].lectures[lIdx].youtubeUrl,
                        embedUrl: url || newSubjects[sIdx].chapters[cIdx].lectures[lIdx].embedUrl,
                        notesPdfUrl: pdf || newSubjects[sIdx].chapters[cIdx].lectures[lIdx].notesPdfUrl,
                        scheduledDate: unlock || newSubjects[sIdx].chapters[cIdx].lectures[lIdx].scheduledDate,
                        isDemo: demo.toLowerCase() === 'true'
                    };
                } else {
                    // Add new lecture
                    newSubjects[sIdx].chapters[cIdx].lectures.push({
                        id: `l_${Date.now()}_${Math.random()}`,
                        title: lec,
                        youtubeUrl: url,
                        embedUrl: url,
                        notesPdfUrl: pdf,
                        scheduledDate: unlock,
                        isDemo: demo.toLowerCase() === 'true',
                        completed: false
                    });
                }
            });
            setSubjects(newSubjects);
            onDeploy(newSubjects);
            alert("Convergence Successful: Smart Import Merged Nodes.");
        };
        reader.readAsText(file);
    };

    const downloadTemplate = () => {
        const csv = "Subject,Chapter,Lecture,VideoUrl,PdfUrl,UnlockDate,isDemo\nPhysics,Electronics,Semiconductor Basics,https://youtube.com/...,https://pdf.url/...,2024-05-01,true";
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'batch_import_template.csv';
        a.click();
    };

    const handleExportCSV = () => {
        const rows = [["Subject", "Chapter", "Lecture", "YouTube URL", "PDF URL", "Unlock Date", "isDemo"]];
        subjects.forEach(s => {
            s.chapters.forEach((c: any) => {
                c.lectures.forEach((l: any) => {
                    // Escape commas in titles
                    const escape = (str?: string) => `"${(str || '').replace(/"/g, '""')}"`;
                    rows.push([escape(s.name), escape(c.name), escape(l.title), escape(l.youtubeUrl), escape(l.notesPdfUrl), escape(l.scheduledDate), escape(l.isDemo ? 'true' : 'false')]);
                });
            });
        });
        const csvContent = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `nexus_export_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5 pb-8">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter italic">Content <span className="text-rose-500">Logistics</span></h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Architect and synchronize your curriculum nodes.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <button onClick={downloadTemplate} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all border border-white/10">Template</button>
                    <button onClick={handleExportCSV} className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">ios_share</span>
                        Export (AI Ready)
                    </button>
                    <label className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-xl">
                        Import CSV
                        <input type="file" accept=".csv" className="hidden" onChange={handleBulkImport} />
                    </label>
                    <button onClick={() => onDeploy(subjects)} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl active:scale-95">Deploy Changes</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Subjects Column */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sub-Modules</span>
                        <button onClick={addSubject} className="text-[var(--primary)] font-black text-[10px] uppercase tracking-widest hover:brightness-125">+ Add Subject</button>
                    </div>
                    <div className="space-y-2">
                        {subjects.map((sub, idx) => (
                            <div key={sub.id} onClick={() => { setSelectedSubIndex(idx); setSelectedChapId(null); }} className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${selectedSubIndex === idx ? 'bg-[var(--primary)]/10 border-[var(--primary)]/50' : 'bg-white/[0.01] border-white/5 hover:border-white/10'}`}>
                                <span className={`text-xs font-black uppercase tracking-wider ${selectedSubIndex === idx ? 'text-white' : 'text-slate-400'}`}>{sub.name}</span>
                                <span className="text-[9px] font-bold text-slate-600 uppercase">{sub.chapters.length} Units</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chapters Column */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Units</span>
                        {(selectedSubIndex !== null) && <button onClick={() => addChapter(selectedSubIndex)} className="text-amber-500 font-black text-[10px] uppercase tracking-widest hover:brightness-125">+ Add Chapter</button>}
                    </div>
                    {(selectedSubIndex !== null) ? (
                        <div className="space-y-2">
                            {subjects[selectedSubIndex].chapters.map((chap: any) => (
                                <div key={chap.id} onClick={() => setSelectedChapId(chap.id)} className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${selectedChapId === chap.id ? 'bg-amber-500/10 border-amber-500/50' : 'bg-white/[0.01] border-white/5 hover:border-white/10'}`}>
                                    <span className={`text-xs font-black uppercase tracking-wider ${selectedChapId === chap.id ? 'text-white' : 'text-slate-400'}`}>{chap.name}</span>
                                    <span className="text-[9px] font-bold text-slate-600 uppercase">{chap.lectures.length} Sessions</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center border border-dashed border-white/5 rounded-3xl text-[10px] font-black text-slate-700 uppercase tracking-widest">Select Subject</div>
                    )}
                </div>

                {/* Lectures Column */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data Streams</span>
                        {selectedChapId && <button onClick={() => {
                            const cIdx = subjects[selectedSubIndex!].chapters.findIndex((c: any) => c.id === selectedChapId);
                            addLecture(selectedSubIndex!, cIdx);
                        }} className="text-emerald-500 font-black text-[10px] uppercase tracking-widest hover:brightness-125">+ Add Lecture</button>}
                    </div>
                    {selectedChapId ? (
                        <div className="space-y-3">
                            {subjects[selectedSubIndex!].chapters.find((c: any) => c.id === selectedChapId).lectures.map((lec: any, idx: number) => (
                                <div key={lec.id} className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 group hover:bg-white/[0.03] transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-white mb-1">{lec.title}</p>
                                            <div className="flex items-center gap-2">
                                                {lec.isDemo && <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/20 px-1.5 py-0.5 rounded bg-emerald-500/5">Demo</span>}
                                                {lec.notesPdfUrl && <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/20 px-1.5 py-0.5 rounded bg-blue-500/5">PDF</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setIsEditingLecture({ subIdx: selectedSubIndex!, chapIdx: subjects[selectedSubIndex!].chapters.findIndex((c: any) => c.id === selectedChapId), lecIdx: idx, ...lec })} className="size-8 rounded-lg bg-white/5 hover:bg-blue-500 text-slate-500 hover:text-white transition-all flex items-center justify-center">
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                            <button onClick={() => removeLecture(selectedSubIndex!, subjects[selectedSubIndex!].chapters.findIndex((c: any) => c.id === selectedChapId), idx)} className="size-8 rounded-lg bg-white/5 hover:bg-rose-500 text-slate-500 hover:text-white transition-all flex items-center justify-center">
                                                <span className="material-symbols-outlined text-sm">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center border border-dashed border-white/5 rounded-3xl text-[10px] font-black text-slate-700 uppercase tracking-widest">Select Unit</div>
                    )}
                </div>
            </div>

            {isEditingLecture && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                    <div className="glass-card w-full max-w-md rounded-[2.5rem] p-8 space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-black uppercase italic tracking-tighter">Edit <span className="text-blue-500">Node</span></h3>
                            <button onClick={() => setIsEditingLecture(null)} className="text-slate-500 hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="space-y-4">
                             <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Node Title</label>
                                 <input type="text" value={isEditingLecture.title} onChange={(e) => setIsEditingLecture({ ...isEditingLecture, title: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-bold" placeholder="Title"/>
                             </div>
                             <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Intelligence Stream (YT URL)</label>
                                 <input type="text" value={isEditingLecture.youtubeUrl} onChange={(e) => setIsEditingLecture({ ...isEditingLecture, youtubeUrl: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-bold" placeholder="YouTube URL"/>
                             </div>
                             <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Documentation (PDF URL)</label>
                                 <input type="text" value={isEditingLecture.notesPdfUrl || ''} onChange={(e) => setIsEditingLecture({ ...isEditingLecture, notesPdfUrl: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-bold" placeholder="PDF Notes URL"/>
                             </div>
                             <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Auto-Unlock Date (Scheduling)</label>
                                 <input type="date" value={isEditingLecture.scheduledDate || ''} onChange={(e) => setIsEditingLecture({ ...isEditingLecture, scheduledDate: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-bold [color-scheme:dark]"/>
                             </div>
                             <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                 <input type="checkbox" checked={isEditingLecture.isDemo || false} onChange={(e) => setIsEditingLecture({ ...isEditingLecture, isDemo: e.target.checked })} className="size-4 rounded accent-emerald-500"/>
                                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Demo Access (Free Preview)</span>
                             </div>
                        </div>
                        <button onClick={() => {
                                const newSubjects = [...subjects];
                                const { subIdx, chapIdx, lecIdx, title, youtubeUrl, notesPdfUrl, isDemo, scheduledDate } = isEditingLecture;
                                newSubjects[subIdx].chapters[chapIdx].lectures[lecIdx] = {
                                    ...newSubjects[subIdx].chapters[chapIdx].lectures[lecIdx],
                                    title, youtubeUrl, embedUrl: youtubeUrl, notesPdfUrl, isDemo, scheduledDate
                                };
                                setSubjects(newSubjects);
                                setIsEditingLecture(null);
                            }} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl transition-all shadow-xl">Update Node</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const BatchAdminView: React.FC<BatchAdminViewProps> = ({ batch, onBack, setLoading, onUpdateBatch }) => {
    const [members, setMembers] = useState<any[]>([]);
    const [stats, setStats] = useState<any[]>([]);
    const [notifTitle, setNotifTitle] = useState('');
    const [notifBody, setNotifBody] = useState('');
    const [activeTab, setActiveTab] = useState<'command' | 'logistics' | 'marketing' | 'branding' | 'doubts' | 'analytics' | 'staff'>('command');
    const [subjects, setSubjects] = useState<any[]>(batch.subjects || []);

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
        if (window.confirm("Are you sure you want to revoke access?")) {
            try {
                await revokeBatchAccess(reqId);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleUpdateMetadata = async (updates: Partial<Batch>) => {
        await onUpdateBatch(batch.id, updates);
    };

    const handleDeploy = async (newSubjects: any[]) => {
        try {
            await onUpdateBatch(batch.id, { subjects: newSubjects });
        } catch (e) {
            console.error('Deploy failed:', e);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 lg:p-12 pb-32">
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5 px-6 lg:px-12 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all"><ChevronLeftIcon size={20} /></button>
                    <div>
                        <h1 className="text-xl font-black italic uppercase tracking-tighter">Admin <span className="text-[var(--primary)]">Nexus</span></h1>
                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{batch.name}</p>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto pt-24 space-y-12 transition-all">
                <div className="flex flex-wrap items-center gap-2 p-1 rounded-2xl bg-white/[0.02] border border-white/5 w-fit">
                    {(['command', 'doubts', 'analytics', 'logistics', 'marketing', 'staff', 'branding'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                            {tab === 'command' ? 'Command' : 
                             tab === 'doubts' ? 'Doubts' : 
                             tab === 'analytics' ? 'Insights' : 
                             tab === 'logistics' ? 'Logistics' : 
                             tab === 'marketing' ? 'Marketplace' : 
                             tab === 'staff' ? 'Staff' : 'Identity'}
                        </button>
                    ))}
                </div>

                {activeTab === 'command' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 flex flex-col gap-2">
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Active Students</p>
                                <h3 className="text-4xl font-black italic">{members.length}</h3>
                            </div>
                            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 flex flex-col gap-2">
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Avg. Progress</p>
                                <h3 className="text-4xl font-black italic">{stats.length > 0 ? Math.round(stats.reduce((acc, s) => acc + (s.progress || 0), 0) / stats.length) : 0}%</h3>
                            </div>
                            <div className="rounded-3xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-8 flex flex-col gap-2 relative overflow-hidden group">
                                <div className="absolute -right-4 -bottom-4 size-24 bg-[var(--primary)]/10 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
                                <p className="text-[var(--primary)] text-[10px] font-black uppercase tracking-widest">Node Health</p>
                                <h3 className="text-4xl font-black italic text-white flex items-center gap-2">94.2 <span className="text-xs text-[var(--primary)] not-italic uppercase tracking-widest">Active Sync</span></h3>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            <div className="lg:col-span-8 space-y-8">
                                <div className="flex flex-col gap-2 border-b border-white/5 pb-4"><h2 className="text-2xl font-black uppercase italic tracking-tighter">Student <span className="text-[var(--primary)]">Registry</span></h2></div>
                                <div className="space-y-4">
                                    {members.map(member => (
                                        <div key={member.id} className="group relative rounded-2xl border border-white/5 bg-white/[0.01] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-white/[0.03] transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-white font-black text-sm uppercase">{member.userName?.charAt(0)}</div>
                                                <div className="flex flex-col">
                                                    <p className="text-base font-black text-white italic">{member.userName || 'Student'}</p>
                                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{member.userEmail}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleRevoke(member.id)} className="px-6 py-3 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 hover:bg-rose-500 text-slate-500 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all">Revoke</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:col-span-4 space-y-8">
                                <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8 flex flex-col gap-6 shadow-xl">
                                     <div className="space-y-4">
                                        <input type="text" placeholder="Headline" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-black outline-none"/>
                                        <textarea placeholder="Message..." value={notifBody} onChange={(e) => setNotifBody(e.target.value)} rows={5} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-medium outline-none resize-none"/>
                                        <button onClick={handleBroadcast} disabled={!notifTitle.trim() || !notifBody.trim()} className="w-full py-5 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all">Broadcast</button>
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'logistics' && (
                    <ContentLogisticsTab subjects={subjects} setSubjects={setSubjects} onDeploy={handleDeploy} />
                )}

                {activeTab === 'marketing' && (
                    <MarketplaceOpsTab batch={batch} onUpdate={handleUpdateMetadata} />
                )}

                {activeTab === 'branding' && (
                    <BatchBrandingTab batch={batch} onUpdate={handleUpdateMetadata} />
                )}

                {activeTab === 'doubts' && (
                    <DoubtConsoleTab batchId={batch.inviteCode!} />
                )}

                {activeTab === 'analytics' && (
                    <BatchAnalyticsTab batchId={batch.inviteCode!} />
                )}

                {activeTab === 'staff' && (
                    <StaffManagementTab batchId={batch.inviteCode!} />
                )}
            </div>
        </div>
    );
};


const BatchBrandingTab: React.FC<{ batch: Batch, onUpdate: (updates: Partial<Batch>) => void }> = ({ batch, onUpdate }) => {
    const [desc, setDesc] = useState(batch.description || '');
    const [themeImg, setThemeImg] = useState(batch.theme?.coverImage || '');
    const [landingEnabled, setLandingEnabled] = useState(batch.enableLandingPage || false);
    const [highlights, setHighlights] = useState<string[]>(batch.syllabusHighlights || []);
    const [newHighlight, setNewHighlight] = useState('');

    const saveChanges = () => {
        onUpdate({ 
            description: desc, 
            enableLandingPage: landingEnabled,
            syllabusHighlights: highlights,
            theme: { ...batch.theme, coverImage: themeImg, gradient: batch.theme?.gradient || '', accentColor: batch.theme?.accentColor || '' }
        });
        alert("Batch Identity Updated!");
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 max-w-3xl">
            <div className="border-b border-white/5 pb-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic text-[var(--primary)]">Batch <span className="text-white">Branding</span></h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Configure your batch's global appearance and enrollment portal.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-black text-white italic">Custom Landing Page</p>
                            <div 
                                onClick={() => setLandingEnabled(!landingEnabled)}
                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${landingEnabled ? 'bg-[var(--primary)]' : 'bg-slate-800'}`}
                            >
                                <div className={`size-4 bg-white rounded-full transition-all transform ${landingEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-600 font-bold uppercase leading-relaxed">Toggle a premium landing page for your curriculum to increase visibility and professional appeal.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Banner Image URL</label>
                        <input 
                            type="text" 
                            value={themeImg}
                            onChange={(e) => setThemeImg(e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-bold"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Batch Description</label>
                        <textarea 
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            placeholder="Detail your curriculum objectives..."
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-xs font-medium outline-none focus:border-[var(--primary)]/50 resize-none"
                            rows={6}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Syllabus Highlights</label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={newHighlight}
                                onChange={(e) => setNewHighlight(e.target.value)}
                                placeholder="Add feature (e.g. Weekly Tests)"
                                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-bold"
                            />
                            <button 
                                onClick={() => { if(newHighlight) { setHighlights([...highlights, newHighlight]); setNewHighlight(''); } }}
                                className="px-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                            >
                                <span className="material-symbols-outlined text-white">add</span>
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                            {highlights.map((h, i) => (
                                <div key={i} className="px-3 py-1.5 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center gap-2 group">
                                    <span className="text-[9px] font-black text-[var(--primary)] uppercase tracking-wider">{h}</span>
                                    <button onClick={() => setHighlights(highlights.filter((_, idx) => idx !== i))} className="size-4 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-[10px] text-white">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={saveChanges}
                        className="w-full py-5 bg-[var(--primary)] hover:brightness-110 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl shadow-[var(--primary)]/20 mt-4 active:scale-95"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};

const TransmissionsInboxTab: React.FC<{ batch: Batch }> = ({ batch }) => {
    const [inquiries, setInquiries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        const loadInquiries = async () => {
            const { subscribeToIncomingInquiries } = await import('../services/firestoreService');
            return subscribeToIncomingInquiries(batch.creatorId || 'admin', (data) => {
                setInquiries(data);
                setLoading(false);
            });
        };
        
        let unsub: any;
        loadInquiries().then(u => unsub = u);
        return () => unsub?.();
    }, [batch.creatorId]);

    useEffect(() => {
        if (selectedId) {
            const current = inquiries.find(i => i.id === selectedId);
            if (current && current.status === 'unread') {
                handleMarkRead(selectedId);
            }
        }
    }, [selectedId, inquiries]);

    const handleMarkRead = async (id: string) => {
        const { markInquiryAsRead } = await import('../services/firestoreService');
        await markInquiryAsRead(id);
    };

    const handleDelete = async (id: string) => {
        if(!confirm("Erase this transmission record?")) return;
        const { deleteInquiry } = await import('../services/firestoreService');
        await deleteInquiry(id);
        if (selectedId === id) setSelectedId(null);
    };

    const activeInquiry = inquiries.find(i => i.id === selectedId);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="size-10 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Scanning Frequencies...</p>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 h-[700px] max-h-[80vh] flex flex-col md:flex-row gap-6">
            {/* User List Pane */}
            <div className={`flex-1 md:flex-none md:w-[320px] bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden transition-all ${selectedId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="material-symbols-outlined text-rose-500 text-base">forum</span>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Curriculum Contacts</h3>
                    </div>
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Active Conversations: {inquiries.length}</p>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
                    {inquiries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center opacity-40">
                            <span className="material-symbols-outlined text-3xl">settings_input_antenna</span>
                            <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">No transmissions detected.</p>
                        </div>
                    ) : (
                        inquiries.map(item => (
                            <div 
                                key={item.id}
                                onClick={() => setSelectedId(item.id)}
                                className={`group p-4 rounded-3xl border transition-all cursor-pointer relative ${selectedId === item.id ? 'bg-rose-500/10 border-rose-500/30' : 'bg-black/20 border-white/5 hover:border-white/10 hover:bg-white/[0.03]'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`size-10 rounded-2xl flex items-center justify-center text-xs font-black italic transition-all ${selectedId === item.id ? 'bg-rose-500 text-white' : 'bg-slate-900 text-slate-400 group-hover:text-white'}`}>
                                        {item.userName?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[13px] font-black text-white truncate italic">{item.userName}</p>
                                            {item.status === 'unread' && <div className="size-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse" />}
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-600 truncate uppercase mt-0.5">{item.userEmail}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Thread Pane */}
            <div className={`flex-[2] bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden relative ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
                {activeInquiry ? (
                    <>
                        {/* Thread Header */}
                        <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                                <button onClick={() => setSelectedId(null)} className="md:hidden size-10 rounded-2xl bg-white/5 flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                                </button>
                                <div className="size-12 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-white font-black text-base italic uppercase shrink-0">
                                    {activeInquiry.userName?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-black text-white truncate italic">{activeInquiry.userName}</h3>
                                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest truncate">{activeInquiry.userEmail}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleDelete(activeInquiry.id)} className="size-10 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 transition-all flex items-center justify-center">
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                        </div>

                        {/* Message History */}
                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                             {(activeInquiry.messages || [{ role: 'student', text: activeInquiry.message, timestamp: activeInquiry.createdAt }]).map((m: any, i: number) => (
                                <div key={i} className={`flex flex-col gap-2 ${m.role === 'admin' ? 'items-end' : 'items-start'}`}>
                                    <div className={`p-4 rounded-3xl text-[13px] font-medium leading-relaxed max-w-[85%] shadow-lg ${m.role === 'admin' ? 'bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-tr-none' : 'bg-black/40 border border-white/10 text-slate-300 rounded-tl-none'}`}>
                                        {m.text}
                                    </div>
                                    <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest px-2">
                                        {m.role === 'admin' ? 'You (Instructor)' : activeInquiry.userName} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Reply Input Bar */}
                        <div className="p-4 bg-white/[0.02] border-t border-white/5">
                            <form 
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const replyText = (form.elements.namedItem('reply') as HTMLInputElement).value;
                                    if(!replyText.trim()) return;

                                    const { replyToInquiry } = await import('../services/firestoreService');
                                    await replyToInquiry(activeInquiry.id, replyText);
                                    form.reset();
                                }}
                                className="flex gap-3"
                            >
                                <input 
                                    name="reply"
                                    type="text" 
                                    placeholder={`Send reply to ${activeInquiry.userName}...`}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white text-xs font-medium focus:outline-none focus:border-rose-500/30 transition-all"
                                />
                                <button 
                                    type="submit"
                                    className="size-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    <span className="material-symbols-outlined text-lg">send</span>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-6 opacity-40">
                        <div className="size-24 rounded-[3rem] border-2 border-dashed border-white/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl">mark_chat_unread</span>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-base font-black uppercase tracking-widest text-white">Discovery Mode Active</h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Select a curriculum node contact to initialize a bidirectional secure channel.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const DoubtConsoleTab: React.FC<{ batchId: string }> = ({ batchId }) => {
    const [doubts, setDoubts] = useState<Doubt[]>([]);

    useEffect(() => {
        const unsub = subscribeToDoubts(batchId, setDoubts);
        return () => unsub();
    }, [batchId]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="border-b border-white/5 pb-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic text-amber-500">Doubt <span className="text-white">Console</span></h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Monitor peer-to-peer discussions and verify community resolutions.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {doubts.length === 0 ? (
                    <div className="py-20 text-center border border-dashed border-white/5 rounded-[2.5rem]">
                        <p className="text-slate-600 text-xs font-medium italic">No active inquiries detected in the curriculum nexus.</p>
                    </div>
                ) : (
                    doubts.map(doubt => (
                        <DoubtConsoleItem key={doubt.id} doubt={doubt} />
                    ))
                )}
            </div>
        </div>
    );
};

const DoubtConsoleItem: React.FC<{ doubt: Doubt }> = ({ doubt }) => {
    const [replies, setReplies] = useState<DoubtReply[]>([]);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        const unsub = subscribeToReplies(doubt.id, setReplies);
        return () => unsub();
    }, [doubt.id]);

    const handleAdminReply = async () => {
        if (!replyText.trim()) return;
        await submitDoubtReply({
            doubtId: doubt.id,
            authorId: 'admin',
            authorName: 'Instructor',
            text: replyText,
            isVerified: true
        });
        setReplyText('');
    };

    return (
        <div className={`p-6 rounded-[2rem] border transition-all ${doubt.status === 'resolved' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-white/[0.02] border-white/5 shadow-xl'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-white font-black text-xs uppercase italic">{doubt.studentName.charAt(0)}</div>
                    <div>
                        <p className="text-sm font-black text-white italic">{doubt.studentName}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{doubt.lectureTitle} • {doubt.timestamp ? `${Math.floor(doubt.timestamp / 60)}:${(doubt.timestamp % 60).toString().padStart(2, '0')}` : 'General'}</p>
                    </div>
                </div>
                <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${doubt.status === 'resolved' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white animate-pulse'}`}>{doubt.status}</span>
            </div>
            <p className="text-sm text-slate-300 font-medium mb-6 leading-relaxed bg-black/20 p-4 rounded-2xl border border-white/5 italic">"{doubt.text}"</p>
            
            {/* Thread Activity */}
            {replies.length > 0 && (
                <div className="space-y-4 mb-6 ml-4 pl-6 border-l border-white/5">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Community Activity ({replies.length})</p>
                    {replies.map(reply => (
                        <div key={reply.id} className="space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-rose-500 italic">{reply.authorName}</span>
                                    {reply.isVerified && <span className="material-symbols-outlined text-emerald-500 text-[10px]">verified</span>}
                                </div>
                                {!reply.isVerified && (
                                    <button 
                                        onClick={async () => {
                                            const { firestore } = await import('../services/firebase');
                                            await firestore.collection('doubt_replies').doc(reply.id).update({ isVerified: true });
                                        }}
                                        className="text-[8px] font-black text-emerald-500 uppercase tracking-widest hover:underline"
                                    >
                                        Verify Resolution
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-slate-400">{reply.text}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex gap-3">
                <input 
                    type="text" 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Provide official resolution..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-bold focus:border-amber-500/30 outline-none transition-all"
                />
                <button onClick={handleAdminReply} className="px-6 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">Post Reply</button>
            </div>
        </div>
    );
};

const BatchAnalyticsTab: React.FC<{ batchId: string }> = ({ batchId }) => {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getBatchAnalytics(batchId).then(data => {
            setAnalytics(data);
            setLoading(false);
        });
    }, [batchId]);

    if (loading) return <div className="py-20 text-center text-[10px] font-black text-slate-500 uppercase animate-pulse">Syncing Intelligence...</div>;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
            <div className="border-b border-white/5 pb-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic text-blue-500">Batch <span className="text-white">Insights</span></h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Granular student performance and curriculum synchronization metrics.</p>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Enrolments</p>
                    <p className="text-3xl font-black italic">{analytics?.memberCount || 0}</p>
                </div>
                <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg. Progress</p>
                    <p className="text-3xl font-black italic">{analytics?.avgProgress || 0}%</p>
                </div>
                <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Study Time</p>
                    <p className="text-3xl font-black italic">{Math.round((analytics?.totalStudyTime || 0) / 3600)}h</p>
                </div>
                <div className="p-6 rounded-3xl border border-blue-500/20 bg-blue-500/5">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Node Activity</p>
                    <p className="text-3xl font-black italic">Active</p>
                </div>
            </section>

            <div className="space-y-6">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] italic">Student <span className="text-blue-500">Leaderboard</span></h3>
                <div className="grid grid-cols-1 gap-3">
                    {analytics?.members.map((member: any, i: number) => (
                        <div key={member.userId} className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-between group hover:bg-white/[0.03] transition-all">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-white font-black italic text-xs">{i + 1}</div>
                                <div>
                                    <p className="text-sm font-black text-white italic">{member.userName || 'Student'}</p>
                                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{member.userEmail}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Time Spent</p>
                                    <p className="text-xs font-bold text-white italic">{Math.round((member.totalStudyTime || 0) / 60)}m</p>
                                </div>
                                <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${member.progress || 0}%` }} />
                                </div>
                                <p className="text-xs font-black text-blue-500 italic w-8">{member.progress || 0}%</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StaffManagementTab: React.FC<{ batchId: string }> = ({ batchId }) => {
    const [staff, setStaff] = useState<BatchStaff[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState<'manager' | 'tutor'>('tutor');

    useEffect(() => {
        getBatchStaff(batchId).then(setStaff);
    }, [batchId]);

    const handleAddStaff = async () => {
        if (!newEmail.trim()) return;
        // In a real app, you'd find UID by email, here we simulate
        const simulatedStaff: BatchStaff = {
            uid: `staff_${Date.now()}`,
            email: newEmail,
            name: newEmail.split('@')[0],
            role: newRole,
            batchId
        };
        await addBatchStaff(simulatedStaff);
        setStaff([...staff, simulatedStaff]);
        setNewEmail('');
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
            <div className="border-b border-white/5 pb-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic text-emerald-500">Staff <span className="text-white">Operations</span></h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Delegate administrative and pedagogical authority to your team.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] italic">Active <span className="text-emerald-500">Roster</span></h3>
                    <div className="space-y-3">
                        {staff.map(s => (
                            <div key={s.uid} className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black italic text-xs">{s.name.charAt(0)}</div>
                                    <div>
                                        <p className="text-sm font-black text-white italic">{s.name}</p>
                                        <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{s.email}</p>
                                    </div>
                                </div>
                                <span className="text-[9px] font-black text-emerald-500 border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 rounded-full uppercase tracking-widest">{s.role}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6">
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] italic">Onboard <span className="text-emerald-500">Associate</span></h3>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Staff Email</label>
                            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="associate@batchwise.com" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-bold"/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned Role</label>
                            <select value={newRole} onChange={(e: any) => setNewRole(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-bold outline-none">
                                <option value="manager">Batch Manager (Full Access)</option>
                                <option value="tutor">Doubt Tutor (Restricted Access)</option>
                            </select>
                        </div>
                        <button onClick={handleAddStaff} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl transition-all shadow-xl">Authorize Access</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BatchAdminView;
