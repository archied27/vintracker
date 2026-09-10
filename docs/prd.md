# Product Requirements Document: Vinted Reselling Tracker

## 1. Overview
A personal tool for tracking items bought for resale on Vinted (or similar marketplaces), following each item through its lifecycle: **Bought → Listed → Sold**. The app captures purchase cost (via screenshot or shared listing), lets the user mark items as listed with a price, and records final sale price to automatically calculate profit and other resale metrics.

## 2. Problem Statement
Resellers who buy items (thrifted, wholesale, or bought-to-flip) and list them on Vinted currently track this manually in notes/spreadsheets. This is error-prone and gives no quick view of what's in inventory, what's listed, what's sold, and whether the business is actually profitable once fees and time are accounted for.

## 3. Goals
- Make it fast (near-zero friction) to log a new item the moment it's bought.
- Give an at-a-glance status of every item: **Not Listed / Listed / Sold**.
- Automatically calculate profit, margin, and ROI per item and in aggregate.
- Surface useful patterns over time (best categories/brands, average days-to-sell, dead stock).

## 4. Non-Goals (v1)
- Not a full accounting/tax tool (though data should be exportable for one).
- Not a public marketplace or listing tool itself — it tracks state, it doesn't post listings to Vinted.
- Not multi-user / team inventory management initially — single-user tool.

## 5. Core User Flow

### 5.1 Buy stage
- User adds a new item by:
  - Uploading a screenshot of the item they bought (e.g. a Vinted listing, or a receipt), or
  - Pasting/sharing a Vinted listing URL
- App extracts (via parsing/OCR, see §7) or lets the user confirm:
  - Item name/title
  - Photo
  - Purchase price
  - Purchase date (defaults to today)
  - Source platform (Vinted, Depop, charity shop, etc. — optional tag)
  - Category/brand/size (optional, manually entered or parsed)
  - Season (`summer` | `winter` | `autumn` | `spring`)
- Item is created with status **Not Listed**.

### 5.2 List stage
- User opens the item and enters a **listing price**.
- Status changes to **Listed**, with a "date listed" timestamp.
- Optional: link to the live listing URL, platform fee %/estimate.
- User can edit the listing price at any time (price drops) — app can keep a small history of price changes.

### 5.3 Sell stage
- User marks the item as **Sold** and enters the **actual sale price** (may differ from listing price).
- User can optionally enter:
  - Shipping cost paid by seller (if any)
  - Platform/payment fees (auto-estimated from Vinted's fee structure, editable)
  - Sale date
- App computes:
  - **Profit** = sale price − buy price − fees − shipping cost paid by seller
  - **Margin %** = profit / sale price
  - **ROI %** = profit / buy price
  - **Days to sell** = sale date − list date
  - **Days held** = sale date − purchase date

## 6. Feature Requirements

### 6.1 MVP
| Feature | Description |
|---|---|
| Add item (buy) | Screenshot upload or listing URL, manual fallback fields |
| Item list/inventory view | Filterable by status (Not Listed / Listed / Sold), sortable by date, profit, etc. |
| Item detail view | All fields, editable, status transitions |
| Mark as listed | Enter listing price, sets status + timestamp |
| Mark as sold | Enter sale price (+ fees/shipping), sets status + timestamp, triggers profit calc |
| Dashboard | Total items, total spent, total revenue, total profit, items by status, average margin |
| Manual edit/delete | Fix mistakes, remove test items |

### 6.2 V2 / Nice-to-have
| Feature | Description |
|---|---|
| Screenshot auto-parsing | OCR + parsing to auto-fill item title/price from a Vinted screenshot |
| Listing URL scraping | Pull title, price, photo, brand/size automatically from a shared Vinted link |
| Fee auto-calculation | Built-in Vinted buyer/seller protection fee logic so profit is accurate without manual entry |
| Aging inventory alerts | Flag items listed >X days with no sale, suggest a price drop |
| Analytics/trends | Profit over time, best-performing categories/brands, sell-through rate, average days-to-sell |
| Multi-platform support | Track items also listed on Depop/eBay simultaneously (same item, multiple listings) |
| Export | CSV/spreadsheet export for accounting or tax purposes |
| Notifications | Reminder to list an item that's been sitting unlisted, or re-list a price-dropped item |
| Photo gallery per item | Multiple images per item (buy screenshot, listing photos, sold confirmation) |

## 7. Screenshot / Listing Import
Two import paths, both should converge on the same underlying "create item" flow with pre-filled fields the user can confirm/edit before saving:
- **Screenshot upload**: image sent to an OCR/vision step to extract visible text (item name, price). Given a photo of a Vinted listing screen, this is a reasonable use case for an LLM vision call rather than pure OCR + regex, since layouts vary.
- **Shared listing URL**: fetch the page (or ask the user to paste key details if scraping is blocked) and extract structured fields the same way.
- Either path should never block item creation — if parsing fails or is uncertain, fall back to a manual entry form with an empty/best-guess prefill.

## 8. Data Model (draft)

**Item**
- `id`
- `title`
- `photo_url(s)`
- `category`, `brand`, `size` (optional)
- `season` (`summer` | `winter` | `autumn` | `spring`)
- `source_platform` (e.g. Vinted, charity shop, wholesale)
- `buy_price`
- `buy_date`
- `status` (`not_listed` | `listed` | `sold`)
- `listing_price` (nullable)
- `listing_url` (nullable)
- `listed_date` (nullable)
- `sale_price` (nullable)
- `sold_date` (nullable)
- `fees` (nullable)
- `shipping_cost` (nullable)
- `profit` (computed)
- `margin_pct` (computed)
- `roi_pct` (computed)
- `notes` (free text)

**PriceHistory** (optional, for tracking listing price drops)
- `id`, `item_id`, `price`, `changed_at`

## 9. Dashboard / Analytics
- Summary cards: total invested, total revenue, total profit, number of items per status
- Table/grid of all items with quick status filter tabs (All / Not Listed / Listed / Sold)
- Simple charts: profit over time, profit by category/brand, average days-to-sell
- Sort/filter by profit, ROI, days held, status

## 10. Suggested Tech Stack
Given your existing stack for toto-v2 (React frontend, FastAPI backend, SQLite, TailwindCSS), the same combination fits well here and keeps everything consistent across your projects:
- **Frontend**: React + TypeScript + TailwindCSS — item cards/grid, add-item modal, dashboard charts (e.g. Recharts)
- **Backend**: FastAPI + Pydantic for models/validation
- **Database**: SQLite (single-user, low volume — no need for anything heavier)
- **Image storage**: local filesystem or object storage bucket, with a path/URL referenced from the Item row
- **OCR/parsing (V2)**: a vision-capable LLM call (e.g. via the Anthropic API) given the screenshot, prompted to return structured JSON (title, price, platform) — likely more robust than traditional OCR for varied Vinted UI screenshots
- **Scraping (V2)**: server-side fetch of the shared listing URL; note Vinted may rate-limit or block scraping, so a manual-confirm fallback is essential either way

## 11. Success Metrics
- Time to log a new bought item: under ~15 seconds
- 100% of sold items have an accurate profit calculation without manual math
- Dashboard gives an instant answer to "how much profit have I made this month/overall?"

## 12. Open Questions
- Should items ever be "relisted" after being marked not-sold/returned, and how should that affect history?
- Is fee calculation worth automating in v1, or is manual entry acceptable given Vinted's fee structure can change?
- Should there be support for bundles (multiple items bought/sold together)?
- Single currency assumed — is multi-currency needed?
