# MediConnect – Frontend Design Report
### Version 2.0 · Next.js · Role-Based Doctor–Patient Portal

> Prepared by: Senior Frontend Architect  
> Based on: Features Document + API Endpoints Document  
> Stack: Next.js 14 (App Router) · Tailwind CSS · shadcn/ui · JWT (Cookie-based) · REST APIs

---

## 1. Project Overview

MediConnect is a full-featured, role-based Doctor–Patient web portal designed to digitize the healthcare appointment experience. The platform serves three distinct user types — Patients, Doctors, and Admins — each with their own isolated experience and permissions.

The frontend is built with **Next.js 14 using the App Router**. It takes full advantage of React Server Components for fast, SEO-friendly public pages, and Client Components for interactive dashboards and forms. It communicates with a RESTful backend over HTTP, handles role-based routing via middleware, and manages complex UI flows including appointment booking, availability scheduling, medical record management, and an admin analytics dashboard.

**Application type:** Healthcare SaaS Portal — multi-role, protected, data-driven

**Why Next.js over a pure SPA:**
- Public pages (doctor listing, landing page) are server-rendered for SEO and fast initial load
- Protected dashboard pages behave like a traditional SPA with client-side transitions
- Next.js Middleware handles route protection at the edge before any page renders
- API routes can be used as a lightweight BFF (Backend For Frontend) proxy layer if needed
- Built-in image optimization with `next/image` for profile photos and medical assets

**Primary frontend responsibilities:**
- Role-based routing and access control via Next.js Middleware
- Dynamic dashboards tailored to each user role
- Form handling with field-level validation using React Hook Form + Zod
- API integration across 10 backend modules (65 endpoints)
- Cookie-based JWT authentication with silent refresh
- In-app notifications and toast feedback system
- Server-side rendering for public pages, client-side interactivity for dashboards
- Responsive layout for desktop and mobile devices

---

## 2. User Roles

The platform has three user roles, each with a clearly scoped set of permissions and access levels.

### Patient
- Can self-register and log in
- Can view, book, edit, and cancel appointments
- Can manage their personal profile and medical history
- Can upload and manage prescriptions and reports
- Can submit and view reviews for doctors
- Can receive in-app notifications
- Cannot access doctor-only or admin-only pages

### Doctor
- Can log in (registration goes through admin approval flow)
- Can manage their own profile and availability slots
- Can view, approve, reject, and complete appointments
- Can add clinical notes to completed appointments
- Can view patient profiles and medical records for assigned patients
- Cannot access admin pages or other doctors' data

### Admin
- Can log in with full platform access
- Can approve, reject, or suspend doctor accounts
- Can view all users, patients, doctors, and appointments
- Can access full analytics dashboard and audit logs
- Can deactivate or reactivate any user account
- Has read-only or moderation access across all modules

---

## 3. Page Structure

The application contains a total of **32 pages**, mapped directly to Next.js App Router folder segments. Pages are categorized into Public, Auth, Patient, Doctor, and Admin groups.

### Public Pages (accessible without login)

| # | Page | Route | Purpose |
|---|------|-------|---------|
| 1 | Landing / Home | `/` | Marketing page, entry point for new users |
| 2 | About | `/about` | Information about MediConnect |
| 3 | Doctor Listing | `/doctors` | Browse all approved doctors (SSR for SEO) |
| 4 | Doctor Public Profile | `/doctors/[id]` | View a single doctor's info and reviews |
| 5 | Not Found (404) | `not-found.tsx` | Catch-all for unknown routes |
| 6 | Unauthorized (403) | `/unauthorized` | Shown when a role tries accessing a restricted page |

### Auth Pages (unauthenticated users only)

| # | Page | Route | Purpose |
|---|------|-------|---------|
| 7 | Register | `/auth/register` | Patient and Doctor sign-up form |
| 8 | Login | `/auth/login` | Login for all roles |
| 9 | Verify Email | `/auth/verify-email` | Email verification landing page |
| 10 | Forgot Password | `/auth/forgot-password` | Request password reset link |
| 11 | Reset Password | `/auth/reset-password` | Set new password via reset token |

### Patient Pages (role: patient)

| # | Page | Route | Purpose |
|---|------|-------|---------|
| 12 | Patient Dashboard | `/patient/dashboard` | Upcoming appointments, quick actions |
| 13 | Browse Doctors | `/patient/doctors` | Search and filter doctors, view availability |
| 14 | Book Appointment | `/patient/doctors/[id]/book` | Select slot and reason for visit |
| 15 | My Appointments | `/patient/appointments` | List of all patient appointments with status |
| 16 | Appointment Detail | `/patient/appointments/[id]` | Full view of a single appointment |
| 17 | My Profile | `/patient/profile` | View and edit personal information |
| 18 | Medical Records | `/patient/records` | View, upload, and delete records |
| 19 | My Reviews | `/patient/reviews` | View and manage submitted reviews |
| 20 | Notifications | `/patient/notifications` | Full notification list and read status |

### Doctor Pages (role: doctor)

| # | Page | Route | Purpose |
|---|------|-------|---------|
| 21 | Doctor Dashboard | `/doctor/dashboard` | Today's schedule, pending approvals |
| 22 | My Appointments | `/doctor/appointments` | All assigned appointments with filters |
| 23 | Appointment Detail | `/doctor/appointments/[id]` | View appointment, add notes, update status |
| 24 | Manage Availability | `/doctor/availability` | Create, view, and delete availability slots |
| 25 | Patient Detail | `/doctor/patients/[id]` | View a specific patient's profile and records |
| 26 | My Profile | `/doctor/profile` | View and edit doctor profile and image |
| 27 | Notifications | `/doctor/notifications` | Full notification list |

### Admin Pages (role: admin)

| # | Page | Route | Purpose |
|---|------|-------|---------|
| 28 | Admin Dashboard | `/admin/dashboard` | Platform-wide analytics and summary stats |
| 29 | Manage Doctors | `/admin/doctors` | List, approve, reject, suspend doctors |
| 30 | Manage Patients | `/admin/patients` | List and view patient accounts |
| 31 | Manage Appointments | `/admin/appointments` | All appointments with full filters |
| 32 | Audit Logs | `/admin/audit-logs` | Full audit trail of platform actions |

---

## 4. Page Flow & Navigation

### Navigation Structure

The application uses a **persistent sidebar layout** for all authenticated pages, implemented as a shared Next.js layout (`layout.tsx`) inside each role's route group. A **top header bar** handles user actions and notifications.

**Sidebar navigation items by role:**

Patient sidebar: Dashboard · Browse Doctors · My Appointments · Medical Records · My Reviews · Notifications · Profile · Logout

Doctor sidebar: Dashboard · My Appointments · Availability · Notifications · Profile · Logout

Admin sidebar: Dashboard · Doctors · Patients · Appointments · Audit Logs · Logout

**Top header bar** (all roles): App logo · Role badge · Notification bell (with unread count) · User avatar with dropdown (Profile, Logout)

Public pages use a simple **top navigation bar** with links to Home, Doctor Listing, Login, and Register.

### Next.js Route Groups

Route groups keep the folder structure organized without affecting URLs:

- `(public)` — Landing, About, Doctor Listing, Doctor Profile
- `(auth)` — Login, Register, Verify Email, Forgot/Reset Password
- `(patient)` — All patient-only pages sharing the patient sidebar layout
- `(doctor)` — All doctor-only pages sharing the doctor sidebar layout
- `(admin)` — All admin-only pages sharing the admin sidebar layout

Each group has its own `layout.tsx` that renders the appropriate sidebar and header. Middleware enforces that only the correct role can enter each group.

---

### Key User Journeys

**Patient — Registration to First Booking**
Register → Verify Email → Login → Patient Dashboard → Browse Doctors → Select Doctor → View Availability → Book Appointment → Appointment Confirmation → My Appointments

**Patient — Managing an Appointment**
My Appointments → Appointment Detail → Cancel Appointment → Toast Confirmation → Appointments Refreshed

**Doctor — Daily Workflow**
Login → Doctor Dashboard (today's schedule) → My Appointments → Appointment Detail → Add Notes / Mark Complete → Back to Dashboard

**Doctor — Setting Availability**
Login → Manage Availability → Create Slots (single or bulk) → Slots Confirmed via Toast

**Admin — Approving a Doctor**
Login → Admin Dashboard → Manage Doctors → Pending Tab → Review Doctor Profile → Approve or Reject → Toast Confirmation → Doctor list refreshed

**Admin — Viewing Analytics**
Login → Admin Dashboard → View summary cards (patients, doctors, appointments) → View trend charts → Navigate to detailed views

---

## 5. Component Structure

Next.js distinguishes between **Server Components** (default, no interactivity) and **Client Components** (marked with `"use client"`, handles state and events). Components are chosen based on their need for interactivity.

### Layout Components

- **RootLayout** — Global HTML shell (`app/layout.tsx`), sets fonts, metadata, and global providers
- **PublicLayout** — Top nav + content for public and marketing pages
- **AuthLayout** — Centered card layout for login/register pages
- **PatientLayout** — Sidebar + header layout for all patient pages
- **DoctorLayout** — Sidebar + header layout for all doctor pages
- **AdminLayout** — Sidebar + header layout for all admin pages
- **Sidebar** — Role-aware navigation links with active route highlighting (Client Component)
- **TopHeader** — App logo, notification bell with badge, user avatar dropdown (Client Component)
- **PageContainer** — Consistent page wrapper with title, subtitle, and action slot

### Reusable UI Components (shadcn/ui based)

- **Button** — Primary, secondary, destructive, ghost, and loading variants
- **Input** — Text, email, password with label and error message slot
- **Select** — Dropdown with search support
- **Textarea** — Multiline input with character counter
- **DatePicker** — Calendar-based date selection for appointments
- **Modal / Dialog** — Accessible modal with title, body, footer actions
- **ConfirmDialog** — Specialized destructive-action confirmation modal
- **Toast** — Success, error, and info notification toasts via Sonner
- **Badge** — Status indicators (pending, approved, rejected, completed, cancelled)
- **Spinner** — Inline and full-page loading indicators
- **Skeleton** — Content-shaped loading placeholders for lists and cards
- **EmptyState** — Illustrated placeholder when a list has no data
- **Pagination** — Page control for tables and lists
- **FileUpload** — Drag-and-drop and browse file input with preview
- **Avatar** — Profile photo with initials fallback
- **SearchBar** — Debounced search input

### Feature Components

- **DoctorCard** — Doctor summary card for listing and browse pages
- **AppointmentCard** — Compact appointment summary with status badge
- **SlotPicker** — Grid of available time slots for booking (Client Component)
- **MedicalRecordItem** — Single record row with file icon and actions
- **NotificationItem** — Single notification row with read/unread state
- **ReviewCard** — Doctor review with star rating and comment
- **AnalyticsSummaryCard** — Metric card for admin dashboard stats
- **AppointmentChart** — Line or bar chart for appointment trends (Client Component, uses Recharts)
- **RegistrationChart** — User growth chart for admin analytics (Client Component)
- **AuditLogRow** — Single audit entry with timestamp and action label

### Server vs Client Component Strategy

| Component Type | Rendering | Examples |
|---|---|---|
| Page shells and layouts | Server | PatientLayout, AdminLayout, PageContainer |
| Static content display | Server | DoctorCard (read-only), AuditLogRow |
| Interactive forms | Client | LoginForm, BookingForm, ProfileEditForm |
| Charts and data viz | Client | AppointmentChart, RegistrationChart |
| Navigation with active state | Client | Sidebar, TopHeader |
| Modals and toasts | Client | Modal, ConfirmDialog, Toast |
| Slot selection grid | Client | SlotPicker |

---

## 6. State Management Plan

Next.js encourages minimal client-side state. Server Components fetch and render data directly. Client Components manage local interactivity. Global state is kept lean.

### Global State (Zustand)

**Auth State**
- Current logged-in user object (id, name, email, role, photo)
- Authentication status derived from cookie presence, validated server-side by middleware on every request
- Role information used for conditional UI rendering in Client Components
- Hydrated once on app load from the server-rendered user object

**Toast / Notification State**
- Queue of active toast messages managed by Sonner, callable from any Client Component
- Unread notification count stored in a small Zustand slice, refreshed after marking as read

### Local / Component State

**Form State** — Managed entirely by React Hook Form within each form component. No global form state.

**Filter State** — Stored in URL search params (`useSearchParams`). Filter changes update the URL and trigger a server re-fetch. Filtered views are bookmarkable and shareable.

**Slot Picker** — Local React `useState` tracks the selected slot before form submission.

**Modal Open/Close** — Local state within the component that owns the modal trigger.

### Data Fetching Strategy

- **Server Components** fetch data directly using `fetch()` with Next.js cache options. List pages are fetched server-side for performance and SEO.
- **Client Components** that need fresh interactive data use SWR or TanStack Query for client-side fetching with automatic revalidation, loading states, and error handling.
- After a mutation (book appointment, approve doctor), data is revalidated using Next.js `revalidatePath()` or SWR's `mutate()`.

---

## 7. API Integration Strategy

### API Layer Design

All backend API calls are centralized in a `lib/api/` folder. Each backend module has its own typed file that exports async functions. No component or page directly constructs fetch URLs or handles raw HTTP.

Modules and their corresponding API files:
- Auth → `lib/api/auth.ts`
- Doctors → `lib/api/doctors.ts`
- Patients → `lib/api/patients.ts`
- Appointments → `lib/api/appointments.ts`
- Availability Slots → `lib/api/slots.ts`
- Medical Records → `lib/api/medical-records.ts`
- Notifications → `lib/api/notifications.ts`
- Reviews → `lib/api/reviews.ts`
- Admin → `lib/api/admin.ts`
- File Uploads → `lib/api/uploads.ts`

### Next.js Route Handlers as BFF Proxy (Optional)

For sensitive operations or to avoid exposing the backend URL to the browser, Next.js Route Handlers (`app/api/`) can act as a thin proxy. The browser calls the Next.js route, and the Route Handler forwards the request to the actual backend with cookies attached server-side. This also enables adding extra logging or validation at the edge.

### Global Error Handling via fetchWithAuth Utility

A shared `fetchWithAuth()` utility wraps all API calls. It:
- Automatically includes credentials (cookies) on every request
- On a 401 response, calls the refresh-token endpoint and retries the original request once
- On a second 401 (refresh also failed), clears auth state and redirects to `/auth/login`
- On a 403 response, redirects to `/unauthorized`
- On 500+ responses, triggers a generic error toast via Sonner
- Returns typed response data or throws a typed error for local handling

### Loading, Error, and Success Handling

**Loading** — Server Components show skeleton components via React Suspense boundaries and `loading.tsx` files in each route folder. Client Components show inline spinners or disabled buttons during mutations.

**Success** — Data is revalidated and the UI reflects new state. A success toast is shown for user-initiated mutations.

**Error** — Validation errors (400) are mapped to form fields via React Hook Form's `setError()`. Server errors (500) trigger a generic toast. Network errors show a connectivity message.

---

## 8. Authentication Flow

### Middleware-Based Route Protection

Next.js Middleware (`middleware.ts`) runs at the edge before any page renders. It reads the `accessToken` cookie on every request and:
- Redirects unauthenticated users to `/auth/login` for any protected route
- Redirects authenticated users away from auth pages to their dashboard
- Decodes the role claim from the JWT and redirects to `/unauthorized` if the role does not match the route group

This means route protection is enforced before any React code runs — users never see a flash of protected content.

### Registration Flow

Patient registers via `/auth/register` submitting name, email, password, phone, DOB, and gender. Zod validates all fields before submission. On success, the server sends a verification email and the UI shows a "Check your email" screen. The user clicks the link, lands on `/auth/verify-email` with the token in the URL query param, and the token is sent to the backend. On verification success, the user is redirected to `/auth/login`.

Doctor registration uses the same form with role set to "doctor". The account enters a pending approval state and cannot log in until an admin approves it.

### Login Flow

The user submits email and password on `/auth/login`. On success, the server sets `accessToken` and `refreshToken` as HttpOnly cookies. The response body returns only the user object. The frontend stores the user in the Zustand auth store and uses Next.js `router.push()` to navigate to the role-appropriate dashboard.

Role-to-dashboard mapping:
- `patient` → `/patient/dashboard`
- `doctor` → `/doctor/dashboard`
- `admin` → `/admin/dashboard`

### Silent Token Refresh

The `fetchWithAuth()` utility handles silent refresh transparently. When an API call returns 401, it immediately calls `/auth/refresh-token` (the browser sends the refreshToken cookie automatically). On success, it retries the original failed request. On failure (both tokens expired), the user is logged out and redirected to `/auth/login`.

### Logout Flow

Clicking Logout calls `POST /auth/logout`, which clears the server-side cookies. The frontend clears its Zustand auth store, calls `router.push('/auth/login')`, and calls `router.refresh()` to invalidate any cached Server Component data on the current page.

---

## 9. Form Handling Strategy

### Validation Approach

All forms use **React Hook Form** for form state management combined with **Zod** for schema-based validation. A Zod schema defines the shape and rules for every form. React Hook Form uses the Zod resolver to run validation automatically.

This gives:
- Type-safe form values inferred directly from the Zod schema
- Declarative validation rules defined once, not scattered across the template
- Reusable schemas that can also be used in Next.js Route Handlers for consistent server-side rules

### Error Display Strategy

Each form field has a dedicated error message displayed below the input. Errors appear on field blur to avoid interrupting active typing. On form submission, all fields are validated at once and focus moves to the first invalid field.

Server validation errors from 400 API responses are mapped back to specific form fields using React Hook Form's `setError()` with the field name taken from the API error response's `field` property. This shows backend errors inline at the exact field rather than as a generic alert.

### Form UX Best Practices

- Submit buttons show a loading spinner and are disabled during API calls to prevent double submission
- Password fields have a show/hide toggle using an eye icon button
- File upload inputs show selected file name, size, and a remove button after selection
- Long forms (registration) are visually grouped with clear section headings
- Confirmation dialogs appear before any destructive action (delete record, cancel appointment)
- Optimistic UI updates for fast-feeling interactions (marking a notification as read updates the badge instantly before the API confirms)

---

## 10. UI/UX Guidelines

### Design Principles

- **Clarity first** — Every page has one primary action. Secondary actions are visually de-emphasized.
- **Role-aware UI** — Users only see navigation and actions relevant to their role.
- **Consistent feedback** — Every user action receives a visible response (toast, spinner, or inline message) within 200ms.
- **Trust and calm** — Healthcare UI should be clean, minimal, and professional.
- **Server-first** — Pages load with real data using Server Components wherever possible, eliminating unnecessary loading states.

### Styling Approach

The project uses **Tailwind CSS** with **shadcn/ui** as the component foundation. shadcn/ui components are copied directly into the project (not installed as a black box), so every component is fully customizable. A custom Tailwind theme extends the default palette with MediConnect brand tokens.

### Color System

- Primary: Medical blue (`blue-600` / `blue-700`) — actions, links, active navigation states
- Success: `green-600` — approved status, success toasts, confirmations
- Warning: `amber-500` — pending status, cautionary notices
- Danger: `red-600` — rejected status, error states, destructive action buttons
- Neutral: Gray scale — backgrounds, borders, secondary text
- Surface: White with subtle gray borders for cards and content areas

### Responsiveness Strategy

The application is designed mobile-first using Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`). The sidebar collapses into a bottom navigation bar on mobile or a hamburger-triggered sheet drawer. Content grids switch from multi-column to single-column on small screens. Data tables become horizontally scrollable on narrow viewports. All touch targets are a minimum of 44×44px.

### Accessibility Considerations

- All interactive elements are keyboard navigable
- Form inputs have associated labels, not just placeholders
- Color is never the sole means of conveying status — badges also carry text labels
- ARIA roles and `aria-label` attributes are applied to icon-only buttons
- Focus rings are visible and not suppressed
- Error messages are linked to their inputs via `aria-describedby`
- Dialogs trap focus while open and restore focus on close
- `next/image` enforces `alt` text on all images
- Color contrast meets WCAG AA minimum ratios throughout

---

## 11. Folder Structure

The project uses Next.js 14 App Router conventions. The `app/` directory defines all routes. Shared logic lives in `lib/`, `hooks/`, `components/`, and `store/`.

```
src/
  app/
    (public)/                        — Public route group
      page.tsx                       — Landing page (SSR)
      about/page.tsx
      doctors/
        page.tsx                     — Doctor listing (SSR)
        [id]/page.tsx                — Doctor public profile (SSR)
    (auth)/                          — Auth route group
      layout.tsx                     — Centered card layout
      login/page.tsx
      register/page.tsx
      verify-email/page.tsx
      forgot-password/page.tsx
      reset-password/page.tsx
    (patient)/                       — Patient route group
      layout.tsx                     — Patient sidebar layout
      dashboard/page.tsx
      doctors/
        page.tsx
        [id]/book/page.tsx
      appointments/
        page.tsx
        [id]/page.tsx
      profile/page.tsx
      records/page.tsx
      reviews/page.tsx
      notifications/page.tsx
    (doctor)/                        — Doctor route group
      layout.tsx                     — Doctor sidebar layout
      dashboard/page.tsx
      appointments/
        page.tsx
        [id]/page.tsx
      availability/page.tsx
      patients/[id]/page.tsx
      profile/page.tsx
      notifications/page.tsx
    (admin)/                         — Admin route group
      layout.tsx                     — Admin sidebar layout
      dashboard/page.tsx
      doctors/page.tsx
      patients/page.tsx
      appointments/page.tsx
      audit-logs/page.tsx
    unauthorized/page.tsx
    not-found.tsx                    — Global 404 page
    layout.tsx                       — Root layout (fonts, metadata, providers)
  middleware.ts                      — Edge route protection and role checking

  components/
    ui/                              — shadcn/ui base components
    layout/                          — Sidebar, TopHeader, PageContainer, layouts
    features/                        — Feature components (DoctorCard, AppointmentCard, etc.)
    charts/                          — Recharts-based chart components

  lib/
    api/                             — One typed file per backend module
    fetch-with-auth.ts               — Shared fetch utility with auth + refresh logic
    utils.ts                         — Shared utility functions
    validators/                      — Zod schemas for all forms
    constants.ts                     — Roles, status values, route path constants

  hooks/                             — Custom React hooks (useDebounce, useNotifications, etc.)

  store/                             — Zustand stores (useAuthStore, etc.)

  types/                             — TypeScript interfaces for all API entities

  public/                            — Static assets (logo, icons, illustrations)

  styles/
    globals.css                      — Tailwind base imports and global CSS overrides
```

---

## 12. Naming Conventions

### Pages and Route Segments

Pattern: lowercase with hyphens (Next.js folder convention)

Examples: `book-appointment/`, `audit-logs/`, `forgot-password/`

### Components

Pattern: PascalCase for file names and function names

Examples: `DoctorCard.tsx`, `AppointmentCard.tsx`, `SlotPicker.tsx`, `ConfirmDialog.tsx`

### API Library Functions

Pattern: verb + entity, camelCase

Examples: `getAppointments()`, `bookAppointment()`, `approveDoctor()`, `uploadMedicalRecord()`

### Zod Schemas

Pattern: `entityFormSchema` with Schema suffix, camelCase

Examples: `loginFormSchema`, `registerFormSchema`, `bookAppointmentSchema`, `profileUpdateSchema`

### Zustand Stores

Pattern: `useEntityStore` following React hook naming

Examples: `useAuthStore`, `useNotificationStore`

### Custom Hooks

Pattern: `useFeatureName` following React hook naming

Examples: `useDebounce`, `useNotifications`, `useAppointments`, `useCurrentUser`

### TypeScript Interfaces

Pattern: PascalCase with no `I` prefix

Examples: `User`, `Appointment`, `MedicalRecord`, `Notification`, `Doctor`, `Slot`

### Constants and Enums

Pattern: SCREAMING_SNAKE_CASE for values, PascalCase for enum names

Examples: `USER_ROLES.PATIENT`, `APPOINTMENT_STATUS.PENDING`, `ROUTES.PATIENT_DASHBOARD`

### Routes

Pattern: kebab-case URL segments matching the folder structure

Examples: `/patient/dashboard`, `/doctor/appointments`, `/admin/audit-logs`, `/auth/forgot-password`

---

## 13. Scalability Considerations

### Route Group Isolation

Each role's pages live inside their own route group with a dedicated layout. Adding a new role (e.g., Nurse or Receptionist) means creating a new route group folder and a new layout. Nothing in existing groups changes.

### Automatic Code Splitting

Next.js automatically splits the JavaScript bundle at the page level. The patient bundle, doctor bundle, and admin bundle are completely separate. Loading the admin dashboard never loads patient-specific code.

### API Layer Scalability

Every backend module has its own typed API file in `lib/api/`. Adding new endpoints means adding new typed functions to the relevant file. No page or component directly knows an API URL.

### New Role Addition

To add a new role: create a new route group, add the role to the constants and Zod role enum, update middleware to recognize the new route prefix, and create the sidebar layout for that role. No existing role code is modified.

### Design System Scalability

shadcn/ui components in `components/ui/` act as the internal design system. New pages assemble existing components without writing new CSS. The Tailwind theme tokens ensure consistent branding as the app grows.

### Maintainability Strategy

- No business logic in page components — logic lives in API functions and custom hooks
- No hardcoded strings — constants and enums are used for status values, roles, and routes
- Environment variables control all API base URLs
- TypeScript strict mode is enabled — type errors are caught at compile time
- Zod schemas are the single source of truth for validation across forms and API handlers

---

## 14. Performance Considerations

### Server Components by Default

Every component in the App Router is a Server Component by default. Data fetching happens on the server and HTML is streamed to the browser. Public pages (doctor listing, landing page) deliver fully rendered content with no client-side loading states.

### Streaming and Suspense

React Suspense boundaries with `loading.tsx` files enable progressive page loading. The page shell (sidebar, header) renders immediately while slower data sections stream in, creating the impression of instant navigation.

### next/image for All Images

The `next/image` component automatically optimizes images — resizing, converting to WebP, and lazy-loading. Profile photos and medical assets are always served at the correct resolution for the device.

### URL-Based Filter State

List page filters are stored in URL search params rather than React state. The server fetches and renders the filtered result directly without requiring client-side JavaScript to re-fetch after hydration.

### API Call Optimization

- All list endpoints use pagination — no unbounded data fetching
- The notification unread count is fetched from a lightweight dedicated endpoint, keeping the header fast
- Doctor search input uses a `useDebounce` hook to avoid API calls on every keystroke
- File uploads use presigned S3 URLs from `/uploads/presigned-url` so files go directly to S3 without passing through the Next.js server

### Bundle Optimization

- `"use client"` is added only to components that genuinely need interactivity — the majority remain Server Components
- Recharts (chart library) is loaded only on pages that need charts, using `next/dynamic` with `ssr: false`
- shadcn/ui components are tree-shaken — only used components are included in the bundle
- Third-party libraries are evaluated against bundle size cost before being adopted

---

## 15. Security Considerations

### Middleware-Level Route Protection

Next.js Middleware runs at the edge before any page or component renders. It validates the JWT from the cookie and checks the role claim. Unauthorized users never receive protected page HTML — they are redirected before the page renders.

### Cookie-Based JWT Security

Tokens are stored exclusively in HttpOnly cookies set by the backend. JavaScript in the browser cannot read, modify, or steal these tokens. This eliminates the entire class of XSS-based token theft that affects `localStorage`-based storage.

The `refreshToken` cookie is scoped to the refresh endpoint path only, so the browser never sends it on general API calls.

### CSRF Protection

Cookies are set with `SameSite=Strict`, providing first-line CSRF defense. For state-changing requests, a CSRF token header can be added by the `fetchWithAuth()` utility. Next.js Route Handlers used as a proxy add an additional server-side validation layer.

### XSS Prevention

- React's JSX rendering auto-escapes all dynamic content by default
- `dangerouslySetInnerHTML` is never used for user-generated content
- Content Security Policy (CSP) headers are configured in `next.config.js`
- User-submitted content (review comments, appointment notes) is rendered as plain text

### Input Handling

- Zod validates all form inputs client-side before submission
- File uploads validate type and size on the client before requesting a presigned URL
- The frontend does not rely solely on client-side validation — all server error responses are handled gracefully

### Route Security — Three Layers

1. **Middleware** — Edge-level JWT validation and role check before the page renders
2. **Server Components** — Re-validate the session server-side when fetching page data
3. **Backend API** — Every endpoint independently validates the token and role

No single layer is the only gatekeeper.

### Sensitive Data Handling

- Passwords are never stored, logged, or held in component state beyond form submission
- API response logging is disabled in production builds
- Medical record file URLs are treated as sensitive and not exposed in unauthorized views
- Server-only environment variables (no `NEXT_PUBLIC_` prefix) store API keys and secrets

---

## 16. Future Enhancements

### Features to Add Later

**Real-time Notifications** — Replace polling with WebSocket or Server-Sent Events (SSE). Next.js Route Handlers support streaming responses for SSE natively.

**In-App Chat / Messaging** — Secure patient-to-doctor messaging using WebSocket for real-time delivery and the database for message persistence.

**Telemedicine / Video Consultation** — Integration with a video SDK (Daily.co or Twilio Video) for virtual appointments directly within the portal.

**Appointment Reminders** — Email and SMS reminders at 24 hours and 1 hour before appointments. Web push notifications via Service Workers.

**Doctor Search & Filter Enhancements** — Filter by specialty, location, rating, gender, and language. Map-based doctor discovery using Mapbox or Google Maps.

**Patient Health Dashboard** — Visual trend charts for weight, blood pressure, and other tracked metrics synced with medical records.

**Prescription Management** — Doctors issue digital prescriptions from the appointment detail page, downloadable by patients as signed PDFs.

**Multi-Language Support (i18n)** — Next.js built-in i18n routing for English, Hindi, and Gujarati with route-based locale switching.

**Dark Mode** — System-preference-aware dark mode using Tailwind's `dark:` variant, with a manual toggle stored in a cookie for SSR consistency.

**PWA Support** — Progressive Web App manifest and Service Worker for offline access to previously viewed appointments and records.

**Parallel Routes** — For the admin dashboard, use Next.js parallel routes to display multiple data panels simultaneously without blocking navigation.

### UI/UX Improvements

- Onboarding tour for first-time users using a step-by-step overlay
- Contextual help tooltips on complex form fields
- Optimistic UI for appointment status changes — the badge updates instantly before the server confirms
- Micro-animations for state transitions using Framer Motion
- Keyboard shortcut support for power users (doctors quickly navigating their schedule)
- Command palette (Cmd+K) for quick navigation across the entire app

---

## Summary

| Area | Decision |
|------|----------|
| Framework | Next.js 14 (App Router) |
| UI Library | shadcn/ui + Tailwind CSS |
| Auth Strategy | HttpOnly Cookie (JWT) + Next.js Middleware |
| State Management | Zustand (global) + React Hook Form (forms) + URL params (filters) |
| Form Validation | React Hook Form + Zod |
| Routing | App Router with Route Groups per role |
| Data Fetching | Server Components (SSR) + SWR / TanStack Query (client mutations) |
| API Layer | Typed async functions per backend module in `lib/api/` |
| Error Handling | `fetchWithAuth()` utility + local form error mapping via `setError()` |
| Styling | Tailwind CSS with custom design tokens |
| Charts | Recharts (lazy-loaded via `next/dynamic`) |
| Total Pages | 32 |
| Total API Endpoints | 65 |
| User Roles | 3 (Patient, Doctor, Admin) |
