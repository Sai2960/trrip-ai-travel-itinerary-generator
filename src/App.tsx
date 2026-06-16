import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { NavigationProvider, useNavigation } from './context/NavigationContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';

// Import Pages
import LandingPage from './pages/LandingPage.js';
import LoginPage from './pages/LoginPage.js';
import RegisterPage from './pages/RegisterPage.js';
import Dashboard from './pages/Dashboard.js';
import UploadPage from './pages/UploadPage.js';
import ItineraryPage from './pages/ItineraryPage.js';
import HistoryPage from './pages/HistoryPage.js';
import SharedPage from './pages/SharedPage.js';
import ProfilePage from './pages/ProfilePage.js';

// Loading Skeleton screen
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4 font-sans">
      <div className="relative">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 animate-spin flex items-center justify-center text-white">
          <span className="text-xl font-extrabold pb-0.5">T</span>
        </div>
        <div className="w-3 h-3 bg-cyan-400 rounded-full absolute -top-1 -right-1 animate-ping"></div>
      </div>
      <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">Authenticating secure sessions...</p>
    </div>
  );
}

// Router Director coordinating Page views and login guardians
function RouteDirector() {
  const { currentPage } = useNavigation();
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Route guarding checklist
  const protectedPages = ['dashboard', 'upload', 'itinerary', 'history', 'profile'];
  const isProtected = protectedPages.includes(currentPage);

  // If user is not authenticated and attempts to enter locked panels, enforce redirect to login page
  if (isProtected && !user) {
    return <LoginPage />;
  }

  // Prevent logged in users from returning to Login/Register screens
  if (user && (currentPage === 'login' || currentPage === 'register')) {
    return <Dashboard />;
  }

  // Core Pages routers
  switch (currentPage) {
    case 'landing':
      return <LandingPage />;
    case 'login':
      return <LoginPage />;
    case 'register':
      return <RegisterPage />;
    case 'dashboard':
      return <Dashboard />;
    case 'upload':
      return <UploadPage />;
    case 'itinerary':
      return <ItineraryPage />;
    case 'history':
      return <HistoryPage />;
    case 'shared':
      return <SharedPage />;
    case 'profile':
      return <ProfilePage />;
    default:
      return <LandingPage />;
  }
}

// Wrapper to ensure Navigators and Auth states have context access
function AppContent() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-400">
      
      {/* Dynamic Ambient glow in top-right screen */}
      <div className="absolute top-0 right-0 w-[45vw] h-[35vh] bg-gradient-to-bl from-cyan-500/5 via-transparent to-transparent pointer-events-none -z-10"></div>
      
      <Navbar />
      
      <main className="flex-grow transition-opacity duration-300">
        <RouteDirector />
      </main>
      
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </AuthProvider>
  );
}
