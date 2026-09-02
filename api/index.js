module.exports = function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  return res.status(200).json({
    success: true,
    message: 'SamApi is online',
    docs: '/docs.html'
  });
};
