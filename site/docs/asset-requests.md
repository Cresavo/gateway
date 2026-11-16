# Generated image assets

Three images, generated with OpenAI `gpt-image-2` (medium quality) on 2026-11-16. No people's faces,
no real businesses, no text in the images. Everything that says something about the product is real UI in code.
To regenerate, run the prompt below with the given size, then convert as noted.

| File | Used in | Size | Conversion |
| --- | --- | --- | --- |
| `public/assets/still-life.webp` | Final CTA (decorative, `alt=""`) | 1536×1024 | resized to 1100w, webp q55 |
| `public/assets/customer-phone.webp` | "The customer's side" section, labelled "Illustration" | 1024×1536 | resized to 720w, webp q74 |
| `assets/og/backdrop.jpg` | Background of `/opengraph-image` | 1536×1024 | cover-crop to 600×315, jpeg q72 (stretched to 1200×630 in the OG image) |

The phone's screen area is measured at left 34.47%, top 17.64%, width 36.43%, height 52.54% of the image.
`components/customer-moment.tsx` places the approval card there. Re-measure if the photo is replaced.

## still-life.webp
```
Editorial still-life photograph for a premium software landing page. Overhead three-quarter view of a warm off-white linen tabletop (color close to #f6f4ef). On the right third: a small blank cream paper appointment card with a thin terracotta clay-colored border, a closed ring-bound paper desk calendar, a matte terracotta ceramic cup, a brass pencil. Soft natural window daylight from the upper left, long gentle shadows, shallow depth of field, calm and quiet, Scandinavian minimal. The left two thirds are mostly empty tabletop with subtle texture, reserved for overlaid interface. No text, no letters, no numbers, no logos, no people, no hands, no screens.```

## customer-phone.webp
```
Photograph of a single adult hand holding a modern smartphone upright, phone facing the camera perfectly straight-on and centered, screen completely flat plain light warm grey with nothing on it (no interface, no text, no icons, no reflections). Neutral warm off-white background (#f6f4ef), soft natural daylight, gentle shadow, minimal Scandinavian editorial style, muted terracotta sweater sleeve visible at the wrist. Only the hand and wrist, no face. No logos, no text, no brand marks.```

## backdrop.jpg
```
Abstract background texture for a social share image: warm off-white handmade paper (#f6f4ef) with very subtle fibers, a single soft diagonal band of muted terracotta clay color (#a5472a) at low opacity bleeding gently across the lower right corner, faint natural daylight gradient. Calm, premium, minimal, lots of empty space. No text, no letters, no shapes, no objects, no logos.```
