import React, { createContext, useContext, useState, useEffect } from 'react';
import { PageRoute } from '../types.js';

interface NavigationContextType {
  currentPage: PageRoute;
  routeParams: string | null;
  navigate: (page: PageRoute, params?: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState<PageRoute>('landing');
  const [routeParams, setRouteParams] = useState<string | null>(null);

  // Parse window Hash to decide starting route
  const parseHash = () => {
    const hash = window.location.hash || '#/';
    
    // Pattern: #/share/token
    if (hash.startsWith('#/share/')) {
      const token = hash.replace('#/share/', '');
      setCurrentPage('shared');
      setRouteParams(token || null);
    } 
    // Pattern: #/itinerary/id
    else if (hash.startsWith('#/itinerary/')) {
      const id = hash.replace('#/itinerary/', '');
      setCurrentPage('itinerary');
      setRouteParams(id || null);
    } 
    // Pattern: #/pageName
    else {
      const page = hash.replace('#/', '').trim();
      const validPages: PageRoute[] = [
        'landing',
        'login',
        'register',
        'dashboard',
        'upload',
        'itinerary',
        'history',
        'shared',
        'profile'
      ];
      
      if (validPages.includes(page as PageRoute)) {
        setCurrentPage(page as PageRoute);
        setRouteParams(null);
      } else {
        // Default route
        setCurrentPage('landing');
        setRouteParams(null);
      }
    }
  };

  useEffect(() => {
    parseHash(); // Parse on load
    
    const handleHashChange = () => {
      parseHash();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigate = (page: PageRoute, params: string = '') => {
    if (page === 'shared' && params) {
      window.location.hash = `#/share/${params}`;
    } else if (page === 'itinerary' && params) {
      window.location.hash = `#/itinerary/${params}`;
    } else {
      window.location.hash = `#/${page}`;
    }
  };

  return (
    <NavigationContext.Provider value={{ currentPage, routeParams, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be utilized within a NavigationProvider');
  }
  return context;
}
