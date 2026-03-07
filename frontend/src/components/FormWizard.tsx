import { useState } from 'react';

interface Props {
    language: string;
}

export default function FormWizard({ language }: Props) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ name: '', criticalField: '' });
    const [submission, setSubmission] = useState<{ pdf_url: string, instructions: any, checklist: string[] } | null>(null);

    const isConfirmed = formData.criticalField === 'CONFIRMED';

    const fetchSubmission = async () => {
        // Simulated fetch for test
        setSubmission({
            pdf_url: '/api/v1/forms/sessions/mock-id/pdf',
            instructions: { location: 'Local Office', timing: '10 AM - 4 PM', contact: '1234567890' },
            checklist: ['Signed Form', 'Aadhaar']
        });
        setStep(4);
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2>Step {step} of 4</h2>
            {step === 1 && (
                <div>
                    <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 'bold' }}>Name ({language})
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{ display: 'block', width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </label>
                    <button
                        onClick={() => setStep(2)}
                        style={{ padding: '0.75rem 1.5rem', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Next
                    </button>
                </div>
            )}
            {step === 2 && (
                <div>
                    <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 'bold' }}>Critical Field (Type CONFIRMED to proceed)
                        <input
                            data-testid="critical-field"
                            type="text"
                            value={formData.criticalField}
                            onChange={e => setFormData({ ...formData, criticalField: e.target.value })}
                            style={{ display: 'block', width: '100%', padding: '0.75rem', marginTop: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => setStep(1)} style={{ padding: '0.75rem 1.5rem', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', background: '#f9f9f9' }}>Back</button>
                        <button
                            data-testid="confirm-btn"
                            onClick={() => setStep(3)}
                            disabled={!isConfirmed}
                            style={{ padding: '0.75rem 1.5rem', background: isConfirmed ? '#0066cc' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: isConfirmed ? 'pointer' : 'not-allowed' }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
            {step === 3 && (
                <div data-testid="preview-step">
                    <h3>Preview & Confirmation</h3>
                    <p><strong>Name:</strong> {formData.name}</p>
                    <p><strong>Critical Field:</strong> <span data-testid="preview-critical">{formData.criticalField}</span></p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button onClick={() => setStep(2)} style={{ padding: '0.75rem 1.5rem', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', background: '#f9f9f9' }}>Back</button>
                        <button onClick={fetchSubmission} style={{ padding: '0.75rem 1.5rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Generate PDF</button>
                    </div>
                </div>
            )}
            {step === 4 && submission && (
                <div data-testid="submission-step">
                    <h3>Submission Materials Ready</h3>
                    <p>Your PDF has been generated successfully.</p>
                    <a href={submission.pdf_url} download style={{ display: 'inline-block', padding: '0.5rem 1rem', background: '#0066cc', color: 'white', borderRadius: '4px', textDecoration: 'none', marginBottom: '1rem' }}>Download PDF</a>

                    <h4>Instructions</h4>
                    <p>Location: {submission.instructions.location}</p>
                    <p>Timing: {submission.instructions.timing}</p>

                    <h4>Checklist</h4>
                    <ul>
                        {submission.checklist.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
}
