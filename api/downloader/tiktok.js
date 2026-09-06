/**
 * TikTok Downloader
 * GET /api/downloader/tiktok?url=...
 *
 * Support: video + image slideshow
 * Base: https://www.tiktok.com
 */

const https = require('https');
const zlib = require('zlib');
const { URL } = require('url');

const agent = new https.Agent({ keepAlive: true });

function request(url, { method = 'GET', headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const opts = {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method,
        headers: body
          ? { ...headers, 'content-length': Buffer.byteLength(body) }
          : headers,
        agent,
        maxHeaderSize: 1048576
      };

      const req = https.request(opts, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const newHeaders = { ...headers };
          delete newHeaders.host;
          return resolve(
            request(res.headers.location, { method, headers: newHeaders, body })
          );
        }

        const chunks = [];
        const encoding = res.headers['content-encoding'];
        let stream = res;

        if (encoding === 'gzip') {
          stream = res.pipe(zlib.createGunzip());
        } else if (encoding === 'br') {
          stream = res.pipe(zlib.createBrotliDecompress());
        } else if (encoding === 'deflate') {
          stream = res.pipe(zlib.createInflate());
        }

        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => {
          resolve({
            text: Buffer.concat(chunks).toString('utf8'),
            headers: res.headers,
            status: res.statusCode
          });
        });
        stream.on('error', reject);
      });

      req.on('error', reject);
      req.setTimeout(20000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      if (body) req.write(body);
      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

function extractItemStruct(html) {
  const apiMatch = html.match(/<script id="api-data"[^>]*>([\s\S]*?)<\/script>/);
  if (apiMatch) {
    try {
      const j = JSON.parse(apiMatch[1]);
      const s = j?.videoDetail?.itemInfo?.itemStruct || j?.itemInfo?.itemStruct;
      if (s) return s;
      if (j?.ItemModule) {
        const firstId = Object.keys(j.ItemModule)[0];
        if (firstId && j.ItemModule[firstId]) return j.ItemModule[firstId];
      }
    } catch {
      /* ignore */
    }
  }

  const uniMatch = html.match(
    /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (uniMatch) {
    try {
      const j = JSON.parse(uniMatch[1]);
      const defaultScope = j?.__DEFAULT_SCOPE__ || {};
      for (const key of Object.keys(defaultScope)) {
        const s = defaultScope[key]?.itemInfo?.itemStruct;
        if (s) return s;
      }
    } catch {
      /* ignore */
    }
  }

  return null;
}

async function tiktok(url) {
  const { text, status, headers } = await request(url, {
    headers: {
      'sec-ch-ua': '"Chromium";v="120", "Not?A_Brand";v="8"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'upgrade-insecure-requests': '1',
      'user-agent':
        'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'sec-fetch-site': 'none',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-user': '?1',
      'sec-fetch-dest': 'document',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
    }
  });

  if (status >= 400) {
    throw new Error('TikTok mengembalikan HTTP ' + status);
  }

  const detail = extractItemStruct(text);
  if (!detail) {
    throw new Error(
      'Data TikTok tidak ditemukan. Link mungkin tidak valid atau TikTok mengubah struktur halaman.'
    );
  }

  const isImage = !!detail.imagePost;
  let download = [];

  if (isImage) {
    download = (detail.imagePost.images || []).reduce((acc, img) => {
      return acc.concat((img && img.imageURL && img.imageURL.urlList) || []);
    }, []);
  } else {
    download = [detail.video && detail.video.downloadAddr, detail.video && detail.video.playAddr].filter(Boolean);

    if (detail.id) {
      try {
        const pUrl = 'https://www.tiktok.com/player/api/v1/items?item_ids=' + detail.id;
        const pResponse = await request(pUrl, {
          headers: {
            'user-agent':
              'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
            accept: 'application/json'
          }
        });
        const pJson = JSON.parse(pResponse.text);
        const directUrl =
          pJson.items &&
          pJson.items[0] &&
          pJson.items[0].video_info &&
          pJson.items[0].video_info.url_list &&
          pJson.items[0].video_info.url_list[0];
        if (directUrl) download.unshift(directUrl);
      } catch {
        /* ignore */
      }
    }
  }

  download = [...new Set(download.filter(Boolean))];

  return {
    id: detail.id || detail.aweme_id || null,
    isVideo: !isImage,
    isImage: isImage,
    title: detail.desc || (detail.suggestedWords && detail.suggestedWords[0]) || '',
    region: detail.locationCreated || null,
    duration: (detail.video && detail.video.duration) || (detail.music && detail.music.duration) || 0,
    cover:
      (detail.video && (detail.video.cover || detail.video.originCover)) || null,
    stats: {
      like: (detail.stats && detail.stats.diggCount) || 0,
      views: (detail.stats && detail.stats.playCount) || 0,
      share: (detail.stats && detail.stats.shareCount) || 0,
      comment: (detail.stats && detail.stats.commentCount) || 0,
      collect: (detail.stats && detail.stats.collectCount) || 0
    },
    download: download,
    author: {
      id: (detail.author && detail.author.id) || '',
      secUid: (detail.author && detail.author.secUid) || '',
      username: (detail.author && detail.author.uniqueId) || '',
      nickname: (detail.author && detail.author.nickname) || '',
      avatar:
        (detail.author &&
          (detail.author.avatarLarger ||
            detail.author.avatarMedium ||
            detail.author.avatarThumb)) ||
        null,
      verified: (detail.author && detail.author.verified) || false,
      followers:
        (detail.authorStats && detail.authorStats.followerCount) ||
        (detail.author && detail.author.followerCount) ||
        0,
      following:
        (detail.authorStats && detail.authorStats.followingCount) ||
        (detail.author && detail.author.followingCount) ||
        0,
      like:
        (detail.authorStats && detail.authorStats.heartCount) ||
        (detail.author && detail.author.heartCount) ||
        0,
      videoCount:
        (detail.authorStats && detail.authorStats.videoCount) ||
        (detail.author && detail.author.videoCount) ||
        0
    },
    music: {
      id: (detail.music && detail.music.id) || null,
      title: (detail.music && detail.music.title) || '',
      author: (detail.music && detail.music.authorName) || '',
      thumbnail:
        (detail.music &&
          (detail.music.coverLarge ||
            detail.music.coverMedium ||
            detail.music.coverThumb)) ||
        null,
      duration: (detail.music && detail.music.duration) || 0,
      url: (detail.music && detail.music.playUrl) || null
    }
  };
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

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const url = ((req.query && (req.query.url || req.query.link)) || '').trim();

  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'Parameter url diperlukan'
    });
  }

  if (!/https?:\/\/(?:www\.|vt\.|vm\.|m\.)?tiktok\.com\//i.test(url)) {
    return res.status(400).json({
      success: false,
      message:
        'Link TikTok tidak valid. Contoh: https://vt.tiktok.com/xxxxx atau https://www.tiktok.com/@user/video/...'
    });
  }

  try {
    const data = await tiktok(url);

    if (!data.download || !data.download.length) {
      return res.status(404).json({
        success: false,
        message: 'Media TikTok tidak ditemukan.'
      });
    }

    return res.status(200).json({
      success: true,
      message: data.isVideo ? 'Video ditemukan' : 'Image slideshow ditemukan',
      data: data
    });
  } catch (err) {
    console.error('[TIKTOK]', err.message || err);
    return res.status(502).json({
      success: false,
      message: err.message || 'Gagal mengambil data TikTok'
    });
  }
}

handler.config = {
  name: 'TikTok Downloader',
  description:
    'Download video & image slideshow dari TikTok. Support vt.tiktok.com, vm.tiktok.com, dan link penuh.',
  method: 'GET',
  endpoint: '/api/downloader/tiktok',
  category: 'Downloader',
  parameters: [
    {
      name: 'url',
      type: 'string',
      required: true,
      example: 'https://vt.tiktok.com/ZSxxxxx/'
    }
  ]
};

module.exports = handler;
