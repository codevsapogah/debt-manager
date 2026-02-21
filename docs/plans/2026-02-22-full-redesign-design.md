# Klaro Debt Manager - Full Redesign

**Date**: 2026-02-22
**Status**: Approved
**Approach**: Full UI/UX redesign with new features

## Goals

- Transform from generic-looking app to a bold, vibrant, distinctive financial product
- Declutter by spreading content across focused screens instead of cramming into tabs
- Add transaction history (most-requested feature)
- Switch to mobile-first bottom navigation
- Reduce Ant Design dependency for a more custom look

## Target Audience

Public product - designed to attract and retain users beyond personal use.

## Design Aesthetic

Bold & vibrant, inspired by Stripe and Mercury. Strong colors, confident typography, distinctive identity.

---

## Information Architecture

### 4-Screen Structure (Bottom Nav)

| Screen | Icon | Purpose |
|--------|------|---------|
| **Home** | House | Financial snapshot, cash flow, debt projections |
| **Debts** | CreditCard | Debt list, add/edit, tap for detail view |
| **Activity** | Clock | Transaction history feed across all debts |
| **Settings** | Gear | Theme, language, currency, export, account |

### Navigation Behavior

- Bottom nav bar, fixed, 64px tall, 4 icons with labels
- Active tab: filled icon + accent color
- Desktop (>768px): Bottom nav becomes slim left sidebar (~72px wide)
- Smooth page transitions between screens

### Debt Detail Page (sub-page of Debts)

Tapping a debt card opens a dedicated detail view with:
- Circular progress ring (% paid off)
- Remaining balance, original amount, interest rate, monthly payment
- Mini payoff projection chart
- Transaction history for this specific debt
- Action buttons: Log Payment, Edit, Mark Paid, Delete

---

## Visual Design System

### Color Palette - "Bold Finance"

**Primary Colors:**
- Deep Navy: `#0A1628` - backgrounds, depth
- Electric Blue: `#2563EB` - primary actions, links, active states
- Bright Coral: `#FF6154` - accents, warnings, attention
- Mint Green: `#10B981` - success, positive amounts, paid off

**Neutral Scale:**
- White `#FFFFFF` through grays to `#0F172A`

**Gradients:**
- Hero cards: Electric Blue to lighter blue
- Progress bars: Vibrant gradient fills

### Typography

- **All text**: Inter font family
- Headlines: Inter Bold/Black
- Body: Inter Regular/Medium
- Numbers: Inter with tabular figures (monospaced digits)

### Component Style

- Cards: White surfaces, subtle shadow, 12-16px border radius, no borders
- Buttons: Solid fills (primary), ghost/outline (secondary), pill-shaped
- Inputs: Clean outlines, 48px min height touch targets
- Tags/Badges: Rounded pills with colored backgrounds
- Icons: Lucide icons (consistent modern line style)

### Light/Dark Mode

- Light (default): White backgrounds, navy text, blue accents
- Dark: Deep navy backgrounds, white text, brighter accent colors
- Stored in localStorage, smooth transitions

---

## Screen Designs

### Home Screen (top to bottom)

1. **Header Bar** (sticky)
   - Left: "Klaro" wordmark
   - Right: User avatar (tap for dropdown)

2. **Hero Card** (full-width, gradient)
   - Large number: Total remaining debt
   - Subtitle: "across N active debts"
   - Trend indicator: % change vs last month
   - Mini sparkline: debt reduction over last 6 months

3. **Quick Actions Row** (horizontal scroll on mobile)
   - "+ Log Payment" (primary)
   - "+ Add Debt" (secondary)
   - "View Projections" (ghost)

4. **Cash Flow Summary Card**
   - Two-column: Monthly Income (green) | Monthly Expenses (coral)
   - Net cash flow bar (green if positive, coral if negative)
   - Tap to expand breakdown of sources/categories

5. **Debt-Free Timeline**
   - Interactive line chart: total remaining debt over time
   - Strategy selector pills: Standard | Snowball | Avalanche
   - Projected debt-free date displayed prominently
   - Tap for full-screen detailed view

6. **Next Payments Due**
   - 2-3 nearest payment deadlines
   - Debt name, amount due, days until due
   - Tap to go to debt detail page

7. **Monthly Progress**
   - Horizontal progress bar
   - Motivational text based on progress

### Debts List Screen

- Header: "My Debts" + filter/sort icon + "+ Add" button
- Filter pills: All | Active | Paid Off
- Debt cards (stacked):
  - Colored dot (interest rate severity)
  - Debt name (bold) + lender/category (muted)
  - Remaining balance (large) + monthly payment (small)
  - Thin progress bar (% paid off)
  - Tap to open Debt Detail
- Paid-off debts: greyed out with checkmark, sorted to bottom
- Bulk actions via long-press / checkbox mode

### Activity Screen (Transaction History)

- Header: "Activity" + date range filter
- Quick filters: This Month | Last 30 Days | All Time | Custom
- Debt filter: dropdown to filter by specific debt
- Transactions grouped by date:
  - Debt name with colored dot
  - Amount paid (coral)
  - Running balance after payment
  - Tap to go to debt detail
- FAB: "+ Log Payment" (choose debt, amount, date)
- Auto-logged transactions tagged with "recurring" badge
- Empty state: encouraging message + CTA

### Settings Screen

- Appearance: Light/Dark mode toggle
- Language: English / Russian
- Currency: Tenge / USD / EUR (new feature)
- Export Data: CSV / JSON
- Account: Google info, sign out
- About: Version, credits

### Login Screen

- Full-screen gradient (deep navy to electric blue)
- App logo centered
- Tagline: "Take control of your debt"
- "Sign in with Google" button (white, pill-shaped)
- 3 benefit icons with text below

---

## New Features

### 1. Transaction History

**Data Model:**
```typescript
interface Transaction {
  id: string;
  debtId: string;
  amount: number;
  date: Date;
  type: 'manual' | 'recurring';
  note?: string;
  balanceAfter: number;
}
```

**Firestore Path:** `users/{userId}/transactions/{transactionId}`

**Behavior:**
- Logging a payment creates a transaction and reduces debt's `currentAmount`
- Two entry points: debt detail page and Activity screen FAB
- Pre-fills amount with monthly payment, date with today
- Supports editing and deleting transactions (recalculates balance)

### 2. Recurring Payment Auto-Logging

**How it works:**
- Toggle on debt form: "Auto-log payments"
- Set day of month (e.g., 15th)
- Amount defaults to monthly payment (customizable)
- Client-side check on app load: if any auto-logs are overdue, create them
- Tagged as "recurring" in Activity feed
- Users can edit/delete auto-logged transactions

**Data Model addition to Debt:**
```typescript
{
  autoLog: boolean;
  autoLogDay: number;      // 1-28
  autoLogAmount?: number;  // defaults to monthlyPayment
  lastAutoLogDate?: Date;  // tracks last auto-log to prevent duplicates
}
```

### 3. Currency Selection

- Support for KZT (Tenge), USD, EUR
- Stored in user preferences
- Affects all displayed amounts
- No conversion - just display symbol/format

---

## Ant Design Reduction Strategy

**Keep (hard to build custom):**
- Modal
- DatePicker
- Select/Dropdown

**Replace with custom components:**
- Table -> Card-based list
- Button -> Custom pill buttons
- Input -> Custom styled inputs
- Checkbox -> Custom checkboxes
- Tags -> Custom badge pills

---

## Micro-Interactions

- Number animations: Amounts count up/down on change
- Card transitions: Smooth slide between screens
- Payment logged: Confetti/celebration micro-animation
- Debt paid off: Special celebration + badge
- Skeleton loading: Gray placeholders while data loads (replaces spinner)
- Pull-to-refresh gesture on mobile

---

## Technical Decisions

- Keep React 19 + TypeScript + Firebase stack
- Keep existing calculation engine (utils/calculations.ts)
- Keep i18n system (add new keys for new screens)
- Replace tab-based nav with React Router for proper URL routing
- Add Framer Motion for page transitions and animations
- Add Lucide React for icons
- Keep Tailwind CSS 4, reduce custom CSS
- Keep Recharts for data visualization
