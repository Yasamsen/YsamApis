const { generateEmail } = require('../_lib/tempmail');

module.exports = async function handler(req, res) {
  try {
    const result = await generateEmail();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Gagal generate email' });
  }
};