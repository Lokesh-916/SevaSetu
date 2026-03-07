import { useState, useRef, useEffect } from 'react';
import { IconChevronDown } from './Icons';

interface Option {
    value: string;
    label: string;
}

interface Props {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    title?: string;
    maxWidth?: string | number;
}

export default function CustomSelect({ options, value, onChange, title, maxWidth = 120 }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const selected = options.find(o => o.value === value) ?? options[0];

    // Close when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div
            ref={ref}
            title={title}
            style={{ position: 'relative', maxWidth, userSelect: 'none', flexShrink: 0 }}
        >
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.35rem',
                    padding: '0.3rem 0.55rem',
                    borderRadius: '8px',
                    background: 'var(--clr-surface-2, #1a2236)',
                    color: 'var(--clr-text-primary, rgba(255,255,255,0.93))',
                    border: open
                        ? '1px solid var(--clr-primary, #4f8ef7)'
                        : '1px solid var(--clr-border-2, rgba(255,255,255,0.14))',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-body, Inter, sans-serif)',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    minWidth: 0,
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selected?.label}
                </span>
                <span style={{
                    flexShrink: 0,
                    transition: 'transform 0.2s',
                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    display: 'flex',
                    alignItems: 'center',
                }}>
                    <IconChevronDown size={11} />
                </span>
            </button>

            {/* Dropdown list */}
            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    zIndex: 9999,
                    minWidth: '100%',
                    background: '#131c2e',
                    border: '1px solid var(--clr-border-2, rgba(255,255,255,0.14))',
                    borderRadius: '10px',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
                    overflow: 'hidden',
                    animation: 'fadeInDown 0.15s ease',
                }}>
                    {options.map(opt => {
                        const isActive = opt.value === value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '0.5rem 0.75rem',
                                    background: isActive
                                        ? 'rgba(79, 142, 247, 0.18)'
                                        : 'transparent',
                                    color: isActive
                                        ? 'var(--clr-primary, #4f8ef7)'
                                        : 'rgba(255,255,255,0.87)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-body, Inter, sans-serif)',
                                    fontWeight: isActive ? 600 : 400,
                                    transition: 'background 0.15s',
                                    whiteSpace: 'nowrap',
                                }}
                                onMouseEnter={e => {
                                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                                }}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
