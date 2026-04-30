/**
 * ErrorBoundary.jsx
 * Class component — React error boundaries must be class-based.
 */
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px]
                        p-6 text-center">
          <AlertTriangle size={40} className="text-[#ffaa00] mb-3" />
          <h3 className="text-base font-semibold text-[#e8eaf6] mb-1">Something went wrong</h3>
          <p className="text-sm text-[#8892b0] mb-4">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="aegis-btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
