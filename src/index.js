import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// ========================================
// REGISTER SERVICE WORKER UNTUK PWA
// ========================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration);

        // Optional: Check for updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New update available
                  console.log('🔄 New content is available, please refresh.');
                  // Optional: Show notification to user
                  if (window.confirm('Update tersedia! Reload untuk mendapatkan versi terbaru?')) {
                    window.location.reload();
                  }
                } else {
                  // First time install
                  console.log('✅ Content is cached for offline use.');
                }
              }
            };
          }
        };
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}

// Optional: Handle offline/online status
window.addEventListener('online', () => {
  console.log('📶 Aplikasi online');
  // Optional: Show notification
});

window.addEventListener('offline', () => {
  console.log('📴 Aplikasi offline - menggunakan cache');
  // Optional: Show notification
});