import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    errorStr: string;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        errorStr: ''
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, errorStr: error.toString() };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem', background: '#ffebee', border: '1px solid #ffcdd2', borderRadius: '8px' }}>
                    <h2 style={{ color: '#c62828' }}>Something went wrong.</h2>
                    <p style={{ color: '#555' }}>Our application encountered an unexpected error. Please try refreshing the page or restarting your session.</p>
                    <pre style={{ textAlign: 'left', background: '#fff', padding: '1rem', overflowX: 'auto', borderRadius: '4px', fontSize: '0.85rem' }}>
                        {this.state.errorStr}
                    </pre>
                    <button
                        onClick={() => window.location.href = '/'}
                        style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: '#c62828', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Return Home
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
