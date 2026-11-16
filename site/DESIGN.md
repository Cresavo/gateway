# DESIGN.md – Booking Lab, salongssidan

Läs hela filen före UI-arbete. Tokens först, sedan regler.

## Tokens

### Färg (CSS-variabler i `app/globals.css`, inga hex-värden i komponenter)

| Namn | Hex | Roll |
|---|---|---|
| `--color-paper` | `#F7F7F4` | Sidans bakgrund. Ljust linne, nästan vitt, inte gräddfärgat. |
| `--color-surface` | `#FFFFFF` | Produktens gränssnitt (kalender, logg, kvitto). |
| `--color-text` | `#1B211F` | All brödtext och rubriker. |
| `--color-quiet` | `#58615D` | Sekundär text. 6,0:1 mot paper, 5,1:1 mot birch. |
| `--color-spruce` | `#20403A` | Den dominerande färgen: stora ytor (avslutning, valt läge, kundens ja). |
| `--color-lingon` | `#B3203D` | Den skarpa accenten. Endast primär handling och viktiga länkar. Vit text på lingon 6,6:1. |

Hjälptoner, härledda och bara för struktur: `--color-rule` `#DCD8D0` (linjer och ramar),
`--color-birch` `#EAE4DA` (en enda sektion i trä/linne-ton: "Läget idag"),
`--color-spruce-soft` `#E3EBE7` (bakgrund bakom Swish-kvittot), `--color-lingon-hover` `#961A33`.

Namnen `text`/`quiet`/`rule` används eftersom `ink`/`muted`/`line` redan är upptagna av docs-sidans äldre tokens.

### Typ

- **Bricolage Grotesque** (variabel, OFL): rubriker h1–h2 och produktögonblickets stora tider. Vikt 600–700, spärrning −0,02 em, optisk storlek på.
- **Schibsted Grotesk** (variabel, OFL): allt annat – brödtext, UI, knappar, tabeller. Nordisk grotesk med lugn rytm.
- Skala (modulär, ~1,25): 14 / 17 / 21 / 27 / 34 / 44 / clamp(44–72) px. Brödtext 17 px, radavstånd 1,6, radlängd max 64 tecken. Rubriker radavstånd 1,05–1,15.
- Ingen versal-text, ingen monospace.

### Radier och djup

- 6 px på kontroller och små rutor, 14 px på produktramar. Inte samma radie överallt.
- Ramar före skuggor. En enda skuggnivå (`--shadow-overlay`), bara för det som ligger ovanpå något annat (förfrågningskortet i hero).

## Layout

**Koncept:** sidan är en receptionsdisk. Texten står till vänster som en lapp vid kassan; produkten ligger öppen till höger, som skärmen på disken. Varje sektion har egen rytm och egen bredd.

```
HEADER   Booking Lab ............ Så funkar det  Kontroll  Deposition  Läget   SV|EN  [Gå med i piloten]

HERO     ┌ rubrik (5/12) ───────┐  ┌ produkt (7/12) ─────────────────────────────┐
         │ Låt assistenter…     │  │ Tisdag 25 nov     │ förfrågan från assistent│
         │ stödtext             │  │ 13 ─ Omar         │ Kunden sa ja 14:02  ✓   │
         │ [Gå med] Läs docs    │  │ 14 ─ ▓ ny bokning │ → bokad i SimplyBook    │
         └──────────────────────┘  └─────────────────────────────────────────────┘

GÅNG     rubrik smal vänster │ en bokning, från fråga till kalender, som tidslinje (riktig sekvens)

KONTROLL ┌ åtkomst och gränser (interaktivt) ┐ ┌ logg (tabell, full bredd under på mobil) ┐

PENGAR       text höger om kvittot:  [ Swish-kvitto, simulerat ]   "två separata saker"

LÄGET    birch-band: två listor  Finns idag | Finns inte än

SLUT     spruce-yta, rubrik + [Gå med i piloten] + Prata med oss
FOOTER
```

Vänsterställt som standard. Ingen centrerad hero, inga sektioner med samma höjd och utfyllnad.

## Principer

1. **Salongens dag är bilden.** Det som visas är en kalender, en förfrågan, ett kvitto och en logg – det ägaren faktiskt ser – inte diagram över teknik.
2. **Kundens ja syns alltid.** Varje produktögonblick visar var godkännandet finns. Det är produktens löfte.
3. **Ägaren talar.** Texten skrivs till en salongsägare, i vardaglig svenska. Teknikord (MCP, API) bara i en sekundär länk till docs.
4. **Ärligt om läget.** Pilot, en adapter (SimplyBook), simulerade exempel märks som exempel. Inga påhittade kunder, siffror eller logotyper.
5. **Fet en gång.** Det enda iögonfallande är hero-ögonblicket där bokningen landar. Allt annat är lugnt.
6. **En rörelse.** Hero spelar upp förfrågan → ja → bokning en gång. `prefers-reduced-motion` visar slutläget direkt.

## Förbjudet

- Inter, Roboto, Open Sans, Lato, Arial, systemfonter, Space Grotesk
- Lila eller indigo gradienter på vitt; dekorativa gradienttvättar; gradienttext
- Claude-looken: gräddvit bakgrund (~#F4F1EA) + högkontrast serif + terrakotta (~#D97757)
- Spärrade VERSALA etiketter ovanför rubriker
- Numrerade markörer (01/02/03) om innehållet inte är en verklig sekvens
- Monospace för små etiketter, badges eller "teknisk" krom
- Statusprickar, falska online-indikatorer, terminalliknande metadata
- Metasträngar med mittpunkter (A · B · C)
- Etiketter av typen "ORD – fragment" med spärrat tankstreck
- "→" efter varje länk eller knapp
- Pill-badges ovanför hero-rubriken
- Tre eller fler identiska rundade kort i rad med ikon, fet titel och två rader text
- Samma stora radie och samma mjuka grå skugga på alla rutor
- Frostat glas över suddig bakgrund
- Centrerad hero och sektioner med samma höjd och utfyllnad
- Emoji som ikoner
- Stockfoton på folk som pekar på laptops, abstrakta blobbar, generiska 3D-former
- Påhittade logotyper, avatarrader, femstjärniga omdömen eller kundcitat
- Rubriker som "supercharge", "transform", "reimagine"
- CTA:er som "Get Started" eller "Learn More"
- Fade-och-glid-upp på varje sektion, hover-rörelse på varje kort
- Stort tal med liten etikett som hero
- Utvecklarspråk (MCP, OAuth, API, "for agents") som huvudbudskap

## Granskning av planen mot briefen

Första utkastet och vad som ändrades:

- **Bakgrund:** jag började med en varm off-white (#FAF8F5). Det ligger för nära Claude-gräddvitt. Bytt till ett svalare linne (#F7F7F4) och trätonen bara i en sektion.
- **Accent:** första valet var korall. Korall/terrakotta är just den förbjudna looken, och koraller är generiska för "varm SaaS". Bytt till lingon – nordiskt, skarpt, och fungerar som enda handlingsfärg mot granen.
- **Hur det fungerar:** första utkastet var tre steg-kort med ikoner. Det är en av de förbjudna mallarna. Ersatt med en enda boknings historik som tidslinje med klockslag – en verklig sekvens som UI:t självt förklarar.
- **Kontroll:** jag hade två lika kort bredvid varandra. Nu är åtkomsten en bred inställningspanel och loggen en tabell med annan bredd och rytm.
- **Typ:** Inter i UI:t var första reflexen för "läsbart gränssnitt". Förbjudet och generiskt; Schibsted Grotesk gör samma jobb med mer karaktär.
