const { getInbox } = require('../_lib/tempmail');

module.exports = async function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Parameter "email" wajib diisi' });
  }

  try {
    const result = await getInbox(email);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Gagal mengambil inbox' });
  }
};