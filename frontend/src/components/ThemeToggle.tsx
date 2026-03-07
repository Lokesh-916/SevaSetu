interface ThemeToggleProps {
    theme: string;
    onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
    const isDark = theme === 'dark';
    return (
        <button
            onClick={onToggle}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.35rem 0.65rem',
                borderRadius: '20px',
                background: 'var(--clr-surface-2)',
                border: '1px solid var(--clr-border-2)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                color: 'var(--clr-text-secondary)',
                transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--clr-text-primary)'; e.currentTarget.style.borderColor = 'var(--clr-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--clr-text-secondary)'; e.currentTarget.style.borderColor = 'var(--clr-border-2)'; }}
        >
            <span style={{ fontSize: '1rem', lineHeight: 1 }}>{isDark ? '☀️' : '🌙'}</span>
            <span style={{ display: 'none' }}>{isDark ? 'Light' : 'Dark'}</span>
        </button>
    );
}
