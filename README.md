## Webhook Dashboard — Frontend

A React (Vite + TypeScript) dashboard for managing webhooks — built with Ant Design for a polished UI experience.

The app handles **authentication**, lets users manage **webhook subscriptions**, browse **event history**, and watch a **live ingest stream** via Server-Sent Events — all talking to a companion Node.js/Express backend.

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# 1. Clone
git clone https://github.com/aadishjain4369/assignment-frontend.git
cd assignment-frontend

# 2. Install dependencies
npm install

# 3. (Optional) Set backend URL — defaults to http://localhost:4000
cp .env.example .env

# 4. Start dev server — available at http://localhost:5173
npm run dev
```

> Make sure the backend is running before using the app. See the [backend repo](https://github.com/aadishjain4369/assignment-backend) for setup instructions.

---

## What it does

| Feature | Details |
|---|---|
| **Auth** | Register / login forms; JWT stored in `localStorage` and sent as `Authorization: Bearer` on every API call |
| **Subscriptions** | Add a source + optional callback URL; view ingest keys, signing state, and cancel/manage from the dashboard |
| **Event history** | Paginated feed of received webhook payloads with metadata |
| **Live stream** | Real-time ingest log over SSE — token passed as a query param since `EventSource` doesn't support custom headers |

---

## Project structure

```
src/
├── api/
│   └── client.ts          # Shared fetch wrapper — JWT injection, error handling
├── pages/                 # Route shells: Dashboard, Login, Register
└── components/
    ├── dashboard/         # Subscriptions card, event history, SSE lifecycle, modals
    └── login/             # Shared login/register composition
```

---

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | No | `http://localhost:4000` | Backend origin (no trailing slash) |

---

## Build for production

```bash
npm run build
npm run preview
```