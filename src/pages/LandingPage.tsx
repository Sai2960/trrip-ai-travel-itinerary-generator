import React from 'react';
import { useNavigation } from '../context/NavigationContext.js';
import { useAuth } from '../context/AuthContext.js';
import { GlassCard } from '../components/GlassCard.js';
import { 
  Compass, 
  Sparkles, 
  Upload, 
  MapPin, 
  Share2, 
  ArrowRight, 
  FileText, 
  UserCheck 
} from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  const { navigate } = useNavigation();
  const { user } = useAuth();

  return (
    <div className="relative min-h-[calc(100vh-16rem)] w-full text-white bg-slate-950 overflow-hidden py-16 sm:py-24">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
      <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content Column */}
          <div className="lg:col-span-7 flex flex-col space-y-8 text-center lg:text-left">
            
            <div className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full self-center lg:self-start shadow-md animate-fade-in-down">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
                Zero Configuration Custom AI Travel Agent
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Turn Booking Slips into <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">
                Premium Itineraries
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Upload flight confirmations, hotel bookings, bus tickets, or travel images. 
              Our LLM parses the files natively and organizes a highly curated, day-wise, localized travel itinerary in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              {user ? (
                <button
                  onClick={() => navigate('dashboard')}
                  className="flex items-center space-x-2 w-full sm:w-auto justify-center bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-cyan-900/10 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('register')}
                    className="flex items-center space-x-2 w-full sm:w-auto justify-center bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-cyan-950/20 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <span>Build your Trip Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate('login')}
                    className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 px-7 py-3.5 rounded-xl font-bold transition-all duration-200"
                  >
                    Sign in to Account
                  </button>
                </>
              )}
            </div>

            {/* Micro-Features Row */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-900/60 mt-8 max-w-lg mx-auto lg:mx-0">
              <div className="text-center lg:text-left">
                <span className="block text-2xl font-bold text-white">100%</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider">AI Automated</span>
              </div>
              <div className="text-center lg:text-left">
                <span className="block text-2xl font-bold text-white">PDF/PNG</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider">Support</span>
              </div>
              <div className="text-center lg:text-left">
                <span className="block text-2xl font-bold text-white">Share</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider">With Public</span>
              </div>
            </div>

          </div>

          {/* Interactive Feature Visualizer Grid Right Column */}
          <div className="lg:col-span-5 relative">
            <GlassCard className="p-6 relative overflow-hidden group border-slate-800/80 shadow-3xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl"></div>
              
              <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />
                <span>Trrip.ai Flow Visualization</span>
              </h3>

              {/* Steps Timeline */}
              <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
                
                {/* Step 1 */}
                <div className="flex items-start space-x-4">
                  <div className="relative z-10 w-9 h-9 flex items-center justify-center bg-slate-900 border border-slate-800 text-cyan-400 rounded-full font-bold shadow-md text-xs">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-200">1. Document Drop</h4>
                    <p className="text-xs text-slate-500">Unpack any tickets or rental validations safely.</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start space-x-4">
                  <div className="relative z-10 w-9 h-9 flex items-center justify-center bg-slate-900 border border-slate-800 text-cyan-400 rounded-full font-bold shadow-md text-xs">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-200">2. Gemini OCR & Extractor</h4>
                    <p className="text-xs text-slate-500">Extract check-in timings, dates, airport names, and guests.</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start space-x-4">
                  <div className="relative z-10 w-9 h-9 flex items-center justify-center bg-slate-900 border border-slate-800 text-cyan-400 rounded-full font-bold shadow-md text-xs">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-200">3. Curate Day Schedules</h4>
                    <p className="text-xs text-slate-500">Design local maps dining recommendations and emergency contacts.</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start space-x-4">
                  <div className="relative z-10 w-9 h-9 flex items-center justify-center bg-slate-900 border border-slate-800 text-cyan-400 rounded-full font-bold shadow-md text-xs">
                    <Share2 className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-200">4. SaaS Link Sharing</h4>
                    <p className="text-xs text-slate-500">Produce unique URLs accessible from any device.</p>
                  </div>
                </div>

              </div>
              
              {/* Teaser Upload Component */}
              <div 
                onClick={() => navigate(user ? 'upload' : 'register')}
                className="mt-8 border border-dashed border-slate-800 hover:border-cyan-500/60 transition-colors duration-200 rounded-xl p-5 bg-slate-950/50 cursor-pointer text-center group/teaser"
              >
                <div className="mx-auto w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-400 group-hover/teaser:text-cyan-400 group-hover/teaser:border-cyan-500/30 transition-all">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="block text-xs font-semibold text-slate-300 mt-2.5">Try Dragging Booking File</span>
                <span className="block text-[10px] text-slate-550 mt-1">Accepts PDF, PNG, JPG forms</span>
              </div>

            </GlassCard>
          </div>

        </div>

        {/* Feature Grid Divider */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-900/60">
          
          <div className="flex flex-col space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-cyan-400 shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Intelligent PDF Extraction</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              We send full base64 documents directly to Gemini's native PDF interpreter. No clunky OCR wrappers needed. It reads boarding gates, check-in times, luxury stays effortlessly.
            </p>
          </div>

          <div className="flex flex-col space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-amber-500 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Vibrant Day-by-Day Logistics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate fully coordinated day-wise itineraries complete with local food markets, hidden viewpoints, security rules, and tailored budgets mapped exactly on your schedule.
            </p>
          </div>

          <div className="flex flex-col space-y-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-blue-500">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Aesthetic SaaS Share Tokens</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export completed structures to PDF in one click, or share structured mobile-ready public URLs with travel buddies, friends, or family directly.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
