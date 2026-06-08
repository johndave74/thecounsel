# The Counsel — Backend API

Production-grade REST API for the **Counsel** law-firm case-management system.
Backs every feature of the React frontend: authentication, users/staff, clients,
cases, hearings, documents (with real file upload/download), tasks, notes,
timeline, notifications, and dashboard analytics.

## Stack

- **Node.js ≥ 22.5** + **Express 4**
- **SQLite** via the built-in `node:sqlite` module — a real embedded SQL
  database with **zero native compilation** (WAL mode, foreign keys enforced)
- **JWT** access tokens + rotating **refresh tokens** (only hashes stored)
- **bcrypt** password hashing
- **Zod** request validation, **Helmet**, **CORS**, **rate limiting**,
  **compression**, **morgan** logging
- **Multer** disk-backed file uploads
- **Vitest + Supertest** integration tests (46 tests)

## Quick start

```bash
cd server
cp .env.example .env        # then edit secrets
npm install
npm run seed                # populate the demo dataset (idempotent)
npm run dev                 # http://localhost:4000  (auto-reload)
```

The database auto-creates and auto-seeds on first boot, so `npm start` alone
also works. Health check: `GET /api/health`.

**Interactive API docs:** with the server running, open
<http://localhost:4000/api/docs> for Swagger UI, or fetch the raw OpenAPI 3.1
spec at `GET /api/openapi.json`.

### Demo credentials

All seeded users share the password **`demo1234`**. The managing partner (Admin):

```
a.okonkwo@counsel.law / demo1234
```

Others: `j.mercer@`, `p.nair@`, `m.reyes@` (Lawyer), `h.bloom@`, `d.foster@`
(Staff) — all `@counsel.law`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with `--watch` auto-reload |
| `npm start` | Start the server |
| `npm run migrate` | Apply the schema (idempotent) |
| `npm run seed` | Seed demo data (skips if already populated; `-- --force` to wipe) |
| `npm run reset` | Wipe + reseed |
| `npm test` | Run the Vitest suite |

## Environment

| Var | Default | Notes |
|-----|---------|-------|
| `PORT` | `4000` | |
| `NODE_ENV` | `development` | `production` enforces strong JWT secrets |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:4173` | comma-separated allowlist |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | dev defaults | **required & validated in production** |
| `ACCESS_TOKEN_TTL` | `15m` | |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | |
| `BCRYPT_ROUNDS` | `12` | |
| `DATABASE_PATH` | `./data/counsel.db` | `:memory:` under test |
| `UPLOAD_DIR` | `./data/uploads` | |
| `MAX_UPLOAD_BYTES` | `26214400` (25 MB) | |

In `production`, the server **refuses to start** with weak/identical JWT secrets.

## API reference

Base path: `/api`. All responses are JSON. Errors:
`{ "error": { "message": string, "details"?: [...] } }`.
Authenticated routes require `Authorization: Bearer <accessToken>`.

### Auth — `/api/auth`
| Method | Path | Auth | Body / Notes |
|--------|------|------|------|
| POST | `/register` | — | `{ name, email, password, role?(Lawyer\|Staff), title?, specialty?, phone? }` → user + tokens |
| POST | `/login` | — | `{ email, password }` → user + tokens |
| POST | `/refresh` | — | `{ refreshToken }` → rotated tokens |
| POST | `/logout` | — | `{ refreshToken }` revokes it |
| GET | `/me` | ✓ | current user |
| POST | `/change-password` | ✓ | `{ currentPassword, newPassword }` (revokes other sessions) |
| POST | `/forgot-password` | — | `{ email }` → always 200; returns `resetToken` in non-prod |
| POST | `/reset-password` | — | `{ token, password }` |

### Users / staff — `/api/users`  (all require auth)
`GET /` (`?role=`) · `GET /:id` · `POST /` *(Admin)* · `PATCH /:id` *(Admin)* ·
`DELETE /:id` *(Admin, soft-delete / deactivate)*

### Clients — `/api/clients`
`GET /` (`?search=&type=`) · `GET /:id` · `POST /` · `PATCH /:id` ·
`DELETE /:id` *(Admin; blocked if the client has cases)*

### Cases — `/api/cases`
`GET /` (`?search=&status=&practice=`) · `GET /:id` · `POST /` · `PATCH /:id` ·
`DELETE /:id` *(Admin)*
- `POST /:id/lawyers` `{ lawyerId }` · `DELETE /:id/lawyers/:lawyerId`
- `GET /:id/hearings` · `GET /:id/documents` · `GET /:id/tasks` · `GET /:id/timeline`
- `GET /:id/notes` · `POST /:id/notes` `{ text }`

Creating a case auto-adds a *"Case opened"* timeline entry; moving to a terminal
status (`Won`/`Lost`/`Closed`) auto-sets progress to 100.

### Hearings — `/api/hearings`
`GET /` (`?caseId=&type=&from=&to=`) · `GET /:id` · `POST /` · `PATCH /:id` ·
`DELETE /:id`. Scheduling/updating non-deadline events recomputes the parent
case's `nextHearing`.

### Documents — `/api/documents`
`GET /` (`?caseId=&search=&category=`) · `GET /:id` ·
`POST /` *(multipart: `file` + `caseId` + `category?`)* ·
`GET /:id/download` · `DELETE /:id` *(Admin or uploader)*

### Tasks — `/api/tasks`
`GET /` (`?caseId=&assigneeId=&done=&overdue=true`) · `GET /:id` · `POST /` ·
`PATCH /:id` · `POST /:id/toggle` · `DELETE /:id`

### Notifications — `/api/notifications`
`GET /` (`?unread=true`, includes `unreadCount`) · `POST /:id/read` ·
`POST /read-all`

### Dashboard — `/api/dashboard/stats`
Totals, caseload-by-status, win rate, open/overdue tasks, upcoming
hearings/deadlines/tasks, unread notification count.

## Security

- Passwords hashed with bcrypt; hashes never serialized.
- JWT access tokens are short-lived; refresh tokens rotate on use and the
  previous token is revoked (single-use → stolen-token detection).
- Every authenticated request reloads the live user, so deactivated accounts
  lose access immediately regardless of token validity.
- Public registration cannot grant `Admin` (privilege-escalation guard).
- RBAC via role-gated routes; constant-time login defeats account enumeration;
  password-reset responses never reveal whether an email exists.
- Parameterized SQL everywhere; Zod validation on every write; per-route +
  global rate limiting; Helmet headers; strict CORS allowlist.

## Tests

```bash
npm test        # 46 integration tests across auth, cases, and resources
```

## Production deployment

```bash
NODE_ENV=production \
JWT_ACCESS_SECRET=$(openssl rand -hex 48) \
JWT_REFRESH_SECRET=$(openssl rand -hex 48) \
node src/index.js
```

Run behind a TLS-terminating reverse proxy (`trust proxy` is enabled). A
`Dockerfile` is included.
