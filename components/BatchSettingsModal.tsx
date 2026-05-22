
import React, { useState, useEffect } from 'react';
import { Batch, BatchSettings, Slot, BatchTheme } from '../types';
import { PlusIcon, TrashIcon, SparklesIcon } from './Icons';

interface BatchSettingsModalProps {
    batch: Batch;
    onClose: () => void;
    onSave: (batchId: string, settings: BatchSettings, theme?: BatchTheme, inviteCode?: string) => void;
}

const THEME_PRESETS: BatchTheme[] = [
    {
        accentColor: '#007AFF', // Azure
        gradient: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
        coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop'
    },
    {
        accentColor: '#e21732ff', // Rose
        gradient: 'linear-gradient(135deg, #db3c11ff 0%, #AF52DE 100%)',
        coverImage: 'https://w0.peakpx.com/wallpaper/752/459/HD-wallpaper-welcome-iit-delhi-iit-delhi.jpg?q=80&w=1600&auto=format&fit=crop'
    },
    {
        accentColor: '#2d90bdff', // Emerald
        gradient: 'linear-gradient(135deg, #348cc7ff 0%, #00C7BE 100%)',
        coverImage: 'https://w0.peakpx.com/wallpaper/769/176/HD-wallpaper-iit-bombay%E2%9D%A4%EF%B8%8F%E2%9C%A8-iit-delhi.jpg?q=80&w=1600&auto=format&fit=crop'
    },
    {
        accentColor: '#FF9500', // Amber
        gradient: 'linear-gradient(135deg, #FF9500 0%, #FF2D55 100%)',
        coverImage: 'https://i.redd.it/qh2zkt1uy3va1.jpg?q=80&w=1600&auto=format&fit=crop'
    },
    {
        accentColor: '#5856D6', // Indigo
        gradient: 'linear-gradient(135deg, #5856D6 0%, #007AFF 100%)',
        coverImage: 'https://images.unsplash.com/photo-1618004912476-29818d81ae2e?q=80&w=1600&auto=format&fit=crop'
    },
    {
        accentColor: '#8E8E93', // Monolith
        gradient: 'linear-gradient(135deg, #1C1C1E 0%, #3A3A3C 100%)',
        coverImage: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1600&auto=format&fit=crop'
    }
];

const BatchSettingsModal: React.FC<BatchSettingsModalProps> = ({ batch, onClose, onSave }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'schedule' | 'planner' | 'theme' | 'analytics' | 'share'>('general');

    const [settings, setSettings] = useState<BatchSettings>({
        lecturesPerWeek: 6,
        lecturesPerDay: 3,
        batchType: 'Morning',
        slotTimings: [],
        enableScheduler: false,
        bufferTimeMinutes: 15,
        ...(batch.settings || {})
    });

    const [selectedTheme, setSelectedTheme] = useState<BatchTheme>(batch.theme || THEME_PRESETS[0]);
    const [inviteCode, setInviteCode] = useState<string>(batch.inviteCode || Math.random().toString(36).substring(2, 8).toUpperCase());

    useEffect(() => {
        const currentSlots = settings.slotTimings.length;
        const targetSlots = settings.lecturesPerDay;

        if (currentSlots < targetSlots) {
            const newSlots = Array.from({ length: targetSlots - currentSlots }).map((_, i) => ({
                id: `slot_${Date.now()}_${i}`,
                startTime: '09:00',
                endTime: '10:30'
            }));
            setSettings(prev => ({ ...prev, slotTimings: [...prev.slotTimings, ...newSlots] }));
        } else if (currentSlots > targetSlots) {
            setSettings(prev => ({ ...prev, slotTimings: prev.slotTimings.slice(0, targetSlots) }));
        }
    }, [settings.lecturesPerDay]);

    const handleSlotChange = (id: string, field: 'startTime' | 'endTime', value: string) => {
        setSettings(prev => ({
            ...prev,
            slotTimings: prev.slotTimings.map(slot =>
                slot.id === id ? { ...slot, [field]: value } : slot
            )
        }));
    };

    const validateSettings = () => {
        for (const slot of settings.slotTimings) {
            if (slot.startTime >= slot.endTime) {
                alert("End time must be after start time for all slots.");
                return false;
            }
        }
        return true;
    };

    const handleSave = () => {
        if (validateSettings()) {
            onSave(batch.id, settings, selectedTheme, inviteCode);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-xl animate-apple" onClick={onClose}>
            <div
                className="apple-card w-full max-w-2xl bg-[var(--apple-card-bg)] shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] border border-[var(--apple-border)]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-[var(--apple-border)] flex justify-between items-center bg-black/5 dark:bg-white/5">
                    <div>
                        <h2 className="text-xl font-extrabold text-[var(--apple-text)] tracking-tight">Batch Configuration</h2>
                        <p className="text-[var(--apple-text-secondary)] text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Professional Suite for {batch.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-all">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-6 pt-4 border-b border-[var(--apple-border)] space-x-6 overflow-x-auto no-scrollbar">
                    {['general', 'theme', 'share', 'schedule', 'planner', 'analytics'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-3 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border-b-2 ${activeTab === tab ? 'text-[#007AFF] border-[#007AFF]' : 'text-[var(--apple-text-secondary)] border-transparent hover:text-[var(--apple-text)]'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar flex-1">

                    {activeTab === 'general' && (
                        <div className="space-y-8 animate-apple">
                            <div className="space-y-4">
                                <label className="block text-[var(--apple-text-secondary)] text-[10px] font-bold uppercase tracking-widest">Batch Archetype</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {['Morning', 'Evening', 'Weekend', 'Custom'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setSettings(prev => ({ ...prev, batchType: type as any }))}
                                            className={`px-4 py-3 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${settings.batchType === type ? 'bg-[#007AFF] border-[#007AFF] text-white shadow-lg shadow-[#007AFF]/20' : 'bg-black/5 dark:bg-white/5 border-[var(--apple-border)] text-[var(--apple-text-secondary)] hover:border-black/20 dark:hover:border-white/20 hover:text-[var(--apple-text)]'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-8">
                                <div>
                                    <div className="flex justify-between mb-3">
                                        <label className="text-[var(--apple-text-secondary)] text-[10px] font-bold uppercase tracking-widest">Sessions Per Week</label>
                                        <span className="text-[var(--apple-text)] text-[10px] font-black bg-black/5 dark:bg-white/10 px-3 py-1 rounded-full">{settings.lecturesPerWeek} Days</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1" max="7"
                                        value={settings.lecturesPerWeek}
                                        onChange={(e) => setSettings(prev => ({ ...prev, lecturesPerWeek: parseInt(e.target.value) }))}
                                        className="apple-range"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between mb-3">
                                        <label className="text-[var(--apple-text-secondary)] text-[10px] font-bold uppercase tracking-widest">Sessions Per Day</label>
                                        <span className="text-[var(--apple-text)] text-[10px] font-black bg-black/5 dark:bg-white/10 px-3 py-1 rounded-full">{settings.lecturesPerDay} Slots</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1" max="5"
                                        value={settings.lecturesPerDay}
                                        onChange={(e) => setSettings(prev => ({ ...prev, lecturesPerDay: parseInt(e.target.value) }))}
                                        className="apple-range"
                                    />
                                </div>

                                <div className="space-y-4 pt-4 border-t border-[var(--apple-border)]">
                                    <label className="block text-[var(--apple-text-secondary)] text-[10px] font-bold uppercase tracking-widest">Daily Intelligence Notification</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="time"
                                            value={settings.notificationTime || ""}
                                            onChange={(e) => setSettings(prev => ({ ...prev, notificationTime: e.target.value }))}
                                            className="apple-input flex-1"
                                        />
                                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 border border-blue-500/20">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-bold text-[var(--apple-text-secondary)] opacity-60 uppercase tracking-widest leading-relaxed">System will dispatch a daily curriculum briefing at the specified temporal node.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'theme' && (
                        <div className="space-y-8 animate-apple">
                            <div className="space-y-4">
                                <label className="block text-[var(--apple-text-secondary)] text-[10px] font-bold uppercase tracking-widest">Visual Archetype</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                    {THEME_PRESETS.map((theme, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedTheme(theme)}
                                            className={`relative aspect-[16/10] rounded-2xl overflow-hidden border-2 transition-all p-4 flex flex-col justify-end ${selectedTheme.coverImage === theme.coverImage ? 'border-[#007AFF] ring-4 ring-[#007AFF]/20 scale-[1.05]' : 'border-black/10 dark:border-white/10 grayscale-[0.4] hover:grayscale-0'}`}
                                        >
                                            <img src={theme.coverImage} className="absolute inset-0 w-full h-full object-cover" alt="Theme" />
                                            <div className="absolute inset-0 bg-black/40" />
                                            <div className="relative z-10 flex items-center justify-between">
                                                <div className="w-6 h-6 rounded-full border-2 border-white/50" style={{ background: theme.gradient }}></div>
                                                {selectedTheme.coverImage === theme.coverImage && (
                                                    <div className="bg-[#007AFF] text-white p-1 rounded-full"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[var(--apple-text-secondary)] text-[10px] font-bold uppercase tracking-widest">Custom Cover Image URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={selectedTheme.coverImage || ''}
                                        onChange={(e) => setSelectedTheme(prev => ({ ...prev, coverImage: e.target.value }))}
                                        placeholder="Paste image URL (e.g. Unsplash, Pinterest, etc.)"
                                        className="apple-input flex-1"
                                    />
                                    <button
                                        onClick={() => setSelectedTheme(prev => ({ ...prev, coverImage: THEME_PRESETS[0].coverImage }))}
                                        className="apple-button-secondary px-4 py-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                                    >
                                        Reset
                                    </button>
                                </div>
                                <p className="text-[9px] font-bold text-[var(--apple-text-secondary)] opacity-60 uppercase tracking-widest leading-relaxed">System will prioritize this custom URL over selected presets. Google Drive links are automatically converted.</p>
                            </div>

                            <div className="p-6 rounded-3xl bg-black/5 dark:bg-white/5 border border-[var(--apple-border)]">
                                <p className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-[0.2em] mb-4">Preview Experience</p>
                                <div className="relative h-48 w-full rounded-2xl overflow-hidden shadow-2xl">
                                    <img src={selectedTheme.coverImage} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-80" />
                                    <div className="absolute inset-0 backdrop-blur-sm" />
                                    <div className="absolute bottom-6 left-6 flex items-center gap-4">
                                        <div className="p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20" style={{ color: selectedTheme.accentColor }}>
                                            <SparklesIcon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-white text-xl font-extrabold tracking-tight">{batch.name}</h4>
                                            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Active Curriculum View</p>
                                        </div>
                                    </div>
                                    <div className="absolute top-6 right-6 px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-white text-[10px] font-black uppercase tracking-widest">
                                        Active Profile
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div className="space-y-6 animate-apple">
                            <div className="flex items-center justify-between p-5 bg-[#FF9500]/10 border border-[#FF9500]/20 rounded-2xl mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-[#FF9500] rounded-full animate-pulse shadow-[0_0_8px_rgba(255,149,0,0.5)]"></div>
                                    <span className="text-[11px] font-black uppercase tracking-widest text-[#FF9500]">Buffer Time (Minutes)</span>
                                </div>
                                <input
                                    type="number"
                                    value={settings.bufferTimeMinutes}
                                    onChange={(e) => setSettings(prev => ({ ...prev, bufferTimeMinutes: parseInt(e.target.value) }))}
                                    className="w-16 bg-black/20 border border-[#FF9500]/30 rounded-xl px-2 py-2 text-[var(--apple-text)] text-xs text-center font-black outline-none focus:border-[#FF9500]"
                                />
                            </div>

                            <div className="space-y-4">
                                {settings.slotTimings.map((slot, index) => (
                                    <div key={slot.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-black/5 dark:bg-white/5 p-5 rounded-2xl border border-[var(--apple-border)]">
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[11px] font-black text-[var(--apple-text-secondary)] border border-[var(--apple-border)]">
                                                {index + 1}
                                            </div>
                                            <span className="sm:hidden text-[11px] font-black text-[var(--apple-text-secondary)] uppercase tracking-[0.2em]">Session Slot</span>
                                        </div>
                                        <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                                            <div>
                                                <span className="block text-[9px] text-[var(--apple-text-secondary)] font-bold uppercase tracking-widest mb-2">Start Time</span>
                                                <input
                                                    type="time"
                                                    value={slot.startTime}
                                                    onChange={(e) => handleSlotChange(slot.id, 'startTime', e.target.value)}
                                                    className="apple-input py-2.5 text-xs"
                                                />
                                            </div>
                                            <div>
                                                <span className="block text-[9px] text-[var(--apple-text-secondary)] font-bold uppercase tracking-widest mb-2">End Time</span>
                                                <input
                                                    type="time"
                                                    value={slot.endTime}
                                                    onChange={(e) => handleSlotChange(slot.id, 'endTime', e.target.value)}
                                                    className="apple-input py-2.5 text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'planner' && (
                        <div className="space-y-8 animate-apple">
                            <div
                                onClick={() => setSettings(prev => ({ ...prev, enableScheduler: !prev.enableScheduler }))}
                                className={`cursor-pointer p-6 rounded-3xl border transition-all flex items-center justify-between ${settings.enableScheduler ? 'bg-[#34C759]/10 border-[#34C759]/50' : 'bg-black/5 dark:bg-white/5 border-[var(--apple-border)] hover:border-black/20 dark:hover:border-white/20'}`}
                            >
                                <div className="space-y-1">
                                    <h4 className={`text-base font-extrabold ${settings.enableScheduler ? 'text-[#34C759]' : 'text-[var(--apple-text)]'}`}>Smart Syllabus Distributor</h4>
                                    <p className="text-xs text-[var(--apple-text-secondary)] font-medium">Automatically calculate roadmap end dates and distribute workload.</p>
                                </div>
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${settings.enableScheduler ? 'bg-[#34C759]' : 'bg-gray-400'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 ${settings.enableScheduler ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </div>
                            </div>

                            <div className={`p-6 rounded-3xl bg-black/5 dark:bg-white/5 border border-[var(--apple-border)] space-y-4 ${!settings.enableScheduler && 'opacity-30 pointer-events-none grayscale'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-2 h-2 bg-[#34C759] rounded-full shadow-[0_0_8px_rgba(52,199,89,0.5)]"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)]">Preview Logic</span>
                                </div>
                                <p className="text-sm text-[var(--apple-text-secondary)] leading-relaxed font-medium">
                                    With <span className="text-[var(--apple-text)] font-extrabold">{settings.lecturesPerWeek * settings.lecturesPerDay} lectures/week</span>,
                                    BatchWise will attempt to complete your current syllabus of <span className="text-[var(--apple-text)] font-extrabold">{batch.subjects.reduce((acc, s) => acc + s.chapters.length, 0)} chapters</span> by distributing them evenly ensuring <span className="text-[var(--apple-text)] font-extrabold">{settings.bufferTimeMinutes}m breaks</span>.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'share' && (
                        <div className="space-y-8 animate-apple">
                            <div className="bg-[#007AFF]/5 border border-[#007AFF]/20 p-8 rounded-[32px] text-center space-y-4">
                                <div className="w-16 h-16 bg-[#007AFF]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                                </div>
                                <h3 className="text-xl font-black text-[var(--apple-text)] tracking-tight">Portal Sync Coupon</h3>
                                <p className="text-[var(--apple-text-secondary)] text-xs font-medium max-w-xs mx-auto leading-relaxed">
                                    Distribute this 6-digit cryptographic coupon to synchronize your curriculum roadmap with other elite subjects.
                                </p>

                                <div className="relative group max-w-xs mx-auto mt-8">
                                    <input
                                        type="text"
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value.toUpperCase().substring(0, 6))}
                                        className="w-full bg-white dark:bg-black/20 border-2 border-[#007AFF]/30 focus:border-[#007AFF] text-center py-4 rounded-2xl text-2xl font-black tracking-[0.4em] transition-all outline-none text-[#007AFF]"
                                        placeholder="CODE6"
                                    />
                                    <div className="absolute -bottom-2 -right-2 bg-[#007AFF] text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-lg">Unique ID</div>
                                </div>

                                <div className="pt-8 flex flex-col gap-3">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(inviteCode);
                                            alert("Invitation code copied to neural clipboard!");
                                        }}
                                        className="w-full py-4 bg-[#007AFF] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[#007AFF]/20 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        Copy Command
                                    </button>
                                </div>

                                <div className="h-px bg-[var(--apple-border)] w-full my-4"></div>

                                <div className="space-y-6 text-left">
                                    <h4 className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-[0.2em]">Marketplace Presence</h4>
                                    
                                    <div className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--apple-border)]">
                                        <div className="space-y-1">
                                            <p className="text-[11px] font-black text-[var(--apple-text)] uppercase tracking-widest">Public Visibility</p>
                                            <p className="text-[9px] text-[var(--apple-text-secondary)] font-medium">Show this node in the community marketplace.</p>
                                        </div>
                                        <label className="relative flex h-6 w-11 cursor-pointer items-center rounded-full bg-slate-400 p-0.5 has-[:checked]:bg-[#007AFF] transition-all">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={!!settings.isPublic} 
                                                onChange={() => setSettings(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                                            />
                                            <div className="h-5 w-5 rounded-full bg-white transition-all peer-checked:translate-x-5 shadow-sm"></div>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest">Category</label>
                                            <select 
                                                value={settings.category || 'Academic Study'}
                                                onChange={(e) => setSettings(prev => ({ ...prev, category: e.target.value }))}
                                                className="w-full bg-black/5 dark:bg-black/20 border border-[var(--apple-border)] rounded-xl text-[10px] font-black text-[var(--apple-text)] uppercase p-3 outline-none focus:border-[#007AFF]"
                                            >
                                                <option>AI Tools</option>
                                                <option>Video Editing</option>
                                                <option>Web Development</option>
                                                <option>Design & Creative</option>
                                                <option>Academic Study</option>
                                                <option>Foundations</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest">Target Difficulty</label>
                                            <select 
                                                value={settings.difficulty || 'Advanced'}
                                                onChange={(e) => setSettings(prev => ({ ...prev, difficulty: e.target.value }))}
                                                className="w-full bg-black/5 dark:bg-black/20 border border-[var(--apple-border)] rounded-xl text-[10px] font-black text-[var(--apple-text)] uppercase p-3 outline-none focus:border-[#007AFF]"
                                            >
                                                <option>Foundation</option>
                                                <option>Challenger</option>
                                                <option>Elite</option>
                                                <option>Advanced</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest">Node Description</label>
                                        <textarea 
                                            value={settings.description || ''}
                                            onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                                            className="w-full bg-black/5 dark:bg-black/20 border border-[var(--apple-border)] rounded-xl text-[10px] font-medium text-[var(--apple-text)] p-4 outline-none focus:border-[#007AFF] min-h-[100px]"
                                            placeholder="Explain the curriculum architecture..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analytics' && (() => {
                        let totalLectures = 0;
                        let completedLectures = 0;
                        let totalDuration = 0;
                        let completedDuration = 0;

                        batch.subjects.forEach(subject => {
                            subject.chapters.forEach(chapter => {
                                chapter.lectures.forEach(lecture => {
                                    totalLectures++;
                                    if (lecture.completed) completedLectures++;
                                    completedDuration += (lecture.studyTime || 0);
                                    totalDuration += (lecture.duration || 0);
                                });
                            });
                        });

                        const formatTime = (seconds: number) => {
                            if (!seconds) return '0h 0m';
                            const h = Math.floor(seconds / 3600);
                            const m = Math.floor((seconds % 3600) / 60);
                            return `${h}h ${m}m`;
                        };

                        const percentage = totalLectures === 0 ? 0 : Math.round((completedLectures / totalLectures) * 100);

                        return (
                            <div className="space-y-8 animate-apple">
                                <div className="grid grid-cols-2 gap-4 md:gap-6">
                                    <div className="bg-black/5 dark:bg-white/5 p-6 rounded-3xl border border-[var(--apple-border)] space-y-3">
                                        <p className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-[0.2em]">Time Spent</p>
                                        <p className="text-2xl font-extrabold text-[var(--apple-text)]">{formatTime(completedDuration)}</p>
                                    </div>
                                    <div className="bg-black/5 dark:bg-white/5 p-6 rounded-3xl border border-[var(--apple-border)] space-y-3">
                                        <p className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-[0.2em]">Efficiency</p>
                                        <p className="text-2xl font-extrabold text-[#007AFF]">{percentage}%</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-black/5 dark:bg-white/5 p-6 rounded-3xl border border-[var(--apple-border)] flex justify-between items-center">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-[0.2em]">Modules Completed</p>
                                            <p className="text-xl font-extrabold text-[var(--apple-text)]">{completedLectures} <span className="text-sm text-[var(--apple-text-secondary)] opacity-60">/ {totalLectures}</span></p>
                                        </div>
                                        <div className="h-16 w-16 rounded-full border-4 border-black/5 dark:border-white/5 flex items-center justify-center relative">
                                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                                <circle
                                                    cx="32" cy="32" r="28"
                                                    fill="transparent"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    className="text-[#007AFF]/10"
                                                />
                                                <circle
                                                    cx="32" cy="32" r="28"
                                                    fill="transparent"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    strokeDasharray={176}
                                                    strokeDashoffset={176 - (176 * percentage) / 100}
                                                    className="text-[#007AFF] transition-all duration-1000 ease-out"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <span className="text-[10px] font-black text-[var(--apple-text)]">{percentage}%</span>
                                        </div>
                                    </div>

                                    <div className="bg-black/5 dark:bg-white/5 p-6 rounded-3xl border border-[var(--apple-border)] flex justify-between items-center">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-[0.2em]">Remaining Workload</p>
                                            <p className="text-xl font-extrabold text-[var(--apple-text)]">{totalLectures - completedLectures} Sessions</p>
                                        </div>
                                        <div className="px-4 py-2 bg-black/5 dark:bg-white/10 rounded-full border border-[var(--apple-border)] text-[9px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest">
                                            In Pipeline
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-3xl bg-[#007AFF]/5 border border-[#007AFF]/20">
                                    <p className="text-[10px] font-black text-[#007AFF] uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-[#007AFF] rounded-full shadow-[0_0_8px_rgba(0,122,255,0.4)]"></span>
                                        Batch Insight
                                    </p>
                                    <p className="text-[13px] text-[var(--apple-text-secondary)] leading-relaxed font-medium">
                                        Since your last synchronization, you've mastered <span className="text-[var(--apple-text)] font-extrabold">{completedLectures}</span> module entries.
                                        {percentage > 50 ? " Your progress metrics are outstanding!" : " Consistency is the foundation of excellence."}
                                    </p>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[var(--apple-border)] bg-black/5 dark:bg-white/5 flex justify-end items-center gap-4">
                    <button onClick={onClose} className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)] transition-colors">Cancel</button>
                    <button onClick={handleSave} className="apple-button-primary px-10 py-3.5 text-[11px] tracking-widest uppercase">Save Changes</button>
                </div>
            </div >
        </div >
    );
};

export default BatchSettingsModal;
