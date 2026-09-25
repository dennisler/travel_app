import { ItineraryDay, DestinationProposal } from '../types/models';

function pad(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

function formatDateToICS(dateStr: string, timeStr: string): string {
  // dateStr is YYYY-MM-DD, timeStr is HH:mm
  const cleanDate = dateStr.replace(/-/g, '');
  const [hh, mm] = timeStr.split(':').map(Number);
  const cleanTime = `${pad(hh || 9)}${pad(mm || 0)}00`;
  return `${cleanDate}T${cleanTime}`;
}

function addMinutesToDate(dateStr: string, timeStr: string, minutes: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const d = new Date(year, month - 1, day, hh || 9, mm || 0, 0);
  d.setMinutes(d.getMinutes() + minutes);
  const resYear = d.getFullYear();
  const resMonth = pad(d.getMonth() + 1);
  const resDay = pad(d.getDate());
  const resH = pad(d.getHours());
  const resM = pad(d.getMinutes());
  return `${resYear}${resMonth}${resDay}T${resH}${resM}00`;
}

function escapeICS(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an RFC 5545 compliant .ics string for the trip's itinerary.
 */
export function generateICS(
  tripName: string,
  destination: DestinationProposal | null,
  itinerary: ItineraryDay[]
): string {
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TripDeck Travel Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(tripName || 'TripDeck Itinerary')}`,
  ];

  itinerary.forEach((day) => {
    const plan = day.mode === 'rainy' && day.rainyPlan ? day.rainyPlan : day.sunnyPlan;
    plan.forEach((act) => {
      const dtstart = formatDateToICS(day.date, act.startTime);
      const dtend = addMinutesToDate(day.date, act.startTime, act.durationMins || 60);
      const uid = `${act.id}-${day.date}@tripdeck.app`;
      const location = destination ? `${destination.city}, ${destination.country}` : 'Destination';

      let description = `Category: ${act.category}\\nSetting: ${act.setting}\\nEstimated Cost: $${act.estCost}`;
      if (act.notes) {
        description += `\\nNotes: ${act.notes}`;
      }
      if (act.locked) {
        description += `\\n(Locked Event)`;
      }

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${dtstamp}`);
      lines.push(`DTSTART:${dtstart}`);
      lines.push(`DTEND:${dtend}`);
      lines.push(`SUMMARY:${escapeICS(act.name)}`);
      lines.push(`DESCRIPTION:${escapeICS(description)}`);
      lines.push(`LOCATION:${escapeICS(location)}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    });
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Downloads a string content as a file in the browser.
 */
export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
