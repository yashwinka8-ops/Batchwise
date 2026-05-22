import React, { useState, useCallback } from 'react';
import { Batch } from '../types';
import { requestAccessToBatch } from '../services/firestoreService';

const STYLES = `
.blv { max-width: 68rem; margin: 0 auto; padding: 1rem 1rem 6rem; font-family: 'Inter', -apple-system, sans-serif; }
@media (min-width: 768px) { .blv { padding: 2rem 2rem 2rem; } }

.blv-back { display: inline-flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.35); font-size: 13px; font-weight: 500; margin-bottom: 20px; background: none; border: none; cursor: pointer; padding: 4px 0; transition: color .15s; }
.blv-back:hover { color: #fff; }

/* Banner */
.blv-banner { width: 100%; height: 160px; border-radius: 16px; overflow: hidden; margin-bottom: 20px; position: relative; }
@media (min-width: 768px) { .blv-banner { height: 220px; margin-bottom: 24px; } }
.blv-banner img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.4); }
.blv-banner-grad { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%); }
.blv-banner-inner { position: absolute; bottom: 20px; left: 20px; right: 20px; }
.blv-banner h1 { font-size: clamp(20px, 5vw, 36px); font-weight: 800; color: #fff; letter-spacing: -0.025em; line-height: 1.1; }
.blv-banner p { font-size: 12px; color: rgba(255,255,255,0.55); margin-top: 6px; font-weight: 500; }

/* Layout */
.blv-layout { display: flex; flex-direction: column; gap: 20px; }
@media (min-width: 1024px) { .blv-layout { display: grid; grid-template-columns: 1fr 340px; gap: 32px; align-items: start; } }

/* Info Panel */
.blv-info { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 20px; }
@media (min-width: 768px) { .blv-info { padding: 32px; } }
.blv-info-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.blv-info-thumb { width: 48px; height: 48px; border-radius: 12px; background: #0a0a0a; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; flex-shrink: 0; }
.blv-info-thumb img { width: 100%; height: 100%; object-fit: cover; }
.blv-info-name { font-size: clamp(18px, 4vw, 26px); font-weight: 800; color: #fff; letter-spacing: -0.02em; line-height: 1.2; }
.blv-info-creator { font-size: 12px; color: rgba(255,255,255,0.35); font-weight: 500; margin-top: 2px; }

/* Stats */
.blv-stats { display: flex; border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); margin: 24px 0; padding: 16px 0; }
.blv-stat { flex: 1; text-align: center; }
.blv-stat + .blv-stat { border-left: 1px solid rgba(255,255,255,0.05); }
.blv-stat-label { font-size: 9px; color: rgba(255,255,255,0.25); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
.blv-stat-val { font-size: 15px; font-weight: 800; color: #fff; }
.blv-stat-val.green { color: #10b981; }

/* Description */
.blv-desc-label { font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
.blv-desc { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.7; white-space: pre-wrap; }

/* Action Card */
.blv-action { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; width: 100%; }
@media (min-width: 1024px) { .blv-action { position: sticky; top: 100px; } }

.blv-price-row { text-align: center; margin-bottom: 24px; }
.blv-price-label { font-size: 10px; color: rgba(255,255,255,0.3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
.blv-price { font-size: 42px; font-weight: 900; letter-spacing: -0.04em; line-height: 1; color: #fff; }
.blv-price.free { color: #10b981; }

.blv-cta { width: 100%; padding: 14px; border-radius: 12px; font-weight: 800; font-size: 14px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
.blv-cta:active { transform: scale(0.98); }
.blv-cta.primary { background: var(--primary); color: #fff; box-shadow: 0 4px 12px rgba(var(--primary-rgb, 218, 11, 11), 0.3); }
.blv-cta.outline { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); margin-top: 10px; }
.blv-cta.pay { background: #10b981; color: #fff; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
.blv-cta.request { background: rgba(255,255,255,0.04); border: 1px solid rgba(var(--primary-rgb,218,11,11), 0.2); color: var(--primary); }
.blv-cta.success { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); color: #10b981; }
.blv-cta:disabled { opacity: 0.5; cursor: default; transform: none; }

.blv-hint { font-size: 11px; color: rgba(255,255,255,0.25); text-align: center; line-height: 1.6; margin-top: 8px; }
.blv-sep { height: 1px; background: rgba(255,255,255,0.06); margin: 20px 0; }

.blv-perks { display: flex; flex-direction: column; gap: 10px; }
.blv-perk { display: flex; align-items: center; gap: 10px; }
.blv-perk-icon { width: 28px; height: 28px; border-radius: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.blv-perk span:last-child { font-size: 12px; color: rgba(255,255,255,0.4); font-weight: 500; }

/* Contact Modal */
.blv-overlay { position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; background: rgba(0,0,0,0.8); backdrop-blur: 4px; }
.blv-modal { width: 100%; max-width: 420px; background: #0d0f14; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
.blv-modal-head { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; }
.blv-modal-body { padding: 20px; }
.blv-modal-ta { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px; color: #fff; font-size: 14px; resize: none; outline: none; line-height: 1.6; margin-bottom: 16px; }
.blv-modal-send { width: 100%; padding: 14px; background: var(--primary); color: #fff; border-radius: 12px; font-weight: 700; font-size: 14px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
.blv-modal-send:hover { opacity: 0.9; }

/* Video Modal */
.blv-video-bg { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,0.92); }
.blv-video { width: 100%; max-width: 880px; aspect-ratio: 16/9; border-radius: 14px; background: #0a0a0a; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; position: relative; }
.blv-video-x { position: absolute; top: 10px; right: 10px; z-index: 10; width: 34px; height: 34px; border-radius: 8px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.blv-video iframe { width: 100%; height: 100%; border: none; }
`;

interface BatchLandingViewProps {
    batch: Batch;
    currentUser: any;
    onBack: () => void;
    onImportFree: (batch: Batch) => void;
    isEnrolled?: boolean;
    onProceed?: () => void;
}

const BatchLandingView: React.FC<BatchLandingViewProps> = ({ batch, currentUser, onBack, onImportFree, isEnrolled, onProceed }) => {
    const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [previewVideo, setPreviewVideo] = useState<string | null>(null);
    const [showContactModal, setShowContactModal] = useState(false);

    const handleRequestAccess = useCallback(async () => {
        if (!currentUser) { alert("Please log in to request access."); return; }
        setRequestStatus('loading');
        try {
            await requestAccessToBatch(batch, currentUser);
            setRequestStatus('success');
            alert("Access request sent! The batch owner will review it shortly.");
        } catch (error) {
            console.error(error);
            setRequestStatus('error');
            alert("Failed to send request. Please try again.");
        }
    }, [batch, currentUser]);

    const isPaid = (batch.price && batch.price > 0) || false;
    const requireApproval = batch.requireApproval === true;

    let totalLectures = 0;
    batch.subjects.forEach(s => s.chapters.forEach(c => totalLectures += c.lectures.length));

    // Collect demo lectures
    const demos: { title: string; url: string; subject: string }[] = [];
    batch.subjects.forEach(s => s.chapters.forEach(c => c.lectures.forEach(l => {
        if ((l.isDemo || l.isFreePreview) && l.youtubeUrl) demos.push({ title: l.title, url: l.youtubeUrl, subject: s.name });
    })));

    return (
        <div className="blv">
            <style>{STYLES}</style>

            <button className="blv-back" onClick={onBack}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
                Back
            </button>

            {/* Banner */}
            {batch.enableLandingPage && (
                <div className="blv-banner">
                    <img src={batch.theme?.coverImage || "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2670&auto=format&fit=crop"} alt="" loading="lazy" />
                    <div className="blv-banner-grad" />
                    <div className="blv-banner-inner">
                        <h1>{batch.name}</h1>
                        <p>by {batch.creatorName || 'Unknown'} · {(batch.importCount || 0).toLocaleString()} enrolled</p>
                    </div>
                </div>
            )}

            <div className="blv-layout">
                {/* ── Left: Info ── */}
                <div className="blv-info">
                    {!batch.enableLandingPage && (
                        <div className="blv-info-header">
                            <div className="blv-info-thumb">
                                <img src={batch.theme?.coverImage || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=200&auto=format&fit=crop"} alt="" loading="lazy" />
                            </div>
                            <div>
                                <div className="blv-info-name">{batch.name}</div>
                                <div className="blv-info-creator">by {batch.creatorName || 'Unknown'}</div>
                            </div>
                        </div>
                    )}

                    {batch.syllabusHighlights && batch.syllabusHighlights.length > 0 && (
                        <div className="blv-tags">
                            {batch.syllabusHighlights.map((h, i) => (
                                <span key={i} className="blv-tag">
                                    <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--primary)' }}>check_circle</span>
                                    {h}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="blv-stats">
                        <div className="blv-stat">
                            <div className="blv-stat-label">Difficulty</div>
                            <div className="blv-stat-val" style={{ textTransform: 'capitalize' }}>{batch.difficulty || 'Advanced'}</div>
                        </div>
                        <div className="blv-stat">
                            <div className="blv-stat-label">Lectures</div>
                            <div className="blv-stat-val">{batch.totalQuestions || totalLectures}</div>
                        </div>
                        <div className="blv-stat">
                            <div className="blv-stat-label">Subjects</div>
                            <div className="blv-stat-val">{batch.subjects.length}</div>
                        </div>
                        <div className="blv-stat">
                            <div className="blv-stat-label">Price</div>
                            <div className={`blv-stat-val${isPaid ? '' : ' green'}`}>{isPaid ? `₹${batch.price}` : 'Free'}</div>
                        </div>
                    </div>

                    {(batch.description || batch.aboutHtml) && (
                        <div style={{ marginBottom: demos.length > 0 ? 0 : undefined }}>
                            <div className="blv-desc-label">About</div>
                            <p className="blv-desc">{batch.description || batch.aboutHtml}</p>
                        </div>
                    )}

                    {/* Demo Lectures */}
                    {demos.length > 0 && (
                        <div className="blv-demos">
                            <div className="blv-desc-label">Free Demo Lectures</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {demos.slice(0, 4).map((d, i) => (
                                    <button key={i} className="blv-demo-item" onClick={() => setPreviewVideo(d.url)}>
                                        <div className="blv-demo-play">
                                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#10b981' }}>play_arrow</span>
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="blv-demo-title">{d.title}</div>
                                            <div className="blv-demo-sub">{d.subject}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Right: Action Card ── */}
                <div className="blv-action">
                    <div className="blv-price-row">
                        <div className="blv-price-label">{isEnrolled ? 'Enrolled' : 'Enrollment'}</div>
                        <div className={`blv-price${isPaid ? ' paid' : ' free'}`}>{isPaid ? `₹${batch.price}` : 'Free'}</div>
                    </div>

                    {isEnrolled ? (
                        <button className="blv-cta primary" onClick={onProceed}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>play_arrow</span>
                            Continue Learning
                        </button>
                    ) : !isPaid && !requireApproval ? (
                        <>
                            <button className="blv-cta primary" onClick={() => onImportFree(batch)}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
                                Enroll — Free
                            </button>
                            <button className="blv-cta outline" onClick={() => setShowContactModal(true)}>
                                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>chat</span>
                                Contact Instructor
                            </button>
                        </>
                    ) : (
                        <>
                            {batch.contactLink && isPaid && (
                                <a href={batch.contactLink} target="_blank" rel="noopener noreferrer" className="blv-cta pay" style={{ textDecoration: 'none' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>payments</span>
                                    Pay ₹{batch.price}
                                </a>
                            )}
                            <button
                                className={`blv-cta${requestStatus === 'success' ? ' success' : ' request'}`}
                                onClick={handleRequestAccess}
                                disabled={requestStatus === 'loading' || requestStatus === 'success'}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                    {requestStatus === 'success' ? 'check_circle' : requestStatus === 'loading' ? 'hourglass_empty' : 'lock_open'}
                                </span>
                                {requestStatus === 'loading' ? 'Sending…' : requestStatus === 'success' ? 'Request Sent' : 'Request Access'}
                            </button>
                            <p className="blv-hint">
                                {isPaid && batch.contactLink ? 'Pay via the link above, then request access.' : isPaid ? 'Contact the admin after payment.' : 'The owner will review your request.'}
                            </p>
                            <button className="blv-cta outline" onClick={() => setShowContactModal(true)}>
                                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>chat</span>
                                Contact Instructor
                            </button>
                        </>
                    )}

                    <div className="blv-sep" />

                    <div className="blv-perks">
                        {[
                            { icon: 'verified', text: 'Verified content', color: '#60a5fa' },
                            { icon: 'sync', text: 'Auto-sync updates', color: '#f59e0b' },
                            { icon: 'bar_chart', text: 'Progress tracking', color: 'var(--primary)' },
                        ].map((p, i) => (
                            <div key={i} className="blv-perk">
                                <div className="blv-perk-icon">
                                    <span className="material-symbols-outlined" style={{ fontSize: 13, color: p.color }}>{p.icon}</span>
                                </div>
                                <span>{p.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contact Modal */}
            {showContactModal && (
                <div className="blv-overlay" onClick={() => setShowContactModal(false)}>
                    <div className="blv-modal" onClick={e => e.stopPropagation()}>
                        <div className="blv-modal-head">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div className="blv-modal-av">{batch.creatorName?.charAt(0)?.toUpperCase() || 'A'}</div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{batch.creatorName || 'Admin'}</div>
                                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Batch instructor</div>
                                </div>
                            </div>
                            <button className="blv-modal-x" onClick={() => setShowContactModal(false)}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                            </button>
                        </div>
                        <div className="blv-modal-body">
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const msg = (e.currentTarget.elements.namedItem('message') as HTMLTextAreaElement).value;
                                    if (!msg.trim()) return;
                                    try {
                                        const { sendBatchInquiry } = await import('../services/firestoreService');
                                        await sendBatchInquiry(batch.inviteCode || batch.id, batch.creatorId || 'admin', currentUser, msg);
                                        alert("Message sent!");
                                        setShowContactModal(false);
                                    } catch { alert("Failed to send."); }
                                }}
                                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                            >
                                <textarea name="message" rows={3} placeholder="Write your message…" className="blv-modal-ta" />
                                <button type="submit" className="blv-modal-send">
                                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>send</span>
                                    Send
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Preview */}
            {previewVideo && (
                <div className="blv-video-bg" onClick={() => setPreviewVideo(null)}>
                    <div className="blv-video" onClick={e => e.stopPropagation()}>
                        <button className="blv-video-x" onClick={() => setPreviewVideo(null)}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                        </button>
                        <iframe
                            src={`https://www.youtube.com/embed/${previewVideo.split('v=')[1]?.split('&')[0] || previewVideo.split('/').pop()}`}
                            allowFullScreen allow="autoplay; encrypted-media"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchLandingView;
