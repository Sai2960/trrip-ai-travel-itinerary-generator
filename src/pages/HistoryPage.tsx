import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigation } from '../context/NavigationContext.js';
import { GlassCard } from '../components/GlassCard.js';
import { Itinerary } from '../types.js';
import { 
  History, 
  MapPin, 
  Calendar, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  Search,
  Compass
} from 'lucide-react';

export default function HistoryPage() {
  const { authFetch } = useAuth();
  const { navigate } = useNavigation();

  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await authFetch(`/api/itinerary/history?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setItineraries(data.itineraries || []);
      }
    } catch (err) {
      console.error('Error fetching itinerary history list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this travel itinerary forever?')) return;
    
    setDeletingId(id);
    try {
      const res = await authFetch(`/api/itinerary/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItineraries(prev => prev.filter(it => it.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete itinerary', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const clean = dateStr.split('T')[0];
      const d = new Date(clean);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white min-h-[calc(100vh-16rem)] space-y-6">
      
      {/* Header with Search Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center space-x-2">
            <History className="w-6 h-6 text-cyan-400" />
            <span>Itinerary Archives</span>
          </h1>
          <p className="text-xs text-slate-405 mt-1">Review, search, or delete your historically processed travel plans.</p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search keywords, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-slate-900/50 border border-slate-850 focus:border-cyan-550/40 text-slate-205 placeholder-slate-600 rounded-xl pl-9 pr-4 py-2.5 outline-none transition"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-slate-900/35 border border-slate-905 h-24 rounded-2xl p-6"></div>
          ))}
        </div>
      ) : itineraries.length === 0 ? (
        <GlassCard className="p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
            <Compass className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-350">No travel logs found</h3>
            <p className="text-xs text-slate-500 font-normal">
              {searchQuery ? "No results matched your keywords." : "You have not generated any travel itineraries yet."}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={() => navigate('upload')}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs px-4.5 py-2.5 rounded-xl font-bold transition mt-2 cursor-pointer leading-none"
            >
              Scan Tickets & Build Plans
            </button>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-4 animate-fade-in">
          {itineraries.map((it) => (
            <GlassCard
              key={it.id}
              hoverEffect
              onClick={() => navigate('itinerary', it.id)}
              className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer border-slate-900"
            >
              <div className="flex items-start space-x-4 min-w-0 flex-1">
                <div className="bg-cyan-950/25 text-cyan-440 p-3 rounded-xl border border-cyan-950 shrink-0">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="min-w-0 flex-1 pr-4">
                  <h3 className="font-bold text-slate-100 text-base truncate">
                    {it.tripTitle || it.name || "Custom Journey"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400 mt-1">
                    <span className="truncate max-w-[120px] font-medium text-slate-300">{it.departureCity}</span>
                    <span className="text-slate-600">→</span>
                    <span className="text-cyan-400 font-bold truncate max-w-[140px]">{it.arrivalCity}</span>
                    <span className="text-slate-700">•</span>
                    <div className="flex items-center text-slate-500 text-[10px] font-mono shrink-0">
                      <Calendar className="w-3 h-3 mr-1 text-slate-500" />
                      <span>{formatDate(it.startDate)} to {formatDate(it.endDate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('shared', it.shareToken);
                  }}
                  title="Open shared guest link"
                  className="p-2.5 bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-cyan-400 rounded-xl transition cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  disabled={deletingId === it.id}
                  onClick={(e) => handleDelete(it.id, e)}
                  title="Delete trip history"
                  className="p-2.5 bg-slate-900 border border-slate-850 hover:border-red-955 text-slate-400 hover:text-red-400 rounded-xl transition disabled:opacity-50 cursor-pointer"
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
  );
}
