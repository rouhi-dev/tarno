import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './App';
import { StoreProvider } from './lib/store/StoreProvider';
import './styles/index.css';

/**
 * از HashRouter استفاده شده است تا سامانه روی هر میزبان ایستا (Vercel، Netlify،
 * GitHub Pages یا حتی اجرای مستقیم فایل) بدون نیاز به تنظیم rewrite کار کند.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </HashRouter>
  </StrictMode>,
);
