# HostIQ Frontend

This is a React (Vite) frontend for the HostIQ platform. It targets the backend running at http://localhost:3001.

Features implemented:
- Traveler: signup/login, profile with avatar upload, search, property details, booking request, favorites, trips/history, Agent AI button
- Owner: signup/login, host dashboard (pending + history), accept/cancel, add property form
- Axios service with cookie-based sessions, Bootstrap UI, responsive layout

Run locally:
1. Install deps
2. Start dev server on port 3000

Environment:
- VITE_API_BASE can override API base (default http://localhost:3001/api)
