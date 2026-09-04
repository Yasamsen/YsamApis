const createApi = require("../_lib/createApi");
const { requireParams } = require("../_lib/validate");

const { searchPinterest } = require("@hiudyy/ytdl");

module.exports = createApi({
  name: "Pinterest Search",

  description:
    "Mencari gambar Pinterest berdasarkan kata kunci.",

  method: "GET",

  endpoint:
    "/api/search/pinterest",

  category: "Search",

  parameters: [
    {
      name: "q",
      type: "string",
      required: true,
      example: "anime"
    }
  ],

  async handler(req, res) {
    const check = requireParams(
      req.query,
      ["q"]
    );

    if (!check.ok) {
      return res.status(400).json({
        success: false,
        message:
          `Parameter wajib diperlukan: ${check.missing.join(", ")}`
      });
    }

    const query =
      String(req.query.q || "").trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message:
          "Parameter q tidak boleh kosong."
      });
    }

    try {
      const results =
        await searchPinterest(query);

      const items =
        Array.isArray(results)
          ? results
          : [];

      const images = items
        .filter(item => {
          if (typeof item === "string") {
            return item.startsWith("http");
          }

          return Boolean(
            item?.url ||
            item?.image ||
            item?.imageUrl
          );
        })
        .map((item, index) => {
          if (typeof item === "string") {
            return {
              index: index + 1,
              image: item
            };
          }

          return {
            index: index + 1,
            image:
              item.url ||
              item.image ||
              item.imageUrl ||
              null,

            title:
              item.title ||
              null,

            pinUrl:
              item.pinUrl ||
              item.link ||
              item.source ||
              null
          };
        })
        .filter(item => item.image);

      return res.status(200).json({
        success: true,

        data: {
          query,

          total:
            images.length,

          images
        },

        source: "Pinterest"
      });

    } catch (error) {
      console.error(
        "PINTEREST SEARCH ERROR:",
        error.message
      );

      return res.status(500).json({
        success: false,

        message:
          "Gagal mencari gambar Pinterest.",

        error:
          error.message
      });
    }
  }
});