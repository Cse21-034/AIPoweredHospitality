# Design Guidelines: AI-Powered Hospitality PMS

## Design Approach

**Selected System:** Material Design 3  
**Rationale:** Enterprise-grade hotel management system requiring clear data hierarchy, extensive form handling, complex dashboards, and multi-module navigation. Material Design excels at information-dense applications with strong component consistency and accessibility.

**Key Principles:**
- Clarity over decoration - every element serves a function
- Predictable patterns - reduce cognitive load for daily operations
- Responsive data density - accommodate both quick glances and detailed analysis
- Progressive disclosure - complex features revealed when needed

---

## Typography

**Font Family:** Inter (primary), Roboto Mono (code/keys)

**Scale:**
- Display: 32px/40px (Bold) - Dashboard headers, property names
- H1: 24px/32px (Semibold) - Page titles
- H2: 20px/28px (Semibold) - Section headers, card titles  
- H3: 16px/24px (Medium) - Subsections, table headers
- Body: 14px/20px (Regular) - Primary content, form labels
- Small: 12px/16px (Regular) - Metadata, timestamps, helper text
- Mono: 13px/18px (Regular) - License keys, booking IDs

**Emphasis:** Use weight variation (Medium/Semibold/Bold) rather than size changes for hierarchy within sections.

---

## Layout System

**Spacing Units:** Tailwind scale - 2, 3, 4, 6, 8, 12, 16 (px-4, gap-6, py-8, etc.)

**Grid Structure:**
- Desktop: 12-column responsive grid (max-w-7xl containers)
- Dashboard cards: 2-4 columns (grid-cols-2 lg:grid-cols-4)
- Forms: Single column 600px max-width
- Tables: Full-width with horizontal scroll on mobile

**Key Measurements:**
- Sidebar: 240px fixed width (collapsed: 64px icon-only)
- Top bar: 64px height
- Card padding: p-6 (desktop), p-4 (mobile)
- Section spacing: mb-8 between major sections
- Form field spacing: space-y-4

---

## Component Library

### Navigation
**Sidebar Navigation (Primary):**
- Fixed left sidebar with grouped menu items
- Icons (24px) + labels for each module
- Collapsible groups for complex sections
- Active state: filled background, emphasized text
- Badge indicators for notifications/pending items

**Top Bar:**
- Property selector dropdown (left)
- Global search (center-left)
- Quick actions: Notifications, Room Service alerts (right)
- User profile menu (far right)
- License status indicator (icon + days remaining)

### Dashboard Components

**Stat Cards (4-column grid):**
- Large metric number (32px)
- Label below (12px)
- Trend indicator (↑↓ icon + percentage)
- Compact height: h-24

**Chart Containers:**
- Full-width sections with headers
- 400px height for primary charts (occupancy trends, revenue)
- Legend positioned top-right inline with title
- Grid lines minimal, labels clear

**Data Tables:**
- Sticky header row
- Alternating row treatment (subtle)
- Hover state for interactivity
- Action buttons right-aligned (icon buttons: 32px)
- Pagination bottom-right
- Filters/search top-left above table

### Forms

**Structure:**
- Labels above inputs (not floating)
- Helper text below fields (12px)
- Error messages inline below field
- Required fields marked with asterisk
- Multi-step forms: progress stepper at top

**Input Fields:**
- Height: h-10 (40px)
- Border radius: rounded-md
- Focus state: prominent border
- Disabled state: reduced opacity
- Date pickers: calendar overlay
- Dropdowns: searchable when >10 options

**Action Buttons:**
- Primary: Solid fill (Submit, Save, Book Now)
- Secondary: Outlined (Cancel, Back)
- Tertiary: Text only (Skip, Clear)
- Height: h-10 (same as inputs)
- Icon + text for complex actions
- Loading state: spinner replaces icon

### Cards & Panels

**Information Cards:**
- Rounded corners: rounded-lg
- Padding: p-6
- Subtle shadow/border
- Header section with title + optional actions
- Content sections with internal spacing

**Booking Cards:**
- Compact design with key info visible
- Guest name (16px Medium)
- Room number + type (14px)
- Dates + status badge
- Quick actions as icon buttons
- Expandable for full details

**Room Service Requests:**
- Priority indicator (High/Med/Low visual treatment)
- Room number prominent
- Item list with quantities
- Timestamp + status
- Assign staff dropdown inline

### Modals & Overlays

**Modal Dialogs:**
- Centered, max-w-2xl (large forms)
- Header with title + close (X) button
- Body: p-6
- Footer: Actions right-aligned, Cancel left
- Backdrop: semi-transparent overlay

**Slideovers:**
- Right-side panel for details/edits
- Width: w-96 (narrow) or w-[600px] (wide forms)
- Full height with internal scroll
- Close button top-right

### Calendar & Scheduling

**Availability Calendar:**
- Grid layout: 7 columns (days) × rows (rooms/weeks)
- Cell height: 80-100px for room-day combinations
- Visual states: Available, Booked, Checked-in, Maintenance, Blocked
- Hover preview: Guest name + booking ID
- Click: Open booking details modal
- Drag-to-book: Creating new reservations

### Status Indicators

**Badges:**
- Pill shape: rounded-full, px-3, py-1
- Text: 12px Semibold
- Usage: Booking status, License status, Request priority
- Semantic types: Success, Warning, Error, Info, Neutral

**License Status Banner:**
- Fixed top bar when trial/subscription expiring
- Days remaining + CTA button
- Dismissible (stores preference)

### AI Feature Presentation

**Forecast Panels:**
- Chart + insights side-by-side
- AI icon indicator for generated content
- Confidence levels shown (percentage)
- "Last updated" timestamp
- Refresh button for manual trigger

**Pricing Recommendations:**
- Current price vs. suggested price comparison
- Reasoning explanation in plain language
- Accept/Modify actions
- Impact projection (estimated revenue change)

---

## Responsive Strategy

**Breakpoints:**
- Mobile: < 768px (single column, stacked cards, hamburger nav)
- Tablet: 768-1024px (sidebar collapsible, 2-column grids)
- Desktop: > 1024px (full layout, 3-4 column grids)

**Mobile Adaptations:**
- Sidebar becomes bottom navigation (5 primary items)
- Tables: horizontal scroll or card view toggle
- Forms: full-width inputs
- Dashboard: single column stat cards
- Calendar: weekly view only

---

## Accessibility

- Focus indicators: 2px outline with offset
- ARIA labels on icon-only buttons
- Keyboard navigation: Tab order logical, Escape closes modals
- Screen reader announcements for status changes
- Minimum touch targets: 44×44px
- Form validation: Descriptive error messages

---

## Animation

**Use Sparingly:**
- Sidebar expand/collapse: 200ms ease
- Modal/slideover entry: 150ms slide + fade
- Dropdown menus: 100ms fade
- Success confirmations: Brief checkmark animation
- Loading states: Subtle spinner

**No animations for:** Data updates, table sorting, tab switches

---

## Images

**Property/Room Photos:**
- Aspect ratio: 16:9 for room cards
- Dimensions: 300×169px thumbnails, 800×450px detail view
- Placeholder: Geometric pattern with property initials

**User Avatars:**
- Circular: 32px (small), 40px (default), 80px (profile)
- Fallback: Initials on solid background

**No Hero Images:** This is a dashboard application, not a marketing site. Focus on data and functionality.