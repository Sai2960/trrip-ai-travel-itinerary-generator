import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Definitions matching MongoDB/Mongoose models (Orbitra Technologies Assignment)
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
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

// Full structure of the Gemini generated response as defined in FEATURE 1
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

// FEATURE 8 - Database Itinerary Schema
export interface Itinerary {
  id: string;
  userId: string;
  tripTitle: string;
  departureCity: string;
  arrivalCity: string;
  startDate: string; // ISO string Date format
  endDate: string;   // ISO string Date format
  generatedItinerary: GeneratedItinerary; // full Gemini JSON response object
  shareToken: string; // unique public link token
  uploadedFileUrl?: string; // S3 or Cloudinary or inline base64 if needed
  createdAt: string;
  extractedFromDocs?: string[]; // Source doc IDs
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

interface DBState {
  users: User[];
  itineraries: Itinerary[];
  documents: UploadedDoc[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'db.json');

let dbState: DBState = {
  users: [],
  itineraries: [],
  documents: []
};

function ensureDBExists() {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE_PATH)) {
    saveDB();
  } else {
    try {
      const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      dbState = JSON.parse(data);
      if (!dbState.users) dbState.users = [];
      if (!dbState.itineraries) dbState.itineraries = [];
      if (!dbState.documents) dbState.documents = [];
    } catch (e) {
      console.error('Error parsing JSON db, starting clean', e);
      saveDB();
    }
  }
}

function saveDB() {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write database file', err);
  }
}

ensureDBExists();

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return testHash === hash;
}

export const Database = {
  users: {
    async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
      const newUser: User = {
        ...user,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      };
      dbState.users.push(newUser);
      saveDB();
      return newUser;
    },

    async findByEmail(email: string): Promise<User | null> {
      const emailLower = email.toLowerCase().trim();
      const user = dbState.users.find(u => u.email.toLowerCase().trim() === emailLower);
      return user || null;
    },

    async findById(id: string): Promise<User | null> {
      const user = dbState.users.find(u => u.id === id);
      return user || null;
    }
  },

  itineraries: {
    async create(itinerary: Omit<Itinerary, 'id' | 'createdAt' | 'shareToken'>): Promise<Itinerary> {
      const newItinerary: Itinerary = {
        ...itinerary,
        id: crypto.randomUUID(),
        shareToken: crypto.randomBytes(12).toString('hex'), // matches FEATURE 4
        createdAt: new Date().toISOString()
      };
      dbState.itineraries.push(newItinerary);
      saveDB();
      return newItinerary;
    },

    async findByUserId(userId: string): Promise<Itinerary[]> {
      return dbState.itineraries
        .filter(it => it.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    async findById(id: string): Promise<Itinerary | null> {
      const itinerary = dbState.itineraries.find(it => it.id === id);
      return itinerary || null;
    },

    async findByShareToken(token: string): Promise<Itinerary | null> {
      const itinerary = dbState.itineraries.find(it => it.shareToken === token || it.id === token);
      return itinerary || null;
    },

    async delete(id: string, userId: string): Promise<boolean> {
      const initialLength = dbState.itineraries.length;
      dbState.itineraries = dbState.itineraries.filter(it => !(it.id === id && it.userId === userId));
      const hasChanged = dbState.itineraries.length < initialLength;
      if (hasChanged) {
        saveDB();
      }
      return hasChanged;
    },

    async search(userId: string, query: string): Promise<Itinerary[]> {
      const filter = query.toLowerCase().trim();
      const userItineraries = dbState.itineraries.filter(it => it.userId === userId);
      if (!filter) return userItineraries;

      return userItineraries.filter(it => 
        it.tripTitle.toLowerCase().includes(filter) ||
        it.departureCity.toLowerCase().includes(filter) ||
        it.arrivalCity.toLowerCase().includes(filter) ||
        it.generatedItinerary?.preJourneySummary?.toLowerCase().includes(filter)
      );
    }
  },

  documents: {
    async create(doc: Omit<UploadedDoc, 'id' | 'createdAt'>): Promise<UploadedDoc> {
      const newDoc: UploadedDoc = {
        ...doc,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      };
      dbState.documents.push(newDoc);
      saveDB();
      return newDoc;
    },

    async findByUserId(userId: string): Promise<UploadedDoc[]> {
      return dbState.documents
        .filter(d => d.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    async findById(id: string): Promise<UploadedDoc | null> {
      const doc = dbState.documents.find(d => d.id === id);
      return doc || null;
    }
  }
};
