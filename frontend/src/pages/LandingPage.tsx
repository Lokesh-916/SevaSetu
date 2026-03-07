import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBot, IconZap, IconGlobe, IconShield, IconArrowRight, IconMic, IconUpload } from '../components/Icons';
import ThemeToggle from '../components/ThemeToggle';

interface LandingPageProps {
    theme: 'dark' | 'light';
    onToggleTheme: () => void;
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ theme, onToggleTheme }: { theme: string; onToggleTheme: () => void }) {
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, []);

    const navBg = theme === 'light'
        ? scrolled ? 'rgba(240,244,255,0.92)' : 'transparent'
        : scrolled ? 'rgba(11,15,26,0.92)' : 'transparent';

    const borderBottom = scrolled ? `1px solid var(--clr-border)` : 'none';

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900,
            padding: '0 2rem',
            background: navBg,
            backdropFilter: scrolled ? 'blur(20px)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
            borderBottom,
            transition: 'all 0.4s ease',
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/step.png" alt="SevaSetu Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'var(--clr-text-primary)' }}>
                        Seva<span style={{ background: 'linear-gradient(135deg, #4f8ef7, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Setu</span>
                    </span>
                </div>

                {/* Desktop Nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    {['Features', 'How It Works'].map(item => (
                        <a key={item} href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                            style={{ color: 'var(--clr-text-secondary)', fontSize: '0.9rem', fontWeight: 500, transition: 'color 0.2s', textDecoration: 'none' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--clr-text-primary)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--clr-text-secondary)')}
                        >{item}</a>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <ThemeToggle theme={theme} onToggle={onToggleTheme} />
                    <button
                        onClick={() => navigate('/app')}
                        className="btn btn-primary btn-sm"
                        style={{ gap: '0.4rem' }}
                    >
                        Try Now <IconArrowRight size={14} />
                    </button>
                </div>
            </div>
        </nav>
    );
}

// ─── Hero Section ──────────────────────────────────────────────────────────────
function HeroSection({ theme }: { theme: string }) {
    const navigate = useNavigate();
    const isDark = theme === 'dark';

    return (
        <section id="home" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', paddingTop: '68px', background: 'var(--gradient-hero)' }}>
            {/* Animated background orbs */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute', width: '700px', height: '700px', borderRadius: '50%',
                    background: isDark
                        ? 'radial-gradient(circle, rgba(79,142,247,0.10) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(79,142,247,0.15) 0%, transparent 70%)',
                    top: '-150px', left: '-150px', animation: 'orb-drift 18s ease-in-out infinite',
                }} />
                <div style={{
                    position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
                    background: isDark
                        ? 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
                    bottom: '-80px', right: '-100px', animation: 'orb-drift 22s ease-in-out infinite reverse',
                }} />
                <div style={{
                    position: 'absolute', width: '350px', height: '350px', borderRadius: '50%',
                    background: isDark
                        ? 'radial-gradient(circle, rgba(6,214,160,0.06) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 70%)',
                    top: '40%', right: '20%', animation: 'orb-drift 14s ease-in-out infinite 2s',
                }} />
                {/* Grid */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: isDark
                        ? 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)'
                        : 'linear-gradient(rgba(79,142,247,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(79,142,247,0.07) 1px, transparent 1px)',
                    backgroundSize: '52px 52px',
                }} />
            </div>

            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', width: '100%', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center' }}>
                    {/* Badge */}
                    <div className="badge badge-blue anim-fade-up" style={{ display: 'inline-flex', marginBottom: '1.75rem' }}>
                        <IconZap size={12} color="var(--clr-primary)" />
                        AI-Powered · Multilingual · Government Forms
                    </div>

                    {/* Headline */}
                    <h1 className="anim-fade-up delay-1" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.03em', color: 'var(--clr-text-primary)' }}>
                        Navigate Government
                        <br />
                        <span style={{ background: 'linear-gradient(135deg, #4f8ef7 0%, #8b5cf6 50%, #06d6a0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Forms with Confidence
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="anim-fade-up delay-2" style={{ fontSize: '1.15rem', color: 'var(--clr-text-secondary)', lineHeight: 1.75, maxWidth: '600px', margin: '0 auto 2.5rem' }}>
                        Your AI-powered bridge to hassle-free government services. Get step-by-step guidance,
                        document validation, and zero-rejection form completion — in your language.
                    </p>

                    {/* CTAs */}
                    <div className="anim-fade-up delay-3" style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate('/app')} className="btn btn-primary btn-lg" style={{ boxShadow: '0 8px 32px rgba(79,142,247,0.4)' }}>
                            Try Now <IconArrowRight size={18} />
                        </button>
                        <a href="#how-it-works" className="btn btn-outline btn-lg">
                            See How It Works
                        </a>
                    </div>

                    {/* Stats */}
                    <div className="anim-fade-up delay-5" style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '4rem', flexWrap: 'wrap' }}>
                        {[
                            { value: '10+', label: 'Form Types' },
                            { value: '98%', label: 'Accuracy Rate' },
                            { value: '< 3s', label: 'Response Time' },
                            { value: '8+', label: 'Languages' },
                        ].map(stat => (
                            <div key={stat.label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', background: 'linear-gradient(135deg, #4f8ef7, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{stat.value}</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)', fontWeight: 500 }}>{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── Features Section ──────────────────────────────────────────────────────────
function FeaturesSection() {
    const features = [
        { icon: <IconBot size={28} color="#4f8ef7" />, color: '#4f8ef7', title: 'Office-Specific AI', desc: 'AI trained on exact government procedures, GO numbers, and office-specific rules for accurate guidance.' },
        { icon: <IconGlobe size={28} color="#8b5cf6" />, color: '#8b5cf6', title: 'Multilingual Support', desc: 'Interact in your preferred regional language. Speech-to-text for 8+ Indian languages.' },
        { icon: <IconUpload size={28} color="#06d6a0" />, color: '#06d6a0', title: 'Document Validation', desc: 'Upload scans or photos. AI extracts text via OCR and validates against office requirements.' },
        { icon: <IconZap size={28} color="#f59e0b" />, color: '#f59e0b', title: 'Auto-Fill Forms', desc: 'Extracted document data auto-fills form fields. Review and confirm before finalizing.' },
        { icon: <IconShield size={28} color="#ec4899" />, color: '#ec4899', title: 'Human Escalation', desc: 'Low AI confidence triggers automatic escalation with a full assistance receipt for the officer.' },
        { icon: <IconMic size={28} color="#14b8a6" />, color: '#14b8a6', title: 'Voice Interface', desc: 'Full voice-based interaction for citizens with limited literacy or visual impairments.' },
    ];

    return (
        <section id="features" style={{ padding: '5rem 1.5rem', background: 'linear-gradient(180deg, var(--clr-bg-2) 0%, var(--clr-bg) 100%)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div className="badge badge-green" style={{ display: 'inline-flex', marginBottom: '1rem' }}>Platform Capabilities</div>
                    <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '0.75rem' }}>Built for Every Citizen</h2>
                    <p style={{ color: 'var(--clr-text-secondary)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto' }}>Powerful AI, accessible to all. No technical expertise needed.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                    {features.map((f, i) => (
                        <div key={i} className="glass-card" style={{ padding: '1.75rem', animation: `fadeInUp 0.5s ease ${i * 0.1}s both` }}>
                            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `${f.color}18`, border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                                {f.icon}
                            </div>
                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.6rem' }}>{f.title}</h3>
                            <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-secondary)', lineHeight: 1.7 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── How It Works Section ──────────────────────────────────────────────────────
function HowItWorksSection() {
    const navigate = useNavigate();
    const steps = [
        { n: '01', color: '#4f8ef7', title: 'Select Your Service', desc: 'Choose the government form or certificate you need from our comprehensive list.' },
        { n: '02', color: '#8b5cf6', title: 'Get AI Guidance', desc: 'Ask our AI any questions. It knows the exact procedures, documents, and rules.' },
        { n: '03', color: '#06d6a0', title: 'Upload & Validate', desc: 'Upload your documents. AI validates them against office requirements in real-time.' },
        { n: '04', color: '#f59e0b', title: 'Review & Submit', desc: 'Confirm auto-filled data, download checklist, and know exactly where to submit.' },
    ];

    return (
        <section id="how-it-works" style={{ padding: '5rem 1.5rem', background: 'var(--clr-bg)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div className="badge badge-blue" style={{ display: 'inline-flex', marginBottom: '1rem' }}>Simple Process</div>
                    <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '0.75rem' }}>From Confusion to Confidence</h2>
                    <p style={{ color: 'var(--clr-text-secondary)', fontSize: '1rem', maxWidth: '480px', margin: '0 auto' }}>Four simple steps to a fully prepared government application.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    {steps.map((s, i) => (
                        <div key={i} className="glass-card" style={{ padding: '1.75rem', position: 'relative', animation: `fadeInUp 0.5s ease ${i * 0.12}s both` }}>
                            <div style={{ fontSize: '3rem', fontWeight: 900, color: `${s.color}25`, fontFamily: 'var(--font-display)', marginBottom: '1rem', lineHeight: 1 }}>{s.n}</div>
                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: s.color, marginBottom: '0.6rem' }}>{s.title}</h3>
                            <p style={{ fontSize: '0.87rem', color: 'var(--clr-text-secondary)', lineHeight: 1.7 }}>{s.desc}</p>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center' }}>
                    <button onClick={() => navigate('/app')} className="btn btn-primary btn-lg">
                        Try It Now <IconArrowRight size={18} />
                    </button>
                </div>
            </div>
        </section>
    );
}

// ─── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
    return (
        <footer style={{ borderTop: '1px solid var(--clr-border)', padding: '2.5rem 1.5rem', textAlign: 'center', background: 'var(--clr-bg-2)' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/step.png" alt="SevaSetu Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--clr-text-primary)' }}>SevaSetu</span>
                </div>
                <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    Bridging citizens and government services through AI-powered form assistance.
                </p>
                <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.78rem' }}>
                    © {new Date().getFullYear()} SevaSetu. Built for the Hackathon Demo. Data sourced from official AP government procedures.
                </p>
            </div>
        </footer>
    );
}

// ─── Landing Page ──────────────────────────────────────────────────────────────
export default function LandingPage({ theme, onToggleTheme }: LandingPageProps) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar theme={theme} onToggleTheme={onToggleTheme} />
            <main style={{ flex: 1 }}>
                <HeroSection theme={theme} />
                <FeaturesSection />
                <HowItWorksSection />
            </main>
            <Footer />
        </div>
    );
}
