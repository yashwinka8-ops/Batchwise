
import React, { useState } from 'react';

interface NotificationItem {
    id: string;
    title?: string;
    text?: string;
    body?: string;
    createdAt?: string;
    sentAt?: string;
    category?: string;
}

interface NotificationsViewProps {
    notifications: NotificationItem[];
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ notifications }) => {
    const [activeTab, setActiveTab] = useState<'announcements' | 'briefing' | 'activity'>('announcements');

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-background-dark animate-in fade-in slide-in-from-bottom-5 duration-700 h-full overflow-y-auto no-scrollbar">
            {/* Top Bar */}
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/50 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                    <span className="hover:text-primary transition-colors cursor-pointer">Protocol</span>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-slate-100 italic">Notification Center</span>
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-2 text-slate-400 hover:text-white transition-colors bg-white/5 border border-white/5 rounded-xl group">
                        <span className="material-symbols-outlined text-lg group-active:rotate-180 transition-transform duration-500">sync</span>
                    </button>
                    <div className="h-6 w-[1px] bg-white/5 mx-2"></div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Live Sync Active</span>
                    </div>
                </div>
            </header>

            {/* Notification Container */}
            <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
                <div className="flex items-center justify-between mb-12">
                    <h2 className="text-3xl font-bold uppercase tracking-tight text-white mb-2">Notification <span className="text-primary">Center</span></h2>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 mb-12 gap-12">
                    {['announcements', 'briefing', 'activity'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-4 border-b-2 transition-all text-xs font-black uppercase tracking-[0.3em] ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Notification List */}
                <div className="space-y-6 mb-20">
                    {notifications.length > 0 ? (
                        notifications.map((n) => (
                            <div key={n.id} className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 p-6 rounded-3xl transition-all group flex gap-6 hover:border-primary/20 shadow-2xl">
                                <div className="flex-shrink-0">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary transition-all duration-500 group-hover:text-white">
                                        <span className="material-symbols-outlined text-2xl font-black">campaign</span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-4">
                                            <h3 className="font-bold text-lg text-slate-100 tracking-tight">{n.title || n.text || 'System Update'}</h3>
                                            <span className="bg-primary text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-primary/20">Active</span>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                                            {n.createdAt || n.sentAt ? new Date(n.createdAt || n.sentAt || '').toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm leading-relaxed mb-4 font-medium">{n.body || n.text || 'Notification details received.'}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center text-slate-600 border border-dashed border-white/5 rounded-3xl">
                            <span className="material-symbols-outlined text-5xl mb-4">notifications_off</span>
                            <p className="text-xs font-black uppercase tracking-[0.2em]">Zero briefings detected in neural frequency.</p>
                        </div>
                    )}
                </div>

                {/* Archives */}
                <div className="mt-12 flex justify-center pb-20">
                    <button className="flex items-center gap-3 px-8 py-3 bg-white/5 border border-white/5 text-slate-500 hover:text-white hover:border-primary/30 rounded-2xl transition-all text-[10px] font-black uppercase tracking-[0.3em] group active:scale-95">
                        Access Archives
                        <span className="material-symbols-outlined text-sm group-hover:translate-y-1 transition-transform">expand_more</span>
                    </button>
                </div>
            </div>
        </main>
    );
};

export default NotificationsView;
