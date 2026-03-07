import { useState } from 'react';

export default function AdminDashboard() {
    const [templateId, setTemplateId] = useState('');
    const [changes, setChanges] = useState('');
    const [status, setStatus] = useState('');

    const handleUpdate = async () => {
        // Simulated API call
        setStatus(`Deploying updates for ${templateId}...`);
        setTimeout(() => {
            setStatus('Successfully deployed new template version. Affected users notified.');
        }, 1000);
    };

    const handleRollback = async () => {
        // Simulated API call
        setStatus(`Initiating rollback for ${templateId}...`);
        setTimeout(() => {
            setStatus('Rolled back to previous stable version successfully.');
        }, 1000);
    };

    return (
        <div style={{ maxWidth: '800px', margin: '2rem auto', background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Admin Dashboard</h2>

            <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h3 style={{ marginTop: 0 }}>Template & Rules Maintenance</h3>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>Deploy automated updates to form structures and risk rules engine. Notifications will be dispatched to currently active sessions.</p>

                <div style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Template ID</label>
                    <input
                        type="text"
                        value={templateId}
                        onChange={(e) => setTemplateId(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '1rem' }}
                        placeholder="e.g. tmpl_12345"
                    />

                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Configuration Changes (JSON array or schema)</label>
                    <textarea
                        value={changes}
                        onChange={(e) => setChanges(e.target.value)}
                        style={{ width: '100%', minHeight: '120px', padding: '0.75rem', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '1rem', fontFamily: 'monospace' }}
                        placeholder='{"fields": [{"name":"new_field"...}]}'
                    />

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={handleUpdate}
                            style={{ padding: '0.75rem 1.5rem', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Deploy Update
                        </button>
                        <button
                            onClick={handleRollback}
                            style={{ padding: '0.75rem 1.5rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Emergency Rollback
                        </button>
                    </div>
                </div>
            </div>

            {status && (
                <div style={{ padding: '1rem', background: status.includes('Successfully') ? '#d4edda' : '#cce5ff', color: status.includes('Successfully') ? '#155724' : '#004085', borderRadius: '4px', border: '1px solid #b8daff' }}>
                    {status}
                </div>
            )}
        </div>
    );
}
