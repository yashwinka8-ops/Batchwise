import React, { useState, useEffect } from 'react';
import { Batch, Subject, Chapter } from '../types';
import { fetchPlaylistVideos, searchYouTubeVideos, YouTubeVideo } from '../services/youtubeService';

interface YoutubeImportViewProps {
    batches: Batch[];
    initialBatchId?: string;
    initialSubjectId?: string;
    initialChapterId?: string;
    onImport: (batchId: string, subjectId: string, chapterId: string, videos: any[]) => void;
    onBack: () => void;
}

const YoutubeImportView: React.FC<YoutubeImportViewProps> = ({ batches, initialBatchId, initialSubjectId, initialChapterId, onImport, onBack }) => {
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [selectedBatchId, setSelectedBatchId] = useState(initialBatchId || '');
    const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId || '');
    const [selectedChapterId, setSelectedChapterId] = useState(initialChapterId || '');
    const [activeTab, setActiveTab] = useState<'playlist' | 'search'>('playlist');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState<YouTubeVideo[]>([]);
    const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (initialBatchId) setSelectedBatchId(initialBatchId);
        if (initialSubjectId) setSelectedSubjectId(initialSubjectId);
        if (initialChapterId) setSelectedChapterId(initialChapterId);
    }, [initialBatchId, initialSubjectId, initialChapterId]);

    const handleFetch = async () => {
        if (!playlistUrl) return;
        setLoading(true);
        setError('');
        setResults([]);
        setSelectedVideoIds(new Set());
        
        try {
            if (activeTab === 'playlist') {
                let playlistId = null;
                const listMatch = playlistUrl.match(/[?&]list=([^#\&\?]+)/);
                if (listMatch) {
                    playlistId = listMatch[1];
                } else if (!playlistUrl.includes('http')) {
                    playlistId = playlistUrl;
                }

                if (!playlistId) {
                    throw new Error("Invalid Playlist URL. Could not find 'list' parameter.");
                }

                const fetchedVideos = await fetchPlaylistVideos(playlistId);
                setResults(fetchedVideos);
                setSelectedVideoIds(new Set(fetchedVideos.map(v => v.videoId)));
            } else {
                const fetchedVideos = await searchYouTubeVideos(playlistUrl);
                setResults(fetchedVideos);
                // For search, maybe don't auto-select everything? Let's leave it unchecked or select only top 1?
                // Let's leave selection empty for search so the user actually picks what they want.
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch results. Check your connection or API key limit.');
        } finally {
            setLoading(false);
        }
    };

    const handleImportAction = () => {
        const selectedVideos = results.filter(v => selectedVideoIds.has(v.videoId)).map(v => ({
            title: v.title,
            youtubeUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
            duration: v.duration,
            description: v.description
        }));
        
        const chapterId = isFlatBatch ? '_vchap' : isFlatSubject ? '_vchap' : selectedChapterId;
        const subjectId = isFlatBatch ? '_vsub' : selectedSubjectId;
        onImport(selectedBatchId, subjectId, chapterId, selectedVideos);
    };

    const selectedBatch = batches.find(b => b.id === selectedBatchId);
    const isFlatBatch = selectedBatch?.lectures !== undefined;
    const selectedSubject = selectedBatch?.subjects.find(s => s.id === selectedSubjectId);
    const isFlatSubject = selectedSubject?.lectures !== undefined;

    return (
        <main className="flex-1 flex flex-col h-full bg-black">
            {/* Header */}
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/50 backdrop-blur-md sticky top-0 z-[40]">
                <div className="flex items-center gap-2">
                    <span onClick={onBack} className="text-slate-500 text-sm cursor-pointer hover:text-white transition-colors">Import Systems</span>
                    <span className="material-symbols-outlined text-slate-700 text-sm">chevron_right</span>
                    <span className="text-slate-100 text-sm font-medium">YouTube Playlist Import</span>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="mx-auto space-y-6 animate-apple">
                    {/* Compact Title Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Youtube <span className="text-[var(--primary)]">Sync</span></h2>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Bulk synchronize lectures from playlists or search</p>
                        </div>
                    </div>

                    {/* Input Card */}
                    <div className="flex gap-1 border-b border-white/5 mb-6">
                        <button 
                            onClick={() => setActiveTab('playlist')}
                            className={`px-6 py-3 text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${activeTab === 'playlist' ? 'text-[var(--primary)] border-[var(--primary)]' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                        >
                            <span className="material-symbols-outlined text-lg">playlist_play</span>
                            Playlist Import
                        </button>
                        <button 
                            onClick={() => setActiveTab('search')}
                            className={`px-6 py-3 text-sm font-bold transition-all flex items-center gap-2 border-b-2 ${activeTab === 'search' ? 'text-[var(--primary)] border-[var(--primary)]' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                        >
                            <span className="material-symbols-outlined text-lg">search</span>
                            Search YouTube
                        </button>
                    </div>
                    
                    <div className="bg-slate-900/40 border border-white/5 rounded-xl p-4 space-y-4">
                        <div className="flex flex-col xl:flex-row gap-4">
                            {/* Input Area */}
                            <div className="flex-1 space-y-4">
                                <div className="flex flex-col md:flex-row gap-3">
                                    <div className="relative flex-1 group">
                                        <input 
                                            value={playlistUrl}
                                            onChange={(e) => setPlaylistUrl(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleFetch();
                                            }}
                                            className="w-full bg-black/50 border border-white/10 focus:border-[var(--primary)] focus:ring-0 text-white rounded-lg px-4 py-2.5 pl-10 text-sm transition-all" 
                                            placeholder={activeTab === 'playlist' ? "Paste Playlist URL or ID..." : "Search YouTube..."} 
                                            type="text" 
                                        />
                                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-600 text-xl group-focus-within:text-[var(--primary)] transition-colors">search</span>
                                    </div>
                                    <button onClick={handleFetch} disabled={loading} className="h-10 px-6 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-[var(--primary)]/10 disabled:opacity-50 whitespace-nowrap">
                                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-lg">manage_search</span>}
                                        {loading ? 'Fetching...' : 'Fetch'}
                                    </button>
                                </div>

                                {/* Dropdowns Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="relative">
                                        <select 
                                            value={selectedBatchId}
                                            onChange={(e) => {
                                                setSelectedBatchId(e.target.value);
                                                setSelectedSubjectId('');
                                                setSelectedChapterId('');
                                            }}
                                            className="w-full bg-black/50 border border-white/10 text-white text-xs font-medium rounded-lg px-3 py-2.5 focus:border-[var(--primary)] focus:ring-0 appearance-none pr-8 cursor-pointer"
                                        >
                                            <option value="">Select Batch</option>
                                            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-2 top-2.5 text-slate-600 pointer-events-none text-lg">expand_more</span>
                                    </div>
                                    {!isFlatBatch && (
                                    <div className="relative">
                                        <select 
                                            disabled={!selectedBatchId}
                                            value={selectedSubjectId}
                                            onChange={(e) => {
                                                setSelectedSubjectId(e.target.value);
                                                setSelectedChapterId('');
                                            }}
                                            className="w-full bg-black/50 border border-white/10 text-white text-xs font-medium rounded-lg px-3 py-2.5 focus:border-[var(--primary)] focus:ring-0 appearance-none pr-8 disabled:opacity-30 cursor-pointer"
                                        >
                                            <option value="">Select Subject</option>
                                            {selectedBatch?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-2 top-2.5 text-slate-600 pointer-events-none text-lg">expand_more</span>
                                    </div>
                                    )}
                                    {!isFlatBatch && selectedSubjectId && !isFlatSubject && (
                                    <div className="relative">
                                        <select 
                                            disabled={!selectedSubjectId}
                                            value={selectedChapterId}
                                            onChange={(e) => setSelectedChapterId(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 text-white text-xs font-medium rounded-lg px-3 py-2.5 focus:border-[var(--primary)] focus:ring-0 appearance-none pr-8 disabled:opacity-30 cursor-pointer"
                                        >
                                            <option value="">Select Chapter</option>
                                            {selectedSubject?.chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-2 top-2.5 text-slate-600 pointer-events-none text-lg">expand_more</span>
                                    </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">Results Preview <span className="text-slate-500 font-normal text-sm ml-2">({results.length} matches found)</span></h3>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">Select All</span>
                                    <input 
                                        checked={results.length > 0 && selectedVideoIds.size === results.length}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedVideoIds(new Set(results.map(v => v.videoId)));
                                            else setSelectedVideoIds(new Set());
                                        }}
                                        className="rounded border-slate-800 bg-black text-[var(--primary)] focus:ring-[var(--primary)] focus:ring-offset-black transition-all cursor-pointer" type="checkbox" />
                                </div>
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm font-medium border border-red-500/20 bg-red-500/5 p-4 rounded-xl">{error}</p>}

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 pb-20">
                            {results.map((res, index) => {
                                const isSelected = selectedVideoIds.has(res.videoId);
                                return (
                                    <div 
                                        key={res.videoId} 
                                        className={`group relative bg-slate-900/20 hover:bg-slate-900/40 border transition-all cursor-pointer overflow-hidden rounded-xl flex flex-col ${isSelected ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-white/5'}`}
                                        onClick={() => {
                                            const next = new Set(selectedVideoIds);
                                            if (isSelected) next.delete(res.videoId);
                                            else next.add(res.videoId);
                                            setSelectedVideoIds(next);
                                        }}
                                    >
                                        <div className="relative aspect-video flex-shrink-0 overflow-hidden bg-black">
                                            <img className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" src={res.thumbnail || `https://img.youtube.com/vi/${res.videoId}/mqdefault.jpg`} alt={res.title} />
                                            {res.duration && (
                                                <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-[10px] text-white font-bold px-1.5 py-0.5 rounded border border-white/10">
                                                    {res.duration}
                                                </div>
                                            )}
                                            <div className="absolute top-2 right-2">
                                                <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[var(--primary)] border-[var(--primary)]' : 'bg-black/40 border-white/20'}`}>
                                                    {isSelected && <span className="material-symbols-outlined text-white text-sm font-bold">check</span>}
                                                </div>
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="p-3 flex flex-col flex-1 gap-2">
                                            <h4 className="text-slate-100 font-bold text-[11px] leading-relaxed line-clamp-2 min-h-[2.4em] group-hover:text-[var(--primary)] transition-colors">{res.title}</h4>
                                            <div className="mt-auto pt-2 border-t border-white/5 flex items-center justify-between">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">#{index + 1} session</span>
                                                <div className="flex gap-1.5">
                                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                                    <span className="text-[8px] font-black text-slate-500 uppercase">HD</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Progress & Action */}
                    <div className="sticky bottom-0 bg-black/95 backdrop-blur-md pt-6 pb-4 border-t border-white/5 -mb-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex-1 w-full md:max-w-md">
                                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider mb-2">
                                    <span className="text-slate-500">Import Progress</span>
                                    <span className="text-[var(--primary)]">Ready to Import</span>
                                </div>
                                <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-[var(--primary)] w-0 rounded-full transition-all duration-500"></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={onBack} className="px-6 py-3 border border-slate-700 text-slate-300 hover:text-white hover:bg-white/5 font-semibold rounded-lg transition-all">
                                    Cancel
                                </button>
                                <button 
                                    disabled={selectedVideoIds.size === 0 || !selectedBatchId || (!isFlatBatch && !selectedSubjectId) || (!isFlatBatch && !isFlatSubject && selectedSubjectId && !selectedChapterId)}
                                    onClick={handleImportAction}
                                    className="px-10 py-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-bold rounded-lg shadow-lg shadow-[var(--primary)]/20 flex items-center gap-2 transition-all disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined">download</span>
                                    Import {selectedVideoIds.size} Lectures
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default YoutubeImportView;
