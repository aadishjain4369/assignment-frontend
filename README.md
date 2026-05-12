# Webhook dashboard — frontend

React (Vite + TypeScript) UI for the webhook backend: **auth**, **subscription management**, **event history**, and a **live ingest log** via Server-Sent Events.

**Repository:** [github.com/aadishjain4369/assignment-frontend](https://github.com/aadishjain4369/assignment-frontend)

```bash
git clone https://github.com/aadishjain4369/assignment-frontend.git
cd assignment-frontend
```

---

## How this maps to the assignment

| Requirement | What we implemented |
|-------------|---------------------|
| Sign up / log in | **`Register`** and **`Login`** routes; forms post to **`/api/auth`**; JWT stored client-side (**`localStorage`**) and attached by **`api/client.ts`**. |
| Subscribe | Modal collects **source** (logical label for the sender/integration) and optional **callback URL** where the backend delivers outbound webhooks; submits to the backend subscribe endpoint. |
| List subscriptions | Dashboard **Subscriptions** card loads **`GET /api/webhooks/subscriptions`** and renders sources, keys, callback URLs, signing state. |
| Incoming events | **Event history** panel loads paginated feed from the API; shows payload metadata and stored fields. |
| JWT for frontend | All dashboard calls use **`Authorization: Bearer`** from stored token; unauthenticated users route to login. |
| Real-time log | **`EventSource`** connects to backend **SSE** endpoint with token passed as a **query parameter** (browser **`EventSource`** cannot set custom headers). |
| Dashboard UX | Ant Design **tables**, **modals** (add subscription, signing secret reveal), **actions** for cancel / signing where exposed by API. |

---

## Requirements

- **Node.js** 18+

---

## Local setup

### 1. Install

```bash
npm install
```

### 2. Environment

Default API base: **`http://localhost:4000`**.

```bash
cp .env.example .env   # optional
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend origin without trailing slash (e.g. `http://127.0.0.1:4000`). |

### 3. Dev / build

```bash
npm run dev      # default port 5173
npm run build && npm run preview
```

Backend **`FRONTEND_ORIGIN`** must allow this origin (default **`http://localhost:5173`**).

---

## Using the app with the backend

1. Start API + MongoDB (see backend README).
2. **Register** or **log in** — JWT is saved for subsequent requests.
3. **Add subscription** — source + optional callback URL; copy **ingest key** from the list for **`POST /api/webhooks/events`**.
4. Generate test traffic with backend **`npm run simulate-webhooks`** or any HTTP client POSTing to ingest (**`scripts/README.md`** on the backend).
5. Enable **signing** in the UI if you want HMAC verification on inbound requests; store the shown secret securely.
6. Watch **event history** and the **live stream** when SSE is connected.

---

## Implementation notes

- **`src/pages/`** — Route shells only (**`<Dashboard />`**, login/register pages).
- **`src/components/dashboard/`** — State, data fetching, SSE lifecycle, and split UI (**header**, subscriptions, history, modals).
- **`src/components/login/`** — Shared login/register composition.
- **`src/api/client.ts`** — Shared **`fetch`**, JWT injection, error handling.

**Why SSE + query token:** Spec-compliant **`EventSource`** does not support **`Authorization`** headers; the backend accepts the same JWT via query string for the stream only.

---

## Backend dependency

This app expects the webhook backend’s auth, subscription, feed, ingest, and SSE routes. Clone and run that service first; override **`VITE_API_URL`** when not using **`localhost:4000`**.
