
import React, { useState, useEffect } from 'react';
import { Batch } from '../types';
import { CheckIcon, XIcon, ShareIcon } from './Icons';
import { subscribeToBatchMembers, subscribeToBatchStats } from '../services/firestoreService';

interface ShareSettingsModalProps {
    batch: Batch;
    currentUser: any;
    onClose: () => void;
    onSave: (updatedBatch: Batch) => void;
    onRegenerateCode: () => void;
    onSendNotification: (title: string, body: string) => void;
}

const ShareSettingsModal: React.FC<ShareSettingsModalProps> = ({ batch, currentUser, onClose, onSave, onRegenerateCode, onSendNotification }) => {
    const [localBatch, setLocalBatch] = useState<Batch>({ 
        ...batch,
        progressVisibility: batch.progressVisibility || 'everyone',
        importPermission: batch.importPermission || 'public'
    });
    
    React.useEffect(() => {
        setLocalBatch(prev => ({ ...prev, inviteCode: batch.inviteCode }));
    }, [batch.inviteCode]);

    const handleToggle = (field: keyof Batch) => {
        setLocalBatch(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSelectChange = (field: keyof Batch, value: string) => {
        setLocalBatch(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(localBatch);
        onClose();
    };

    const shareUrl = `${window.location.origin}/import/${localBatch.inviteCode}`;

    return (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div 
                className="w-full max-w-3xl bg-[#0a0a0c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Top Navigation / Header */}
                <header className="flex items-center justify-between border-b border-white/5 px-6 py-6 lg:px-12 bg-black/40 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white shadow-xl shadow-[var(--primary)]/20">
                            <span className="material-symbols-outlined text-xl">shield_lock</span>
                        </div>
                        <h2 className="text-lg font-black tracking-tight text-white uppercase italic">Batch Settings</h2>
                    </div>
                    <button onClick={onClose} className="size-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-100 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-10 custom-scrollbar">
                    {/* Page Header */}
                    <div className="flex flex-col gap-2 border-b border-white/5 pb-8">
                        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Sharing & <span className="text-[var(--primary)]">PRIVACY</span></h1>
                        <p className="text-slate-500 text-sm font-medium">Manage how your batch is shared and who can interact with it.</p>
                    </div>

                    {/* Main Visibility Card */}
                    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 flex flex-col gap-8">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <p className="text-base font-black text-white uppercase tracking-widest">Public Visibility</p>
                                <p className="text-slate-500 text-xs font-medium">Allow anyone with the link to view this batch and its contents.</p>
                            </div>
                            <label className="relative flex h-7 w-12 cursor-pointer items-center rounded-full bg-slate-800 p-1 has-[:checked]:bg-[var(--primary)] transition-all">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={localBatch.isPublic} 
                                    onChange={() => handleToggle('isPublic')}
                                />
                                <div className="h-5 w-5 rounded-full bg-white transition-all peer-checked:translate-x-5 shadow-sm"></div>
                            </label>
                        </div>
                        <div className="h-px bg-white/5 w-full"></div>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <p className="text-base font-black text-white uppercase tracking-widest">Share to Community</p>
                                <p className="text-slate-400 text-xs font-medium">Feature this batch in the global discover feed.</p>
                            </div>
                            <label className="relative flex h-7 w-12 cursor-pointer items-center rounded-full bg-slate-800 p-1 has-[:checked]:bg-[var(--primary)] transition-all">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={localBatch.isFeatured} 
                                    onChange={() => handleToggle('isFeatured')}
                                />
                                <div className="h-5 w-5 rounded-full bg-white transition-all peer-checked:translate-x-5 shadow-sm"></div>
                            </label>
                        </div>
                    </section>

                    {/* Monetization & Access Control */}
                    <section className="rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-8 flex flex-col gap-8 shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]">
                        <div className="flex items-center gap-3 border-b border-[var(--primary)]/20 pb-4">
                            <span className="material-symbols-outlined text-[var(--primary)] text-2xl">storefront</span>
                            <h3 className="text-lg font-black text-[var(--primary)] uppercase tracking-widest">Monetization & Access</h3>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <p className="text-base font-black text-white uppercase tracking-widest">Require Manual Approval</p>
                                <p className="text-slate-400 text-xs font-medium">Users must request entry and wait for your manual approval.</p>
                            </div>
                            <label className="relative flex h-7 w-12 cursor-pointer items-center rounded-full bg-slate-800 p-1 has-[:checked]:bg-[var(--primary)] transition-all">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={localBatch.requireApproval} 
                                    onChange={() => handleToggle('requireApproval')}
                                />
                                <div className="h-5 w-5 rounded-full bg-white transition-all peer-checked:translate-x-5 shadow-sm"></div>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Batch Price (₹)</label>
                                <input 
                                    type="number" 
                                    placeholder="Leave 0 for free"
                                    value={localBatch.price || ''}
                                    onChange={(e) => handleSelectChange('price', Number(e.target.value) as any)}
                                    className="w-full bg-[#0b0f1a]/50 border border-[var(--primary)]/20 rounded-xl px-4 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--primary)]/50 transition-all font-bold"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Payment / Contact Link (e.g. Telegram)</label>
                                <input 
                                    type="text" 
                                    placeholder="https://t.me/your_channel"
                                    value={localBatch.contactLink || ''}
                                    onChange={(e) => handleSelectChange('contactLink', e.target.value)}
                                    className="w-full bg-[#0b0f1a]/50 border border-[var(--primary)]/20 rounded-xl px-4 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--primary)]/50 transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Batch Landing Description</label>
                            <textarea 
                                placeholder="Describe what the students get when they purchase this batch..."
                                value={localBatch.aboutHtml || ''}
                                onChange={(e) => handleSelectChange('aboutHtml', e.target.value)}
                                rows={3}
                                className="w-full bg-[#0b0f1a]/50 border border-[var(--primary)]/20 rounded-xl px-4 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-[var(--primary)]/50 transition-all font-medium resize-none"
                            />
                        </div>
                    </section>

                    {/* Invite Code Section */}
                    <section className="flex flex-col gap-6">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Invite Code</h3>
                            <button 
                                onClick={onRegenerateCode}
                                className="text-[var(--primary)] text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">refresh</span>
                                Regenerate Code
                            </button>
                        </div>
                        <div className="flex justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] py-10 relative group hover:border-[var(--primary)]/30 transition-all">
                            <fieldset className="flex gap-3 sm:gap-4">
                                {localBatch.inviteCode?.split('').map((char, i) => (
                                    <input 
                                        key={i}
                                        className="flex h-14 w-10 sm:w-12 text-center bg-transparent border-0 border-b-2 border-[var(--primary)] focus:ring-0 text-xl font-black text-white uppercase" 
                                        readOnly 
                                        value={char} 
                                    />
                                ))}
                            </fieldset>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-sm bg-black/40 rounded-2xl transition-opacity">
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(localBatch.inviteCode || '');
                                        alert("Invite code copied!");
                                    }}
                                    className="bg-white text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transform transition-transform hover:scale-105 active:scale-95"
                                >
                                    Copy Code
                                </button>
                            </div>
                        </div>
                        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] text-center">Share this code with students so they can import your batch.</p>
                    </section>

                    {/* Granular Privacy Settings */}
                    <section className="flex flex-col gap-6">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] px-1">Detailed Permissions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Who can see progress?</p>
                                <select 
                                    value={localBatch.progressVisibility}
                                    onChange={(e) => handleSelectChange('progressVisibility', e.target.value)}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl text-xs font-black text-white uppercase tracking-widest p-4 focus:ring-0 focus:border-[var(--primary)] transition-all"
                                >
                                    <option value="everyone">Everyone with the link</option>
                                    <option value="members">Only invited members</option>
                                    <option value="me">Just me</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Who can import?</p>
                                <select 
                                    value={localBatch.importPermission}
                                    onChange={(e) => handleSelectChange('importPermission', e.target.value)}
                                    className="w-full bg-slate-950 border border-white/10 rounded-xl text-xs font-black text-white uppercase tracking-widest p-4 focus:ring-0 focus:border-[var(--primary)] transition-all"
                                >
                                    <option value="public">Public (Anyone)</option>
                                    <option value="restricted">Restricted (Invite Only)</option>
                                    <option value="disabled">Disabled</option>
                                </select>
                            </div>
                        </div>
                    </section>
                    


                    {/* Copy Link & Social Sharing */}
                    <section className="flex flex-col gap-8 pt-4">
                        <div className="flex flex-col gap-4">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Share Public Link</p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-slate-400 text-xs font-medium truncate font-mono">
                                    {shareUrl}
                                </div>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(shareUrl);
                                        alert("Link copied!");
                                    }}
                                    className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-black px-8 py-4 rounded-xl flex items-center justify-center gap-2 whitespace-nowrap transition-all shadow-xl shadow-[var(--primary)]/20 active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                    Copy Link
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Share via:</span>
                            <div className="flex gap-4">
                                <button className="size-11 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-[var(--primary)]/20 hover:text-[var(--primary)] border border-white/5 transition-all text-slate-500">
                                    <span className="material-symbols-outlined text-[20px]">share</span>
                                </button>
                                <button className="size-11 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-[var(--primary)]/20 hover:text-[var(--primary)] border border-white/5 transition-all text-slate-500 font-black">
                                    <span className="material-symbols-outlined text-[20px]">alternate_email</span>
                                </button>
                                <button className="size-11 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-[var(--primary)]/20 hover:text-[var(--primary)] border border-white/5 transition-all text-slate-500">
                                    <span className="material-symbols-outlined text-[20px]">hub</span>
                                </button>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Action Footer */}
                <footer className="flex items-center justify-end gap-6 p-6 lg:px-12 border-t border-white/5 bg-black/40 backdrop-blur-md mt-auto mb-4">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 rounded-xl font-black text-slate-500 hover:text-white uppercase tracking-widest text-[10px] transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-10 py-3 rounded-xl font-black bg-[var(--primary)] text-white hover:brightness-125 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] text-[10px] uppercase tracking-widest transform active:scale-95"
                    >
                        Save Changes
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ShareSettingsModal;
