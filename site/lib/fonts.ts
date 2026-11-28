import localFont from "next/font/local";

// Self-hosted OFL fonts from @fontsource-variable (no runtime request to a font CDN).
export const sans = localFont({
  src: "../node_modules/@fontsource-variable/schibsted-grotesk/files/schibsted-grotesk-latin-wght-normal.woff2",
  variable: "--font-sans-face",
  weight: "400 900",
  display: "swap",
});

export const mono = localFont({
  src: "../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-mono-face",
  weight: "100 800",
  display: "swap",
});

// Salon page display face (OFL). Body text keeps Schibsted Grotesk (`sans`).
export const display = localFont({
  src: "../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2",
  variable: "--font-display-face",
  weight: "200 800",
  display: "swap",
});
