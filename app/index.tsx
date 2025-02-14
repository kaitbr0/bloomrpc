import * as React from 'react';
import { render } from 'react-dom';
import './app.global.scss';
import { BloomRPC } from './components/BloomRPC';

console.log('index.tsx starting...');

// TODO: Import ace and configure workers when we implement proper syntax highlighting

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

try {
  console.log('Attempting to render...');
  render(
    <ErrorBoundary>
      <BloomRPC />
    </ErrorBoundary>,
    rootElement
  );
  console.log('Render complete');
} catch (error) {
  console.error('Render error:', error);
}
