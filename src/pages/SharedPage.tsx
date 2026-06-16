import React from 'react';
import ItineraryPage from './ItineraryPage.js';
import { useNavigation } from '../context/NavigationContext.js';

export default function SharedPage() {
  const { routeParams } = useNavigation();

  return (
    <div className="w-full">
      {/* Renders the precise full itinerary template styled read-only */}
      <ItineraryPage isReadOnly={true} sharedTokenOverride={routeParams || ''} />
    </div>
  );
}
