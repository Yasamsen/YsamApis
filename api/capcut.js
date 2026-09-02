const axios = require("axios");

/* =========================================================
   CAPCUT API
   ========================================================= */

function extractHashtags(text) {
  if (!text) return [];

  const matches =
    text.match(/#[\w\u0590-\u05ff]+/gi) || [];

  return [...new Set(matches)];
}


/* =========================================================
   HELPERS
   ========================================================= */

function getRegex(html, regex) {
  try {
    return (
      html
        .match(regex)?.[1]
        ?.replace(/\\u002F/g, "/")
        ?.replace(/\\"/g, '"') || ""
    );
  } catch {
    return "";
  }
}


function getNum(html, regex) {
  try {
    return parseInt(
      html.match(regex)?.[1] || "0",
      10
    );
  } catch {
    return 0;
  }
}


/* =========================================================
   SCRAPER
   ========================================================= */

async function scrapeCapcut(inputUrl) {

  try {

    if (
      !inputUrl ||
      !inputUrl.includes("capcut.com")
    ) {

      return {
        success: false,
        error:
          "URL CapCut tidak valid. Contoh: https://www.capcut.com/tv2/ZSVEwBgtH/"
      };

    }


    const response = await axios.get(
      inputUrl,
      {
        headers: {

          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",

          "Accept-Language":
            "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",

          "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"

        },

        timeout: 15000,

        maxRedirects: 5

      }
    );


    const html = response.data;

    let templateData = null;
    let loaderObj = null;


    /* =====================================================
       SEARCH LOADER DATA
       ===================================================== */

    const scripts = [
      ...html.matchAll(
        /<script[^>]*>([\s\S]*?)<\/script>/g
      )
    ];


    for (const script of scripts) {

      const content = script[1];

      if (!content.includes("loaderData")) {
        continue;
      }


      try {

        const parsed =
          JSON.parse(content);


        loaderObj =
          parsed.loaderData?.[
            "template-detail_$"
          ] ||
          parsed.loaderData?.[
            "template_detail"
          ];


        if (
          loaderObj?.templateDetail
        ) {

          templateData =
            loaderObj.templateDetail;

          break;

        }

      } catch {
        // Script bukan JSON valid
      }

    }


    /* =====================================================
       FALLBACK REGEX
       ===================================================== */

    if (!templateData) {

      const videoUrl =
        getRegex(
          html,
          /"videoUrl":"(.*?)"/
        );


      if (!videoUrl) {

        return {
          success: false,
          error:
            "Gagal mengekstrak metadata dari URL CapCut."
        };

      }


      const coverUrl =
        getRegex(
          html,
          /"coverUrl":"(.*?)"/
        );


      const title =
        getRegex(
          html,
          /"title":"(.*?)"/
        );


      const description =
        getRegex(
          html,
          /"desc":"(.*?)"/
        );


      const templateId =
        getRegex(
          html,
          /"templateId":"(.*?)"/
        );


      const width =
        getNum(
          html,
          /"videoWidth":([0-9]+)/
        );


      const height =
        getNum(
          html,
          /"videoHeight":([0-9]+)/
        );


      const duration =
        getNum(
          html,
          /"templateDuration":([0-9]+)/
        );


      const createTime =
        getNum(
          html,
          /"createTime":([0-9]+)/
        );


      const segmentCount =
        getNum(
          html,
          /"segmentAmount":([0-9]+)/
        );


      const usageCount =
        getNum(
          html,
          /"usageAmount":([0-9]+)/
        );


      const likeCount =
        getNum(
          html,
          /"likeAmount":([0-9]+)/
        ) ||
        getNum(
          html,
          /"likeCount":([0-9]+)/
        );


      const playCount =
        getNum(
          html,
          /"playAmount":([0-9]+)/
        ) ||
        getNum(
          html,
          /"playCount":([0-9]+)/
        );


      const commentCount =
        getNum(
          html,
          /"commentAmount":([0-9]+)/
        );


      const authorName =
        getRegex(
          html,
          /"author":\{.*?"name":"(.*?)"/
        );


      const authorAvatar =
        getRegex(
          html,
          /"avatarUrl":"(.*?)"/
        );


      return {

        success: true,

        data: {

          id: templateId,

          title:
            title ||
            "CapCut Template",

          description,

          hashtags:
            extractHashtags(
              description
            ),

          coverUrl,

          videoUrl,

          videoWidth: width,

          videoHeight: height,

          videoRatio:
            width && height
              ? `${width}:${height}`
              : "9:16",

          durationMs:
            duration,

          durationSec:
            Number(
              (
                duration / 1000
              ).toFixed(2)
            ),

          segmentCount,

          usageCount,

          likeCount,

          playCount,

          commentCount,

          createdAt:
            createTime
              ? new Date(
                  createTime * 1000
                ).toISOString()
              : "",

          createdTimestamp:
            createTime,

          capabilities: [],

          author: {

            name:
              authorName,

            avatarUrl:
              authorAvatar

          },

          originalUrl:
            inputUrl

        }

      };

    }


    /* =====================================================
       NORMAL LOADER DATA
       ===================================================== */

    const createTime =
      Number(
        templateData.createTime || 0
      );


    const duration =
      Number(
        templateData.templateDuration || 0
      );


    /* =====================================================
       RECOMMENDATIONS
       ===================================================== */

    const rawRecommend =
      Array.isArray(
        loaderObj?.recommendList
      )
        ? loaderObj.recommendList
        : [];


    const recommendList =
      rawRecommend.map(
        (item) => {

          const itemCreateTime =
            Number(
              item.createTime || 0
            );


          const hasAuthor =
            Boolean(
              item.author?.name ||
              item.author?.avatarUrl ||
              item.author?.secUid
            );


          const author =
            hasAuthor
              ? {

                  name:
                    item.author?.name ||
                    undefined,

                  avatarUrl:
                    item.author?.avatarUrl ||
                    undefined,

                  description:
                    item.author?.description ||
                    undefined,

                  profileUrl:
                    item.author?.profileUrl
                      ? `https://www.capcut.com${item.author.profileUrl}`
                      : undefined,

                  secUid:
                    item.author?.secUid ||
                    undefined

                }
              : undefined;


          return {

            templateId:
              String(
                item.templateId || ""
              ),

            title:
              item.title || "",

            description:
              item.desc || "",

            coverUrl:
              item.coverUrl || "",

            videoUrl:
              item.videoUrl
                ? item.videoUrl
                : undefined,

            usageCount:
              Number(
                item.usageAmount || 0
              ),

            likeCount:
              Number(
                item.likeAmount || 0
              ),

            createdAt:
              itemCreateTime
                ? new Date(
                    itemCreateTime * 1000
                  ).toISOString()
                : undefined,

            createdTimestamp:
              itemCreateTime ||
              undefined,

            canonicalUrl:
              item.canonicalPath
                ? `https://www.capcut.com${item.canonicalPath}`
                : undefined,

            author

          };

        }
      );


    /* =====================================================
       DESCRIPTION
       ===================================================== */

    const description =
      templateData.desc || "";


    /* =====================================================
       METADATA
       ===================================================== */

    const metadata = {

      id:
        String(
          templateData.templateId ||
          loaderObj?.templateId ||
          ""
        ),


      title:
        templateData.title || "",


      description,


      hashtags:
        extractHashtags(
          description
        ),


      tagTitle:
        templateData.tagTitle || "",


      canonicalUrl:
        loaderObj?.canonicalPath
          ? `https://www.capcut.com${loaderObj.canonicalPath}`
          : (
              templateData
                .structuredData
                ?.url || ""
            ),


      originalUrl:
        inputUrl,


      coverUrl:
        templateData.coverUrl || "",


      videoUrl:
        templateData.videoUrl || "",


      videoWidth:
        Number(
          templateData.videoWidth || 0
        ),


      videoHeight:
        Number(
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


      durationMs:
        duration,


      durationSec:
        Number(
          (
            duration / 1000
          ).toFixed(2)
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


      createdAt:
        createTime
          ? new Date(
              createTime * 1000
            ).toISOString()
          : "",


      createdTimestamp:
        createTime,


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
          templateData.author?.name ||
          "",

        avatarUrl:
          templateData.author?.avatarUrl ||
          "",

        description:
          templateData.author?.description ||
          "",

        profileUrl:
          templateData.author?.profileUrl
            ? `https://www.capcut.com${templateData.author.profileUrl}`
            : "",

        secUid:
          templateData.author?.secUid ||
          "",

        uid:
          templateData.author?.uid ||
          0

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


  } catch (error) {

    return {

      success: false,

      error:
        error?.message ||
        String(error)

    };

  }

}


/* =========================================================
   YASAM API ENDPOINT
   ========================================================= */

module.exports = {

  name: "CapCut",

  description:
    "Scrape metadata, video, cover, author, statistics, collections, dan rekomendasi dari template CapCut.",

  method: "GET",

  endpoint:
    "/api/capcut",

  parameters: {

    url: {

      type: "string",

      required: true,

      description:
        "URL template CapCut. Contoh: https://www.capcut.com/tv2/ZSVEwBgtH/"

    }

  },


  example: {

    request:
      "/api/capcut?url=https://www.capcut.com/tv2/ZSVEwBgtH/",

    response: {

      success: true,

      data: {

        id: "template-id",

        title:
          "CapCut Template",

        description:
          "Template CapCut #viral",

        hashtags: [
          "#viral"
        ],

        coverUrl:
          "https://example.com/cover.jpg",

        videoUrl:
          "https://example.com/video.mp4",

        videoWidth: 1080,

        videoHeight: 1920,

        videoRatio:
          "1080:1920",

        durationMs:
          15000,

        durationSec:
          15,

        usageCount:
          1000,

        likeCount:
          500,

        playCount:
          10000,

        commentCount:
          20,

        author: {

          name:
            "Creator",

          avatarUrl:
            "https://example.com/avatar.jpg"

        },

        originalUrl:
          "https://www.capcut.com/tv2/ZSVEwBgtH/"

      }

    }

  },


  async handler(req, res) {

    const url =
      req.query?.url;


    if (!url) {

      return res.status(400).json({

        success: false,

        error:
          "Parameter url diperlukan.",

        example:
          "/api/capcut?url=https://www.capcut.com/tv2/ZSVEwBgtH/"

      });

    }


    const result =
      await scrapeCapcut(url);


    if (!result.success) {

      return res.status(400).json(
        result
      );

    }


    return res.status(200).json(
      result
    );

  }

};