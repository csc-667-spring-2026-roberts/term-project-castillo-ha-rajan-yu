# Gator Tycoons — Monopoly
CSC 667 Term Project — Spring 2026

## Team Members

| Name | GitHub | Email |
|------|--------|-------|
| Daniel Castillo | dacastillo516 | dcastillo8@sfsu.edu |
| Ryan Yu | ryanyu26 | ryu5@sfsu.edu |
| Galvin Ha | GalvinHa | gha1@sfsu.edu |
| Tejas Rajan | TejasRajan98 | trajan@sfsu.edu |

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev
```

## Scripts

- `npm run dev` — Start development server with hot reload
- `npm run build` — Compile TypeScript
- `npm start` — Run compiled server
- `npm run lint` — Check for lint errors
- `npm run lint:fix` — Auto-fix lint errors
- `npm run format` — Format code with Prettier

## M4 Checklist Markers

- M4: Express installed/configured in `src/server.ts`.
- M4: Basic home route handling in `src/routes/home.ts`.
- M4: Static file serving in `src/server.ts` via `express.static(...)`.
- M4: Dev hot-reload workflow via `npm run dev` in `package.json`.
- M4 (process): each team member should clone and run locally with `npm install` + `npm run dev`.

## M5 Checklist Markers

- M5 (process): PostgreSQL installed/running locally for each team member.
- M5: pg-promise connection in `src/db/connection.ts`.
- M5: `DATABASE_URL` loaded from `.env`, and `.env` is ignored in `.gitignore`.
- M5 (artifact): ER diagram should be provided separately (dbdiagram.io/draw.io/paper).
- M5: test DB read/write routes in `src/routes/test.ts` (GET + POST).

## M6 Checklist Markers

- M6: users table includes `email`, `password_hash`, and `created_at` via migrations.
- M6: registration route `POST /auth/register` in `src/routes/auth.ts`.
- M6: login route `POST /auth/login` in `src/routes/auth.ts`.
- M6: logout route `POST /auth/logout` in `src/routes/auth.ts`.
- M6: session persistence via `connect-pg-simple` in `src/server.ts`.
- M6: auth middleware protecting routes in `src/middleware/auth.ts`.

## M7 Checklist Markers

- M7: EJS configured as view engine in `src/server.ts`.
- M7: shared structure currently duplicated per page (head/nav shell repeated in auth/lobby views).
- M7: registration page form in `views/auth/register.ejs`.
- M7: login page form in `views/auth/login.ejs`.
- M7: authenticated landing page in `views/lobby.ejs`.
- M7: auth routes render/redirect flow in `src/routes/auth.ts`.
- M7: auth middleware redirects browser requests to login in `src/middleware/auth.ts`.

## M8 Checklist Markers

- M8: esbuild setup in `package.json` (`build:client`, `dev:client`).
- M8: client TypeScript loaded via `<script defer>` in `views/lobby.ejs`.
- M8: `fetch()` calls in `src/client/lobby.ts` (`GET /api/games`, `POST /api/games`).
- M8: `<template>` cloning + DOM updates in `views/lobby.ejs` + `src/client/lobby.ts`.
- M8: dev workflow watches server+client via `npm run dev` in `package.json`.
- M8: live reload configured in `src/server.ts` using `livereload` + `connect-livereload`.
