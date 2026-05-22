import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, CommunityGroup, Batch, Poll, StudyRoom, UserProfile } from '../types';
import { 
    sendChatMessage, 
    subscribeToGroupMessages, 
    subscribeToCommunityGroups, 
    getOrCreateBatchGroup,
    subscribeToPolls,
    voteOnPoll,
    createPoll,
    likeMessage,
    updateUserProfile,
    getUserProfile,
    subscribeToUserProfile
} from '../services/firestoreService';
import { XIcon, PlusIcon, HeartIcon, ChatIcon, ShareIcon } from './Icons';

interface CommunityViewProps {
    currentUser: any;
    userBatches: Batch[];
    onBack: () => void;
}

const CommunityView: React.FC<CommunityViewProps> = ({ currentUser, userBatches, onBack }) => {
    const [groups, setGroups] = useState<CommunityGroup[]>([]);
    const [activeGroupId, setActiveGroupId] = useState<string>('global-nexus');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [polls, setPolls] = useState<Poll[]>([]);
    const [studyRooms, setStudyRooms] = useState<StudyRoom[]>([]);
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isPollModalOpen, setIsPollModalOpen] = useState(false);
    const [pollDraft, setPollDraft] = useState({ question: '', options: ['', ''] });
    const [mobileTab, setMobileTab] = useState<'groups' | 'chat'>('chat');
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [selectedUserUid, setSelectedUserUid] = useState<string | null>(null);
    const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Subscribe to current user profile
    useEffect(() => {
        if (!currentUser?.uid) return;
        return subscribeToUserProfile(currentUser.uid, (profile) => {
            setUserProfile(profile);
        });
    }, [currentUser?.uid]);

    // Initialize profile if not exists
    useEffect(() => {
        const initProfile = async () => {
            if (!currentUser?.uid) return;
            const existing = await getUserProfile(currentUser.uid);
            if (!existing) {
                await updateUserProfile({
                    uid: currentUser.uid,
                    displayName: currentUser.displayName || 'Learner',
                    photoURL: currentUser.photoURL,
                    bio: 'Passionate about academic excellence.',
                    studyStreak: 1,
                    totalHours: 0,
                    badges: ['Seed Member'],
                    points: 100
                });
            }
        };
        initProfile();
    }, [currentUser?.uid]);

    // Handle view user profile
    useEffect(() => {
        if (!selectedUserUid) return;
        getUserProfile(selectedUserUid).then(setSelectedUserProfile);
    }, [selectedUserUid]);

    // Initial groups setup
    useEffect(() => {
        // 1. Subscribe to public groups
        const unsubPublic = subscribeToCommunityGroups((publicGroups) => {
            // Merge with a default global nexus if it doesn't exist
            const nexus = publicGroups.find(g => g.id === 'global-nexus');
            if (!nexus) {
                publicGroups.unshift({
                    id: 'global-nexus',
                    name: 'Global Nexus',
                    description: 'The heartbeat of the Batchwise community.',
                    memberCount: 0,
                    isPrivate: false,
                    createdAt: Date.now()
                });
            }
            setGroups(publicGroups);
        });

        return () => unsubPublic();
    }, []);

    // Subscribe to messages, polls, and study rooms
    useEffect(() => {
        if (!activeGroupId) return;
        const unsubMsgs = subscribeToGroupMessages(activeGroupId, setMessages);
        const unsubPolls = subscribeToPolls(activeGroupId, setPolls);
        return () => {
            unsubMsgs();
            unsubPolls();
        };
    }, [activeGroupId]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim() || !currentUser || isSending) return;

        setIsSending(true);
        try {
            await sendChatMessage(activeGroupId, {
                senderId: currentUser.uid,
                senderName: currentUser.displayName || 'Learner',
                senderPhoto: currentUser.photoURL,
                text: messageText,
                type: 'text'
            });
            setMessageText('');
        } catch (e) {
            console.error(e);
        } finally {
            setIsSending(false);
        }
    };

    const activeGroup = groups.find(g => g.id === activeGroupId) || userBatches.find(b => b.id === activeGroupId);

    return (
        <div className="fixed inset-0 z-[100] bg-[#050505] text-white flex flex-col md:flex-row animate-in fade-in duration-300 pb-[68px] md:pb-0">
            {/* Sidebar: Groups List */}
            <aside className={`w-full md:w-80 border-r border-white/5 bg-black/40 flex flex-col overflow-hidden ${mobileTab === 'groups' ? 'flex' : 'hidden md:flex'}`}>
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-500">
                            <span className="material-symbols-outlined text-base">forum</span>
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-widest italic">Nexus <span className="text-rose-500">Social</span></h2>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                    {/* Global Channels */}
                    <div className="space-y-2">
                        <h3 className="px-3 text-[9px] font-black text-slate-600 uppercase tracking-widest">Global Frequencies</h3>
                        {groups.map(group => (
                            <button 
                                key={group.id}
                                onClick={() => { setActiveGroupId(group.id); setMobileTab('chat'); }}
                                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${activeGroupId === group.id ? 'bg-rose-500/10 border border-rose-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                            >
                                <div className={`size-10 rounded-xl flex items-center justify-center text-sm font-black italic ${activeGroupId === group.id ? 'bg-rose-500 text-white' : 'bg-slate-900 text-slate-500'}`}>
                                    {group.name.charAt(0)}
                                </div>
                                <div className="text-left min-w-0">
                                    <p className={`text-xs font-black truncate italic ${activeGroupId === group.id ? 'text-white' : 'text-slate-400'}`}>{group.name}</p>
                                    <p className="text-[9px] text-slate-600 uppercase tracking-tight truncate">{group.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* My Batch Clusters */}
                    <div className="space-y-2">
                        <h3 className="px-3 text-[9px] font-black text-slate-600 uppercase tracking-widest">Batch Clusters</h3>
                        {userBatches.map(batch => (
                            <button 
                                key={batch.id}
                                onClick={async () => {
                                    await getOrCreateBatchGroup(batch.id, batch.name);
                                    setActiveGroupId(batch.id);
                                    setMobileTab('chat');
                                }}
                                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${activeGroupId === batch.id ? 'bg-amber-500/10 border border-amber-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                            >
                                <div className={`size-10 rounded-xl flex items-center justify-center text-sm font-black italic ${activeGroupId === batch.id ? 'bg-amber-500 text-white' : 'bg-slate-900 text-slate-500'}`}>
                                    {batch.name.charAt(0)}
                                </div>
                                <div className="text-left min-w-0">
                                    <p className={`text-xs font-black truncate italic ${activeGroupId === batch.id ? 'text-white' : 'text-slate-400'}`}>{batch.name}</p>
                                    <p className="text-[9px] text-slate-600 uppercase tracking-tight">Official Batch Group</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-black/60 hidden md:block">
                    <button onClick={onBack} className="w-full py-3 rounded-xl border border-white/5 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest transition-all">Exit Social Nexus</button>
                </div>
            </aside>

            {/* Social Media Feed */}
            <main className={`flex-1 flex flex-col min-w-0 bg-[#0d0f14] ${mobileTab === 'chat' ? 'flex' : 'hidden md:flex'}`}>
                {/* Header */}
                <header className="p-4 md:p-6 border-b border-white/5 bg-black/40 backdrop-blur-3xl flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="size-10 md:size-12 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-xl font-black italic uppercase text-white shadow-2xl">
                            {activeGroup?.name?.charAt(0) || 'N'}
                        </div>
                        <div>
                            <h2 className="text-sm md:text-lg font-black italic uppercase tracking-tighter text-white">
                                {activeGroup?.name || 'Channel'}
                            </h2>
                            <div className="flex items-center gap-2">
                                <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Frequency Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsPollModalOpen(true)}
                            className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2 shadow-2xl shadow-rose-500/5"
                        >
                            <span className="material-symbols-outlined text-sm">ballot</span>
                            Poll Architect
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
                        {/* Post Composer Card */}
                        <div className="p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 shadow-2xl space-y-6">
                            <div className="flex gap-4">
                                <div className="size-12 rounded-2xl bg-slate-900 border border-white/10 overflow-hidden shrink-0">
                                    <img src={currentUser?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=U`} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <textarea 
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        placeholder="What's your academic objective today?"
                                        className="w-full bg-transparent text-sm text-white placeholder:text-slate-700 outline-none resize-none min-h-[60px]"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">image</span> Media
                                    </button>
                                    <button className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">schedule</span> Routine
                                    </button>
                                </div>
                                <button 
                                    onClick={handleSendMessage}
                                    disabled={!messageText.trim() || isSending}
                                    className="px-8 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-rose-900/20 disabled:opacity-30"
                                >
                                    Transmit
                                </button>
                            </div>
                        </div>

                        {/* Professional Polls Section */}
                        {polls.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="h-px flex-1 bg-white/5" />
                                    <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em]">Active Consensus Protocols</span>
                                    <div className="h-px flex-1 bg-white/5" />
                                </div>
                                {polls.map(poll => (
                                    <div key={poll.id} className="p-8 rounded-[2.5rem] bg-white/[0.03] border border-white/10 shadow-2xl relative overflow-hidden group">
                                        {/* Poll UI remains the same but slightly more premium */}
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-rose-500">
                                                    <span className="material-symbols-outlined text-xl">analytics</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-white tracking-tight">{poll.question}</h3>
                                                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-0.5">Sentiment Analysis • Live</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-white italic leading-none">{poll.votedBy.length}</p>
                                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Responses</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {poll.options.map(opt => {
                                                const hasVoted = poll.votedBy.includes(currentUser?.uid);
                                                const totalVotes = poll.options.reduce((a, b) => a + b.votes, 0);
                                                const perc = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                                                return (
                                                    <button 
                                                        key={opt.id}
                                                        disabled={hasVoted}
                                                        onClick={() => voteOnPoll(poll.id, opt.id, currentUser?.uid)}
                                                        className={`w-full p-5 rounded-2xl border transition-all text-left relative overflow-hidden ${hasVoted ? 'bg-black/40 border-white/5' : 'bg-white/5 border-white/10 hover:border-rose-500/30'}`}
                                                    >
                                                        <div className="absolute left-0 top-0 h-full bg-rose-500/[0.08] transition-all duration-1000" style={{ width: hasVoted ? `${perc}%` : '0%' }} />
                                                        <div className="flex justify-between items-center relative z-10">
                                                            <span className={`text-sm font-semibold ${hasVoted ? 'text-white' : 'text-slate-400'}`}>{opt.text}</span>
                                                            {hasVoted && <span className="text-sm font-black text-rose-500">{perc}%</span>}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Main Feed Section */}
                        <div className="space-y-12">
                            {messages.map((msg) => (
                                <div key={msg.id} className="group/post">
                                    <div className="flex gap-5">
                                        {/* Avatar / Profile Trigger */}
                                        <button 
                                            onClick={() => setSelectedUserUid(msg.senderId)}
                                            className="shrink-0 size-14 rounded-3xl bg-slate-900 border border-white/10 overflow-hidden shadow-2xl relative"
                                        >
                                            <img src={msg.senderPhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${msg.senderName}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-rose-500/20 opacity-0 group-hover/post:opacity-100 transition-opacity" />
                                        </button>
                                        
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <button 
                                                        onClick={() => setSelectedUserUid(msg.senderId)}
                                                        className="text-sm font-bold text-white hover:text-rose-500 transition-colors tracking-tight"
                                                    >
                                                        {msg.senderName}
                                                    </button>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className="size-1 rounded-full bg-slate-800" />
                                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Sync</span>
                                                    </div>
                                                </div>
                                                <button className="text-slate-700 hover:text-white transition-colors">
                                                    <span className="material-symbols-outlined text-lg">more_horiz</span>
                                                </button>
                                            </div>

                                            <div className="text-[15px] leading-[1.6] text-slate-300 font-medium">
                                                {msg.text}
                                            </div>

                                            {/* Social Reactions */}
                                            <div className="flex items-center gap-8 pt-2">
                                                <button 
                                                    onClick={() => likeMessage(msg.id, currentUser?.uid)}
                                                    className={`flex items-center gap-2 group/action transition-all ${msg.likes?.includes(currentUser?.uid) ? 'text-rose-500' : 'text-slate-600 hover:text-rose-500'}`}
                                                >
                                                    <div className="size-8 rounded-full bg-white/[0.02] flex items-center justify-center group-hover/action:bg-rose-500/10 transition-colors">
                                                        <HeartIcon size={14} fill={msg.likes?.includes(currentUser?.uid) ? "currentColor" : "none"} />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{msg.likes?.length || 0}</span>
                                                </button>
                                                <button 
                                                    onClick={() => setSelectedUserUid(msg.senderId)}
                                                    className="flex items-center gap-2 group/action text-slate-600 hover:text-blue-500 transition-all"
                                                >
                                                    <div className="size-8 rounded-full bg-white/[0.02] flex items-center justify-center group-hover/action:bg-blue-500/10 transition-colors">
                                                        <ChatIcon size={14} />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Collaborate</span>
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        const shareData = {
                                                            title: 'Batchwise Academic Insight',
                                                            text: msg.text,
                                                            url: window.location.href
                                                        };
                                                        if (navigator.share) {
                                                            navigator.share(shareData).catch(() => {});
                                                        } else {
                                                            navigator.clipboard.writeText(`${msg.text}\n\nShared from Batchwise Nexus`);
                                                            alert('Academic Insight copied to clipboard.');
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 group/action text-slate-600 hover:text-emerald-500 transition-all"
                                                >
                                                    <div className="size-8 rounded-full bg-white/[0.02] flex items-center justify-center group-hover/action:bg-emerald-500/10 transition-colors">
                                                        <ShareIcon size={14} />
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* User Profile Modal Overlay */}
                {selectedUserProfile && (
                    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300" onClick={() => setSelectedUserUid(null)}>
                        <div className="w-full max-w-sm bg-[#0d0f14] rounded-[3rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden relative" onClick={e => e.stopPropagation()}>
                            {/* Profile Header Background */}
                            <div className="h-32 bg-gradient-to-br from-rose-600 to-rose-900 relative">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-30" />
                            </div>
                            
                            <div className="px-8 pb-10 -mt-16 relative">
                                <div className="size-32 rounded-[2.5rem] bg-slate-900 border-[6px] border-[#0d0f14] overflow-hidden shadow-2xl mx-auto mb-6">
                                    <img src={selectedUserProfile.photoURL} className="w-full h-full object-cover" />
                                </div>
                                
                                <div className="text-center space-y-2 mb-8">
                                    <div className="flex items-center justify-center gap-2">
                                        <h3 className="text-2xl font-black italic text-white tracking-tighter uppercase">{selectedUserProfile.displayName}</h3>
                                        {selectedUserProfile.isVerified && <span className="material-symbols-outlined text-rose-500 text-base">verified</span>}
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{selectedUserProfile.bio || 'Academic Strategic Node'}</p>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-8">
                                    <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 text-center">
                                        <p className="text-xl font-black text-rose-500 leading-none mb-1">{selectedUserProfile.studyStreak}</p>
                                        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Streak</p>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 text-center">
                                        <p className="text-xl font-black text-white leading-none mb-1">{selectedUserProfile.points}</p>
                                        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Intelligence</p>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 text-center">
                                        <p className="text-xl font-black text-white leading-none mb-1">{selectedUserProfile.badges.length}</p>
                                        <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Achieved</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setSelectedUserUid(null)}
                                    className="w-full py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all shadow-xl shadow-white/5"
                                >
                                    Transmit Direct Signal
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Poll Architect Modal */}
                {isPollModalOpen && (
                    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in zoom-in duration-500" onClick={() => setIsPollModalOpen(false)}>
                        <div className="w-full max-w-lg bg-[#0d0f14] rounded-[3.5rem] border border-white/10 shadow-[0_50px_100px_rgba(255,0,0,0.1)] overflow-hidden p-10 space-y-8" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-3xl font-black italic text-white tracking-tighter uppercase">Poll <span className="text-rose-500">Architect</span></h3>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1">Design Consensus Protocols</p>
                                </div>
                                <button onClick={() => setIsPollModalOpen(false)} className="size-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Objective Question</label>
                                    <textarea 
                                        value={pollDraft.question}
                                        onChange={e => setPollDraft({...pollDraft, question: e.target.value})}
                                        placeholder="What consensus are you seeking?"
                                        className="w-full p-6 rounded-3xl bg-white/[0.02] border border-white/10 text-white placeholder:text-slate-800 outline-none focus:border-rose-500/50 transition-all resize-none h-32"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Tactical Options</label>
                                    {pollDraft.options.map((opt, i) => (
                                        <div key={i} className="relative group">
                                            <input 
                                                value={opt}
                                                onChange={e => {
                                                    const newOpts = [...pollDraft.options];
                                                    newOpts[i] = e.target.value;
                                                    setPollDraft({...pollDraft, options: newOpts});
                                                }}
                                                placeholder={`Option ${i + 1}`}
                                                className="w-full p-5 rounded-2xl bg-white/[0.02] border border-white/10 text-white placeholder:text-slate-800 outline-none focus:border-rose-500/50 transition-all pr-12"
                                            />
                                            {pollDraft.options.length > 2 && (
                                                <button 
                                                    onClick={() => setPollDraft({...pollDraft, options: pollDraft.options.filter((_, idx) => idx !== i)})}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <span className="material-symbols-outlined text-sm">remove_circle</span>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => setPollDraft({...pollDraft, options: [...pollDraft.options, '']})}
                                        className="w-full py-4 rounded-2xl border-2 border-dashed border-white/5 text-slate-600 hover:border-rose-500/30 hover:text-rose-500 transition-all text-[9px] font-black uppercase tracking-widest"
                                    >
                                        + Append Option
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={async () => {
                                    if (!pollDraft.question.trim() || pollDraft.options.some(o => !o.trim())) return;
                                    await createPoll(activeGroupId, {
                                        question: pollDraft.question,
                                        options: pollDraft.options.map((text, i) => ({ id: `opt_${i}`, text, votes: 0 })),
                                        createdBy: currentUser?.uid || 'unknown'
                                    });
                                    setIsPollModalOpen(false);
                                    setPollDraft({ question: '', options: ['', ''] });
                                }}
                                className="w-full py-5 rounded-3xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-[0.3em] transition-all shadow-2xl shadow-rose-900/40"
                            >
                                Deploy Protocol
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Mobile View Switcher Tabs */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-[#0b0f1a]/95 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around z-[110] safe-area-bottom px-4">
                <button 
                    onClick={() => setMobileTab('groups')}
                    className={`flex flex-col items-center gap-1 transition-all ${mobileTab === 'groups' ? 'text-rose-500' : 'text-slate-500'}`}
                >
                    <span className="material-symbols-outlined text-[20px]">hub</span>
                    <span className="text-[8px] font-black uppercase tracking-widest">Nexus</span>
                </button>
                <button 
                    onClick={() => setMobileTab('chat')}
                    className={`flex flex-col items-center gap-1 transition-all ${mobileTab === 'chat' ? 'text-rose-500' : 'text-slate-500'}`}
                >
                    <div className="relative">
                        <span className="material-symbols-outlined text-[20px]">forum</span>
                        <div className="absolute -top-1 -right-1 size-2 bg-rose-500 rounded-full border border-[#0b0f1a]" />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest">Chat Hub</span>
                </button>
            </nav>
        </div>
    );
};

export default CommunityView;
