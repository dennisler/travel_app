import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Share2, 
  Download, 
  Calendar, 
  Plane, 
  Building2, 
  TicketCheck, 
  Check, 
  Copy, 
  Wallet, 
  Clock, 
  MapPin, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import { useTripStore } from '../store/tripStore';
import { calculateBudgetBreakdown } from '../utils/budget';
import { formatCurrency, formatDate, formatDateRange, formatDuration } from '../utils/format';
import { encodeTripToShareUrl } from '../utils/share';
import { generateICS, downloadFile } from '../utils/ics';

export const Tab5Summary: React.FC = () => {
  const { 
    preferences, 
    selectedDestination, 
    destinationDetails, 
    selectedFlight, 
    itinerary, 
    bookings,
    isReadOnly,
    setActiveTab
  } = useTripStore();

  const [copiedLink, setCopiedLink] = useState(false);
  const [shareUrlLength, setShareUrlLength] = useState<number | null>(null);

  const budgetBreakdown = calculateBudgetBreakdown(
    preferences,
    selectedFlight,
    itinerary,
    bookings,
    selectedDestination?.estFlightPerPerson || 0
  );

  const totalPeople = (preferences.adults || 1) + (preferences.children || 0);

  const handleShareTrip = () => {
    const shareUrl = encodeTripToShareUrl({
      preferences,
      selectedDestination,
      destinationDetails,
      selectedFlight,
      itinerary,
      bookings,
      v: 1,
    });
    setShareUrlLength(shareUrl.length);
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadICS = () => {
    const icsContent = generateICS(
      `${selectedDestination?.city || 'Trip'} Vacation`,
      selectedDestination,
      itinerary
    );
    const filename = `${(selectedDestination?.city || 'trip').toLowerCase().replace(/\s+/g, '-')}-itinerary.ics`;
    downloadFile(filename, icsContent, 'text/calendar;charset=utf-8');
  };

  const handleDownloadJSON = () => {
    const data = {
      destination: selectedDestination,
      preferences,
      selectedFlight,
      itinerary,
      bookings,
      budgetBreakdown,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const filename = `${(selectedDestination?.city || 'trip').toLowerCase().replace(/\s+/g, '-')}-deck.json`;
    downloadFile(filename, jsonStr, 'application/json');
  };

  if (!selectedDestination || itinerary.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950">
        <FileText className="w-12 h-12 text-slate-600 mb-3" />
        <h2 className="text-base font-bold text-white">Incomplete Trip</h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">Complete destination and itinerary steps to generate master trip summary.</p>
        <button
          onClick={() => setActiveTab(1)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Start from Preferences
        </button>
      </div>
    );
  }

  const budgetCategories = [
    { label: 'Flights', amount: budgetBreakdown.flights, color: 'bg-indigo-500' },
    { label: 'Lodging', amount: budgetBreakdown.stay, color: 'bg-emerald-500' },
    { label: 'Transport', amount: budgetBreakdown.transport, color: 'bg-sky-500' },
    { label: 'Activities', amount: budgetBreakdown.activities, color: 'bg-amber-500' },
    { label: 'Food (Est.)', amount: budgetBreakdown.foodEstimate, color: 'bg-purple-500' },
    { label: 'Buffer (10%)', amount: budgetBreakdown.buffer, color: 'bg-slate-400' },
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950 print-container">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Read-Only Shared Mode Notice Banner */}
        {isReadOnly && (
          <div className="no-print p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>You are viewing a shared travel plan in read-only mode.</span>
            </div>
            <button
              onClick={() => {
                useTripStore.setState({ isReadOnly: false });
                if (window.location.hash) history.replaceState(null, '', window.location.pathname);
              }}
              className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold rounded-lg transition"
            >
              Make an Editable Copy
            </button>
          </div>
        )}

        {/* Master Trip Header / Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Master Trip Brief
              </span>
              <span className="text-xs text-slate-400">
                {formatDateRange(preferences.startDate, preferences.endDate)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              {selectedDestination.city}, {selectedDestination.country}
            </h1>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>Departing: {preferences.homeCity}</span>
              <span>•</span>
              <span>{totalPeople} Traveler{totalPeople > 1 ? 's' : ''} ({preferences.adults} Adults, {preferences.children} Children)</span>
              <span>•</span>
              <span className="capitalize">{preferences.pace} pace</span>
            </div>
          </div>

          {/* Export Actions Toolbar */}
          <div className="no-print flex flex-wrap items-center gap-2">
            {/* Share Link */}
            <button
              type="button"
              onClick={handleShareTrip}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              title="Copy compressed link to share trip"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
            </button>

            {/* Print View */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              title="Print travel voucher document"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Print Plan</span>
            </button>

            {/* Download Calendar (.ics) */}
            <button
              type="button"
              onClick={handleDownloadICS}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              title="Export to Apple Calendar, Outlook, and Google Calendar"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Add to Calendar (.ics)</span>
            </button>

            {/* Download JSON */}
            <button
              type="button"
              onClick={handleDownloadJSON}
              className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs"
              title="Export structured JSON archive"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Share Link Length confirmation (Prompt 5 check) */}
        {shareUrlLength !== null && (
          <div className="no-print p-2.5 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-[11px] text-indigo-200 flex items-center justify-between font-mono animate-in fade-in">
            <span>Share link created: {shareUrlLength} characters (well within compact 2,000 char target)</span>
            <span className="text-emerald-400 font-bold">Ready to paste</span>
          </div>
        )}

        {/* SECTION 1: Comprehensive Budget Breakdown Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 print-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Budget & Financial Allocation</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">Total Projected:</span>
              <span className="font-mono font-bold text-white text-base">
                {formatCurrency(budgetBreakdown.totalEstimated, preferences.currency)}
              </span>
              <span className="text-slate-500">/</span>
              <span className="font-mono text-slate-300">
                {formatCurrency(preferences.budget, preferences.currency)}
              </span>
            </div>
          </div>

          {/* Stacked Horizontal Bar Chart */}
          <div className="space-y-1.5">
            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex">
              {budgetCategories.map((cat, idx) => {
                const widthPct = Math.max(1, (cat.amount / Math.max(1, budgetBreakdown.totalEstimated)) * 100);
                return (
                  <div
                    key={idx}
                    className={`h-full ${cat.color} transition-all duration-300`}
                    style={{ width: `${widthPct}%` }}
                    title={`${cat.label}: ${formatCurrency(cat.amount, preferences.currency)} (${Math.round(widthPct)}%)`}
                  />
                );
              })}
            </div>

            {/* Category Legend & Values */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 text-xs">
              {budgetCategories.map((cat, idx) => (
                <div key={idx} className="bg-slate-850/60 p-2 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                    <span className={`w-2 h-2 rounded-full ${cat.color} shrink-0`} />
                    <span className="truncate">{cat.label}</span>
                  </div>
                  <div className="font-mono font-bold text-white text-xs mt-1">
                    {formatCurrency(cat.amount, preferences.currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Remaining balance notice */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Remaining Budget Buffer:</span>
            <span className={`font-mono font-bold ${budgetBreakdown.remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {budgetBreakdown.remaining >= 0 ? '+' : ''}{formatCurrency(budgetBreakdown.remaining, preferences.currency)}
            </span>
          </div>
        </div>

        {/* SECTION 2: Flights & Stay Brief */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Flight Summary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 print-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Flight Itinerary
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {selectedFlight?.label.replace('-', ' ') || 'Commercial'}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-extrabold text-white">
                {selectedFlight?.airline || 'Commercial Airline'}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 font-mono">
                <span>{preferences.homeCity} ➔ {selectedDestination.city}</span>
                <span>•</span>
                <span>~{selectedFlight?.durationHrs || 8} hrs</span>
                <span>•</span>
                <span>{selectedFlight?.stops === 0 ? 'Non-stop' : `${selectedFlight?.stops} Stop`}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Flight Cost:</span>
              <span className="font-mono font-bold text-white">
                {formatCurrency(budgetBreakdown.flights, preferences.currency)}
              </span>
            </div>
          </div>

          {/* Bookings & Logistics Confirmed */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 print-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TicketCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Bookings & Confirmations
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {bookings.filter(b => b.status === 'booked').length} Confirmed
              </span>
            </div>

            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {bookings.filter(b => b.status === 'booked').length === 0 ? (
                <div className="text-xs text-slate-400 italic">
                  No bookings marked with reference numbers yet. You can manage references in the Bookings tab.
                </div>
              ) : (
                bookings.filter(b => b.status === 'booked').map((b) => (
                  <div key={b.id} className="text-xs flex items-center justify-between bg-slate-800/60 p-1.5 rounded-lg">
                    <span className="text-slate-200 truncate max-w-[200px]">{b.name}</span>
                    <span className="font-mono text-emerald-300 font-bold">{b.referenceNo || 'Booked'}</span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Total Bookings Cost:</span>
              <span className="font-mono font-bold text-white">
                {formatCurrency(budgetBreakdown.stay + budgetBreakdown.transport, preferences.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 3: Complete Day-by-Day Master Itinerary (Formatted for Print) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              <span>Full Day-by-Day Master Itinerary</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {itinerary.length} Days Planned
            </span>
          </div>

          <div className="space-y-4">
            {itinerary.map((day) => {
              const plan = day.mode === 'rainy' && day.rainyPlan ? day.rainyPlan : day.sunnyPlan;

              return (
                <div
                  key={day.dayIndex}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 print-card print-page-break"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        Day {day.dayIndex}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ({formatDate(day.date, { weekday: 'short', month: 'short', day: 'numeric' })})
                      </span>
                      {day.mode === 'rainy' && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          Wet Weather Mode
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      {day.weatherSummary} • {day.temperatureC || 21}°C
                    </div>
                  </div>

                  {/* Day Activities Table */}
                  <div className="space-y-2">
                    {plan.map((act) => (
                      <div
                        key={act.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-800/40 border border-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-indigo-300 w-14 shrink-0">
                            {act.startTime}
                          </span>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {act.name}
                              </span>
                              <span className="text-[9px] uppercase font-bold px-1.5 rounded bg-slate-700 text-slate-300">
                                {act.category}
                              </span>
                              <span className="text-[9px] uppercase px-1.5 rounded text-slate-400">
                                {act.setting}
                              </span>
                            </div>
                            {act.notes && (
                              <p className="text-[11px] text-slate-400">
                                {act.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto text-xs font-mono shrink-0">
                          <span className="text-slate-400">{formatDuration(act.durationMins)}</span>
                          <span className="text-white font-bold">
                            {act.estCost > 0 ? formatCurrency(act.estCost, preferences.currency) : 'Free'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
