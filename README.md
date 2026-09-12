# SamApi — Modern API Platform

Professional SaaS-style API platform with auto-discovered endpoints, Google OAuth, API keys, daily limits, and admin dashboard.

## Stack

- **Frontend:** HTML, CSS, Vanilla JS (no React)
- **Backend:** Node.js + Express (CommonJS)
- **Database:** MongoDB + Mongoose
- **Auth:** Google OAuth 2.0 (Passport)
- **Deploy:** Vercel-ready

## Features

- Auto-scan `/api/**/*.js` → generates `api-manifest.json`
- Homepage, Explorer, Docs, Try API playground
- Google login → auto API key (`sk_...`)
- Daily limit (10 req/day) with auto UTC reset
- Admin role for `yasampreset@gmail.com` (unlimited)
- User dashboard, usage, history, key regenerate
- Admin: users, APIs, logs, stats
- Dark / light mode, responsive, modern UI

## Quick Start

1. Copy `.env.example` → `.env` and fill values:

```env
MONGODB_URI=mongodb+srv://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
SESSION_SECRET=long-random-string
ADMIN_EMAIL=yasampreset@gmail.com
BASE_URL=http://localhost:3000
```

2. Install & run:

```bash
npm install
npm start
```

3. Open http://localhost:3000

## Adding a new API endpoint

Create a file under `api/`:

```js
// api/downloader/tiktok.js
module.exports = {
  meta: {
    name: 'TikTok Downloader',
    description: '...',
    category: 'Downloader',
    method: 'GET',
    status: 'online', // online | offline | maintenance
    featured: true,
    parameters: [
      { name: 'url', type: 'string', required: true, description: '...' }
    ],
    responseExample: { status: true, creator: 'SamApi', result: {} }
  },
  async handler(params, req) {
    // your logic
    return { status: true, creator: 'SamApi', result: { ... } };
  }
};
```

Restart server (or call admin “Reload Manifest”). The endpoint appears on Home, Explorer, Docs, and Try API automatically.

## Request format

```
GET /api/{category}/{name}-key/{API_KEY}?param=value
```

Example:

```
/api/downloader/tiktok-key/sk_A8xK29LmP7Qz91?url=https://tiktok.com/...
```

## Deploy on Vercel

1. Push repo to GitHub
2. Import project on Vercel
3. Set Environment Variables (same as `.env`)
4. Set `GOOGLE_CALLBACK_URL` to `https://your-domain.vercel.app/auth/google/callback`
5. Deploy

## Admin

Login with Google account matching `ADMIN_EMAIL` → automatic `role: admin`, unlimited requests, access to `/admin`.

## Security notes

- Never commit `.env`
- Session stored in MongoDB (connect-mongo)
- API key validated server-side on every request
- Rate limiting + Helmet + CORS configured
- Google password never touches SamApi servers
