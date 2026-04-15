# Project Documentation
### Doctor Appointment Booking System

> **Version:** 1.0 &nbsp;|&nbsp; **Date:** April 2026 &nbsp;|&nbsp; **Prepared By:** Development Team

---

## Table of Contents

1. [Technical Stack](#1-technical-stack)
2. [Website Pages](#2-website-pages)
3. [Functionality](#3-functionality)

---

## 1. Technical Stack

### 1.1 Frontend

| Technology | Package / Version | Purpose |
|---|---|---|
| Framework | Next.js v16.x | React-based full-stack framework |
| Language | TypeScript v5.x | Type-safe JavaScript |
| Styling | Tailwind CSS v3.x | Utility-first CSS framework |
| UI Components | Radix UI | Accessible headless components (Avatar, Dialog, Tabs, Toast, etc.) |
| Icons | Lucide React | Icon library |
| Forms | React Hook Form + Zod | Form handling & schema validation |
| State Management | Zustand v5.x | Lightweight global state manager |
| Data Fetching | SWR v2.x | Stale-while-revalidate caching |
| Charts | Recharts v3.x | Data visualization & graphs |
| Notifications | Sonner v2.x | Toast notification system |
| Runtime | React 18 | UI rendering engine |

---

### 1.2 Backend

| Technology | Package / Version | Purpose |
|---|---|---|
| Runtime | Bun (latest) | Fast JS/TS runtime with hot reload |
| Framework | Express.js v5.x | HTTP server & API routing |
| Language | TypeScript v6.x | Type-safe server-side code |
| Authentication | JWT + bcrypt | Token-based auth & password hashing |
| Session | Cookie Parser | HTTP cookie management |
| Validation | Zod v4.x | Schema-based input validation |
| Security | Helmet + CORS + Rate Limit | HTTP security hardening |
| Email | Nodemailer v8.x | Transactional email sending |
| File Storage | AWS S3 SDK v3.x | Cloud file storage with presigned URLs |
| Logging | Winston v3.x | Structured server-side logging |
| Unique IDs | UUID v13.x | Unique identifier generation |
| Config | dotenv v17.x | Environment variable management |

---

### 1.3 Database

| Technology | Package / Version | Purpose |
|---|---|---|
| Database | PostgreSQL | Primary relational database |
| ORM | Prisma v7.x | Type-safe database ORM |
| DB Adapter | @prisma/adapter-pg | PostgreSQL driver adapter |
| Migrations | Prisma Migrate | Schema versioning & migrations |
| DB GUI | Prisma Studio | Visual database browser |

---

### 1.4 Stack Summary

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| UI Library | Radix UI, Lucide React |
| State & Data | Zustand, SWR |
| Forms | React Hook Form + Zod |
| Backend | Bun + Express.js + TypeScript |
| Authentication | JWT + bcrypt |
| File Storage | AWS S3 |
| Email | Nodemailer |
| Security | Helmet, CORS, Rate Limiter |
| Database | PostgreSQL + Prisma ORM |

---

## 2. Website Pages

**Total Pages: 24**

| Portal | Pages |
|---|:---:|
| Public Pages | 7 |
| Patient Portal | 7 |
| Doctor Portal | 5 |
| Admin Portal | 5 |
| **Total** | **24** |

---

### 2.1 Public Pages — 7 Pages

| # | Page | Description |
|---|---|---|
| 1 | **Home Page** | Landing page introducing the platform |
| 2 | **About Us Page** | Information about the platform, mission, and team |
| 3 | **Contact Page** | Contact form and customer support details |
| 4 | **Doctors Page** | Browse and filter the full list of verified doctors |
| 5 | **Doctor Profile Page** | Detailed doctor view — qualifications, experience, and reviews |
| 6 | **Login Page** | Unified login entry point for Patients and Doctors |
| 7 | **Registration Page** | New account creation for Patients and Doctors |

---

### 2.2 Patient Portal — 7 Pages

| # | Page | Description |
|---|---|---|
| 8 | **Dashboard** | Overview of upcoming/past appointments and notifications |
| 9 | **Find Doctor** | Search doctors, view profiles, and book appointments |
| 10 | **Appointment Management** | View and cancel upcoming appointments |
| 11 | **Medical Records** | Upload, view, and manage personal medical records |
| 12 | **My Reviews** | Write and manage reviews for doctors |
| 13 | **Notifications** | View all appointment, message, and system notifications |
| 14 | **Profile Management** | Update personal info, medical history, and preferences |

---

### 2.3 Doctor Portal — 5 Pages

| # | Page | Description |
|---|---|---|
| 15 | **Dashboard** | Today's appointments, pending requests, and notifications |
| 16 | **Appointment Management** | Accept, reject, or reschedule appointments |
| 17 | **Availability Management** | Set available time slots and block unavailable times |
| 18 | **Notifications** | View appointment, message, and system notifications |
| 19 | **Profile Management** | Update personal info, qualifications, and experience |

---

### 2.4 Admin Portal — 5 Pages

| # | Page | Description |
|---|---|---|
| 20 | **Dashboard** | System-wide statistics, recent activity, and data charts |
| 21 | **Doctor Management** | Verify, approve, or reject doctor registrations |
| 22 | **Patient Management** | View and block/unblock patient accounts |
| 23 | **Appointment Management** | Monitor all appointments across the system |
| 24 | **Audit Logs** | Review system activity logs for security and compliance |

---

## 3. Functionality

### 3.1 Authentication & Authorization

- User registration for Patients and Doctors with form validation (Zod)
- Secure login with JWT-based authentication and HTTP-only cookies
- Role-based access control (RBAC) for Patient, Doctor, and Admin portals
- Password hashing using bcrypt for secure credential storage
- Session management via Cookie Parser
- Rate limiting on auth endpoints to prevent brute-force attacks
- Email verification on account registration via Nodemailer
- Secure HTTP headers enforced via Helmet

---

### 3.2 Public Features

- Browse and view a full list of all verified doctors
- Filter doctors by specialty, location, or other criteria
- View detailed doctor profile including qualifications, experience, and reviews
- Contact form for user inquiries and platform support
- Fully responsive design across all devices using Tailwind CSS

---

### 3.3 Patient Portal Features

#### Appointments
- Search and filter doctors by name, specialty, and availability
- View doctor profiles and available time slots before booking
- Book appointments with a selected doctor
- View upcoming and past appointments from the dashboard
- Cancel existing appointments
- Receive notifications for appointment confirmations and status updates

#### Medical Records
- Upload personal medical records, stored securely on AWS S3
- View and manage all uploaded medical records
- Presigned URL generation for secure, time-limited file access

#### Reviews
- Write reviews and ratings for doctors after appointments
- View previously submitted reviews
- Edit or manage existing reviews

#### Notifications
- Real-time notifications for appointment status changes
- System and message notifications

#### Profile
- View and update personal information
- Update medical history and health preferences
- Manage account settings

---

### 3.4 Doctor Portal Features

#### Dashboard
- View today's scheduled appointments at a glance
- View pending appointment requests requiring action
- Quick access to profile information and notifications

#### Appointments
- View all upcoming appointments
- Accept or reject incoming appointment requests from patients
- Reschedule existing appointments
- Receive notifications for new and updated appointments

#### Availability
- Set weekly available time slots for patient bookings
- Update or modify existing availability
- Block off specific dates and times as unavailable

#### Profile
- Update personal information (name, contact details)
- Update professional qualifications and experience
- Manage account settings

#### Notifications
- Notifications for new appointment requests, messages, and system updates

---

### 3.5 Admin Portal Features

#### Dashboard
- View real-time system statistics (total doctors, patients, appointments)
- Monitor recent platform activities
- Data visualizations via graphs and charts (Recharts)
- Overview of recent notifications and alerts

#### Doctor Management
- View all doctor profiles registered on the platform
- Review and verify doctor credentials and documents
- Approve or reject new doctor registration requests
- Manage existing doctor accounts

#### Patient Management
- View all patient profiles on the platform
- Block or unblock patient accounts for policy violations
- Monitor patient activity

#### Appointment Management
- View all appointments across the entire system
- Monitor appointment statuses (pending, confirmed, cancelled, completed)

#### Audit Logs
- View a full log of system activities for security monitoring
- Track user actions for compliance purposes
- Filter and search through audit entries

---

### 3.6 System-Wide Features

#### Security
- HTTPS enforced with secure headers (Helmet)
- CORS policy configured for safe cross-origin requests
- Rate limiting on sensitive API endpoints
- Input validation on all forms (Zod — frontend & backend)
- Secure file storage with AWS S3 presigned URLs

#### Notifications
- In-app notification system for all user roles
- Email notifications triggered by key events (Nodemailer)

#### Logging
- Server-side structured logging using Winston
- Audit trail maintained for admin review

#### Performance
- SWR (stale-while-revalidate) for efficient client-side data fetching
- Optimistic UI updates for a smooth user experience

#### Developer Experience
- Hot reload in development (Bun --watch)
- Prisma Studio for database inspection
- TypeScript across both frontend and backend for full type safety

---

*End of Documentation*