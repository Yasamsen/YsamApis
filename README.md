# SamApi

Professional developer API platform — documentation, explorer, and serverless endpoints.

## Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript (no React, no TypeScript)
- **Backend:** Node.js CommonJS serverless functions (Vercel)
- **Manifest:** Build-time generation from `api/` folder

## Quick start

```bash
npm run build          # generates public/api-manifest.json
```

Deploy to Vercel:

```bash
npx vercel
```

Or connect the Git repository in the Vercel dashboard. The `build` script runs automatically.

## Adding a new API

1. Create a file under `api/` (or a subfolder, e.g. `api/tools/mytool.js`):

```js
async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // your logic here
  return res.status(200).json({ success: true, data: {} });
}

handler.config = {
  name: 'My Tool',
  description: 'What this endpoint does',
  method: 'GET',
  endpoint: '/api/tools/mytool',
  category: 'Tools',
  parameters: [
    { name: 'q', type: 'string', required: true, example: 'hello' }
  ]
};

module.exports = handler;
```

2. Run `npm run build` (or deploy — Vercel runs the build).

3. The new endpoint appears automatically on the homepage, docs, search, and filters.

## Project structure

```
api/                  # Vercel serverless functions
  downloader/
  search/
  example.js
public/               # Static site
  index.html
  docs.html
  status.html
  404.html
  500.html
  styles.css
  script.js
  api-manifest.json   # generated
  notifications.json
scripts/
  generate-manifest.js
package.json
vercel.json
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Homepage + API explorer |
| `/docs` | Documentation + live Try API |
| `/status` | Status page |
| `/api/example` | Health check |
| `/api/downloader/*` | Downloader stubs |
| `/api/search/example` | Demo search |

## Notes

- Downloader endpoints currently return `501` with message “Endpoint belum dikonfigurasi.” — ready for real implementations.
- Dark mode is default; preference is stored in `localStorage`.
- No API keys are exposed to the frontend. Use `process.env` on the server side.
