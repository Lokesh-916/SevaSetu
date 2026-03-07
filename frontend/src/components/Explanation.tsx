import React from 'react';

interface ExplanationProps {
    purpose: string;
    procedures: string[];
}

export default function Explanation({ purpose, procedures }: ExplanationProps) {
    return (
        <div data-testid="explanation" style={{ padding: '1.5rem', background: '#f0f7ff', borderRadius: '8px', borderLeft: '4px solid #0066cc' }}>
            <h3 style={{ marginTop: 0, color: '#0055aa' }}>System Explanation</h3>

            <h4 style={{ color: '#444', marginBottom: '0.5rem' }}>Purpose</h4>
            <p data-testid="purpose" style={{ margin: '0 0 1rem 0', color: '#555', lineHeight: '1.5' }}>{purpose}</p>

            <h4 style={{ color: '#444', marginBottom: '0.5rem' }}>Procedures</h4>
            <ul data-testid="procedures" style={{ margin: 0, paddingLeft: '1.5rem', color: '#555' }}>
                {procedures.map((p, i) => (
                    <li key={i} style={{ marginBottom: '0.25rem' }}>{p}</li>
                ))}
            </ul>
        </div>
    );
}
