// api/example.js
const createApi = require("./_lib/createApi");

module.exports = createApi({
  name: "Example API",
  description: "Endpoint contoh untuk mengetes bahwa SamApi berjalan dengan baik",
  method: "GET",
  endpoint: "/api/example",
  category: "Other",
  parameters: [],
  async handler(req, res) {
    return res.status(200).json({
      success: true,
      message: "SamApi is working",
      data: {
        status: "online"
      }
    });
  }
});
