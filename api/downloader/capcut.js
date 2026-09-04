// api/downloader/capcut.js

const axios = require("axios");
const createApi = require("../_lib/createApi");
const { requireParams } = require("../_lib/validate");

function extractHashtags(text) {
  if (!text) return [];

  const matches = text.match(/#[\p{L}\p{N}_]+/gu) || [];

  return [...new Set(
    matches.map(tag => tag.slice(1))
  )];
}

function decodeValue(value) {
  if (!value) return "";

  try {
    return value
      .replace(/\\u002F/g, "/")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  } catch {
    return value;
  }
}

function getString(html, regex) {
  const match = html.match(regex);
  return decodeValue(match?.[1] || "");
}

function getNumber(html, regex) {
  const match = html.match(regex);

  if (!match?.[1]) return 0;

  const number = Number(match[1]);

  return Number.isFinite(number) ? number : 0;
}

function findLoaderData(html) {
  const scripts = [
    ...html.matchAll(
      /<script[^>]*>([\s\S]*?)<\/script>/gi
    )
  ];

  for (const script of scripts) {
    const content = script[1];

    if (!content || !content.includes("loaderData")) {
      continue;
    }

    try {
      const parsed = JSON.parse(content);

      const loader =
        parsed.loaderData?.["template-detail_$"] ||
        parsed.loaderData?.["template_detail"];

      if (loader) {
        return loader;
      }
    } catch {
      // Lanjut ke script berikutnya
    }
  }

  return null;
}

function buildMetadataFromRegex(html, inputUrl) {
  const videoUrl = getString(
    html,
    /"videoUrl"\s*:\s*"([^"]*)"/
  );

  if (!videoUrl) {
    return null;
  }

  const coverUrl = getString(
    html,
    /"coverUrl"\s*:\s*"([^"]*)"/
  );

  const title = getString(
    html,
    /"title"\s*:\s*"([^"]*)"/
  );

  const description = getString(
    html,
    /"desc"\s*:\s*"([^"]*)"/
  );

  const templateId = getString(
    html,
    /"templateId"\s*:\s*"([^"]*)"/
  );

  const width = getNumber(
    html,
    /"videoWidth"\s*:\s*([0-9]+)/
  );

  const height = getNumber(
    html,
    /"videoHeight"\s*:\s*([0-9]+)/
  );

  const duration = getNumber(
    html,
    /"templateDuration"\s*:\s*([0-9]+)/
  );

  const createTime = getNumber(
    html,
    /"createTime"\s*:\s*([0-9]+)/
  );

  const segmentCount = getNumber(
    html,
    /"segmentAmount"\s*:\s*([0-9]+)/
  );

  const usageCount = getNumber(
    html,
    /"usageAmount"\s*:\s*([0-9]+)/
  );

  const likeCount =
    getNumber(html, /"likeAmount"\s*:\s*([0-9]+)/) ||
    getNumber(html, /"likeCount"\s*:\s*([0-9]+)/);

  const playCount =
    getNumber(html, /"playAmount"\s*:\s*([0-9]+)/) ||
    getNumber(html, /"playCount"\s*:\s*([0-9]+)/);

  const commentCount = getNumber(
    html,
    /"commentAmount"\s*:\s*([0-9]+)/
  );

  const authorName = getString(
    html,
    /"author"\s*:\s*\{[\s\S]*?"name"\s*:\s*"([^"]*)"/
  );

  const authorAvatar = getString(
    html,
    /"avatarUrl"\s*:\s*"([^"]*)"/
  );

  return {
    id: templateId,
    title: title || "CapCut Template",
    description,
    hashtags: extractHashtags(description),

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

    segmentCount,
    usageCount,
    likeCount,
    playCount,
    commentCount,

    createdAt: createTime
      ? new Date(createTime * 1000).toISOString()
      : "",

    createdTimestamp: createTime,

    capabilities: [],

    author: {
      name: authorName,
      avatarUrl: authorAvatar
    },

    originalUrl: inputUrl
  };
}

function buildMetadataFromLoader(
  templateData,
  loaderObj,
  inputUrl
) {
  if (!templateData) return null;

  const createTime =
    Number(templateData.createTime || 0);

  const duration =
    Number(templateData.templateDuration || 0);

  const width =
    Number(templateData.videoWidth || 0);

  const height =
    Number(templateData.videoHeight || 0);

  const description =
    templateData.desc || "";

  const rawRecommend =
    Array.isArray(loaderObj?.recommendList)
      ? loaderObj.recommendList
      : [];

  const recommendList = rawRecommend.map(item => {
    const itemCreateTime =
      Number(item.createTime || 0);

    let author;

    const hasAuthor = Boolean(
      item.author?.name ||
      item.author?.avatarUrl ||
      item.author?.secUid
    );

    if (hasAuthor) {
      author = {
        name: item.author?.name || "",
        avatarUrl: item.author?.avatarUrl || "",
        description: item.author?.description || "",
        profileUrl: item.author?.profileUrl
          ? `https://www.capcut.com${item.author.profileUrl}`
          : "",
        secUid: item.author?.secUid || ""
      };
    }

    return {
      templateId: String(
        item.templateId || ""
      ),

      title: item.title || "",

      description: item.desc || "",

      coverUrl: item.coverUrl || "",

      videoUrl: item.videoUrl || "",

      usageCount:
        Number(item.usageAmount || 0),

      likeCount:
        Number(item.likeAmount || 0),

      createdAt: itemCreateTime
        ? new Date(
            itemCreateTime * 1000
          ).toISOString()
        : "",

      createdTimestamp:
        itemCreateTime || 0,

      canonicalUrl:
        item.canonicalPath
          ? `https://www.capcut.com${item.canonicalPath}`
          : "",

      author
    };
  });

  return {
    id: String(
      templateData.templateId ||
      loaderObj?.templateId ||
      ""
    ),

    title: templateData.title || "",

    description,

    hashtags:
      extractHashtags(description),

    tagTitle:
      templateData.tagTitle || "",

    canonicalUrl:
      loaderObj?.canonicalPath
        ? `https://www.capcut.com${loaderObj.canonicalPath}`
        : (
            templateData.structuredData?.url ||
            ""
          ),

    originalUrl: inputUrl,

    coverUrl:
      templateData.coverUrl || "",

    videoUrl:
      templateData.videoUrl || "",

    videoWidth: width,

    videoHeight: height,

    videoRatio:
      templateData.videoRatio ||
      (
        width && height
          ? `${width}:${height}`
          : ""
      ),

    durationMs: duration,

    durationSec: Number(
      (duration / 1000).toFixed(2)
    ),

    segmentCount:
      Number(
        templateData.segmentAmount || 0
      ),

    usageCount:
      Number(
        templateData.usageAmount || 0
      ),

    likeCount:
      Number(
        templateData.likeAmount || 0
      ),

    playCount:
      Number(
        templateData.playAmount || 0
      ),

    commentCount:
      Number(
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
      templateData.itemType || "",

    scene:
      templateData.scene || "",

    isValidRegion:
      templateData.is_valid_template_region ??
      loaderObj?.isValidTemplateRegion ??
      null,

    useAvailable:
      templateData.useAvailable ?? null,

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
        Number(
          templateData.author?.uid || 0
        )
    },

    collections:
      Array.isArray(
        templateData.collections
      )
        ? templateData.collections
        : [],

    recommendList:
      recommendList.length
        ? recommendList
        : []
  };
}

module.exports = createApi({
  name: "CapCut Downloader",
  description:
    "Mengambil metadata dan URL video dari template CapCut.",
  method: "GET",
  endpoint: "/api/downloader/capcut",
  category: "Downloader",

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

    const inputUrl =
      String(req.query.url || "").trim();

    let parsedUrl;

    try {
      parsedUrl = new URL(inputUrl);
    } catch {
      return res.status(400).json({
        success: false,
        message: "URL tidak valid."
      });
    }

    if (
      !parsedUrl.hostname
        .toLowerCase()
        .endsWith("capcut.com")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "URL harus berasal dari CapCut."
      });
    }

    try {
      const response = await axios.get(
        inputUrl,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",

            "Accept-Language":
              "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",

            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",

            Referer:
              "https://www.capcut.com/"
          },

          timeout: 15000,

          maxRedirects: 5,

          validateStatus: status =>
            status >= 200 && status < 400
        }
      );

      const html =
        typeof response.data === "string"
          ? response.data
          : String(response.data || "");

      if (!html) {
        return res.status(502).json({
          success: false,
          message:
            "CapCut tidak mengembalikan halaman HTML."
        });
      }

      /*
       * Coba metode loaderData terlebih dahulu.
       */
      const loaderObj =
        findLoaderData(html);

      if (loaderObj?.templateDetail) {
        const data =
          buildMetadataFromLoader(
            loaderObj.templateDetail,
            loaderObj,
            inputUrl
          );

        if (data) {
          return res.status(200).json({
            success: true,
            data
          });
        }
      }

      /*
       * Jika loaderData tidak ditemukan,
       * gunakan fallback regex.
       */
      const fallback =
        buildMetadataFromRegex(
          html,
          inputUrl
        );

      if (!fallback) {
        return res.status(404).json({
          success: false,
          message:
            "Gagal mengekstrak data template CapCut. Struktur halaman mungkin telah berubah atau CapCut memblokir permintaan."
        });
      }

      return res.status(200).json({
        success: true,
        data: fallback
      });

    } catch (error) {
      console.error(
        "CAPCUT DOWNLOADER ERROR:",
        error
      );

      const status =
        error.response?.status || 500;

      if (status === 403) {
        return res.status(403).json({
          success: false,
          message:
            "Permintaan ke CapCut ditolak (403)."
        });
      }

      if (status === 404) {
        return res.status(404).json({
          success: false,
          message:
            "Halaman/template CapCut tidak ditemukan."
        });
      }

      if (
        error.code === "ECONNABORTED" ||
        error.code === "ETIMEDOUT"
      ) {
        return res.status(504).json({
          success: false,
          message:
            "Request ke CapCut timeout."
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Gagal mengambil data dari CapCut.",
        error:
          error.message || String(error)
      });
    }
  }
});