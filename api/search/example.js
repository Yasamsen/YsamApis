// api/search/example.js
const createApi = require("../_lib/createApi");
const { requireParams } = require("../_lib/validate");

module.exports = createApi({
  name: "Example Search API",
  description: "Contoh endpoint pencarian yang mengembalikan data dummy",
  method: "GET",
  endpoint: "/api/search/example",
  category: "Search",
  parameters: [
    {
      name: "query",
      type: "string",
      required: true,
      example: "javascript"
    }
  ],
  async handler(req, res) {
    const { query } = req.query || {};

    const check = requireParams(req.query, ["query"]);
    if (!check.ok) {
      return res.status(400).json({
        success: false,
        message: `Parameter wajib diperlukan: ${check.missing.join(", ")}`
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        query,
        results: [
          { title: `Contoh hasil untuk "${query}" #1`, url: "https://example.com/1" },
          { title: `Contoh hasil untuk "${query}" #2`, url: "https://example.com/2" },
          { title: `Contoh hasil untuk "${query}" #3`, url: "https://example.com/3" }
        ]
      }
    });
  }
});
