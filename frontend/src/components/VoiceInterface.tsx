import { useState, useEffect } from 'react';
import Explanation from './Explanation';

// Extend Window interface for SpeechRecognition
declare global {
    interface Window {
        SpeechRecognition?: any;
        webkitSpeechRecognition?: any;
    }
}

interface Props {
    language: string;
}

export default function VoiceInterface({ language }: Props) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [supportAudio, setSupportAudio] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                setSupportAudio(false);
            }
        }
    }, []);

    const toggleListen = () => {
        if (!supportAudio) return;
        setIsListening(prev => !prev);
        if (!isListening) {
            setTranscript('Simulated voice input...');
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Voice Interface</h2>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Current Language Code: <strong>{language}</strong></p>

            {!supportAudio ? (
                <div style={{ padding: '1.5rem', background: '#fff3f3', border: '1px solid #ffcdd2', borderRadius: '8px', color: '#d32f2f', marginBottom: '2rem' }}>
                    Speech recognition is not supported in this browser.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                    <button
                        data-testid="mic-btn"
                        onClick={toggleListen}
                        style={{
                            padding: '1.5rem',
                            borderRadius: '50%',
                            background: isListening ? '#dc3545' : '#0066cc',
                            color: 'white',
                            border: isListening ? '4px solid #ffb3b3' : '4px solid #b3d9ff',
                            cursor: 'pointer',
                            width: '100px',
                            height: '100px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            transition: 'all 0.3s ease',
                            marginBottom: '1.5rem'
                        }}
                    >
                        {isListening ? (
                            <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x={9} y={9} width={6} height={6} /></svg>
                        ) : (
                            <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        )}
                    </button>

                    <div style={{ width: '100%', padding: '1.5rem', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', minHeight: '120px' }}>
                        {isListening && <span style={{ color: '#dc3545', display: 'flex', alignItems: 'center', fontSize: '0.9rem', marginBottom: '0.5rem' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#dc3545', marginRight: '6px', animation: 'pulse 1.5s infinite' }} /> Listening...</span>}
                        <p data-testid="transcript" style={{ margin: 0, color: transcript ? '#333' : '#999', fontSize: '1.1rem', lineHeight: '1.5' }}>
                            {transcript || 'Press the microphone icon to start speaking.'}
                        </p>
                    </div>
                </div>
            )}

            <div style={{ borderTop: '1px solid #eee', paddingTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#444' }}>Text Input Alternative</h3>
                <textarea
                    data-testid="text-input"
                    style={{ width: '100%', minHeight: '120px', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', fontSize: '1rem', resize: 'vertical' }}
                    placeholder="Type your input here as an alternative to voice..."
                />
            </div>

            <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '2rem' }}>
                <Explanation
                    purpose="This interface allows multi-modal interaction for accessibility."
                    procedures={[
                        "Click the mic to start or stop voice recording.",
                        "Review the generated transcript.",
                        "Alternatively, type your query directly in the text box."
                    ]}
                />
            </div>
        </div>
    );
}
