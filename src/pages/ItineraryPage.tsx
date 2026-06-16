import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigation } from '../context/NavigationContext.js';
import { GlassCard } from '../components/GlassCard.js';
import { Itinerary } from '../types.js';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  Share2, 
  Printer, 
  Clock, 
  Building2, 
  Luggage, 
  Loader2, 
  ChevronLeft,
  BookOpen,
  Info,
  Check,
  AlertTriangle,
  Heart
} from 'lucide-react';

interface ItineraryPageProps {
  isReadOnly?: boolean;
  sharedTokenOverride?: string;
}

export default function ItineraryPage({ isReadOnly = false, sharedTokenOverride }: ItineraryPageProps) {
  const { authFetch } = useAuth();
  const { routeParams, navigate } = useNavigation();

  // Determine actual itinerary lookup ID
  const activeToken = sharedTokenOverride || routeParams;

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadItinerary() {
      if (!activeToken) {
        setError('No travel token provided.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        let url = `/api/itinerary/${activeToken}`;
        if (isReadOnly) {
          url = `/api/itinerary/share/${activeToken}`;
        }

        const res = await (isReadOnly ? fetch(url) : authFetch(url));
        if (res.ok) {
          const data = await res.json();
          setItinerary(data.itinerary);
        } else {
          // Fallback backup path for duplicates
          const fallbackUrl = isReadOnly ? `/api/share/${activeToken}` : `/api/itinerary/${activeToken}`;
          const fallbackRes = await (isReadOnly ? fetch(fallbackUrl) : authFetch(fallbackUrl));
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            setItinerary(data.itinerary);
          } else {
            setError('Failed to download itinerary. It might be private or no longer exist.');
          }
        }
      } catch (err) {
        console.error('Error fetching itinerary details:', err);
        setError('Network communication issue loading your plan.');
      } finally {
        setLoading(false);
      }
    }

    loadItinerary();
  }, [activeToken, isReadOnly]);

  const handleCopyLink = () => {
    if (!itinerary) return;
    
    // Construct real share link compatible with Orbitra guidelines (/#/share/shareToken)
    const shareUrl = `${window.location.origin}/#/share/${itinerary.shareToken}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(e => {
      console.error('Clipboard copy failed', e);
    });
  };

  const handlePrint = () => {
    window.print();
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-4 text-white min-h-[calc(100vh-16rem)]">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
        <p className="text-sm text-slate-400 font-mono tracking-wider">Formatting your custom itinerary...</p>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-white text-center min-h-[calc(100vh-16rem)] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 bg-slate-900 border border-slate-800 text-red-500 rounded-2xl flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 animate-bounce" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold">Failed to load Itinerary</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || 'This travel itinerary was not found or belongs to another user.'}
          </p>
        </div>
        <button
          onClick={() => navigate(isReadOnly ? 'landing' : 'dashboard')}
          className="bg-slate-905 hover:bg-slate-900 text-slate-300 border border-slate-800 text-xs px-4 py-2 rounded-xl transition cursor-pointer"
        >
          {isReadOnly ? 'Back to Home' : 'Back to Dashboard'}
        </button>
      </div>
    );
  }

  // Resolve MongoDB nested model parameters safely as requested
  const details = itinerary.generatedItinerary || {};
  const days = details.days || [];
  const lodging = details.lodging || {};
  const diningList = details.dining || [];
  const culturalTipsList = details.culturalTips || [];
  const packingList = details.packingList || [];

  // Match dates format safely
  const formattedStart = formatDate(itinerary.startDate || details.startDate);
  const formattedEnd = formatDate(itinerary.endDate || details.endDate);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white min-h-[calc(100vh-16rem)] space-y-8 print-mode">
      
      {/* Toast Alert Indicator */}
      {copied && (
        <div className="fixed top-20 right-6 z-55 bg-cyan-950 border border-cyan-800/80 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2.5 animate-fade-in text-xs text-cyan-300">
          <Check className="w-3.5 h-3.5" />
          <span>Shared link copied to clipboard!</span>
        </div>
      )}

      {/* Media print style overrides */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print-hidden, nav, footer {
            display: none !important;
          }
          .print-mode {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .glass-override {
            background: transparent !important;
            border: 1px solid #ddd !important;
            box-shadow: none !important;
            color: black !important;
          }
          h1, h2, h3, h4, p, span, li {
            color: #000 !important;
          }
        }
      `}</style>

      {/* Upper Navigation Row */}
      <div className="flex items-center justify-between gap-4 print-hidden">
        <button
          onClick={() => navigate(isReadOnly ? 'landing' : 'dashboard')}
          className="flex items-center space-x-1.5 text-xs text-slate-450 hover:text-white transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{isReadOnly ? 'Return Home' : 'Trip Management'}</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Export / Print */}
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-350 border border-slate-805 hover:border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export PDF / Print</span>
          </button>

          {/* Share Actions (only if owner mode) */}
          {!isReadOnly && (
            <button
              onClick={handleCopyLink}
              className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-cyan-950/20 transition hover:-translate-y-0.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-white animate-pulse" />
              <span>Copy Share URL</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Cover Card Banner */}
      <GlassCard className="p-8 relative overflow-hidden group glass-override border-slate-800/80">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-tr from-cyan-400/5 to-indigo-600/5 rounded-full blur-3xl -z-10"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 bg-cyan-950/20 text-cyan-400 border border-cyan-900/30 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider">
              <Compass className="w-3 h-3 text-cyan-400 animate-spin-slow" />
              <span>AI ITINERARY DESIGN</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {itinerary.tripTitle || details.tripTitle || "Your Travel Itinerary"}
            </h1>
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-400">
              <div className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>From</span>
                <span className="text-white font-medium">{itinerary.departureCity || details.departureCity || 'Departure'}</span>
              </div>
              <span>→</span>
              <div className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>To</span>
                <span className="text-cyan-400 font-bold">{itinerary.arrivalCity || details.arrivalCity || 'Destination'}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-xl flex items-center space-x-3 text-xs shrink-0 font-mono">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <div className="space-y-0.5">
              <p className="text-[10px] text-slate-505 uppercase tracking-wider font-bold leading-none mb-1">TRIP PERIOD</p>
              <p className="text-slate-205">{formattedStart} - {formattedEnd}</p>
            </div>
          </div>
        </div>

        {/* Share Banner for guests */}
        {isReadOnly && (
          <div className="mt-6 pt-5 border-t border-slate-900/40 text-xs text-slate-400 flex items-center justify-between flex-wrap gap-2">
            <span>You are viewing a publicly shared copy of this itinerary. Powered by Trrip.ai.</span>
            <span className="text-[10px] bg-cyan-950/40 border border-cyan-900/30 text-cyan-400 px-3 py-0.5 rounded-full uppercase tracking-wider font-bold">GUEST ACCESS</span>
          </div>
        )}
      </GlassCard>

      {/* Grid Layout: Summary and Days on Left, Lodgings & Tips on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Section: Chronological timeline of events */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Trip Summary Card */}
          <section className="space-y-3">
            <h2 className="text-base font-bold flex items-center space-x-2 text-slate-200">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              <span>Pre-Journey Summary</span>
            </h2>
            <GlassCard className="p-6 text-xs text-slate-300 leading-relaxed border-slate-900/60 font-normal shadow-lg glass-override whitespace-pre-line">
              {details.preJourneySummary || "Welcome to your custom itinerary! Get ready to explore breathtaking sights and delicious local spots."}
            </GlassCard>
          </section>

          {/* Day Wise timeline cards */}
          <section className="space-y-5">
            <div className="flex justify-between items-center bg-slate-950/30 p-2 rounded-xl">
              <h2 className="text-base font-bold flex items-center space-x-2 text-white">
                <Clock className="w-5 h-5 text-indigo-400" />
                <span>Day-by-Day Curated Timeline</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-500 font-bold">({days.length} DAYS)</span>
            </div>

            <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-900">
              {days.map((day: any, dIdx: number) => (
                <div key={dIdx} className="flex gap-4">
                  
                  {/* Timeline bullet circle node */}
                  <div className="relative z-10 w-9 h-9 flex items-center justify-center bg-slate-950 border-2 border-slate-900 shadow-md text-cyan-400 rounded-full font-bold font-mono text-xs shrink-0">
                    D{day.dayNumber}
                  </div>

                  <div className="flex-1 space-y-3">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center justify-between">
                      <span>{day.title || `Day ${day.dayNumber}`}</span>
                      <span className="text-[10px] text-slate-500 font-mono font-normal">
                        {day.date || ''}
                      </span>
                    </h3>

                    {/* Morning/Afternoon/Evening block layouts */}
                    <div className="grid grid-cols-1 gap-3">
                      
                      {day.morning && (
                        <GlassCard className="p-4 flex gap-3 text-xs glass-override">
                          <div className="text-[9px] font-mono tracking-wider font-bold text-amber-500 shrink-0 uppercase bg-amber-950/15 border border-amber-900/30 px-2 py-0.5 h-fit rounded">
                            Morning
                          </div>
                          <p className="text-slate-300 leading-relaxed font-normal">{day.morning}</p>
                        </GlassCard>
                      )}

                      {day.afternoon && (
                        <GlassCard className="p-4 flex gap-3 text-xs glass-override">
                          <div className="text-[9px] font-mono tracking-wider font-bold text-cyan-400 shrink-0 uppercase bg-cyan-950/15 border border-cyan-900/30 px-2 py-0.5 h-fit rounded">
                            Afternoon
                          </div>
                          <p className="text-slate-300 leading-relaxed font-normal">{day.afternoon}</p>
                        </GlassCard>
                      )}

                      {day.evening && (
                        <GlassCard className="p-4 flex gap-3 text-xs glass-override">
                          <div className="text-[9px] font-mono tracking-wider font-bold text-indigo-400 shrink-0 uppercase bg-indigo-950/15 border border-indigo-900/30 px-2 py-0.5 h-fit rounded">
                            Evening
                          </div>
                          <p className="text-slate-300 leading-relaxed font-normal">{day.evening}</p>
                        </GlassCard>
                      )}

                    </div>
                  </div>

                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Sidebar: Hotels, Tips, Packing, Lodging */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Hotel booking accommodations */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center space-x-2 border-b border-slate-900 pb-1.5">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span>Lodging & Accommodations</span>
            </h2>

            {lodging && lodging.name ? (
              <GlassCard className="p-4 text-xs space-y-3.5 glass-override border-slate-900">
                <div className="space-y-1">
                  <p className="font-bold text-white text-sm leading-tight">{lodging.name}</p>
                  <p className="text-[11px] text-slate-400 flex items-start space-x-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500 mt-0.5" />
                    <span>{lodging.address || 'Address not listed'}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900/60 text-[10px] text-slate-500 font-mono">
                  <div>
                    <p className="font-bold text-slate-600 mb-0.5">CHECK-IN</p>
                    <p className="text-slate-300">{formatDate(lodging.checkIn)}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-600 mb-0.5">CHECK-OUT</p>
                    <p className="text-slate-300">{formatDate(lodging.checkOut)}</p>
                  </div>
                </div>

                {lodging.refCode && lodging.refCode !== "N/A" && (
                  <div className="p-1 px-2.5 bg-slate-950 border border-slate-900 rounded font-mono text-[9px] text-slate-400 text-center uppercase tracking-wide">
                    REF CODE: <span className="text-cyan-400 font-bold">{lodging.refCode}</span>
                  </div>
                )}
              </GlassCard>
            ) : (
              <p className="text-xs text-slate-500 italic">No hotels listed yet.</p>
            )}
          </section>

          {/* Dining / Restaurants list */}
          {diningList && diningList.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-455 flex items-center space-x-2 border-b border-slate-900 pb-1.5">
                <Compass className="w-4 h-4 text-amber-500" />
                <span>Curated Dining & Café Lists</span>
              </h2>

              <GlassCard className="p-4 text-xs glass-override">
                <ul className="space-y-3">
                  {diningList.map((rec: string, rIdx: number) => (
                    <li key={rIdx} className="flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-1.5 shrink-0"></span>
                      <span className="text-slate-300 font-normal leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </section>
          )}

          {/* Cultural Tips list */}
          {culturalTipsList && culturalTipsList.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-455 flex items-center space-x-2 border-b border-slate-900 pb-1.5">
                <Info className="w-4 h-4 text-indigo-400" />
                <span>Cultural Guides & Local Tips</span>
              </h2>

              <GlassCard className="p-4 text-xs glass-override">
                <ul className="space-y-3">
                  {culturalTipsList.map((tip: string, tIdx: number) => (
                    <li key={tIdx} className="flex items-start space-x-2">
                      <span className="text-[10px] text-indigo-400 shrink-0">✦</span>
                      <span className="text-slate-300 font-normal leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </section>
          )}

          {/* Packing suggestions */}
          {packingList && packingList.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-455 flex items-center space-x-2 border-b border-slate-900 pb-1.5">
                <Luggage className="w-4 h-4 text-emerald-450" />
                <span>Packing list essentials</span>
              </h2>

              <GlassCard className="p-4 text-xs glass-override">
                <ul className="space-y-2.5">
                  {packingList.map((item: string, pIdx: number) => (
                    <li key={pIdx} className="flex items-center space-x-2">
                      <span className="w-1 h-1 bg-emerald-400 rounded-full shrink-0"></span>
                      <span className="text-slate-300 leading-normal">{item}</span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </section>
          )}

        </div>

      </div>

    </div>
  );
}
