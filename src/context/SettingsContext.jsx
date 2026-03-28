import React, { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    // ✅ FIX: Load from LocalStorage first so it never disappears on refresh!
    const [location, setLocationState] = useState(() => localStorage.getItem('userLocation') || '');
    const [language, setLanguageState] = useState(() => localStorage.getItem('userLanguage') || 'English');
    const [userMobile, setUserMobile] = useState('');

    // ✅ FIX: Save to LocalStorage whenever the user changes their location
    const setLocation = (newLocation) => {
        setLocationState(newLocation);
        localStorage.setItem('userLocation', newLocation);
    };

    const setLanguage = (newLanguage) => {
        setLanguageState(newLanguage);
        localStorage.setItem('userLanguage', newLanguage);
    };

    return (
        <SettingsContext.Provider value={{
            location,
            setLocation,
            language,
            setLanguage,
            userMobile,
            setUserMobile
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);