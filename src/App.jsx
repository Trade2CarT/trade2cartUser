import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Splash from './components/Splash';
import LanguageSelection from './components/LanguageSelection';
import LocationPage from './components/LocationPage';
import LoginPage from './components/LoginPage';
import HelloUser from './components/HelloUser';
import TradePage from './components/TradePage';
import TaskPage from './components/TaskPage';
import AccountPage from './components/AccountPage';
import ErrorBoundary from './components/ErrorBoundary';
import { useSettings } from './context/SettingsContext';

// A layout for routes that are only accessible when logged OUT
const PublicRoutes = () => {
  const { userMobile } = useSettings();
  // If the user IS logged in, navigate them away from public pages like login
  return userMobile ? <Navigate to="/hello" replace /> : <Outlet />;
};

// A layout for routes that require a user to be logged IN
const ProtectedRoutes = () => {
  const { userMobile } = useSettings();
  // If the user is NOT logged in, send them to the start of the login flow
  return userMobile ? <Outlet /> : <Navigate to="/language" replace />;
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <Splash />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Toaster position="top-center" reverseOrder={false} />
        <Routes>
          {/* --- Protected Routes (what logged-in users see) --- */}
          <Route element={<ProtectedRoutes />}>
            <Route path="/hello" element={<HelloUser />} />
            <Route path="/trade" element={<TradePage />} />
            <Route path="/task" element={<TaskPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>

          {/* --- Public Routes (what new/logged-out users see) --- */}
          <Route element={<PublicRoutes />}>
            <Route path="/language" element={<LanguageSelection />} />
            <Route path="/location" element={<LocationPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* --- A fallback to redirect any stray URL to a safe place --- */}
          <Route path="*" element={<Navigate to="/hello" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

export default App;