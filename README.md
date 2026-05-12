# Webhook dashboard — frontend

**Repository:** [github.com/aadishjain4369/assignment-frontend](https://github.com/aadishjain4369/assignment-frontend)

Clone:

```bash
git clone https://github.com/aadishjain4369/assignment-frontend.git
cd assignment-frontend
```

---

## Assignment context

This single-page application serves as the interactive frontend for the **webhook backend**, providing a comprehensive dashboard where users can securely log in, create and manage webhook **subscriptions** (including specifying source labels, optional callback URLs, and whether inbound request signing is required), and easily copy **ingest keys** for integration. Users can browse a detailed **event history** of received webhooks, and—for real-time visibility—connect to a **live event feed** via Server-Sent Events (SSE). The dashboard and backend together form a robust, end-to-end solution demonstrating the secure management and transparent observability of webhook workflows.

---

## Requirements

- **Node.js** 18+ (aligned with Vite 5)

---

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

The app calls the API at **`http://localhost:4000`** by default.

If your backend runs elsewhere, copy the example file:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Base URL of the backend (no trailing slash). Example: `http://127.0.0.1:4000`. |

### 3. Run the dev server

```bash
npm run dev
```

Default Vite port: **5173**. The backend should allow this origin via **`FRONTEND_ORIGIN`** (default `http://localhost:5173`).

### 4. Production build

```bash
npm run build
npm run preview
```

---

## Using the app

1. **Register** or **log in** — JWT is stored client-side for API calls.
2. **Add a subscription** — set a source name and optional callback URL (any HTTPS endpoint you control or a request inspector). After save, the backend emits a **`subscription.ping`** event through normal ingest so you can verify the pipeline immediately.
3. Copy the **ingest key** for **`POST /api/webhooks/events`** (see backend README / OpenAPI).
4. Open **signing** if you want HMAC verification on inbound requests; the UI surfaces the secret once when enabled or rotated.
5. Watch **event history** and/or the live connection when implemented against your backend.

---

## Architecture and design choices

### Stack

- **Vite + React + TypeScript** for fast local dev and a simple production build.
- **Ant Design** for consistent layout, forms, tables, and modals.

### Structure

- **`src/pages/`** — Thin route shells (`<Dashboard />`, `<LoginPage />`, …) so routing stays minimal.
- **`src/components/dashboard/`** — Dashboard state, API calls, SSE subscription, and focused presentational pieces (`SubscriptionsCard`, modals, header).
- **`src/components/login/`** — Login vs register flows share one entry module pattern consistent with the dashboard.
- **`src/api/client.ts`** — Central **`fetch`** wrapper with JWT header injection and error handling.

### API integration

- **`VITE_API_URL`** keeps environment-specific backend URLs out of source while defaulting to localhost for zero-config local runs.
- The dashboard polls or streams events according to backend capabilities; SSE uses token auth via query parameters because **`EventSource`** does not support custom headers.

### UX

- Subscription actions use clear **buttons** and **modals** (add subscription, signing secret disclosure) rather than long inline forms on the main view.
- Copy reflects a neutral **“Webhook Dashboard”** product tone suitable for a demo assignment.

---

## Backend dependency

This UI expects the **webhook backend** to implement auth and webhook routes documented in that repository (JWT login, subscriptions, ingest, feed, SSE). Clone and run the backend first, then point **`VITE_API_URL`** at it if not using defaults.

---