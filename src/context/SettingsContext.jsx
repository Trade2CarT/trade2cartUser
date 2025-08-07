import React, { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => localStorage.getItem('userLanguage') || '');
    const [location, setLocation] = useState(() => localStorage.getItem('userLocation') || '');
    const [userMobile, setUserMobile] = useState(() => localStorage.getItem('userMobile') || null);

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

    // This effect handles both login and logout for localStorage
    useEffect(() => {
        if (userMobile) {
            localStorage.setItem('userMobile', userMobile);
        } else {
            localStorage.removeItem('userMobile'); // This runs on logout
        }
    }, [userMobile]);

    const value = {
        language, setLanguage,
        location, setLocation,
        userMobile, setUserMobile,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};