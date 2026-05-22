import React, { useState, useEffect, useRef } from 'react';
import { searchYouTubeVideos, fetchPlaylistVideos, fetchChannelVideos, YouTubeVideo } from '../services/youtubeService';
import { SearchIcon, XIcon, YoutubeIcon, PlusIcon } from './Icons';

interface SearchYoutubeModalProps {
    onClose: () => void;
    onAdd: (videos: YouTubeVideo[]) => void;
}

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: any;
    }
}

const SearchYoutubeModal: React.FC<SearchYoutubeModalProps> = ({ onClose, onAdd }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<YouTubeVideo[]>([]);
    const [playlistVideos, setPlaylistVideos] = useState<YouTubeVideo[]>([]);
    const [viewMode, setViewMode] = useState<'search' | 'playlist' | 'channel'>('search');
    const [activePlaylistTitle, setActivePlaylistTitle] = useState('');
    const [selectedVideos, setSelectedVideos] = useState<YouTubeVideo[]>([]);
    const [loading, setLoading] = useState(false);
    const [playlistLoading, setPlaylistLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (query.trim().length <= 2) return;

        setLoading(true);
        setError(null);
        setViewMode('search');
        try {
            const fetchedResults = await searchYouTubeVideos(query);
            setResults(fetchedResults);
            if (fetchedResults.length === 0) {
                setError("No results found. Try different keywords.");
            }
        } catch (err: any) {
            console.error(err);
            setError("Search connection unstable. Trying again...");
            try {
                const retryResults = await searchYouTubeVideos(query);
                setResults(retryResults);
                setError(null);
            } catch (retryErr) {
                setError("Services busy. Try pasting a link directly.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPlaylist = async (playlist: YouTubeVideo) => {
        if (!playlist.playlistId) return;
        setPlaylistLoading(true);
        setActivePlaylistTitle(playlist.title);
        setViewMode('playlist');
        try {
            const videos = await fetchPlaylistVideos(playlist.playlistId);
            setPlaylistVideos(videos);
        } catch (err) {
            console.error(err);
            setError("Failed to load playlist videos. Piped service might be down.");
        } finally {
            setPlaylistLoading(false);
        }
    };

    const handleOpenChannel = async (channel: YouTubeVideo) => {
        if (!channel.channelId) return;
        setPlaylistLoading(true);
        setActivePlaylistTitle(channel.title); // We can reuse the title state
        setViewMode('channel');
        try {
            const videos = await fetchChannelVideos(channel.channelId);
            setPlaylistVideos(videos);
        } catch (err) {
            console.error(err);
            setError("Failed to load channel videos. The channel might not have public streams or Piped is down.");
        } finally {
            setPlaylistLoading(false);
        }
    };

    const toggleSelection = (video: YouTubeVideo) => {
        setSelectedVideos(prev =>
            prev.find(v => v.videoId === video.videoId)
                ? prev.filter(v => v.videoId !== video.videoId)
                : [...prev, video]
        );
    };

    const isSelected = (videoId: string) => selectedVideos.some(v => v.videoId === videoId);

    const currentDisplayResults = (viewMode === 'playlist' || viewMode === 'channel') ? playlistVideos : results;

    const handleSelectAll = () => {
        if (selectedVideos.length === currentDisplayResults.length) {
            setSelectedVideos([]);
        } else {
            setSelectedVideos(currentDisplayResults.filter(v => v.type !== 'playlist'));
        }
    };

    const [showQueue, setShowQueue] = useState(false);

    return (
        <div className="fixed inset-0 z-[300] bg-[#0A0A0A] animate-apple" onClick={onClose}>
            <div className="w-full h-full flex flex-col relative overflow-hidden bg-[#0A0A0A]" onClick={e => e.stopPropagation()}>
                {/* Visual Header */}
                <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 bg-black/40 border-b border-white/[0.05] backdrop-blur-2xl shrink-0">
                    <div className="flex items-center gap-3 sm:gap-5">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600/10 rounded-xl flex items-center justify-center border border-red-600/20">
                            <YoutubeIcon className="text-red-600 w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 sm:gap-3 mb-0.5">
                                <h3 className="text-xs sm:text-base font-bold tracking-tight text-white uppercase tracking-widest">Studio <span className="text-white/40 font-medium">Lab</span></h3>
                                <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.02] text-emerald-500/80">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-widest">Live</span>
                                </div>
                            </div>
                            <p className="text-[7px] sm:text-[9px] uppercase tracking-[0.2em] font-bold text-white/20">Acquisition Engine</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowQueue(!showQueue)}
                            className="lg:hidden w-10 h-10 bg-white/[0.03] rounded-xl flex items-center justify-center border border-white/[0.05] text-white/40 relative"
                        >
                            <PlusIcon className={`w-4 h-4 transition-transform ${showQueue ? 'rotate-45' : ''}`} />
                            {selectedVideos.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--primary)] text-white text-[8px] font-black rounded-full flex items-center justify-center animate-apple">
                                    {selectedVideos.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-3 sm:px-5 py-2 sm:py-2.5 bg-white/[0.03] hover:bg-white/[0.08] rounded-xl border border-white/[0.05] text-white/60 hover:text-white font-bold text-[9px] sm:text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 group"
                        >
                            <span className="hidden sm:inline">Exit Studio</span>
                            <XIcon className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row relative">
                    {/* Main Content Area */}
                    <div className="flex-1 p-4 sm:p-8 flex flex-col gap-6 sm:gap-8 overflow-hidden">
                        {viewMode === 'search' ? (
                            <form onSubmit={handleSearch} className="relative group w-full lg:max-w-3xl">
                                <SearchIcon className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-[var(--primary)] transition-colors" />
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Search global indices..."
                                    className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl pl-11 sm:pl-14 pr-24 sm:pr-32 py-3.5 sm:py-4 text-xs sm:text-sm font-medium text-white placeholder:text-white/10 focus:outline-none focus:border-[var(--primary)]/30 transition-all"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 bottom-1.5 sm:bottom-2 px-4 sm:px-6 bg-white/[0.05] hover:bg-white/[0.1] text-white/80 rounded-xl text-[8px] sm:text-[9px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                    {loading ? '...' : 'Scan'}
                                </button>
                            </form>
                        ) : (
                            <div className="flex items-center gap-4 sm:gap-5 p-3 sm:p-4 bg-white/[0.02] rounded-2xl border border-white/[0.05] w-full lg:max-w-3xl">
                                <button
                                    onClick={() => setViewMode('search')}
                                    className="w-9 h-9 sm:w-10 sm:h-10 bg-white/[0.05] text-white/40 hover:text-white rounded-xl flex items-center justify-center transition-all group shrink-0"
                                >
                                    <SearchIcon className="w-3.5 h-3.5 sm:w-4 h-4 group-hover:scale-110 transition-transform" />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--primary)] opacity-60 mb-0.5">
                                        {viewMode === 'channel' ? 'Channel Feed' : 'Stream'}
                                    </p>
                                    <h4 className="text-xs sm:text-sm font-bold truncate text-white/80">{activePlaylistTitle}</h4>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto pr-2 sm:pr-4 space-y-4 custom-scrollbar">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">
                                    {viewMode === 'search' ? 'Discovery' : 'Manifest'}
                                </h4>
                                {currentDisplayResults.length > 0 && (
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-[8px] sm:text-[9px] font-bold text-[var(--primary)]/60 hover:text-[var(--primary)] uppercase tracking-widest transition-colors flex items-center gap-2"
                                    >
                                        <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border border-[var(--primary)]/30 ${selectedVideos.length === currentDisplayResults.length ? 'bg-[var(--primary)]/60' : ''}`} />
                                        {selectedVideos.length === currentDisplayResults.length ? 'Deselect' : 'Select All'}
                                    </button>
                                )}
                            </div>

                            {(loading || playlistLoading) && currentDisplayResults.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-24 sm:py-32 gap-4">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white/5 border-t-[var(--primary)]/40 rounded-full animate-spin"></div>
                                    <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] font-bold text-white/10">Establishing Uplink...</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-2">
                                {currentDisplayResults.map((video) => (
                                    <div
                                        key={video.videoId || video.playlistId}
                                        className={`group flex items-center gap-3 sm:gap-6 p-2.5 sm:p-3 rounded-2xl border transition-all duration-300 ${isSelected(video.videoId) ? 'bg-[var(--primary)]/5 border-[var(--primary)]/20' : 'bg-white/[0.01] border-white/[0.03] hover:bg-white/[0.03] hover:border-white/[0.08]'}`}
                                    >
                                        <div className="flex-shrink-0">
                                            {video.type === 'playlist' ? (
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-red-600/5 rounded-lg border border-red-600/10">
                                                    <YoutubeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-600/40" />
                                                </div>
                                            ) : video.type === 'channel' ? (
                                                <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-[var(--primary)]/5 rounded-lg border border-[var(--primary)]/10">
                                                    <SearchIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--primary)]/40" />
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => toggleSelection(video)}
                                                    className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-md border transition-all flex items-center justify-center ${isSelected(video.videoId) ? 'bg-[var(--primary)] border-[var(--primary)] shadow-lg shadow-[var(--primary)]/20' : 'border-white/10 bg-transparent hover:border-white/20'}`}
                                                >
                                                    {isSelected(video.videoId) && <PlusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />}
                                                </button>
                                            )}
                                        </div>
                                        <div
                                            className="w-24 h-14 sm:w-32 sm:h-18 rounded-xl overflow-hidden bg-black flex-shrink-0 shadow-xl relative cursor-pointer"
                                            onClick={() => video.type === 'playlist' ? handleOpenPlaylist(video) : video.type === 'channel' ? handleOpenChannel(video) : toggleSelection(video)}
                                        >
                                            <img src={video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`} alt="" className={`w-full h-full object-cover opacity-40 group-hover:opacity-80 transition-opacity ${video.type === 'channel' ? 'rounded-full scale-75' : ''}`} />
                                            {video.type === 'playlist' && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                                    <span className="text-[6px] sm:text-[7px] font-bold uppercase text-white/40 tracking-[0.2em]">Playlist</span>
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            className="flex-1 min-w-0 py-0.5 cursor-pointer"
                                            onClick={() => video.type === 'playlist' ? handleOpenPlaylist(video) : video.type === 'channel' ? handleOpenChannel(video) : toggleSelection(video)}
                                        >
                                            <h4 className="text-[10px] sm:text-xs font-bold text-white/70 group-hover:text-white transition-colors truncate mb-1 sm:mb-1.5">{video.title}</h4>
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <p className="text-[7px] sm:text-[8px] font-mono text-white/10 uppercase tracking-widest truncate">
                                                    {video.videoId || video.playlistId || video.channelId}
                                                </p>
                                                {(video.type === 'playlist' || video.type === 'channel') && (
                                                    <span className="text-[6px] sm:text-[7px] font-bold text-[var(--primary)]/40 uppercase tracking-widest">
                                                        {video.type === 'playlist' ? 'Analyze' : 'View Feed'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Acquisition Sidepanel (Right Column) - Mobile Drawer Mechanism */}
                    <div className={`
                        fixed inset-x-0 bottom-0 z-[350] lg:relative lg:inset-auto lg:z-auto
                        w-full lg:w-[320px] xl:w-[380px] bg-[#0F0F0F] lg:bg-black/40 border-t lg:border-t-0 lg:border-l border-white/[0.05]
                        flex flex-col gap-6 sm:gap-8 p-6 sm:p-8 transition-transform duration-500 ease-apple
                        ${showQueue ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
                        max-h-[85vh] lg:max-h-full overflow-hidden shadow-2xl lg:shadow-none rounded-t-[32px] lg:rounded-none
                    `}>
                        {/* Mobile Handle */}
                        <div
                            className="lg:hidden w-12 h-1 bg-white/10 rounded-full mx-auto mb-2 shrink-0"
                            onClick={() => setShowQueue(false)}
                        />

                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <h4 className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Queue</h4>
                                <p className="text-[6px] sm:text-[7px] font-bold text-white/10 uppercase tracking-widest italic">Staged units</p>
                            </div>
                            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/[0.03] rounded-xl flex items-center justify-center border border-white/[0.05] text-white/40 text-[9px] sm:text-[10px] font-bold">
                                {selectedVideos.length}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col gap-4 sm:gap-6 overflow-hidden">
                            {selectedVideos.length > 0 ? (
                                <div className="flex-1 flex flex-col bg-white/[0.01] rounded-2xl sm:rounded-3xl border border-white/[0.03] p-4 sm:p-5 shadow-2xl overflow-hidden">
                                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar mb-4 sm:mb-6">
                                        {selectedVideos.map(v => (
                                            <div key={v.videoId} className="flex items-center gap-2 sm:gap-3 bg-white/[0.02] p-2 sm:p-3 rounded-xl border border-white/[0.03] group transition-all hover:bg-white/[0.04]">
                                                <div className="w-1 h-1 bg-[var(--primary)]/40 rounded-full" />
                                                <p className="text-[9px] sm:text-[10px] font-bold truncate flex-1 text-white/40 group-hover:text-white/80">{v.title}</p>
                                                <button onClick={() => toggleSelection(v)} className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-white/10 hover:text-red-500 transition-colors">
                                                    <XIcon className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => {
                                            onAdd(selectedVideos);
                                            setShowQueue(false);
                                        }}
                                        className="w-full py-3.5 sm:py-4 bg-[var(--primary)]/80 hover:bg-[var(--primary)] text-white rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 group mt-auto"
                                    >
                                        Integrate {selectedVideos.length} Units
                                        <PlusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-40 group-hover:rotate-90 transition-transform" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-10 bg-white/[0.01] rounded-2xl sm:rounded-3xl border border-dashed border-white/[0.05] text-center gap-3 sm:gap-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 border border-dashed border-white/5 rounded-full flex items-center justify-center opacity-20">
                                        <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-dashed border-white/10 rounded-full animate-[spin_12s_linear_infinite]" />
                                    </div>
                                    <div>
                                        <p className="text-white/20 text-[10px] sm:text-xs font-bold tracking-tight mb-1">Queue Empty</p>
                                        <p className="text-[7px] sm:text-[8px] font-bold text-white/10 uppercase tracking-widest leading-relaxed">
                                            Stage units for sync
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Overlay for Queue Drawer */}
                {showQueue && (
                    <div
                        className="lg:hidden fixed inset-0 z-[340] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setShowQueue(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default SearchYoutubeModal;
