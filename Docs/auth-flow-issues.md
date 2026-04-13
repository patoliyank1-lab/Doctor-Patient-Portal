## Issues found (current auth flow)

- **Login/Logout placeholders**: `POST /auth/login` and `POST /auth/logout` were returning `501 Not Implemented`, so authentication could not work end-to-end.

- **User enumeration risk**: Distinguishing between “user not found” and “wrong password” leaks which emails exist.
  - **Fix applied**: Always run a bcrypt comparison (using a dummy hash when the user doesn’t exist) and return a generic `"Invalid credentials"` message.

- **Validation errors not standardized**: Zod validation errors were not mapped to the required response shape: `{ success, message, data, errors }`.
  - **Fix applied**: Convert `ZodError` into `AppError("Validation failed", 400, { errors: [...] })` so errors return as an array of messages.

- **Logout didn’t clear cookies**: There was no reusable cookie-clearing helper, so logout couldn’t reliably remove auth cookies.
  - **Fix applied**: Added `clearAuthCookies()` using the same cookie options used during cookie setting.

- **Duplicate email handling too broad in registration**: Any `PrismaClientKnownRequestError` was treated as “already registered”, which could mask other DB issues.
  - **Fix applied**: Only treat Prisma error code `P2002` as a duplicate email conflict; other errors bubble as unknown/internal errors.

