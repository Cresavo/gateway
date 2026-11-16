/**
 * One synthetic booking, shared by the hero demo, the calendar, the customer
 * view and the JSON view so they can never disagree. Salong Eko is Booking Lab's
 * synthetic demo salon; the haircut, price, times and id are illustrative.
 */
export const demo = {
  request: "Book a haircut on Friday afternoon",
  business: "Salong Eko",
  service: "Haircut",
  serviceId: "haircut",
  staff: { id: "staff-demo", name: "Anna" },
  durationMinutes: 45,
  price: "450 kr",
  dayLong: "Friday 20 November",
  dayShort: "Fri 20 Nov",
  start: "13:30",
  end: "14:15",
  startIso: "2026-11-20T13:30:00+01:00",
  endIso: "2026-11-20T14:15:00+01:00",
  times: ["13:30", "15:00", "16:15"],
  bookingId: "bk_demo_7f3a",
  /** Illustrative discovery step: fictional businesses, not live listings. */
  options: [
    { name: "Salong Eko", price: "450 kr", next: "Fri 13:30", chosen: true },
    { name: "Klippstudion", price: "520 kr", next: "Fri 16:00", chosen: false },
    { name: "Hårverket", price: "395 kr", next: "Sat 10:00", chosen: false },
  ],
} as const;

export const demoJson = `{
  "apiVersion": "v1",
  "replayed": false,
  "booking": {
    "id": "${demo.bookingId}",
    "status": "confirmed",
    "start": "${demo.startIso}",
    "end": "${demo.endIso}",
    "durationMinutes": ${demo.durationMinutes},
    "serviceId": "${demo.serviceId}",
    "serviceName": "${demo.service}",
    "staff": { "id": "${demo.staff.id}", "name": "${demo.staff.name}" },
    "version": 1,
    "createdAt": "2026-11-16T15:02:11+01:00"
  }
}`;
