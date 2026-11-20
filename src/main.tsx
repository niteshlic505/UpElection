import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (event) => {
      const source = event.filename || '';
      const stack = event.error instanceof Error ? event.error.stack || '' : '';
      const isExtensionError =
        source.startsWith('chrome-extension://') ||
        source.startsWith('moz-extension://') ||
        stack.includes('chrome-extension://') ||
        stack.includes('moz-extension://');
      if (isExtensionError) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );
}

if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onOfflineReady() {
      // Service worker ready for offline app-view launch
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
