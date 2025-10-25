# Frontend ⇄ Backend Endpoint Mapping

This file documents how the frontend service methods map to backend API routes and which environment variables are required.

## Important env variables
- VITE_API_BASE
  - Example: `http://localhost:3001/api`
  - Must point to backend API root (note `/api` prefix used by backend server)
- VITE_MOCK
  - `true` to run frontend without backend (uses mock responses)

## Auth
- Frontend method: `authApi.signup(payload)`
  - Backend: `POST /api/auth/register`
  - Payload: `{ name, email, password, user_type, phone? }`

- Frontend method: `authApi.login(payload)`
  - Backend: `POST /api/auth/login`
  - Payload: `{ email, password }`

- Frontend method: `authApi.logout()`
  - Backend: `POST /api/auth/logout`

- Frontend method: `authApi.me()`
  - Backend: `GET /api/auth/me`

## Users
- Frontend method: `userApi.getProfile()`
  - Backend: `GET /api/users/profile`

- Frontend method: `userApi.updateProfile(payload)`
  - Backend: `PUT /api/users/profile`
  - Payload fields supported: `name, phone, about_me, city, state, country, languages, gender`

- Frontend method: `userApi.uploadAvatar(file)`
  - Backend: `POST /api/users/upload-profile-picture` (multipart/form-data with field `profile_picture`)

- Frontend method: `userApi.deleteAvatar()`
  - Backend: `DELETE /api/users/profile-picture`

## Properties
- Frontend method: `propertyApi.search(params)`
  - Backend: `GET /api/properties/search`
  - Query params: `location, check_in_date, check_out_date, guests, min_price, max_price, property_type, page, limit, sort_by`, etc.

- Frontend method: `propertyApi.details(id)`
  - Backend: `GET /api/properties/:id`

- Frontend method: `propertyApi.add(payload)`
  - Backend: `POST /api/properties` (Owner only)

- Frontend method: `propertyApi.update(id, payload)`
  - Backend: `PUT /api/properties/:id` (Owner only)

- Image upload: `POST /api/properties/:id/upload-images` (multipart form `images[]`)

## Bookings
- Frontend method: `bookingApi.create({ propertyId, startDate, endDate, guests })`
  - Backend: `POST /api/bookings`
  - Transformed payload: `{ property_id, check_in_date, check_out_date, number_of_guests }`

- Frontend method: `bookingApi.listTraveler(params)`
  - Backend: `GET /api/bookings/traveler/my-bookings`
  - Query params: `page, limit, status`

- Frontend method: `bookingApi.listOwnerRequests(params)`
  - Backend: `GET /api/bookings/owner/incoming-requests`

- Frontend method: `bookingApi.get(id)`
  - Backend: `GET /api/bookings/:id`

- Frontend method: `bookingApi.accept(id)`, `bookingApi.reject(id)`, `bookingApi.cancel(id)`
  - Backend: `PATCH /api/bookings/:id/accept`  (owner)
  - Backend: `PATCH /api/bookings/:id/reject`  (owner)
  - Backend: `PATCH /api/bookings/:id/cancel`  (owner or traveler)

## Favorites
- Frontend method: `favoriteApi.list()`
  - Backend: `GET /api/favorites`

- Frontend method: `favoriteApi.check(propertyId)`
  - Backend: `GET /api/favorites/check/:propertyId`

- Frontend method: `favoriteApi.add(propertyId)`
  - Backend: `POST /api/favorites` (body `{ property_id }`)

- Frontend method: `favoriteApi.remove(propertyId)`
  - Backend: `DELETE /api/favorites/:propertyId`

- Frontend method: `favoriteApi.toggle(propertyId)`
  - Convenience wrapper: checks current status and adds/removes accordingly.

## Notes and verification tips
- The frontend's Axios instance is created with `withCredentials: true` so sessions (cookies) are preserved between frontend and backend; make sure backend CORS allows credentials and the origin is correct.
- Ensure `VITE_API_BASE` matches backend server, including the `/api` prefix (the backend mounts routes on `/api/*`).
- Use `VITE_MOCK=true` to run UI without backend for early UI work.

If you'd like, I can now:
- Update any frontend call sites that still use old endpoint shapes (I've already updated the central `src/services/api.js`).
- Run a quick smoke test (fetch `/health` or call `authApi.me()`) and report results.
