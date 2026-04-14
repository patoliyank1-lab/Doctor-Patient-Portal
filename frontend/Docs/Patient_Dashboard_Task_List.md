# MediConnect – Patient Dashboard Task List
### Page: `/patient/dashboard` · Next.js 14 · Tailwind CSS · shadcn/ui

> Total Parts: 6  
> Total Tasks: 28  
> Priority: High (🔴) · Medium (🟡) · Low (🟢)

---

## Part 1 — Project Setup & Layout Foundation
> Set up the base structure before building any dashboard section.

| Task ID | Priority | Task | Details |
|---------|----------|------|---------|
| DB-01 | 🔴 High | Create patient route group and layout file | Create `app/patient/layout.tsx` with sidebar + top header shell |
| DB-02 | 🔴 High | Build Sidebar component | Role-aware nav links, active route highlight, logout button — Client Component |
| DB-03 | 🔴 High | Build TopHeader component | App logo, notification bell with badge count, user avatar dropdown — Client Component |
| DB-04 | 🟡 Medium | Build PageContainer component | Reusable page wrapper with title, subtitle, and action slot — Server Component |

---

## Part 2 — API Layer & Types
> Set up all data fetching functions and TypeScript types needed for the dashboard.

| Task ID | Priority | Task | Details |
|---------|----------|------|---------|
| DB-05 | 🔴 High | Create `fetchWithAuth()` utility | Shared fetch wrapper with cookie credentials, 401 retry, and refresh token logic |
| DB-06 | 🔴 High | Create `lib/api/auth.ts` | `getCurrentUser()` function — calls `GET /auth/me` |
| DB-07 | 🔴 High | Create `lib/api/appointments.ts` | `getUpcomingAppointments()`, `getPendingCount()`, `getTotalCount()`, `cancelAppointment()` |
| DB-08 | 🟡 Medium | Create `lib/api/notifications.ts` | `getRecentNotifications()`, `markNotificationAsRead()` |
| DB-09 | 🟡 Medium | Define TypeScript types | Create `types/user.ts`, `types/appointment.ts`, `types/notification.ts` with all field definitions |

---

## Part 3 — Dashboard Page & Skeleton Loading
> Build the main page file and all loading skeleton states before adding real data.

| Task ID | Priority | Task | Details |
|---------|----------|------|---------|
| DB-10 | 🔴 High | Create dashboard page file | Create `app/patient/dashboard/page.tsx` as Server Component — fetch all 5 APIs in parallel using `Promise.all()` |
| DB-11 | 🔴 High | Create `loading.tsx` skeleton | Full-page skeleton with shimmer animation for all 5 sections — shown by Next.js Suspense while data loads |
| DB-12 | 🟡 Medium | Create `error.tsx` boundary | Catches page-level data fetch failures — shows a friendly error card with a Refresh button |

---

## Part 4 — Dashboard Sections (UI Components)
> Build each visible section of the dashboard one by one.

### Section 1 — Welcome Banner

| Task ID | Priority | Task | Details |
|---------|----------|------|---------|
| DB-13 | 🟡 Medium | Build `WelcomeBanner` component | Shows patient first name, time-based greeting (morning/afternoon/evening), today's date, and today's appointment notice if any — Server Component |

---

### Section 2 — Summary Stat Cards

| Task ID | Priority | Task | Details |
|---------|----------|------|---------|
| DB-14 | 🟡 Medium | Build `StatCard` component | Displays a single metric — label, large number, colored left border accent |
| DB-15 | 🟢 Low | Add count-up animation to `StatCard` | Client Component wrapper that animates number from 0 to value on mount using `requestAnimationFrame` |
| DB-16 | 🟡 Medium | Build `StatCardsRow` component | Renders 3 `StatCard` components in a responsive grid — Total Appointments, Upcoming, Pending |

---

### Section 3 — Upcoming Appointments Panel

| Task ID | Priority | Task | Details |
|---------|----------|------|---------|
| DB-17 | 🔴 High | Build `AppointmentCard` component | Shows doctor avatar, name, specialization, date, time, status badge, reason for visit, and View Details link — Server Component |
| DB-18 | 🔴 High | Build `AppointmentStatusBadge` component | Color-coded pill badge — Pending (amber), Approved (green), Rejected (red), Completed (gray), Cancelled (muted red) |
| DB-19 | 🔴 High | Build `CancelAppointmentButton` component | Client Component — opens `ConfirmDialog` on click, calls `PUT /appointments/:id/cancel`, shows toast, calls `revalidatePath()` |
| DB-20 | 🟡 Medium | Build `UpcomingAppointmentsPanel` component | Section heading with View All link, maps over appointments to render `AppointmentCard` list — Server Component |
| DB-21 | 🟡 Medium | Build `EmptyState` component | Reusable empty state with SVG icon, message text, and optional CTA button |

---

### Section 4 — Quick Actions Panel

| Task ID | Priority | Task | Details |
|---------|----------|------|---------|
| DB-22 | 🟢 Low | Build `QuickActionCard` component | Large clickable card with icon above label, hover effect — wraps a Next.js `<Link>` — Server Component |
| DB-23 | 🟢 Low | Build `QuickActionsPanel` component | 2×2 grid of 4 `QuickActionCard` components — Book Appointment, Medical Records, Update Profile, View All Appointments |

---

### Section 5 — Recent Notifications Panel

| Task ID | Priority | Task | Details |
|---------|----------|------|---------|
| DB-24 | 🟡 Medium | Build `NotificationItem` component | Shows type icon, message (truncated to 2 lines), relative timestamp, unread blue dot indicator — Client Component (mark as read on click) |
| DB-25 | 🟡 Medium | Build `RecentNotificationsPanel` component | Section heading with View All link, lists 3 most recent notifications, empty state if none — Server Component |

---

## Part 5 — Interactivity & State
> Wire up all client-side actions, revalidation, and global state updates.

| Task ID | Priority | Task | Details |
|---------|----------|------|---------|
| DB-26 | 🔴 High | Wire cancel appointment flow end-to-end | `CancelAppointmentButton` → `ConfirmDialog` → `cancelAppointment()` API → success toast → `revalidatePath('/patient/dashboard')` |
| DB-27 | 🔴 High | Wire mark notification as read | `NotificationItem` click → `markNotificationAsRead()` API → optimistic UI update (remove blue dot) → update unread badge count in `TopHeader` |

---

## Part 6 — Responsive Design & QA
> Make the page fully responsive and verify everything works correctly.

| Task ID | Priority | Task | Details |
|---------|----------|------|---------|
| DB-28 | 🟡 Medium | Apply responsive layout | Mobile: single column stack. Tablet: sidebar icon-only. Desktop: two-column content grid (60/40 split). Use Tailwind `grid-cols-1 lg:grid-cols-5` |

---

## Build Order (Recommended Sequence)

```
DB-05 → DB-06 → DB-07 → DB-08 → DB-09   (API layer first)
     ↓
DB-01 → DB-02 → DB-03 → DB-04           (Layout shell)
     ↓
DB-10 → DB-11 → DB-12                   (Page + loading + error)
     ↓
DB-13                                    (Welcome Banner)
DB-14 → DB-15 → DB-16                   (Stat Cards)
DB-21 → DB-18 → DB-17 → DB-19 → DB-20  (Appointments Panel)
DB-22 → DB-23                           (Quick Actions)
DB-24 → DB-25                           (Notifications Panel)
     ↓
DB-26 → DB-27                           (Interactivity)
     ↓
DB-28                                    (Responsive QA)
```

---

## File Checklist

After all tasks are done, the following files must exist:

### App Router
- [ ] `app/patient/layout.tsx`
- [ ] `app/patient/dashboard/page.tsx`
- [ ] `app/patient/dashboard/loading.tsx`
- [ ] `app/patient/dashboard/error.tsx`

### Components
- [ ] `components/layout/Sidebar.tsx`
- [ ] `components/layout/TopHeader.tsx`
- [ ] `components/layout/PageContainer.tsx`
- [ ] `components/features/patient/dashboard/WelcomeBanner.tsx`
- [ ] `components/features/patient/dashboard/StatCard.tsx`
- [ ] `components/features/patient/dashboard/StatCardsRow.tsx`
- [ ] `components/features/patient/dashboard/AppointmentCard.tsx`
- [ ] `components/features/patient/dashboard/AppointmentStatusBadge.tsx`
- [ ] `components/features/patient/dashboard/CancelAppointmentButton.tsx`
- [ ] `components/features/patient/dashboard/UpcomingAppointmentsPanel.tsx`
- [ ] `components/features/patient/dashboard/EmptyState.tsx`
- [ ] `components/features/patient/dashboard/QuickActionCard.tsx`
- [ ] `components/features/patient/dashboard/QuickActionsPanel.tsx`
- [ ] `components/features/patient/dashboard/NotificationItem.tsx`
- [ ] `components/features/patient/dashboard/RecentNotificationsPanel.tsx`

### API & Types
- [ ] `lib/fetch-with-auth.ts`
- [ ] `lib/api/auth.ts`
- [ ] `lib/api/appointments.ts`
- [ ] `lib/api/notifications.ts`
- [ ] `types/user.ts`
- [ ] `types/appointment.ts`
- [ ] `types/notification.ts`

---

## Task Count Summary

| Part | Description | Tasks | Status |
|------|-------------|-------|--------|
| Part 1 | Project Setup & Layout Foundation | 4 | ⬜ Not started |
| Part 2 | API Layer & Types | 5 | ⬜ Not started |
| Part 3 | Dashboard Page & Skeleton Loading | 3 | ⬜ Not started |
| Part 4 | Dashboard Sections (UI Components) | 13 | ⬜ Not started |
| Part 5 | Interactivity & State | 2 | ⬜ Not started |
| Part 6 | Responsive Design & QA | 1 | ⬜ Not started |
| **Total** | | **28** | |
