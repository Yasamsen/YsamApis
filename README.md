# SamApi — Professional Developer API Platform

A real, deployable API platform: OAuth login (Google / GitHub / Facebook),
MongoDB-backed accounts with a server-side, atomic 30-request-per-account
limit, an auto-generated API manifest, and a premium dark-mode developer
frontend (API Explorer, Documentation, Try API tester). Built with plain
HTML/CSS/vanilla JS on the frontend and CommonJS Vercel Serverless
Functions on the backend — no React, no TypeScript, no persistent server.

## Stack

- Frontend: HTML, CSS, vanilla JavaScript (no framework)
- Backend: Node.js, CommonJS, Vercel Serverless Functions
- Database: MongoDB (official `mongodb` driver)
- Auth: OAuth 2.0 (Google, GitHub, Facebook) with signed, HttpOnly session cookies

## Project structure

```
samapi/
├── api/
│   ├── _lib/              # shared server utilities (not public endpoints)
│   │   ├── mongodb.js      # cached MongoDB connection
│   │   ├── session.js      # signed session / OAuth-state cookies
│   │   ├── oauth.js        # Google/GitHub/Facebook OAuth2 helpers
│   │   └── withApi.js      # auth + atomic usage-limit wrapper
│   ├── auth/               # login flow (excluded from the API manifest)
│   │   ├── google.js / google/callback.js
│   │   ├── github.js / github/callback.js
│   │   ├── facebook.js / facebook/callback.js
│   │   ├── me.js
│   │   └── logout.js
│   ├── example.js
│   ├── downloader/
│   │   ├── tiktok.js
│   │   ├── youtube.js
│   │   └── instagram.js
│   └── search/
│       └── example.js
├── public/                 # static frontend
│   ├── index.html / docs.html / login.html / account.html / status.html
│   ├── 404.html / 500.html
│   ├── styles.css / script.js
│   ├── notifications.json
│   └── api-manifest.json   # generated — do not edit by hand
├── scripts/
│   └── generate-manifest.js
├── package.json
├── vercel.json
└── .env.example
```

## Install & run locally

```bash
npm install
npm run build      # generates public/api-manifest.json
```

There is no local dev server bundled (no `app.listen()` — this project is
serverless-only). To run it locally the way it will behave on Vercel, use
the Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

Create a `.env` file (copied from `.env.example`) with real values before
running `vercel dev` or deploying, otherwise login/API-limit routes will
respond with a clear "not configured" / 503 error instead of crashing.

## Adding a new API

Just add a new file under `api/` (outside of `api/_lib` and `api/auth`),
following the pattern in `api/downloader/tiktok.js`:

```js
const { withApiLimit } = require("../_lib/withApi");

const meta = {
  name: "Facebook Downloader",
  description: "Download media from Facebook",
  method: "GET",
  endpoint: "/api/downloader/facebook",
  category: "Downloader",
  parameters: [
    { name: "url", type: "string", required: true, example: "https://example.com" },
  ],
};

async function handler(req, res) {
  // your real implementation goes here
  return res.json({ success: true, data: { /* ... */ } });
}

module.exports = withApiLimit({ ...meta, handler });
module.exports.meta = meta;
```

Then run:

```bash
npm run build
```

The new endpoint will automatically appear on the homepage, API Explorer,
Documentation sidebar, category filters, and search — no frontend changes
needed. `npm run build` fails loudly (non-zero exit, clear message) if a
file is missing required metadata, so mistakes can't silently disappear.

## Setting up OAuth

Create OAuth apps for each provider you want to support and set the
callback/redirect URI to:

```
https://<your-domain>/api/auth/<provider>/callback
```

- **Google**: https://console.cloud.google.com/apis/credentials
- **GitHub**: https://github.com/settings/developers
- **Facebook**: https://developers.facebook.com/apps

Put the client ID/secret pairs into your environment variables (see
`.env.example`). A provider you don't configure will simply redirect back
to `/login?error=oauth_not_configured` instead of crashing.

## Setting up the database

1. Create a free MongoDB Atlas cluster (or use any MongoDB instance).
2. Set `MONGODB_URI` (and optionally `MONGODB_DB`, default `samapi`).
3. The `users` collection is created automatically on first login, with a
   unique index on `(provider, providerId)` so one OAuth account can never
   create duplicate users.

No account/usage data is ever stored in-process or on the filesystem —
everything lives in MongoDB, which is required for correctness on
Vercel's stateless serverless functions.

## The 30-request limit

Every account starts with `usage: 0, limit: 30`. Each call to a real API
endpoint (not the homepage, docs, status, login, or static assets) goes
through `withApiLimit`, which:

1. Validates the session cookie — identity always comes from the server,
   never from the client.
2. Performs an **atomic** MongoDB `findOneAndUpdate` that only increments
   `usage` if it is still below `limit`, so two simultaneous requests can
   never both sneak past request #30 (no race condition).
3. Returns `429 Too Many Requests` once the limit is reached.

The schema already includes room for a future `usagePeriod` / daily reset
without needing a rewrite.

## Deploying to Vercel

```bash
vercel
```

Then set the environment variables from `.env.example` in your Vercel
project settings (Production, Preview, and Development as needed), and
redeploy. `vercel.json` rewrites `/docs`, `/status`, `/login`, and
`/account` to their corresponding HTML files without touching `/api/*`.

## Environment variables

See `.env.example` for the full list: `MONGODB_URI`, `MONGODB_DB`,
`SESSION_SECRET`, and the client ID/secret pair for each OAuth provider.
Nothing here is ever sent to the browser — the frontend never sees a
secret, a connection string, or a database credential.
