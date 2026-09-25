import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize Gemini SDK with User-Agent as instructed by gemini-api skill
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Utility to parse JSON safely from model response
function cleanAndParseJSON<T>(text: string, fallback: T): T {
  try {
    let clean = text.trim();
    // remove markdown code block wrapping if present
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    }
    return JSON.parse(clean);
  } catch (err) {
    console.warn('Failed to parse JSON from AI response, using fallback:', err);
    return fallback;
  }
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!apiKey,
    timestamp: new Date().toISOString(),
  });
});

// 1. Destinations Endpoint
app.post('/api/destinations', async (req: Request, res: Response) => {
  const { homeCity, currency, budget, startDate, endDate, adults, children, vibes, pace } = req.body;
  const totalPeople = (Number(adults) || 1) + (Number(children) || 0);

  const fallbackDestinations = [
    {
      id: 'dest-tokyo',
      city: 'Tokyo',
      country: 'Japan',
      matchReason: 'Unmatched culinary culture, sensory neon districts, and world-class public transit that fits your pace.',
      estFlightPerPerson: Math.round(budget * 0.28 / totalPeople),
      estTotalCost: Math.round(budget * 0.85),
      season: 'shoulder',
      weather: { avgHighC: 22, avgLowC: 14, rainChance: 20, type: 'seasonal' },
      highlightEvent: 'Seasonal Evening Illuminations & Tsukiji Street Food Festival',
      meta: { source: 'TripDeck AI Intelligence (Historical Baseline)', fetchedAt: new Date().toISOString(), isEstimate: true }
    },
    {
      id: 'dest-barcelona',
      city: 'Barcelona',
      country: 'Spain',
      matchReason: 'Vibrant Mediterranean beaches, world-renowned Gaudí architecture, and legendary tapas culture.',
      estFlightPerPerson: Math.round(budget * 0.25 / totalPeople),
      estTotalCost: Math.round(budget * 0.80),
      season: 'peak',
      weather: { avgHighC: 24, avgLowC: 17, rainChance: 15, type: 'seasonal' },
      highlightEvent: 'Gothic Quarter Tapas Crawl & Montjuïc Magic Fountain Show',
      meta: { source: 'TripDeck AI Intelligence (Historical Baseline)', fetchedAt: new Date().toISOString(), isEstimate: true }
    },
    {
      id: 'dest-vancouver',
      city: 'Vancouver',
      country: 'Canada',
      matchReason: 'Breathtaking coastal mountains, pristine wilderness hiking, and relaxed Pacific Rim dining.',
      estFlightPerPerson: Math.round(budget * 0.22 / totalPeople),
      estTotalCost: Math.round(budget * 0.75),
      season: 'shoulder',
      weather: { avgHighC: 19, avgLowC: 12, rainChance: 35, type: 'seasonal' },
      highlightEvent: 'Granville Island Artists Market & Stanley Park Seawall Fest',
      meta: { source: 'TripDeck AI Intelligence (Historical Baseline)', fetchedAt: new Date().toISOString(), isEstimate: true }
    },
    {
      id: 'dest-bangkok',
      city: 'Bangkok',
      country: 'Thailand',
      matchReason: 'Incredible budget value, Michelin street food stalls, ancient gilded temples, and lively night markets.',
      estFlightPerPerson: Math.round(budget * 0.26 / totalPeople),
      estTotalCost: Math.round(budget * 0.65),
      season: 'off-peak',
      weather: { avgHighC: 32, avgLowC: 25, rainChance: 30, type: 'seasonal' },
      highlightEvent: 'Chao Phraya River Lights & Chatuchak Weekend Market',
      meta: { source: 'TripDeck AI Intelligence (Historical Baseline)', fetchedAt: new Date().toISOString(), isEstimate: true }
    },
    {
      id: 'dest-reykjavik',
      city: 'Reykjavík',
      country: 'Iceland',
      matchReason: 'Geothermal hot springs, dramatic waterfalls, otherworldly volcanic terrain, and Nordic charm.',
      estFlightPerPerson: Math.round(budget * 0.32 / totalPeople),
      estTotalCost: Math.round(budget * 0.90),
      season: 'shoulder',
      weather: { avgHighC: 13, avgLowC: 7, rainChance: 40, type: 'seasonal' },
      highlightEvent: 'Midnight Sun Concerts & Golden Circle Geothermal Exploration',
      meta: { source: 'TripDeck AI Intelligence (Historical Baseline)', fetchedAt: new Date().toISOString(), isEstimate: true }
    },
    {
      id: 'dest-florence',
      city: 'Florence',
      country: 'Italy',
      matchReason: 'Renaissance masterpieces, Tuscan wine tasting, artisanal leather workshops, and romantic sunset vistas.',
      estFlightPerPerson: Math.round(budget * 0.27 / totalPeople),
      estTotalCost: Math.round(budget * 0.82),
      season: 'peak',
      weather: { avgHighC: 25, avgLowC: 16, rainChance: 18, type: 'seasonal' },
      highlightEvent: 'Piazza del Duomo Evening Chamber Music & Chianti Wine Harvest',
      meta: { source: 'TripDeck AI Intelligence (Historical Baseline)', fetchedAt: new Date().toISOString(), isEstimate: true }
    },
  ];

  if (!ai) {
    return res.json({
      status: 'fallback',
      data: fallbackDestinations,
      source: 'TripDeck Engine (Gemini key not configured)',
      fetchedAt: new Date().toISOString(),
    });
  }

  try {
    const prompt = `You are a travel intelligence assistant.
User departing from "${homeCity || 'New York'}"
Dates: ${startDate} to ${endDate}
Total Budget: ${currency || 'USD'} ${budget}
Party: ${adults} adults, ${children} children (Total: ${totalPeople})
Vibes: ${(vibes || []).join(', ')}
Pace: ${pace}

Suggest EXACTLY 6 distinct, diverse destination cities that match the vibes and budget realistic for roundtrip travel from ${homeCity}.
For each destination, return:
- id (string, e.g. "dest-cityname")
- city (string)
- country (string)
- matchReason (2 sentences on why it fits the chosen vibes and pace)
- estFlightPerPerson (estimated roundtrip flight price in ${currency || 'USD'})
- estTotalCost (estimated total trip cost for all ${totalPeople} travelers including flights, lodging, activities, food in ${currency || 'USD'})
- season ("peak" | "shoulder" | "off-peak")
- weather: { avgHighC: number, avgLowC: number, rainChance: number, type: "forecast" | "seasonal" }
- highlightEvent (a specific real event, festival, or seasonal highlight during ${startDate} to ${endDate})

Return ONLY valid JSON matching this schema:
[
  {
    "id": "dest-...",
    "city": "...",
    "country": "...",
    "matchReason": "...",
    "estFlightPerPerson": 500,
    "estTotalCost": 2200,
    "season": "peak",
    "weather": { "avgHighC": 24, "avgLowC": 15, "rainChance": 20, "type": "seasonal" },
    "highlightEvent": "..."
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    const parsed = cleanAndParseJSON<any[]>(response.text || '', fallbackDestinations);
    const formatted = parsed.slice(0, 6).map((dest, i) => ({
      id: dest.id || `dest-${i}-${dest.city?.toLowerCase()}`,
      city: dest.city || fallbackDestinations[i].city,
      country: dest.country || fallbackDestinations[i].country,
      matchReason: dest.matchReason || fallbackDestinations[i].matchReason,
      estFlightPerPerson: Number(dest.estFlightPerPerson) || fallbackDestinations[i].estFlightPerPerson,
      estTotalCost: Number(dest.estTotalCost) || fallbackDestinations[i].estTotalCost,
      season: ['peak', 'shoulder', 'off-peak'].includes(dest.season) ? dest.season : 'shoulder',
      weather: {
        avgHighC: Number(dest.weather?.avgHighC) || 22,
        avgLowC: Number(dest.weather?.avgLowC) || 15,
        rainChance: Number(dest.weather?.rainChance) || 20,
        type: dest.weather?.type === 'forecast' ? 'forecast' : 'seasonal',
      },
      highlightEvent: dest.highlightEvent || fallbackDestinations[i].highlightEvent,
      meta: {
        source: 'Google Search & Gemini 3.8 Flash',
        fetchedAt: new Date().toISOString(),
        isEstimate: true,
      },
    }));

    return res.json({
      status: 'ok',
      data: formatted,
      source: 'Google Search & Gemini 3.8 Flash',
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error generating destinations:', err);
    return res.json({
      status: 'fallback',
      data: fallbackDestinations,
      source: 'TripDeck Engine (Offline Fallback)',
      fetchedAt: new Date().toISOString(),
      error: err?.message || 'Gemini search failed',
    });
  }
});

// 2. Destination Deep-Dive & Flight Options Endpoint
app.post('/api/destination-details', async (req: Request, res: Response) => {
  const { city, country, homeCity, startDate, endDate, currency, adults, children, baseFlightEstimate } = req.body;
  const flightQuery = `https://www.google.com/travel/flights?q=flights+from+${encodeURIComponent(homeCity || 'airport')}+to+${encodeURIComponent(city)}+from+${startDate}+to+${endDate}`;

  const defaultBasePrice = Number(baseFlightEstimate) || 450;
  const fallbackDetails = {
    city,
    country,
    overview: `${city} is one of ${country}'s premier destinations, famous for its rich history, vibrant neighborhoods, world-class gastronomy, and seamless transportation.`,
    bestAreas: [
      { name: 'City Center / Historic Quarter', description: 'Steps from iconic sights, pedestrian promenades, and boutique cafes.' },
      { name: 'Arts & Cultural District', description: 'Trendy galleries, craft cocktail lounges, and modern design hotels.' },
      { name: 'Green Park & Waterfront', description: 'Relaxed, scenic mornings with easy metro connections across the city.' },
    ],
    localTips: [
      'Tap-to-pay is widely accepted on subways and buses—no paper tickets required.',
      'Lunch menus of the day (prix fixe) offer the same Michelin-quality dishes at half the dinner price.',
      'Reservations for major museums and historic cathedrals should be secured 1–2 weeks in advance.',
      'Tipping is customary around 5–10% for exceptional dining service but not mandatory.'
    ],
    visaNotes: 'Check official government immigration portals for standard visa-waiver or eTA requirements prior to departure.',
    flights: [
      {
        id: 'flight-cheapest',
        label: 'cheapest',
        estPrice: Math.round(defaultBasePrice * 0.85),
        stops: 1,
        durationHrs: 14.5,
        airline: 'Regional / Budget Carrier',
        searchUrl: flightQuery,
        meta: { source: 'Google Flights Estimate', fetchedAt: new Date().toISOString(), isEstimate: true }
      },
      {
        id: 'flight-fastest',
        label: 'fastest',
        estPrice: Math.round(defaultBasePrice * 1.35),
        stops: 0,
        durationHrs: 8.5,
        airline: 'Flagship Carrier (Non-stop)',
        searchUrl: flightQuery,
        meta: { source: 'Google Flights Estimate', fetchedAt: new Date().toISOString(), isEstimate: true }
      },
      {
        id: 'flight-best-value',
        label: 'best-value',
        estPrice: defaultBasePrice,
        stops: 0,
        durationHrs: 9.0,
        airline: 'Premier Airline',
        searchUrl: flightQuery,
        meta: { source: 'Google Flights Estimate', fetchedAt: new Date().toISOString(), isEstimate: true }
      }
    ],
    meta: { source: 'TripDeck AI Intelligence', fetchedAt: new Date().toISOString(), isEstimate: true }
  };

  if (!ai) {
    return res.json({
      status: 'fallback',
      data: fallbackDetails,
      source: 'TripDeck Engine (Gemini key not configured)',
      fetchedAt: new Date().toISOString(),
    });
  }

  try {
    const prompt = `Provide destination travel details and flight estimates for:
Destination: ${city}, ${country}
Origin: ${homeCity || 'New York'}
Dates: ${startDate} to ${endDate}
Currency: ${currency || 'USD'}
Estimated flight baseline: ${defaultBasePrice}

Return a valid JSON object matching:
{
  "overview": "...",
  "bestAreas": [
    { "name": "...", "description": "..." },
    { "name": "...", "description": "..." },
    { "name": "...", "description": "..." }
  ],
  "localTips": [
    "Tip 1...",
    "Tip 2...",
    "Tip 3...",
    "Tip 4..."
  ],
  "visaNotes": "Brief visa / entry reminder notes (e.g., ETIAS/ESTA/Passport validity requirements. Remind user to verify with official government sources).",
  "flights": [
    {
      "id": "flight-cheapest",
      "label": "cheapest",
      "estPrice": 420,
      "stops": 1,
      "durationHrs": 13,
      "airline": "Name of realistic airline"
    },
    {
      "id": "flight-fastest",
      "label": "fastest",
      "estPrice": 680,
      "stops": 0,
      "durationHrs": 8,
      "airline": "Name of realistic airline"
    },
    {
      "id": "flight-best-value",
      "label": "best-value",
      "estPrice": 490,
      "stops": 0,
      "durationHrs": 8.5,
      "airline": "Name of realistic airline"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    const parsed = cleanAndParseJSON<any>(response.text || '', fallbackDetails);
    const flights = (parsed.flights || fallbackDetails.flights).map((f: any, idx: number) => ({
      id: f.id || `flight-${idx}`,
      label: (['cheapest', 'fastest', 'best-value'].includes(f.label) ? f.label : fallbackDetails.flights[idx].label) as any,
      estPrice: Number(f.estPrice) || fallbackDetails.flights[idx].estPrice,
      stops: Number(f.stops) ?? fallbackDetails.flights[idx].stops,
      durationHrs: Number(f.durationHrs) || fallbackDetails.flights[idx].durationHrs,
      airline: f.airline || fallbackDetails.flights[idx].airline,
      searchUrl: flightQuery,
      meta: { source: 'Google Search & Gemini 3.8 Flash', fetchedAt: new Date().toISOString(), isEstimate: true }
    }));

    const result = {
      city,
      country,
      overview: parsed.overview || fallbackDetails.overview,
      bestAreas: parsed.bestAreas || fallbackDetails.bestAreas,
      localTips: parsed.localTips || fallbackDetails.localTips,
      visaNotes: parsed.visaNotes || fallbackDetails.visaNotes,
      flights,
      meta: { source: 'Google Search & Gemini 3.8 Flash', fetchedAt: new Date().toISOString(), isEstimate: true }
    };

    return res.json({
      status: 'ok',
      data: result,
      source: 'Google Search & Gemini 3.8 Flash',
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error fetching destination details:', err);
    return res.json({
      status: 'fallback',
      data: fallbackDetails,
      source: 'TripDeck Engine (Offline Fallback)',
      fetchedAt: new Date().toISOString(),
      error: err?.message,
    });
  }
});

// 3. Base Itinerary Generator Endpoint
app.post('/api/itinerary', async (req: Request, res: Response) => {
  const { city, country, startDate, endDate, vibes, pace, adults, children } = req.body;

  // Calculate day dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const daysCount = Math.min(14, diffDays);

  const generateFallbackDay = (index: number, dateStr: string) => {
    const isFirst = index === 0;
    const isLast = index === daysCount - 1;

    let activities = [];
    if (isFirst) {
      activities = [
        {
          id: `act-${index}-1`,
          name: `Arrival & Hotel Check-in in ${city}`,
          category: 'Logistics',
          startTime: '13:00',
          durationMins: 90,
          estCost: 0,
          setting: 'indoor',
          locked: true,
          needsTicket: false,
          notes: 'Drop bags, unpack essentials, and refresh after transit.',
          transitTimeToNextMins: 20,
        },
        {
          id: `act-${index}-2`,
          name: `Neighborhood Orientation & Coffee Promenade`,
          category: 'Culture',
          startTime: '15:00',
          durationMins: 120,
          estCost: 15,
          setting: 'outdoor',
          locked: false,
          needsTicket: false,
          notes: 'Stroll through the historic center, visit local artisanal roasters.',
          transitTimeToNextMins: 15,
        },
        {
          id: `act-${index}-3`,
          name: `Welcome Tasting Dinner & Wine Pairing`,
          category: 'Food',
          startTime: '19:00',
          durationMins: 120,
          estCost: 65,
          setting: 'indoor',
          locked: true,
          needsTicket: false,
          notes: 'Sample signature local dishes and regional specialties.',
          transitTimeToNextMins: 0,
        },
      ];
    } else if (isLast) {
      activities = [
        {
          id: `act-${index}-1`,
          name: `Scenic Morning Panorama & Souvenir Browsing`,
          category: 'Shopping',
          startTime: '09:30',
          durationMins: 120,
          estCost: 20,
          setting: 'mixed',
          locked: false,
          needsTicket: false,
          notes: 'Pick up authentic local spices, confections, and crafts.',
          transitTimeToNextMins: 25,
        },
        {
          id: `act-${index}-2`,
          name: `Farewell Terrace Lunch`,
          category: 'Food',
          startTime: '12:30',
          durationMins: 90,
          estCost: 45,
          setting: 'indoor',
          locked: false,
          needsTicket: false,
          notes: 'Last chance to savor local culinary favorites.',
          transitTimeToNextMins: 30,
        },
        {
          id: `act-${index}-3`,
          name: `Airport Transfer & Departure`,
          category: 'Logistics',
          startTime: '15:00',
          durationMins: 120,
          estCost: 35,
          setting: 'indoor',
          locked: true,
          needsTicket: true,
          notes: 'Take high-speed rail or express shuttle to departure terminal.',
          transitTimeToNextMins: 0,
        },
      ];
    } else {
      activities = [
        {
          id: `act-${index}-1`,
          name: `Iconic Landmark Discovery & Guided Walk`,
          category: 'Culture',
          startTime: '09:00',
          durationMins: 150,
          estCost: 30,
          setting: 'outdoor',
          locked: false,
          needsTicket: true,
          notes: 'Visit top architectural monument with early access to skip lines.',
          transitTimeToNextMins: 20,
        },
        {
          id: `act-${index}-2`,
          name: `Market Hall Lunch & Street Food Exploration`,
          category: 'Food',
          startTime: '12:00',
          durationMins: 90,
          estCost: 25,
          setting: 'indoor',
          locked: false,
          needsTicket: false,
          notes: 'Explore famous covered food hall; try 3 regional specialties.',
          transitTimeToNextMins: 15,
        },
        {
          id: `act-${index}-3`,
          name: `Masterpiece Museum or Historic Gallery`,
          category: 'Culture',
          startTime: '14:00',
          durationMins: 120,
          estCost: 28,
          setting: 'indoor',
          locked: true,
          needsTicket: true,
          notes: 'National collection with permanent & rotating exhibitions.',
          transitTimeToNextMins: 25,
        },
        {
          id: `act-${index}-4`,
          name: `Botanical Gardens or Riverfront Walk`,
          category: 'Nature',
          startTime: '16:30',
          durationMins: 90,
          estCost: 10,
          setting: 'outdoor',
          locked: false,
          needsTicket: false,
          notes: 'Golden hour stroll through manicured grounds.',
          transitTimeToNextMins: 20,
        },
        {
          id: `act-${index}-5`,
          name: `Sunset Rooftop Aperitivo & Dinner`,
          category: 'Nightlife',
          startTime: '19:30',
          durationMins: 120,
          estCost: 55,
          setting: 'mixed',
          locked: false,
          needsTicket: false,
          notes: 'Panoramic skyline views paired with dinner.',
          transitTimeToNextMins: 0,
        },
      ];
    }

    return {
      date: dateStr,
      dayIndex: index + 1,
      weatherSummary: index % 2 === 0 ? 'Sunny & pleasant ~22°C' : 'Partly cloudy ~20°C',
      rainChance: index === 1 ? 70 : 15, // Day 2 has higher rain probability for testing!
      temperatureC: 21,
      mode: 'sunny',
      sunnyPlan: activities,
    };
  };

  const dates: string[] = [];
  for (let i = 0; i < daysCount; i++) {
    const cur = new Date(start);
    cur.setDate(cur.getDate() + i);
    dates.push(cur.toISOString().split('T')[0]);
  }

  const fallbackItinerary = dates.map((d, i) => generateFallbackDay(i, d));

  if (!ai) {
    return res.json({
      status: 'fallback',
      data: fallbackItinerary,
      source: 'TripDeck Engine (Gemini key not configured)',
      fetchedAt: new Date().toISOString(),
    });
  }

  try {
    const prompt = `Generate a realistic day-by-day travel itinerary for:
Destination: ${city}, ${country}
Dates: ${startDate} to ${endDate} (${daysCount} days)
Vibes: ${(vibes || []).join(', ')}
Pace: ${pace} (${pace === 'relaxed' ? '2-3 activities per day' : pace === 'balanced' ? '4 activities per day' : '5-6 activities per day'})
Travelers: ${adults} adults, ${children} children

For each day (total ${daysCount} days), create an array of activities:
Each activity object must have:
- id: string (unique, e.g. "act-1-1")
- name: string (specific real place, venue, or attraction in ${city})
- category: "Culture" | "Food" | "Nature" | "Nightlife" | "Shopping" | "Adventure" | "Logistics"
- startTime: string (HH:MM 24h format, e.g. "09:30")
- durationMins: number (e.g. 60, 90, 120)
- estCost: number (cost per person in USD)
- setting: "indoor" | "outdoor" | "mixed"
- locked: boolean (mark TRUE for ticketed museum bookings, scheduled shows, flight arrivals/departures; FALSE for flexible walks)
- needsTicket: boolean
- notes: string (practical advice or highlight)
- transitTimeToNextMins: number (travel time in minutes between this activity and the next, typically 10 to 30 mins)

Ensure realistic geographical sequencing and authentic local spots.
Return ONLY valid JSON matching:
[
  {
    "dayIndex": 1,
    "date": "${dates[0]}",
    "weatherSummary": "Mild & Clear ~21°C",
    "rainChance": 15,
    "temperatureC": 21,
    "activities": [...]
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    const parsed = cleanAndParseJSON<any[]>(response.text || '', []);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return res.json({
        status: 'fallback',
        data: fallbackItinerary,
        source: 'TripDeck AI Template',
        fetchedAt: new Date().toISOString(),
      });
    }

    const formatted = dates.map((dateStr, i) => {
      const match = parsed.find((p) => p.dayIndex === i + 1 || p.date === dateStr) || parsed[i];
      const acts = match?.activities || fallbackItinerary[i].sunnyPlan;

      const sunnyPlan = acts.map((a: any, aIdx: number) => ({
        id: a.id || `act-${i + 1}-${aIdx + 1}`,
        name: a.name || `Activity ${aIdx + 1}`,
        category: a.category || 'Culture',
        startTime: a.startTime || (aIdx === 0 ? '09:30' : `${11 + aIdx * 2}:00`),
        durationMins: Number(a.durationMins) || 90,
        estCost: Number(a.estCost) || 0,
        setting: ['indoor', 'outdoor', 'mixed'].includes(a.setting) ? a.setting : 'outdoor',
        locked: !!a.locked,
        needsTicket: !!a.needsTicket,
        notes: a.notes || '',
        transitTimeToNextMins: Number(a.transitTimeToNextMins) || 15,
      }));

      return {
        date: dateStr,
        dayIndex: i + 1,
        weatherSummary: match?.weatherSummary || fallbackItinerary[i].weatherSummary,
        rainChance: Number(match?.rainChance) || (i === 1 ? 65 : 15),
        temperatureC: Number(match?.temperatureC) || 21,
        mode: 'sunny',
        sunnyPlan,
      };
    });

    return res.json({
      status: 'ok',
      data: formatted,
      source: 'Google Search & Gemini 3.8 Flash',
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error generating itinerary:', err);
    return res.json({
      status: 'fallback',
      data: fallbackItinerary,
      source: 'TripDeck Engine (Offline Fallback)',
      fetchedAt: new Date().toISOString(),
      error: err?.message,
    });
  }
});

// 4. Wet-Weather Replanning Endpoint
app.post('/api/wet-weather', async (req: Request, res: Response) => {
  const { city, country, activities } = req.body;

  // Filter activities that are outdoor/mixed AND NOT locked!
  const swappableActivities = (activities || []).filter(
    (a: any) => (a.setting === 'outdoor' || a.setting === 'mixed') && !a.locked
  );

  if (swappableActivities.length === 0) {
    return res.json({
      status: 'ok',
      data: { swaps: [] },
      source: 'TripDeck Wet-Weather Engine',
      fetchedAt: new Date().toISOString(),
    });
  }

  // Fallback swaps
  const fallbackSwaps = swappableActivities.map((act: any) => ({
    originalActivityId: act.id,
    reason: `Swapped outdoor "${act.name}" for sheltered indoor alternative due to wet weather conditions.`,
    replacement: {
      id: `rain-${act.id}`,
      name: act.category === 'Food' ? `Covered Gourmet Market & Food Arcade in ${city}` :
            act.category === 'Nature' ? `Indoor Botanical Conservatory & Butterfly Pavilion in ${city}` :
            `Historic Covered Arcade & Contemporary Art Exhibition in ${city}`,
      category: act.category,
      startTime: act.startTime,
      durationMins: act.durationMins,
      estCost: act.estCost,
      setting: 'indoor',
      locked: false,
      needsTicket: false,
      notes: `Wet-weather indoor substitute for "${act.name}". Keeps you dry and comfortable.`,
      transitTimeToNextMins: act.transitTimeToNextMins || 15,
    }
  }));

  if (!ai) {
    return res.json({
      status: 'fallback',
      data: { swaps: fallbackSwaps },
      source: 'TripDeck Engine (Gemini key not configured)',
      fetchedAt: new Date().toISOString(),
    });
  }

  try {
    const prompt = `You are a travel itinerary re-planner.
Rain is forecasted in ${city}, ${country}.
The following outdoor or mixed activities need indoor replacements of similar cost and duration.
DO NOT touch or replace any locked activities (none are provided here).

Outdoor activities needing indoor replacement:
${JSON.stringify(swappableActivities.map((a: any) => ({ id: a.id, name: a.name, category: a.category, startTime: a.startTime, durationMins: a.durationMins, estCost: a.estCost })), null, 2)}

For each activity, provide an authentic, famous INDOOR alternative in ${city} (e.g. covered markets, art galleries, subterranean tours, aquariums, thermal baths, historic arcades, indoor food halls).
Return ONLY valid JSON matching:
[
  {
    "originalActivityId": "...",
    "reason": "1 sentence explanation of why this indoor alternative is great in the rain",
    "replacement": {
      "id": "rain-...",
      "name": "Specific indoor venue name in ${city}",
      "category": "...",
      "startTime": "...",
      "durationMins": 90,
      "estCost": 20,
      "setting": "indoor",
      "locked": false,
      "needsTicket": false,
      "notes": "..."
    }
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    const parsed = cleanAndParseJSON<any[]>(response.text || '', fallbackSwaps);
    const swaps = parsed.map((sw: any, idx: number) => {
      const orig = swappableActivities.find((a: any) => a.id === sw.originalActivityId) || swappableActivities[idx];
      return {
        originalActivityId: orig ? orig.id : sw.originalActivityId,
        reason: sw.reason || fallbackSwaps[idx]?.reason || 'Indoor alternative for wet weather',
        replacement: {
          id: sw.replacement?.id || `rain-${orig?.id || idx}`,
          name: sw.replacement?.name || fallbackSwaps[idx]?.replacement.name,
          category: sw.replacement?.category || orig?.category || 'Culture',
          startTime: orig?.startTime || sw.replacement?.startTime || '10:00',
          durationMins: Number(sw.replacement?.durationMins) || orig?.durationMins || 90,
          estCost: Number(sw.replacement?.estCost) ?? orig?.estCost ?? 20,
          setting: 'indoor' as const,
          locked: false,
          needsTicket: !!sw.replacement?.needsTicket,
          notes: sw.replacement?.notes || `Indoor replacement for ${orig?.name}`,
          transitTimeToNextMins: orig?.transitTimeToNextMins || 15,
        }
      };
    });

    return res.json({
      status: 'ok',
      data: { swaps },
      source: 'Google Search & Gemini 3.8 Flash',
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error in wet-weather replanning:', err);
    return res.json({
      status: 'fallback',
      data: { swaps: fallbackSwaps },
      source: 'TripDeck Engine (Offline Fallback)',
      fetchedAt: new Date().toISOString(),
      error: err?.message,
    });
  }
});

// 5. Regenerate Single Day (keeps locked activities!)
app.post('/api/regenerate-day', async (req: Request, res: Response) => {
  const { city, country, date, vibes, pace, lockedActivities } = req.body;

  const preservedLocked = (lockedActivities || []).map((a: any) => ({
    ...a,
    locked: true,
  }));

  const fallbackActivities = [
    ...preservedLocked,
    {
      id: `regen-act-${Date.now()}-1`,
      name: `Artisanal Craft Workshops & Hidden Courtyards in ${city}`,
      category: 'Culture',
      startTime: '11:00',
      durationMins: 120,
      estCost: 25,
      setting: 'indoor',
      locked: false,
      needsTicket: false,
      notes: 'Discover hidden local artisan studios and secret gardens.',
      transitTimeToNextMins: 20,
    },
    {
      id: `regen-act-${Date.now()}-2`,
      name: `Signature Culinary Pairing Experience`,
      category: 'Food',
      startTime: '14:30',
      durationMins: 90,
      estCost: 40,
      setting: 'indoor',
      locked: false,
      needsTicket: false,
      notes: 'Curated seasonal tasting plate and local beverage flight.',
      transitTimeToNextMins: 15,
    },
  ].sort((a, b) => (a.startTime > b.startTime ? 1 : -1));

  if (!ai) {
    return res.json({
      status: 'fallback',
      data: { activities: fallbackActivities },
      source: 'TripDeck Engine (Gemini key not configured)',
      fetchedAt: new Date().toISOString(),
    });
  }

  try {
    const prompt = `Regenerate a single travel day in ${city}, ${country} on date ${date}.
Pace: ${pace}
Vibes: ${(vibes || []).join(', ')}

IMPORTANT CONSTRAINT:
The following activities are LOCKED by the user and MUST remain intact at their exact times:
${JSON.stringify(preservedLocked, null, 2)}

Generate fresh, creative new activities to fill the open gaps of the day.
Make sure new activity start times do not overlap with the locked activities!
Return ONLY valid JSON array of activities for the full day (including the locked ones):
[
  {
    "id": "...",
    "name": "...",
    "category": "...",
    "startTime": "HH:MM",
    "durationMins": 90,
    "estCost": 20,
    "setting": "indoor" | "outdoor" | "mixed",
    "locked": false,
    "needsTicket": false,
    "notes": "...",
    "transitTimeToNextMins": 15
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    const parsed = cleanAndParseJSON<any[]>(response.text || '', fallbackActivities);
    // Ensure all original locked activities are present
    const finalActivities = [...parsed];
    preservedLocked.forEach((lockedItem: any) => {
      if (!finalActivities.some((a) => a.id === lockedItem.id)) {
        finalActivities.push(lockedItem);
      }
    });

    finalActivities.sort((a, b) => (a.startTime > b.startTime ? 1 : -1));

    return res.json({
      status: 'ok',
      data: { activities: finalActivities },
      source: 'Google Search & Gemini 3.8 Flash',
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error regenerating day:', err);
    return res.json({
      status: 'fallback',
      data: { activities: fallbackActivities },
      source: 'TripDeck Engine (Offline Fallback)',
      fetchedAt: new Date().toISOString(),
      error: err?.message,
    });
  }
});

// 6. Bookings & Logistics Endpoint (Hotels, Transport, Tickets)
app.post('/api/bookings', async (req: Request, res: Response) => {
  const { city, country, budget, nights, totalPeople, currency, itinerary } = req.body;
  const numNights = Math.max(1, Number(nights) || 4);
  const people = Math.max(1, Number(totalPeople) || 1);

  // Extract ticketed activities from itinerary
  const ticketedActs: any[] = [];
  (itinerary || []).forEach((day: any) => {
    const plan = day.mode === 'rainy' && day.rainyPlan ? day.rainyPlan : day.sunnyPlan;
    (plan || []).forEach((act: any) => {
      if (act.needsTicket) {
        ticketedActs.push({
          id: `ticket-${act.id}`,
          type: 'ticket',
          name: `${act.name} Admission Ticket`,
          details: `Date: ${day.date} at ${act.startTime}. Category: ${act.category}. Skip-the-line reservation recommended.`,
          estCost: Math.round((act.estCost || 25) * people),
          bookingUrl: `https://www.google.com/search?q=${encodeURIComponent(act.name + ' ' + city + ' tickets official')}`,
          status: 'suggested',
          meta: { source: 'Itinerary Activity Ticket', fetchedAt: new Date().toISOString(), isEstimate: true }
        });
      }
    });
  });

  const hotelBaseline = Math.max(80, Math.round((budget * 0.35) / numNights));
  const fallbackBookings = [
    // Hotels
    {
      id: 'hotel-boutique',
      type: 'hotel',
      name: `Grand Central Boutique Hotel ${city}`,
      details: `Historic city center, 4-star boutique, daily artisan breakfast, free high-speed Wi-Fi. ${numNights} nights.`,
      estCost: Math.round(hotelBaseline * 1.15 * numNights),
      bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}`,
      status: 'suggested',
      meta: { source: 'Booking Search Partner', fetchedAt: new Date().toISOString(), isEstimate: true }
    },
    {
      id: 'hotel-lifestyle',
      type: 'hotel',
      name: `Design & Arts Quarter Suites ${city}`,
      details: `Trendy arts district, spacious family suite, kitchenette, walking distance to cafes and metro. ${numNights} nights.`,
      estCost: Math.round(hotelBaseline * numNights),
      bookingUrl: `https://www.google.com/travel/hotels?q=${encodeURIComponent(city + ' design hotel')}`,
      status: 'suggested',
      meta: { source: 'Google Hotels Partner', fetchedAt: new Date().toISOString(), isEstimate: true }
    },
    {
      id: 'hotel-budget',
      type: 'hotel',
      name: `Urban Heritage Traveler Lodge ${city}`,
      details: `Cozy, modern rooms with rooftop terrace view, steps from subway line. Budget-friendly pick. ${numNights} nights.`,
      estCost: Math.round(hotelBaseline * 0.75 * numNights),
      bookingUrl: `https://www.google.com/travel/hotels?q=${encodeURIComponent(city + ' traveler lodge')}`,
      status: 'suggested',
      meta: { source: 'Google Hotels Partner', fetchedAt: new Date().toISOString(), isEstimate: true }
    },
    // Transport
    {
      id: 'transport-airport-express',
      type: 'transport',
      name: `${city} Airport Express Rail / Dedicated Transfer`,
      details: `Round-trip high-speed direct transit between international airport and city center for ${people} travelers.`,
      estCost: Math.round(25 * people * 2),
      bookingUrl: `https://www.google.com/search?q=${encodeURIComponent(city + ' airport train tickets')}`,
      status: 'suggested',
      meta: { source: 'Transit Authority', fetchedAt: new Date().toISOString(), isEstimate: true }
    },
    {
      id: 'transport-city-pass',
      type: 'transport',
      name: `${city} Unlimited Multi-Day Metro & Tram Transit Pass`,
      details: `All-zone unlimited subway, bus, and light rail travel for the entire ${numNights + 1}-day duration.`,
      estCost: Math.round(18 * (numNights + 1) * people * 0.6),
      bookingUrl: `https://www.google.com/search?q=${encodeURIComponent(city + ' public transport travel card pass')}`,
      status: 'suggested',
      meta: { source: 'Transit Authority', fetchedAt: new Date().toISOString(), isEstimate: true }
    },
    // Tickets
    ...ticketedActs
  ];

  if (!ai) {
    return res.json({
      status: 'fallback',
      data: fallbackBookings,
      source: 'TripDeck Engine (Gemini key not configured)',
      fetchedAt: new Date().toISOString(),
    });
  }

  try {
    const prompt = `Recommend 3 to 4 real top-rated hotels and 2 authentic local transit options for:
City: ${city}, ${country}
Nights: ${numNights}
Travelers: ${people}
Target Hotel Budget per night: ${currency || 'USD'} ${hotelBaseline}

For Hotels:
- name: real hotel name in ${city}
- details: location neighborhood, star rating, key amenities, per night rate estimate
- estCost: total cost for ${numNights} nights in ${currency || 'USD'}
- bookingUrl: google travel search or booking url

For Transport:
- Airport transfer option (Express rail or shuttle)
- City transit travel card / multi-day pass (with total estimate for ${numNights + 1} days for ${people} travelers)

Return ONLY valid JSON matching:
{
  "hotels": [
    {
      "id": "hotel-...",
      "name": "...",
      "details": "...",
      "estCost": 500,
      "bookingUrl": "..."
    }
  ],
  "transport": [
    {
      "id": "trans-...",
      "name": "...",
      "details": "...",
      "estCost": 60,
      "bookingUrl": "..."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    const parsed = cleanAndParseJSON<any>(response.text || '', { hotels: [], transport: [] });
    const aiHotels = (parsed.hotels || []).map((h: any, i: number) => ({
      id: h.id || `hotel-${i}`,
      type: 'hotel',
      name: h.name,
      details: h.details,
      estCost: Number(h.estCost) || Math.round(hotelBaseline * numNights),
      bookingUrl: h.bookingUrl || `https://www.google.com/travel/hotels?q=${encodeURIComponent(h.name + ' ' + city)}`,
      status: 'suggested',
      meta: { source: 'Google Search & Gemini 3.8 Flash', fetchedAt: new Date().toISOString(), isEstimate: true }
    }));

    const aiTransport = (parsed.transport || []).map((t: any, i: number) => ({
      id: t.id || `trans-${i}`,
      type: 'transport',
      name: t.name,
      details: t.details,
      estCost: Number(t.estCost) || Math.round(25 * people),
      bookingUrl: t.bookingUrl || `https://www.google.com/search?q=${encodeURIComponent(t.name + ' ' + city)}`,
      status: 'suggested',
      meta: { source: 'Google Search & Gemini 3.8 Flash', fetchedAt: new Date().toISOString(), isEstimate: true }
    }));

    const merged = [
      ...(aiHotels.length > 0 ? aiHotels : fallbackBookings.filter(b => b.type === 'hotel')),
      ...(aiTransport.length > 0 ? aiTransport : fallbackBookings.filter(b => b.type === 'transport')),
      ...ticketedActs
    ];

    return res.json({
      status: 'ok',
      data: merged,
      source: 'Google Search & Gemini 3.8 Flash',
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Error fetching bookings:', err);
    return res.json({
      status: 'fallback',
      data: fallbackBookings,
      source: 'TripDeck Engine (Offline Fallback)',
      fetchedAt: new Date().toISOString(),
      error: err?.message,
    });
  }
});

// Setup Vite dev server middleware or serve production dist
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static assets from dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TripDeck server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
