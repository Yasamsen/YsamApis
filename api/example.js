const { withApiLimit } = require("./_lib/withApi");

const meta = {
  name: "Example API",
  description: "A simple example endpoint to verify SamApi is working.",
  method: "GET",
  endpoint: "/api/example",
  category: "Tools",
  parameters: [],
};

async function handler(req, res) {
  return res.json({
    success: true,
    message: "SamApi is working",
    data: { status: "online" },
  });
}

module.exports = withApiLimit({ ...meta, handler });
module.exports.meta = meta;
