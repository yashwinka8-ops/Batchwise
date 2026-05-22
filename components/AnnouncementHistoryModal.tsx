import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, TrashIcon } from './Icons';
import { getAnnouncementHistory, deleteAnnouncementHistoryItem } from '../services/firestoreService';

interface AnnouncementHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentAnnouncement: string;
    currentTimestamp?: string;
    currentTitle?: string;
    isAdmin?: boolean;
}

const AnnouncementHistoryModal: React.FC<AnnouncementHistoryModalProps> = ({
    isOpen,
    onClose,
    currentAnnouncement,
    currentTimestamp,
    currentTitle,
    isAdmin
}) => {
    const [history, setHistory] = useState<Array<{ text: string; createdAt: string; id: string; title?: string }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await getAnnouncementHistory();
            setHistory(data);
        } catch (error) {
            console.error('Failed to load announcement history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteHistoryItem = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm("Delete this announcement from history?")) return;

        try {
            await deleteAnnouncementHistoryItem(id);
            // Update local state to reflect deletion
            setHistory(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error("Failed to delete announcement history item:", error);
            alert("Failed to delete history item.");
        }
    };

    const formatDate = (timestamp: string): string => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (e) {
            return 'Unknown Date';
        }
    };

    const formatTime = (timestamp: string): string => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            return '';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-[#0b0f1a] w-full max-w-2xl max-h-[90vh] rounded-[40px] border border-white/10 shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-[#161e2d]/50">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-xl">
                                <span className="text-2xl">📢</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Announcements</h2>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Updates & News</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {/* Current Announcement */}
                    <div className="mb-8 p-8 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 rounded-[2.5rem] animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </div>

                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="px-3 py-1 bg-blue-600 rounded-full shadow-lg shadow-blue-600/20">
                                <span className="text-white text-[10px] font-black uppercase tracking-widest">Latest Update</span>
                            </div>
                            {currentTimestamp && (
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wide">
                                    <span>{formatDate(currentTimestamp)}</span>
                                    <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                    <span>{formatTime(currentTimestamp)}</span>
                                </div>
                            )}
                        </div>

                        <h3 className="text-2xl font-black text-white mb-4 leading-tight tracking-tight relative z-10">{currentTitle || 'Important Notice'}</h3>

                        <div className="text-slate-300 text-sm font-medium leading-relaxed whitespace-pre-wrap relative z-10 border-t border-white/5 pt-4">
                            {currentAnnouncement}
                        </div>
                    </div>

                    {/* Past Announcements */}
                    {history.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">History Log</h3>
                            </div>
                            <div className="space-y-4">
                                {history.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="p-6 bg-[#161e2d] border border-white/5 rounded-3xl hover:border-blue-500/30 transition-all group hover:bg-[#1c2638]"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="text-white font-bold text-base group-hover:text-blue-400 transition-colors line-clamp-1">{item.title || 'Announcement'}</h4>
                                            <div className="flex items-center gap-2">
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">
                                                    {formatDate(item.createdAt)}
                                                </div>
                                                {isAdmin && (
                                                    <button
                                                        onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                                                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        title="Delete from history"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                                            {item.text}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No History */}
                    {!loading && history.length === 0 && (
                        <div className="text-center py-12 animate-in fade-in duration-500 delay-200">
                            <div className="text-6xl mb-4 opacity-30 grayscale">📜</div>
                            <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Archive Empty</p>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="text-center py-12">
                            <div className="inline-block w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnnouncementHistoryModal;
