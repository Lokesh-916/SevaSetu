import React, { useState, useRef } from 'react';

export default function DocumentUploader() {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string>('');
    const [progress, setProgress] = useState(0);
    const [isDragActive, setIsDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

    const validateFile = (f: File) => {
        if (f.size > MAX_SIZE) {
            setError('File exceeds 10MB limit');
            return false;
        }
        if (!ALLOWED_TYPES.includes(f.type)) {
            setError('Invalid file format. Only JPEG, PNG, or PDF allowed.');
            return false;
        }
        setError('');
        return true;
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(true);
    };

    const handleDragLeave = () => {
        setIsDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && validateFile(droppedFile)) {
            setFile(droppedFile);
            simulateUpload();
        }
    };

    const simulateUpload = () => {
        setProgress(0);
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return p + 20;
            });
        }, 100);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && validateFile(selectedFile)) {
            setFile(selectedFile);
            simulateUpload();
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Upload Document</h2>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${isDragActive ? '#0066cc' : '#ccc'}`,
                    background: isDragActive ? '#f0f8ff' : '#fafafa',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease'
                }}
                onClick={() => fileInputRef.current?.click()}
                data-testid="dropzone"
            >
                <svg style={{ width: '48px', height: '48px', color: '#999', marginBottom: '1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <p style={{ margin: 0, fontSize: '1.1rem', color: '#555' }}>Drag and drop a file, or click to select</p>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#888' }}>JPEG, PNG, or PDF up to 10MB</p>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#888' }}>Camera capture supported on mobile devices.</p>
                <input
                    data-testid="file-upload-input"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleChange}
                    style={{ display: 'none' }}
                    accept="image/jpeg,image/png,application/pdf"
                    capture="environment"
                />
            </div>

            {error && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fff3f3', border: '1px solid #ffcdd2', borderRadius: '4px', color: '#d32f2f' }}>
                    {error}
                </div>
            )}

            {file && !error && (
                <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px', background: '#fcfcfc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: '500', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                        <span style={{ color: '#666', fontSize: '0.9rem' }}>{progress}%</span>
                    </div>
                    <div style={{ width: '100%', background: '#e0e0e0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div data-testid="progress-bar" style={{ width: `${progress}%`, background: progress === 100 ? '#28a745' : '#0066cc', height: '100%', transition: 'width 0.2s ease-in-out' }} />
                    </div>
                    {progress === 100 && (
                        <p style={{ margin: '1rem 0 0', color: '#28a745', fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                            <svg style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Upload complete and validated
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
