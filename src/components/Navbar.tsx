import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigation } from '../context/NavigationContext.js';
import { 
  Compass, 
  Menu, 
  X, 
  LayoutDashboard, 
  UploadCloud, 
  History, 
  User, 
  LogOut 
} from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();
  const { currentPage, navigate } = useNavigation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', page: 'dashboard' as const, icon: LayoutDashboard },
    { label: 'Upload Documents', page: 'upload' as const, icon: UploadCloud },
    { label: 'Itineraries', page: 'history' as const, icon: History },
    { label: 'My Profile', page: 'profile' as const, icon: User },
  ];

  const handleNav = (page: typeof navItems[number]['page']) => {
    navigate(page);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('landing');
    setMobileMenuOpen(false);
  };

  // If in shared view or landing without login, the navbar is minimal
  const showNavLinks = user && currentPage !== 'landing' && currentPage !== 'shared';

  return (
    <nav className="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-900/60 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div 
            onClick={() => navigate(user ? 'dashboard' : 'landing')}
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <div className="bg-gradient-to-tr from-cyan-500 to-blue-600 p-2 rounded-xl text-white group-hover:scale-105 transition-transform duration-200 shadow-md shadow-cyan-550/10">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white bg-clip-text">
              Trrip<span className="text-cyan-400 font-medium">.ai</span>
            </span>
          </div>

          {/* Large Screen Navigation links */}
          {showNavLinks && (
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const isActive = currentPage === item.page;
                const Icon = item.icon;
                return (
                  <button
                    key={item.page}
                    onClick={() => handleNav(item.page)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-slate-900 text-cyan-400 border border-slate-800' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Right hand buttons / auth check */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="hidden lg:inline text-xs text-slate-400 bg-slate-900/50 px-3 py-1.5 border border-slate-900 rounded-full">
                  Hello, <span className="text-white font-medium">{user.name}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 bg-slate-900/60 hover:bg-red-950/20 text-slate-400 hover:text-red-400 border border-slate-900 hover:border-red-900/40 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('login')}
                  className="text-slate-300 hover:text-white text-sm font-medium px-4 py-2 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('register')}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold px-5 py-2 rounded-xl shadow-lg shadow-cyan-950/20 transition-all duration-200 active:scale-95"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile toggle button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 focus:outline-none transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 backdrop-blur-lg border-b border-slate-900/80">
          <div className="px-2 pt-2 pb-4 space-y-1">
            {showNavLinks && navItems.map((item) => {
              const isActive = currentPage === item.page;
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  onClick={() => handleNav(item.page)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-slate-900 text-cyan-400' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {user ? (
              <div className="pt-4 border-t border-slate-900/80 mt-4 px-4 space-y-3">
                <div className="text-xs text-slate-400">
                  Logged in as <span className="text-white font-semibold">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/40 py-2.5 rounded-xl text-sm font-medium transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-900/80 mt-4 px-4 flex flex-col space-y-2">
                <button
                  onClick={() => { navigate('login'); setMobileMenuOpen(false); }}
                  className="w-full text-center text-slate-300 hover:text-white py-2.5 hover:bg-slate-900 rounded-xl"
                >
                  Login
                </button>
                <button
                  onClick={() => { navigate('register'); setMobileMenuOpen(false); }}
                  className="w-full text-center bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-2.5 rounded-xl shadow-lg"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
