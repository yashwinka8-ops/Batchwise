
import React, { useState, useMemo, useCallback } from 'react';
import { Batch } from '../types';

/* ── Styles injected once via <style> tag ── */
const MARKETPLACE_STYLES = `
.mp-root {
    max-width: 80rem;
    margin: 0 auto;
    padding: 1rem 1.5rem 6rem;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
@media (min-width: 768px) { .mp-root { padding: 1.5rem 1.5rem 1.5rem; } }

.mp-title { font-size: clamp(22px, 4vw, 32px); font-weight: 800; color: #fff; letter-spacing: -0.03em; line-height: 1.1; margin-bottom: 6px; }
.mp-subtitle { font-size: 14px; color: rgba(255,255,255,0.4); font-weight: 400; max-width: 480px; line-height: 1.6; }

.mp-search-wrap { position: relative; margin-bottom: 16px; }
.mp-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.25); font-size: 20px; pointer-events: none; }
.mp-search {
    width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; padding: 13px 16px 13px 44px; color: #fff; font-size: 13px; font-weight: 500; outline: none;
}
.mp-search:focus { border-color: rgba(255,255,255,0.12); }

.mp-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 24px; }
.mp-filter-btn {
    padding: 7px 16px; border-radius: 8px; font-size: 12px; font-weight: 600;
    border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.03);
    color: rgba(255,255,255,0.45); cursor: pointer; transition: all 0.15s;
}
.mp-filter-btn:hover { border-color: rgba(255,255,255,0.12); color: rgba(255,255,255,0.6); }
.mp-filter-btn.active { border-color: var(--primary); background: var(--primary); color: #fff; }

.mp-sort-wrap { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.mp-sort-label { font-size: 11px; color: rgba(255,255,255,0.3); font-weight: 600; }
.mp-sort-select {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px; font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.5);
    padding: 6px 10px; cursor: pointer; outline: none; transition: border-color 0.15s;
}
.mp-sort-select:focus { border-color: var(--primary); }

.mp-active-tag {
    display: flex; align-items: center; gap: 6px; padding: 6px 12px;
    background: rgba(var(--primary-rgb), 0.1); border: 1px solid rgba(var(--primary-rgb), 0.2);
    border-radius: 10px; color: var(--primary); font-size: 10px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.1em;
}
.mp-tag-close { display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0.7; transition: opacity 0.15s; }
.mp-tag-close:hover { opacity: 1; }

.mp-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 768px) { .mp-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1280px) { .mp-grid { grid-template-columns: repeat(3, 1fr); } }

/* ── Card ── */
.mp-card {
    border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); background: rgba(255,255,255,0.02);
    overflow: hidden; cursor: pointer; display: flex; flex-direction: column;
    transition: border-color 0.2s, background 0.2s; contain: layout style paint;
}
.mp-card:hover { border-color: rgba(var(--primary-rgb, 99,102,241), 0.25); background: rgba(255,255,255,0.03); }

.mp-card-banner {
    height: 100px; padding: 16px; display: flex; align-items: flex-end; justify-content: space-between;
    position: relative; background: linear-gradient(135deg, rgba(var(--primary-rgb, 99,102,241), 0.15), rgba(99,102,241, 0.05));
}
.mp-card-badge {
    position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.4);
    padding: 3px 10px; border-radius: 6px; font-size: 10px; font-weight: 600;
    color: rgba(255,255,255,0.7); text-transform: capitalize;
}
.mp-card-icon {
    width: 40px; height: 40px; border-radius: 10px; background: #0a0a0a;
    border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center;
    justify-content: center; overflow: hidden;
}
.mp-card-icon img { width: 100%; height: 100%; object-fit: cover; }

.mp-card-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
.mp-card-name { font-size: 16px; font-weight: 700; color: #fff; line-height: 1.3; margin-bottom: 6px; }
.mp-card-creator { display: flex; align-items: center; gap: 8px; }
.mp-card-avatar {
    width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.06); overflow: hidden; flex-shrink: 0;
}
.mp-card-avatar img { width: 100%; height: 100%; object-fit: cover; }
.mp-card-creator-name { font-size: 12px; color: rgba(255,255,255,0.35); font-weight: 500; }

.mp-card-stats {
    display: flex; gap: 16px; padding: 10px 0;
    border-top: 1px solid rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.04);
}
.mp-stat-label { font-size: 10px; color: rgba(255,255,255,0.3); font-weight: 600; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.04em; }
.mp-stat-val { font-size: 12px; font-weight: 700; color: #fff; }
.mp-stat-right { padding-left: 16px; border-left: 1px solid rgba(255,255,255,0.04); }

.mp-progress-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; }
.mp-progress-fill { height: 100%; background: #10b981; border-radius: 2px; }

.mp-card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; }
.mp-card-lectures { font-size: 13px; font-weight: 700; color: #fff; }
.mp-demo-dot { width: 5px; height: 5px; border-radius: 50%; background: #10b981; }
.mp-demo-label { font-size: 10px; font-weight: 600; color: #10b981; }

.mp-view-btn {
    display: flex; align-items: center; gap: 6px; background: var(--primary); color: #fff;
    padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
    border: none; cursor: pointer; transition: opacity 0.15s;
}
.mp-view-btn:hover { opacity: 0.9; }

/* ── Create card ── */
.mp-create-card {
    border-radius: 16px; border: 2px dashed rgba(255,255,255,0.06); display: flex;
    flex-direction: column; align-items: center; justify-content: center; padding: 32px;
    gap: 12px; min-height: 200px; text-align: center; cursor: pointer; transition: background 0.2s;
}
.mp-create-card:hover { background: rgba(255,255,255,0.02); }
.mp-create-icon {
    width: 44px; height: 44px; border-radius: 12px; background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center;
}

.mp-empty { text-align: center; padding: 60px 20px; }
`;

/* ── Memoized Batch Card ── */
interface BatchCardProps {
    batch: Batch;
    onImport: (batch: Batch) => void;
}

const getDirectDriveUrl = (url?: string) => {
    if (!url) return undefined;
    const trimmedUrl = url.trim();
    const driveMatch = trimmedUrl.match(/\/(?:file\/d\/|open\?id=)([^/?]+)/);
    if (driveMatch && driveMatch[1]) {
        return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    }
    return trimmedUrl;
};

const BatchCard = React.memo<BatchCardProps>(({ batch, onImport }) => {
    let lectureCount = 0;
    batch.subjects?.forEach(s => s.chapters?.forEach(c => lectureCount += c.lectures?.length || 0));
    // Use real avgCompletion from Firestore; show 0 if not yet computed
    const completion = typeof batch.avgCompletion === 'number' ? batch.avgCompletion : 0;
    const hasAvgData = typeof batch.avgCompletion === 'number';
    // enrolledCount is the live member count; importCount is total historical imports
    const enrolledCount = (batch as any).enrolledCount ?? batch.importCount ?? 0;
    const hasDemo = batch.subjects?.some(s => s.chapters.some(c => c.lectures.some(l => l.isDemo)));

    const handleClick = useCallback(() => onImport(batch), [batch, onImport]);
    const handleBtnClick = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onImport(batch); }, [batch, onImport]);

    const bannerUrl = getDirectDriveUrl(batch.theme?.coverImage);

    return (
        <div className="mp-card" onClick={handleClick}>
            <div 
                className="mp-card-banner"
                style={bannerUrl ? { 
                    backgroundImage: `linear-gradient(to bottom, transparent, rgba(0,0,0,0.4)), url(${bannerUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                } : {}}
            >
                {batch.difficulty && <span className="mp-card-badge">{batch.difficulty}</span>}
                {!bannerUrl && (
                    <div className="mp-card-icon">
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>school</span>
                    </div>
                )}
            </div>

            <div className="mp-card-body">
                <div>
                    <h3 className="mp-card-name">{batch.name}</h3>
                    <div className="mp-card-creator">
                        <div className="mp-card-avatar">
                            {batch.creatorAvatar && <img src={batch.creatorAvatar} alt="" loading="lazy" />}
                        </div>
                        <span className="mp-card-creator-name">{batch.creatorName || 'Unknown Creator'}</span>
                    </div>
                </div>

                <div className="mp-card-stats">
                    <div style={{ flex: 1 }}>
                        <p className="mp-stat-label">Avg Completion</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="mp-stat-val">{hasAvgData ? `${completion}%` : '—'}</span>
                            {hasAvgData && (
                                <div className="mp-progress-bar">
                                    <div className="mp-progress-fill" style={{ width: `${completion}%` }} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mp-stat-right">
                        <p className="mp-stat-label">Students</p>
                        <span className="mp-stat-val">{enrolledCount.toLocaleString()}</span>
                    </div>
                </div>

                <div className="mp-card-footer">
                    <div>
                        <span className="mp-card-lectures">{batch.totalQuestions || lectureCount || 0} lectures</span>
                        {hasDemo && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                                <div className="mp-demo-dot" />
                                <span className="mp-demo-label">Demo available</span>
                            </div>
                        )}
                    </div>
                    <button className="mp-view-btn" onClick={handleBtnClick}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                        View
                    </button>
                </div>
            </div>
        </div>
    );
});

/* ── Main Component ── */
interface MarketplaceViewProps {
    batches: Batch[];
    onImport: (batch: Batch) => void;
    onBack: () => void;
}

const MarketplaceView: React.FC<MarketplaceViewProps> = ({ batches, onImport, onBack }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [sortBy, setSortBy] = useState('Most Popular');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filters = ['Foundation', 'Advanced', 'Beginner', 'Olympiad'];

    const filteredBatches = useMemo(() => {
        return batches.filter(batch => {
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = !query ||
                batch.name.toLowerCase().includes(query) ||
                batch.creatorName?.toLowerCase().includes(query) ||
                batch.category?.toLowerCase().includes(query) ||
                batch.description?.toLowerCase().includes(query);

            if (activeFilter === 'All') return matchesSearch;

            const c = (batch.category || '').toLowerCase();
            const f = activeFilter.toLowerCase();
            let catMatch = c.includes(f);
            if (!catMatch) {
                if (f === 'jee' && (c.includes('engineering') || c.includes('iit'))) catMatch = true;
                if (f === 'neet' && (c.includes('medical') || c.includes('bio'))) catMatch = true;
                if (f === 'foundation' && (c.includes('k-10') || c.includes('school'))) catMatch = true;
                if (f === 'olympiad' && (c.includes('kvpy') || c.includes('ntse'))) catMatch = true;
            }
            return matchesSearch && catMatch;
        }).sort((a, b) => {
            if (sortBy === 'Most Popular') return (b.importCount || 0) - (a.importCount || 0);
            if (sortBy === 'Newest First') return new Date(b.sharedAt || 0).getTime() - new Date(a.sharedAt || 0).getTime();
            if (sortBy === 'Completion Rate') return (b.avgCompletion || 0) - (a.avgCompletion || 0);
            return 0;
        });
    }, [batches, searchQuery, activeFilter, sortBy]);

    return (
        <div className="mp-root">
            <style>{MARKETPLACE_STYLES}</style>

            <div style={{ marginBottom: 28 }}>
                <h1 className="mp-title">Discover Batches</h1>
                <p className="mp-subtitle">Browse community-shared study materials and import them into your library.</p>
            </div>

            <div className="mp-search-wrap">
                <span className="material-symbols-outlined mp-search-icon">search</span>
                <input
                    type="text"
                    placeholder="Search batches, topics, or creators…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="mp-search"
                />
            </div>

            <div className="flex items-center gap-3 mb-6">
                <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${isFilterOpen ? 'bg-[var(--primary)] border-[var(--primary)] text-white' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'}`}
                >
                    <span className="material-symbols-outlined text-lg">{isFilterOpen ? 'filter_list_off' : 'filter_list'}</span>
                    {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
                </button>
                
                {activeFilter !== 'All' && (
                    <div className="mp-active-tag animate-apple">
                        <span>{activeFilter}</span>
                        <div className="mp-tag-close" onClick={() => setActiveFilter('All')}>
                            <span className="material-symbols-outlined text-sm">close</span>
                        </div>
                    </div>
                )}

                <div className="mp-sort-wrap">
                    <span className="mp-sort-label">Sort:</span>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="mp-sort-select">
                        <option>Most Popular</option>
                        <option>Newest First</option>
                        <option>Completion Rate</option>
                    </select>
                </div>
            </div>

            {isFilterOpen && (
                <div className="mp-filters animate-apple pb-2 overflow-x-auto no-scrollbar">
                    {['All', ...filters].map(f => (
                        <button
                            key={f}
                            onClick={() => { setActiveFilter(f); setIsFilterOpen(false); }}
                            className={`mp-filter-btn${activeFilter === f ? ' active' : ''}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            )}

            <div className="mp-grid">
                {filteredBatches.map(batch => (
                    <BatchCard key={batch.id} batch={batch} onImport={onImport} />
                ))}

                <div className="mp-create-card">
                    <div className="mp-create-icon">
                        <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'rgba(255,255,255,0.3)' }}>add</span>
                    </div>
                    <div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Create a Batch</h3>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', maxWidth: 200, lineHeight: 1.5 }}>
                            Share your study materials with the community.
                        </p>
                    </div>
                </div>
            </div>

            {filteredBatches.length === 0 && (
                <div className="mp-empty">
                    <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'rgba(255,255,255,0.1)', marginBottom: 12, display: 'block' }}>search_off</span>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>No batches found matching your search.</p>
                </div>
            )}
        </div>
    );
};

export default MarketplaceView;
