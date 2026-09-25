import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Bus, 
  TicketCheck, 
  ExternalLink, 
  Check, 
  Clock, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  X,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { useTripStore } from '../store/tripStore';
import { BookingItem } from '../types/models';
import { fetchBookings } from '../services/gemini';
import { formatCurrency, calculateDaysBetween } from '../utils/format';

type SubTab = 'hotel' | 'transport' | 'ticket';

export const Tab4Bookings: React.FC = () => {
  const {
    bookings,
    setBookings,
    updateBookingStatus,
    selectedDestination,
    preferences,
    itinerary,
    setActiveTab,
    isLoading,
    setIsLoading,
    errorMessage,
    setErrorMessage,
  } = useTripStore();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('hotel');
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<BookingItem | null>(null);
  const [bookingRefInput, setBookingRefInput] = useState('');

  const numNights = Math.max(1, calculateDaysBetween(preferences.startDate, preferences.endDate) - 1);
  const totalPeople = (preferences.adults || 1) + (preferences.children || 0);

  useEffect(() => {
    if (selectedDestination && bookings.length === 0) {
      loadBookings();
    }
  }, [selectedDestination]);

  const loadBookings = async () => {
    if (!selectedDestination) return;
    setIsLoading(true, `Discovering hotels and transit options in ${selectedDestination.city}...`);
    setErrorMessage(null);

    try {
      const res = await fetchBookings(
        selectedDestination.city,
        selectedDestination.country,
        preferences.budget,
        numNights,
        totalPeople,
        preferences.currency,
        itinerary
      );
      setBookings(res.data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to query booking logistics.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBookings = bookings.filter((b) => b.type === activeSubTab);

  const handleOpenBookModal = (item: BookingItem) => {
    setSelectedBookingForModal(item);
    setBookingRefInput(item.referenceNo || '');
  };

  const handleSaveBookingStatus = (isBooked: boolean) => {
    if (!selectedBookingForModal) return;
    updateBookingStatus(
      selectedBookingForModal.id,
      isBooked ? 'booked' : 'suggested',
      isBooked ? bookingRefInput.trim() : undefined
    );
    setSelectedBookingForModal(null);
  };

  const subTabCounts = {
    hotel: bookings.filter((b) => b.type === 'hotel').length,
    transport: bookings.filter((b) => b.type === 'transport').length,
    ticket: bookings.filter((b) => b.type === 'ticket').length,
  };

  const bookedCounts = {
    hotel: bookings.filter((b) => b.type === 'hotel' && b.status === 'booked').length,
    transport: bookings.filter((b) => b.type === 'transport' && b.status === 'booked').length,
    ticket: bookings.filter((b) => b.type === 'ticket' && b.status === 'booked').length,
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-950">
      {/* Sub-Tabs Navigation Bar */}
      <div className="h-14 border-b border-slate-800 bg-slate-900/60 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {[
            { id: 'hotel' as SubTab, label: 'Hotels & Stays', icon: Building2 },
            { id: 'transport' as SubTab, label: 'Airport & Transit', icon: Bus },
            { id: 'ticket' as SubTab, label: 'Attraction Tickets', icon: TicketCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const count = subTabCounts[tab.id];
            const booked = bookedCounts[tab.id];
            const isActive = activeSubTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition border ${
                  isActive
                    ? 'bg-indigo-600/20 text-white border-indigo-500/50 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 text-indigo-400" />
                <span>{tab.label}</span>
                <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full border border-slate-700">
                  {booked > 0 ? `${booked}/${count}` : count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Proceed to summary */}
        <button
          type="button"
          onClick={() => setActiveTab(5)}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
        >
          <span>Trip Summary</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content Area (Scrollable Inner Panel) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-950">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white capitalize">
                {activeSubTab === 'hotel' ? 'Lodging & Hotel Recommendations' : activeSubTab === 'transport' ? 'Airport & Public Transit Passes' : 'Activity & Museum Tickets'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeSubTab === 'hotel'
                  ? `Matched to your budget for ${numNights} nights in ${selectedDestination?.city || 'destination'}.`
                  : activeSubTab === 'transport'
                  ? 'Pre-arranged transit cards and airport transfers save time and money.'
                  : 'Tickets extracted directly from scheduled activities requiring reservations.'}
              </p>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              Direct provider booking (no third-party card processing)
            </div>
          </div>

          {/* Bookings Card List */}
          {filteredBookings.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-2">
              <TicketCheck className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-white">No items found in this category</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No bookings or tickets currently pending for this category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBookings.map((item) => {
                const isBooked = item.status === 'booked';

                return (
                  <div
                    key={item.id}
                    className={`bg-slate-900/80 border rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-150 ${
                      isBooked
                        ? 'border-emerald-500/50 bg-emerald-950/15'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Name & status badge */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-white">
                          {item.name}
                        </h3>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${
                            isBooked
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {isBooked ? 'Booked' : 'Suggested'}
                        </span>
                      </div>

                      {/* Details */}
                      {item.details && (
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {item.details}
                        </p>
                      )}

                      {/* Reference number if booked */}
                      {isBooked && item.referenceNo && (
                        <div className="bg-slate-800/80 border border-slate-750 rounded-xl px-3 py-1.5 text-xs font-mono text-emerald-300 flex items-center justify-between">
                          <span className="text-slate-400">Ref / Confirmation:</span>
                          <span className="font-bold">{item.referenceNo}</span>
                        </div>
                      )}

                      {/* Price estimate */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-slate-400">Estimated Total:</span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-white text-sm">
                            {formatCurrency(item.estCost, preferences.currency)}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Estimate</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions & Book Button */}
                    <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                      <a
                        href={item.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 hover:underline"
                      >
                        <span>View on site</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleOpenBookModal(item)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                          isBooked
                            ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                        }`}
                      >
                        {isBooked ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Edit Booking</span>
                          </>
                        ) : (
                          <span>Book Option</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* BOOKING MODAL (No fake payment form; links to provider & record reference) */}
      {selectedBookingForModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TicketCheck className="w-4 h-4 text-indigo-400" />
                <span>Book: {selectedBookingForModal.name}</span>
              </h3>
              <button
                onClick={() => setSelectedBookingForModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-800/60 border border-slate-750 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Estimated Cost:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {formatCurrency(selectedBookingForModal.estCost, preferences.currency)}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {selectedBookingForModal.details}
                </p>
              </div>

              {/* Direct provider link action */}
              <div className="p-3 bg-indigo-950/30 border border-indigo-900/40 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-indigo-300">Official Provider Website</div>
                  <div className="text-[11px] text-slate-400">Complete booking directly on the provider's portal.</div>
                </div>
                <a
                  href={selectedBookingForModal.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow shrink-0"
                >
                  <span>Open Provider</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Booking Reference Number */}
              <div className="space-y-1.5 pt-2">
                <label className="text-slate-300 font-semibold block">
                  Booking Reference Number (optional)
                </label>
                <input
                  type="text"
                  value={bookingRefInput}
                  onChange={(e) => setBookingRefInput(e.target.value)}
                  placeholder="e.g. RES-94812-BK or PNR ABC123"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 block">
                  Paste confirmation code from your email to display on your master itinerary.
                </span>
              </div>
            </div>

            {/* Modal actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              {selectedBookingForModal.status === 'booked' ? (
                <button
                  type="button"
                  onClick={() => handleSaveBookingStatus(false)}
                  className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded-xl"
                >
                  Unmark as Booked
                </button>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForModal(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveBookingStatus(true)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow"
                >
                  Mark as Booked
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
