import React from 'react';

interface AdminPanelProps {
    adminName: string;
    adminSamosas: number;
    adminMsg: string;
    onNameChange: (val: string) => void;
    onSamosasChange: (val: number) => void;
    onMsgChange: (val: string) => void;
    onSubmit: () => void;
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '10px 14px',
    color: '#fff',
    fontSize: 13,
    outline: 'none',
};

const AdminPanel: React.FC<AdminPanelProps> = ({
    adminName,
    adminSamosas,
    adminMsg,
    onNameChange,
    onSamosasChange,
    onMsgChange,
    onSubmit,
}) => {
    return (
        <section
            style={{
                padding: 24,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(239,68,68,0.15)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(239,68,68,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ef4444' }}>
                        admin_panel_settings
                    </span>
                </div>
                <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Add Shoutout</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Admin only — add contributor recognition</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input
                        placeholder="Contributor name"
                        value={adminName}
                        onChange={e => onNameChange(e.target.value)}
                        style={inputStyle}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            type="number"
                            placeholder="Count"
                            value={adminSamosas}
                            onChange={e => onSamosasChange(parseInt(e.target.value) || 1)}
                            style={{ ...inputStyle, flex: 1 }}
                        />
                        <button
                            onClick={onSubmit}
                            style={{
                                padding: '10px 20px',
                                background: '#ef4444',
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 600,
                                borderRadius: 10,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                            Add
                        </button>
                    </div>
                </div>
                <textarea
                    placeholder="Optional message"
                    value={adminMsg}
                    onChange={e => onMsgChange(e.target.value)}
                    style={{ ...inputStyle, resize: 'none', minHeight: 80 }}
                />
            </div>
        </section>
    );
};

export default AdminPanel;
