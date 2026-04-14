# MediConnect – Patient Dashboard Design Report
### Page: `/patient/dashboard` · Next.js 14 · Tailwind CSS · shadcn/ui

> Role: Patient  
> Type: Protected Page (Auth Required)  
> Rendering: Server Component (initial data) + Client Components (interactivity)

---

## 1. Page Purpose

The Patient Dashboard is the first screen a patient sees after logging in. It serves as the **command center** of the patient's experience. Its job is to answer three questions instantly:

- Do I have any upcoming appointments?
- Is there anything I need to act on right now?
- Where do I go to do what I need to do?

The dashboard must feel personal, calm, and actionable — not overwhelming. It should load fast, show real data immediately, and give the patient confidence that they are in the right place.

---

## 2. Page Layout Structure

The page uses the **Patient Sidebar Layout** established in `(patient)/layout.tsx`. The dashboard occupies the main content area to the right of the sidebar.

```
┌─────────────────────────────────────────────────────────────┐
│  TOP HEADER BAR                                             │
│  [Logo]  [Role: Patient]    [🔔 3]  [Avatar ▾]             │
├──────────────┬──────────────────────────────────────────────┤
│              │  DASHBOARD CONTENT AREA                      │
│   SIDEBAR    │  ┌─────────────────────────────────────────┐ │
│              │  │  Welcome Banner                         │ │
│  Dashboard   │  └─────────────────────────────────────────┘ │
│  Doctors     │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  Appts       │  │  Stat 1  │ │  Stat 2  │ │  Stat 3  │     │
│  Records     │  └──────────┘ └──────────┘ └──────────┘     │
│  Reviews     │  ┌──────────────────────┐ ┌───────────────┐  │
│  Notifs      │  │  Upcoming            │ │  Quick        │  │
│  Profile     │  │  Appointments        │ │  Actions      │  │
│  Logout      │  │                      │ │               │  │
│              │  │                      │ └───────────────┘  │
│              │  │                      │ ┌───────────────┐  │
│              │  │                      │ │  Recent       │  │
│              │  │                      │ │  Notifications│  │
│              │  └──────────────────────┘ └───────────────┘  │
└──────────────┴──────────────────────────────────────────────┘
```

---

## 3. Dashboard Sections (Top to Bottom)

### Section 1 — Welcome Banner

**Purpose:** Greet the patient by name and set the tone of the page.

**Content:**
- Personalized greeting with first name — "Good morning, Aryan"
- Dynamic time-based greeting (morning / afternoon / evening) based on current hour
- Subtitle line showing today's date — "Tuesday, 14 April 2026"
- If patient has an appointment today, show a highlighted notice — "You have an appointment today at 3:00 PM with Dr. Mehta"
- If no appointment today, show a soft prompt — "No appointments scheduled for today"

**Design notes:**
- Full-width card with a subtle blue tint background
- Patient avatar or initials on the right side (decorative, not a button)
- Text is left-aligned, avatar is right-aligned
- No action buttons in this section — it is purely informational

**Data source:** `GET /auth/me` (user name) + `GET /appointments/upcoming` (today's appointment check)

**Rendering:** Server Component — data fetched server-side on page load

---

### Section 2 — Summary Stats Cards

**Purpose:** Give the patient a quick numeric overview of their activity on the platform.

**3 stat cards displayed in a responsive row:**

| Card | Label | Value Source | API |
|------|-------|-------------|-----|
| 1 | Total Appointments | Count of all appointments ever | `GET /appointments/my` |
| 2 | Upcoming Appointments | Count of approved future appointments | `GET /appointments/upcoming` |
| 3 | Pending Requests | Count of appointments with status = pending | `GET /appointments/my?status=pending` |

**Design notes:**
- 3-column grid on desktop, 1-column stack on mobile
- Each card has a muted label on top (12px) and a large number below (32px, semibold)
- Each card has a colored left border accent matching the meaning: blue for total, green for upcoming, amber for pending
- Cards use a light surface background (`bg-slate-50` or similar), no heavy borders
- Numbers animate from 0 to their value on page load (count-up animation, Client Component)

**Rendering:** Server Component for data fetch. The count-up animation is a Client Component that receives the number as a prop.

---

### Section 3 — Upcoming Appointments (Main Panel)

**Purpose:** Show the patient their next scheduled appointments in a clear, scannable list.

**Layout:** Left column (approximately 60% width on desktop, 100% on mobile)

**Content:**
- Section heading: "Upcoming Appointments" with a "View All →" link to `/patient/appointments`
- List of next 3–5 upcoming appointments sorted by date ascending
- Empty state if no upcoming appointments: illustration + message "No upcoming appointments. Book one now." with a Book Appointment button

**Each appointment card in the list shows:**

| Field | Display |
|-------|---------|
| Doctor name | "Dr. Priya Mehta" |
| Doctor specialization | "Cardiologist" |
| Doctor avatar / initials | Small circular avatar, left side |
| Appointment date | "Wednesday, 16 April 2026" |
| Appointment time | "3:00 PM – 3:30 PM" |
| Appointment status | Color-coded badge (Pending / Approved / Completed) |
| Reason for visit | Truncated to 1 line, e.g., "Chest pain follow-up" |
| Action buttons | "View Details" → `/patient/appointments/[id]` |
| Cancel button | Only shown if status is Pending or Approved, opens ConfirmDialog |

**Status badge colors:**
- Pending → Amber background, amber text
- Approved → Green background, green text
- Rejected → Red background, red text
- Completed → Gray background, gray text
- Cancelled → Red/muted background, muted text

**Design notes:**
- Cards are stacked vertically with 12px gap
- Each card has a white background, 1px border, rounded corners (12px), and 16px padding
- Doctor avatar is 40×40px circle on the left
- Date and time are displayed prominently in dark text
- Status badge is positioned top-right of the card
- Hover state lifts the card slightly (subtle box-shadow transition)
- "View Details" is a ghost button on the right side of the card footer

**Rendering:** Server Component — appointments fetched server-side. Cancel action is a Client Component (opens ConfirmDialog, calls API, revalidates path).

**API:** `GET /appointments/my?status=upcoming&limit=5`

---

### Section 4 — Quick Actions Panel

**Purpose:** Give the patient direct shortcuts to the most common tasks without navigating through the sidebar.

**Layout:** Right column, top card (approximately 38% width on desktop, full-width card below appointments on mobile)

**Content:** 4 action buttons arranged in a 2×2 grid

| Button | Label | Icon | Destination |
|--------|-------|------|-------------|
| 1 | Book Appointment | Calendar + icon | `/patient/doctors` |
| 2 | View Medical Records | File icon | `/patient/records` |
| 3 | Update Profile | Person icon | `/patient/profile` |
| 4 | View All Appointments | List icon | `/patient/appointments` |

**Design notes:**
- Each button is a large clickable card (not a small inline button)
- Icon is displayed above the label text, centered
- Subtle hover state — background shifts to light blue tint, border changes color
- Cards are 2×2 grid with equal sizing
- Section heading: "Quick Actions"
- This section is a pure navigation aid — no API calls needed

**Rendering:** Server Component (no interactivity needed, just links)

---

### Section 5 — Recent Notifications Panel

**Purpose:** Surface the 3 most recent unread notifications so the patient does not miss anything important without needing to visit the full notifications page.

**Layout:** Right column, bottom card (below Quick Actions)

**Content:**
- Section heading: "Notifications" with a "View All →" link to `/patient/notifications`
- List of 3 most recent notifications
- Empty state: "You're all caught up!" with a checkmark icon

**Each notification item shows:**

| Field | Display |
|-------|---------|
| Type icon | Small colored icon: green check (approved), red X (rejected), blue calendar (booked), bell (general) |
| Message | Full notification message, truncated to 2 lines |
| Time | Relative time — "2 hours ago", "Yesterday", "3 days ago" |
| Read status | Unread notifications have a blue dot indicator on the left |
| Mark as read | Clicking the notification marks it as read and removes the blue dot |

**Design notes:**
- Notifications are separated by a thin divider line
- Unread notifications have a very subtle blue-tinted background
- Clicking a notification marks it as read and, if relevant, navigates to the related appointment
- The notification bell in the TopHeader updates its unread count badge after marking as read

**Rendering:** Server Component for initial fetch. Mark-as-read is a Client Component action.

**API:** `GET /notifications?limit=3&unread=true`

---

## 4. Complete Component Tree

```
PatientDashboardPage (Server Component)
│
├── WelcomeBanner (Server Component)
│   └── receives: { user, todayAppointment }
│
├── StatCardsRow (Server Component)
│   ├── StatCard — Total Appointments (Client Component for count-up)
│   ├── StatCard — Upcoming Appointments (Client Component for count-up)
│   └── StatCard — Pending Requests (Client Component for count-up)
│
├── DashboardGrid (layout div — two columns)
│   │
│   ├── UpcomingAppointmentsPanel (Server Component)
│   │   ├── SectionHeader — "Upcoming Appointments" + View All link
│   │   ├── AppointmentCard × N (Server Component)
│   │   │   └── CancelAppointmentButton (Client Component)
│   │   │       └── ConfirmDialog (Client Component)
│   │   └── EmptyState (Server Component, conditional)
│   │
│   └── RightColumn (layout div)
│       ├── QuickActionsPanel (Server Component)
│       │   └── QuickActionCard × 4 (Server Component — just links)
│       │
│       └── RecentNotificationsPanel (Server Component)
│           ├── SectionHeader — "Notifications" + View All link
│           ├── NotificationItem × 3 (Client Component — mark as read)
│           └── EmptyState (Server Component, conditional)
```

---

## 5. API Calls on Page Load

All data for the dashboard is fetched server-side in the page's Server Component using parallel fetching (Promise.all) so all requests fire simultaneously and the page waits for all of them together, not sequentially.

| # | API Call | Data Used In |
|---|----------|-------------|
| 1 | `GET /auth/me` | Welcome Banner (name, avatar) |
| 2 | `GET /appointments/my?limit=5&status=upcoming` | Upcoming Appointments panel + Stat card |
| 3 | `GET /appointments/my?status=pending&limit=1` | Pending stat card count |
| 4 | `GET /appointments/my?limit=1` | Total appointments stat count |
| 5 | `GET /notifications?limit=3` | Recent Notifications panel |

**Total API calls on load:** 5 (fired in parallel — adds no sequential wait time)

---

## 6. Loading States

Since this is a Server Component page, Next.js streams the content progressively using `loading.tsx` and Suspense boundaries.

**Loading strategy per section:**

| Section | Loading State |
|---------|--------------|
| Welcome Banner | Skeleton: full-width rectangle, 80px tall |
| Stat Cards | 3 skeleton rectangles in a row, 100px tall each |
| Upcoming Appointments | 3 skeleton appointment cards (avatar circle + 3 lines of text each) |
| Quick Actions | 4 skeleton squares in 2×2 grid |
| Recent Notifications | 3 skeleton rows with circle icon + 2 lines of text |

**Skeleton design:** All skeletons use a subtle shimmer animation (CSS `animate-pulse`) in the same dimensions as the real content. This prevents layout shift when data loads.

---

## 7. Empty States

Each section has a specific empty state for when the data returns no results.

| Section | Empty State Message | CTA |
|---------|--------------------|----|
| Upcoming Appointments | "No upcoming appointments scheduled" | "Book Appointment" button → `/patient/doctors` |
| Recent Notifications | "You're all caught up! No new notifications." | No CTA needed |
| Stat Cards | All show "0" — no empty state needed, zeros are valid values | — |

**Empty state design:**
- Small centered illustration (SVG icon, not a heavy image)
- Message text in muted gray, 14px
- CTA button below the message (only when applicable)
- Empty states have the same card background as the filled version — no layout shift

---

## 8. Responsive Design Breakdown

| Breakpoint | Layout Behavior |
|-----------|----------------|
| Mobile (< 640px) | Single column. Sidebar collapses to bottom nav bar. All panels stack vertically: Welcome → Stats → Quick Actions → Upcoming Appointments → Notifications |
| Tablet (640px – 1024px) | Single column for content. Stats in 3-column row. Sidebar is icon-only (collapsed). Quick Actions and Notifications stack below Appointments |
| Desktop (> 1024px) | Two-column content grid. Left (60%): Upcoming Appointments. Right (40%): Quick Actions + Notifications stacked. Full sidebar visible |

**Tailwind grid classes used:**
- Stats row: `grid grid-cols-1 sm:grid-cols-3 gap-4`
- Main content: `grid grid-cols-1 lg:grid-cols-5 gap-6`
- Left panel: `lg:col-span-3`
- Right column: `lg:col-span-2`
- Quick Actions grid: `grid grid-cols-2 gap-3`

---

## 9. Interactivity Summary

| Interaction | Type | Behavior |
|-------------|------|----------|
| Cancel appointment | Client Component | Opens ConfirmDialog → on confirm, calls `PUT /appointments/:id/cancel` → shows success toast → calls `revalidatePath('/patient/dashboard')` |
| Mark notification as read | Client Component | Calls `PUT /notifications/:id/read` → removes blue dot → updates unread badge in TopHeader |
| Count-up animation on stat cards | Client Component | Animates from 0 to value on mount using requestAnimationFrame |
| Appointment card hover | CSS only | `hover:shadow-md transition-shadow duration-200` |
| Quick action card hover | CSS only | `hover:bg-blue-50 hover:border-blue-300 transition-colors` |
| View All links | Next.js Link | Client-side navigation, no full page reload |

---

## 10. TypeScript Types for Dashboard Data

The following data shapes are used on the dashboard page. These are defined in `types/` and used in both the API functions and the components.

**User (from /auth/me)**
- id, firstName, lastName, email, role, phone, profilePhoto, createdAt

**Appointment (from /appointments/my)**
- id, doctorId, doctorName, doctorSpecialization, doctorPhoto, date, timeSlot, status, reasonForVisit, doctorNotes, createdAt

**Notification (from /notifications)**
- id, message, type (success / error / info), isRead, createdAt, relatedEntityId (optional)

**DashboardStats (computed from API responses)**
- totalAppointments (number)
- upcomingAppointments (number)
- pendingRequests (number)
- todayAppointment (Appointment or null)

---

## 11. Page Metadata

Defined in the page's `generateMetadata` export for SEO and browser tab display.

- **Title:** "Dashboard — MediConnect"
- **Description:** "View your upcoming appointments, medical records, and activity on MediConnect."
- **robots:** "noindex, nofollow" — dashboard pages must not be indexed by search engines (private content)

---

## 12. Error Handling on Dashboard

| Scenario | Behavior |
|----------|---------|
| One API call fails (e.g., appointments) | That section shows an error card: "Could not load appointments. Try refreshing." Other sections load normally (independent Suspense boundaries) |
| All API calls fail (network down) | Full-page error boundary catches it and shows a generic "Something went wrong" with a Refresh button |
| Session expired (401 from any call) | `fetchWithAuth()` attempts token refresh. If refresh also fails, middleware redirects to `/auth/login` |
| Appointment cancel fails | ConfirmDialog closes, error toast shown: "Could not cancel appointment. Please try again." Appointment list is not changed |
| Mark notification as read fails | Silent failure — the UI optimistically updates (dot removed), no toast needed for this low-stakes action |

---

## 13. File Structure for Dashboard

All files related to the Patient Dashboard live in the following locations:

```
src/
  app/
    (patient)/
      dashboard/
        page.tsx              — Main Server Component page
        loading.tsx           — Skeleton loading UI (Suspense fallback)
        error.tsx             — Error boundary for dashboard failures

  components/
    features/
      patient/
        dashboard/
          WelcomeBanner.tsx
          StatCardsRow.tsx
          StatCard.tsx
          UpcomingAppointmentsPanel.tsx
          AppointmentCard.tsx
          CancelAppointmentButton.tsx
          QuickActionsPanel.tsx
          QuickActionCard.tsx
          RecentNotificationsPanel.tsx
          NotificationItem.tsx

  lib/
    api/
      appointments.ts         — getUpcomingAppointments(), cancelAppointment()
      notifications.ts        — getNotifications(), markAsRead()
      auth.ts                 — getCurrentUser()

  types/
    appointment.ts
    notification.ts
    user.ts
```

---

## 14. Design Tokens for Dashboard

All visual values are defined as Tailwind config tokens or CSS variables, not hardcoded inline values.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#1D6AE5` (blue-600) | Buttons, active nav, links |
| `--color-success` | `#16A34A` (green-600) | Approved badge, success toast |
| `--color-warning` | `#D97706` (amber-600) | Pending badge, warning notice |
| `--color-danger` | `#DC2626` (red-600) | Rejected badge, error toast, cancel button |
| `--color-surface` | `#F8FAFC` (slate-50) | Stat card backgrounds |
| `--color-card` | `#FFFFFF` | Appointment and notification card backgrounds |
| `--color-border` | `#E2E8F0` (slate-200) | All card borders |
| `--color-text-primary` | `#0F172A` (slate-900) | Headings, labels |
| `--color-text-secondary` | `#64748B` (slate-500) | Subtitles, timestamps, muted text |
| `--radius-card` | `12px` | All card border-radius values |

---

## 15. Summary Checklist

Before the dashboard is considered complete, all of the following must be working:

- Welcome banner shows correct patient name and today's date
- Time-based greeting changes based on current hour
- Today's appointment notice appears if applicable
- All 3 stat cards show correct counts
- Count-up animation plays on first load
- Upcoming appointments list loads correctly with correct status badges
- Empty state shows when no upcoming appointments exist
- Cancel appointment opens ConfirmDialog, cancels on confirm, shows toast, and refreshes list
- Quick Actions 4 buttons all navigate to the correct pages
- Recent Notifications load with correct read/unread state
- Mark as read works and updates the header notification badge
- Skeleton loading state shows before data arrives
- Page is fully responsive at mobile, tablet, and desktop breakpoints
- 401 error triggers silent token refresh or redirects to login
- Section-level errors show graceful error cards without breaking the whole page
- Page metadata is set correctly with noindex

---

## Quick Reference Card

| Item | Value |
|------|-------|
| Route | `/patient/dashboard` |
| Layout | Patient Sidebar Layout |
| Rendering | Server Component + selective Client Components |
| API Calls (parallel) | 5 on load |
| Total Sections | 5 (Welcome, Stats, Upcoming, Quick Actions, Notifications) |
| Total Components | 13 components |
| Responsive | Mobile, Tablet, Desktop |
| Auth Required | Yes (Patient role only) |
| SEO Indexed | No (noindex) |
