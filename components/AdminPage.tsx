import React, { useState, useEffect } from 'react';
import { LibraryResource, ViewMode } from '../types';
import { PlusIcon, TrashIcon, EditIcon, ChevronLeftIcon, BookOpenIcon, SparklesIcon, UsersIcon } from './Icons';
import { saveLibraryResource, deleteLibraryResource, subscribeToAnnouncement, updateAnnouncement, addAdmin, removeAdmin, getAdmins, bulkSaveLibraryResources } from '../services/firestoreService';
import { sendNotificationToAll } from '../services/notificationService';
import AnalyticsDashboardView from './AnalyticsDashboardView';

interface AdminPageProps {
    onBack: () => void;
    libraryResources: LibraryResource[];
}

const AdminPage: React.FC<AdminPageProps> = ({ onBack, libraryResources }) => {
    const [activeTab, setActiveTab] = useState<'library' | 'announcements' | 'admins' | 'analytics'>('analytics');

    // Announcement State
    const [announcementText, setAnnouncementText] = useState<string>('');
    const [announcementTitle, setAnnouncementTitle] = useState<string>('');
    const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
    const [sendPushNotification, setSendPushNotification] = useState(false);

    // Library State
    const [editingResource, setEditingResource] = useState<LibraryResource | null>(null);
    const [isAddingResource, setIsAddingResource] = useState(false);
    const [resourceFormData, setResourceFormData] = useState<Partial<LibraryResource>>({ order: 0, color: 'bg-slate-700', tagColor: 'bg-blue-500' });
    const [isSavingResource, setIsSavingResource] = useState(false);

    // Initial load of announcement
    useEffect(() => {
        const unsubscribe = subscribeToAnnouncement((text, updatedAt, title) => {
            setAnnouncementText(text);
            if (title) setAnnouncementTitle(title);
        }, (error) => {
            console.error("AdminPage announcement subscription error:", error);
        });
        return () => unsubscribe();
    }, []);

    // --- Announcement Handlers ---
    const handleAnnouncementSave = async () => {
        setIsSavingAnnouncement(true);
        try {
            await Promise.race([
                updateAnnouncement(announcementText, announcementTitle),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Update request timed out')), 20000))
            ]);

            if (sendPushNotification) {
                sendNotificationToAll(
                    announcementTitle || '📢 New Announcement',
                    announcementText,
                    { type: 'announcement', timestamp: new Date().toISOString() }
                ).catch(notifyErr => console.error("Notification trigger failed:", notifyErr));
            }

            setIsSavingAnnouncement(false);
            setSendPushNotification(false);
            alert(sendPushNotification ? "Announcement updated and notifications triggered!" : "Announcement updated successfully!");
        } catch (err: any) {
            console.error('Failed to update announcement:', err);
            setIsSavingAnnouncement(false);
            alert("Failed to update announcement: " + (err.message || "Unknown error"));
        }
    };

    // --- Library Handlers ---
    const handleSaveResource = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSavingResource) return;
        setIsSavingResource(true);
        try {
            const resourceId = editingResource?.id || `lib_${Date.now()}`;
            const resourceToSave: any = {
                id: resourceId,
                title: (resourceFormData.title || '').trim(),
                color: resourceFormData.color || 'bg-slate-700',
                category: resourceFormData.category || 'General',
                tagColor: resourceFormData.tagColor || 'bg-blue-500',
                status: resourceFormData.status || 'Open',
                href: (resourceFormData.href || '').trim(),
                reserved: resourceFormData.reserved || false,
                order: isNaN(Number(resourceFormData.order)) ? 0 : Number(resourceFormData.order),
            };

            if (resourceFormData.coverImageUrl && resourceFormData.coverImageUrl.trim()) {
                resourceToSave.coverImageUrl = resourceFormData.coverImageUrl.trim();
            }

            if (!resourceToSave.title) {
                alert("Please enter a title");
                setIsSavingResource(false);
                return;
            }

            await saveLibraryResource(resourceToSave);
            setEditingResource(null);
            setIsAddingResource(false);
            setResourceFormData({ order: libraryResources.length, color: 'bg-slate-700', tagColor: 'bg-blue-500' });

            setTimeout(() => {
                alert(editingResource ? "Resource updated!" : "Added to library!");
            }, 100);
        } catch (err) {
            console.error("Save error:", err);
            alert("Failed to save resource.");
        } finally {
            setIsSavingResource(false);
        }
    };

    const handleDeleteResource = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this resource?")) {
            try {
                await deleteLibraryResource(id);
            } catch (err) {
                alert("Failed to delete resource");
            }
        }
    };

    const startEditResource = (resource: LibraryResource) => {
        setEditingResource(resource);
        setResourceFormData(resource);
        setIsAddingResource(false);
    };

    const startAddResource = () => {
        setIsAddingResource(true);
        setEditingResource(null);
        setResourceFormData({ order: libraryResources.length + 1, color: 'bg-slate-700', tagColor: 'bg-blue-500' });
    };

    return (
        <div className="min-h-screen bg-[var(--apple-bg)] flex flex-col">
            {/* Top Navigation Bar */}
            <div className="apple-glass sticky top-0 z-50 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
                                <ChevronLeftIcon className="w-6 h-6" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-black text-[var(--apple-text)] tracking-tight">Admin Dashboard</h1>
                                <p className="text-xs font-bold text-[var(--apple-text-secondary)] uppercase tracking-widest">System Control Center</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-[#0b0f1a] p-1 rounded-xl border border-white/5">
                            <button
                                onClick={() => setActiveTab('library')}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'library' ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                Library
                            </button>
                            <button
                                onClick={() => setActiveTab('announcements')}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'announcements' ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                Announcements
                            </button>
                            <button
                                onClick={() => setActiveTab('admins')}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'admins' ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                Admins
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'analytics' ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                Analytics
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">

                {/* --- Library Tab Content --- */}
                {activeTab === 'library' && (
                    <div className="space-y-6 animate-in fade-in duration-700">
                        {/* Quick Stats */}
                        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'Total Resources', val: libraryResources.length, icon: 'inventory_2', trend: 'Active', color: 'text-blue-500' },
                                { label: 'Active PDFs', val: libraryResources.filter(r => r.category?.toLowerCase() === 'pdf').length, icon: 'picture_as_pdf', trend: 'Live', color: 'text-rose-500' },
                                { label: 'Drive Nodes', val: libraryResources.filter(r => r.category?.toLowerCase() === 'drive').length, icon: 'cloud', trend: 'Synced', color: 'text-emerald-500' },
                                { label: 'Comms Nodes', val: libraryResources.filter(r => r.category?.toLowerCase() === 'telegram' || r.category?.toLowerCase() === 'group').length, icon: 'send', trend: 'Broadcast', color: 'text-amber-500' },
                            ].map(stat => (
                                <div key={stat.label} className="bg-[#0b0f1a] p-4 rounded-xl border border-white/5 shadow-xl">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="size-12 bg-slate-900 rounded-xl flex items-center justify-center border border-white/5 shadow-inner">
                                            <span className={`material-symbols-outlined ${stat.color}`}>{stat.icon}</span>
                                        </div>
                                        <span className="text-emerald-500 bg-emerald-500/5 text-[9px] font-black px-2 py-0.5 rounded-full border border-current/10">{stat.trend}</span>
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-3xl font-black text-white mt-1 italic">{stat.val}</p>
                                </div>
                            ))}
                        </section>

                        {/* Configuration Form */}
                        <section className="bg-[#0b0f1a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="p-4 px-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-4 relative z-10">
                                <div className="size-10 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl flex items-center justify-center border border-[var(--primary)]/20">
                                    <span className="material-symbols-outlined">{editingResource ? 'upgrade' : 'edit_square'}</span>
                                </div>
                                <h3 className="font-black text-white italic uppercase tracking-tight">
                                    {editingResource ? `Updating Asset: ${resourceFormData.title}` : 'Resource Configuration Node'}
                                </h3>
                            </div>
                            <div className="p-6 relative z-10">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Resource Title</label>
                                            <input 
                                                className="w-full bg-slate-950 border border-white/5 rounded-xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-[var(--primary)]/50 focus:border-[var(--primary)]/50 transition-all placeholder:text-slate-800 font-bold" 
                                                placeholder="e.g. Quantum Mechanics Master Directive" 
                                                type="text"
                                                value={resourceFormData.title || ''}
                                                onChange={e => setResourceFormData({...resourceFormData, title: e.target.value})}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Category</label>
                                                <select 
                                                    className="w-full bg-slate-950 border border-white/5 rounded-xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-[var(--primary)]/50 transition-all font-bold"
                                                    value={resourceFormData.category === 'Physics' ? 'PDF Document' : resourceFormData.category === 'Chemistry' ? 'Google Drive Link' : resourceFormData.category || 'PDF Document'}
                                                    onChange={e => setResourceFormData({...resourceFormData, category: e.target.value})}
                                                >
                                                    <option value="Skill Material">Skill Material</option>
                                                    <option value="Creative Material">Creative Material</option>
                                                    <option value="Boards Content">Boards Content</option>
                                                    <option value="PDF Document">PDF Document</option>
                                                    <option value="Google Drive Link">Google Drive Link</option>
                                                    <option value="Telegram Channel">Telegram Channel</option>
                                                    <option value="Telegram Group">Telegram Group</option>
                                                    <option value="Formula Sheet">Formula Sheet</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Access URL</label>
                                                <input 
                                                    className="w-full bg-slate-950 border border-white/5 rounded-xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-[var(--primary)]/50 transition-all placeholder:text-slate-800 font-bold" 
                                                    placeholder="https://drive.google.com/..." 
                                                    type="url"
                                                    value={resourceFormData.href || ''}
                                                    onChange={e => setResourceFormData({...resourceFormData, href: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Display Order</label>
                                                <input 
                                                    className="w-full bg-slate-950 border border-white/5 rounded-xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-[var(--primary)]/50 transition-all font-bold" 
                                                    type="number"
                                                    value={resourceFormData.order || 0}
                                                    onChange={e => setResourceFormData({...resourceFormData, order: parseInt(e.target.value)})}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Status Protocol</label>
                                                <input 
                                                    className="w-full bg-slate-950 border border-white/5 rounded-xl py-4 px-6 text-sm text-white focus:ring-1 focus:ring-[var(--primary)]/50 transition-all font-bold" 
                                                    placeholder="e.g. Open Drive"
                                                    value={resourceFormData.status || ''}
                                                    onChange={e => setResourceFormData({...resourceFormData, status: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-full flex flex-col">
                                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Directive Description</label>
                                        <textarea 
                                            className="flex-1 w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-4 text-sm text-white focus:ring-1 focus:ring-[var(--primary)]/50 transition-all placeholder:text-slate-800 min-h-[120px] font-medium leading-relaxed" 
                                            placeholder="Detailed operational intelligence regarding this asset..."
                                            value={resourceFormData.description || ''}
                                            onChange={e => setResourceFormData({...resourceFormData, description: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end gap-4 border-t border-white/5 pt-6">
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setResourceFormData({ order: libraryResources.length, color: 'bg-slate-700', tagColor: 'bg-blue-500' });
                                            setEditingResource(null);
                                        }}
                                        className="px-8 py-3 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors"
                                    >
                                        Reset Terminal
                                    </button>
                                    <button 
                                        onClick={handleSaveResource} 
                                        disabled={isSavingResource}
                                        className="px-10 py-4 bg-[var(--primary)] text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#b00808] transition-all shadow-xl shadow-[var(--primary)]/20 disabled:opacity-50"
                                    >
                                        {isSavingResource ? 'Broadcasting...' : (editingResource ? 'Update Strategic Node' : 'Commit Asset')}
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Inventory Search & Table */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="font-black text-white italic uppercase tracking-tight">Active Inventory</h3>
                                 <div className="flex items-center gap-4">
                                    <input 
                                        type="file" 
                                        id="admin-library-csv" 
                                        accept=".csv" 
                                        className="hidden" 
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const text = await file.text();
                                            const lines = text.split('\n').filter(l => l.trim());
                                            if (lines.length < 2) return;
                                            const header = lines[0].split(',').map(h => h.trim().toLowerCase());
                                            const resources: LibraryResource[] = [];
                                            for(let i=1; i<lines.length; i++) {
                                                const values = lines[i].split(',').map(v => v.trim().replace(/^["'](.+)["']$/, '$1'));
                                                const res: any = { id: `lib_admin_${Date.now()}_${i}` };
                                                header.forEach((h, idx) => { if(values[idx] !== undefined) res[h] = values[idx]; });
                                                if(!res.title) res.title = "Imported Asset";
                                                if(!res.color) res.color = "bg-slate-700";
                                                if(!res.order) res.order = libraryResources.length + i;
                                                res.contributorId = "admin";
                                                resources.push(res);
                                            }
                                            if(resources.length > 0 && confirm(`Bulk import ${resources.length} items?`)) {
                                                await bulkSaveLibraryResources(resources);
                                                alert("Bulk import complete!");
                                            }
                                        }}
                                    />
                                    <button 
                                        onClick={() => document.getElementById('admin-library-csv')?.click()}
                                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">upload_file</span> Bulk CSV Import
                                    </button>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-sm">search</span>
                                        <input 
                                            className="pl-12 pr-6 py-3 bg-[#0b0f1a] border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest w-72 focus:ring-1 focus:ring-[var(--primary)]/30" 
                                            placeholder="Search Inventory..." 
                                            type="text"
                                            onChange={(e) => {
                                                // Local filtering logic if needed, or just let the table handle it
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-[#0b0f1a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-white/[0.02]">
                                            <th className="px-8 py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Intel</th>
                                            <th className="px-8 py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Asset Name</th>
                                            <th className="px-8 py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Classification</th>
                                            <th className="px-8 py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Deployment</th>
                                            <th className="px-8 py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Status</th>
                                            <th className="px-8 py-6 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] text-right">Strategic Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {libraryResources.map(res => (
                                            <tr key={res.id} className="hover:bg-white/[0.01] transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="size-10 bg-slate-950 rounded-lg flex items-center justify-center border border-white/5 group-hover:border-[var(--primary)]/30 transition-all">
                                                        <span className="material-symbols-outlined text-[var(--primary)] text-sm">
                                                            {res.category?.toLowerCase() === 'pdf' ? 'picture_as_pdf' : 
                                                             res.category?.toLowerCase() === 'drive' ? 'cloud' : 
                                                             res.category?.toLowerCase() === 'telegram' ? 'send' : 'inventory_2'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-bold text-white tracking-tight">{res.title}</p>
                                                    <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest mt-1">Ref ID: {res.id.slice(0, 12)}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="text-[8px] font-black bg-slate-900 border border-white/5 px-2 py-1 rounded-sm text-slate-400 uppercase tracking-widest">{res.category || 'PDF'}</span>
                                                </td>
                                                <td className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Jan 2026</td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-4">
                                                        <button onClick={() => startEditResource(res)} className="text-slate-600 hover:text-[var(--primary)] transition-colors"><span className="material-symbols-outlined text-base">edit</span></button>
                                                        <button onClick={() => handleDeleteResource(res.id)} className="text-slate-800 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-base">delete</span></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {libraryResources.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-16 text-center text-slate-700 text-[10px] font-black uppercase tracking-widest italic">
                                                    Zero Intelligence matches for active search parameters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                )}


                {/* --- Announcements Tab Content --- */}
                {activeTab === 'announcements' && (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                        <div>
                            <h2 className="text-3xl font-black text-white">Global Announcements</h2>
                            <p className="text-slate-400 mt-1">Broadcast updates to all users instantly.</p>
                        </div>

                        <div className="bg-gradient-to-br from-[#161e2d] to-[#0f1520] border border-white/5 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--primary)]/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                            <div className="relative z-10 max-w-3xl">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Announcement Title</label>
                                            <input
                                                type="text"
                                                value={announcementTitle}
                                                onChange={(e) => setAnnouncementTitle(e.target.value)}
                                                placeholder="Headline (e.g., New Course Launch)"
                                                className="w-full bg-[#0b0f1a] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[var(--primary)]/50 transition-all font-bold text-lg" // Larger text
                                            />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Message Body</label>
                                        <textarea
                                            value={announcementText}
                                            onChange={(e) => setAnnouncementText(e.target.value)}
                                            placeholder="Type your announcement here..."
                                            rows={6}
                                            className="w-full bg-[#0b0f1a] border border-white/5 rounded-2xl px-6 py-6 text-white focus:outline-none focus:border-[var(--primary)]/50 transition-all font-medium text-base resize-none leading-relaxed"
                                        />
                                    </div>

                                    <div className="flex flex-col md:flex-row items-center gap-6 pt-4">
                                        <div className="flex items-center gap-3 bg-[#0b0f1a] p-4 rounded-2xl border border-white/5 w-full md:w-auto">
                                            <input
                                                type="checkbox"
                                                id="sendNotification"
                                                checked={sendPushNotification}
                                                onChange={(e) => setSendPushNotification(e.target.checked)}
                                                className="w-5 h-5 accent-[var(--primary)]"
                                            />
                                            <label htmlFor="sendNotification" className="text-xs font-black text-slate-300 uppercase tracking-widest cursor-pointer flex items-center gap-2">
                                                <span>📲</span> Send Push Notification
                                            </label>
                                        </div>

                                        <button
                                            onClick={handleAnnouncementSave}
                                            disabled={isSavingAnnouncement}
                                            className="w-full md:flex-1 bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:bg-[var(--primary)]/50 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-[var(--primary)]/20 active:scale-95 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                        >
                                            {isSavingAnnouncement ? (
                                                <span className="animate-pulse">Broadcasting...</span>
                                            ) : (
                                                <>
                                                    <SparklesIcon className="w-4 h-4" />
                                                    {sendPushNotification ? 'Broadcast Update & Notify' : 'Update Wireless Ticker'}
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mt-6">
                                        <p className="text-yellow-200/70 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <span>⚠️</span> Note: This will update the ticker on all active client devices immediately.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Admins Tab Content --- */}
                {activeTab === 'admins' && <ManageAdminsTab />}

                {/* --- Analytics Tab Content --- */}
                {activeTab === 'analytics' && <AnalyticsDashboardView />}
            </div>
        </div>
    );
};

const ManageAdminsTab = () => {
    const [admins, setAdmins] = useState<string[]>([]);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        try {
            const list = await getAdmins();
            setAdmins(list);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdminEmail.trim()) return;
        setActionLoading(true);
        try {
            await addAdmin(newAdminEmail);
            setNewAdminEmail('');
            loadAdmins();
            alert("Admin added successfully!");
        } catch (error) {
            alert("Failed to add admin.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveAdmin = async (email: string) => {
        if (!confirm(`Are you sure you want to remove ${email} from admins?`)) return;
        setActionLoading(true);
        try {
            await removeAdmin(email);
            loadAdmins();
        } catch (error) {
            alert("Failed to remove admin.");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-2xl">
                    <UsersIcon />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white">Manage Administrators</h2>
                    <p className="text-slate-400 mt-1">Control who has access to the admin dashboard.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add Admin Form */}
                <div className="bg-[#161e2d] border border-white/5 rounded-[2.5rem] p-8 h-fit relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <h3 className="text-xl font-black text-white mb-6 relative z-10">Add New Admin</h3>
                    <form onSubmit={handleAddAdmin} className="space-y-6 relative z-10">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">User Email Address</label>
                            <input
                                type="email"
                                required
                                value={newAdminEmail}
                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                placeholder="user@example.com"
                                className="w-full bg-[#0b0f1a] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[var(--primary)]/50 transition-all font-bold text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={actionLoading}
                            className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:bg-[var(--primary)]/50 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-[var(--primary)]/20 active:scale-95 disabled:cursor-not-allowed"
                        >
                            {actionLoading ? 'Granting Access...' : 'Grant Admin Access'}
                        </button>
                    </form>
                    <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-xl p-4 mt-6 relative z-10">
                        <p className="text-[var(--primary)]/70 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <span>ℹ️</span> New admins will need to refresh their session to access the dashboard.
                        </p>
                    </div>
                </div>

                {/* Admin List */}
                <div className="bg-[#161e2d] border border-white/5 rounded-[2.5rem] p-8 min-h-[400px]">
                    <h3 className="text-xl font-black text-white mb-6">Current Admins <span className="text-slate-500 text-sm ml-2">({admins.length})</span></h3>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-4 border-slate-600 border-t-white rounded-full animate-spin"></div>
                        </div>
                    ) : admins.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <p className="text-xs font-black uppercase tracking-widest">No additional admins found.</p>
                            <p className="text-[10px] mt-2">Only Super Admins have access currently.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {admins.map((email) => (
                                <div key={email} className="group flex items-center justify-between p-4 bg-[#0b0f1a] rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-black text-xs">
                                            {email.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-bold text-slate-300">{email}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveAdmin(email)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Revoke Access"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
