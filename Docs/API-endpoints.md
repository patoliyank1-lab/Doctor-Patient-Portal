Here are all the API endpoints for MediConnect, grouped by module:

---

## Base URL
```
/api/v1
```

---

## 1. Auth Endpoints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/auth/register` | Public | Register as patient or doctor |
| `POST` | `/auth/login` | Public | Login, returns JWT |
| `POST` | `/auth/logout` | Auth | Invalidate token |
| `POST` | `/auth/verify-email` | Public | Verify email via token |
| `POST` | `/auth/forgot-password` | Public | Send reset password email |
| `POST` | `/auth/reset-password` | Public | Reset password via token |
| `GET` | `/auth/me` | Auth | Get current logged-in user |

---

Here’s your **updated and cleaned Doctor Endpoints table** with better structure, consistency, and scalability 👇

---

## 🩺 2. Doctor Endpoints (Updated)

| Method | Endpoint       | Access      | Description               |
| ------ | -------------- | ----------- | ------------------------- |
| `GET`  | `/doctors`     | Public/Auth | List all approved doctors |
| `GET`  | `/doctors/:id` | Public/Auth | Get single doctor profile |

---
c
### 🔐 Admin Actions

| Method | Endpoint              | Access | Description                                   |
| ------ | --------------------- | ------ | --------------------------------------------- |
| `GET`  | `/doctors/pending`    | Admin  | List doctors pending approval                 |
| `PUT`  | `/doctors/:id/status` | Admin  | Update doctor status (approve/reject/suspend) |

---

### 👨‍⚕️ Doctor Self Management

| Method | Endpoint            | Access | Description           |
| ------ | ------------------- | ------ | --------------------- |
| `GET`  | `/doctors/me`       | Doctor | Get own profile       |
| `POST` | `/doctors/me`       | Doctor | Create doctor profile |
| `PUT`  | `/doctors/me`       | Doctor | Update own profile    |
| `PUT`  | `/doctors/me/image` | Doctor | Update profile image  |



---

## 3. Patient Endpoints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/patients` | Admin | List all patients |
| `GET` | `/patients/:id` | Admin / Doctor | Get patient profile |
| `GET` | `/patients/profile` | Patient | Get own profile |
| `PUT` | `/patients/profile` | Patient | Update own profile |
| `PUT` | `/patients/profile/image` | Patient | Upload profile image |

---

## 4. Availability Slots Endpoints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/slots` | Doctor | Create single slot |
| `POST` | `/slots/bulk` | Doctor | Create multiple slots at once |
| `GET` | `/slots/my` | Doctor | Get own slots |
| `GET` | `/slots/:doctorId` | Patient | Get available slots for a doctor |
| `DELETE` | `/slots/:id` | Doctor | Delete unbooked slot |

---

## 5. Appointment Endpoints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/appointments` | Patient | Book appointment |
| `GET` | `/appointments/my` | Patient / Doctor | Get own appointments |
| `GET` | `/appointments/:id` | Auth | Get single appointment detail |
| `PUT` | `/appointments/:id/cancel` | Patient | Cancel own appointment |
| `PUT` | `/appointments/:id/approve` | Doctor | Approve appointment |
| `PUT` | `/appointments/:id/reject` | Doctor | Reject with reason |
| `PUT` | `/appointments/:id/complete` | Doctor | Mark as completed |
| `PUT` | `/appointments/:id/notes` | Doctor | Add doctor notes |
| `GET` | `/appointments` | Admin | List all appointments |

---

## 6. Medical Records Endpoints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/medical-records` | Patient / Doctor | Upload new record |
| `GET` | `/medical-records/my` | Patient | Get own records |
| `GET` | `/medical-records/patient/:patientId` | Doctor | View patient's records |
| `GET` | `/medical-records/:id` | Auth | Get single record |
| `DELETE` | `/medical-records/:id` | Patient | Soft delete own record |

---

## 7. Notifications Endpoints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/notifications` | Auth | Get own notifications |
| `GET` | `/notifications/unread-count` | Auth | Get unread count |
| `PUT` | `/notifications/:id/read` | Auth | Mark single as read |
| `PUT` | `/notifications/read-all` | Auth | Mark all as read |
| `DELETE` | `/notifications/:id` | Auth | Delete notification |

---

## 8. Reviews Endpoints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/reviews` | Patient | Submit review after appointment |
| `GET` | `/reviews/doctor/:doctorId` | Auth | Get all reviews for a doctor |
| `GET` | `/reviews/my` | Patient | Get own submitted reviews |
| `DELETE` | `/reviews/:id` | Patient / Admin | Delete review |

---

## 9. Admin Endpoints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/admin/dashboard` | Admin | Full analytics summary |
| `GET` | `/admin/users` | Admin | List all users |
| `PUT` | `/admin/users/:id/deactivate` | Admin | Deactivate any user |
| `PUT` | `/admin/users/:id/activate` | Admin | Reactivate any user |
| `GET` | `/admin/audit-logs` | Admin | View full audit trail |
| `GET` | `/admin/appointments` | Admin | All appointments with filters |
| `GET` | `/admin/analytics/patients` | Admin | Patient growth stats |
| `GET` | `/admin/analytics/doctors` | Admin | Doctor stats by specialization |
| `GET` | `/admin/analytics/appointments` | Admin | Appointment trends |

---

## 10. File Upload Endpoints
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/uploads/presigned-url` | Auth | Get S3 presigned URL for direct upload |
| `DELETE` | `/uploads/file` | Auth | Delete file from S3 |

---

## Summary

| Module | Total Endpoints |
|--------|----------------|
| Auth | 7 |
| Doctors | 9 |
| Patients | 5 |
| Availability Slots | 5 |
| Appointments | 9 |
| Medical Records | 5 |
| Notifications | 5 |
| Reviews | 4 |
| Admin | 9 |
| File Upload | 2 |
| **Total** | **65** |

---

Ready to move on to the folder structure or start building individual service modules?