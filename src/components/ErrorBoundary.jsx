import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // For a real app, integrate a service like Sentry or LogRocket here
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong.</h1>
                    <p className="text-gray-700">We've been notified and are looking into it. Please try refreshing the page.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Refresh
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;