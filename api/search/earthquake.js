const createApi = require("../_lib/createApi");

const GEMPA_URL =
  "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json";

const SHAKEMAP_BASE =
  "https://data.bmkg.go.id/DataMKG/TEWS/";

const REQ_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/159.0.0.0 Mobile Safari/537.36",

  Accept:
    "application/json, text/plain, */*",

  "Accept-Language":
    "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
};

module.exports = createApi({
  name: "Latest Earthquake",

  description:
    "Mengambil informasi gempa terbaru dari BMKG beserta lokasi, magnitudo, kedalaman, potensi, koordinat, dan shakemap.",

  method: "GET",

  endpoint:
    "/api/search/earthquake",

  category: "Search",

  parameters: [],

  async handler(req, res) {
    try {
      const response =
        await fetch(
          GEMPA_URL,
          {
            headers: REQ_HEADERS
          }
        );

      if (!response.ok) {
        return res.status(502).json({
          success: false,

          message:
            `BMKG mengembalikan HTTP ${response.status}`
        });
      }

      const json =
        await response.json();

      const gempa =
        json?.Infogempa?.gempa;

      if (!gempa) {
        return res.status(404).json({
          success: false,

          message:
            "Data gempa terbaru tidak ditemukan."
        });
      }

      /*
       * Shakemap
       */
      let shakemap = null;

      if (gempa.Shakemap) {
        shakemap =
          gempa.Shakemap.startsWith("http")
            ? gempa.Shakemap
            : SHAKEMAP_BASE +
              gempa.Shakemap;
      }

      /*
       * Koordinat
       *
       * BMKG biasanya memberikan:
       * "Lintang": "6.95 LS"
       * "Bujur": "107.63 BT"
       */
      const lintang =
        gempa.Lintang || null;

      const bujur =
        gempa.Bujur || null;

      /*
       * Response
       */
      return res.status(200).json({
        success: true,

        data: {
          tanggal:
            gempa.Tanggal || null,

          jam:
            gempa.Jam || null,

          datetime:
            gempa.DateTime || null,

          magnitude:
            gempa.Magnitude
              ? Number(gempa.Magnitude)
              : null,

          satuan:
            "SR",

          kedalaman:
            gempa.Kedalaman || null,

          wilayah:
            gempa.Wilayah || null,

          potensi:
            gempa.Potensi || null,

          lintang,

          bujur,

          koordinat:
            gempa.Coordinates || null,

          shakemap
        },

        source:
          "BMKG"
      });

    } catch (error) {
      console.error(
        "EARTHQUAKE API ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Gagal mengambil data gempa dari BMKG.",

        error:
          error.message ||
          "Unknown error"
      });
    }
  }
});