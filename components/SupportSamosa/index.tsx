import React, { useState, useEffect } from 'react';
import { firestore } from '../../services/firebase';
import { XIcon } from '../Icons';
import type { SupportSamosaProps, Shoutout } from './types';
import HeroSection from './HeroSection';
import AdminPanel from './AdminPanel';
import ContributorCard from './ContributorCard';

const SupportSamosa: React.FC<SupportSamosaProps> = ({ onClose, user }) => {
    const [shoutouts, setShoutouts] = useState<Shoutout[]>([]);
    const [loading, setLoading] = useState(true);
    const [adminMsg, setAdminMsg] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminSamosas, setAdminSamosas] = useState(1);

    const isAuthority = user?.email === 'yashwinka8@gmail.com';

    useEffect(() => {
        const unsubscribe = firestore.collection('samosa_shoutouts')
            .orderBy('timestamp', 'desc')
            .limit(15)
            .onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shoutout));
                setShoutouts(data);
                setLoading(false);
            });
        return () => unsubscribe();
    }, []);

    const handleAddShoutout = async () => {
        if (!adminName.trim()) return;
        try {
            await firestore.collection('samosa_shoutouts').add({
                name: adminName,
                samosas: adminSamosas,
                message: adminMsg,
                timestamp: new Date()
            });
            setAdminName('');
            setAdminMsg('');
            setAdminSamosas(1);
            alert('Shoutout added successfully.');
        } catch (e) {
            console.error(e);
        }
    };

    const totalSamosas = shoutouts.reduce((sum, s) => sum + (s.samosas || 0), 0);

    return (
        <div
            className="fixed inset-0 z-[2000] overflow-y-auto no-scrollbar"
            style={{
                background: 'linear-gradient(145deg, #0a0a0a 0%, #111111 50%, #0d0d0d 100%)',
                color: '#f5f5f5',
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}
        >
            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
                <div
                    style={{
                        position: 'absolute',
                        top: '-20%',
                        left: '-15%',
                        width: '55%',
                        height: '55%',
                        background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-20%',
                        right: '-15%',
                        width: '50%',
                        height: '50%',
                        background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)',
                    }}
                />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-5 md:px-10 py-6 md:py-10 flex flex-col min-h-full">
                {/* Header */}
                <header className="flex items-center justify-between mb-10 md:mb-14">
                    <div className="flex items-center gap-3">
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <img src="/samosa_nexus.png" style={{ width: 24, height: 24 }} alt="Support" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, color: '#fff' }}>
                                Support Us
                            </h2>
                            <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.35)', lineHeight: 1.3, marginTop: 1 }}>
                                Keep the platform running
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    >
                        <XIcon style={{ color: 'rgba(255,255,255,0.4)', width: 18, height: 18 }} />
                    </button>
                </header>

                <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
                    {/* Left Column */}
                    <div className="lg:col-span-7 space-y-10">
                        <HeroSection />

                        {isAuthority && (
                            <AdminPanel
                                adminName={adminName}
                                adminSamosas={adminSamosas}
                                adminMsg={adminMsg}
                                onNameChange={setAdminName}
                                onSamosasChange={setAdminSamosas}
                                onMsgChange={setAdminMsg}
                                onSubmit={handleAddShoutout}
                            />
                        )}
                    </div>

                    {/* Right Column — Contributors */}
                    <div className="lg:col-span-5 flex flex-col" style={{ gap: 0 }}>
                        {/* Column Header */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingBottom: 16,
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                marginBottom: 16,
                            }}
                        >
                            <div>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
                                    Contributors
                                </h3>
                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                                    People who keep this platform alive
                                </p>
                            </div>
                            {shoutouts.length > 0 && (
                                <div
                                    style={{
                                        padding: '5px 12px',
                                        borderRadius: 8,
                                        background: 'rgba(245,158,11,0.08)',
                                        border: '1px solid rgba(245,158,11,0.12)',
                                    }}
                                >
                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b' }}>
                                        {totalSamosas} 🥟
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Shoutout List */}
                        <div
                            className="flex-1 overflow-y-auto no-scrollbar"
                            style={{ maxHeight: 560, display: 'flex', flexDirection: 'column', gap: 6 }}
                        >
                            {loading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12, opacity: 0.3 }}>
                                    <div
                                        style={{
                                            width: 28,
                                            height: 28,
                                            border: '2px solid rgba(255,255,255,0.1)',
                                            borderTop: '2px solid #f59e0b',
                                            borderRadius: '50%',
                                            animation: 'spin 0.8s linear infinite',
                                        }}
                                    />
                                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Loading…</span>
                                </div>
                            ) : shoutouts.length > 0 ? (
                                shoutouts.map(s => (
                                    <ContributorCard key={s.id} shoutout={s} />
                                ))
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', opacity: 0.25, textAlign: 'center' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 36, marginBottom: 12 }}>
                                        volunteer_activism
                                    </span>
                                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                                        No contributions yet.
                                        <br />
                                        Be the first to support the platform.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div
                            style={{
                                marginTop: 16,
                                padding: '14px 16px',
                                borderRadius: 12,
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.04)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'rgba(245,158,11,0.6)' }}>
                                    info
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                                    How it works
                                </span>
                            </div>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 1.7 }}>
                                All contributions are voluntary. Your name appears on the wall after the lead developer verifies the payment. Payments are processed via UPI and are non-refundable.
                            </p>
                        </div>
                    </div>
                </main>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default SupportSamosa;
