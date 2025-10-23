#  Full‑Stack LLM Chat Platform

Production‑ready LLM chat starter with authentication (email/password + Google), onboarding (default org + admin), ChatGPT‑style UI, organization management, credit‑based chat (Gemini), and real‑time notifications. Frontend runs on Vercel, backend on Render, database on PostgreSQL (e.g., Supabase).

---

## Contents
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Run Locally](#run-locally)
- [Deployment](#deployment)
  - [Backend on Render](#backend-on-render)
  - [Frontend on Vercel](#frontend-on-vercel)
  - [CORS & OAuth Notes](#cors--oauth-notes)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)

---

## Architecture
- Frontend: React + Vite + Redux Toolkit + TailwindCSS. Routes: `/`, `/login`, `/signup`, `/orgs`.
- Backend: Node + Express + Socket.IO, modules: `auth`, `chat`, `orgs`, `notifications`.
- PostgreSQL: users, orgs, user_org_roles, chat_sessions, chat_messages, notifications, credits_ledger, org_invites.
- LLM: Gemini via `@google/generative-ai` (server side).

Request flow: REST for CRUD and LLM; Socket.IO for realtime notifications; Google OAuth (server redirect) → frontend receives `#token` and stores it.

---

## Tech Stack
- FE: React 18, Redux Toolkit, React Router, Tailwind, Vite
- BE: Node 20+, Express 5, Socket.IO 4, Passport (Google), `pg`
- Infra: Vercel (FE), Render (BE), PostgreSQL

---

## Features
- Auth & Onboarding: email/password + Google; first signup creates default organization and assigns Admin; token persisted so refresh doesn’t log out.
- Chat & Credits: ChatGPT‑style UI with markdown, copy, thumbs up/down, typing indicator; persistent sessions/messages; fixed 10‑credit deduction per message (swap to token‑based easily).
- Organizations: list/create/rename; set active org (sidebar switcher); invite members; update role (admin/member) and remove member; cannot demote/remove self; safety admin restore.
- Notifications: realtime (global & per‑user), panel opens on bell, history load, mark read/mark all.

---

## Local Setup
Prereqs: Node 20+, npm, PostgreSQL URL, Google OAuth 2.0 Client (Web application).

Clone
```bash
git clone <your-repo-url>
cd <repo-folder>
```

### 1) Backend env (./backend/.env)
```ini
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require
# If your provider requires TLS but URL lacks sslmode, set:
# DATABASE_SSL=true
JWT_SECRET=<long_random_string>
CORS_ORIGIN=http://localhost:5173
GEMINI_API_KEY=<gemini_key>
GOOGLE_CLIENT_ID=<google_client_id>
GOOGLE_CLIENT_SECRET=<google_client_secret>
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### 2) Frontend env (./frontend/.env)
```ini
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

---

## Database Schema
Apply once (full SQL in `backend/sql/001_init.sql`). Tables include:
- users, orgs, user_org_roles
- chat_sessions, chat_messages
- notifications, credits_ledger, org_invites

Indexes on common FK columns are included.

---

## Run Locally
Backend
```bash
cd backend
npm ci
npm run dev
# http://localhost:3000
```
Frontend
```bash
cd frontend
npm ci
npm run dev
# http://localhost:5173
```

---

## Deployment

### Backend on Render
- Root Directory: `backend`
- Build Command: `npm ci && npm run build`
- Start Command: `node dist/server.js`
- Runtime: Node 20+
- Health Check Path: `/api/health`

Required env on Render (no secrets committed):
```ini
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB?sslmode=require
# or DATABASE_SSL=true (if sslmode not present)
JWT_SECRET=<long_random_string>
CORS_ORIGIN=https://<your-frontend-domain>, http://localhost:5173
GEMINI_API_KEY=<gemini_key>
GOOGLE_CLIENT_ID=<id>
GOOGLE_CLIENT_SECRET=<secret>
GOOGLE_CALLBACK_URL=https://<your-backend-domain>/api/auth/google/callback
```

### Frontend on Vercel
- Root Directory: `frontend`
- Build Command: `npm ci && npm run build`
- Output Directory: `dist`

Env on Vercel:
```ini
VITE_API_URL=https://<your-backend-domain>/api
VITE_SOCKET_URL=https://<your-backend-domain>
```

SPA rewrite (deep links)
Create `frontend/vercel.json`:
```json
{
  "rewrites": [ { "source": "/(.*)", "destination": "/" } ]
}
```

---

## CORS & OAuth Notes
- CORS uses an allowlist (comma‑separated). Exact origins only; no paths/trailing slashes.
- Google OAuth: `Authorized redirect URI` must equal `GOOGLE_CALLBACK_URL`. Start flow from `/api/auth/google`.
- After OAuth success, backend redirects to `CORS_ORIGIN/login#token=...`; frontend parses and stores the token.

---

## Troubleshooting
- CORS preflight 500 / missing header → ensure origin matches `CORS_ORIGIN`.
- DB `ENETUNREACH` → use public PG endpoint; add `sslmode=require` or `DATABASE_SSL=true`.
- OAuth `redirect_uri_mismatch` or `invalid_request: scope` → verify callback URI and start flow from `/api/auth/google`.
- SPA 404 on `/login#token=...` → add Vercel rewrite above.

---

## Roadmap
- Token‑based credit metering; rate limits per org.
- RAG (pgvector) and citations.
- Admin console & audit logs.
- Tests and CI/CD.

---

## License
MIT
