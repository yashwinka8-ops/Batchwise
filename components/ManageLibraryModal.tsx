import React, { useState, useEffect } from 'react';
import { LibraryResource } from '../types';
import { PlusIcon, TrashIcon, EditIcon, ChevronLeftIcon } from './Icons';
import { saveLibraryResource, deleteLibraryResource, subscribeToAnnouncement, updateAnnouncement, bulkSaveLibraryResources } from '../services/firestoreService';
import { sendNotificationToAll } from '../services/notificationService';

interface ManageLibraryModalProps {
    resources: LibraryResource[];
    isOpen: boolean;
    onClose: () => void;
}

const convertDriveLink = (url: string) => {
    if (!url) return url;
    // Standard file link: https://drive.google.com/file/d/ID/view...
    // Sharing link: https://drive.google.com/open?id=ID
    const driveMatch = url.match(/\/(?:file\/d\/|open\?id=)([^/?]+)/);
    if (driveMatch && driveMatch[1]) {
        const id = driveMatch[1];
        return `https://drive.google.com/uc?export=download&id=${id}`;
    }
    return url;
};

const ManageLibraryModal: React.FC<ManageLibraryModalProps> = ({ resources, isOpen, onClose }) => {
    const [editingResource, setEditingResource] = useState<LibraryResource | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState<Partial<LibraryResource>>({ order: 0, color: 'bg-slate-700', tagColor: 'bg-blue-500' });
    const [announcementText, setAnnouncementText] = useState<string>('');
    const [announcementTitle, setAnnouncementTitle] = useState<string>('');
    const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
    const [sendPushNotification, setSendPushNotification] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const unsubscribe = subscribeToAnnouncement((text, updatedAt, title) => {
                setAnnouncementText(text);
                if (title) setAnnouncementTitle(title);
            }, (error) => {
                console.error("ManageLibraryModal announcement subscription error:", error);
            });
            return () => unsubscribe();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAnnouncementSave = async () => {
        setIsSavingAnnouncement(true);

        try {
            // 1. Update Firestore Document with a 20-second timeout race
            await Promise.race([
                updateAnnouncement(announcementText, announcementTitle),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Update request timed out')), 20000))
            ]);

            // 2. Send Notifications (Secondary Goal - non-blocking)
            if (sendPushNotification) {
                // We fire and forget or wrap in its own try-catch to avoid blocking UI
                sendNotificationToAll(
                    announcementTitle || '📢 New Announcement',
                    announcementText,
                    { type: 'announcement', timestamp: new Date().toISOString() }
                ).catch(notifyErr => console.error("Notification trigger failed:", notifyErr));
            }

            // 3. Reset state BEFORE showing the blocking alert
            setIsSavingAnnouncement(false);
            setSendPushNotification(false);

            // 4. Then show the alert
            setTimeout(() => {
                alert(sendPushNotification ? "Announcement updated and notifications triggered!" : "Announcement updated successfully!");
            }, 100);

        } catch (err: any) {
            console.error('Failed to update announcement:', err);
            setIsSavingAnnouncement(false);
            // Brief delay to ensure UI updates before alert
            setTimeout(() => {
                alert("Failed to update announcement: " + (err.message || "Unknown error"));
            }, 100);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;
        setIsSaving(true);

        try {
            const resourceId = editingResource?.id || `lib_${Date.now()}`;

            const resourceToSave: any = {
                id: resourceId,
                title: (formData.title || '').trim(),
                color: formData.color || 'bg-slate-700',
                tagColor: formData.tagColor || 'bg-blue-500',
                status: formData.status || 'Open',
                href: convertDriveLink((formData.href || '').trim()),
                reserved: formData.reserved || false,
                order: isNaN(Number(formData.order)) ? 0 : Number(formData.order),
            };

            // Only add coverImageUrl if it's not empty/invalid
            if (formData.coverImageUrl && formData.coverImageUrl.trim()) {
                resourceToSave.coverImageUrl = convertDriveLink(formData.coverImageUrl.trim());
            }

            if (!resourceToSave.title) {
                alert("Please enter a title");
                setIsSaving(false);
                return;
            }

            await saveLibraryResource(resourceToSave);
            setEditingResource(null);
            setIsAdding(false);
            setFormData({ order: resources.length, color: 'bg-slate-700', tagColor: 'bg-blue-500' });

            // Brief timeout for the UI to update before allowing close/other actions
            setTimeout(() => {
                alert(editingResource ? "Resource updated!" : "Added to library!");
            }, 100);
        } catch (err) {
            console.error("Save error:", err);
            alert("Failed to save resource. Ensure you are logged in as admin and have a stable connection.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            if (!text) return;

            const lines = text.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
                alert("CSV file seems empty or missing header.");
                return;
            }

            // Simple CSV parser that handles basic commas
            const header = lines[0].split(',').map(h => h.trim().toLowerCase());
            const importedResources: LibraryResource[] = [];

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                if (values.length < header.length && values.length < 1) continue;

                const resourceId = `lib_csv_${Date.now()}_${i}`;
                const resource: any = { id: resourceId };

                header.forEach((key, index) => {
                    let value = values[index];
                    if (value === undefined) return;

                    // Clean value (strip quotes if any)
                    value = value.replace(/^["'](.+)["']$/, '$1');

                    if (key === 'href' || key === 'coverimageurl') {
                        value = convertDriveLink(value.trim());
                    }

                    if (key === 'reserved') {
                        resource[key] = value.toLowerCase() === 'true';
                    } else if (key === 'order') {
                        resource[key] = isNaN(Number(value)) ? 0 : Number(value);
                    } else {
                        resource[key] = value;
                    }
                });
                
                // Defaults for required fields if missing
                if (!resource.title) resource.title = "Untitled Material";
                if (!resource.color) resource.color = "bg-slate-700";
                if (!resource.tagColor) resource.tagColor = "bg-blue-500";
                if (resource.order === undefined) resource.order = resources.length + i;

                importedResources.push(resource as LibraryResource);
            }

            if (importedResources.length > 0) {
                if (window.confirm(`Import ${importedResources.length} materials to library?`)) {
                    setIsSaving(true);
                    try {
                        await bulkSaveLibraryResources(importedResources);
                        alert(`Successfully imported ${importedResources.length} materials!`);
                    } catch (err) {
                        console.error("Bulk import failed:", err);
                        alert("Bulk import failed. Ensure you are an admin.");
                    } finally {
                        setIsSaving(false);
                    }
                }
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this resource?")) {
            try {
                await deleteLibraryResource(id);
            } catch (err) {
                alert("Failed to delete resource");
            }
        }
    };

    const startEdit = (resource: LibraryResource) => {
        setEditingResource(resource);
        setFormData(resource);
        setIsAdding(false);
    };

    const startAdd = () => {
        setIsAdding(true);
        setEditingResource(null);
        setFormData({ order: resources.length + 1, color: 'bg-slate-700', tagColor: 'bg-blue-500' });
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-apple" onClick={onClose}>
            <div
                className="apple-card w-full max-w-4xl max-h-[90vh] bg-[var(--apple-card-bg)] shadow-2xl overflow-hidden flex flex-col border border-[var(--apple-border)]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-8 border-b border-[var(--apple-border)] flex items-center justify-between bg-black/5 dark:bg-white/5">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-2.5 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 dark:hover:bg-white/20 transition-all text-[var(--apple-text-secondary)] hover:text-[var(--apple-text)]">
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-extrabold text-[var(--apple-text)] tracking-tight">Manage Library</h2>
                            <p className="text-[var(--apple-text-secondary)] text-[10px] font-black uppercase tracking-[0.2em] mt-1">Admin Control Panel</p>
                        </div>
                    </div>
                    {!isAdding && !editingResource && (
                        <div className="flex gap-4">
                            <input
                                type="file"
                                id="csv-import-input"
                                accept=".csv"
                                className="hidden"
                                onChange={handleCSVImport}
                            />
                            <button
                                onClick={() => document.getElementById('csv-import-input')?.click()}
                                className="apple-button-secondary px-6 py-3.5 text-xs tracking-widest uppercase flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">upload_file</span> Import CSV
                            </button>
                            <button
                                onClick={startAdd}
                                className="apple-button-primary px-8 py-3.5 text-xs tracking-widest uppercase"
                            >
                                <PlusIcon className="w-4 h-4" /> Add Resource
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {/* Announcement Editor */}
                    {!isAdding && !editingResource && (
                        <div className="mb-10 p-8 bg-[#007AFF]/5 border border-[#007AFF]/20 rounded-[32px] animate-apple">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-2.5 h-2.5 bg-[#007AFF] rounded-full shadow-[0_0_8px_rgba(0,122,255,0.6)] animate-pulse" />
                                <h3 className="text-lg font-extrabold text-[var(--apple-text)] tracking-tight">Global Announcement Ticker</h3>
                            </div>
                            <p className="text-[var(--apple-text-secondary)] text-sm font-medium mb-6">This message will scroll horizontally in the header for all users.</p>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest ml-1">Announcement Title</label>
                                    <input
                                        type="text"
                                        value={announcementTitle}
                                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                                        placeholder="Headline (e.g., New Course Launch)"
                                        className="apple-input bg-black/5 dark:bg-white/5 border-[var(--apple-border)]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest ml-1">Scrolling Message</label>
                                    <textarea
                                        value={announcementText}
                                        onChange={(e) => setAnnouncementText(e.target.value)}
                                        placeholder="Type your announcement here..."
                                        rows={2}
                                        className="apple-input bg-black/5 dark:bg-white/5 border-[var(--apple-border)] resize-none"
                                    />
                                </div>

                                <div className="flex items-center gap-4 p-5 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--apple-border)]">
                                    <input
                                        type="checkbox"
                                        id="sendNotification"
                                        checked={sendPushNotification}
                                        onChange={(e) => setSendPushNotification(e.target.checked)}
                                        className="w-5 h-5 accent-[#007AFF] rounded-md"
                                    />
                                    <label htmlFor="sendNotification" className="text-xs font-bold text-[var(--apple-text)] uppercase tracking-widest cursor-pointer flex items-center gap-2">
                                        <span className="text-lg">📲</span> Send Push Notification to All Users
                                    </label>
                                </div>

                                <button
                                    onClick={handleAnnouncementSave}
                                    disabled={isSavingAnnouncement}
                                    className="apple-button-primary w-full py-4 text-xs tracking-widest uppercase shadow-xl"
                                >
                                    {isSavingAnnouncement ? 'Updating...' : (sendPushNotification ? '📢 Update & Notify All Users' : 'Update Announcement')}
                                </button>
                            </div>
                        </div>
                    )}
                    {isAdding || editingResource ? (
                        <form onSubmit={handleSave} className="space-y-8 animate-apple">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest ml-1">Title</label>
                                    <input
                                        required
                                        value={formData.title || ''}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Chemistry Formula Vault"
                                        className="apple-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest ml-1">Link (URL)</label>
                                    <input
                                        value={formData.href || ''}
                                        onChange={e => setFormData({ ...formData, href: e.target.value })}
                                        placeholder="https://..."
                                        className="apple-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest ml-1">Cover Color (Tailwind class)</label>
                                    <input
                                        value={formData.color || ''}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        placeholder="bg-slate-700"
                                        className="apple-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest ml-1">Accent Color (Tailwind class)</label>
                                    <input
                                        value={formData.tagColor || ''}
                                        onChange={e => setFormData({ ...formData, tagColor: e.target.value })}
                                        placeholder="bg-[#007AFF]"
                                        className="apple-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest ml-1">Status Label</label>
                                    <input
                                        value={formData.status || ''}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        placeholder="Open Drive / Launch Channel"
                                        className="apple-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest ml-1">Display Order</label>
                                    <input
                                        type="number"
                                        value={formData.order || 0}
                                        onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                        className="apple-input"
                                    />
                                </div>
                                <div className="space-y-2 col-span-full">
                                    <label className="text-[10px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest ml-1">Cover Image URL (Recommended: 300x420px)</label>

                                    <div className="flex gap-4">
                                        <input
                                            value={formData.coverImageUrl || ''}
                                            onChange={e => setFormData({ ...formData, coverImageUrl: e.target.value })}
                                            placeholder="https://example.com/cover.jpg"
                                            className="apple-input flex-1"
                                        />
                                        {formData.coverImageUrl && (
                                            <div className="w-20 aspect-[3/4] rounded-xl overflow-hidden border border-[var(--apple-border)] shadow-lg">
                                                <img
                                                    src={formData.coverImageUrl}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-[var(--apple-text-secondary)] ml-1 mt-2 font-medium">Paste a direct image link. Leave empty for default design.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-5 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--apple-border)]">
                                <input
                                    type="checkbox"
                                    id="reserved"
                                    checked={formData.reserved || false}
                                    onChange={e => setFormData({ ...formData, reserved: e.target.checked })}
                                    className="w-5 h-5 accent-[#007AFF] rounded-md"
                                />
                                <label htmlFor="reserved" className="text-xs font-bold text-[var(--apple-text)] uppercase tracking-widest cursor-pointer">Mark as "Coming Soon" (Placeholder)</label>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="apple-button-primary flex-1 py-4 text-xs tracking-widest uppercase shadow-xl"
                                >
                                    {isSaving ? "Saving..." : (editingResource ? "Update Resource" : "Add to Library")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setEditingResource(null); setIsAdding(false); setFormData({}); }}
                                    className="apple-button-secondary px-10 py-4 text-xs tracking-widest uppercase"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4 animate-apple">
                            {resources.sort((a, b) => (a.order || 0) - (b.order || 0)).map(resource => (
                                <div key={resource.id} className="flex items-center justify-between p-6 bg-black/5 dark:bg-white/5 border border-[var(--apple-border)] rounded-[24px] group hover:border-[#007AFF]/30 transition-all hover:bg-black/10 dark:hover:bg-white/10">
                                    <div className="flex items-center gap-6">
                                        <div className={`${resource.color} w-10 aspect-[3/4] rounded shadow-lg border-l-4 border-black/20`} />
                                        <div>
                                            <h3 className="text-[var(--apple-text)] font-extrabold text-base tracking-tight">{resource.title}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[9px] font-black text-[var(--apple-text-secondary)] uppercase tracking-widest">Order: {resource.order}</span>
                                                {resource.reserved && <span className="text-[8px] font-black text-[#FF9500] bg-[#FF9500]/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Coming Soon</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => startEdit(resource)}
                                            className="p-3 bg-black/5 dark:bg-white/10 text-[var(--apple-text-secondary)] hover:text-[#007AFF] hover:bg-[#007AFF]/10 rounded-2xl transition-all"
                                        >
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(resource.id)}
                                            className="p-3 bg-black/5 dark:bg-white/10 text-[var(--apple-text-secondary)] hover:text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-2xl transition-all"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageLibraryModal;
