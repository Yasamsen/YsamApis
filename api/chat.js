export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method tidak diizinkan." });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY belum dipasang di Vercel → Settings → Environment Variables."
      });
    }

    const body = req.body || {};
    const ocrText = String(body.text || "").trim();
    const message = String(body.message || "Jelaskan teks OCR ini dan bantu saya.").trim();
    const history = Array.isArray(body.history) ? body.history.slice(-10) : [];

    const parts = [];

    for (const item of history) {
      if (!item?.text) continue;
      parts.push({
        text: `${item.role === "assistant" ? "Alya" : "User"}: ${String(item.text)}`
      });
    }

    parts.push({
      text: `Kamu adalah Alya OCR Copilot.

Teks berikut berasal dari OCR screenshot. Jangan mengarang isi OCR.
Jika ada karakter yang mungkin salah dibaca OCR, beri tahu pengguna.

=== HASIL OCR ===
${ocrText || "(tidak ada teks OCR)"}
=== AKHIR OCR ===

Instruksi pengguna:
${message}`
    });

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          systemInstruction: {
            parts: [{
              text: "Jawab dalam bahasa Indonesia kecuali pengguna meminta bahasa lain. Untuk kode/error, pertahankan karakter kode dengan teliti."
            }]
          },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API:", data);
      return res.status(response.status >= 400 && response.status < 600 ? response.status : 500).json({
        error: data?.error?.message || "Gemini API gagal memproses permintaan."
      });
    }

    const answer =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") ||
      "Gemini tidak mengembalikan jawaban.";

    return res.status(200).json({ ok: true, answer });
  } catch (error) {
    console.error("Function error:", error);
    return res.status(500).json({
      error: error?.message || "Internal server error."
    });
  }
}
