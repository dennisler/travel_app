import { withTimeoutAndRetry } from './withTimeout';
import { 
  TripPreferences, 
  DestinationProposal, 
  DestinationDetails, 
  ItineraryDay, 
  BookingItem, 
  RainyDayAlternative,
  ActivityItem,
  ServiceResponse 
} from '../types/models';

export async function fetchDestinations(
  preferences: TripPreferences
): Promise<ServiceResponse<DestinationProposal[]>> {
  const fallback: DestinationProposal[] = [
    {
      id: 'dest-tokyo',
      city: 'Tokyo',
      country: 'Japan',
      matchReason: 'Unmatched culinary culture, sensory neon districts, and world-class public transit that fits your pace.',
      estFlightPerPerson: Math.round(preferences.budget * 0.28 / (preferences.adults + preferences.children)),
      estTotalCost: Math.round(preferences.budget * 0.85),
      season: 'shoulder',
      weather: { avgHighC: 22, avgLowC: 14, rainChance: 20, type: 'seasonal' },
      highlightEvent: 'Seasonal Evening Illuminations & Tsukiji Street Food Festival',
      meta: { source: 'TripDeck AI Intelligence (Cached Fallback)', fetchedAt: new Date().toISOString(), isEstimate: true }
    },
    {
      id: 'dest-barcelona',
      city: 'Barcelona',
      country: 'Spain',
      matchReason: 'Vibrant Mediterranean beaches, world-renowned Gaudí architecture, and legendary tapas culture.',
      estFlightPerPerson: Math.round(preferences.budget * 0.25 / (preferences.adults + preferences.children)),
      estTotalCost: Math.round(preferences.budget * 0.80),
      season: 'peak',
      weather: { avgHighC: 24, avgLowC: 17, rainChance: 15, type: 'seasonal' },
      highlightEvent: 'Gothic Quarter Tapas Crawl & Montjuïc Magic Fountain Show',
      meta: { source: 'TripDeck AI Intelligence (Cached Fallback)', fetchedAt: new Date().toISOString(), isEstimate: true }
    },
    {
      id: 'dest-vancouver',
      city: 'Vancouver',
      country: 'Canada',
      matchReason: 'Breathtaking coastal mountains, pristine wilderness hiking, and relaxed Pacific Rim dining.',
      estFlightPerPerson: Math.round(preferences.budget * 0.22 / (preferences.adults + preferences.children)),
      estTotalCost: Math.round(preferences.budget * 0.75),
      season: 'shoulder',
      weather: { avgHighC: 19, avgLowC: 12, rainChance: 35, type: 'seasonal' },
      highlightEvent: 'Granville Island Artists Market & Stanley Park Seawall Fest',
      meta: { source: 'TripDeck AI Intelligence (Cached Fallback)', fetchedAt: new Date().toISOString(), isEstimate: true }
    },
    {
      id: 'dest-bangkok',
      city: 'Bangkok',
      country: 'Thailand',
      matchReason: 'Incredible budget value, Michelin street food stalls, ancient gilded temples, and lively night markets.',
      estFlightPerPerson: Math.round(preferences.budget * 0.26 / (preferences.adults + preferences.children)),
      estTotalCost: Math.round(preferences.budget * 0.65),
      season: 'off-peak',
      weather: { avgHighC: 32, avgLowC: 25, rainChance: 30, type: 'seasonal' },
      highlightEvent: 'Chao Phraya River Lights & Chatuchak Weekend Market',
      meta: { source: 'TripDeck AI Intelligence (Cached Fallback)', fetchedAt: new Date().toISOString(), isEstimate: true }
    },
    {
      id: 'dest-reykjavik',
      city: 'Reykjavík',
      country: 'Iceland',
      matchReason: 'Geothermal hot springs, dramatic waterfalls, otherworldly volcanic terrain, and Nordic charm.',
      estFlightPerPerson: Math.round(preferences.budget * 0.32 / (preferences.adults + preferences.children)),
      estTotalCost: Math.round(preferences.budget * 0.90),
      season: 'shoulder',
      weather: { avgHighC: 13, avgLowC: 7, rainChance: 40, type: 'seasonal' },
      highlightEvent: 'Midnight Sun Concerts & Golden Circle Geothermal Exploration',
      meta: { source: 'TripDeck AI Intelligence (Cached Fallback)', fetchedAt: new Date().toISOString(), isEstimate: true }
    },
    {
      id: 'dest-florence',
      city: 'Florence',
      country: 'Italy',
      matchReason: 'Renaissance masterpieces, Tuscan wine tasting, artisanal leather workshops, and romantic sunset vistas.',
      estFlightPerPerson: Math.round(preferences.budget * 0.27 / (preferences.adults + preferences.children)),
      estTotalCost: Math.round(preferences.budget * 0.82),
      season: 'peak',
      weather: { avgHighC: 25, avgLowC: 16, rainChance: 18, type: 'seasonal' },
      highlightEvent: 'Piazza del Duomo Evening Chamber Music & Chianti Wine Harvest',
      meta: { source: 'TripDeck AI Intelligence (Cached Fallback)', fetchedAt: new Date().toISOString(), isEstimate: true }
    },
  ];

  return withTimeoutAndRetry<DestinationProposal[]>(
    async () => {
      const res = await fetch('/api/destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || fallback;
    },
    fallback,
    'Gemini Search Grounding'
  );
}

export async function fetchDestinationDetails(
  destination: DestinationProposal,
  preferences: TripPreferences
): Promise<ServiceResponse<DestinationDetails>> {
  const fallbackFlightQuery = `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(preferences.homeCity)}+to+${encodeURIComponent(destination.city)}+from+${preferences.startDate}+to+${preferences.endDate}`;

  const fallback: DestinationDetails = {
    city: destination.city,
    country: destination.country,
    overview: `${destination.city} is an extraordinary destination in ${destination.country}, perfectly blending historic grandeur, modern culinary innovation, and scenic attractions.`,
    bestAreas: [
      { name: 'Historic Old Quarter', description: 'Central, walkable, historic plazas and architectural gems.' },
      { name: 'Arts & Design District', description: 'Boutique hotels, independent cafes, and lively nightlife.' },
      { name: 'Riverfront / Parkside', description: 'Peaceful mornings, scenic boardwalks, and quick metro connections.' },
    ],
    localTips: [
      'Contactless transit payment is supported on public transport.',
      'Many national museums offer late Thursday or free early-bird entry hours.',
      'Check local tipping norms (typically rounding up 5–10% for full table service).',
      'Download offline subway and neighborhood maps ahead of arrival.'
    ],
    visaNotes: 'Ensure passport has at least 6 months validity. Verify specific tourist entry visa or electronic authorization requirements via official consular authorities before travel.',
    flights: [
      {
        id: 'flight-cheapest',
        label: 'cheapest',
        estPrice: Math.round(destination.estFlightPerPerson * 0.85),
        stops: 1,
        durationHrs: 14.5,
        airline: 'Regional / Budget Carrier',
        searchUrl: fallbackFlightQuery,
        meta: { source: 'Google Flights Estimate', fetchedAt: new Date().toISOString(), isEstimate: true }
      },
      {
        id: 'flight-fastest',
        label: 'fastest',
        estPrice: Math.round(destination.estFlightPerPerson * 1.35),
        stops: 0,
        durationHrs: 8.5,
        airline: 'Flagship Carrier (Non-stop)',
        searchUrl: fallbackFlightQuery,
        meta: { source: 'Google Flights Estimate', fetchedAt: new Date().toISOString(), isEstimate: true }
      },
      {
        id: 'flight-best-value',
        label: 'best-value',
        estPrice: destination.estFlightPerPerson,
        stops: 0,
        durationHrs: 9.0,
        airline: 'Premier Airline',
        searchUrl: fallbackFlightQuery,
        meta: { source: 'Google Flights Estimate', fetchedAt: new Date().toISOString(), isEstimate: true }
      }
    ],
    meta: { source: 'TripDeck AI Intelligence', fetchedAt: new Date().toISOString(), isEstimate: true }
  };

  return withTimeoutAndRetry<DestinationDetails>(
    async () => {
      const res = await fetch('/api/destination-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: destination.city,
          country: destination.country,
          homeCity: preferences.homeCity,
          startDate: preferences.startDate,
          endDate: preferences.endDate,
          currency: preferences.currency,
          adults: preferences.adults,
          children: preferences.children,
          baseFlightEstimate: destination.estFlightPerPerson,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || fallback;
    },
    fallback,
    'Gemini Search Grounding & Google Flights'
  );
}

export async function fetchItinerary(
  destination: DestinationProposal,
  preferences: TripPreferences
): Promise<ServiceResponse<ItineraryDay[]>> {
  return withTimeoutAndRetry<ItineraryDay[]>(
    async () => {
      const res = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: destination.city,
          country: destination.country,
          startDate: preferences.startDate,
          endDate: preferences.endDate,
          vibes: preferences.vibes,
          pace: preferences.pace,
          adults: preferences.adults,
          children: preferences.children,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data;
    },
    [],
    'Gemini Search Grounding'
  );
}

export async function requestWetWeatherReplanning(
  city: string,
  country: string,
  activities: ActivityItem[]
): Promise<ServiceResponse<{ swaps: RainyDayAlternative[] }>> {
  return withTimeoutAndRetry<{ swaps: RainyDayAlternative[] }>(
    async () => {
      const res = await fetch('/api/wet-weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, country, activities }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data;
    },
    { swaps: [] },
    'Gemini Weather Adapt Engine'
  );
}

export async function regenerateDayActivities(
  city: string,
  country: string,
  date: string,
  vibes: string[],
  pace: string,
  lockedActivities: ActivityItem[]
): Promise<ServiceResponse<{ activities: ActivityItem[] }>> {
  return withTimeoutAndRetry<{ activities: ActivityItem[] }>(
    async () => {
      const res = await fetch('/api/regenerate-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, country, date, vibes, pace, lockedActivities }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data;
    },
    { activities: lockedActivities },
    'Gemini Itinerary Engine'
  );
}

export async function fetchBookings(
  city: string,
  country: string,
  budget: number,
  nights: number,
  totalPeople: number,
  currency: string,
  itinerary: ItineraryDay[]
): Promise<ServiceResponse<BookingItem[]>> {
  return withTimeoutAndRetry<BookingItem[]>(
    async () => {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, country, budget, nights, totalPeople, currency, itinerary }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data;
    },
    [],
    'Google Travel & Provider Partner Search'
  );
}
