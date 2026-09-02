# SamApi

Modern API documentation website with Vercel Serverless Functions.

## Run locally

```bash
npm install
npm run build
```

For local preview, serve the `public` folder with any static server. Vercel CLI is recommended when testing `/api/*` functions.

## Deploy to Vercel

1. Push this folder to GitHub.
2. Import the repository into Vercel.
3. Vercel will run `npm run build`.
4. No framework preset is required; the site is static and API files live in `/api`.

## Add a new API

Create a new Vercel function in `api/myapi.js` and add metadata properties to the exported handler:

```js
async function handler(req, res) {
  // implementation
  res.json({ success: true });
}

handler.api = {
  name: 'My API',
  description: 'Example API',
  method: 'GET',
  endpoint: '/api/myapi',
  parameters: []
};

module.exports = handler;
```

Run `npm run build`. The build script scans `api/*.js` and generates `public/api-manifest.json`, so the homepage and docs update automatically.

Downloader files in this starter intentionally return a clear “not configured” response instead of fake download URLs. Add your own permitted API/scraper implementation on the server side and keep secrets in Vercel Environment Variables.
