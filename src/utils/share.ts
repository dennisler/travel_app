import LZString from 'lz-string';
import { TripPreferences, DestinationProposal, DestinationDetails, FlightOption, ItineraryDay, BookingItem } from '../types/models';

export interface SharedTripPayload {
  preferences: TripPreferences;
  selectedDestination: DestinationProposal | null;
  destinationDetails: DestinationDetails | null;
  selectedFlight: FlightOption | null;
  itinerary: ItineraryDay[];
  bookings: BookingItem[];
  v: number;
}

/**
 * Encodes the essential trip state into a compressed URL hash string.
 * Keeps output under 2,000 characters by stripping empty or large cached meta.
 */
export function encodeTripToShareUrl(payload: SharedTripPayload): string {
  try {
    // Compact representation
    const compactItinerary = payload.itinerary.map(day => ({
      d: day.date,
      i: day.dayIndex,
      w: day.weatherSummary,
      r: day.rainChance,
      t: day.temperatureC,
      m: day.mode,
      s: day.sunnyPlan.map(a => ({
        id: a.id,
        n: a.name,
        c: a.category,
        st: a.startTime,
        dm: a.durationMins,
        ec: a.estCost,
        se: a.setting,
        l: a.locked ? 1 : 0,
        nt: a.needsTicket ? 1 : 0,
        no: a.notes || '',
        tt: a.transitTimeToNextMins || 15
      })),
      rp: day.rainyPlan ? day.rainyPlan.map(a => ({
        id: a.id,
        n: a.name,
        c: a.category,
        st: a.startTime,
        dm: a.durationMins,
        ec: a.estCost,
        se: a.setting,
        l: a.locked ? 1 : 0,
        nt: a.needsTicket ? 1 : 0,
        no: a.notes || '',
        tt: a.transitTimeToNextMins || 15
      })) : undefined,
      sw: day.swaps ? day.swaps.map(sw => ({
        oid: sw.originalActivityId,
        rn: sw.replacement.name,
        rc: sw.replacement.category,
        rst: sw.replacement.startTime,
        rdm: sw.replacement.durationMins,
        rec: sw.replacement.estCost,
        re: sw.reason
      })) : undefined
    }));

    const compactBookings = payload.bookings.map(b => ({
      id: b.id,
      t: b.type,
      n: b.name,
      d: b.details,
      c: b.estCost,
      u: b.bookingUrl,
      s: b.status,
      ref: b.referenceNo || ''
    }));

    const minimal = {
      p: payload.preferences,
      dest: payload.selectedDestination ? {
        id: payload.selectedDestination.id,
        c: payload.selectedDestination.city,
        co: payload.selectedDestination.country,
        mr: payload.selectedDestination.matchReason,
        fp: payload.selectedDestination.estFlightPerPerson,
        tc: payload.selectedDestination.estTotalCost,
        se: payload.selectedDestination.season,
        w: payload.selectedDestination.weather,
        ev: payload.selectedDestination.highlightEvent
      } : null,
      det: payload.destinationDetails ? {
        c: payload.destinationDetails.city,
        co: payload.destinationDetails.country,
        ov: payload.destinationDetails.overview,
        ba: payload.destinationDetails.bestAreas,
        lt: payload.destinationDetails.localTips,
        vn: payload.destinationDetails.visaNotes
      } : null,
      f: payload.selectedFlight ? {
        id: payload.selectedFlight.id,
        l: payload.selectedFlight.label,
        p: payload.selectedFlight.estPrice,
        st: payload.selectedFlight.stops,
        dh: payload.selectedFlight.durationHrs,
        al: payload.selectedFlight.airline,
        u: payload.selectedFlight.searchUrl
      } : null,
      it: compactItinerary,
      bk: compactBookings,
      v: 1
    };

    const json = JSON.stringify(minimal);
    const compressed = LZString.compressToEncodedURIComponent(json);
    const url = new URL(window.location.href);
    url.hash = `trip=${compressed}`;
    return url.toString();
  } catch (err) {
    console.error('Failed to compress trip state:', err);
    return window.location.href;
  }
}

/**
 * Decodes the shared URL hash into the full trip state.
 */
export function decodeTripFromShareHash(hash: string): SharedTripPayload | null {
  try {
    if (!hash || !hash.includes('trip=')) return null;
    const parts = hash.split('trip=');
    if (parts.length < 2) return null;
    const compressed = parts[1].split('&')[0];
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
    if (!decompressed) return null;

    const parsed = JSON.parse(decompressed);
    if (!parsed || !parsed.p) return null;

    const itinerary: ItineraryDay[] = (parsed.it || []).map((day: any) => ({
      date: day.d,
      dayIndex: day.i,
      weatherSummary: day.w,
      rainChance: day.r,
      temperatureC: day.t,
      mode: day.m || 'sunny',
      sunnyPlan: (day.s || []).map((a: any) => ({
        id: a.id,
        name: a.n,
        category: a.c,
        startTime: a.st,
        durationMins: a.dm,
        estCost: a.ec,
        setting: a.se,
        locked: !!a.l,
        needsTicket: !!a.nt,
        notes: a.no,
        transitTimeToNextMins: a.tt || 15
      })),
      rainyPlan: day.rp ? day.rp.map((a: any) => ({
        id: a.id,
        name: a.n,
        category: a.c,
        startTime: a.st,
        durationMins: a.dm,
        estCost: a.ec,
        setting: a.se,
        locked: !!a.l,
        needsTicket: !!a.nt,
        notes: a.no,
        transitTimeToNextMins: a.tt || 15
      })) : undefined,
      swaps: day.sw ? day.sw.map((sw: any) => ({
        originalActivityId: sw.oid,
        reason: sw.re,
        replacement: {
          id: `swap-${sw.oid}`,
          name: sw.rn,
          category: sw.rc,
          startTime: sw.rst,
          durationMins: sw.rdm,
          estCost: sw.rec,
          setting: 'indoor',
          locked: false,
          needsTicket: false,
        }
      })) : undefined
    }));

    const bookings: BookingItem[] = (parsed.bk || []).map((b: any) => ({
      id: b.id,
      type: b.t,
      name: b.n,
      details: b.d,
      estCost: b.c,
      bookingUrl: b.u,
      status: b.s,
      referenceNo: b.ref,
      meta: { source: 'Shared Trip', fetchedAt: new Date().toISOString(), isEstimate: true }
    }));

    const selectedDestination: DestinationProposal | null = parsed.dest ? {
      id: parsed.dest.id,
      city: parsed.dest.c,
      country: parsed.dest.co,
      matchReason: parsed.dest.mr,
      estFlightPerPerson: parsed.dest.fp,
      estTotalCost: parsed.dest.tc,
      season: parsed.dest.se,
      weather: parsed.dest.w,
      highlightEvent: parsed.dest.ev,
      meta: { source: 'Shared Trip', fetchedAt: new Date().toISOString(), isEstimate: true }
    } : null;

    const destinationDetails: DestinationDetails | null = parsed.det ? {
      city: parsed.det.c,
      country: parsed.det.co,
      overview: parsed.det.ov,
      bestAreas: parsed.det.ba || [],
      localTips: parsed.det.lt || [],
      visaNotes: parsed.det.vn || '',
      flights: [],
      meta: { source: 'Shared Trip', fetchedAt: new Date().toISOString(), isEstimate: true }
    } : null;

    const selectedFlight: FlightOption | null = parsed.f ? {
      id: parsed.f.id,
      label: parsed.f.l,
      estPrice: parsed.f.p,
      stops: parsed.f.st,
      durationHrs: parsed.f.dh,
      airline: parsed.f.al,
      searchUrl: parsed.f.u,
      meta: { source: 'Shared Trip', fetchedAt: new Date().toISOString(), isEstimate: true }
    } : null;

    return {
      preferences: parsed.p,
      selectedDestination,
      destinationDetails,
      selectedFlight,
      itinerary,
      bookings,
      v: parsed.v || 1
    };
  } catch (err) {
    console.error('Failed to decode trip state from hash:', err);
    return null;
  }
}
