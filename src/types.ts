export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface LodgingInfo {
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  refCode?: string;
}

export interface DayItinerary {
  dayNumber: number;
  date: string;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
}

export interface GeneratedItinerary {
  tripTitle: string;
  departureCity: string;
  arrivalCity: string;
  startDate: string;
  endDate: string;
  preJourneySummary: string;
  lodging: LodgingInfo;
  days: DayItinerary[];
  dining: string[];
  culturalTips: string[];
  packingList: string[];
}

export interface Itinerary {
  id: string;
  userId: string;
  tripTitle: string;
  departureCity: string;
  arrivalCity: string;
  startDate: string; // ISO format string
  endDate: string;   // ISO format string
  generatedItinerary: GeneratedItinerary;
  shareToken: string;
  uploadedFileUrl?: string;
  createdAt: string;
  extractedFromDocs?: string[];
}

export interface ExtractedInfo {
  departureCity?: string;
  arrivalCity?: string;
  travelDates?: string;
  flightNumber?: string;
  hotelName?: string;
  hotelAddress?: string;
  bookingReference?: string;
  checkInDate?: string;
  checkOutDate?: string;
  passengerName?: string;
  notes?: string;
}

export interface UploadedDoc {
  id: string;
  userId: string;
  name: string;
  fileType: string;
  size: number;
  extractedInfo: ExtractedInfo;
  createdAt: string;
}

export type PageRoute =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'upload'
  | 'itinerary'
  | 'history'
  | 'shared'
  | 'profile';
