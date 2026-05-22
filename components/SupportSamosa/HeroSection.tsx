import React from 'react';

const FEATURES = [
    { icon: 'dns', label: 'Server & Infrastructure', desc: 'Hosting, database, and CDN costs' },
    { icon: 'shield', label: 'Security & Reliability', desc: 'Encrypted data and 99.9% uptime' },
    { icon: 'build', label: 'New Features', desc: 'Community-requested improvements' },
] as const;

const HeroSection: React.FC = () => {
    return (
        <div className="space-y-10">
            {/* Headline */}
            <div>
                <h1
                    style={{
                        fontSize: 'clamp(28px, 5vw, 52px)',
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.05,
                        color: '#fff',
                        marginBottom: 16,
                    }}
                >
                    Help us build{' '}
                    <span style={{ color: '#f59e0b' }}>better tools</span>
                    <br />
                    for your preparation.
                </h1>
                <p
                    style={{
                        fontSize: 15,
                        lineHeight: 1.7,
                        color: 'rgba(255,255,255,0.45)',
                        maxWidth: 520,
                        fontWeight: 400,
                    }}
                >
                    Every ₹10 contribution helps us maintain servers, build new features, and keep study
                    materials accessible. Think of it as buying a samosa for the dev team.
                </p>
            </div>

            {/* QR + Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* QR Code */}
                <div>
                    <div
                        style={{
                            background: '#ffffff',
                            padding: 20,
                            borderRadius: 20,
                            display: 'inline-block',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)',
                        }}
                    >
                        <img
                            src="/my_qr.png"
                            style={{ width: 200, height: 200, borderRadius: 8, display: 'block' }}
                            alt="UPI QR Code"
                        />
                    </div>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 12, fontWeight: 500 }}>
                        Scan with any UPI app to contribute
                    </p>
                </div>

                {/* Feature list */}
                <div style={{ paddingTop: 4 }}>
                    <h3
                        style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'rgba(255,255,255,0.5)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            marginBottom: 20,
                        }}
                    >
                        Your support powers
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {FEATURES.map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                <div
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 8,
                                        background: 'rgba(245,158,11,0.08)',
                                        border: '1px solid rgba(245,158,11,0.12)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#f59e0b' }}>
                                        {item.icon}
                                    </span>
                                </div>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
                                        {item.label}
                                    </p>
                                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2, lineHeight: 1.4 }}>
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroSection;
