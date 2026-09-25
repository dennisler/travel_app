import React, { useEffect } from 'react';
import { 
  MapPin, 
  Plane, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Lightbulb, 
  Building2, 
  AlertTriangle,
  ArrowRight,
  Info
} from 'lucide-react';
import { useTripStore } from '../store/tripStore';
import { fetchDestinationDetails, fetchItinerary } from '../services/gemini';
import { formatCurrency } from '../utils/format';

export const Tab2Confirm: React.FC = () => {
  const { 
    selectedDestination, 
    preferences, 
    destinationDetails, 
    setDestinationDetails, 
    flightOptions, 
    selectedFlight, 
    selectFlight,
    setItinerary, 
    setActiveTab,
    isLoading,
    setIsLoading,
    errorMessage,
    setErrorMessage
  } = useTripStore();

  useEffect(() => {
    if (selectedDestination && (!destinationDetails || destinationDetails.city !== selectedDestination.city)) {
      loadDetails();
    }
  }, [selectedDestination]);

  const loadDetails = async () => {
    if (!selectedDestination) return;
    setIsLoading(true, `Querying deep-dive insights for ${selectedDestination.city}...`);
    setErrorMessage(null);
    try {
      const res = await fetchDestinationDetails(selectedDestination, preferences);
      setDestinationDetails(res.data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load destination details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAndBuildItinerary = async () => {
    if (!selectedDestination) return;
    setIsLoading(true, `Synthesizing ${preferences.pace} day-by-day itinerary for ${selectedDestination.city}...`);
    setErrorMessage(null);

    try {
      const res = await fetchItinerary(selectedDestination, preferences);
      if (res.data && res.data.length > 0) {
        setItinerary(res.data);
        setActiveTab(3);
      } else {
        throw new Error('Itinerary generator returned no days.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error generating itinerary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedDestination) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950">
        <MapPin className="w-12 h-12 text-slate-600 mb-3" />
        <h2 className="text-base font-bold text-white">No Destination Selected</h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">Please return to Preferences to pick a destination first.</p>
        <button
          onClick={() => setActiveTab(1)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Preferences
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-slate-950">
      {/* LEFT: Destination Deep Dive (Scrollable) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:border-r border-slate-800/80 bg-slate-950">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header Banner */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                Destination Profile
              </span>
              <span className="text-xs text-slate-400">
                Departing {preferences.homeCity}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>{selectedDestination.city}</span>
              <span className="text-lg font-normal text-slate-400">({selectedDestination.country})</span>
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              {destinationDetails?.overview || selectedDestination.matchReason}
            </p>
          </div>

          {/* Best Areas to Stay */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span>Recommended Areas to Base Your Stay</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(destinationDetails?.bestAreas || [
                { name: 'Historic Old Center', description: 'Pedestrian plazas, cultural landmarks, boutique hotels, and nightlife.' },
                { name: 'Arts & Design Quarter', description: 'Trendy galleries, specialty cafes, craft markets, and convenient metro access.' }
              ]).map((area, idx) => (
                <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>{area.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    {area.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Local Insider Tips */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Local Etiquette & Travel Intelligence</span>
            </h3>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              {(destinationDetails?.localTips || [
                'Public transit tap-and-pay is accepted across all lines.',
                'Reserve popular attractions at least 10 days in advance.',
                'Tipping 5–10% is customary for great service.'
              ]).map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visa and Entry Reminder Note */}
          <div className="p-4 bg-sky-950/20 border border-sky-800/40 rounded-2xl flex items-start gap-3 text-xs text-sky-200">
            <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-sky-300">Visa & Border Entry Checklist</span>
              <p className="text-[11px] text-sky-200/90 leading-relaxed">
                {destinationDetails?.visaNotes || 'Ensure passport is valid for at least 6 months past arrival.'}
              </p>
              <div className="text-[10px] text-sky-400/80 font-mono mt-1">
                * Note: Visa rules change frequently. Always verify requirements with official consulate or immigration authorities.
              </div>
            </div>
          </div>

          {/* Source Citation */}
          <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span>Source: {destinationDetails?.meta.source || 'Gemini Search Grounding'}</span>
            <span>Updated: {new Date(destinationDetails?.meta.fetchedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Flight Options & Confirmation CTA (Scrollable) */}
      <div className="w-full lg:w-[460px] lg:min-w-[420px] overflow-y-auto p-4 sm:p-6 bg-slate-900/50 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Flight Selection</h2>
            </div>
            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded font-mono uppercase">
              3 Options
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Select your preferred flight profile. Every price is an estimate based on live routes from {preferences.homeCity} to {selectedDestination.city}.
          </p>

          {/* Flight Cards */}
          <div className="space-y-3">
            {flightOptions.map((f) => {
              const isSelected = selectedFlight?.id === f.id;
              const badgeStyle = 
                f.label === 'best-value'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : f.label === 'cheapest'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40';

              return (
                <div
                  key={f.id}
                  onClick={() => selectFlight(f)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'bg-indigo-950/30 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                          {f.label.replace('-', ' ')}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {f.airline || 'Commercial Airline'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>~{f.durationHrs} hrs</span>
                        </span>
                        <span>•</span>
                        <span>{f.stops === 0 ? 'Non-stop' : `${f.stops} stop`}</span>
                      </div>
                    </div>

                    {/* Price with Estimate label */}
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-[10px] uppercase font-mono text-indigo-400">Estimate</span>
                      </div>
                      <div className="font-mono text-base font-extrabold text-white">
                        {formatCurrency(f.estPrice, preferences.currency)}
                      </div>
                      <div className="text-[10px] text-slate-400">per passenger</div>
                    </div>
                  </div>

                  {/* External Google Flights Check Link */}
                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                        isSelected ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-700'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs text-slate-300 font-medium">
                        {isSelected ? 'Selected option' : 'Click to select'}
                      </span>
                    </div>

                    <a
                      href={f.searchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold hover:underline"
                    >
                      <span>Check live price</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Action Button: Confirm & Build Itinerary */}
        <div className="pt-6 mt-6 border-t border-slate-800 space-y-2">
          <button
            type="button"
            onClick={handleConfirmAndBuildItinerary}
            disabled={isLoading || !selectedFlight}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating {selectedDestination.city} Itinerary...</span>
              </>
            ) : (
              <>
                <span>Confirm & Build Day-by-Day Itinerary</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-400 text-center">
            Generates optimized schedule, weather tracking, and wet-weather alternatives.
          </p>
        </div>
      </div>
    </div>
  );
};
