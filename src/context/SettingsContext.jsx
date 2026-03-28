import React, { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    // Initialize directly from LocalStorage so it never vanishes on refresh
    const [language, setLanguageState] = useState(() => localStorage.getItem('userLanguage') || 'English');
    const [location, setLocationState] = useState(() => localStorage.getItem('userLocation') || '');
    const [userMobile, setUserMobileState] = useState(() => localStorage.getItem('userMobile') || null);

    const [installPrompt, setInstallPrompt] = useState(null);

    // ✅ FIX 1: Synchronous Wrapper perfectly saves to memory instantly before any navigation happens
    const setLocation = (newLocation) => {
        localStorage.setItem('userLocation', newLocation);
        setLocationState(newLocation);
    };

    const setLanguage = (newLanguage) => {
        localStorage.setItem('userLanguage', newLanguage);
        setLanguageState(newLanguage);
    };

    const setUserMobile = (mobile) => {
        if (mobile) {
            localStorage.setItem('userMobile', mobile);
        } else {
            localStorage.removeItem('userMobile');
        }
        setUserMobileState(mobile);
    };

    // PWA Install Prompt Listener
    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const value = {
        language, setLanguage,
        location, setLocation,
        userMobile, setUserMobile,
        installPrompt,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};