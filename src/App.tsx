import React, { useEffect } from 'react';
import { useTripStore } from './store/tripStore';
import { Header } from './components/Header';
import { Stepper } from './components/Stepper';
import { Tab1Preferences } from './features/Tab1Preferences';
import { Tab2Confirm } from './features/Tab2Confirm';
import { Tab3Itinerary } from './features/Tab3Itinerary';
import { Tab4Bookings } from './features/Tab4Bookings';
import { Tab5Summary } from './features/Tab5Summary';
import { decodeTripFromShareHash } from './utils/share';
import { fetchExchangeRates } from './services/currency';

export default function App() {
  const { 
    activeTab, 
    isLoading, 
    loadingMessage, 
    loadFromSharedPayload, 
    preferences, 
    setExchangeRates 
  } = useTripStore();

  // Handle URL hash loading (shared trip) and currency rates on initial load
  useEffect(() => {
    if (window.location.hash) {
      const shared = decodeTripFromShareHash(window.location.hash);
      if (shared) {
        loadFromSharedPayload(shared);
      }
    }

    // Fetch exchange rates from Frankfurter
    fetchExchangeRates(preferences.currency).then((res) => {
      if (res.status === 'ok' && res.data.rates) {
        setExchangeRates(res.data.rates);
      }
    }).catch(() => {
      // Fallback is automatically handled in currency service
    });
  }, []);

  return (
    <div className="h-dvh w-full overflow-hidden flex flex-col bg-slate-950 text-slate-100 font-sans select-text">
      {/* Top Bar (Fixed Height) */}
      <Header />

      {/* Stepper Tabs (Fixed Height) */}
      <Stepper />

      {/* Content Area (Strict No-Page-Scroll: Only inner panels scroll) */}
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col relative">
        {/* Global Loading Overlay if background processing */}
        {isLoading && (
          <div className="no-print absolute top-3 right-4 z-40 bg-indigo-950/90 border border-indigo-500/50 rounded-xl px-3 py-2 shadow-2xl flex items-center gap-2.5 text-xs text-indigo-200 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
            <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="font-medium">{loadingMessage || 'Working...'}</span>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 1 && <Tab1Preferences />}
        {activeTab === 2 && <Tab2Confirm />}
        {activeTab === 3 && <Tab3Itinerary />}
        {activeTab === 4 && <Tab4Bookings />}
        {activeTab === 5 && <Tab5Summary />}
      </main>
    </div>
  );
}
