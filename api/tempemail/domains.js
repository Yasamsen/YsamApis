const { getDomains } = require('../_lib/tempmail');

module.exports = async function handler(req, res) {
  try {
    const result = await getDomains();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Gagal mengambil daftar domain' });
  }
};