mediconnect-backend/
│
├── src/
│   │
│   ├── config/                        # App-wide configuration
│   │   ├── database.js                # DB connection (mongoose/pg)
│   │   ├── jwt.js                     # JWT secret, expiry config
│   │   ├── s3.js                      # AWS S3 config
│   │   └── env.js                     # Env variable validation
│   │
│   ├── features/                      # Feature modules (one folder per domain)
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.routes.js         # POST /auth/register, /login, /logout, etc.
│   │   │   ├── auth.controller.js     # Request handlers
│   │   │   ├── auth.service.js        # Business logic (token, hashing)
│   │   │   ├── auth.validators.js     # Joi/Zod schema validation
│   │   │   └── auth.middleware.js     # verifyToken, requireAuth
│   │   │
│   │   ├── doctors/
│   │   │   ├── doctor.routes.js       # GET /doctors, PUT /doctors/:id/approve, etc.
│   │   │   ├── doctor.controller.js
│   │   │   ├── doctor.service.js      # Approval, rejection, suspension logic
│   │   │   └── doctor.validators.js
│   │   │
│   │   ├── patients/
│   │   │   ├── patient.routes.js      # GET /patients, PUT /patients/profile, etc.
│   │   │   ├── patient.controller.js
│   │   │   ├── patient.service.js
│   │   │   └── patient.validators.js
│   │   │
│   │   ├── slots/
│   │   │   ├── slot.routes.js         # POST /slots, /slots/bulk, DELETE /slots/:id, etc.
│   │   │   ├── slot.controller.js
│   │   │   ├── slot.service.js        # Bulk creation, conflict detection
│   │   │   └── slot.validators.js
│   │   │
│   │   ├── appointments/
│   │   │   ├── appointment.routes.js  # POST /appointments, PUT /:id/approve, etc.
│   │   │   ├── appointment.controller.js
│   │   │   ├── appointment.service.js # Booking, cancel, status transitions
│   │   │   └── appointment.validators.js
│   │   │
│   │   ├── medical-records/
│   │   │   ├── record.routes.js       # POST /medical-records, GET /my, DELETE /:id, etc.
│   │   │   ├── record.controller.js
│   │   │   ├── record.service.js      # Upload, soft delete, access control
│   │   │   └── record.validators.js
│   │   │
│   │   ├── notifications/
│   │   │   ├── notification.routes.js # GET /notifications, PUT /:id/read, etc.
│   │   │   ├── notification.controller.js
│   │   │   ├── notification.service.js # Create, mark read, delete
│   │   │   └── notification.validators.js
│   │   │
│   │   ├── reviews/
│   │   │   ├── review.routes.js       # POST /reviews, GET /doctor/:id, DELETE /:id, etc.
│   │   │   ├── review.controller.js
│   │   │   ├── review.service.js
│   │   │   └── review.validators.js
│   │   │
│   │   ├── admin/
│   │   │   ├── admin.routes.js        # GET /admin/dashboard, /users, /audit-logs, etc.
│   │   │   ├── admin.controller.js
│   │   │   ├── admin.service.js       # Analytics, user management
│   │   │   └── admin.validators.js
│   │   │
│   │   └── uploads/
│   │       ├── upload.routes.js       # POST /uploads/presigned-url, DELETE /uploads/file
│   │       ├── upload.controller.js
│   │       └── upload.service.js      # S3 presigned URL generation, file deletion
│   │
│   ├── middleware/                    # Shared middleware
│   │   ├── authenticate.js            # JWT verification (used across all features)
│   │   ├── authorize.js               # Role-based access (admin, doctor, patient)
│   │   ├── errorHandler.js            # Global error handler
│   │   ├── notFound.js                # 404 handler
│   │   └── rateLimiter.js             # Rate limiting for public endpoints
│   │
│   ├── utils/                         # Shared utilities
│   │   ├── ApiError.js                # Custom error class
│   │   ├── ApiResponse.js             # Standard response wrapper
│   │   ├── asyncHandler.js            # Try/catch wrapper for async controllers
│   │   ├── email.js                   # Email sender (nodemailer / SES)
│   │   ├── token.js                   # JWT sign/verify helpers
│   │   └── paginate.js                # Pagination helper
│   │
│   └── app.js                         # Express app setup, route mounting
│
├── tests/                             # Tests mirroring features/
│   ├── auth/
│   ├── doctors/
│   ├── patients/
│   ├── slots/
│   ├── appointments/
│   ├── medical-records/
│   ├── notifications/
│   ├── reviews/
│   ├── admin/
│   └── uploads/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── server.js                          # Entry point — starts HTTP server