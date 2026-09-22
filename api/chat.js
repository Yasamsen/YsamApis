import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method tidak diizinkan" });
  }

  try {
    const { text, message, history = [] } = req.body || {};

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY belum diset di Vercel." });
    }

    if (!message && !text) {
      return res.status(400).json({ error: "Pesan atau teks OCR kosong." });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const ocrText = String(text || "").trim();
    const userMessage = String(message || "Jelaskan isi teks OCR ini dan bantu saya.");

    const contents = [];

    for (const item of Array.isArray(history) ? history.slice(-12) : []) {
      if (!item || !item.role || !item.text) continue;
      contents.push({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: String(item.text) }]
      });
    }

    contents.push({
      role: "user",
      parts: [{
        text:
`Kamu adalah Alya OCR Copilot.

Teks berikut berasal dari OCR screenshot. Jangan mengarang isi teks OCR.
Jika ada karakter yang tampak ambigu, katakan bahwa OCR mungkin salah dan minta screenshot yang lebih jelas bila diperlukan.

=== HASIL OCR ===
${ocrText || "(tidak ada teks OCR)"}
=== AKHIR OCR ===

Instruksi pengguna:
${userMessage}`
      }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction:
          "Jawab dalam bahasa Indonesia kecuali pengguna meminta bahasa lain. " +
          "Untuk kode/error, pertahankan karakter kode dengan tepat dan gunakan markdown bila membantu.",
        temperature: 0.2,
        maxOutputTokens: 2048
      }
    });

    return res.status(200).json({
      ok: true,
      answer: response.text || "Gemini tidak mengembalikan jawaban."
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error?.message || "Terjadi kesalahan saat menghubungi Gemini."
    });
  }
}
