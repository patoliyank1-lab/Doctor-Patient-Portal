# MediConnect – Doctor–Patient Portal
## Complete Feature List

> **Tech Stack:** Angular · JWT Authentication · Angular Material · REST APIs  
> **Roles:** Patient · Doctor · Admin

---

## 👤 Patient Features

### 1. Authentication
- Sign up with JWT-based registration
- Log in with JWT-based authentication
- Protected route access via Auth Guard

### 2. Appointment Management
- Create a new appointment
- View all appointments (list view)
- Edit an existing appointment
- Delete an appointment
- Reactive Forms with field-level validation

### 3. Profile & Medical Records
- Manage personal information (name, contact, DOB, etc.)
- Manage medical history
- Upload prescriptions / medical reports (file upload)

### 4. Dashboard
- View upcoming appointments
- Quick actions panel (book, cancel, reschedule)

### 5. Notifications
- In-app toast on booking success / failure
- Simulated email / SMS alert on appointment confirmation

---

## 🩺 Doctor Features

### 1. Authentication
- Log in with JWT-based authentication
- Protected route access via Role Guard

### 2. Appointment Management
- View all assigned appointments
- Approve an appointment request
- Reject an appointment request
- Manage availability / weekly schedule

### 3. Patient Records
- View patient personal details
- View patient medical history
- Access patient-uploaded prescriptions and reports

### 4. Dashboard
- Today's schedule overview
- Pending approvals panel

### 5. Notifications
- In-app toast on appointment approval / rejection action

---

## 🛡️ Admin Features

### 1. Authentication
- Log in with JWT-based authentication
- Protected route access via Role Guard

### 2. Dashboard & Analytics
- Total registered patients count
- Total registered doctors count
- Total appointments count
- Analytics charts (appointments, registrations over time)
- Reports table view (filterable, sortable)

---

## ⚙️ Shared / Technical Features

### State Management
- Centralized state for authentication (login session, token)
- Centralized state for appointments (list, status updates)
- Centralized state for notifications (toast queue)

### HTTP Interceptors
- Logging interceptor — logs all outgoing API requests
- Error interceptor — handles 401 Unauthorized and 403 Forbidden globally

### UI / UX
- Angular Material component library
- Sidebar navigation (Dashboard · Appointments · Profile · Logout)
- Responsive layout for desktop and mobile (CSS Grid / Flexbox)
- Medical theme design (blue and white color palette)
- Cards for appointment listings
- Tables for reports and analytics data

---

## 📊 Feature Count Summary

| Role / Area        | Feature Count |
|--------------------|---------------|
| Patient            | 15            |
| Doctor             | 12            |
| Admin              | 5             |
| Shared / Technical | 10            |
| **Total**          | **42**        |

---

## 🗂️ Module Summary

| # | Module                        | Roles Involved         |
|---|-------------------------------|------------------------|
| 1 | Authentication & Authorization | Patient, Doctor, Admin |
| 2 | Appointment Management         | Patient, Doctor        |
| 3 | Profile & Medical Records      | Patient, Doctor        |
| 4 | Dashboard & Analytics          | Patient, Doctor, Admin |
| 5 | Notifications                  | Patient, Doctor        |
| 6 | UI / UX                        | All                    |
| 7 | State Management & Interceptors| All (Technical)        |