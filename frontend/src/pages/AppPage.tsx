import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FORMS, type FormKB } from '../data/knowledgeBase';
import { getFormIcon } from '../utils/formIcons';
import { IconBot, IconSearch, IconWand, IconEye, IconClock } from '../components/Icons';
import ChatPanel from '../components/ChatPanel';
import VerifyDocument from '../components/VerifyDocument';
import AutoFillForm from '../components/AutoFillForm';
import PreviewForm from '../components/PreviewForm';
import FormModal from '../components/FormModal';
import ThemeToggle from '../components/ThemeToggle';

type ActionType = 'chat' | 'verify' | 'autofill' | 'preview';

interface AppPageProps {
    theme: 'dark' | 'light';
    onToggleTheme: () => void;
}

const PDF_AVAILABLE: Set<string> = new Set([
    'birth-certificate',
    'death-certificate',
    'ews-certificate',
    'income-certificate',
    'possession-certificate',
    'family-member-certificate',
]);

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({
    selectedFormId,
    onSelect,
    onInfo,
}: {
    selectedFormId: string | null;
    onSelect: (form: FormKB) => void;
    onInfo: (form: FormKB) => void;
}) {
    return (
        <div style={{
            width: '240px', flexShrink: 0,
            background: 'var(--sidebar-bg)',
            borderRight: '1px solid var(--sidebar-border)',
            display: 'flex', flexDirection: 'column',
            height: '100%',
        }}>
            <div style={{
                padding: '0.7rem 1rem 0.5rem',
                fontSize: '0.68rem', fontWeight: 700,
                color: 'var(--clr-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.09em',
                borderBottom: '1px solid var(--sidebar-border)',
                flexShrink: 0,
            }}>
                Certificates
            </div>

            <div className="chat-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0.6rem' }}>
                {FORMS.map(form => {
                    const isActive = selectedFormId === form.id;
                    return (
                        <div key={form.id} style={{ position: 'relative', marginBottom: '1px' }}>
                            <button
                                onClick={() => onSelect(form)}
                                className={`sidebar-form-item ${isActive ? 'active' : ''}`}
                                style={{
                                    background: isActive ? `${form.color}14` : 'transparent',
                                    border: `1px solid ${isActive ? `${form.color}30` : 'transparent'}`,
                                    color: isActive ? form.color : 'var(--clr-text-secondary)',
                                    fontWeight: isActive ? 600 : 400,
                                    paddingRight: '2rem',
                                }}
                            >
                                <span style={{ flexShrink: 0, color: form.color, display: 'flex' }}>
                                    {getFormIcon(form.icon, 16, form.color)}
                                </span>
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.82rem', lineHeight: 1.3 }}>
                                    {form.name}
                                </span>
                            </button>

                            {/* "i" icon — opens FormModal */}
                            <button
                                onClick={e => { e.stopPropagation(); onInfo(form); }}
                                title="View form details"
                                style={{
                                    position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                                    width: 20, height: 20, borderRadius: '50%',
                                    background: 'transparent',
                                    border: `1px solid ${isActive ? `${form.color}50` : 'var(--clr-border)'}`,
                                    cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.65rem', fontWeight: 800, fontStyle: 'italic',
                                    color: isActive ? form.color : 'var(--clr-text-muted)',
                                    fontFamily: 'Georgia, serif',
                                    transition: 'all 0.15s',
                                    lineHeight: 1,
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = `${form.color}18`;
                                    e.currentTarget.style.borderColor = `${form.color}60`;
                                    e.currentTarget.style.color = form.color;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.borderColor = isActive ? `${form.color}50` : 'var(--clr-border)';
                                    e.currentTarget.style.color = isActive ? form.color : 'var(--clr-text-muted)';
                                }}
                            >
                                i
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Welcome Panel ────────────────────────────────────────────────────────────
function WelcomePanel({ onSelectForm }: { onSelectForm: (form: FormKB) => void }) {
    const popularForms = FORMS.slice(0, 4);

    const features = [
        { icon: <IconBot size={20} color="#4361ee" />, color: '#4361ee', title: 'Ask AI', desc: 'Chat in your language about procedures, required documents, and tips.' },
        { icon: <IconSearch size={20} color="#7c3aed" />, color: '#7c3aed', title: 'Verify Form', desc: 'Upload a filled form photo — AI checks for rejection risks.' },
        { icon: <IconWand size={20} color="#b45309" />, color: '#b45309', title: 'Auto-Fill', desc: 'Upload your ID proofs; AI extracts data and fills the form for you.' },
        { icon: <IconEye size={20} color="#0d9373" />, color: '#0d9373', title: 'Preview Template', desc: 'View and download the official blank form PDF before filling.' },
    ];

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', background: 'var(--clr-bg)' }} className="chat-scroll">
            {/* Hero header — centered */}
            <div style={{ position: 'relative', padding: '3rem 2rem 2rem', borderBottom: '1px solid var(--clr-border)' }}>
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'var(--gradient-hero)', opacity: 0.6 }} />
                <div style={{ position: 'relative', zIndex: 1, maxWidth: 620, margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.3rem 0.75rem', borderRadius: '30px', background: 'var(--clr-primary-glow)', border: '1px solid var(--clr-border-2)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--clr-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--clr-accent)', display: 'inline-block' }} />
                        AI Assistant Ready
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.75rem', lineHeight: 1.15, color: 'var(--clr-text-primary)' }}>
                        Select a certificate{' '}
                        <span style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            to begin
                        </span>
                    </h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--clr-text-secondary)', lineHeight: 1.7 }}>
                        Pick any form from the sidebar. You'll get 4 powerful tools: chat assistant,
                        form validation, auto-fill from documents, and blank template preview.
                    </p>
                </div>
            </div>

            {/* Cards section — centered with max-width */}
            <div style={{ padding: '2rem', width: '100%', maxWidth: 900, margin: '0 auto', boxSizing: 'border-box' }}>
                {/* Popular certificates */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.85rem' }}>
                        Popular Certificates
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.7rem' }}>
                        {popularForms.map((form, i) => (
                            <button
                                key={form.id}
                                onClick={() => onSelectForm(form)}
                                style={{
                                    padding: '1rem', borderRadius: '14px',
                                    background: 'var(--clr-surface)', border: `1px solid var(--clr-border)`,
                                    cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-body)',
                                    transition: 'all 0.22s ease',
                                    animation: `fadeInUp 0.4s ease ${i * 0.08}s both`,
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = `${form.color}50`;
                                    e.currentTarget.style.background = `${form.color}0a`;
                                    e.currentTarget.style.transform = 'translateY(-3px)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'var(--clr-border)';
                                    e.currentTarget.style.background = 'var(--clr-surface)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${form.color}16`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.7rem' }}>
                                    {getFormIcon(form.icon, 18, form.color)}
                                </div>
                                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--clr-text-primary)', marginBottom: '0.2rem', lineHeight: 1.25 }}>{form.name}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>{form.processingTime}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Feature cards */}
                <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.85rem' }}>
                        What you can do
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.7rem' }}>
                        {features.map((item, i) => (
                            <div key={i} style={{ padding: '1rem', borderRadius: '12px', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', animation: `fadeInUp 0.4s ease ${0.15 + i * 0.07}s both` }}>
                                <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${item.color}13`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {item.icon}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--clr-text-primary)', marginBottom: '0.25rem' }}>{item.title}</div>
                                    <div style={{ fontSize: '0.77rem', color: 'var(--clr-text-secondary)', lineHeight: 1.55 }}>{item.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Form Action Panel ────────────────────────────────────────────────────────
function FormActionPanel({ form, onAction }: { form: FormKB; onAction: (a: ActionType) => void }) {
    const pdfAvailable = PDF_AVAILABLE.has(form.id);

    const actions: { id: ActionType; icon: React.ReactNode; color: string; title: string; desc: string; available: boolean }[] = [
        { id: 'chat', icon: <IconBot size={22} color="#4361ee" />, color: '#4361ee', title: 'Ask AI', desc: 'Chat about doubts, procedures, and rejection tips in your language.', available: true },
        { id: 'verify', icon: <IconSearch size={22} color="#7c3aed" />, color: '#7c3aed', title: 'Verify Filled Form', desc: 'Upload a photo/scan of your completed form — AI checks for mistakes.', available: true },
        { id: 'autofill', icon: <IconWand size={22} color="#b45309" />, color: '#b45309', title: 'Auto-Fill from Docs', desc: 'Upload supporting documents; AI extracts data and fills the form.', available: true },
        { id: 'preview', icon: <IconEye size={22} color="#0d9373" />, color: '#0d9373', title: 'Preview Blank Form', desc: pdfAvailable ? 'View and download the official blank PDF template.' : 'Official blank PDF not available — tap "i" for form details.', available: pdfAvailable },
    ];

    return (
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--clr-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="chat-scroll">
            <div style={{ width: '100%', maxWidth: 860, padding: '2rem', boxSizing: 'border-box' }}>
                {/* Form header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '14px', background: `${form.color}18`, border: `1px solid ${form.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {getFormIcon(form.icon, 26, form.color)}
                    </div>
                    <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--clr-text-primary)', marginBottom: '0.2rem' }}>{form.name}</h2>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <IconClock size={12} color="var(--clr-text-muted)" /> {form.processingTime}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--clr-primary)', fontWeight: 600 }}>{form.department}</span>
                        </div>
                    </div>
                </div>

                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.9rem' }}>
                    Choose an action
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                    {actions.map((a, i) => (
                        <button
                            key={a.id}
                            onClick={() => a.available && onAction(a.id)}
                            className="action-card"
                            style={{
                                animation: `fadeInUp 0.35s ease ${i * 0.07}s both`,
                                opacity: a.available ? 1 : 0.5,
                                cursor: a.available ? 'pointer' : 'not-allowed',
                            }}
                            onMouseEnter={e => {
                                if (!a.available) return;
                                e.currentTarget.style.borderColor = `${a.color}45`;
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                e.currentTarget.style.background = `${a.color}08`;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = 'var(--clr-border)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.background = 'var(--clr-surface)';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                                <div style={{ width: 42, height: 42, borderRadius: '12px', background: `${a.color}13`, border: `1px solid ${a.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {a.icon}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--clr-text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>{a.title}</div>
                                    {!a.available && <div style={{ fontSize: '0.68rem', color: 'var(--clr-warning)', fontWeight: 600 }}>Not available</div>}
                                </div>
                            </div>
                            <p style={{ fontSize: '0.81rem', color: 'var(--clr-text-secondary)', lineHeight: 1.6, margin: 0 }}>{a.desc}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
function AppTopBar({
    form, activeAction, theme, onToggleTheme, onBack, onClearAction,
}: {
    form: FormKB | null; activeAction: ActionType | null;
    theme: string; onToggleTheme: () => void;
    onBack: () => void; onClearAction: () => void;
}) {
    const actionMeta: Record<ActionType, { label: string; icon: React.ReactNode }> = {
        chat: { label: 'AI Chat', icon: <IconBot size={13} color="var(--clr-primary)" /> },
        verify: { label: 'Verify Form', icon: <IconSearch size={13} color="#7c3aed" /> },
        autofill: { label: 'Auto-Fill', icon: <IconWand size={13} color="#b45309" /> },
        preview: { label: 'Preview Template', icon: <IconEye size={13} color="#0d9373" /> },
    };

    return (
        <div style={{
            height: '54px', flexShrink: 0, padding: '0 1.25rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--clr-border)',
            background: 'var(--sidebar-bg)',
        }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', minWidth: 0 }}>
                <span style={{ color: 'var(--clr-text-muted)', fontWeight: 500, flexShrink: 0 }}>SevaSetu</span>
                {form && (
                    <>
                        <span style={{ color: 'var(--clr-border-2)' }}>›</span>
                        <button
                            onClick={onClearAction}
                            style={{ background: 'none', border: 'none', cursor: activeAction ? 'pointer' : 'default', color: activeAction ? 'var(--clr-primary)' : 'var(--clr-text-primary)', fontWeight: 600, fontFamily: 'var(--font-body)', fontSize: '0.84rem', padding: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}
                            title={form.name}
                        >
                            {form.name}
                        </button>
                    </>
                )}
                {activeAction && actionMeta[activeAction] && (
                    <>
                        <span style={{ color: 'var(--clr-border-2)' }}>›</span>
                        <span style={{ color: 'var(--clr-text-secondary)', fontWeight: 500, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            {actionMeta[activeAction].icon}
                            {actionMeta[activeAction].label}
                        </span>
                    </>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexShrink: 0 }}>
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
                <button
                    onClick={onBack}
                    style={{ padding: '0.35rem 0.85rem', borderRadius: '8px', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--clr-text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 500, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--clr-text-primary)'; e.currentTarget.style.borderColor = 'var(--clr-border-2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--clr-text-secondary)'; e.currentTarget.style.borderColor = 'var(--clr-border)'; }}
                >
                    ← Home
                </button>
            </div>
        </div>
    );
}

// ─── Main AppPage ─────────────────────────────────────────────────────────────
export default function AppPage({ theme, onToggleTheme }: AppPageProps) {
    const navigate = useNavigate();
    const [selectedForm, setSelectedForm] = useState<FormKB | null>(null);
    const [activeAction, setActiveAction] = useState<ActionType | null>(null);
    const [infoForm, setInfoForm] = useState<FormKB | null>(null);

    const handleSelectForm = (form: FormKB) => {
        setSelectedForm(form);
        setActiveAction(null);
    };

    const handleAction = (action: ActionType) => setActiveAction(action);
    const handleClearAction = () => setActiveAction(null);

    const renderMain = () => {
        if (!selectedForm) return <WelcomePanel onSelectForm={handleSelectForm} />;
        if (!activeAction) return <FormActionPanel form={selectedForm} onAction={handleAction} />;

        return (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {activeAction === 'chat' && (
                    <ChatPanel
                        selectedFormId={selectedForm.id}
                        onClose={handleClearAction}
                        onFormChange={id => { const f = FORMS.find(f => f.id === id); if (f) setSelectedForm(f); }}
                    />
                )}
                {activeAction === 'verify' && <VerifyDocument form={selectedForm} />}
                {activeAction === 'autofill' && <AutoFillForm form={selectedForm} />}
                {activeAction === 'preview' && <PreviewForm form={selectedForm} onBack={handleClearAction} />}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', flexDirection: 'column', background: 'var(--clr-bg)' }}>
            <AppTopBar
                form={selectedForm}
                activeAction={activeAction}
                theme={theme}
                onToggleTheme={onToggleTheme}
                onBack={() => navigate('/')}
                onClearAction={handleClearAction}
            />

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <Sidebar
                    selectedFormId={selectedForm?.id ?? null}
                    onSelect={handleSelectForm}
                    onInfo={setInfoForm}
                />
                {renderMain()}
            </div>

            {infoForm && (
                <FormModal form={infoForm} onClose={() => setInfoForm(null)} />
            )}
        </div>
    );
}
