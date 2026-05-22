
import React from 'react';
import { Batch, Subject, Chapter, Lecture } from '../types';

interface SubjectDetailViewProps {
    batch: Batch;
    subject: Subject;
    onBack: () => void;
    onLectureClick: (chapterId: string, lectureId: string) => void;
    onToggleComplete: (lectureId: string) => void;
}

const SubjectDetailView: React.FC<SubjectDetailViewProps> = ({ batch, subject, onBack, onLectureClick, onToggleComplete }) => {
    // Calculate stats
    let totalLectures = 0;
    let completedLectures = 0;
    
    subject.chapters.forEach(chapter => {
        chapter.lectures.forEach(lecture => {
            totalLectures++;
            if (lecture.completed) completedLectures++;
        });
    });

    const [searchQuery, setSearchQuery] = React.useState('');
    const completionRate = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

    return (
        <main className="flex-1 bg-[#0b0f1a] p-4 lg:p-6 overflow-y-auto no-scrollbar">
            {/* Breadcrumbs - Hidden on small mobile to save space */}
            <nav className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 mb-8">
                <button onClick={onBack} className="hover:text-[var(--primary)] transition-colors">Home</button>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
                <span className="text-slate-300">{subject.name}</span>
            </nav>

            <button onClick={onBack} className="sm:hidden flex items-center gap-2 text-slate-500 mb-6 text-[10px] font-black uppercase tracking-widest">
                <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Subjects
            </button>

            {/* Subject Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter mb-2 leading-none">
                        {subject.name}
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 max-w-xl leading-relaxed font-medium">
                        Strategic curriculum roadmap. Track your progress and master every concept in the physics domain.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-sm group-focus-within:text-[var(--primary)]">search</span>
                        <input 
                            type="text"
                            placeholder="Find session..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-900 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-xs font-bold w-full sm:w-64 focus:ring-1 focus:ring-[var(--primary)]/30 outline-none text-white transition-all shadow-xl"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                <div className="p-4 md:p-5 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col gap-2">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Total Nodes</span>
                    <span className="text-xl md:text-2xl font-black text-white">{totalLectures}</span>
                </div>
                <div className="p-4 md:p-5 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col gap-2">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Validated</span>
                    <span className="text-xl md:text-2xl font-black text-[var(--primary)]">{completedLectures}</span>
                </div>
                <div className="col-span-2 md:col-span-1 p-4 md:p-5 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col gap-2">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Mastery Level</span>
                    <div className="flex items-center gap-4">
                        <span className="text-xl md:text-2xl font-black text-white">{completionRate}%</span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--primary)] transition-all duration-1000" style={{ width: `${completionRate}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-10">
                {subject.chapters.map((chapter, index) => {
                    const filteredLectures = searchQuery.trim() === '' 
                        ? chapter.lectures 
                        : chapter.lectures.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()));
                    
                    if (filteredLectures.length === 0 && searchQuery.trim() !== '') return null;

                    return (
                        <div key={chapter.id} className="flex flex-col gap-4">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl font-black text-slate-800 italic uppercase">{(index + 1).toString().padStart(2, '0')}</span>
                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{chapter.name}</h3>
                                </div>
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">{filteredLectures.length} Sessions</span>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {filteredLectures.map((lecture) => (
                                    <div 
                                        key={lecture.id}
                                        onClick={() => onLectureClick(chapter.id, lecture.id)}
                                        className="group bg-white/[0.01] border border-white/5 p-4 rounded-xl hover:bg-white/[0.03] hover:border-[var(--primary)]/30 transition-all cursor-pointer flex items-center justify-between gap-4"
                                    >
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${lecture.completed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-900 text-slate-600'}`}>
                                                <span className="material-symbols-outlined text-[20px]">{lecture.completed ? 'verified' : 'play_circle'}</span>
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <h4 className="text-[13px] font-bold text-white truncate group-hover:text-[var(--primary)] transition-colors">{lecture.title}</h4>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{lecture.duration ? `${Math.floor(lecture.duration / 60)}:${(lecture.duration % 60).toString().padStart(2, '0')}` : '00:00'}</span>
                                                    {!lecture.completed && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); onToggleComplete(lecture.id); }}
                                                            className="text-[9px] font-black text-[var(--primary)] uppercase tracking-widest hover:brightness-125"
                                                        >
                                                            Validate Node
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {lecture.notesPdfUrl && (
                                                <a 
                                                    href={lecture.notesPdfUrl} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-500/5 flex items-center gap-2 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-900/10 group/btn"
                                                    title="Download Technical Notes"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">description</span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Notes</span>
                                                </a>
                                            )}
                                            <button className="size-8 rounded-lg border border-white/5 flex items-center justify-center text-slate-600 hover:text-[var(--primary)] hover:border-[var(--primary)]/30 transition-all">
                                                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Bottom spacing for mobile nav */}
            <div className="h-24"></div>
        </main>
    );
};

export default SubjectDetailView;
