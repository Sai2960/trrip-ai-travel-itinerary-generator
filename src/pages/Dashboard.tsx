import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigation } from '../context/NavigationContext.js';
import { GlassCard } from '../components/GlassCard.js';
import { Itinerary, UploadedDoc } from '../types.js';
import { 
  Sparkles, 
  UploadCloud, 
  History, 
  MapPin, 
  Plus, 
  Compass, 
  Calendar, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  Search,
  FileText
} from 'lucide-react';

export default function Dashboard() {
  const { authFetch } = useAuth();
  const { navigate } = useNavigation();

  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Stats
  const totalTrips = itineraries.length;
  const recentTrip = itineraries[0] || null;
  const docsCount = documents.length;

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch itineraries
      const resIt = await authFetch(`/api/itinerary/history${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
      if (resIt.ok) {
        const data = await resIt.json();
        setItineraries(data.itineraries || []);
      }

      // Fetch docs
      const resDocs = await authFetch('/api/documents');
      if (resDocs.ok) {
        const data = await resDocs.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  const handleDeleteItinerary = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering route navigation click
    if (!window.confirm('Are you absolute sure you want to delete this trip itinerary?')) return;
    
    setDeletingId(id);
    try {
      const res = await authFetch(`/api/itinerary/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItineraries(prev => prev.filter(it => it.id !== id));
      } else {
        alert('Failed to delete itinerary.');
      }
    } catch (err) {
      console.error('Failed deleting itinerary', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white min-h-[calc(100vh-16rem)] space-y-10">
      
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Your Travel Center</h1>
          <p className="text-sm text-slate-400 mt-1">
            Parse boarding docs, review parsed facts, or build curated day schedules with Gemini.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('upload')}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 px-4.5 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <UploadCloud className="w-4 h-4 text-cyan-400" />
            <span>Upload Bookings</span>
          </button>
          
          <button
            onClick={() => navigate('upload')} // Upload page includes the planning trigger
            className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-cyan-950/20 transition hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Itinerary</span>
          </button>
        </div>
      </div>

      {/* Analytics Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Stat Card 1: Total Trips */}
        <GlassCard className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <Compass className="w-16 h-16 text-cyan-400" />
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Trip Plans</p>
          <p className="text-4xl font-extrabold text-white mt-2">{totalTrips}</p>
          <div className="mt-4 text-xs text-slate-500">
            {totalTrips > 0 ? `${totalTrips} destination schedules prepared` : 'No itineraries compiled yet'}
          </div>
        </GlassCard>

        {/* Stat Card 2: Uploaded Documents */}
        <GlassCard className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <FileText className="w-16 h-16 text-blue-500" />
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Attached Documents</p>
          <p className="text-4xl font-extrabold text-white mt-2">{docsCount}</p>
          <div className="mt-4 text-xs text-slate-500">
            {docsCount > 0 ? `${docsCount} bookings parsed secure` : 'Zero items uploaded'}
          </div>
        </GlassCard>

        {/* Stat Card 3: Recent Trip Destination */}
        <GlassCard className="p-6 md:col-span-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-300 animate-pulse">
            <Sparkles className="w-20 h-20 text-indigo-400" />
          </div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Travel Spotlight</p>
          {recentTrip ? (
            <div className="mt-2.5 flex items-start space-x-3.5">
              <div className="bg-cyan-950/20 text-cyan-400 p-2.5 rounded-xl border border-cyan-900/30">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-white line-clamp-1">{recentTrip.name}</p>
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <span>{recentTrip.departureCity}</span>
                  <span>→</span>
                  <span className="text-cyan-400 font-semibold">{recentTrip.arrivalCity}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 flex items-center space-x-1.5 mt-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>{recentTrip.startDate} to {recentTrip.endDate}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-300">Ready for your next journey?</p>
              <p className="text-xs text-slate-500 mt-1">Upload files to extract locations, or start a leisure schedule directly.</p>
            </div>
          )}
        </GlassCard>

      </div>

      {/* Main content grid: Search & Itineraries list on left, Documents sidebar on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Itineraries Lists */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <History className="w-5 h-5 text-cyan-400" />
              <span>Itinerary History</span>
            </h2>

            {/* Quick search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-550 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search trip history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-slate-900/50 border border-slate-850 hover:border-slate-800 focus:border-cyan-550/40 text-slate-300 placeholder-slate-600 rounded-xl pl-9 pr-4 py-2 outline-none transition"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse bg-slate-900/30 border border-slate-900 h-28 rounded-2xl flex items-center p-6 space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-900 w-1/3 rounded"></div>
                    <div className="h-3 bg-slate-900 w-1/2 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : itineraries.length === 0 ? (
            <GlassCard className="p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-300">No matching itineraries found</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  {searchQuery ? "No results match your search keywords." : "Upload tickets to start parsing booking data or type a custom destination schedule."}
                </p>
              </div>
              {!searchQuery && (
                <button
                  onClick={() => navigate('upload')}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs px-4 py-2 rounded-xl font-bold transition mt-2"
                >
                  Create Trip Draft
                </button>
              )}
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {itineraries.map((it) => (
                <GlassCard
                  key={it.id}
                  hoverEffect
                  onClick={() => navigate('itinerary', it.id)}
                  className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer relative"
                >
                  <div className="flex items-start space-x-4">
                    <div className="bg-cyan-950/20 text-cyan-400 p-3 rounded-xl border border-cyan-900/30 shrink-0">
                      <MapPin className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-150 group-hover:text-cyan-400 transition text-base">{it.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400 mt-1">
                        <span>{it.departureCity}</span>
                        <span>→</span>
                        <span className="text-white font-medium">{it.arrivalCity}</span>
                        <span className="text-slate-600">•</span>
                        <div className="flex items-center text-slate-500 font-mono text-[10px]">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>{it.startDate} to {it.endDate}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-1 italic">
                        "{it.tripSummary}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto uppercase tracking-wide">
                    {/* Share action indicator */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('shared', it.shareToken);
                      }}
                      title="Open shared live page"
                      className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-cyan-400 rounded-xl transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    {/* Delete action */}
                    <button
                      disabled={deletingId === it.id}
                      onClick={(e) => handleDeleteItinerary(it.id, e)}
                      title="Delete itinerary permanent"
                      className="p-2 bg-slate-900/80 hover:bg-red-950/40 border border-slate-850 text-slate-400 hover:text-red-400 rounded-xl transition disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-slate-600 hidden sm:block" />
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Uploaded Documents Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border-b border-slate-900 pb-4">
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-cyan-450" />
              <span>Parsed Documents</span>
            </h2>
          </div>

          {documents.length === 0 ? (
            <GlassCard className="p-6 text-center space-y-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 mx-auto">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-400 font-medium">No booking Slips parsed yet</p>
              <button
                onClick={() => navigate('upload')}
                className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-805 text-[11px] px-3.5 py-1.5 rounded-lg font-semibold transition"
              >
                Scan Ticket Info
              </button>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {documents.slice(0, 5).map((doc) => (
                <GlassCard key={doc.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start space-x-2.5">
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-semibold text-slate-200 truncate pr-2">{doc.name}</p>
                      <span className="block text-[10px] text-slate-500 uppercase font-mono font-bold tracking-wider">{doc.fileType.split('/')[1] || 'DOC'} • {(doc.size / 1024).toFixed(1)} KB</span>
                      
                      {/* Show basic extracted facts */}
                      {(doc.extractedInfo.arrivalCity || doc.extractedInfo.hotelName) && (
                        <div className="text-[10px] text-cyan-400/80 bg-cyan-950/10 border border-cyan-900/10 px-2 py-0.5 rounded mt-1.5 flex items-center space-x-1.5 w-fit">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {doc.extractedInfo.hotelName || doc.extractedInfo.arrivalCity}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))}
              {documents.length > 5 && (
                <button
                  onClick={() => navigate('upload')}
                  className="w-full text-center text-xs text-slate-400 hover:text-white py-2 bg-slate-900/20 rounded-xl hover:bg-slate-900/40 transition font-medium border border-slate-900"
                >
                  View other {documents.length - 5} documents
                </button>
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
