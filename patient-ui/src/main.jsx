import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

// Request persistent storage so the browser never silently evicts
// IndexedDB data (drafts, queued submissions, cached forms) during periods
// of inactivity (e.g. 5-day offline field scenarios).
// Without this the storage is "best-effort" and can be evicted at any time.
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((granted) => {
    if (granted) {
      console.log('[Storage] Persistent storage granted — data is safe from eviction.');
    } else {
      console.warn(
        '[Storage] Persistent storage NOT granted. Data may be evicted by the browser ' +
        'after prolonged inactivity. Ask the user to install the PWA (Add to Home Screen) ' +
        'to improve persistence on mobile devices.'
      );
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
