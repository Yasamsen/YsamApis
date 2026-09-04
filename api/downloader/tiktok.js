const createApi = require("../_lib/createApi");
const { requireParams } = require("../_lib/validate");

const { load } = require("cheerio");

const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));

const UA =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36";

const BASE_URL = "https://musicaldown.com";

function fullUrl(url) {
  if (!url) return null;

  try {
    return new URL(url, BASE_URL).href;
  } catch {
    return url;
  }
}

function isFastDl(url) {
  return (
    typeof url === "string" &&
    url.startsWith("https://fastdl")
  );
}

function isSlideImage(url) {
  try {
    const part = url.split("/images/")[1];

    if (!part) return false;

    const decoded =
      Buffer.from(part, "base64").toString();

    return (
      decoded.includes("photomode") ||
      decoded.includes("photo-mode")
    );
  } catch {
    return false;
  }
}

async function getToken() {
  const res = await fetch(
    `${BASE_URL}/id/`,
    {
      headers: {
        "User-Agent": UA,
        "Accept-Language":
          "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        Referer: `${BASE_URL}/`
      }
    }
  );

  if (!res.ok) {
    throw new Error(
      `Gagal membuka MusicalDown (${res.status})`
    );
  }

  const html = await res.text();
  const $ = load(html);

  const rawCookies =
    typeof res.headers.raw === "function"
      ? res.headers.raw()["set-cookie"] || []
      : [];

  const cookies = rawCookies
    .map(v => v.split(";")[0])
    .join("; ");

  const inputs = {};

  $("form input").each((_, el) => {
    const name = $(el).attr("name");

    if (!name) return;

    inputs[name] =
      $(el).attr("value") || "";
  });

  return {
    cookies,
    inputs
  };
}

async function downloadTikTok(tiktokUrl) {
  const {
    cookies,
    inputs
  } = await getToken();

  const keys = Object.keys(inputs);

  if (!keys.length) {
    throw new Error(
      "Form input MusicalDown tidak ditemukan"
    );
  }

  inputs[keys[0]] = tiktokUrl;

  const body =
    new URLSearchParams(inputs).toString();

  const res = await fetch(
    `${BASE_URL}/id/download`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",

        "User-Agent": UA,

        "Accept-Language":
          "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",

        Referer:
          `${BASE_URL}/id/`,

        Origin:
          BASE_URL,

        ...(cookies
          ? { Cookie: cookies }
          : {})
      },

      body
    }
  );

  if (!res.ok) {
    throw new Error(
      `MusicalDown mengembalikan status ${res.status}`
    );
  }

  const html = await res.text();
  const $ = load(html);

  const result = {
    type: null,
    mp4: null,
    mp4_hd: null,
    mp4_wm: null,
    mp3: null,
    audio: null,
    images: []
  };

  $("a[href]").each((_, el) => {
    const href =
      fullUrl($(el).attr("href"));

    if (!isFastDl(href)) return;

    const text =
      $(el).text().trim();

    if (text === "Download MP4 [HD]") {
      result.mp4_hd = href;
    } else if (
      text === "Download MP4 [Watermark]"
    ) {
      result.mp4_wm = href;
    } else if (
      text === "Download MP4"
    ) {
      result.mp4 = href;
    } else if (
      text === "Download MP3"
    ) {
      result.mp3 = href;
    }
  });

  /*
   * Fallback audio
   */
  if (!result.mp3) {
    $("a[href], audio[src], source[src]")
      .each((_, el) => {
        const href =
          $(el).attr("href") ||
          $(el).attr("src") ||
          "";

        if (!isFastDl(href)) return;

        const text =
          $(el)
            .text()
            .trim()
            .toLowerCase();

        const lower =
          href.toLowerCase();

        if (
          text.includes("mp3") ||
          text.includes("audio") ||
          lower.includes(".mp3") ||
          lower.includes("audio")
        ) {
          result.mp3 =
            fullUrl(href);
        }
      });
  }

  /*
   * TikTok Photo Mode / Slide
   */
  $("img").each((_, el) => {
    const src =
      fullUrl($(el).attr("src"));

    if (
      !isFastDl(src) ||
      !isSlideImage(src)
    ) {
      return;
    }

    if (!result.images.includes(src)) {
      result.images.push(src);
    }
  });

  result.audio = result.mp3;

  /*
   * Tentukan tipe
   */
  if (result.images.length) {
    result.type = "slide";
  } else {
    result.type = "video";
  }

  return result;
}

module.exports = createApi({
  name: "TikTok Downloader",

  description:
    "Download video TikTok tanpa watermark, HD, watermark, audio, dan mendeteksi TikTok Photo Mode.",

  method: "GET",

  endpoint:
    "/api/downloader/tiktok",

  category: "Downloader",

  parameters: [
    {
      name: "url",
      type: "string",
      required: true,
      example:
        "https://www.tiktok.com/@user/video/123456789"
    }
  ],

  async handler(req, res) {
    const check =
      requireParams(
        req.query,
        ["url"]
      );

    if (!check.ok) {
      return res.status(400).json({
        success: false,

        message:
          `Parameter wajib diperlukan: ${check.missing.join(", ")}`
      });
    }

    const url =
      String(
        req.query.url || ""
      ).trim();

    if (!url) {
      return res.status(400).json({
        success: false,

        message:
          "Parameter url tidak boleh kosong."
      });
    }

    /*
     * Validasi URL TikTok
     */
    let parsedUrl;

    try {
      parsedUrl =
        new URL(url);
    } catch {
      return res.status(400).json({
        success: false,

        message:
          "URL TikTok tidak valid."
      });
    }

    const hostname =
      parsedUrl.hostname
        .toLowerCase()
        .replace(/^www\./, "");

    const validTikTok =
      hostname === "tiktok.com" ||
      hostname.endsWith(".tiktok.com");

    if (!validTikTok) {
      return res.status(400).json({
        success: false,

        message:
          "URL harus berasal dari TikTok."
      });
    }

    try {
      const result =
        await downloadTikTok(url);

      /*
       * Pastikan ada hasil.
       */
      const hasResult =
        result.images.length > 0 ||
        result.mp4 ||
        result.mp4_hd ||
        result.mp4_wm ||
        result.mp3;

      if (!hasResult) {
        return res.status(404).json({
          success: false,

          message:
            "Data download tidak ditemukan. Link mungkin tidak didukung atau TikTok berubah."
        });
      }

      return res.status(200).json({
        success: true,

        data: {
          type:
            result.type,

          video:
            result.type === "video"
              ? {
                  mp4:
                    result.mp4,

                  mp4_hd:
                    result.mp4_hd,

                  mp4_watermark:
                    result.mp4_wm
                }
              : null,

          audio:
            result.audio,

          images:
            result.type === "slide"
              ? result.images
              : []
        },

        source:
          "MusicalDown"
      });

    } catch (error) {
      console.error(
        "TIKTOK DOWNLOADER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Gagal mengambil data TikTok.",

        error:
          error.message ||
          "Unknown error"
      });
    }
  }
});