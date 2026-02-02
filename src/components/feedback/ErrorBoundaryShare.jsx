import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default class ErrorBoundaryShare extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Share error:', error, errorInfo);
    
    // Log zu Backend
    fetch('/api/errorHandler', {
      method: 'POST',
      body: JSON.stringify({
        error_type: 'SHARE_ERROR',
        error_message: error.message,
        context: errorInfo,
        user_email: 'unknown'
      })
    }).catch(err => console.log('Error logging failed:', err));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900">
                Fehler beim Sharing
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Ein Fehler ist aufgetreten. Bitte versuche es später erneut.
              </p>
              <Button
                onClick={() => this.setState({ hasError: false, error: null })}
                size="sm"
                className="mt-3"
              >
                Erneut versuchen
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}