// api/scraper/capcut.js
const axios = require("axios");
const createApi = require("../_lib/createApi");
const { requireParams } = require("../_lib/validate");

function extractHashtags(text) {
  if (!text) return [];

  const matches = text.match(/#[\w\u0590-\u05ff]+/gi) || [];

  return [...new Set(matches)];
}

function getRegex(html, regex) {
  const match = html.match(regex);

  if (!match || !match[1]) return "";

  return match[1]
    .replace(/\\u002F/g, "/")
    .replace(/\\"/g, '"');
}

function getNum(html, regex) {
  const match = html.match(regex);

  return parseInt(match?.[1] || "0", 10);
}

async function scrapeCapcut(inputUrl) {
  if (!inputUrl || !inputUrl.includes("capcut.com")) {
    return {
      success: false,
      error: "URL CapCut tidak valid."
    };
  }

  const response = await axios.get(inputUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    },
    timeout: 15000,
    maxRedirects: 5
  });

  const html = response.data;

  let templateData = null;
  let loaderObj = null;

  const scripts = [
    ...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)
  ];

  for (const script of scripts) {
    if (!script[1].includes("loaderData")) continue;

    try {
      const parsed = JSON.parse(script[1]);

      loaderObj =
        parsed.loaderData?.["template-detail_$"] ||
        parsed.loaderData?.["template_detail"];

      if (loaderObj?.templateDetail) {
        templateData = loaderObj.templateDetail;
        break;
      }
    } catch (_) {
      // Lanjut ke script berikutnya
    }
  }

  /*
   * FALLBACK REGEX
   */

  if (!templateData) {
    const videoUrl = getRegex(html, /"videoUrl":"(.*?)"/);

    if (!videoUrl) {
      return {
        success: false,
        error: "Gagal mengekstrak metadata dari URL CapCut."
      };
    }

    const coverUrl = getRegex(html, /"coverUrl":"(.*?)"/);
    const title = getRegex(html, /"title":"(.*?)"/);
    const desc = getRegex(html, /"desc":"(.*?)"/);
    const templateId = getRegex(html, /"templateId":"(.*?)"/);

    const width = getNum(
      html,
      /"videoWidth":([0-9]+)/
    );

    const height = getNum(
      html,
      /"videoHeight":([0-9]+)/
    );

    const duration = getNum(
      html,
      /"templateDuration":([0-9]+)/
    );

    const createTime = getNum(
      html,
      /"createTime":([0-9]+)/
    );

    return {
      success: true,
      data: {
        id: templateId,

        title: title || "CapCut Template",

        description: desc || "",

        hashtags: extractHashtags(desc),

        originalUrl: inputUrl,

        canonicalUrl: inputUrl,

        coverUrl,

        videoUrl,

        videoWidth: width,

        videoHeight: height,

        videoRatio:
          width && height
            ? `${width}:${height}`
            : "9:16",

        durationMs: duration,

        durationSec: Number(
          (duration / 1000).toFixed(2)
        ),

        segmentCount: getNum(
          html,
          /"segmentAmount":([0-9]+)/
        ),

        usageCount: getNum(
          html,
          /"usageAmount":([0-9]+)/
        ),

        likeCount:
          getNum(
            html,
            /"likeAmount":([0-9]+)/
          ) ||
          getNum(
            html,
            /"likeCount":([0-9]+)/
          ),

        playCount:
          getNum(
            html,
            /"playAmount":([0-9]+)/
          ) ||
          getNum(
            html,
            /"playCount":([0-9]+)/
          ),

        commentCount: getNum(
          html,
          /"commentAmount":([0-9]+)/
        ),

        createdAt: createTime
          ? new Date(createTime * 1000).toISOString()
          : "",

        createdTimestamp: createTime,

        capabilities: [],

        author: {
          name: getRegex(
            html,
            /"author":\{.*?"name":"(.*?)"/
          ),

          avatarUrl: getRegex(
            html,
            /"avatarUrl":"(.*?)"/
          )
        }
      }
    };
  }

  /*
   * DATA LOADER
   */

  const createTime = Number(
    templateData.createTime || 0
  );

  const duration = Number(
    templateData.templateDuration || 0
  );

  /*
   * RECOMMENDATION
   */

  const rawRecommend = Array.isArray(
    loaderObj?.recommendList
  )
    ? loaderObj.recommendList
    : [];

  const recommendList = rawRecommend.map((item) => {
    const itemCreateTime = Number(
      item.createTime || 0
    );

    let author;

    if (
      item.author?.name ||
      item.author?.avatarUrl ||
      item.author?.secUid
    ) {
      author = {
        name: item.author?.name || undefined,

        avatarUrl:
          item.author?.avatarUrl || undefined,

        description:
          item.author?.description || undefined,

        profileUrl:
          item.author?.profileUrl
            ? `https://www.capcut.com${item.author.profileUrl}`
            : undefined,

        secUid:
          item.author?.secUid || undefined
      };
    }

    return {
      templateId: String(
        item.templateId || ""
      ),

      title: item.title || "",

      description: item.desc || "",

      coverUrl: item.coverUrl || "",

      videoUrl:
        item.videoUrl || undefined,

      usageCount: Number(
        item.usageAmount || 0
      ),

      likeCount: Number(
        item.likeAmount || 0
      ),

      createdAt: itemCreateTime
        ? new Date(
            itemCreateTime * 1000
          ).toISOString()
        : undefined,

      createdTimestamp:
        itemCreateTime || undefined,

      canonicalUrl:
        item.canonicalPath
          ? `https://www.capcut.com${item.canonicalPath}`
          : undefined,

      author
    };
  });

  const desc = templateData.desc || "";

  /*
   * FINAL METADATA
   */

  const metadata = {
    id: String(
      templateData.templateId ||
      loaderObj?.templateId ||
      ""
    ),

    title: templateData.title || "",

    description: desc,

    hashtags: extractHashtags(desc),

    tagTitle:
      templateData.tagTitle || "",

    canonicalUrl:
      loaderObj?.canonicalPath
        ? `https://www.capcut.com${loaderObj.canonicalPath}`
        : templateData.structuredData?.url || "",

    originalUrl: inputUrl,

    coverUrl:
      templateData.coverUrl || "",

    videoUrl:
      templateData.videoUrl || "",

    videoWidth: Number(
      templateData.videoWidth || 0
    ),

    videoHeight: Number(
      templateData.videoHeight || 0
    ),

    videoRatio:
      templateData.videoRatio ||
      (
        templateData.videoWidth &&
        templateData.videoHeight
          ? `${templateData.videoWidth}:${templateData.videoHeight}`
          : ""
      ),

    durationMs: duration,

    durationSec: Number(
      (duration / 1000).toFixed(2)
    ),

    segmentCount: Number(
      templateData.segmentAmount || 0
    ),

    usageCount: Number(
      templateData.usageAmount || 0
    ),

    likeCount: Number(
      templateData.likeAmount || 0
    ),

    playCount: Number(
      templateData.playAmount || 0
    ),

    commentCount: Number(
      templateData.commentAmount || 0
    ),

    createdAt: createTime
      ? new Date(
          createTime * 1000
        ).toISOString()
      : "",

    createdTimestamp: createTime,

    capabilities:
      Array.isArray(
        templateData.capabilityName
      )
        ? templateData.capabilityName
        : [],

    ugcLang:
      templateData.ugcLang || "",

    templateLanguage:
      templateData.templateLanguage || "",

    itemType:
      templateData.itemType,

    scene:
      templateData.scene,

    isValidRegion:
      templateData.is_valid_template_region ??
      loaderObj?.isValidTemplateRegion,

    useAvailable:
      templateData.useAvailable,

    author: {
      name:
        templateData.author?.name || "",

      avatarUrl:
        templateData.author?.avatarUrl || "",

      description:
        templateData.author?.description || "",

      profileUrl:
        templateData.author?.profileUrl
          ? `https://www.capcut.com${templateData.author.profileUrl}`
          : "",

      secUid:
        templateData.author?.secUid || "",

      uid:
        templateData.author?.uid || 0
    },

    collections:
      Array.isArray(
        templateData.collections
      )
        ? templateData.collections
        : [],

    recommendList:
      recommendList.length > 0
        ? recommendList
        : undefined
  };

  return {
    success: true,
    data: metadata
  };
}


/*
 * API ENDPOINT
 */

module.exports = createApi({
  name: "CapCut Scraper",

  description:
    "Scrape metadata dan video dari URL template CapCut.",

  method: "GET",

  endpoint: "/api/downloader/capcut",

  category: "Scraper",

  parameters: [
    {
      name: "url",
      type: "string",
      required: true,
      example:
        "https://www.capcut.com/tv2/ZSVEwBgtH/"
    }
  ],

  async handler(req, res) {
    const { url } = req.query || {};

    const check = requireParams(
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

    try {
      const result =
        await scrapeCapcut(url);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);

    } catch (error) {
      console.error(
        "[CAPCUT SCRAPER]",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Gagal mengambil data CapCut.",
        error:
          error.message || String(error)
      });
    }
  }
});