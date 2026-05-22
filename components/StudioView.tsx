
import React, { useState, useMemo } from 'react';
import { Lecture, Chapter, Subject } from '../types';
import { BatchWiseLogo } from './Icons';

const formatDuration = (secs?: number): string | null => {
    if (!secs || secs <= 0) return null;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
};

interface StudioViewProps {
    subject: Subject;
    chapter: Chapter;
    lecture: Lecture;
    onLectureNavigate: (chapterId: string, lectureId: string) => void;
    onToggleComplete?: (lectureId: string) => void;
    onBack: () => void;
    onAddLecture?: () => void;
    onYoutubeImport?: () => void;
}

const StudioView: React.FC<StudioViewProps> = ({
    subject,
    chapter,
    lecture,
    onLectureNavigate,
    onToggleComplete,
    onBack,
    onAddLecture,
    onYoutubeImport
}) => {
    const [search, setSearch] = useState('');
    const [isIndexOpen, setIsIndexOpen] = useState(false);

    const filteredLectures = useMemo(() => {
        if (!search.trim()) return chapter.lectures;
        const q = search.toLowerCase();
        return chapter.lectures.filter(l => l.title.toLowerCase().includes(q));
    }, [chapter.lectures, search]);

    const isLocked = useMemo(() => {
        if (!lecture.scheduledDate) return false;
        const now = new Date();
        const unlock = new Date(lecture.scheduledDate);
        return now < unlock;
    }, [lecture.scheduledDate]);

    const getUnlockDateStr = (dateStr?: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#080808] text-slate-100 pb-20 lg:pb-0">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-white/5 bg-black/70 backdrop-blur-md px-4 lg:px-12 py-3 sticky top-0 z-[60]">
                <div className="flex items-center gap-4 lg:gap-8">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white lg:hidden">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="flex items-center gap-3 cursor-pointer group/logo" onClick={onBack}>
                        <div className="w-8 h-8 lg:w-9 lg:h-9 bg-slate-950 border border-white/5 rounded-lg flex items-center justify-center group-hover/logo:scale-110 transition-all duration-500 shadow-2xl">
                            <BatchWiseLogo className="w-5 h-5 lg:w-6 lg:h-6 transition-transform duration-500 group-hover/logo:rotate-[360deg]" />
                        </div>
                        <h2 className="text-slate-100 text-sm lg:text-base font-bold tracking-tight">Studio</h2>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <span className="text-slate-600">|</span>
                        <span className="text-slate-400 text-xs lg:text-sm truncate max-w-[150px]">{subject.name}</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-[var(--primary)] text-xs lg:text-sm font-semibold truncate max-w-[150px]">{chapter.name}</span>
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsIndexOpen(!isIndexOpen)}
                        className="lg:hidden size-9 rounded-lg bg-white/5 flex items-center justify-center text-slate-400"
                    >
                        <span className="material-symbols-outlined text-xl">menu_book</span>
                    </button>
                    <span className="hidden sm:inline text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                        {chapter.lectures.filter(l => l.completed).length} / {chapter.lectures.length} Done
                    </span>
                </div>
            </header>

            {/* Main Content Layout */}
            <main className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                {/* Left Side: Video & Details */}
                <div className="flex-1 flex flex-col p-4 lg:p-10 overflow-y-auto no-scrollbar lg:max-h-[calc(100vh-60px)]">
                    {/* Video Player */}
                    <div className="relative bg-black aspect-video rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden border border-white/5 mb-8">
                        {isLocked ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#0a0a0a]">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20"></div>
                                <div className="relative z-10 flex flex-col items-center">
                                    <div className="size-24 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-8 relative">
                                        <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-2xl animate-pulse"></div>
                                        <span className="material-symbols-outlined text-4xl text-rose-500">lock</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Access <span className="text-rose-500">Restricted</span></h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">This intelligence node is scheduled for global transmission on:</p>
                                    <div className="px-8 py-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
                                        <p className="text-sm font-bold text-white">{getUnlockDateStr(lecture.scheduledDate)}</p>
                                    </div>
                                    <div className="mt-12 flex items-center gap-2 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                        <span className="size-1.5 bg-rose-500 rounded-full animate-ping"></span>
                                        Dripped Content Protocol Active
                                    </div>
                                </div>
                            </div>
                        ) : lecture.embedUrl ? (
                            <iframe
                                src={lecture.embedUrl}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-600 bg-slate-950">
                                <span className="material-symbols-outlined text-6xl opacity-20">videocam_off</span>
                                <a href={lecture.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-black uppercase tracking-widest bg-[var(--primary)] text-white px-6 py-3 rounded-xl hover:scale-105 transition-all">
                                    Open Node Protocol ↗
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Lecture Title + Complete button */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-10 pb-10 border-b border-white/5">
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">Intelligence Node Identification</p>
                            <h1 className="text-2xl lg:text-4xl font-black text-white italic uppercase tracking-tighter leading-none">{lecture.title}</h1>
                        </div>
                        {onToggleComplete && (
                            <button
                                onClick={() => onToggleComplete(lecture.id)}
                                className={`flex-shrink-0 flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                                    lecture.completed
                                        ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                        : 'bg-[var(--primary)] text-white shadow-[0_0_20px_rgba(218,11,11,0.3)]'
                                } hover:scale-105 active:scale-95`}
                            >
                                <span className="material-symbols-outlined text-lg">
                                    {lecture.completed ? 'verified' : 'circle'}
                                </span>
                                {lecture.completed ? 'Validated' : 'Validate Node'}
                            </button>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[var(--primary)] text-xl">database</span>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Technical Documentation</h3>
                        </div>
                        <div className="p-6 md:p-8 bg-white/[0.02] rounded-3xl border border-white/5 leading-relaxed">
                            <p className="text-sm md:text-base text-slate-400 font-medium whitespace-pre-wrap italic opacity-80">
                                {(lecture as any).description || 'No specialized intelligence documentation available for this curriculum node.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mobile Curriculum Overlay */}
                {isIndexOpen && (
                    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl lg:hidden p-6 animate-apple" onClick={() => setIsIndexOpen(false)}>
                        <div className="h-full flex flex-col pt-16" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-3xl font-black italic uppercase tracking-tighter">Node <span className="text-[var(--primary)]">INDEX</span></h3>
                                <button onClick={() => setIsIndexOpen(false)} className="size-12 rounded-full bg-white/5 flex items-center justify-center">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                                {chapter.lectures.map((l, idx) => (
                                    <div 
                                        key={l.id} 
                                        onClick={() => { onLectureNavigate(chapter.id, l.id); setIsIndexOpen(false); }}
                                        className={`p-5 rounded-2xl border transition-all flex items-center gap-4 ${l.id === lecture.id ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 scale-[1.02]' : 'bg-white/[0.02] border-white/5'}`}
                                    >
                                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${l.id === lecture.id ? 'bg-[var(--primary)] text-white' : 'bg-slate-900 text-slate-600'}`}>
                                            <span className="text-[10px] font-black">{idx + 1}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{l.title}</p>
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{formatDuration(l.duration) || '00:00'}</p>
                                        </div>
                                        {l.completed && <span className="material-symbols-outlined text-emerald-500 text-lg">verified</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Right Side: Curriculum Index Sidebar (Desktop) */}
                <aside className="hidden lg:flex w-[400px] bg-[#0a0a0a] border-l border-white/5 flex-col shrink-0 relative z-20 max-h-screen sticky top-[60px] h-[calc(100vh-60px)]">
                    <div className="p-8 border-b border-white/5">
                        <h3 className="text-xl font-black italic uppercase tracking-tight mb-2">Curriculum <span className="text-[var(--primary)]">INDEX</span></h3>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-6">{chapter.name} Unit</p>
                        
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 group focus-within:border-[var(--primary)]/30 transition-all">
                            <span className="material-symbols-outlined text-slate-600 text-lg group-focus-within:text-[var(--primary)]">search</span>
                            <input
                                className="bg-transparent border-none outline-none text-xs w-full placeholder:text-slate-700 font-bold text-white"
                                placeholder="Search curriculum nodes..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                type="text"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-3">
                        {filteredLectures.map((l, lid) => {
                            const isActive = l.id === lecture.id;
                            const idx = chapter.lectures.indexOf(l);
                            return (
                                <div
                                    key={l.id}
                                    onClick={() => onLectureNavigate(chapter.id, l.id)}
                                    className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${
                                        isActive
                                            ? 'bg-[var(--primary)]/10 border-[var(--primary)]/30 shadow-lg shadow-[var(--primary)]/5 scale-[1.02]'
                                            : 'hover:bg-white/[0.03] border-transparent hover:border-white/5'
                                    }`}
                                >
                                    <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                                        isActive
                                            ? 'bg-[var(--primary)] text-white shadow-[0_0_15px_rgba(218,11,11,0.3)]'
                                            : l.completed
                                            ? 'bg-emerald-500/10 text-emerald-500'
                                            : 'bg-slate-900 text-slate-600'
                                    }`}>
                                        {isActive ? (
                                            <span className="material-symbols-outlined text-xl">play_arrow</span>
                                        ) : (
                                            <span className="text-[11px] font-black">{idx + 1}</span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`text-[13px] font-bold truncate ${isActive ? 'text-white' : 'text-slate-400'}`}>{l.title}</h4>
                                            {l.scheduledDate && new Date() < new Date(l.scheduledDate) && (
                                                <span className="material-symbols-outlined text-[14px] text-rose-500">lock</span>
                                            )}
                                        </div>
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">
                                            {l.scheduledDate && new Date() < new Date(l.scheduledDate) 
                                                ? `Unlocks ${new Date(l.scheduledDate).toLocaleDateString()}` 
                                                : formatDuration(l.duration) || '00:00'}
                                        </p>
                                    </div>

                                    {l.completed && !isActive && (
                                        <span className="material-symbols-outlined text-emerald-500 text-lg">verified</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Admin Actions */}
                    {(onAddLecture || onYoutubeImport) && (
                        <div className="p-6 bg-white/[0.01] border-t border-white/5 grid grid-cols-2 gap-4">
                            {onAddLecture && (
                                <button onClick={onAddLecture} className="flex items-center justify-center gap-2 py-3.5 bg-white/5 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all">
                                    <span className="material-symbols-outlined text-base">add</span> Manual
                                </button>
                            )}
                            {onYoutubeImport && (
                                <button onClick={onYoutubeImport} className="flex items-center justify-center gap-2 py-3.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[var(--primary)]/20 transition-all">
                                    <span className="material-symbols-outlined text-base">cloud_download</span> Import
                                </button>
                            )}
                        </div>
                    )}
                </aside>
            </main>
        </div>
    );
};

export default StudioView;
