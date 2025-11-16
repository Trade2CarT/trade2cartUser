// src/context/SettingsContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => localStorage.getItem('userLanguage') || '');
    const [location, setLocation] = useState(() => localStorage.getItem('userLocation') || '');
    const [userMobile, setUserMobile] = useState(() => localStorage.getItem('userMobile') || null);

    // --- ADD THIS STATE ---
    // This will hold the install prompt event
    const [installPrompt, setInstallPrompt] = useState(null);

    useEffect(() => {
        if (language) {
            localStorage.setItem('userLanguage', language);
        }
    }, [language]);

    useEffect(() => {
        if (location) {
            localStorage.setItem('userLocation', location);
        }
    }, [location]);

    useEffect(() => {
        if (userMobile) {
            localStorage.setItem('userMobile', userMobile);
        } else {
            localStorage.removeItem('userMobile');
        }
    }, [userMobile]);

    // --- ADD THIS EFFECT ---
    // This effect will listen for the browser's install prompt
    useEffect(() => {
        const handler = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Save the event so it can be triggered later.
            setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Cleanup
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);


    const value = {
        language, setLanguage,
        location, setLocation,
        userMobile, setUserMobile,
        installPrompt, // <-- Add the prompt to your context value
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};