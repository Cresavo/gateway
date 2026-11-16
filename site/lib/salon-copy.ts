// All text on the salon page, in Swedish and English. Keep both complete.
// Names, times and amounts in product moments are examples and are labelled as such.

export type Lang = "sv" | "en";

export const pilotHref = process.env.NEXT_PUBLIC_PILOT_CONTACT_URL || "#pilot";

const sv = {
  langName: "Svenska",
  otherLang: { code: "en" as Lang, label: "English", short: "EN", href: "/en" },
  skip: "Hoppa till innehållet",
  nav: [
    { href: "#sa-funkar-det", label: "Så funkar det" },
    { href: "#kontroll", label: "Kontroll" },
    { href: "#deposition", label: "Deposition" },
    { href: "#laget", label: "Läget idag" },
  ],
  langSwitchLabel: "Språk",
  cta: "Gå med i piloten",
  hero: {
    title: "Låt assistenter boka era tider. Ni behåller kontrollen.",
    support:
      "Kunden godkänner varje bokning. Ni bestämmer vilka agenter som får boka, med gränser och en logg. Depositioner går via Swish, separat från själva bokningen.",
    secondary: "Teknisk dokumentation",
  },
  moment: {
    frameLabel: "Exempel: en salongs kalender när en bokning kommer in",
    day: "Tisdag 25 november",
    salon: "Exempelsalongen",
    staff: "Anna",
    existing: [
      { start: "12:00", end: "12:45", who: "Mira", what: "Klippning" },
      { start: "13:00", end: "14:00", who: "Lina", what: "Färg" },
      { start: "15:30", end: "16:15", who: "Omar", what: "Klippning" },
    ],
    newBooking: { start: "14:30", end: "15:15", who: "Sara", what: "Klippning" },
    newTag: "Ny, via assistent",
    request: {
      heading: "Förfrågan från en assistent",
      what: "Klippning, 45 min",
      when: "Tisdag 14:30 hos Anna",
      price: "650 kr",
      rules: "Inom era gränser",
      waiting: "Väntar på kundens svar",
      yes: "Kunden sa ja 14:02",
      booked: "Bokad i ert bokningssystem",
    },
    replay: "Spela igen",
    example: "Exempeldata",
  },
  journey: {
    heading: "Så går en bokning till",
    intro: "Samma ordning varje gång. Säger kunden nej, eller svarar inte, händer ingenting i er kalender.",
    steps: [
      { time: "14:01", title: "Kunden frågar sin assistent", text: "Till exempel: ”Boka en klippning hos min frisör efter jobbet på tisdag.”" },
      { time: "14:01", title: "Assistenten frågar oss om lediga tider", text: "Den ser bara de tjänster och tider ni har öppnat för assistenter, och bara om ni har släppt in den." },
      { time: "14:02", title: "Kunden ser tid och pris och säger ja", text: "Ingenting bokas innan kunden har godkänt just den här tiden." },
      { time: "14:02", title: "Bokningen hamnar i er kalender", text: "Den skapas i ert vanliga bokningssystem. Vi börjar med SimplyBook." },
    ],
  },
  control: {
    heading: "Ni bestämmer vilka som får boka",
    intro: "Släpp in de assistenter ni vill, sätt gränser och se allt som hänt. Prova reglagen, det är ett exempel.",
    accessHeading: "Assistenter som får boka",
    assistants: ["ChatGPT", "Claude", "Grok", "Andra assistenter"],
    allowed: "Får boka",
    blocked: "Stängd",
    limitsHeading: "Gränser",
    perDay: "Bokningar per assistent och dag",
    maxPrice: "Högsta pris per bokning",
    noPriceLimit: "Ingen gräns",
    sameDay: "Tillåt bokningar samma dag",
    logHeading: "Logg",
    logCaption: "Exempel på vad loggen visar",
    cols: ["Tid", "Assistent", "Ville boka", "Kundens svar", "Resultat"],
    rows: [
      { t: "14:02", a: "ChatGPT", w: "Klippning tis 14:30", c: "Ja", r: "Bokad", tone: "ok" },
      { t: "11:40", a: "Claude", w: "Färg fre 10:00", c: "Nej", r: "Ingen bokning", tone: "none" },
      { t: "09:15", a: "Grok", w: "Klippning idag 17:00", c: "Inte tillfrågad", r: "Stoppad av era gränser", tone: "stop" },
      { t: "igår", a: "Claude", w: "Klippning tor 12:00", c: "Inget svar", r: "Förfrågan gick ut", tone: "none" },
    ],
    closed: "Stängd för den här assistenten",
  },
  deposit: {
    heading: "Depositionen är en egen sak",
    text: "Bokningen kräver kundens ja. Depositionen betalar kunden själv i Swish, som en separat betalning. Assistenten hanterar aldrig pengar.",
    points: [
      { title: "Bokningen", text: "Kunden godkänner tid, tjänst och pris. Då skapas bokningen." },
      { title: "Depositionen", text: "Kunden betalar i sin Swish-app. Pengarna går till salongens eget Swish-nummer." },
    ],
    receiptLabel: "Simulerat exempel, ingen riktig betalning",
    receiptTitle: "Deposition",
    amount: "200 kr",
    to: "Till Exempelsalongen",
    forWhat: "Klippning tisdag 25 november 14:30",
    paid: "Betald i Swish 14:03",
    separate: "Betalningen är kopplad till bokningen, men godkänns separat.",
  },
  status: {
    heading: "Läget idag",
    intro: "Booking Lab är tidigt. Vi letar efter de första salongerna som vill vara med i en pilot. Det här är vad som finns och inte finns.",
    haveHeading: "Finns och fungerar i vår testmiljö",
    have: [
      "Kundens godkännande innan en bokning skapas",
      "Gränser per assistent och en logg över allt som hänt",
      "Skydd mot dubbelbokning när två frågar om samma tid",
    ],
    notHeading: "Finns inte än",
    not: [
      "Riktiga kunder och salonger. Allt är testat med påhittade uppgifter.",
      "Koppling till SimplyBook i drift. Den provas just nu.",
      "Riktiga depositioner i Swish. Betalningen är simulerad.",
      "Kontroll av att det verkligen är kunden som säger ja.",
      "Testad koppling till namngivna assistenter. Namnen är exempel.",
    ],
  },
  final: {
    heading: "Vill ni vara med från början?",
    text: "Vi söker några salonger som använder SimplyBook och vill prova i liten skala. Ni får bestämma takten, och ni kan sluta när ni vill.",
    secondary: "Läs den tekniska dokumentationen",
    noContact: "Kontaktväg läggs till innan sidan publiceras.",
  },
  footer: {
    line: "Booking Lab. Öppen källkod, byggt i Sverige.",
    docs: "Dokumentation",
  },
};

export type Copy = typeof sv;

const en: Copy = {
  langName: "English",
  otherLang: { code: "sv", label: "Svenska", short: "SV", href: "/" },
  skip: "Skip to content",
  nav: [
    { href: "#sa-funkar-det", label: "How it works" },
    { href: "#kontroll", label: "Control" },
    { href: "#deposition", label: "Deposits" },
    { href: "#laget", label: "Where we are" },
  ],
  langSwitchLabel: "Language",
  cta: "Join the pilot",
  hero: {
    title: "Let assistants book your chairs. You stay in control.",
    support:
      "Customers approve every booking. You decide which agents may book, with limits and a log. Deposits go through Swish, separate from the booking itself.",
    secondary: "Technical documentation",
  },
  moment: {
    frameLabel: "Example: a salon calendar as a booking comes in",
    day: "Tuesday 25 November",
    salon: "Example Salon",
    staff: "Anna",
    existing: [
      { start: "12:00", end: "12:45", who: "Mira", what: "Haircut" },
      { start: "13:00", end: "14:00", who: "Lina", what: "Colour" },
      { start: "15:30", end: "16:15", who: "Omar", what: "Haircut" },
    ],
    newBooking: { start: "14:30", end: "15:15", who: "Sara", what: "Haircut" },
    newTag: "New, via assistant",
    request: {
      heading: "Request from an assistant",
      what: "Haircut, 45 min",
      when: "Tuesday 14:30 with Anna",
      price: "SEK 650",
      rules: "Within your limits",
      waiting: "Waiting for the customer",
      yes: "Customer said yes at 14:02",
      booked: "Booked in your booking system",
    },
    replay: "Play again",
    example: "Example data",
  },
  journey: {
    heading: "How a booking happens",
    intro: "Same order every time. If the customer says no, or doesn't answer, nothing happens in your calendar.",
    steps: [
      { time: "14:01", title: "The customer asks their assistant", text: "For example: “Book a haircut with my hairdresser after work on Tuesday.”" },
      { time: "14:01", title: "The assistant asks us for free times", text: "It only sees the services and times you have opened to assistants, and only if you have let it in." },
      { time: "14:02", title: "The customer sees time and price and says yes", text: "Nothing is booked until the customer has approved this exact time." },
      { time: "14:02", title: "The booking lands in your calendar", text: "It is created in your usual booking system. We are starting with SimplyBook." },
    ],
  },
  control: {
    heading: "You decide who may book",
    intro: "Let in the assistants you want, set limits and see everything that happened. Try the controls, it's an example.",
    accessHeading: "Assistants allowed to book",
    assistants: ["ChatGPT", "Claude", "Grok", "Other assistants"],
    allowed: "May book",
    blocked: "Closed",
    limitsHeading: "Limits",
    perDay: "Bookings per assistant per day",
    maxPrice: "Highest price per booking",
    noPriceLimit: "No limit",
    sameDay: "Allow same-day bookings",
    logHeading: "Log",
    logCaption: "Example of what the log shows",
    cols: ["Time", "Assistant", "Wanted to book", "Customer's answer", "Result"],
    rows: [
      { t: "14:02", a: "ChatGPT", w: "Haircut Tue 14:30", c: "Yes", r: "Booked", tone: "ok" },
      { t: "11:40", a: "Claude", w: "Colour Fri 10:00", c: "No", r: "No booking", tone: "none" },
      { t: "09:15", a: "Grok", w: "Haircut today 17:00", c: "Not asked", r: "Stopped by your limits", tone: "stop" },
      { t: "yesterday", a: "Claude", w: "Haircut Thu 12:00", c: "No answer", r: "Request expired", tone: "none" },
    ],
    closed: "Closed for this assistant",
  },
  deposit: {
    heading: "The deposit is its own thing",
    text: "The booking needs the customer's yes. The customer pays the deposit themselves in Swish, as a separate payment. The assistant never handles money.",
    points: [
      { title: "The booking", text: "The customer approves the time, service and price. Then the booking is created." },
      { title: "The deposit", text: "The customer pays in their Swish app. The money goes to the salon's own Swish number." },
    ],
    receiptLabel: "Simulated example, no real payment",
    receiptTitle: "Deposit",
    amount: "SEK 200",
    to: "To Example Salon",
    forWhat: "Haircut Tuesday 25 November 14:30",
    paid: "Paid in Swish at 14:03",
    separate: "The payment is linked to the booking, but approved separately.",
  },
  status: {
    heading: "Where we are",
    intro: "Booking Lab is early. We are looking for the first salons that want to join a pilot. This is what exists and what doesn't.",
    haveHeading: "Exists and works in our test setup",
    have: [
      "The customer's approval before a booking is created",
      "Limits per assistant and a log of everything that happened",
      "Protection against double bookings when two ask for the same time",
    ],
    notHeading: "Doesn't exist yet",
    not: [
      "Real customers and salons. Everything is tested with made-up data.",
      "A live SimplyBook connection. It is being tried right now.",
      "Real Swish deposits. The payment is simulated.",
      "A check that it really is the customer who says yes.",
      "Tested connections to named assistants. The names are examples.",
    ],
  },
  final: {
    heading: "Want to be there from the start?",
    text: "We are looking for a few salons that use SimplyBook and want to try this on a small scale. You set the pace, and you can stop whenever you like.",
    secondary: "Read the technical documentation",
    noContact: "A contact route will be added before the page is published.",
  },
  footer: {
    line: "Booking Lab. Open source, built in Sweden.",
    docs: "Documentation",
  },
};

export const copy: Record<Lang, Copy> = { sv, en };
