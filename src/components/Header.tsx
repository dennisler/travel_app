import React, { useState } from 'react';
import { 
  Compass, 
  RotateCcw, 
  CloudRain, 
  Sun, 
  ExternalLink, 
  Share2, 
  Wallet,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { useTripStore } from '../store/tripStore';
import { formatCurrency } from '../utils/format';
import { calculateBudgetBreakdown } from '../utils/budget';

export const Header: React.FC = () => {
  const { 
    preferences, 
    selectedDestination, 
    selectedFlight, 
    itinerary, 
    bookings, 
    simulatedRainDay2, 
    setSimulatedRainDay2, 
    resetTrip,
    isReadOnly,
    updatePreferences
  } = useTripStore();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [copiedClone, setCopiedClone] = useState(false);

  const budgetBreakdown = calculateBudgetBreakdown(
    preferences,
    selectedFlight,
    itinerary,
    bookings,
    selectedDestination?.estFlightPerPerson || 0
  );

  const pctUsed = Math.min(150, Math.round((budgetBreakdown.totalEstimated / Math.max(1, preferences.budget)) * 100));
  const isOverBudget = budgetBreakdown.totalEstimated > preferences.budget;

  const handleCloneTrip = () => {
    // Exit read only and save
    useTripStore.setState({ isReadOnly: false });
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname);
    }
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  return (
    <header className="no-print h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 flex items-center justify-between z-30 select-none shrink-0">
      {/* Left: Brand & Trip Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20 text-white">
          <Compass className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              TripDeck
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Planner
            </span>
          </div>
          <div className="text-xs text-slate-400 font-medium truncate max-w-[200px] md:max-w-xs">
            {selectedDestination 
              ? `${selectedDestination.city}, ${selectedDestination.country} Trip` 
              : 'New Journey'}
          </div>
        </div>
      </div>

      {/* Middle: Budget Tracker & Currency */}
      <div className="hidden sm:flex items-center gap-4 bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-1.5 shadow-inner">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <span className={isOverBudget ? 'text-rose-400' : 'text-emerald-400'}>
                {formatCurrency(budgetBreakdown.totalEstimated, preferences.currency)}
              </span>
              <span className="text-slate-500 font-normal">/</span>
              <span className="text-slate-300">
                {formatCurrency(preferences.budget, preferences.currency)}
              </span>
            </div>
            <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full transition-all duration-500 ${
                  isOverBudget 
                    ? 'bg-rose-500' 
                    : pctUsed > 85 
                    ? 'bg-amber-400' 
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, pctUsed)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Currency Switcher */}
        <select
          value={preferences.currency}
          onChange={(e) => updatePreferences({ currency: e.target.value })}
          className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer hover:bg-slate-750 transition"
          title="Change display currency"
        >
          {['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Right: Developer simulation toggle & reset */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Read only notification */}
        {isReadOnly && (
          <button
            onClick={handleCloneTrip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium hover:bg-emerald-500/30 transition shadow-sm"
          >
            {copiedClone ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Clone to Edit</span>
          </button>
        )}

        {/* Developer simulation toggle for wet weather */}
        <button
          onClick={() => setSimulatedRainDay2(!simulatedRainDay2)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
            simulatedRainDay2
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 shadow-sm shadow-sky-500/10'
              : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Developer Test Mode: Simulates heavy rain probability on Day 2 to test wet-weather replanning"
        >
          {simulatedRainDay2 ? (
            <>
              <CloudRain className="w-3.5 h-3.5 text-sky-400 animate-bounce" />
              <span className="hidden md:inline font-mono">Rain on Day 2: ON</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline font-mono">Simulate Rain Day 2</span>
            </>
          )}
        </button>

        {/* Reset Trip */}
        <div className="relative">
          <button
            onClick={() => setShowResetConfirm(!showResetConfirm)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700/60 hover:border-rose-500/30 transition"
            title="Reset trip and start fresh"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {showResetConfirm && (
            <div className="absolute right-0 top-11 w-64 bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-start gap-2.5 text-xs text-slate-300 mb-3">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>Reset all preferences, destination choices, and itinerary? This cannot be undone.</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded bg-slate-800 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    resetTrip();
                    setShowResetConfirm(false);
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded shadow"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
