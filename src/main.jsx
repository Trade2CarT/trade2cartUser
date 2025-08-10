import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './App.css';
import App from './App.jsx';
import { SettingsProvider } from './context/SettingsContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </HelmetProvider>
  </StrictMode>,
);