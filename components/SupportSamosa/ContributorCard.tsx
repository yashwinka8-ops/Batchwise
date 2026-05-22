import React from 'react';
import type { Shoutout } from './types';

const formatDate = (timestamp: any): string => {
    try {
        const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return '';
    }
};

const getAvatarHue = (name: string): number => (name.charCodeAt(0) * 37) % 360;

const ContributorCard: React.FC<{ shoutout: Shoutout }> = ({ shoutout }) => {
    const hue = getAvatarHue(shoutout.name);

    return (
        <div
            style={{
                padding: '14px 16px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                transition: 'background 0.2s, border-color 0.2s',
                cursor: 'default',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.borderColor = 'rgba(245,158,11,0.12)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 9,
                            background: `hsl(${hue}, 45%, 18%)`,
                            border: `1px solid hsl(${hue}, 45%, 28%)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 13,
                            fontWeight: 700,
                            color: `hsl(${hue}, 55%, 65%)`,
                            flexShrink: 0,
                        }}
                    >
                        {shoutout.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
                            {shoutout.name}
                        </p>
                        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>
                            {formatDate(shoutout.timestamp)}
                        </p>
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 10px',
                        borderRadius: 8,
                        background: 'rgba(245,158,11,0.08)',
                        flexShrink: 0,
                    }}
                >
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>
                        {shoutout.samosas}
                    </span>
                    <span style={{ fontSize: 13 }}>🥟</span>
                </div>
            </div>
            {shoutout.message && (
                <p
                    style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.4)',
                        marginTop: 10,
                        marginLeft: 44,
                        lineHeight: 1.55,
                        borderLeft: '2px solid rgba(245,158,11,0.2)',
                        paddingLeft: 10,
                        fontStyle: 'italic',
                    }}
                >
                    "{shoutout.message}"
                </p>
            )}
        </div>
    );
};

export default ContributorCard;
