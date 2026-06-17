import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

// ─── Connection ───────────────────────────────────────────────────────────────

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined in environment variables');

  await mongoose.connect(uri);
  isConnected = true;
  console.log('✅ MongoDB connected');
}

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

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

// ─── User ─────────────────────────────────────────────────────────────────────

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// ─── Uploaded Document ────────────────────────────────────────────────────────

export interface IUploadedDoc extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  fileType: string;
  size: number;
  extractedInfo: ExtractedInfo;
  createdAt: Date;
}

const ExtractedInfoSchema = new Schema<ExtractedInfo>(
  {
    departureCity: String,
    arrivalCity: String,
    travelDates: String,
    flightNumber: String,
    hotelName: String,
    hotelAddress: String,
    bookingReference: String,
    checkInDate: String,
    checkOutDate: String,
    passengerName: String,
    notes: String,
  },
  { _id: false }
);

const UploadedDocSchema = new Schema<IUploadedDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    fileType: { type: String, required: true },
    size: { type: Number, required: true },
    extractedInfo: { type: ExtractedInfoSchema, default: {} },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

export const UploadedDocModel: Model<IUploadedDoc> =
  mongoose.models.UploadedDoc ||
  mongoose.model<IUploadedDoc>('UploadedDoc', UploadedDocSchema);

// ─── Itinerary ────────────────────────────────────────────────────────────────

export interface IItinerary extends Document {
  userId: mongoose.Types.ObjectId;
  tripTitle: string;
  departureCity: string;
  arrivalCity: string;
  startDate: Date;
  endDate: Date;
  generatedItinerary: GeneratedItinerary;
  shareToken: string;
  uploadedFileUrl?: string;
  extractedFromDocs?: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const LodgingInfoSchema = new Schema<LodgingInfo>(
  {
    name: String,
    address: String,
    checkIn: String,
    checkOut: String,
    refCode: String,
  },
  { _id: false }
);

const DayItinerarySchema = new Schema<DayItinerary>(
  {
    dayNumber: Number,
    date: String,
    title: String,
    morning: String,
    afternoon: String,
    evening: String,
  },
  { _id: false }
);

const GeneratedItinerarySchema = new Schema<GeneratedItinerary>(
  {
    tripTitle: String,
    departureCity: String,
    arrivalCity: String,
    startDate: String,
    endDate: String,
    preJourneySummary: String,
    lodging: LodgingInfoSchema,
    days: [DayItinerarySchema],
    dining: [String],
    culturalTips: [String],
    packingList: [String],
  },
  { _id: false }
);

const ItinerarySchema = new Schema<IItinerary>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tripTitle: { type: String, required: true },
    departureCity: { type: String, required: true },
    arrivalCity: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    generatedItinerary: { type: GeneratedItinerarySchema, required: true },
    shareToken: { type: String, unique: true, default: () => crypto.randomBytes(12).toString('hex') },
    uploadedFileUrl: String,
    extractedFromDocs: [{ type: Schema.Types.ObjectId, ref: 'UploadedDoc' }],
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Text index for search (FEATURE search)
ItinerarySchema.index(
  { tripTitle: 'text', departureCity: 'text', arrivalCity: 'text' },
  { name: 'itinerary_text_search' }
);

export const ItineraryModel: Model<IItinerary> =
  mongoose.models.Itinerary ||
  mongoose.model<IItinerary>('Itinerary', ItinerarySchema);

// ─── Password Helpers ─────────────────────────────────────────────────────────

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return testHash === hash;
}

// ─── Database Helper (mirrors old API so your routes need minimal changes) ────

export const Database = {
  users: {
    async create(data: { name: string; email: string; passwordHash: string; salt: string }) {
      await connectDB();
      const user = await UserModel.create(data);
      return user;
    },

    async findByEmail(email: string) {
      await connectDB();
      return UserModel.findOne({ email: email.toLowerCase().trim() });
    },

    async findById(id: string) {
      await connectDB();
      return UserModel.findById(id);
    },
  },

  itineraries: {
    async create(data: Omit<IItinerary, 'id' | 'createdAt' | 'shareToken'>) {
      await connectDB();
      const itinerary = await ItineraryModel.create(data);
      return itinerary;
    },

    async findByUserId(userId: string) {
      await connectDB();
      return ItineraryModel.find({ userId }).sort({ createdAt: -1 });
    },

    async findById(id: string) {
      await connectDB();
      return ItineraryModel.findById(id);
    },

    async findByShareToken(token: string) {
      await connectDB();
      return ItineraryModel.findOne({
        $or: [{ shareToken: token }, { _id: mongoose.isValidObjectId(token) ? token : null }],
      });
    },

    async delete(id: string, userId: string) {
      await connectDB();
      const result = await ItineraryModel.deleteOne({ _id: id, userId });
      return result.deletedCount > 0;
    },

    async search(userId: string, query: string) {
      await connectDB();
      if (!query.trim()) return ItineraryModel.find({ userId }).sort({ createdAt: -1 });

      return ItineraryModel.find({
        userId,
        $or: [
          { tripTitle: { $regex: query, $options: 'i' } },
          { departureCity: { $regex: query, $options: 'i' } },
          { arrivalCity: { $regex: query, $options: 'i' } },
          { 'generatedItinerary.preJourneySummary': { $regex: query, $options: 'i' } },
        ],
      }).sort({ createdAt: -1 });
    },
  },

  documents: {
    async create(data: Omit<IUploadedDoc, 'id' | 'createdAt'>) {
      await connectDB();
      return UploadedDocModel.create(data);
    },

    async findByUserId(userId: string) {
      await connectDB();
      return UploadedDocModel.find({ userId }).sort({ createdAt: -1 });
    },

    async findById(id: string) {
      await connectDB();
      return UploadedDocModel.findById(id);
    },

    async delete(id: string, userId: string) {
      await connectDB();
      const result = await UploadedDocModel.deleteOne({ _id: id, userId });
      return result.deletedCount > 0;
    },
  },
};