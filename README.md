# The Counsel — Law Firm Case Management System

A polished, **frontend-only** case management platform for a modern law firm.
No backend, database, or real authentication — everything runs on hardcoded
sample data so you can explore a complete, production-looking interface.

> Aesthetic: editorial prestige — warm parchment surfaces, deep ink-navy, brass
> accents, *Fraunces* display serif + *Hanken Grotesk* body.

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173). The app opens on
the **login screen** — any email/password signs you in (no real auth).

To build for production:

```bash
npm run build
npm run preview
```

## What's inside

### Authentication (UI only)
- **Login** — credentials prefilled, password reveal, "remember me"
- **Register** — name, email, role, password, terms
- **Forgot password** — email + sent confirmation state
- **Reset password** — new password with a live strength meter

### Application
| Page | Route | Highlights |
|------|-------|-----------|
| Dashboard | `/app` | Case stats, caseload-by-status, upcoming hearings, tasks, reminders |
| Cases | `/app/cases` | Search + status/practice filters, full matter table |
| Case detail | `/app/cases/:id` | Client, team, hearings, documents, tasks, notes, timeline tabs + upload UI |
| Clients | `/app/clients` | Individual & corporate cards, search/filter |
| Hearings & Calendar | `/app/hearings` | Month calendar + agenda view, event-type filters |
| Documents | `/app/documents` | Upload dropzone (UI), searchable file table |
| Tasks & Deadlines | `/app/tasks` | Live checkboxes, overdue tracking, priorities |
| Lawyers & Staff | `/app/staff` | Team roster with role filters & win rates |
| Notifications | `/app/notifications` | Reminders for hearings & deadlines |
| Settings | `/app/settings` | Profile, **role-based access (Admin/Lawyer/Staff)**, notifications, security |

### Case statuses
`Open` · `Pending` · `In Court` · `Closed` · `Won` · `Lost` — each with its own color treatment.

## Tech
- **React 18** + **React Router 6**
- **Vite** build tooling
- Hand-written CSS design system (`src/styles.css`) — no UI framework
- Inline SVG icon set (`src/components/Icons.jsx`)
- All sample data in `src/data/sampleData.js`

## Not included (by design)
Real authentication, backend/API, database, file storage, and payments are
intentionally **not** implemented. This is a frontend prototype only.
