import { ActivityItem, BookingItem, FlightOption, ItineraryDay, TripPreferences, BudgetBreakdown } from '../types/models';
import { calculateDaysBetween } from './format';

export function calculateBudgetBreakdown(
  preferences: TripPreferences,
  selectedFlight: FlightOption | null,
  itinerary: ItineraryDay[],
  bookings: BookingItem[],
  fallbackFlightPerPerson: number = 0
): BudgetBreakdown {
  const totalPeople = (preferences.adults || 1) + (preferences.children || 0);
  const totalDays = calculateDaysBetween(preferences.startDate, preferences.endDate);
  const totalNights = Math.max(1, totalDays - 1);

  // 1. Flights
  const flightPricePerPerson = selectedFlight ? selectedFlight.estPrice : fallbackFlightPerPerson;
  const flightTotal = flightPricePerPerson * totalPeople;

  // 2. Stay (Hotels)
  const hotelBookings = bookings.filter((b) => b.type === 'hotel');
  const bookedHotels = hotelBookings.filter((b) => b.status === 'booked');
  let stayTotal = 0;
  if (bookedHotels.length > 0) {
    stayTotal = bookedHotels.reduce((sum, b) => sum + b.estCost, 0);
  } else if (hotelBookings.length > 0) {
    // take the first suggested hotel as baseline
    stayTotal = hotelBookings[0].estCost;
  } else {
    // Default estimate based on budget allocation
    stayTotal = totalNights * Math.max(80, Math.round(preferences.budget * 0.3 / totalNights));
  }

  // 3. Transport (Transit passes, transfers)
  const transportBookings = bookings.filter((b) => b.type === 'transport');
  let transportTotal = 0;
  if (transportBookings.length > 0) {
    transportTotal = transportBookings.reduce((sum, b) => sum + b.estCost, 0);
  } else {
    transportTotal = Math.round(25 * totalDays * totalPeople);
  }

  // 4. Activities
  let activitiesTotal = 0;
  itinerary.forEach((day) => {
    const plan = day.mode === 'rainy' && day.rainyPlan ? day.rainyPlan : day.sunnyPlan;
    plan.forEach((act) => {
      activitiesTotal += (act.estCost || 0) * totalPeople;
    });
  });

  // Also include any booked tickets that might not be in the direct sum
  const ticketBookings = bookings.filter((b) => b.type === 'ticket' && b.status === 'booked');
  ticketBookings.forEach((tb) => {
    // if not already tracked or as additional
  });

  // 5. Food estimate
  const dailyFoodPerAdult = preferences.pace === 'relaxed' ? 50 : preferences.pace === 'balanced' ? 65 : 85;
  const dailyFoodPerChild = dailyFoodPerAdult * 0.6;
  const foodEstimate = Math.round(
    ((preferences.adults * dailyFoodPerAdult) + (preferences.children * dailyFoodPerChild)) * totalDays
  );

  // 6. Subtotal & 10% Buffer
  const subtotal = flightTotal + stayTotal + transportTotal + activitiesTotal + foodEstimate;
  const buffer = Math.round(subtotal * 0.10);
  const totalEstimated = subtotal + buffer;
  const remaining = preferences.budget - totalEstimated;

  return {
    flights: flightTotal,
    stay: stayTotal,
    transport: transportTotal,
    activities: activitiesTotal,
    foodEstimate,
    buffer,
    totalEstimated,
    budget: preferences.budget,
    remaining,
    currency: preferences.currency || 'USD',
  };
}
