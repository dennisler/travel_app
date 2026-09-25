import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  TripPreferences, 
  DestinationProposal, 
  DestinationDetails, 
  FlightOption, 
  ItineraryDay, 
  ActivityItem, 
  BookingItem, 
  RainyDayAlternative 
} from '../types/models';
import { SharedTripPayload } from '../utils/share';

const getInitialDates = () => {
  const start = new Date();
  start.setDate(start.getDate() + 30);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
};

const initialDates = getInitialDates();

export const DEFAULT_PREFERENCES: TripPreferences = {
  homeCity: 'New York (JFK)',
  currency: 'USD',
  budget: 4500,
  startDate: initialDates.startDate,
  endDate: initialDates.endDate,
  adults: 2,
  children: 0,
  vibes: ['culture', 'food', 'nature'],
  pace: 'balanced',
};

export interface TripState {
  // Navigation & Workflow
  activeTab: 1 | 2 | 3 | 4 | 5;
  completedTabs: number[];
  isReadOnly: boolean;
  activeDayIndex: number;

  // Data
  preferences: TripPreferences;
  destinationProposals: DestinationProposal[];
  selectedDestination: DestinationProposal | null;
  destinationDetails: DestinationDetails | null;
  flightOptions: FlightOption[];
  selectedFlight: FlightOption | null;
  itinerary: ItineraryDay[];
  bookings: BookingItem[];
  
  // Developer & Simulation tools
  simulatedRainDay2: boolean;

  // Status & Caching
  isLoading: boolean;
  loadingMessage: string;
  errorMessage: string | null;
  exchangeRates: Record<string, number>;
  sessionCache: Record<string, any>;

  // Actions
  setActiveTab: (tab: 1 | 2 | 3 | 4 | 5) => void;
  setActiveDayIndex: (index: number) => void;
  updatePreferences: (updates: Partial<TripPreferences>) => void;
  setDestinations: (destinations: DestinationProposal[]) => void;
  selectDestination: (dest: DestinationProposal) => void;
  setDestinationDetails: (details: DestinationDetails) => void;
  selectFlight: (flight: FlightOption) => void;
  setFlightOptions: (flights: FlightOption[]) => void;
  setItinerary: (itinerary: ItineraryDay[]) => void;
  
  // Itinerary granular manipulation
  updateActivity: (dayIndex: number, activityId: string, updates: Partial<ActivityItem>) => void;
  addActivity: (dayIndex: number, activity: ActivityItem) => void;
  deleteActivity: (dayIndex: number, activityId: string) => void;
  moveActivity: (dayIndex: number, activityId: string, direction: 'up' | 'down') => void;
  reorderDayActivities: (dayIndex: number, newActivities: ActivityItem[]) => void;
  moveActivityToDay: (fromDayIndex: number, toDayIndex: number, activityId: string) => void;
  toggleActivityLock: (dayIndex: number, activityId: string) => void;
  replaceDayActivities: (dayIndex: number, activities: ActivityItem[]) => void;

  // Wet-Weather Mode
  applyWetWeatherDay: (dayIndex: number, swaps: RainyDayAlternative[]) => void;
  revertWetWeatherDay: (dayIndex: number) => void;
  toggleWetWeatherDay: (dayIndex: number, swaps?: RainyDayAlternative[]) => void;
  setSimulatedRainDay2: (enabled: boolean) => void;

  // Bookings
  setBookings: (bookings: BookingItem[]) => void;
  updateBookingStatus: (bookingId: string, status: 'suggested' | 'booked', referenceNo?: string) => void;

  // General lifecycle
  setIsLoading: (loading: boolean, message?: string) => void;
  setErrorMessage: (msg: string | null) => void;
  setExchangeRates: (rates: Record<string, number>) => void;
  setCache: (key: string, value: any) => void;
  resetTrip: () => void;
  loadFromSharedPayload: (payload: SharedTripPayload) => void;
}

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      activeTab: 1,
      completedTabs: [],
      isReadOnly: false,
      activeDayIndex: 1,

      preferences: DEFAULT_PREFERENCES,
      destinationProposals: [],
      selectedDestination: null,
      destinationDetails: null,
      flightOptions: [],
      selectedFlight: null,
      itinerary: [],
      bookings: [],

      simulatedRainDay2: false,

      isLoading: false,
      loadingMessage: '',
      errorMessage: null,
      exchangeRates: {
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 154.5,
        AUD: 1.52,
        CAD: 1.36,
        SGD: 1.35,
      },
      sessionCache: {},

      setActiveTab: (tab) => set({ activeTab: tab }),
      setActiveDayIndex: (index) => set({ activeDayIndex: index }),

      updatePreferences: (updates) => {
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        }));
      },

      setDestinations: (destinations) => {
        set({ destinationProposals: destinations, errorMessage: null });
      },

      selectDestination: (dest) => {
        set((state) => ({
          selectedDestination: dest,
          completedTabs: Array.from(new Set([...state.completedTabs, 1])),
          activeTab: 2,
        }));
      },

      setDestinationDetails: (details) => {
        set({
          destinationDetails: details,
          flightOptions: details.flights || [],
          selectedFlight: details.flights?.find((f) => f.label === 'best-value') || details.flights?.[0] || null,
        });
      },

      selectFlight: (flight) => {
        set({ selectedFlight: flight });
      },

      setFlightOptions: (flights) => {
        set({ flightOptions: flights });
      },

      setItinerary: (itinerary) => {
        set((state) => ({
          itinerary,
          activeDayIndex: 1,
          completedTabs: Array.from(new Set([...state.completedTabs, 2])),
        }));
      },

      updateActivity: (dayIndex, activityId, updates) => {
        set((state) => {
          const newItinerary = state.itinerary.map((day) => {
            if (day.dayIndex !== dayIndex) return day;
            const updatePlan = (plan: ActivityItem[]) =>
              plan.map((act) => (act.id === activityId ? { ...act, ...updates } : act));

            return {
              ...day,
              sunnyPlan: updatePlan(day.sunnyPlan),
              rainyPlan: day.rainyPlan ? updatePlan(day.rainyPlan) : undefined,
            };
          });
          return { itinerary: newItinerary };
        });
      },

      addActivity: (dayIndex, activity) => {
        set((state) => {
          const newItinerary = state.itinerary.map((day) => {
            if (day.dayIndex !== dayIndex) return day;
            const updatedSunny = [...day.sunnyPlan, activity].sort((a, b) =>
              a.startTime.localeCompare(b.startTime)
            );
            return {
              ...day,
              sunnyPlan: updatedSunny,
              rainyPlan: day.rainyPlan
                ? [...day.rainyPlan, activity].sort((a, b) => a.startTime.localeCompare(b.startTime))
                : undefined,
            };
          });
          return { itinerary: newItinerary };
        });
      },

      deleteActivity: (dayIndex, activityId) => {
        set((state) => {
          const newItinerary = state.itinerary.map((day) => {
            if (day.dayIndex !== dayIndex) return day;
            return {
              ...day,
              sunnyPlan: day.sunnyPlan.filter((a) => a.id !== activityId),
              rainyPlan: day.rainyPlan ? day.rainyPlan.filter((a) => a.id !== activityId) : undefined,
              swaps: day.swaps ? day.swaps.filter((s) => s.originalActivityId !== activityId) : undefined,
            };
          });
          return { itinerary: newItinerary };
        });
      },

      moveActivity: (dayIndex, activityId, direction) => {
        set((state) => {
          const newItinerary = state.itinerary.map((day) => {
            if (day.dayIndex !== dayIndex) return day;
            const plan = [...(day.mode === 'rainy' && day.rainyPlan ? day.rainyPlan : day.sunnyPlan)];
            const index = plan.findIndex((a) => a.id === activityId);
            if (index === -1) return day;

            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= plan.length) return day;

            // Swap times or order
            const item = plan[index];
            const targetItem = plan[targetIndex];
            const tempTime = item.startTime;
            item.startTime = targetItem.startTime;
            targetItem.startTime = tempTime;

            plan[index] = targetItem;
            plan[targetIndex] = item;

            if (day.mode === 'rainy' && day.rainyPlan) {
              return { ...day, rainyPlan: plan };
            }
            return { ...day, sunnyPlan: plan };
          });
          return { itinerary: newItinerary };
        });
      },

      reorderDayActivities: (dayIndex, newActivities) => {
        set((state) => {
          const newItinerary = state.itinerary.map((day) => {
            if (day.dayIndex !== dayIndex) return day;
            if (day.mode === 'rainy') {
              return { ...day, rainyPlan: newActivities };
            }
            return { ...day, sunnyPlan: newActivities };
          });
          return { itinerary: newItinerary };
        });
      },

      moveActivityToDay: (fromDayIndex, toDayIndex, activityId) => {
        set((state) => {
          let activityToMove: ActivityItem | undefined;
          const updated = state.itinerary.map((day) => {
            if (day.dayIndex === fromDayIndex) {
              activityToMove = day.sunnyPlan.find((a) => a.id === activityId);
              return {
                ...day,
                sunnyPlan: day.sunnyPlan.filter((a) => a.id !== activityId),
                rainyPlan: day.rainyPlan ? day.rainyPlan.filter((a) => a.id !== activityId) : undefined,
              };
            }
            return day;
          });

          if (!activityToMove) return { itinerary: updated };

          const final = updated.map((day) => {
            if (day.dayIndex === toDayIndex) {
              const updatedSunny = [...day.sunnyPlan, activityToMove!].sort((a, b) =>
                a.startTime.localeCompare(b.startTime)
              );
              return {
                ...day,
                sunnyPlan: updatedSunny,
                rainyPlan: day.rainyPlan
                  ? [...day.rainyPlan, activityToMove!].sort((a, b) => a.startTime.localeCompare(b.startTime))
                  : undefined,
              };
            }
            return day;
          });

          return { itinerary: final };
        });
      },

      toggleActivityLock: (dayIndex, activityId) => {
        set((state) => {
          const newItinerary = state.itinerary.map((day) => {
            if (day.dayIndex !== dayIndex) return day;
            const toggle = (plan: ActivityItem[]) =>
              plan.map((a) => (a.id === activityId ? { ...a, locked: !a.locked } : a));

            return {
              ...day,
              sunnyPlan: toggle(day.sunnyPlan),
              rainyPlan: day.rainyPlan ? toggle(day.rainyPlan) : undefined,
            };
          });
          return { itinerary: newItinerary };
        });
      },

      replaceDayActivities: (dayIndex, activities) => {
        set((state) => {
          const newItinerary = state.itinerary.map((day) => {
            if (day.dayIndex !== dayIndex) return day;
            return {
              ...day,
              sunnyPlan: activities,
              rainyPlan: undefined,
              mode: 'sunny' as const,
              swaps: undefined,
            };
          });
          return { itinerary: newItinerary };
        });
      },

      // Wet-Weather Mode Implementation (Reversible & Non-destructive)
      applyWetWeatherDay: (dayIndex, swaps) => {
        set((state) => {
          const newItinerary = state.itinerary.map((day) => {
            if (day.dayIndex !== dayIndex) return day;
            
            // Build rainy plan by replacing corresponding activities, NEVER touching locked ones
            const rainyPlan = day.sunnyPlan.map((act) => {
              if (act.locked) return act;
              const swap = swaps.find((s) => s.originalActivityId === act.id);
              if (swap) {
                return {
                  ...swap.replacement,
                  startTime: act.startTime,
                  durationMins: act.durationMins,
                  transitTimeToNextMins: act.transitTimeToNextMins,
                };
              }
              return act;
            });

            return {
              ...day,
              mode: 'rainy' as const,
              rainyPlan,
              swaps,
            };
          });
          return { itinerary: newItinerary };
        });
      },

      revertWetWeatherDay: (dayIndex) => {
        set((state) => {
          const newItinerary = state.itinerary.map((day) => {
            if (day.dayIndex !== dayIndex) return day;
            return {
              ...day,
              mode: 'sunny' as const,
            };
          });
          return { itinerary: newItinerary };
        });
      },

      toggleWetWeatherDay: (dayIndex, swaps) => {
        const state = get();
        const targetDay = state.itinerary.find((d) => d.dayIndex === dayIndex);
        if (!targetDay) return;

        if (targetDay.mode === 'rainy') {
          // Switch back to sunny plan cleanly
          state.revertWetWeatherDay(dayIndex);
        } else {
          // If we already have rainy plan cached and no new swaps provided, reuse it
          if (targetDay.rainyPlan && (!swaps || swaps.length === 0)) {
            set((s) => ({
              itinerary: s.itinerary.map((d) =>
                d.dayIndex === dayIndex ? { ...d, mode: 'rainy' } : d
              ),
            }));
          } else if (swaps && swaps.length > 0) {
            state.applyWetWeatherDay(dayIndex, swaps);
          }
        }
      },

      // Developer Toggle: Simulate rain on Day 2 (Prompt 4)
      setSimulatedRainDay2: (enabled) => {
        set((state) => {
          const newItinerary = state.itinerary.map((day) => {
            if (day.dayIndex === 2) {
              return {
                ...day,
                rainChance: enabled ? 90 : 15,
                weatherSummary: enabled ? 'Heavy rain showers & blustery ~18°C' : 'Sunny with light breeze ~22°C',
              };
            }
            return day;
          });
          return {
            simulatedRainDay2: enabled,
            itinerary: newItinerary,
          };
        });
      },

      setBookings: (bookings) => {
        set((state) => ({
          bookings,
          completedTabs: Array.from(new Set([...state.completedTabs, 3])),
        }));
      },

      updateBookingStatus: (bookingId, status, referenceNo) => {
        set((state) => {
          const newBookings = state.bookings.map((b) => {
            if (b.id !== bookingId) return b;
            return {
              ...b,
              status,
              referenceNo: referenceNo !== undefined ? referenceNo : b.referenceNo,
            };
          });
          return {
            bookings: newBookings,
            completedTabs: Array.from(new Set([...state.completedTabs, 4])),
          };
        });
      },

      setIsLoading: (isLoading, message = '') => {
        set({ isLoading, loadingMessage: message });
      },

      setErrorMessage: (errorMessage) => {
        set({ errorMessage, isLoading: false });
      },

      setExchangeRates: (exchangeRates) => {
        set({ exchangeRates });
      },

      setCache: (key, value) => {
        set((state) => ({
          sessionCache: { ...state.sessionCache, [key]: value },
        }));
      },

      resetTrip: () => {
        const freshDates = getInitialDates();
        set({
          activeTab: 1,
          completedTabs: [],
          isReadOnly: false,
          activeDayIndex: 1,
          preferences: {
            ...DEFAULT_PREFERENCES,
            startDate: freshDates.startDate,
            endDate: freshDates.endDate,
          },
          destinationProposals: [],
          selectedDestination: null,
          destinationDetails: null,
          flightOptions: [],
          selectedFlight: null,
          itinerary: [],
          bookings: [],
          simulatedRainDay2: false,
          errorMessage: null,
          isLoading: false,
        });
        // Clear share hash
        if (window.location.hash) {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      },

      loadFromSharedPayload: (payload) => {
        set({
          preferences: payload.preferences,
          selectedDestination: payload.selectedDestination,
          destinationDetails: payload.destinationDetails,
          selectedFlight: payload.selectedFlight,
          flightOptions: payload.destinationDetails?.flights || (payload.selectedFlight ? [payload.selectedFlight] : []),
          itinerary: payload.itinerary,
          bookings: payload.bookings,
          isReadOnly: true,
          activeTab: 5, // Open directly in summary view
          completedTabs: [1, 2, 3, 4, 5],
          activeDayIndex: 1,
          isLoading: false,
          errorMessage: null,
        });
      },
    }),
    {
      name: 'tripdeck-state-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        preferences: state.preferences,
        destinationProposals: state.destinationProposals,
        selectedDestination: state.selectedDestination,
        destinationDetails: state.destinationDetails,
        flightOptions: state.flightOptions,
        selectedFlight: state.selectedFlight,
        itinerary: state.itinerary,
        bookings: state.bookings,
        activeTab: state.activeTab,
        completedTabs: state.completedTabs,
        simulatedRainDay2: state.simulatedRainDay2,
        activeDayIndex: state.activeDayIndex,
      }),
    }
  )
);
