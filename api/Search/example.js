// api/Search/example.js
module.exports = {
  name: "Example Search",
  description: "Contoh endpoint pencarian, ganti sesuai kebutuhanmu.",
  method: "GET",
  endpoint: "/api/search",
  category: "Search",
  params: [
    { name: "q", type: "string", required: true, description: "Kata kunci pencarian" },
  ],
  example: {
    request: "/api/search?q=lofi+music",
    response: {
      success: true,
      data: [{ title: "Contoh hasil 1" }, { title: "Contoh hasil 2" }],
    },
  },
  async handler(req, res) {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Parameter q diperlukan",
      });
    }

    // TODO: ganti dengan logic pencarian kamu di sini
    return res.json({
      success: true,
      data: [
        { title: `Hasil untuk "${q}" #1` },
        { title: `Hasil untuk "${q}" #2` },
      ],
    });
  },
};
