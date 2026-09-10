# SamApi — Professional Developer API Platform

Fast, reliable and developer-friendly APIs for modern applications.

## Features

- **Auto API Manifest** — Add a new file under `api/` and run `npm run build`. Frontend updates automatically.
- **OAuth Login** — Google, GitHub, Facebook
- **30 Request Limit** per account (server-side, atomic MongoDB)
- **API Explorer & Try API** — Professional request builder
- **Documentation** generated from manifest
- **Vercel Serverless** compatible
- Dark / Light mode

## Stack

- HTML, CSS, Vanilla JavaScript (frontend)
- Node.js, CommonJS (backend)
- MongoDB (users & usage)
- Vercel Serverless Functions
- iron-session (encrypted cookies)

## Project Structure

```
samapi/
├── api/                  # Serverless functions + API modules
│   ├── auth/             # OAuth + me + logout
│   ├── downloader/       # Example downloader APIs
│   ├── search/
│   └── example.js
├── lib/                  # Shared backend utilities
│   ├── db.js
│   ├── auth.js
│   ├── session.js
│   └── api-handler.js
├── public/               # Static frontend
│   ├── index.html
│   ├── login.html
│   ├── docs.html
│   ├── account.html
│   ├── status.html
│   ├── styles.css
│   ├── script.js
│   └── api-manifest.json
├── scripts/
│   └── generate-manifest.js
├── package.json
├── vercel.json
└── .env.example
```

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment

Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string (required) |
| `SESSION_SECRET` | Long random string for cookie encryption (required) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | Facebook OAuth |
| `BASE_URL` | Full URL of your deployment (e.g. `https://samapi.vercel.app`) |

### 3. OAuth Callback URLs

Configure these redirect URIs in each provider console:

- Google: `https://your-domain.vercel.app/api/auth/google`
- GitHub: `https://your-domain.vercel.app/api/auth/github`
- Facebook: `https://your-domain.vercel.app/api/auth/facebook`

### 4. Build manifest

```bash
npm run build
```

### 5. Deploy to Vercel

```bash
# Install Vercel CLI if needed
npx vercel

# Set environment variables in Vercel dashboard
# Deploy
npx vercel --prod
```

## Adding a New API

1. Create a file, e.g. `api/downloader/facebook.js`:

```js
const { withUsageLimit } = require('../../lib/api-handler');

const api = {
  name: 'Facebook Downloader',
  description: 'Download media from Facebook',
  method: 'GET',
  endpoint: '/api/downloader/facebook',
  category: 'Downloader',
  parameters: [
    { name: 'url', type: 'string', required: true, example: 'https://...' }
  ],
  async handler(req, res) {
    const { url } = req.query || {};
    if (!url) {
      return res.status(400).json({ success: false, message: 'Parameter url diperlukan' });
    }
    // Your logic here
    return res.json({
      success: false,
      message: 'Endpoint belum dikonfigurasi.'
    });
  }
};

module.exports = withUsageLimit(api);
module.exports.meta = api;
```

2. Run:

```bash
npm run build
```

3. The API appears on Homepage, Docs, Search, and Explorer automatically.

## API Usage Limit

- Every account has **30 requests**.
- Usage is stored in MongoDB and incremented **atomically**.
- Request #31 returns **HTTP 429**.
- Limit is enforced server-side; client values are never trusted.

## Local Development

This project is designed for Vercel. For local testing:

```bash
npm install
npm run build
npx vercel dev
```

Do **not** use `app.listen()` — use Vercel serverless emulation.

## License

MIT
