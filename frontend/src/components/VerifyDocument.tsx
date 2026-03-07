import { useState, useRef } from 'react';
import { type FormKB } from '../data/knowledgeBase';
import { IconUpload, IconCheck, IconShield } from './Icons';

interface VerifyDocumentProps {
    form: FormKB;
}

interface ValidationResult {
    field: string;
    status: 'ok' | 'warning' | 'error';
    message: string;
}

export default function VerifyDocument({ form }: VerifyDocumentProps) {
    const [dragOver, setDragOver] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<ValidationResult[] | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            alert('Please upload an image (JPG, PNG) or PDF file.');
            return;
        }
        setUploadedFile(file);
        setResults(null);
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const runAnalysis = () => {
        if (!uploadedFile) return;
        setAnalyzing(true);
        setResults(null);
        // Simulate AI validation using the form's knowledge
        setTimeout(() => {
            const mockResults: ValidationResult[] = [
                ...form.criticalFields.map(cf => ({
                    field: cf.field,
                    status: Math.random() > 0.35 ? 'ok' : 'warning' as 'ok' | 'warning' | 'error',
                    message: Math.random() > 0.35
                        ? `✓ ${cf.field} appears to be correctly filled.`
                        : `⚠️ ${cf.warning}`,
                })),
                ...form.rejectionReasons.slice(0, 2).map(rr => ({
                    field: rr.title,
                    status: Math.random() > 0.5 ? 'ok' : 'error' as 'ok' | 'warning' | 'error',
                    message: Math.random() > 0.5
                        ? `✓ No issue detected with ${rr.title.toLowerCase()}.`
                        : `❌ Potential issue: ${rr.detail}`,
                })),
                {
                    field: 'Document Clarity',
                    status: 'ok',
                    message: '✓ Document text is legible and readable.',
                },
                {
                    field: 'Required Documents Checklist',
                    status: 'warning',
                    message: `⚠️ Ensure you have all ${form.requiredDocuments.length} required documents ready for submission.`,
                },
            ];
            setResults(mockResults);
            setAnalyzing(false);
        }, 2200);
    };

    const statusColor = (s: string) =>
        s === 'ok' ? '#10b981' : s === 'warning' ? '#f59e0b' : '#ef4444';

    const statusBg = (s: string) =>
        s === 'ok' ? 'rgba(16,185,129,0.08)' : s === 'warning' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';

    const overallScore = results
        ? Math.round((results.filter(r => r.status === 'ok').length / results.length) * 100)
        : null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.5rem', gap: '1.25rem', overflowY: 'auto' }} className="chat-scroll">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconShield size={20} color="#8b5cf6" />
                </div>
                <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--clr-text-primary)' }}>Verify Filled Form</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>Upload your filled {form.name} for AI validation</p>
                </div>
            </div>

            {/* Upload Zone */}
            <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${dragOver ? '#8b5cf6' : uploadedFile ? '#10b981' : 'var(--clr-border-2)'}`,
                    borderRadius: '16px',
                    padding: '2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragOver ? 'rgba(139,92,246,0.06)' : uploadedFile ? 'rgba(16,185,129,0.06)' : 'var(--clr-surface)',
                    transition: 'all 0.2s ease',
                }}
            >
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
                {uploadedFile ? (
                    <div>
                        {previewUrl && (
                            <img src={previewUrl} alt="Uploaded form" style={{ maxHeight: '180px', maxWidth: '100%', borderRadius: '8px', marginBottom: '0.75rem', objectFit: 'contain' }} />
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>
                            <IconCheck size={18} color="#10b981" />
                            {uploadedFile.name}
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)', marginTop: '0.3rem' }}>Click to change file</p>
                    </div>
                ) : (
                    <div>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <IconUpload size={24} color="#8b5cf6" />
                        </div>
                        <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--clr-text-primary)', marginBottom: '0.3rem' }}>Drop your filled form here</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>or click to browse — JPG, PNG, PDF supported</p>
                    </div>
                )}
            </div>

            {/* Analyze Button */}
            {uploadedFile && !results && (
                <button
                    onClick={runAnalysis}
                    disabled={analyzing}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', opacity: analyzing ? 0.8 : 1 }}
                >
                    {analyzing ? (
                        <>
                            <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                            Analyzing with AI...
                        </>
                    ) : (
                        <><IconShield size={16} /> Validate Document</>
                    )}
                </button>
            )}

            {/* Results */}
            {results && (
                <div style={{ animation: 'fadeInUp 0.4s ease' }}>
                    {/* Score */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderRadius: '14px', background: overallScore! >= 70 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${overallScore! >= 70 ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`, marginBottom: '1rem' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: overallScore! >= 70 ? '#10b981' : '#f59e0b' }}>{overallScore}%</div>
                        <div>
                            <div style={{ fontWeight: 700, color: 'var(--clr-text-primary)', fontSize: '0.95rem' }}>
                                {overallScore! >= 80 ? 'Ready to Submit' : overallScore! >= 60 ? 'Needs Attention' : 'High Risk of Rejection'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-secondary)' }}>
                                {results.filter(r => r.status === 'ok').length}/{results.length} checks passed
                            </div>
                        </div>
                    </div>

                    {/* Individual results */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {results.map((r, i) => (
                            <div key={i} style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: statusBg(r.status), border: `1px solid ${statusColor(r.status)}30` }}>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: statusColor(r.status), marginBottom: '0.2rem' }}>{r.field}</div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--clr-text-secondary)', lineHeight: 1.5 }}>{r.message}</div>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => { setUploadedFile(null); setPreviewUrl(null); setResults(null); }} style={{ width: '100%', marginTop: '1rem', padding: '0.65rem', borderRadius: '10px', background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', color: 'var(--clr-text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s' }}>
                        Upload Another Document
                    </button>
                </div>
            )}
        </div>
    );
}
