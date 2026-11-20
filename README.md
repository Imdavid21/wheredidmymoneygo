# wherethefuckdidmymoneygo

Create a personal finance visualization web app called "WhereTheFuckDidMyMoneyGo" with the following specifications:

## CORE FUNCTIONALITY
- Single-page application for visualizing bank statement spending
- CSV file upload (drag & drop + click to browse)
- 100% client-side processing (no backend, privacy-first)
- Uses PapaParse library for CSV parsing

## UI/UX DESIGN (shadcn/ui style)
- Clean, minimal black & white aesthetic
- Brand: 💸 emoji logo + "WhereTheFuckDidMyMoneyGo" title
- Tagline: "Find out where your money actually went"
- Upload hint: "100% private, processed locally"

## LAYOUT STRUCTURE

### 1. Header
- Logo (💸) + Title + Description
- Top of page, clean spacing

### 2. Upload Area
- Dashed border card
- Upload icon (cloud with arrow)
- Hover effects: lift + scale
- Drag & drop highlight state
- Loading spinner during processing

### 3. Stats Grid (4 cards, responsive)
Cards should show:
- Total Income (deposits count)
- Total Spent (transactions count)
- Recurring Charges (subscriptions/month)
- Avg Per Transaction
- Each card: hover lift effect + shadow
- Clean typography with large numbers

### 4. Sankey Diagram (Canvas-based)
CRITICAL: Use HTML Canvas API (not SVG or D3.js)
- Three-column layout: Income → [Flows] → Categories
- Left: Single "Income" node (black rounded rect, 70% of height)
- Right: Multiple category nodes (black rounded rects, proportional heights)
- Flows: Colored Bezier curves connecting Income to Categories
  - Each flow width proportional to spending amount
  - Semi-transparent colored fills (HSL: unique hue per category, 60% sat, 75% light, 0.7 alpha)
- Labels:
  - Income node: "Income" + dollar amount (left-aligned, outside node)
  - Category nodes: Category name + dollar amount + percentage (right-aligned, outside node)
  - For small nodes (<30px height): show compact single line
  - Minimum 35px padding between category nodes
- Interactive:
  - Hover over nodes → tooltip with category + amount + percentage
  - Cursor changes to pointer on hover
- Responsive:
  - Desktop: 120px left margin, 180px right margin
  - Mobile: 80px left margin, 120px right margin
  - Debounced resize (250ms)
  - Device pixel ratio support for crisp rendering

### 5. Category Breakdown (Grid of cards)
- Responsive grid (min 280px per card)
- Each card:
  - Colored left border (matching Sankey flow color)
  - Category name + total amount
  - Horizontal progress bar (colored, matching category)
  - Top 3 transactions (merchant name + amount)
  - Hover effects: lift + border highlight

## DATA PROCESSING

### CSV Parsing
Support these field names (case-insensitive):
- Amount fields: Amount, Transaction Amount, Debit, Credit
- Date fields: Date, Transaction Date, Posted Date
- Description fields: Description, Merchant, Name
- Auto-detect income vs expense (positive = income)

### Smart Categorization
Auto-categorize transactions based on keywords:
- **Food**: restaurant, cafe, coffee, doordash, ubereats, grocery, starbucks, chipotle, safeway, whole foods, trader joes
- **Subscriptions**: netflix, spotify, hulu, disney, prime, gym, membership, fitness, youtube, apple music, adobe
- **Shopping**: amazon, walmart, target, best buy
- **Transport**: uber, lyft, gas, parking, shell, chevron
- **Utilities**: electric, water, internet, phone, verizon, at&t, comcast, edison, bill
- **Entertainment**: movie, theater, game, steam, concert, playstation, hotel
- **Health**: pharmacy, doctor, cvs, walgreens, medical, hospital
- **Housing**: rent, mortgage, apartment
- **Other**: default fallback

### Recurring Detection
- Group transactions by merchant (first 15 chars)
- Flag as recurring if 2+ transactions from same merchant
- Calculate average monthly recurring amount

## COLOR SYSTEM
- Generate unique HSL color per category
- Formula: hue = (index * 360 / totalCategories) % 360
- Keep saturation at 60%, lightness at 75%
- Store colors consistently across diagram and breakdown cards

## RESPONSIVE BREAKPOINTS
- Desktop (>768px): 4-column stats, wide margins, large fonts
- Tablet (480-768px): 2-column stats, medium margins
- Mobile (<480px): 1-column stats, compact layout

## INTERACTIONS
- All cards: hover lift (translateY -2px) + shadow
- Upload area: hover + dragover states
- Canvas: hover tooltips, cursor pointer on nodes
- Tooltip: fixed position, follows mouse, dark background, white text

## TECHNICAL REQUIREMENTS
- Use Tailwind CSS or shadcn/ui components
- Canvas rendering (NOT SVG or D3.js - this is critical)
- PapaParse for CSV parsing
- Inter font family
- Smooth animations (0.2s transitions)
- No console.log statements in production
- Debounced window resize handler

## CANVAS IMPLEMENTATION DETAILS
```javascript
// Key Canvas functions needed:
- ctx.scale(devicePixelRatio) for crisp rendering
- ctx.roundRect() for rounded rectangle nodes
- ctx.bezierCurveTo() for flowing curves
- ctx.fillText() with proper alignment
- Mouse event handling for interactivity
- Fill Bezier paths (not stroke) for smooth ribbons
```

Make it look professional, minimal, and highly interactive. The Sankey diagram should be smooth and beautiful with proper spacing to avoid text overlap.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://wherethefuckdidmymoneygo.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/414b3201-0f24-44af-8d4c-4ea31b01693a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
