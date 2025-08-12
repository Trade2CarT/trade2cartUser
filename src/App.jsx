import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import SEO from './components/SEO';
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

// --- Import the account page components ---
import MyProfilePage from './components/account/MyProfilePage';
// MODIFIED: Renamed import for clarity to match the component name
import PoliciesAndTerms from './components/account/PoliciesAndTerms';


// Public and Protected route logic (No changes)
const PublicRoutes = () => {
  const { userMobile } = useSettings();
  return userMobile ? <Navigate to="/hello" replace /> : <Outlet />;
};

const ProtectedRoutes = () => {
  const { userMobile } = useSettings();
  return userMobile ? <Outlet /> : <Navigate to="/language" replace />;
};


const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Trade2Cart",
    "image": "https://trade2cart.in/logo.png",
    "@id": "https://trade2cart.in",
    "url": "https://trade2cart.in",
    "telephone": "+91-9876543210",
    "description": "Trade2Cart is an online scrap pickup service in India that connects sellers with verified scrap buyers. Book pickup online and get instant payment.",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN",
      "addressLocality": "Bengaluru",
      "addressRegion": "KA"
    },
    "sameAs": [
      "https://www.facebook.com/trade2cart",
      "https://www.instagram.com/trade2cart",
      "https://www.linkedin.com/company/trade2cart"
    ]
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <Splash />;
  }

  return (
    <ErrorBoundary>
      <SEO>
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      </SEO>

      <Router>
        <Toaster position="top-center" reverseOrder={false} />
        <Routes>
          {/* --- Protected Routes (No changes) --- */}
          <Route element={<ProtectedRoutes />}>
            <Route path="/hello" element={<HelloUser />} />
            <Route path="/trade" element={<TradePage />} />
            <Route path="/task" element={<TaskPage />} />
            <Route path="/account" element={<AccountPage />} />

            {/* --- Routes for account sections --- */}
            <Route path="/account/profile" element={<MyProfilePage />} />
            {/* MODIFIED: Using the updated import name */}
            <Route path="/account/policies" element={<PoliciesAndTerms />} />
          </Route>

          {/* --- Public Routes (No changes) --- */}
          <Route element={<PublicRoutes />}>
            <Route path="/language" element={<LanguageSelection />} />
            <Route path="/location" element={<LocationPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* --- Fallback Redirect (No changes) --- */}
          <Route path="*" element={<Navigate to="/hello" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

export default App;