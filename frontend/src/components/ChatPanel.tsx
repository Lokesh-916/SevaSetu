import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FORMS } from '../data/knowledgeBase';
import { getFormIcon } from '../utils/formIcons';
import { IconBot, IconSend, IconClose, IconChevronDown, IconMic } from './Icons';
import CustomSelect from './CustomSelect';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatPanelProps {
    selectedFormId: string | null;
    onClose: () => void;
    onFormChange: (id: string) => void;
}

const LANGUAGES = [
    { code: 'en-IN', label: 'English' },
    { code: 'te-IN', label: 'తెలుగు' },
    { code: 'hi-IN', label: 'हिंदी' },
    { code: 'ta-IN', label: 'தமிழ்' },
    { code: 'kn-IN', label: 'ಕನ್ನಡ' },
    { code: 'ml-IN', label: 'മലയാളം' },
    { code: 'mr-IN', label: 'मराठी' },
    { code: 'bn-IN', label: 'বাংলা' },
    { code: 'gu-IN', label: 'ગુજરાતી' },
];

function parseMarkdown(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>')
        .replace(/^(.+)$/, '<p>$1</p>');
}

export default function ChatPanel({ selectedFormId, onClose, onFormChange }: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showFormPicker, setShowFormPicker] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [selectedLang, setSelectedLang] = useState('en-IN');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);

    const currentForm = FORMS.find(f => f.id === selectedFormId);

    const addAssistantMessage = useCallback((content: string) => {
        const msg: Message = { id: Date.now().toString(), role: 'assistant', content, timestamp: new Date() };
        setMessages(prev => [...prev, msg]);
    }, []);

    useEffect(() => {
        if (selectedFormId && currentForm) {
            setMessages([]);
            setIsTyping(true);
            const timer = setTimeout(() => {
                setIsTyping(false);
                addAssistantMessage(
                    `👋 Hello! I'm your AI guide for the **${currentForm.name}**.\n\n` +
                    `📋 **Department:** ${currentForm.department}\n` +
                    `⏱️ **Processing Time:** ${currentForm.processingTime}\n` +
                    `📍 **Submission:** ${currentForm.submissionLocation}\n\n` +
                    `You can ask me about:\n• Required documents\n• Step-by-step procedure\n• Common rejection reasons\n• Critical fields to fill\n• Tips and grievances\n• Technical rules and acts`
                );
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [selectedFormId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Voice recognition
    const toggleVoice = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) { alert('Voice input not supported in this browser.'); return; }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = selectedLang;
        recognition.interimResults = true;
        recognition.continuous = false;
        recognitionRef.current = recognition;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (e: any) => {
            const transcript = Array.from(e.results)
                .map((r: any) => r[0].transcript)
                .join('');
            setInput(transcript);
        };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.start();
    };

    const handleSend = useCallback(async () => {
        const text = input.trim();
        if (!text || !selectedFormId) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        const groqKey = import.meta.env.VITE_GROQ_API_KEY as string;
        const groqModel = (import.meta.env.VITE_GROQ_MODEL as string) || 'llama-3.3-70b-versatile';

        // Build KB context from the selected form's structured data
        const form = FORMS.find(f => f.id === selectedFormId);
        const kbContext = form
            ? `Form: ${form.name}\nDepartment: ${form.department}\nPurpose: ${form.purpose}\nProcessing Time: ${form.processingTime}\nSubmission: ${form.submissionLocation}\n\nRequired Documents:\n${form.requiredDocuments.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\nStep-by-Step Procedure:\n${form.procedure.map((s, i) => `Step ${i + 1}: ${s}`).join('\n')}\n\nCommon Rejection Reasons:\n${form.rejectionReasons.map(r => `- ${r.title}: ${r.detail}`).join('\n')}\n\nCritical Fields:\n${form.criticalFields.map(f => `- ${f.field}: ${f.warning}`).join('\n')}\n\nPractical Tips:\n${form.grievances.map(g => `Q: ${g.issue}\nTip: ${g.tip}`).join('\n')}\n\nTechnical Rules:\n${form.technicalRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
            : '';

        if (!groqKey || groqKey === 'your-groq-api-key-here') {
            // Fallback: local keyword match
            const { queryKnowledgeBase } = await import('../data/knowledgeBase');
            const response = queryKnowledgeBase(selectedFormId, text);
            setIsTyping(false);
            addAssistantMessage(response);
            return;
        }

        try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${groqKey}`,
                },
                body: JSON.stringify({
                    model: groqModel,
                    messages: [
                        {
                            role: 'system',
                            content:
                                `You are SevaSetu AI, a friendly and knowledgeable assistant helping Indian citizens with government form applications. Be concise, warm, and practical.\n\nYou are currently helping with the ${form?.name ?? 'selected form'}.\n\nIMPORTANT: Always use English/Western Arabic numerals (0-9) for all numbers, dates, fees, and measurements — even when replying in another language like Telugu, Hindi, or Tamil.\n\nUse ONLY the following knowledge base to answer questions. If the answer isn't in the KB, say so and suggest contacting the office.\n\n${kbContext}`,
                        },
                        { role: 'user', content: text },
                    ],
                    temperature: 0.4,
                    max_tokens: 800,
                }),
            });

            if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
            const data = await res.json();
            const answer = data.choices?.[0]?.message?.content?.trim() ?? 'Sorry, I could not generate a response.';
            setIsTyping(false);
            addAssistantMessage(answer);
        } catch (err) {
            setIsTyping(false);
            addAssistantMessage(`⚠️ **Could not reach AI service.** Please check your VITE_GROQ_API_KEY in the frontend .env file.\n\nError: ${err instanceof Error ? err.message : String(err)}`);
        }
    }, [input, selectedFormId, addAssistantMessage]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const suggestedQuestions = [
        'What documents do I need?',
        'Common rejection reasons?',
        'How long does it take?',
        'What are the critical fields?',
        'Any tips or advice?',
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>

            {/* Header */}
            <div style={{
                padding: '0.85rem 1.1rem',
                borderBottom: '1px solid var(--clr-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--clr-surface)', flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '9px', background: 'linear-gradient(135deg, #4361ee, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconBot size={17} color="white" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'var(--font-display)', color: 'var(--clr-text-primary)' }}>SevaSetu AI</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--clr-accent)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--clr-accent)', display: 'inline-block' }} />Online
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {/* Language selector */}
                    <CustomSelect
                        options={LANGUAGES.map(l => ({ value: l.code, label: l.label }))}
                        value={selectedLang}
                        onChange={setSelectedLang}
                        title="Select language for voice input"
                        maxWidth={110}
                    />

                    {/* Form selector */}
                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setShowFormPicker(p => !p)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                                padding: '0.35rem 0.6rem', borderRadius: '8px',
                                background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border-2)',
                                color: 'var(--clr-text-secondary)', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'var(--font-body)',
                            }}
                        >
                            {currentForm ? currentForm.name.split(' ').slice(0, 2).join(' ') : 'Select Form'}
                            <IconChevronDown size={12} />
                        </button>
                        {showFormPicker && (
                            <div style={{
                                position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50,
                                background: 'var(--modal-bg)', border: '1px solid var(--clr-border-2)',
                                borderRadius: '12px', minWidth: '220px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
                            }}>
                                {FORMS.map(f => (
                                    <button key={f.id} onClick={() => { onFormChange(f.id); setShowFormPicker(false); }} style={{
                                        width: '100%', textAlign: 'left', padding: '0.6rem 0.9rem',
                                        background: f.id === selectedFormId ? 'var(--clr-primary-glow)' : 'transparent',
                                        border: 'none', color: f.id === selectedFormId ? 'var(--clr-primary)' : 'var(--clr-text-secondary)',
                                        cursor: 'pointer', fontSize: '0.83rem', transition: 'all 0.15s',
                                        fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    }}
                                        onMouseEnter={e => { if (f.id !== selectedFormId) (e.currentTarget as HTMLButtonElement).style.background = 'var(--clr-surface-2)'; }}
                                        onMouseLeave={e => { if (f.id !== selectedFormId) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                                    >
                                        <span style={{ color: f.color, flexShrink: 0 }}>{getFormIcon(f.icon, 13, f.color)}</span>
                                        {f.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '7px', background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', color: 'var(--clr-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                        <IconClose size={14} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="chat-scroll" style={{ flex: 1, padding: '1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', overflowY: 'auto' }}>
                {!selectedFormId && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--clr-text-muted)' }}>
                        <IconBot size={44} color="var(--clr-primary-glow)" />
                        <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>Select a form above to start getting AI assistance</p>
                    </div>
                )}

                {messages.map(msg => (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeInUp 0.3s ease' }}>
                        {msg.role === 'assistant' && (
                            <div style={{ width: 26, height: 26, borderRadius: '7px', flexShrink: 0, marginRight: '0.5rem', marginTop: '2px', background: 'linear-gradient(135deg, #4361ee, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconBot size={13} color="white" />
                            </div>
                        )}
                        <div style={{
                            maxWidth: '80%', padding: '0.75rem 0.95rem',
                            borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                            background: msg.role === 'user' ? 'linear-gradient(135deg, #4361ee, #7c3aed)' : 'var(--clr-surface-2)',
                            border: msg.role === 'user' ? 'none' : '1px solid var(--clr-border)',
                            color: msg.role === 'user' ? 'white' : 'var(--clr-text-primary)',
                            fontSize: '0.88rem', lineHeight: 1.6,
                            boxShadow: msg.role === 'user' ? '0 4px 12px rgba(67,97,238,0.3)' : 'none',
                        }}>
                            <div dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '7px', background: 'linear-gradient(135deg, #4361ee, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <IconBot size={13} color="white" />
                        </div>
                        <div style={{ padding: '0.7rem 0.9rem', borderRadius: '4px 16px 16px 16px', background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                            {[0, 1, 2].map(i => (
                                <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--clr-primary)', animation: 'blink 1.2s ease infinite', animationDelay: `${i * 0.2}s` }} />
                            ))}
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Suggested questions */}
            {selectedFormId && messages.length <= 1 && !isTyping && (
                <div style={{ padding: '0 1.1rem 0.6rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {suggestedQuestions.map(q => (
                        <button key={q}
                            onClick={() => { setInput(q); setTimeout(handleSend, 50); }}
                            style={{ padding: '0.3rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', background: 'var(--clr-primary-glow)', border: '1px solid var(--clr-border-2)', color: 'var(--clr-primary)', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(67,97,238,0.18)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'var(--clr-primary-glow)')}
                        >{q}</button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div style={{ padding: '0.75rem 1.1rem', borderTop: '1px solid var(--clr-border)', display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexShrink: 0, background: 'var(--clr-surface)' }}>
                {/* Voice button */}
                <button
                    onClick={toggleVoice}
                    title={isListening ? 'Stop listening' : `Voice input (${LANGUAGES.find(l => l.code === selectedLang)?.label})`}
                    style={{
                        width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                        background: isListening ? 'rgba(239,68,68,0.15)' : 'var(--clr-surface-2)',
                        border: isListening ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--clr-border-2)',
                        color: isListening ? '#ef4444' : 'var(--clr-text-secondary)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                        animation: isListening ? 'micPulse 1.2s ease infinite' : 'none',
                    }}
                >
                    <IconMic size={16} color={isListening ? '#ef4444' : 'currentColor'} />
                </button>

                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedFormId ? `Ask in ${LANGUAGES.find(l => l.code === selectedLang)?.label || 'English'}...` : 'Select a form first'}
                    disabled={!selectedFormId}
                    rows={1}
                    style={{
                        flex: 1, background: 'var(--clr-surface-2)', border: '1px solid var(--clr-border-2)',
                        borderRadius: '10px', padding: '0.6rem 0.8rem', color: 'var(--clr-text-primary)',
                        fontFamily: 'var(--font-body)', fontSize: '0.88rem', resize: 'none',
                        outline: 'none', maxHeight: '100px', lineHeight: 1.5, transition: 'border-color 0.2s',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--clr-primary)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--clr-border-2)')}
                />

                <button
                    onClick={handleSend}
                    disabled={!input.trim() || !selectedFormId}
                    style={{
                        width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                        background: input.trim() && selectedFormId ? 'linear-gradient(135deg, #4361ee, #7c3aed)' : 'var(--clr-surface-2)',
                        border: 'none', color: 'white', cursor: input.trim() && selectedFormId ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                        boxShadow: input.trim() && selectedFormId ? '0 4px 12px rgba(67,97,238,0.35)' : 'none',
                    }}
                >
                    <IconSend size={15} />
                </button>
            </div>
        </div>
    );
}
