import React, { useState, useRef, useEffect } from 'react';
import type { FormKB } from '../data/knowledgeBase';
import { getFormIcon } from '../utils/formIcons';
import { IconClose, IconClock, IconCheck, IconArrowRight, IconBot } from './Icons';
import ChatPanel from './ChatPanel';

interface FormModalProps {
    form: FormKB;
    onClose: () => void;
}

type Tab = 'overview' | 'documents' | 'procedure' | 'rejections' | 'rules';

export default function FormModal({ form, onClose }: FormModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [showChat, setShowChat] = useState(false);

    // Close on backdrop click
    const overlayRef = useRef<HTMLDivElement>(null);
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) onClose();
    };

    // Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const tabs: { key: Tab; label: string }[] = [
        { key: 'overview', label: 'Overview' },
        { key: 'documents', label: 'Documents' },
        { key: 'procedure', label: 'Procedure' },
        { key: 'rejections', label: 'Rejection Tips' },
        { key: 'rules', label: 'Rules & Acts' },
    ];

    return (
        <div ref={overlayRef} onClick={handleOverlayClick} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', animation: 'fadeIn 0.25s ease',
        }}>
            <div style={{
                width: '100%', maxWidth: showChat ? '980px' : '720px',
                maxHeight: '90vh', borderRadius: '24px',
                background: 'var(--modal-bg)', border: '1px solid var(--clr-border-2)',
                boxShadow: 'var(--shadow-lg)',
                animation: 'scaleIn 0.3s cubic-bezier(0.34,1.4,0.64,1)',
                display: 'flex', overflow: 'hidden', transition: 'max-width 0.4s ease',
            }}>

                {/* Main Form Content */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    {/* Header */}
                    <div style={{
                        padding: '1.75rem 2rem 0',
                        background: `linear-gradient(135deg, ${form.color}14 0%, transparent 60%)`,
                        borderBottom: '1px solid var(--clr-border)',
                        flexShrink: 0,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{
                                    width: '52px', height: '52px', borderRadius: '14px',
                                    background: `${form.color}22`, border: `1px solid ${form.color}44`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    {getFormIcon(form.icon, 26, form.color)}
                                </div>
                                <div>
                                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: 'var(--clr-text-primary)', marginBottom: '0.2rem' }}>{form.name}</h2>
                                    <span style={{
                                        fontSize: '0.78rem', padding: '0.2rem 0.65rem', borderRadius: '20px',
                                        background: `${form.color}18`, color: form.color,
                                        border: `1px solid ${form.color}30`,
                                    }}>{form.department}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <button
                                    onClick={() => setShowChat(p => !p)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                        padding: '0.55rem 1rem', borderRadius: '10px',
                                        background: showChat ? 'rgba(79,142,247,0.2)' : 'rgba(79,142,247,0.1)',
                                        border: '1px solid rgba(79,142,247,0.3)', color: '#7eb3ff',
                                        cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-body)',
                                    }}
                                >
                                    <IconBot size={15} />
                                    AI Assistant
                                </button>
                                <button onClick={onClose} style={{
                                    width: '36px', height: '36px', borderRadius: '10px',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'var(--clr-text-secondary)', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <IconClose size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Meta Info Strip */}
                        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.83rem', color: 'var(--clr-text-secondary)' }}>
                                <IconClock size={14} color="var(--clr-primary)" />
                                {form.processingTime}
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', fontSize: '0.83rem', color: 'var(--clr-text-secondary)' }}>
                                <IconArrowRight size={14} color="var(--clr-accent)" />
                                {form.submissionLocation}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '-1px', overflowX: 'auto' }}>
                            {tabs.map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => setActiveTab(t.key)}
                                    style={{
                                        padding: '0.6rem 1rem', fontSize: '0.85rem', fontFamily: 'var(--font-body)',
                                        fontWeight: activeTab === t.key ? 600 : 400,
                                        color: activeTab === t.key ? 'var(--clr-primary)' : 'var(--clr-text-muted)',
                                        background: 'transparent', border: 'none', cursor: 'pointer',
                                        borderBottom: activeTab === t.key ? `2px solid var(--clr-primary)` : '2px solid transparent',
                                        transition: 'all 0.2s', whiteSpace: 'nowrap',
                                    }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', background: 'var(--modal-bg)' }} className="chat-scroll">
                        {activeTab === 'overview' && (
                            <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                                <p style={{ color: 'var(--clr-text-secondary)', lineHeight: 1.8, marginBottom: '1.5rem', fontSize: '0.95rem' }}>{form.purpose}</p>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Critical Fields</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {form.criticalFields.map((f, i) => (
                                        <div key={i} style={{ padding: '0.9rem 1rem', borderRadius: '12px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fbbf24', marginBottom: '0.25rem' }}>⚠ {f.field}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-secondary)' }}>{f.warning}</div>
                                        </div>
                                    ))}
                                </div>
                                {form.grievances.length > 0 && (
                                    <>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem', marginTop: '1.5rem' }}>Practical Tips</h4>
                                        {form.grievances.map((g, i) => (
                                            <div key={i} style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(6,214,160,0.06)', border: '1px solid rgba(6,214,160,0.15)', marginBottom: '0.6rem' }}>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-secondary)', marginBottom: '0.4rem' }}>❓ {g.issue}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 500 }}>✅ {g.tip}</div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'documents' && (
                            <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                                <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-muted)', marginBottom: '1.25rem' }}>Prepare originals + photocopies of all documents listed below.</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {form.requiredDocuments.map((doc, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(79,142,247,0.15)', border: '1px solid rgba(79,142,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <IconCheck size={12} color="var(--clr-primary)" strokeWidth={3} />
                                            </div>
                                            <span style={{ fontSize: '0.9rem', color: 'var(--clr-text-secondary)' }}>{doc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'procedure' && (
                            <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                    {form.procedure.map((step, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '1rem', paddingBottom: i < form.procedure.length - 1 ? '1.5rem' : 0 }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${form.color}22`, border: `2px solid ${form.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: form.color, flexShrink: 0 }}>
                                                    {i + 1}
                                                </div>
                                                {i < form.procedure.length - 1 && <div style={{ width: 2, flex: 1, background: `${form.color}25`, marginTop: '4px' }} />}
                                            </div>
                                            <div style={{ paddingTop: '0.4rem', paddingBottom: '0.25rem' }}>
                                                <p style={{ fontSize: '0.92rem', color: 'var(--clr-text-secondary)', lineHeight: 1.65 }}>{step}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'rejections' && (
                            <div style={{ animation: 'fadeInUp 0.3s ease', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {form.rejectionReasons.map((r, i) => (
                                    <div key={i} style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f87171', marginBottom: '0.35rem' }}>✕ {r.title}</div>
                                        <div style={{ fontSize: '0.87rem', color: 'var(--clr-text-secondary)', lineHeight: 1.6 }}>{r.detail}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'rules' && (
                            <div style={{ animation: 'fadeInUp 0.3s ease', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {form.technicalRules.map((rule, i) => (
                                    <div key={i} style={{ padding: '0.9rem 1rem', borderRadius: '12px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.18)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.8rem', paddingTop: '2px', flexShrink: 0 }}>§{i + 1}</span>
                                        <span style={{ fontSize: '0.87rem', color: 'var(--clr-text-secondary)', lineHeight: 1.7 }}>{rule}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Sidebar */}
                {showChat && (
                    <div style={{
                        width: '360px', flexShrink: 0, borderLeft: '1px solid var(--clr-border)',
                        display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.3s ease',
                    }}>
                        <ChatPanel
                            selectedFormId={form.id}
                            onClose={() => setShowChat(false)}
                            onFormChange={() => { }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
