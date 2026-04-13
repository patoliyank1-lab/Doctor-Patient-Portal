# MediConnect Frontend — Full Implementation Plan

> **Author:** Frontend Implementation Plan  
> **Date:** April 2026  
> **Backend:** Express + Bun + Prisma + PostgreSQL (running at `http://localhost:5000/api/v1`)  
> **Frontend Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Zustand · React Hook Form + Zod · SWR · Sonner · Recharts

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Folder Structure](#3-folder-structure)
4. [Phase Breakdown](#4-phase-breakdown)
   - [Phase 1 — Foundation & Config](#phase-1--foundation--config)
   - [Phase 2 — Core Library Layer](#phase-2--core-library-layer)
   - [Phase 3 — Zustand Stores](#phase-3--zustand-stores)
   - [Phase 4 — API Layer](#phase-4--api-layer)
   - [Phase 5 — Reusable UI Components](#phase-5--reusable-ui-components)
   - [Phase 6 — Layout Components](#phase-6--layout-components)
   - [Phase 7 — Middleware (Route Protection)](#phase-7--middleware-route-protection)
   - [Phase 8 — Auth Pages](#phase-8--auth-pages)
   - [Phase 9 — Public Pages](#phase-9--public-pages)
   - [Phase 10 — Patient Pages](#phase-10--patient-pages)
   - [Phase 11 — Doctor Pages](#phase-11--doctor-pages)
   - [Phase 12 — Admin Pages](#phase-12--admin-pages)
   - [Phase 13 — Polish & QA](#phase-13--polish--qa)
5. [Page Inventory (32 Pages)](#5-page-inventory-32-pages)
6. [API Integration Map](#6-api-integration-map)
7. [Component Inventory](#7-component-inventory)
8. [State Management Design](#8-state-management-design)
9. [Authentication Flow](#9-authentication-flow)
10. [Environment Variables](#10-environment-variables)
11. [Implementation Rules](#11-implementation-rules)

---

## 1. Project Overview

MediConnect is a role-based Doctor–Patient healthcare portal. The backend is complete (Express + Prisma + PostgreSQL) and exposes **65 REST API endpoints** across 10 modules. This plan covers the complete frontend build: 32 pages, 3 role groups (Patient, Doctor, Admin), a shared component library, and full API integration.

### User Roles
| Role | Entry Dashboard | Key Capabilities |
|------|----------------|-----------------|
| **Patient** | `/patient/dashboard` | Book appointments, medical records, reviews |
| **Doctor** | `/doctor/dashboard` | Manage appointments, availability, patient records |
| **Admin** | `/admin/dashboard` | Analytics, user management, audit logs |

---

## 2. Tech Stack & Dependencies

### Already Installed (via `create-next-app`)
| Package | Purpose |
|---------|---------|
| `next@14` | App Router framework |
| `react`, `react-dom` | UI runtime |
| `typescript` | Type safety |
| `tailwindcss`, `postcss` | Utility-first styling |
| `eslint`, `eslint-config-next` | Linting |

### To Install (Phase 1)
```bash
npm install \
  zustand \                          # Global state (auth, notifications)
  swr \                              # Client-side data fetching
  sonner \                           # Toast notifications
  react-hook-form \                  # Form state management
  @hookform/resolvers \              # Zod adapter for react-hook-form
  zod \                              # Schema validation
  recharts \                         # Charts for admin dashboard
  clsx \                             # Conditional class names
  tailwind-merge \                   # Tailwind class dedup
  lucide-react \                     # Icon set
  class-variance-authority \         # Component variant builder (shadcn pattern)
  @radix-ui/react-dialog \           # Accessible modal
  @radix-ui/react-dropdown-menu \    # Dropdown menus
  @radix-ui/react-select \           # Select components
  @radix-ui/react-avatar \           # Avatar with fallback
  @radix-ui/react-label \            # Accessible form labels
  @radix-ui/react-slot \             # Polymorphic component slot (shadcn)
  @radix-ui/react-separator \        # Visual divider
  @radix-ui/react-toast \            # Toast primitives
  @radix-ui/react-popover \          # Popover/calendar
  @radix-ui/react-checkbox \         # Checkbox primitive
  @radix-ui/react-tabs \             # Tab navigation
  @radix-ui/react-switch \           # Toggle switch
  @radix-ui/react-progress          # Progress bar
```

---

## 3. Folder Structure

```
frontend/
└── src/
    ├── app/                              ← Next.js App Router
    │   ├── layout.tsx                    ← Root layout (fonts, providers, Toaster)
    │   ├── page.tsx                      ← Redirects to landing
    │   ├── not-found.tsx                 ← Global 404
    │   │
    │   ├── (public)/                     ← Public pages (no auth required)
    │   │   ├── page.tsx                  ← Landing page
    │   │   ├── about/page.tsx
    │   │   └── doctors/
    │   │       ├── page.tsx              ← Doctor listing (SSR)
    │   │       └── [id]/page.tsx         ← Doctor public profile (SSR)
    │   │
    │   ├── (auth)/                       ← Auth pages (unauthenticated only)
    │   │   ├── layout.tsx                ← Centered card layout
    │   │   ├── login/page.tsx
    │   │   ├── register/page.tsx
    │   │   ├── verify-email/page.tsx
    │   │   ├── forgot-password/page.tsx
    │   │   └── reset-password/page.tsx
    │   │
    │   ├── (patient)/                    ← Patient-only pages
    │   │   ├── layout.tsx                ← Patient sidebar + header
    │   │   ├── dashboard/page.tsx
    │   │   ├── doctors/
    │   │   │   ├── page.tsx
    │   │   │   └── [id]/book/page.tsx
    │   │   ├── appointments/
    │   │   │   ├── page.tsx
    │   │   │   └── [id]/page.tsx
    │   │   ├── profile/page.tsx
    │   │   ├── records/page.tsx
    │   │   ├── reviews/page.tsx
    │   │   └── notifications/page.tsx
    │   │
    │   ├── (doctor)/                     ← Doctor-only pages
    │   │   ├── layout.tsx                ← Doctor sidebar + header
    │   │   ├── dashboard/page.tsx
    │   │   ├── appointments/
    │   │   │   ├── page.tsx
    │   │   │   └── [id]/page.tsx
    │   │   ├── availability/page.tsx
    │   │   ├── patients/[id]/page.tsx
    │   │   ├── profile/page.tsx
    │   │   └── notifications/page.tsx
    │   │
    │   ├── (admin)/                      ← Admin-only pages
    │   │   ├── layout.tsx                ← Admin sidebar + header
    │   │   ├── dashboard/page.tsx
    │   │   ├── doctors/page.tsx
    │   │   ├── patients/page.tsx
    │   │   ├── appointments/page.tsx
    │   │   └── audit-logs/page.tsx
    │   │
    │   └── unauthorized/page.tsx
    │
    ├── components/
    │   ├── ui/                           ← shadcn/ui base primitives
    │   │   ├── button.tsx
    │   │   ├── input.tsx
    │   │   ├── label.tsx
    │   │   ├── select.tsx
    │   │   ├── textarea.tsx
    │   │   ├── dialog.tsx
    │   │   ├── badge.tsx
    │   │   ├── avatar.tsx
    │   │   ├── card.tsx
    │   │   ├── separator.tsx
    │   │   ├── tabs.tsx
    │   │   ├── checkbox.tsx
    │   │   ├── switch.tsx
    │   │   └── skeleton.tsx
    │   │
    │   ├── layout/                       ← Layout building blocks
    │   │   ├── Sidebar.tsx               ← Role-aware nav sidebar
    │   │   ├── TopHeader.tsx             ← Logo, bell, avatar dropdown
    │   │   ├── PublicNav.tsx             ← Top nav for public pages
    │   │   └── PageContainer.tsx         ← Page title + action slot wrapper
    │   │
    │   ├── features/                     ← Domain-specific components
    │   │   ├── DoctorCard.tsx
    │   │   ├── AppointmentCard.tsx
    │   │   ├── SlotPicker.tsx
    │   │   ├── MedicalRecordItem.tsx
    │   │   ├── NotificationItem.tsx
    │   │   ├── ReviewCard.tsx
    │   │   ├── StarRating.tsx
    │   │   ├── StatusBadge.tsx
    │   │   ├── FileUpload.tsx
    │   │   ├── ConfirmDialog.tsx
    │   │   ├── EmptyState.tsx
    │   │   ├── Pagination.tsx
    │   │   ├── SearchBar.tsx
    │   │   └── AuditLogRow.tsx
    │   │
    │   └── charts/                       ← Recharts wrappers (Client, lazy-loaded)
    │       ├── AppointmentTrendChart.tsx
    │       ├── PatientGrowthChart.tsx
    │       └── DoctorSpecializationChart.tsx
    │
    ├── lib/
    │   ├── fetch-with-auth.ts            ← Core fetch utility (auth + refresh + errors)
    │   ├── utils.ts                      ← cn(), formatDate(), formatTime(), etc.
    │   ├── constants.ts                  ← ROUTES, USER_ROLES, API_BASE_URL, etc.
    │   └── validators/
    │       └── index.ts                  ← All Zod schemas for every form
    │
    ├── lib/api/                          ← One typed file per backend module
    │   ├── auth.ts
    │   ├── doctors.ts
    │   ├── patients.ts
    │   ├── appointments.ts
    │   ├── slots.ts
    │   ├── medical-records.ts
    │   ├── notifications.ts
    │   ├── reviews.ts
    │   ├── admin.ts
    │   └── uploads.ts
    │
    ├── hooks/                            ← Custom React hooks
    │   ├── useDebounce.ts
    │   ├── useNotifications.ts
    │   ├── useCurrentUser.ts
    │   └── useMediaQuery.ts
    │
    ├── store/                            ← Zustand global stores
    │   ├── useAuthStore.ts
    │   └── useNotificationStore.ts
    │
    └── types/
        └── index.ts                      ← All TypeScript interfaces
```

---

## 4. Phase Breakdown

---

### Phase 1 — Foundation & Config

**Goal:** Install all packages, configure Tailwind theme, set up environment.

#### Tasks
- [ ] Install all additional npm packages (see Section 2)
- [ ] Update `tailwind.config.ts` — add MediConnect brand color tokens and font config
- [ ] Update `src/app/globals.css` — Tailwind directives, CSS variables for shadcn, global resets
- [ ] Update `src/app/layout.tsx` — add Google Fonts (Inter), Sonner `<Toaster>`, Zustand provider
- [ ] Create `.env.local` with `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1`
- [ ] Update `tsconfig.json` — ensure `strict: true`, `baseUrl: "."`, path aliases `@/*`
- [ ] Update `next.config.mjs` — add `images.domains` for S3 and backend

#### Files
| File | Action |
|------|--------|
| `tailwind.config.ts` | Modify — add brand tokens |
| `src/app/globals.css` | Modify — CSS variables + Tailwind layers |
| `src/app/layout.tsx` | Modify — fonts, Toaster, providers |
| `.env.local` | Create |
| `next.config.mjs` | Modify |

---

### Phase 2 — Core Library Layer

**Goal:** Build the utility and type foundation everything else depends on.

#### Tasks
- [ ] `src/types/index.ts` — All TypeScript interfaces (User, Doctor, Patient, Appointment, Slot, MedicalRecord, Notification, Review, AuditLog, PaginatedResponse, ApiError)
- [ ] `src/lib/constants.ts` — ROUTES object, USER_ROLES, APPOINTMENT_STATUS, DOCTOR_STATUS, RECORD_TYPES, API_BASE_URL, ROLE_DASHBOARD map
- [ ] `src/lib/utils.ts` — `cn()`, `formatDate()`, `formatTime()`, `formatFileSize()`, `getInitials()`, `getStatusColors()`, `capitalize()`, `debounce()`
- [ ] `src/lib/fetch-with-auth.ts` — Fetch wrapper: credentials, 401 → refresh → retry, 403 redirect, 500 toast event, typed ApiRequestError class
- [ ] `src/lib/validators/index.ts` — All Zod schemas: login, register, forgotPassword, resetPassword, patientProfile, doctorProfile, bookAppointment, appointmentNotes, slot, bulkSlot, medicalRecord, review

#### Key Implementation: `fetchWithAuth`
```
fetchWithAuth(endpoint, options)
  1. Prepend API_BASE_URL if relative path
  2. Add credentials: 'include' + Content-Type header
  3. Call fetch()
  4. If 401 → call /auth/refresh-token → retry once
  5. If second 401 → dispatch 'auth:expired' event → throw
  6. If 403 → redirect to /unauthorized
  7. If 500+ → dispatch 'api:server-error' event → throw
  8. If 204 → return undefined
  9. Parse and return JSON
```

---

### Phase 3 — Zustand Stores

**Goal:** Global state slices for auth and notifications.

#### Tasks
- [ ] `src/store/useAuthStore.ts`
  - State: `user: User | null`, `isAuthenticated: boolean`, `isLoading: boolean`
  - Actions: `setUser()`, `clearUser()`, `setLoading()`
  - Hydration: store is set after login; cleared on logout or `auth:expired` event
- [ ] `src/store/useNotificationStore.ts`
  - State: `unreadCount: number`
  - Actions: `setUnreadCount()`, `decrementUnread()`, `clearUnread()`

#### Notes
- Zustand stores are **Client Component only** — never imported in Server Components
- The `auth:expired` CustomEvent (fired by `fetchWithAuth`) is listened to in a top-level client component that calls `clearUser()` and redirects to `/auth/login`

---

### Phase 4 — API Layer

**Goal:** One typed async function per backend endpoint, organized by module.

#### Tasks
- [ ] `src/lib/api/auth.ts` — `register`, `login`, `logout`, `verifyEmail`, `forgotPassword`, `resetPassword`, `getMe`
- [ ] `src/lib/api/doctors.ts` — `getDoctors`, `getDoctorById`, `getPendingDoctors`, `updateDoctorStatus`, `getMyDoctorProfile`, `createMyDoctorProfile`, `updateMyDoctorProfile`, `updateDoctorProfileImage`, `deactivateDoctorAccount`
- [ ] `src/lib/api/patients.ts` — `getAllPatients`, `getPatientById`, `getMyPatientProfile`, `createMyPatientProfile`, `updateMyPatientProfile`, `updatePatientProfileImage`, `deactivatePatientAccount`
- [ ] `src/lib/api/appointments.ts` — `bookAppointment`, `getMyAppointments`, `cancelAppointment`, `rescheduleAppointment`, `getAppointmentById`, `updateAppointmentStatus`, `addAppointmentNotes`, `getAllAppointments`
- [ ] `src/lib/api/slots.ts` — `createSlot`, `createBulkSlots`, `getMySlots`, `updateSlot`, `deleteSlot`, `getDoctorSlots`
- [ ] `src/lib/api/medical-records.ts` — `uploadMedicalRecord`, `getMyRecords`, `getPatientRecords`, `getRecordById`, `deleteRecord`
- [ ] `src/lib/api/notifications.ts` — `getNotifications`, `getUnreadCount`, `markAsRead`, `markAllAsRead`, `deleteNotification`
- [ ] `src/lib/api/reviews.ts` — `submitReview`, `getDoctorReviews`, `getMyReviews`, `deleteReview`
- [ ] `src/lib/api/admin.ts` — `getDashboard`, `getAllUsers`, `deactivateUser`, `activateUser`, `getAuditLogs`, `getAdminAppointments`, `getPatientAnalytics`, `getDoctorAnalytics`, `getAppointmentAnalytics`
- [ ] `src/lib/api/uploads.ts` — `getPresignedUrl`, `deleteFile`

#### Pattern for every function
```typescript
export async function functionName(params): Promise<ReturnType> {
  return fetchWithAuth('/endpoint', {
    method: 'POST' | 'GET' | 'PUT' | 'DELETE',
    body: JSON.stringify(payload),  // if applicable
  });
}
```

---

### Phase 5 — Reusable UI Components

**Goal:** Build the design system component library (shadcn/ui pattern).

#### shadcn/ui Base Components (`src/components/ui/`)
| Component | Description |
|-----------|-------------|
| `button.tsx` | Variants: default, secondary, destructive, ghost, outline; sizes: sm, md, lg; loading state |
| `input.tsx` | With label, error message slot, show/hide password toggle |
| `label.tsx` | Accessible label using Radix Label |
| `select.tsx` | Dropdown using Radix Select |
| `textarea.tsx` | Multiline with character counter |
| `dialog.tsx` | Accessible modal using Radix Dialog |
| `badge.tsx` | Pill badge with color variants |
| `avatar.tsx` | Profile image with initials fallback |
| `card.tsx` | Card container with header/body/footer |
| `separator.tsx` | Visual divider |
| `tabs.tsx` | Tab navigation using Radix Tabs |
| `checkbox.tsx` | Checkbox using Radix Checkbox |
| `skeleton.tsx` | Content-shaped loading placeholder |

#### Feature Components (`src/components/features/`)
| Component | Used In | Key Props |
|-----------|---------|-----------|
| `StatusBadge.tsx` | Everywhere | `status: string` → colored pill |
| `DoctorCard.tsx` | Doctor listing, patient browse | `doctor: Doctor`, `showBookButton` |
| `AppointmentCard.tsx` | Appointments lists | `appointment: Appointment` |
| `SlotPicker.tsx` | Book appointment | `slots: Slot[]`, `onSelect` |
| `MedicalRecordItem.tsx` | Records page | `record: MedicalRecord`, `onDelete` |
| `NotificationItem.tsx` | Notifications page | `notification: Notification`, `onRead` |
| `ReviewCard.tsx` | Doctor profile, My reviews | `review: Review` |
| `StarRating.tsx` | Review form, doctor profile | `value`, `onChange`, `readOnly` |
| `FileUpload.tsx` | Medical records | `onFile`, `accept`, `maxSize` |
| `ConfirmDialog.tsx` | Destructive actions | `title`, `message`, `onConfirm` |
| `EmptyState.tsx` | Empty lists | `title`, `description`, `icon` |
| `Pagination.tsx` | All paginated lists | `page`, `totalPages`, `onPageChange` |
| `SearchBar.tsx` | Doctor search, lists | `onSearch`, `placeholder` |
| `AuditLogRow.tsx` | Admin audit logs | `log: AuditLog` |

#### Chart Components (`src/components/charts/`) — `"use client"`, lazy-loaded
| Component | Used In | Chart Type |
|-----------|---------|-----------|
| `AppointmentTrendChart.tsx` | Admin dashboard | Line chart — monthly trends |
| `PatientGrowthChart.tsx` | Admin dashboard | Bar chart — registration growth |
| `DoctorSpecializationChart.tsx` | Admin dashboard | Pie/bar chart — specialization breakdown |

---

### Phase 6 — Layout Components

**Goal:** Sidebar, header, and page wrappers for each role.

#### Tasks
- [ ] `src/components/layout/PublicNav.tsx` — Top nav bar: Logo, Doctors, About, Login, Register links
- [ ] `src/components/layout/Sidebar.tsx` — `"use client"` — Role-aware nav list, active route highlight, collapses on mobile
- [ ] `src/components/layout/TopHeader.tsx` — `"use client"` — Logo, notification bell with unread badge, user avatar with dropdown (Profile, Logout)
- [ ] `src/components/layout/PageContainer.tsx` — Wrapper with `title`, `subtitle`, `actions` slot

#### Role Layouts (in `src/app/`)
| Layout | Sidebar Items |
|--------|--------------|
| `(auth)/layout.tsx` | Centered card, no navigation |
| `(patient)/layout.tsx` | Dashboard · Browse Doctors · My Appointments · Medical Records · My Reviews · Notifications · Profile |
| `(doctor)/layout.tsx` | Dashboard · My Appointments · Availability · Notifications · Profile |
| `(admin)/layout.tsx` | Dashboard · Doctors · Patients · Appointments · Audit Logs |
| `(public)/layout.tsx` | PublicNav top bar |

---

### Phase 7 — Middleware (Route Protection)

**Goal:** Block unauthorized access at the edge before any page renders.

#### File: `src/middleware.ts`

**Logic:**
```
For every request:
  1. Read accessToken cookie
  2. If no token AND route is protected → redirect to /auth/login
  3. If token exists AND route is auth page → redirect to role dashboard
  4. Decode JWT payload (without verify — verification is server-side)
  5. Extract role from payload
  6. If route prefix doesn't match role → redirect to /unauthorized

Protected prefixes: /patient, /doctor, /admin
Auth prefixes: /auth
```

**Role → Allowed prefix map:**
| Role | Allowed Prefix |
|------|---------------|
| patient | /patient |
| doctor | /doctor |
| admin | /admin |

---

### Phase 8 — Auth Pages

**Goal:** Full auth flow — register, login, verify, forgot/reset password.

#### Pages

| Page | Route | Key Features |
|------|-------|-------------|
| **Login** | `/auth/login` | Email + password form, RHF + Zod, show/hide password, loading button, role-redirect on success |
| **Register** | `/auth/register` | Name, email, password, confirm password, phone, DOB, gender, role toggle (Patient/Doctor), grouped sections |
| **Verify Email** | `/auth/verify-email` | Reads `?token=` from URL, auto-calls API on mount, success/error states |
| **Forgot Password** | `/auth/forgot-password` | Email form, "Check your inbox" confirmation step |
| **Reset Password** | `/auth/reset-password` | Reads `?token=` from URL, new password + confirm, Zod validation |

#### Implementation Notes
- All form errors shown inline under the field
- Submit button disabled + spinner during API call
- Server errors mapped to form fields via `setError()`
- On successful login: set Zustand auth, `router.push(ROLE_DASHBOARD[role])`
- On successful register: show "Check your email" message (not auto-login)

---

### Phase 9 — Public Pages

**Goal:** SEO-friendly landing, doctor listing, and doctor profile.

#### Pages

| Page | Route | Rendering | Key Features |
|------|-------|-----------|-------------|
| **Landing** | `/` | SSR | Hero section, "How it works", CTA, featured doctors grid |
| **About** | `/about` | SSR | Mission, team, stats |
| **Doctor Listing** | `/doctors` | SSR | Grid of DoctorCards, search by name/specialty, pagination |
| **Doctor Profile** | `/doctors/[id]` | SSR | Doctor info, qualifications, reviews, availability preview, "Book Now" CTA |

#### Design Notes
- `getDoctors()` called in Server Component for SEO
- Doctor Listing has search via URL params (`?search=cardio&page=2`)
- Doctor Profile shows avg rating + all reviews via `getDoctorReviews()`

---

### Phase 10 — Patient Pages

#### Dashboard — `/patient/dashboard`
- Summary cards: Upcoming appointments count, Completed appointments count
- Upcoming appointments list (next 3)
- Quick action buttons: "Browse Doctors", "My Records"
- Recent notifications (top 3)

#### Browse Doctors — `/patient/doctors`
- `SearchBar` with debounce
- Specialty filter dropdown
- Grid of `DoctorCard` components with "Book" button
- Pagination

#### Book Appointment — `/patient/doctors/[id]/book`
- Doctor summary at top
- Date picker → loads `getDoctorSlots(doctorId)` for that date
- `SlotPicker` grid component
- Reason for visit textarea (Zod validated)
- `ConfirmDialog` before submit
- On success: toast + redirect to `/patient/appointments`

#### My Appointments — `/patient/appointments`
- Filter tabs: All / Upcoming / Completed / Cancelled
- List of `AppointmentCard` components
- Pagination

#### Appointment Detail — `/patient/appointments/[id]`
- Full appointment info: doctor, date, time, reason, status, notes
- Cancel button (if status is pending/approved) → `ConfirmDialog`
- Reschedule button (if policy allows)
- "Leave a Review" button (if status is completed and no review yet)

#### My Profile — `/patient/profile`
- View + edit personal info form (RHF + Zod)
- Avatar upload via `FileUpload` + `PUT /patients/me/image`
- Deactivate account section with `ConfirmDialog`

#### Medical Records — `/patient/records`
- List of `MedicalRecordItem` components (title, type badge, date, file size)
- Upload button → `FileUpload` form → presigned URL flow → `POST /medical-records`
- Delete button on each item → `ConfirmDialog` → soft delete

#### My Reviews — `/patient/reviews`
- List of `ReviewCard` showing submitted reviews
- Delete button with `ConfirmDialog`

#### Notifications — `/patient/notifications`
- Full list of `NotificationItem` components
- "Mark all as read" button
- Individual mark-as-read on click
- Delete button per notification

---

### Phase 11 — Doctor Pages

#### Dashboard — `/doctor/dashboard`
- Today's schedule cards (appointments for today)
- Pending appointment count badge
- Quick stats: Total patients seen, This week appointments
- Recent activity

#### My Appointments — `/doctor/appointments`
- Filter tabs: All / Pending / Approved / Completed / Rejected
- List of `AppointmentCard` with patient name
- Pagination + search by patient name

#### Appointment Detail — `/doctor/appointments/[id]`
- Full appointment info
- Patient name + DOB + contact
- Approve / Reject buttons (if pending)
- Mark Complete button (if approved)
- Add/edit doctor notes textarea (RHF + Zod)
- Link to patient's medical records

#### Manage Availability — `/doctor/availability`
- Grid/list of existing slots
- "Add Single Slot" form (date, start time, end time)
- "Add Bulk Slots" form (date range, days of week, time range)
- Delete slot button (only if not booked)

#### Patient Detail — `/doctor/patients/[id]`
- Patient's personal info (read-only)
- Patient's medical records list (read-only download links)
- List of appointments with this patient

#### My Profile — `/doctor/profile`
- View + edit specialization, qualifications, fee, bio, clinic info
- Avatar upload
- Profile image update

#### Notifications — `/doctor/notifications`
- Same structure as patient notifications

---

### Phase 12 — Admin Pages

#### Dashboard — `/admin/dashboard`
- Summary cards: Total Patients, Total Doctors, Pending Doctors, Total Appointments, Revenue
- `AppointmentTrendChart` — monthly appointment trends (line chart)
- `PatientGrowthChart` — monthly registrations (bar chart)
- `DoctorSpecializationChart` — breakdown by specialty (bar/pie chart)
- Quick links to each management section

#### Manage Doctors — `/admin/doctors`
- Tabs: All / Pending / Approved / Rejected / Suspended
- List of doctor rows with status badge
- Approve / Reject / Suspend action buttons
- `ConfirmDialog` before status change
- Search by name or specialization

#### Manage Patients — `/admin/patients`
- List of all patients
- Patient name, email, join date, status
- Deactivate / Activate account toggle
- Search by name or email

#### Manage Appointments — `/admin/appointments`
- Full appointment list with all filters (status, date range, doctor, patient)
- Read-only view of each appointment
- Pagination

#### Audit Logs — `/admin/audit-logs`
- Full table of `AuditLogRow` entries
- Filter by action type or user
- Timestamp, user, action, entity columns
- Pagination

---

### Phase 13 — Polish & QA

#### Tasks
- [ ] Add `loading.tsx` files in every route folder (Skeleton placeholders)
- [ ] Add `error.tsx` files in every route folder
- [ ] Verify all `not-found.tsx` routes work
- [ ] Test mobile responsiveness — sidebar collapses to bottom nav / drawer
- [ ] Audit all forms — confirm Zod + RHF validation is wired on every field
- [ ] Verify `fetchWithAuth` refresh flow end-to-end
- [ ] Verify middleware redirects for all 3 roles + unauthenticated
- [ ] Check all toast messages appear on success/error for every mutation
- [ ] Run `npm run build` and fix all TypeScript errors
- [ ] Accessibility check: keyboard nav, ARIA labels, focus rings
- [ ] Verify `next/image` is used for all images with proper `alt` text

---

## 5. Page Inventory (32 Pages)

| # | Page | Route | Role | Render |
|---|------|-------|------|--------|
| 1 | Landing | `/` | Public | SSR |
| 2 | About | `/about` | Public | SSR |
| 3 | Doctor Listing | `/doctors` | Public | SSR |
| 4 | Doctor Profile | `/doctors/[id]` | Public | SSR |
| 5 | 404 | `not-found.tsx` | All | Static |
| 6 | Unauthorized | `/unauthorized` | All | Static |
| 7 | Register | `/auth/register` | Guest | CSR |
| 8 | Login | `/auth/login` | Guest | CSR |
| 9 | Verify Email | `/auth/verify-email` | Guest | CSR |
| 10 | Forgot Password | `/auth/forgot-password` | Guest | CSR |
| 11 | Reset Password | `/auth/reset-password` | Guest | CSR |
| 12 | Patient Dashboard | `/patient/dashboard` | Patient | SSR+CSR |
| 13 | Browse Doctors | `/patient/doctors` | Patient | SSR |
| 14 | Book Appointment | `/patient/doctors/[id]/book` | Patient | CSR |
| 15 | My Appointments | `/patient/appointments` | Patient | SSR |
| 16 | Appointment Detail | `/patient/appointments/[id]` | Patient | SSR |
| 17 | My Profile | `/patient/profile` | Patient | CSR |
| 18 | Medical Records | `/patient/records` | Patient | SSR |
| 19 | My Reviews | `/patient/reviews` | Patient | SSR |
| 20 | Notifications | `/patient/notifications` | Patient | CSR |
| 21 | Doctor Dashboard | `/doctor/dashboard` | Doctor | SSR+CSR |
| 22 | My Appointments | `/doctor/appointments` | Doctor | SSR |
| 23 | Appointment Detail | `/doctor/appointments/[id]` | Doctor | SSR+CSR |
| 24 | Manage Availability | `/doctor/availability` | Doctor | CSR |
| 25 | Patient Detail | `/doctor/patients/[id]` | Doctor | SSR |
| 26 | Doctor Profile | `/doctor/profile` | Doctor | CSR |
| 27 | Notifications | `/doctor/notifications` | Doctor | CSR |
| 28 | Admin Dashboard | `/admin/dashboard` | Admin | SSR+CSR |
| 29 | Manage Doctors | `/admin/doctors` | Admin | SSR+CSR |
| 30 | Manage Patients | `/admin/patients` | Admin | SSR |
| 31 | Manage Appointments | `/admin/appointments` | Admin | SSR |
| 32 | Audit Logs | `/admin/audit-logs` | Admin | SSR |

---

## 6. API Integration Map

| Page | API Functions Called |
|------|---------------------|
| Login | `auth.login()` |
| Register | `auth.register()` |
| Verify Email | `auth.verifyEmail(token)` |
| Forgot Password | `auth.forgotPassword(email)` |
| Reset Password | `auth.resetPassword(token, password)` |
| Landing / Doctor Listing | `doctors.getDoctors()` |
| Doctor Profile (public) | `doctors.getDoctorById(id)`, `reviews.getDoctorReviews(id)`, `slots.getDoctorSlots(id)` |
| Patient Dashboard | `appointments.getMyAppointments()`, `notifications.getNotifications()` |
| Browse Doctors (patient) | `doctors.getDoctors()` |
| Book Appointment | `slots.getDoctorSlots(id)`, `appointments.bookAppointment()` |
| My Appointments (patient) | `appointments.getMyAppointments()` |
| Appointment Detail (patient) | `appointments.getAppointmentById(id)`, `appointments.cancelAppointment()` |
| Patient Profile | `patients.getMyPatientProfile()`, `patients.updateMyPatientProfile()`, `uploads.getPresignedUrl()` |
| Medical Records | `medicalRecords.getMyRecords()`, `medicalRecords.uploadMedicalRecord()`, `medicalRecords.deleteRecord()` |
| My Reviews | `reviews.getMyReviews()`, `reviews.deleteReview()` |
| Notifications | `notifications.getNotifications()`, `notifications.markAsRead()`, `notifications.markAllAsRead()`, `notifications.deleteNotification()` |
| Doctor Dashboard | `appointments.getMyAppointments()` |
| Doctor Appointments | `appointments.getMyAppointments()` |
| Appointment Detail (doctor) | `appointments.getAppointmentById(id)`, `appointments.updateAppointmentStatus()`, `appointments.addAppointmentNotes()` |
| Availability | `slots.getMySlots()`, `slots.createSlot()`, `slots.createBulkSlots()`, `slots.deleteSlot()` |
| Patient Detail (doctor) | `patients.getPatientById(id)`, `medicalRecords.getPatientRecords(patientId)` |
| Doctor Profile | `doctors.getMyDoctorProfile()`, `doctors.updateMyDoctorProfile()`, `uploads.getPresignedUrl()` |
| Admin Dashboard | `admin.getDashboard()`, `admin.getPatientAnalytics()`, `admin.getDoctorAnalytics()`, `admin.getAppointmentAnalytics()` |
| Admin Doctors | `doctors.getDoctors()`, `doctors.getPendingDoctors()`, `doctors.updateDoctorStatus()` |
| Admin Patients | `admin.getAllUsers()`, `admin.deactivateUser()`, `admin.activateUser()` |
| Admin Appointments | `admin.getAdminAppointments()` |
| Audit Logs | `admin.getAuditLogs()` |

---

## 7. Component Inventory

### Shared "use client" Hooks
| Hook | Purpose |
|------|---------|
| `useDebounce(value, delay)` | Debounce search input — prevent API calls on every keystroke |
| `useNotifications()` | Fetch notifications + unread count, mark as read |
| `useCurrentUser()` | Return user from Zustand auth store |
| `useMediaQuery(query)` | Responsive breakpoint detection for sidebar collapse |

---

## 8. State Management Design

```
┌─────────────────────────────────────────────────────────┐
│                     Zustand Stores                       │
│                                                          │
│  useAuthStore                  useNotificationStore      │
│  ─────────────                 ────────────────────      │
│  user: User | null             unreadCount: number       │
│  isAuthenticated: boolean      ─────────────────────     │
│  setUser()                     setUnreadCount()          │
│  clearUser()                   decrementUnread()         │
│                                clearUnread()             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Local / Form State                       │
│                                                          │
│  React Hook Form  →  per form component                  │
│  useState         →  modal open/close, selected slot     │
│  URL Search Params →  filters, pagination, search        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   Data Fetching                           │
│                                                          │
│  Server Components  →  direct fetch() calls (SSR)        │
│  Client Components  →  SWR for auto-revalidation         │
│  Mutations          →  fetchWithAuth() + SWR mutate()    │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Authentication Flow

### Login
```
User submits login form
  → POST /auth/login
  → Server sets accessToken + refreshToken cookies (HttpOnly)
  → Response returns { user }
  → setUser() in Zustand store
  → router.push(ROLE_DASHBOARD[user.role])
```

### Silent Refresh
```
Any API call returns 401
  → fetchWithAuth calls POST /auth/refresh-token
  → Browser auto-sends refreshToken cookie
  → If 200: retry original request
  → If 401 again: dispatch 'auth:expired', clear store, redirect /auth/login
```

### Middleware Protection
```
Every request → middleware.ts
  → No token + protected route? → /auth/login
  → Has token + auth route? → role dashboard
  → Has token + wrong role prefix? → /unauthorized
  → OK → continue
```

### Logout
```
User clicks Logout
  → POST /auth/logout (server clears cookies)
  → clearUser() in Zustand store
  → router.push('/auth/login')
  → router.refresh() (clears Server Component cache)
```

---

## 10. Environment Variables

### `.env.local` (frontend)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

### `next.config.mjs`
```js
images: {
  domains: ['localhost', 'your-s3-bucket.s3.amazonaws.com']
}
```

---

## 11. Implementation Rules

1. **Never hardcode API URLs** — always use `API_BASE_URL` from constants
2. **Never import Zustand stores in Server Components** — only in `"use client"` components
3. **Never use `dangerouslySetInnerHTML`** — all user content rendered as plain text
4. **Always use `next/image`** for all images — with required `alt` prop
5. **Always wrap mutations in try/catch** — map 400 errors to form fields via `setError()`
6. **Always show loading state** on submit buttons — disabled + spinner during API call
7. **Always confirm destructive actions** — `ConfirmDialog` before delete/cancel/deactivate
8. **Filters live in URL params** — never in React state — bookmarkable and SSR-compatible
9. **Charts are lazy-loaded** — `next/dynamic` with `ssr: false` to avoid hydration errors
10. **`"use client"` only where needed** — default to Server Components for performance

---

## Implementation Order Summary

```
Phase 1  →  Foundation (packages, tailwind, env)
Phase 2  →  Core lib (types, constants, utils, fetchWithAuth, validators)
Phase 3  →  Zustand stores
Phase 4  →  API layer (all 10 modules)
Phase 5  →  UI components (shadcn base + feature components)
Phase 6  →  Layout components (Sidebar, Header, page layouts)
Phase 7  →  Middleware
Phase 8  →  Auth pages (login, register, verify, forgot, reset)
Phase 9  →  Public pages (landing, about, doctors)
Phase 10 →  Patient pages (9 pages)
Phase 11 →  Doctor pages (7 pages)
Phase 12 →  Admin pages (5 pages)
Phase 13 →  Polish (loading.tsx, error.tsx, mobile, a11y, build check)
```

**Total: 13 Phases · 32 Pages · 65 API Endpoints · ~60 Components**
