/**
 * Pornhub API (metadata via official Webmasters API)
 * GET /api/downloader/pornhub
 *
 * Actions:
 *   search      — search videos
 *   info        — video metadata by id
 *   categories  — list categories
 *   tags        — tags by letter
 *   active      — check if video is active
 *
 * Stream / direct download URLs are NOT provided.
 */

const https = require('https');
const { URL } = require('url');

const BASE = 'https://www.pornhub.com';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function fetchJson(path, params = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(BASE + path);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, String(v));
    });

    const req = https.get(
      u.toString(),
      {
        headers: {
          'User-Agent': UA,
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 15000
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          if (res.statusCode !== 200) {
            return resolve({
              error: true,
              status: res.statusCode,
              message: data.slice(0, 300) || 'Request failed'
            });
          }
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({ error: true, message: 'Invalid JSON response', raw: data.slice(0, 200) });
          }
        });
      }
    );
    req.on('error', (err) => resolve({ error: true, message: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ error: true, message: 'Request timeout' });
    });
  });
}

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const q = req.query || {};
  const action = (q.action || 'search').toLowerCase();

  try {
    if (action === 'search') {
      const query = q.query || q.q || q.search;
      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Parameter query diperlukan'
        });
      }

      const data = await fetchJson('/webmasters/search', {
        search: query,
        page: q.page || 1,
        ordering: q.ordering || 'newest',
        period: q.period || 'alltime',
        thumbsize: q.thumbsize || 'small',
        category: q.category || undefined
      });

      if (data.error) {
        return res.status(502).json({
          success: false,
          message: data.message || 'Gagal mengambil data dari Pornhub',
          detail: data
        });
      }

      return res.status(200).json({
        success: true,
        action: 'search',
        query,
        data
      });
    }

    if (action === 'info') {
      const id = q.id || q.video_id || q.viewkey;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Parameter id (video_id / viewkey) diperlukan'
        });
      }

      const data = await fetchJson('/webmasters/video_by_id', { id });
      if (data.error) {
        return res.status(502).json({
          success: false,
          message: data.message || 'Gagal mengambil info video',
          detail: data
        });
      }

      return res.status(200).json({
        success: true,
        action: 'info',
        id,
        data
      });
    }

    if (action === 'active') {
      const id = q.id || q.video_id || q.viewkey;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Parameter id diperlukan'
        });
      }

      const data = await fetchJson('/webmasters/is_video_active', { id });
      if (data.error) {
        return res.status(502).json({
          success: false,
          message: data.message || 'Gagal cek status video',
          detail: data
        });
      }

      return res.status(200).json({
        success: true,
        action: 'active',
        id,
        data
      });
    }

    if (action === 'categories') {
      const data = await fetchJson('/webmasters/categories');
      if (data.error) {
        return res.status(502).json({
          success: false,
          message: data.message || 'Gagal mengambil categories',
          detail: data
        });
      }

      return res.status(200).json({
        success: true,
        action: 'categories',
        data
      });
    }

    if (action === 'tags') {
      const letter = (q.letter || q.list || 'a').toString().charAt(0).toLowerCase();
      const data = await fetchJson('/webmasters/tags', { list: letter });
      if (data.error) {
        return res.status(502).json({
          success: false,
          message: data.message || 'Gagal mengambil tags',
          detail: data
        });
      }

      return res.status(200).json({
        success: true,
        action: 'tags',
        letter,
        data
      });
    }

    if (action === 'streams' || action === 'download') {
      return res.status(501).json({
        success: false,
        message:
          'Stream / download URL tidak disediakan. Endpoint ini hanya mendukung metadata (search, info, categories, tags).'
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Action tidak valid. Gunakan: search | info | active | categories | tags',
      actions: ['search', 'info', 'active', 'categories', 'tags']
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error'
    });
  }
}

handler.config = {
  name: 'Pornhub API',
  description:
    'Search videos, get video metadata, categories & tags via Pornhub Webmasters API. Stream/download URLs tidak disediakan.',
  method: 'GET',
  endpoint: '/api/downloader/pornhub',
  category: 'Downloader',
  parameters: [
    {
      name: 'action',
      type: 'string',
      required: true,
      example: 'search'
    },
    {
      name: 'query',
      type: 'string',
      required: false,
      example: 'amateur'
    },
    {
      name: 'id',
      type: 'string',
      required: false,
      example: 'ph5xxxxx'
    },
    {
      name: 'page',
      type: 'number',
      required: false,
      example: '1'
    },
    {
      name: 'ordering',
      type: 'string',
      required: false,
      example: 'mostviewed'
    },
    {
      name: 'period',
      type: 'string',
      required: false,
      example: 'weekly'
    },
    {
      name: 'letter',
      type: 'string',
      required: false,
      example: 'a'
    }
  ]
};

module.exports = handler;
