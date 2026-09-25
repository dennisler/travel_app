import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Users, 
  Compass, 
  ArrowRight, 
  Sun, 
  CloudRain, 
  Plane, 
  Coins, 
  Check, 
  AlertCircle, 
  Flame,
  Info,
  CalendarCheck
} from 'lucide-react';
import { useTripStore } from '../store/tripStore';
import { Vibe, Pace, DestinationProposal } from '../types/models';
import { fetchDestinations } from '../services/gemini';
import { fetchDestinationWeather } from '../services/weather';
import { formatCurrency, calculateDaysBetween, formatDate } from '../utils/format';

const VIBE_OPTIONS: { id: Vibe; label: string; icon: string }[] = [
  { id: 'food', label: 'Food & Dining', icon: '🍜' },
  { id: 'culture', label: 'Culture & Arts', icon: '🏛️' },
  { id: 'nature', label: 'Nature & Scenery', icon: '🌲' },
  { id: 'nightlife', label: 'Nightlife & Bars', icon: '🍸' },
  { id: 'relaxation', label: 'Relaxation & Spa', icon: '🌿' },
  { id: 'adventure', label: 'Adventure & Sports', icon: '🧗' },
  { id: 'shopping', label: 'Shopping & Bazaars', icon: '🛍️' },
  { id: 'family', label: 'Family Friendly', icon: '🎡' },
];

export const Tab1Preferences: React.FC = () => {
  const { 
    preferences, 
    updatePreferences, 
    destinationProposals, 
    setDestinations, 
    selectDestination,
    selectedDestination,
    isLoading,
    setIsLoading,
    errorMessage,
    setErrorMessage
  } = useTripStore();

  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-search if no proposals present on mount
  useEffect(() => {
    if (destinationProposals.length === 0) {
      handleSearchDestinations();
    }
  }, []);

  const totalPeople = (preferences.adults || 1) + (preferences.children || 0);
  const tripDays = calculateDaysBetween(preferences.startDate, preferences.endDate);

  const toggleVibe = (vibeId: Vibe) => {
    const current = preferences.vibes;
    if (current.includes(vibeId)) {
      if (current.length > 1) {
        updatePreferences({ vibes: current.filter((v) => v !== vibeId) });
      }
    } else {
      updatePreferences({ vibes: [...current, vibeId] });
    }
  };

  const handleSearchDestinations = async () => {
    // Validate inputs
    if (!preferences.homeCity.trim()) {
      setValidationError('Please enter your departure home city or airport.');
      return;
    }
    if (preferences.budget <= 0) {
      setValidationError('Please enter a budget greater than 0.');
      return;
    }
    if (preferences.adults < 1) {
      setValidationError('At least 1 adult traveler is required.');
      return;
    }
    const start = new Date(preferences.startDate).getTime();
    const end = new Date(preferences.endDate).getTime();
    if (end <= start) {
      setValidationError('Return date must be strictly after departure date.');
      return;
    }

    setValidationError(null);
    setErrorMessage(null);
    setIsLoading(true, 'Consulting Gemini Search Grounding & Open-Meteo climate models...');

    try {
      const response = await fetchDestinations(preferences);
      if (response.status === 'error') {
        setErrorMessage(response.error || 'Unable to fetch destination ideas.');
      } else {
        // Hydrate with Open-Meteo weather asynchronously
        setDestinations(response.data);

        // Fetch precise Open-Meteo weather for destinations in background
        response.data.forEach(async (dest) => {
          try {
            const wRes = await fetchDestinationWeather(dest.city, preferences.startDate, preferences.endDate);
            if (wRes.status === 'ok') {
              useTripStore.setState((s) => ({
                destinationProposals: s.destinationProposals.map((d) =>
                  d.id === dest.id
                    ? {
                        ...d,
                        weather: {
                          avgHighC: wRes.data.avgHighC,
                          avgLowC: wRes.data.avgLowC,
                          rainChance: wRes.data.rainChance,
                          type: wRes.data.type,
                        },
                      }
                    : d
                ),
              }));
            }
          } catch {
            // Keep default
          }
        });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to query travel destinations.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-slate-950">
      {/* LEFT PANEL: Trip Preferences Form (Fixed Width & Inner Scroll) */}
      <div className="w-full lg:w-[420px] lg:min-w-[400px] border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-900/60 p-4 sm:p-6 overflow-y-auto min-h-0 flex flex-col justify-between shrink-0">
        <div className="space-y-5">
          {/* Header intro */}
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Trip Blueprint</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure parameters to discover grounded destinations matched to your vibes, group, and budget.
            </p>
          </div>

          {/* Validation Notice */}
          {validationError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Departure Airport / City */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Departing From</span>
              <span className="text-[10px] text-slate-500">Home Airport / City</span>
            </label>
            <div className="relative">
              <Plane className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={preferences.homeCity}
                onChange={(e) => updatePreferences({ homeCity: e.target.value })}
                placeholder="e.g. New York (JFK), London (LHR), Sydney"
                className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Dates & Duration */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Travel Dates</span>
              </label>
              <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                {tripDays} {tripDays === 1 ? 'day' : 'days'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Departure</span>
                <input
                  type="date"
                  value={preferences.startDate}
                  onChange={(e) => updatePreferences({ startDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Return</span>
                <input
                  type="date"
                  value={preferences.endDate}
                  onChange={(e) => updatePreferences({ endDate: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Budget & Currency */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Total Travel Budget</span>
              <span className="text-[10px] text-slate-400">All travelers combined</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Coins className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={preferences.budget}
                  onChange={(e) => updatePreferences({ budget: Math.max(100, Number(e.target.value)) })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <select
                value={preferences.currency}
                onChange={(e) => updatePreferences({ currency: e.target.value })}
                className="w-24 px-2 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                {['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Party Size */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Party Size</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2">
                <span className="text-xs text-slate-300">Adults (18+)</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updatePreferences({ adults: Math.max(1, preferences.adults - 1) })}
                    className="w-6 h-6 rounded bg-slate-700 text-slate-200 flex items-center justify-center font-bold hover:bg-slate-600 transition"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-white w-4 text-center font-mono">
                    {preferences.adults}
                  </span>
                  <button
                    type="button"
                    onClick={() => updatePreferences({ adults: preferences.adults + 1 })}
                    className="w-6 h-6 rounded bg-slate-700 text-slate-200 flex items-center justify-center font-bold hover:bg-slate-600 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2">
                <span className="text-xs text-slate-300">Children</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updatePreferences({ children: Math.max(0, preferences.children - 1) })}
                    className="w-6 h-6 rounded bg-slate-700 text-slate-200 flex items-center justify-center font-bold hover:bg-slate-600 transition"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-white w-4 text-center font-mono">
                    {preferences.children}
                  </span>
                  <button
                    type="button"
                    onClick={() => updatePreferences({ children: preferences.children + 1 })}
                    className="w-6 h-6 rounded bg-slate-700 text-slate-200 flex items-center justify-center font-bold hover:bg-slate-600 transition"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Travel Pace */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Trip Pace
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'relaxed' as Pace, label: 'Relaxed', desc: '2–3 spots/day' },
                { id: 'balanced' as Pace, label: 'Balanced', desc: '4 spots/day' },
                { id: 'packed' as Pace, label: 'Packed', desc: '5–6 spots/day' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => updatePreferences({ pace: p.id })}
                  className={`p-2 rounded-xl text-left border transition flex flex-col ${
                    preferences.pace === p.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-xs font-semibold capitalize">{p.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Vibe Chips (Multi-Select) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Trip Vibes
              </label>
              <span className="text-[10px] text-slate-400">
                {preferences.vibes.length} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {VIBE_OPTIONS.map((v) => {
                const isSelected = preferences.vibes.includes(v.id);
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => toggleVibe(v.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition border ${
                      isSelected
                        ? 'bg-indigo-600/25 border-indigo-400/60 text-indigo-100 shadow-sm'
                        : 'bg-slate-800/90 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                    }`}
                  >
                    <span>{v.icon}</span>
                    <span>{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Find Destinations Submit Button */}
        <div className="pt-5 mt-5 border-t border-slate-800">
          <button
            type="button"
            onClick={handleSearchDestinations}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-[0.99] text-white text-xs font-bold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Searching Live Intelligence...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Find Destinations</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: 6 Destination Cards Grid (Inner Scroll Only) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-950">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Section banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Destination Matches</span>
                <span className="text-xs font-mono font-normal text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                  {destinationProposals.length} options
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Curated using Google Search grounding for real travel dates ({formatDate(preferences.startDate)} – {formatDate(preferences.endDate)}).
              </p>
            </div>

            {destinationProposals.length > 0 && (
              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                <span>Prices shown in {preferences.currency}</span>
              </div>
            )}
          </div>

          {/* Error Message Box with Retry */}
          {errorMessage && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-300">Live intelligence notification</div>
                  <div className="text-amber-200/80 mt-0.5">{errorMessage}</div>
                </div>
              </div>
              <button
                onClick={handleSearchDestinations}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-xs border border-amber-500/40 shrink-0 self-start sm:self-auto transition"
              >
                Retry Search
              </button>
            </div>
          )}

          {/* Skeleton Loaders during active query */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-32 bg-slate-800 rounded-md" />
                    <div className="h-5 w-16 bg-slate-800 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-slate-800 rounded" />
                    <div className="h-3 w-4/5 bg-slate-800 rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="h-10 bg-slate-800 rounded-xl" />
                    <div className="h-10 bg-slate-800 rounded-xl" />
                  </div>
                  <div className="h-9 w-full bg-slate-800 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            /* 6 Destination Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {destinationProposals.map((dest) => {
                const isSelected = selectedDestination?.id === dest.id;
                const costRatio = dest.estTotalCost / preferences.budget;
                const costStatus = costRatio <= 0.85 ? 'under' : costRatio <= 1.05 ? 'balanced' : 'over';

                return (
                  <div
                    key={dest.id}
                    className={`group bg-slate-900/80 border rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/20 ring-1 ring-indigo-500/50'
                        : 'border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* Top: City, Country, Season */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-extrabold text-white group-hover:text-indigo-200 transition">
                            {dest.city}
                          </h3>
                          <span className="text-xs text-slate-400 font-medium">
                            {dest.country}
                          </span>
                        </div>
                        {/* Season badge */}
                        <span 
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            dest.season === 'peak'
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                              : dest.season === 'shoulder'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          }`}
                        >
                          {dest.season} season
                        </span>
                      </div>

                      {/* Match Reason */}
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {dest.matchReason}
                      </p>

                      {/* Flight & Weather Estimates */}
                      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                        {/* Flights per person */}
                        <div className="bg-slate-800/60 border border-slate-750/60 rounded-xl p-2.5">
                          <span className="text-[10px] text-slate-400 block flex items-center justify-between">
                            <span>Return Flights</span>
                            <span className="text-[9px] uppercase text-indigo-400 font-mono">Estimate</span>
                          </span>
                          <span className="font-mono font-bold text-white text-xs mt-1 block">
                            {formatCurrency(dest.estFlightPerPerson, preferences.currency)}
                            <span className="text-[10px] text-slate-400 font-normal"> / person</span>
                          </span>
                        </div>

                        {/* Weather with Open-Meteo label */}
                        <div className="bg-slate-800/60 border border-slate-750/60 rounded-xl p-2.5">
                          <span className="text-[10px] text-slate-400 block flex items-center justify-between">
                            <span>Weather</span>
                            <span 
                              className={`text-[9px] uppercase font-mono px-1 rounded ${
                                dest.weather.type === 'forecast' 
                                  ? 'bg-emerald-500/20 text-emerald-300' 
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                              title={dest.weather.type === 'forecast' ? '16-day forecast from Open-Meteo' : 'Historical climate average from Open-Meteo'}
                            >
                              {dest.weather.type === 'forecast' ? 'Forecast' : 'Seasonal avg'}
                            </span>
                          </span>
                          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-white mt-1">
                            {dest.weather.rainChance && dest.weather.rainChance > 40 ? (
                              <CloudRain className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            ) : (
                              <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            )}
                            <span>{dest.weather.avgLowC}° – {dest.weather.avgHighC}°C</span>
                          </div>
                        </div>
                      </div>

                      {/* Highlight Event */}
                      {dest.highlightEvent && (
                        <div className="bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-900/30 rounded-xl p-2.5 text-xs">
                          <div className="flex items-center gap-1.5 text-indigo-300 font-semibold text-[11px] mb-0.5">
                            <CalendarCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span>During your dates</span>
                          </div>
                          <p className="text-slate-300 text-[11px] leading-snug truncate">
                            {dest.highlightEvent}
                          </p>
                        </div>
                      )}

                      {/* Total Cost vs Budget */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400 text-[11px]">Est. Trip Total:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-white text-xs">
                            {formatCurrency(dest.estTotalCost, preferences.currency)}
                          </span>
                          <span 
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              costStatus === 'under'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : costStatus === 'balanced'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {costStatus === 'under' ? 'In Budget' : costStatus === 'balanced' ? 'Near Budget' : 'Over Budget'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action & Meta */}
                    <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-2">
                      <button
                        type="button"
                        onClick={() => selectDestination(dest)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200'
                        }`}
                      >
                        <span>{isSelected ? 'Destination Selected' : 'Choose Destination'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Source Citation Line */}
                      <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between truncate">
                        <span>Source: {dest.meta.source}</span>
                        <span>Updated: {new Date(dest.meta.fetchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
