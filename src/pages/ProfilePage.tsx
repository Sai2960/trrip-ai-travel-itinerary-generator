import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigation } from '../context/NavigationContext.js';
import { GlassCard } from '../components/GlassCard.js';
import { 
  User, 
  Mail, 
  Calendar, 
  Check, 
  Database, 
  Sparkles, 
  Compass, 
  Cpu, 
  FileCheck,
  AlertCircle,
  HardDrive
} from 'lucide-react';

export default function ProfilePage() {
  const { user, authFetch } = useAuth();
  const { navigate } = useNavigation();

  const [seeding, setSeeding] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // FIX: defensive formatter so a missing/unparseable createdAt never
  // renders the literal text "Invalid Date" to the user.
  const formatJoinDate = (value?: string | Date) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString();
  };

  const handleSeedMockData = async () => {
    setSeeding(true);
    setSuccess(false);
    setError(null);

    try {
      // Prompt backend mock generator to seed nice records!
      // Wait, we can implement an internal endpoint or we can mock generate files directly.
      // To keep it clean, let's do direct calls to save doc + itinerary using API calls so we populate the real files!
      
      // Let's seed a Flight Document
      const flightDoc = await authFetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: 'ana_airlines_ticket_nrt.pdf',
          fileType: 'application/pdf',
          fileData: 'DummyData',
          size: 142405
        })
      });

      // Let's seed a Hotel booking Document
      const hotelDoc = await authFetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: 'shibuya_sky_hotel_stay.png',
          fileType: 'image/png',
          fileData: 'DummyData',
          size: 89405
        })
      });

      // Let's seed an itinerary with these documents!
      const itinerary = await authFetch('/api/itinerary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Shibuya & Kyoto Cherry Blossom Run',
          departureCity: 'Los Angeles (LAX)',
          arrivalCity: 'Tokyo Narita (NRT)',
          startDate: '2026-07-10',
          endDate: '2026-07-16',
          docIds: [] // Custom generation fallback will create beautiful Tokyo layout!
        })
      });

      if (flightDoc.ok && hotelDoc.ok && itinerary.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          navigate('dashboard');
        }, 1500);
      } else {
        setError('Database communications failed during seeding.');
      }
    } catch (e) {
      console.error('Failed to seed DB data', e);
      setError('Network communication problem seeding database.');
    } finally {
      setSeeding(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white min-h-[calc(100vh-16rem)] space-y-8">
      
      {/* Intro */}
      <div className="border-b border-slate-900 pb-5">
        <h1 className="text-2xl font-extrabold flex items-center space-x-2">
          <User className="w-6 h-6 text-cyan-400" />
          <span>My Profile & Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Review your credentials, check API system status, or load demo profiles.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* User Card */}
        <GlassCard className="p-6 md:col-span-2 space-y-5">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Account Credentials</h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3.5">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">User Name</p>
                <p className="text-sm font-semibold text-white">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3.5">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Email Address</p>
                <p className="text-sm font-semibold text-white">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3.5">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Created On</p>
                <p className="text-xs font-mono text-slate-350">{formatJoinDate(user.createdAt)}</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* System telemetry logs */}
        <GlassCard className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Telemetry</span>
          </h3>

          <div className="space-y-3 font-mono text-[10px] text-slate-405 leading-relaxed">
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span>DB STORE</span>
              <span className="text-green-400 font-bold">LOCAL JSON</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span>JWT AUTH</span>
              <span className="text-emerald-400">HMAC-256</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1">
              <span>AI HOST</span>
              <span className="text-cyan-400">GEMINI LLM</span>
            </div>
            <div className="flex justify-between">
              <span>TARGET PORT</span>
              <span className="text-slate-205">3000 (INGRESS)</span>
            </div>
          </div>
        </GlassCard>

      </div>

      {/* Database control panel -> Recruiter friendly mock data seeding */}
      <GlassCard className="p-6 border-slate-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 rounded-full blur-2xl"></div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-sm font-bold text-slate-150 flex items-center space-x-2">
              <Database className="w-4.5 h-4.5 text-cyan-400" />
              <span>Simulate Demonstration travel files</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              Pressing this button will seed your account history with mock boarding documents, Shibuya Sky hotel reservations, and custom-generated day-wise itineraries, populating your dashboard immediately. Great for evaluating product features without uploading manual PDFs!
            </p>
          </div>

          <button
            onClick={handleSeedMockData}
            disabled={seeding || success}
            className={`
              flex items-center space-x-2 shrink-0 px-5.5 py-3 rounded-xl text-xs font-bold shadow-md transition duration-200 active:scale-95 disabled:opacity-50
              ${success 
                ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/40' 
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800'}
            `}
          >
            {seeding ? (
              <>
                <HardDrive className="w-4.5 h-4.5 animate-spin text-cyan-400" />
                <span>Generating logs...</span>
              </>
            ) : success ? (
              <>
                <Check className="w-4.5 h-4.5 text-emerald-400 animate-bounce" />
                <span>Database Seeded!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4.5 h-4.5 text-cyan-400" />
                <span>Seed Travel Profile</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-start space-x-2 bg-red-950/20 border border-red-900/40 p-3 rounded-xl text-[11px] text-red-400 mt-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </GlassCard>

    </div>
  );
}