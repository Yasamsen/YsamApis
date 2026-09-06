/**
 * Shared Pornhub helpers (not an API endpoint)
 * Uses public Webmasters API + page scrape for streams
 */

const BASE = 'https://www.pornhub.com';
const WM = `${BASE}/webmasters`;

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  Accept: 'application/json, text/html, */*'
};

let lastRequest = 0;

async function rateLimit() {
  const elapsed = Date.now() - lastRequest;
  if (elapsed < 500) {
    await new Promise((r) => setTimeout(r, 500 - elapsed));
  }
  lastRequest = Date.now();
}

async function getJson(path, params = {}) {
  await rateLimit();
  const url = new URL(path.startsWith('http') ? path : `${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });

  try {
    const res = await fetch(url.toString(), {
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(15000)
    });
    const text = await res.text();
    if (!res.ok) {
      return { error: res.status, message: text.slice(0, 300) };
    }
    try {
      return JSON.parse(text);
    } catch {
      return { _html: text };
    }
  } catch (err) {
    return { error: err.name === 'TimeoutError' ? 'timeout' : String(err.message || err) };
  }
}

async function getHtml(path, params = {}) {
  await rateLimit();
  const url = new URL(path.startsWith('http') ? path : `${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });

  try {
    const res = await fetch(url.toString(), {
      headers: { ...DEFAULT_HEADERS, Accept: 'text/html' },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function formatViews(n) {
  if (!n) return '0';
  const num = parseInt(n, 10);
  if (Number.isNaN(num)) return String(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

function videoUrl(videoId) {
  return `${BASE}/view_video.php?viewkey=${videoId}`;
}

async function search({ query, page = 1, ordering = 'newest', period = 'alltime', thumbsize = 'small', category }) {
  if (!query) return { error: 'query required' };
  const params = { search: query, page, ordering, period, thumbsize };
  if (category) params.category = category;
  return getJson('/webmasters/search', params);
}

async function getVideo(videoId) {
  if (!videoId) return { error: 'id required' };
  return getJson('/webmasters/video_by_id', { id: videoId });
}

async function isVideoActive(videoId) {
  if (!videoId) return { error: 'id required' };
  const data = await getJson('/webmasters/is_video_active', { id: videoId });
  if (data && 'active' in data) {
    return { active: data.active === 'true' || data.active === true, raw: data };
  }
  return data;
}

async function getCategories() {
  const data = await getJson('/webmasters/categories');
  if (data && data.categories) return { categories: data.categories };
  return data;
}

async function getTags(letter = 'a') {
  const data = await getJson('/webmasters/tags', { list: String(letter).toLowerCase().charAt(0) });
  if (data && data.tags) return { tags: data.tags };
  return data;
}

async function resolveGetMedia(url) {
  try {
    await rateLimit();
    const res = await fetch(url, {
      headers: { ...DEFAULT_HEADERS, Accept: 'application/json' },
      signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data && data.videoUrl) return [data];
  } catch {
    /* ignore */
  }
  return null;
}

async function getVideoStreams(videoId) {
  if (!videoId) return { error: 'id required' };

  const html = await getHtml('/view_video.php', { viewkey: videoId });
  if (!html) return { error: 'Failed to fetch video page' };

  const fvMatch = html.match(/var\s+flashvars_\d+\s*=\s*(\{[\s\S]*?\})\s*;/);
  if (!fvMatch) return { error: 'No flashvars found (video may be unavailable)' };

  let fv;
  try {
    fv = JSON.parse(fvMatch[1]);
  } catch {
    return { error: 'Failed to parse flashvars' };
  }

  const result = {
    title: fv.video_title || '',
    duration: fv.video_duration || 0,
    is_vr: !!fv.isVR,
    is_hd: !!fv.isHD,
    streams: [],
    thumbs: fv.thumbs || []
  };

  const mediaDefs = fv.mediaDefinitions || [];
  for (const md of mediaDefs) {
    const quality = md.quality != null ? String(md.quality) : '';
    const fmt = md.format || '';
    const url = md.videoUrl || '';
    if (!url) continue;

    if (url.includes('/video/get_media')) {
      const resolved = await resolveGetMedia(url);
      if (resolved && Array.isArray(resolved)) {
        for (const item of resolved) {
          if (item.videoUrl) {
            result.streams.push({
              quality: String(item.quality != null ? item.quality : quality),
              format: 'mp4',
              url: item.videoUrl
            });
          }
        }
      }
    } else {
      result.streams.push({ quality, format: fmt, url });
    }
  }

  return result;
}

async function getDownloadUrls(videoId) {
  if (!videoId) return { error: 'id required' };

  const html = await getHtml('/view_video.php', { viewkey: videoId });
  if (!html) return { error: 'Failed to fetch video page' };

  const fvMatch = html.match(/var\s+flashvars_\d+\s*=\s*(\{[\s\S]*?\})\s*;/);
  if (!fvMatch) return { error: 'No flashvars found' };

  let fv;
  try {
    fv = JSON.parse(fvMatch[1]);
  } catch {
    return { error: 'Failed to parse flashvars' };
  }

  const result = {
    title: fv.video_title || videoId,
    duration: fv.video_duration || 0,
    downloads: []
  };

  let getMediaUrl = null;
  for (const md of fv.mediaDefinitions || []) {
    const url = md.videoUrl || '';
    if (url.includes('/video/get_media')) {
      getMediaUrl = url;
      break;
    }
  }

  if (getMediaUrl) {
    const mediaList = await resolveGetMedia(getMediaUrl);
    if (mediaList) {
      for (const item of mediaList) {
        const q = item.quality != null ? String(item.quality) : '?';
        const mp4 = item.videoUrl || '';
        if (mp4 && q) {
          result.downloads.push({ quality: q, url: mp4, format: 'mp4' });
        }
      }
    }
  }

  for (const md of fv.mediaDefinitions || []) {
    const url = md.videoUrl || '';
    const quality = md.quality != null ? String(md.quality) : '';
    const fmt = md.format || '';
    if (url && fmt === 'hls' && url.includes('.m3u8')) {
      const exists = result.downloads.some((d) => d.quality === quality);
      if (!exists) {
        result.downloads.push({ quality, url, format: 'hls' });
      }
    }
  }

  result.downloads.sort((a, b) => {
    const na = parseInt(a.quality, 10) || 0;
    const nb = parseInt(b.quality, 10) || 0;
    return nb - na;
  });

  return result;
}

module.exports = {
  search,
  getVideo,
  isVideoActive,
  getCategories,
  getTags,
  getVideoStreams,
  getDownloadUrls,
  formatViews,
  videoUrl,
  BASE
};
