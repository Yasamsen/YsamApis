const { customEmail } = require('../_lib/tempmail');

module.exports = async function handler(req, res) {
  const { prefix, domain } = req.query;

  if (!prefix || !domain) {
    return res.status(400).json({ success: false, error: 'Parameter "prefix" dan "domain" wajib diisi' });
  }

  try {
    const result = await customEmail(prefix, domain);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Gagal membuat email custom' });
  }
};