import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigation } from '../context/NavigationContext.js';
import { GlassCard } from '../components/GlassCard.js';
import { UploadedDoc } from '../types.js';
import { 
  Upload, 
  FileText, 
  Image, 
  MapPin, 
  Calendar, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  X,
  Compass
} from 'lucide-react';

export default function UploadPage() {
  const { authFetch } = useAuth();
  const { navigate } = useNavigation();

  // Documents State
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local file selection preview (FEATURE 6)
  const [selectedLocalFile, setSelectedLocalFile] = useState<File | null>(null);
  const [localFilePreview, setLocalFilePreview] = useState<string | null>(null);

  // Merge state for planning
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [tripName, setTripName] = useState('');
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoadingDocs(true);
      const res = await authFetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (e) {
      console.error('Failed to load documents list', e);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Convert client file to Base64 String
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (files: FileList) => {
    if (files.length === 0) return;
    
    const file = files[0];
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Unsupported file type. Only PDF and image documents (PNG, JPG, JPEG) are parsed.');
      return;
    }

    // Set local selection preview state
    setSelectedLocalFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setLocalFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setLocalFilePreview(null);
    }

    setUploading(true);
    setUploadProgress(15);
    setUploadError(null);

    try {
      setUploadProgress(40);
      const base64Data = await convertToBase64(file);
      
      setUploadProgress(65);
      const res = await authFetch('/api/upload', {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileData: base64Data,
          size: file.size
        })
      });

      setUploadProgress(90);
      const data = await res.json();

      if (res.ok) {
        setUploadProgress(100);
        setDocuments(prev => [data.document, ...prev]);
        // Auto-select document for merging
        setSelectedDocIds(prev => [...prev, data.document.id]);
        
        // Auto fill form fields where possible
        const ext = data.document.extractedInfo;
        if (ext.departureCity) setDepartureCity(ext.departureCity);
        if (ext.arrivalCity) {
          setArrivalCity(ext.arrivalCity);
          setTripName(`Adventure to ${ext.arrivalCity}`);
        }
        if (ext.hotelName) {
          if (!arrivalCity) {
            setTripName(`Stay at ${ext.hotelName}`);
          }
        }
      } else {
        setUploadError(data.error || 'Gemini extraction engine failed to scan values.');
      }
    } catch (err) {
      console.error('File parsing request fatal error:', err);
      setUploadError('Network error connecting to Gemini scanning modules.');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 800);
    }
  };

  // Drag and Drop triggers
  const [dragActive, setDragActive] = useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Select / deselect document checking
  const toggleDocSelection = (id: string, doc: UploadedDoc) => {
    setSelectedDocIds(prev => {
      const exists = prev.includes(id);
      if (exists) {
        return prev.filter(item => item !== id);
      } else {
        const ext = doc.extractedInfo;
        if (ext.departureCity && !departureCity) setDepartureCity(ext.departureCity);
        if (ext.arrivalCity && !arrivalCity) {
          setArrivalCity(ext.arrivalCity);
          if (!tripName) setTripName(`Adventure to ${ext.arrivalCity}`);
        }
        return [...prev, id];
      }
    });
  };

  // Generate Itinerary API
  const handleGenerateItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripName || !departureCity || !arrivalCity || !startDate || !endDate) {
      setPlanError('Please input Trip Name, Origin, Destination, and Dates.');
      return;
    }

    setIsPlanning(true);
    setPlanError(null);

    try {
      const res = await authFetch('/api/itinerary/generate', {
        method: 'POST',
        body: JSON.stringify({
          name: tripName,
          departureCity,
          arrivalCity,
          startDate,
          endDate,
          docIds: selectedDocIds
        })
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to newly engineered itinerary view
        navigate('itinerary', data.itinerary.id);
      } else {
        setPlanError(data.error || 'Gemini itinerary builder failed. Try adjusting inputs.');
      }
    } catch (err) {
      console.error('Itinerary engineering network error:', err);
      setPlanError('Network problem connecting to AI schedules optimizer.');
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white min-h-[calc(100vh-16rem)] space-y-10">
      
      {/* Full-Page Loading Overlay during Generation (FEATURE 7) */}
      {isPlanning && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md">
          <div className="space-y-6 text-center max-w-md px-6">
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/10 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-4 border-slate-900 border-t-cyan-400 animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-amber-300 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Crafting Your Travel</h2>
              <p className="text-sm text-cyan-400 font-semibold animate-pulse tracking-wide">
                Trrip AI is crafting your perfect itinerary...
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Reading travel confirmations, calculating daily pacing, matching curated locations, and building world-class dining spots. Please hold on!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Intro Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">AI Planner Intake</h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload travel documents as structural data guides, or configure itinerary directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
        
        {/* Left Column: Intake Drills (Upload & Documents List selection) */}
        <div className="lg:col-span-6 space-y-6">
          <h2 className="text-lg font-bold flex items-center space-x-2 text-slate-200">
            <Upload className="w-5 h-5 text-cyan-400" />
            <span>1. Contextual Bookings Upload</span>
          </h2>

          {/* Interactive Drag & Drop Area (FEATURE 6) */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
              ${dragActive ? 'border-cyan-400 bg-cyan-950/25 scale-[1.01]' : 'border-slate-800 bg-slate-900/10 hover:border-slate-700 hover:bg-slate-900/25'}
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              accept=".pdf,image/png,image/jpeg,image/jpg"
            />

            {selectedLocalFile ? (
              <div className="space-y-4">
                <div className="mx-auto w-20 h-20 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center p-2">
                  {localFilePreview ? (
                    <img referrerPolicy="no-referrer" src={localFilePreview} alt="Preview" className="max-w-full max-h-full object-contain rounded" />
                  ) : (
                    <FileText className="w-10 h-10 text-cyan-400 animate-pulse" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white max-w-xs mx-auto truncate text-slate-100">{selectedLocalFile.name}</p>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-none">
                    {selectedLocalFile.type.split('/')[1] || 'FILE'} • {(selectedLocalFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-850 text-slate-400">
                  <Upload className="w-5 h-5 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-300">Drag & Drop bookings here, or browse files</p>
                  <p className="text-xs text-slate-500 leading-normal">Supports PDF confirmations or images (PNG, JPG, JPEG)</p>
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress Metrics */}
          {uploading && (
            <GlassCard className="p-4 border-cyan-900/30">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                <span className="flex items-center space-x-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Scanning files with Gemini OCR Extraction...</span>
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </GlassCard>
          )}

          {uploadError && (
            <div className="flex items-start space-x-2.5 bg-red-950/20 border border-red-900/40 p-4 rounded-xl text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Historical Documents Selection Panel */}
          <div className="space-y-4 pt-4 border-t border-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select relevant bookings for itinerary context:</h3>
              <span className="text-[10px] text-cyan-400 font-mono font-bold bg-slate-900/50 px-2 py-0.5 rounded border border-slate-850">
                {selectedDocIds.length} SELECTED
              </span>
            </div>

            {loadingDocs ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse bg-slate-900/30 border border-slate-900 h-14 rounded-xl"></div>
                ))}
              </div>
            ) : documents.length === 0 ? (
              <p className="text-xs text-slate-500 italic leading-relaxed">No historical documents uploaded yet. Document data will be automatically extracted into the scheduling form once uploaded.</p>
            ) : (
              <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-2 custom-scrollbar">
                {documents.map((doc) => {
                  const isChecked = selectedDocIds.includes(doc.id);
                  const isPDF = doc.fileType.toLowerCase().includes('pdf');
                  return (
                    <div
                      key={doc.id}
                      onClick={() => toggleDocSelection(doc.id, doc)}
                      className={`
                        flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-200
                        ${isChecked 
                          ? 'border-cyan-500/40 bg-cyan-950/10' 
                          : 'border-slate-900/80 bg-slate-900/20 hover:bg-slate-900/40 hover:border-slate-800'}
                      `}
                    >
                      <div className="flex items-center space-x-3 min-w-0 pr-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="w-4 h-4 rounded border-slate-805 accent-cyan-500 cursor-pointer text-cyan-500 focus:ring-0 bg-slate-900"
                        />
                        <div className="p-1.5 rounded bg-slate-950 border border-slate-850 text-slate-400 shrink-0">
                          {isPDF ? <FileText className="w-3.5 h-3.5" /> : <Image className="w-3.5 h-3.5" />}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className={`text-xs font-semibold truncate ${isChecked ? 'text-white' : 'text-slate-300'}`}>{doc.name}</p>
                          <span className="block text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                            {doc.fileType.split('/')[1] || 'DOC'} • {(doc.size / 1024).toFixed(0)} KB
                          </span>
                        </div>
                      </div>

                      {doc.extractedInfo.arrivalCity && (
                        <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 border border-slate-850 rounded uppercase tracking-wider shrink-0">
                          {doc.extractedInfo.arrivalCity}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: AI planner form options */}
        <div className="lg:col-span-6 space-y-6">
          <h2 className="text-lg font-bold flex items-center space-x-2 text-slate-200">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>2. Plan Details & Generation</span>
          </h2>

          <GlassCard className="p-6 border-slate-800/80 shadow-3xl">
            <form onSubmit={handleGenerateItinerary} className="space-y-4">
              
              {planError && (
                <div className="flex items-start space-x-2.5 bg-red-950/20 border border-red-900/40 p-4 rounded-xl text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{planError}</span>
                </div>
              )}

              {/* Trip Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Itinerary Title / Trip Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Exploration in Tokyo"
                  value={tripName}
                  disabled={isPlanning}
                  onChange={(e) => setTripName(e.target.value)}
                  className="w-full text-xs bg-slate-950/60 border border-slate-900 text-slate-200 placeholder-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all disabled:opacity-50 font-sans"
                />
              </div>

              {/* Grid: Origin and Departure destination */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                    <Compass className="w-3.5 h-3.5 text-slate-450" />
                    <span>Departure City</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. San Francisco (SFO)"
                    value={departureCity}
                    disabled={isPlanning}
                    onChange={(e) => setDepartureCity(e.target.value)}
                    className="w-full text-xs bg-slate-950/60 border border-slate-900 text-slate-200 placeholder-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-cyan-500/40 transition-all disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-450" />
                    <span>Arrival Destination</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tokyo (NRT)"
                    value={arrivalCity}
                    disabled={isPlanning}
                    onChange={(e) => setArrivalCity(e.target.value)}
                    className="w-full text-xs bg-slate-950/60 border border-slate-900 text-slate-200 placeholder-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-cyan-500/40 transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Grid: Timing calendars */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-450" />
                    <span>Start Date</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    disabled={isPlanning}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs bg-slate-950/60 border border-slate-900 text-slate-200 placeholder-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-cyan-500/40 transition-all disabled:opacity-50 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-450" />
                    <span>End Date</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    disabled={isPlanning}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs bg-slate-950/60 border border-slate-900 text-slate-200 placeholder-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-cyan-500/40 transition-all disabled:opacity-50 cursor-pointer"
                  />
                </div>
              </div>

              {/* Planning Call to action */}
              <button
                type="submit"
                disabled={isPlanning}
                className="w-full mt-4 flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-950/25 transition duration-200 disabled:opacity-50 active:scale-95 cursor-pointer leading-none uppercase tracking-widest"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Generate Itinerary</span>
              </button>

            </form>
          </GlassCard>

          <div className="text-[11px] text-slate-500 bg-slate-950/40 border border-slate-900 p-4 rounded-xl leading-relaxed">
            <span className="text-cyan-400 font-semibold uppercase tracking-wider block mb-1">Architecture details</span>
            All specified checks are handled server-side. Selected tickets are formatted into key structural facts which direct Gemini's routing planners.
          </div>

        </div>

      </div>

    </div>
  );
}
