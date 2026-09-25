export type Vibe = 
  | "food" 
  | "culture" 
  | "nature" 
  | "nightlife" 
  | "relaxation" 
  | "adventure" 
  | "shopping" 
  | "family";

export type Pace = "relaxed" | "balanced" | "packed";

export interface TripPreferences {
  homeCity: string;
  currency: string;
  budget: number;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  vibes: Vibe[];
  pace: Pace;
}

export interface DataMeta {
  source: string;
  fetchedAt: string;
  isEstimate: boolean;
}

export interface DestinationProposal {
  id: string;
  city: string;
  country: string;
  matchReason: string;
  estFlightPerPerson: number;
  estTotalCost: number;
  season: "peak" | "shoulder" | "off-peak";
  weather: {
    avgHighC: number;
    avgLowC: number;
    rainChance?: number;
    type: "forecast" | "seasonal";
  };
  highlightEvent?: string;
  meta: DataMeta;
}

export interface FlightOption {
  id: string;
  label: "cheapest" | "fastest" | "best-value";
  estPrice: number;
  stops: number;
  durationHrs: number;
  airline?: string;
  searchUrl: string;
  meta: DataMeta;
}

export interface ActivityItem {
  id: string;
  name: string;
  category: string;
  startTime: string; // e.g. "09:30"
  durationMins: number;
  estCost: number;
  setting: "indoor" | "outdoor" | "mixed";
  locked: boolean;
  needsTicket: boolean;
  notes?: string;
  sourceUrl?: string;
  transitTimeToNextMins?: number;
}

export interface RainyDayAlternative {
  originalActivityId: string;
  replacement: ActivityItem;
  reason: string;
}

export interface ItineraryDay {
  date: string;
  dayIndex: number;
  weatherSummary?: string;
  rainChance?: number;
  temperatureC?: number;
  sunnyPlan: ActivityItem[];
  rainyPlan?: ActivityItem[];
  mode: "sunny" | "rainy";
  swaps?: RainyDayAlternative[];
}

export interface BookingItem {
  id: string;
  type: "hotel" | "transport" | "ticket";
  name: string;
  details?: string;
  estCost: number;
  bookingUrl: string;
  status: "suggested" | "booked";
  referenceNo?: string;
  meta: DataMeta;
}

export interface DestinationDetails {
  city: string;
  country: string;
  overview: string;
  bestAreas: { name: string; description: string }[];
  localTips: string[];
  visaNotes: string;
  flights: FlightOption[];
  meta: DataMeta;
}

export interface ServiceResponse<T> {
  status: "ok" | "fallback" | "error";
  data: T;
  source: string;
  fetchedAt: string;
  error?: string;
}

export interface BudgetBreakdown {
  flights: number;
  stay: number;
  transport: number;
  activities: number;
  foodEstimate: number;
  buffer: number;
  totalEstimated: number;
  budget: number;
  remaining: number;
  currency: string;
}
