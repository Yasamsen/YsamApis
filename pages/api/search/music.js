/**
 * @method GET
 * @description Cari lagu berdasarkan judul atau nama artis.
 * @param q string required - Kata kunci pencarian (judul/artis).
 * @param limit number optional - Jumlah hasil maksimal (default 10).
 */
export default async function handler(req, res) {
  const { q, limit = 10 } = req.query;

  if (!q) {
    return res.status(400).json({
      status: false,
      message: "Parameter 'q' wajib diisi.",
    });
  }

  try {
    // TODO: ganti bagian ini dengan sumber pencarian musik yang sebenarnya.
    const dummyResults = Array.from({ length: Math.min(Number(limit) || 3, 3) }).map((_, i) => ({
      title: `${q} (hasil dummy ${i + 1})`,
      artist: "Artis Contoh",
      duration: "3:24",
      preview_url: "https://example.com/preview.mp3",
    }));

    return res.status(200).json({
      status: true,
      creator: "api-hub",
      query: q,
      result: dummyResults,
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: "Terjadi kesalahan server." });
  }
}
