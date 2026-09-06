const { withApiLimit } = require("../_lib/withApi");

const meta = {
  name: "Example Search API",
  description: "A sample search endpoint demonstrating query parameters.",
  method: "GET",
  endpoint: "/api/search/example",
  category: "Search",
  parameters: [
    { name: "query", type: "string", required: true, example: "hello world" },
  ],
};

async function handler(req, res) {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ success: false, message: "Parameter query diperlukan" });
  }
  return res.json({
    success: false,
    message: "Endpoint belum dikonfigurasi.",
  });
}

module.exports = withApiLimit({ ...meta, handler });
module.exports.meta = meta;
