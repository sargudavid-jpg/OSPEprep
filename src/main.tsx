import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App.tsx';

// Purge any legacy prototype mock items from browser localStorage
try {
  const legacyKeys = [
    'ospeprep_auth_user',
    'ospeprep_shared_materials',
    'ospeprep_subjects',
    'ospeprep_baas_config',
    'ospeprep_ai_config',
  ];
  legacyKeys.forEach((key) => localStorage.removeItem(key));
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k && (k.startsWith('ospeprep_user_chat_') || k.startsWith('ospeprep_user_sessions_'))) {
      localStorage.removeItem(k);
    }
  }
} catch {
  // ignore storage errors
}

// Clear any stale Service Worker caches from prototype
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  }).catch(() => {});
}
if ('caches' in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => caches.delete(key));
  }).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
