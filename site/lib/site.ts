function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.endsWith("/") ? explicit.slice(0, -1) : explicit;
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;
  const preview = process.env.VERCEL_URL;
  if (preview) return `https://${preview}`;
  return "http://localhost:3000";
}

export const site = {
  name: "Booking Lab Gateway",
  title: "Booking Lab Gateway: booking infrastructure for AI agents",
  description:
    "Connect AI agents to booking systems through one consistent interface. Discover availability, request bookings, handle approvals and confirm reservations over REST or MCP. Currently a local proof of concept with synthetic data.",
  url: resolveSiteUrl(),
};
