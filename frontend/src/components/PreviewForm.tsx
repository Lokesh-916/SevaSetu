import { useState } from 'react';
import { type FormKB } from '../data/knowledgeBase';
import { getFormIcon } from '../utils/formIcons';
import { IconDownload, IconArrowLeft, IconClock, IconArrowRight, IconDocument } from './Icons';

interface PreviewFormProps {
    form: FormKB;
    onBack: () => void;
}

// Map form IDs to their served PDF paths
const PDF_MAP: Record<string, string> = {
    'birth-certificate': '/forms/Birth Certificate.pdf',
    'death-certificate': '/forms/Death Certificate.pdf',
    'ews-certificate': '/forms/EWS Application.pdf',
    'income-certificate': '/forms/Income Certificate.pdf',
    'possession-certificate': '/forms/Possession Certificate.pdf',
    'family-member-certificate': '/forms/family membership certificate.pdf',
};

export default function PreviewForm({ form, onBack }: PreviewFormProps) {
    const pdfUrl = PDF_MAP[form.id];
    const [pdfError, setPdfError] = useState(false);

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            background: 'var(--clr-bg)',
        }}>
            {/* ── Integrated toolbar — same style as rest of app ── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.75rem 1.5rem',
                background: 'var(--sidebar-bg)',
                borderBottom: '1px solid var(--clr-border)',
                flexShrink: 0, gap: '1rem',
            }}>
                {/* Left: back + title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
                    <button
                        onClick={onBack}
                        title="Back to actions"
                        style={{
                            width: 34, height: 34, borderRadius: '9px', flexShrink: 0,
                            background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--clr-text-secondary)', transition: 'all 0.18s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--clr-surface-2)'; e.currentTarget.style.color = 'var(--clr-text-primary)'; e.currentTarget.style.borderColor = 'var(--clr-border-2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--clr-surface)'; e.currentTarget.style.color = 'var(--clr-text-secondary)'; e.currentTarget.style.borderColor = 'var(--clr-border)'; }}
                    >
                        <IconArrowLeft size={16} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '9px', background: `${form.color}14`, border: `1px solid ${form.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {getFormIcon(form.icon, 17, form.color)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--clr-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {form.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <IconClock size={10} color="var(--clr-text-muted)" />
                                {form.processingTime} · {form.department}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: download button */}
                {pdfUrl && !pdfError && (
                    <a
                        href={pdfUrl}
                        download
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.45rem',
                            padding: '0.5rem 1rem', borderRadius: '9px',
                            background: 'var(--gradient-cta)', color: 'white',
                            fontSize: '0.82rem', fontWeight: 600, fontFamily: 'var(--font-body)',
                            textDecoration: 'none',
                            boxShadow: '0 3px 12px rgba(67,97,238,0.3)',
                            transition: 'all 0.2s', flexShrink: 0,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(67,97,238,0.45)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 12px rgba(67,97,238,0.3)'; }}
                    >
                        <IconDownload size={15} color="white" />
                        Download PDF
                    </a>
                )}
            </div>

            {/* ── PDF Area ── */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                {pdfUrl && !pdfError ? (
                    <>
                        {/* subtle inset shadow overlay so PDF doesn't look "pasted" */}
                        <div style={{
                            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
                            boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.08)',
                        }} />
                        <iframe
                            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                            style={{
                                width: '100%', height: '100%', border: 'none',
                                background: 'var(--clr-bg-2)',
                            }}
                            title={`${form.name} blank form`}
                            onError={() => setPdfError(true)}
                        />
                    </>
                ) : (
                    /* ── No PDF fallback — styled like the rest of the UI ── */
                    <div style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: '1.5rem', padding: '3rem 2rem',
                    }}>
                        {/* Icon */}
                        <div style={{
                            width: 72, height: 72, borderRadius: '20px',
                            background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: 'var(--shadow-sm)',
                        }}>
                            <IconDocument size={32} color="var(--clr-text-muted)" />
                        </div>

                        <div style={{ textAlign: 'center', maxWidth: 360 }}>
                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--clr-text-primary)', marginBottom: '0.5rem' }}>
                                PDF Template Not Available
                            </h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--clr-text-secondary)', lineHeight: 1.7 }}>
                                The blank form template for <strong>{form.name}</strong> hasn't been uploaded yet.
                                Download the official form directly from the Meeseva portal.
                            </p>
                        </div>

                        {/* Required docs teaser */}
                        <div style={{
                            width: '100%', maxWidth: 380,
                            padding: '1rem 1.25rem', borderRadius: '14px',
                            background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                        }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.65rem' }}>
                                Required Documents Preview
                            </div>
                            {form.requiredDocuments.slice(0, 4).map((doc, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0', borderTop: i > 0 ? '1px solid var(--clr-border)' : 'none' }}>
                                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: `${form.color}14`, border: `1px solid ${form.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: form.color }} />
                                    </div>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--clr-text-secondary)' }}>{doc}</span>
                                </div>
                            ))}
                            {form.requiredDocuments.length > 4 && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--clr-border)' }}>
                                    +{form.requiredDocuments.length - 4} more documents required
                                </div>
                            )}
                        </div>

                        <a
                            href="https://meeseva.telangana.gov.in"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                                padding: '0.6rem 1.25rem', borderRadius: '10px',
                                background: 'var(--clr-surface)', border: '1px solid var(--clr-border-2)',
                                color: 'var(--clr-primary)', fontSize: '0.85rem', fontWeight: 600,
                                fontFamily: 'var(--font-body)', textDecoration: 'none', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--clr-primary-glow)'; e.currentTarget.style.borderColor = 'var(--clr-primary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--clr-surface)'; e.currentTarget.style.borderColor = 'var(--clr-border-2)'; }}
                        >
                            Visit Meeseva Portal <IconArrowRight size={14} />
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
