import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { Database, hashPassword, verifyPassword, User } from './src/server/db.js';
import { extractDocInfo, generateItinerary } from './src/server/gemini.js';

// Load env variables
dotenv.config();

const app = express();
const PORT = 3000;

// Setup generous size limits for base64 travel document uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Stable fallback JWT secret in case it is not provided
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// JWT Helpers
function signJWT(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const sHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const sPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${sHeader}.${sPayload}`)
    .digest('base64url');
  return `${sHeader}.${sPayload}.${signature}`;
}

function verifyJWT(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [sHeader, sPayload, signature] = parts;
    const testSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${sHeader}.${sPayload}`)
      .digest('base64url');
    if (signature !== testSig) return null;
    const payload = JSON.parse(Buffer.from(sPayload, 'base64').toString('utf-8'));
    // Expressed in seconds (JWT standard) or milliseconds fallback
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Authentication Middleware
export interface AuthenticatedRequest extends Request {
  user?: User;
}

async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
  try {
    const authHeader = req.headers['authorization'];
    let token = req.headers['x-auth-token'] as string;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided, access denied' });
    }

    const decoded = verifyJWT(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Token is invalid or has expired' });
    }

    const user = await Database.users.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Authorized user no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error', err);
    res.status(500).json({ error: 'Authentication internal validation error' });
  }
}

// ==========================================
// REST API SYSTEM
// ==========================================

// Authenticated current sessions check
app.get('/api/auth/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  // FIX: spreading a live Mongoose document instance directly is unreliable
  // for fields like createdAt that come from schema timestamps. Convert to a
  // plain object first via toObject() so every field (including createdAt)
  // is guaranteed to be a real, serializable value.
  const userObj = (req.user as any).toObject();
  const { passwordHash, salt, ...safeUser } = userObj;
  res.status(200).json({ user: safeUser });
});

// Register route
app.post('/api/auth/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please submit name, email, and password fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUser = await Database.users.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email address already exists' });
    }

    // Secure custom hash
    const { hash, salt } = hashPassword(password);
    const user = await Database.users.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash: hash,
      salt
    });

    const token = signJWT({ userId: user.id });
    // FIX: same toObject() safety conversion as above, so createdAt
    // reaches the frontend as a real, properly serializable value.
    const userObj = user.toObject();
    const { passwordHash: _, salt: __, ...safeUser } = userObj;

    res.status(201).json({
      message: 'Account registered successfully',
      user: safeUser,
      token
    });
  } catch (err) {
    console.error('Registration failed', err);
    res.status(500).json({ error: 'A database error occurred during registration' });
  }
});

// Login Route
app.post('/api/auth/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please submit both email and password' });
    }

    const user = await Database.users.findByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password credentials' });
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid email or password credentials' });
    }

    const token = signJWT({ userId: user.id });
    // FIX: same toObject() safety conversion as register/me routes.
    const userObj = user.toObject();
    const { passwordHash: _, salt: __, ...safeUser } = userObj;

    res.status(200).json({
      message: 'Logged in successfully',
      user: safeUser,
      token
    });
  } catch (err) {
    console.error('Login failed', err);
    res.status(500).json({ error: 'A server error occurred during login' });
  }
});

// Document Upload & Information Extraction Engine
app.post('/api/upload', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { fileName, fileType, fileData, size } = req.body;

    if (!fileName || !fileType || !fileData) {
      return res.status(400).json({ error: 'Missing document payload properties' });
    }

    // Capture Base64 pure content
    let base64Pure = fileData;
    if (fileData.includes('base64,')) {
      base64Pure = fileData.split('base64,')[1];
    }

    // Run Multimodal extraction using Gemini AI
    console.log(`Sending document ${fileName} (${fileType}) to Gemini OCR Extraction Engine...`);
    const extractedInfo = await extractDocInfo(base64Pure, fileType, fileName);

    // Save in Database
    const doc = await Database.documents.create({
      userId: req.user!.id,
      name: fileName,
      fileType: fileType,
      size: size || fileData.length,
      extractedInfo
    });

    res.status(201).json({
      message: 'Document analyzed and extracted successfully',
      document: doc
    });
  } catch (err: any) {
    console.error('Document analysis error:', err);
    res.status(500).json({ error: err.message || 'Gemini AI document processing error' });
  }
});

// AI Itinerary Generation Engine
app.post('/api/itinerary/generate', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { name, departureCity, arrivalCity, startDate, endDate, docIds } = req.body;

    if (!name || !departureCity || !arrivalCity || !startDate || !endDate) {
      return res.status(400).json({ error: 'Please submit itinerary name, origin, destination, and dates' });
    }

    // Retrieve and aggregate extracted information from specified document IDs
    const extractedFacts: any[] = [];
    if (docIds && Array.isArray(docIds)) {
      for (const docId of docIds) {
        const doc = await Database.documents.findById(docId);
        // Ensure documents belong to requesting user
        // FIX: doc.userId is an ObjectId, req.user!.id is a string virtual getter.
        // Comparing them with === always returned false, silently dropping every
        // uploaded document's extracted facts. Normalize both to strings.
        if (doc && doc.userId.toString() === req.user!.id.toString()) {
          extractedFacts.push(doc.extractedInfo);
        }
      }
    }

    console.log(`Generating AI Travel Itinerary: ${departureCity} -> ${arrivalCity} (${startDate} to ${endDate}). Sending request to Gemini...`);
    
    const itineraryData = await generateItinerary(
      req.user!.id,
      name,
      departureCity,
      arrivalCity,
      startDate,
      endDate,
      extractedFacts
    );

    // Save in Database conforming exactly to FEATURE 8 DB schema
    const fullItinerary = await Database.itineraries.create({
      userId: req.user!.id,
      tripTitle: itineraryData.tripTitle || name,
      departureCity: itineraryData.departureCity || departureCity,
      arrivalCity: itineraryData.arrivalCity || arrivalCity,
      // Store dates strictly as fully validated ISO strings to solve BUG 1
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      generatedItinerary: itineraryData,
      extractedFromDocs: docIds || []
    });

    res.status(201).json({
      message: 'Travel itinerary generated successfully by Gemini AI',
      itinerary: fullItinerary
    });
  } catch (err: any) {
    console.error('AI generation route failed:', err);
    res.status(500).json({ error: err.message || 'Gemini AI itinerary processing failure' });
  }
});

// Get Itinerary history
app.get('/api/itinerary/history', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    let itineraries;
    if (query) {
      itineraries = await Database.itineraries.search(req.user!.id, query);
    } else {
      itineraries = await Database.itineraries.findByUserId(req.user!.id);
    }
    res.status(200).json({ itineraries });
  } catch (err) {
    console.error('History fetch failed', err);
    res.status(500).json({ error: 'Failed to retrieve itinerary search history' });
  }
});

// Get User Uploaded Documents list (for attaching to an itinerary)
app.get('/api/documents', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const documents = await Database.documents.findByUserId(req.user!.id);
    res.status(200).json({ documents });
  } catch (err) {
    console.error('Documents list fetch failed', err);
    res.status(500).json({ error: 'Failed to retrieve documents history' });
  }
});

// Public Share Route (FEATURE 4 - returns itinerary without auth middleware)
app.get('/api/itinerary/share/:token', async (req: Request, res: Response): Promise<any> => {
  try {
    const itinerary = await Database.itineraries.findByShareToken(req.params.token);
    if (!itinerary) {
      return res.status(404).json({ error: 'Shared travel itinerary was not found or is no longer available' });
    }
    res.status(200).json({ itinerary });
  } catch (err) {
    console.error('Shared itinerary fetch failed', err);
    res.status(500).json({ error: 'Failed to load shared itinerary' });
  }
});

// Retain duplicate public share route helper for routing backward compatibility
app.get('/api/share/:token', async (req: Request, res: Response): Promise<any> => {
  try {
    const itinerary = await Database.itineraries.findByShareToken(req.params.token);
    if (!itinerary) {
      return res.status(404).json({ error: 'Shared travel itinerary was not found or is no longer available' });
    }
    res.status(200).json({ itinerary });
  } catch (err) {
    console.error('Shared itinerary fetch failed', err);
    res.status(500).json({ error: 'Failed to load shared itinerary' });
  }
});

// Retrieve Single Itinerary
app.get('/api/itinerary/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const itinerary = await Database.itineraries.findById(req.params.id);
    if (!itinerary) {
      return res.status(404).json({ error: 'Itinerary not found' });
    }

    // Guard access unless shared or belongs to owner
    // FIX: itinerary.userId is an ObjectId, req.user!.id is a string virtual getter.
    // Comparing them with !== always returned true, blocking every owner from
    // viewing their own itinerary. Normalize both to strings before comparing.
    if (itinerary.userId.toString() !== req.user!.id.toString()) {
      return res.status(403).json({ error: 'Forbidden. You do not own this itinerary' });
    }

    res.status(200).json({ itinerary });
  } catch (err) {
    console.error('Itinerary fetch error', err);
    res.status(500).json({ error: 'Failed to load itinerary' });
  }
});

// Delete Itinerary
app.delete('/api/itinerary/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const success = await Database.itineraries.delete(req.params.id, req.user!.id);
    if (!success) {
      return res.status(404).json({ error: 'Itinerary not found or unauthorized' });
    }
    res.status(200).json({ message: 'Itinerary deleted successfully' });
  } catch (err) {
    console.error('Itinerary deletion error', err);
    res.status(500).json({ error: 'Server failed to delete itinerary' });
  }
});

// ==========================================
// STATIC FRONTEND SERVING & DEVELOPMENT
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Vite] Running Express API server with live Vite HMR proxy.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve client SPA inside fallback
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[Vite] Running in PRODUCTION mode serving compiled assets.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trrip AI Server booted successfully! Direct link: http://localhost:${PORT}`);
  });
}

startServer();