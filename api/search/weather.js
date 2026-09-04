// api/search/weather.js

const axios = require("axios");
const createApi = require("../_lib/createApi");
const { requireParams } = require("../_lib/validate");

/*
 * API BMKG
 */
const BMKG_API =
  "https://api.bmkg.go.id/publik/prakiraan-cuaca";

/*
 * Daftar kode cuaca BMKG.
 *
 * 0  = Cerah
 * 1  = Cerah Berawan
 * 2  = Cerah Berawan
 * 3  = Berawan
 * 4  = Berawan Tebal
 * 5  = Udara Kabur
 * 10 = Asap
 * 45 = Kabut
 * 60 = Hujan Ringan
 * 61 = Hujan Sedang
 * 63 = Hujan Lebat
 * 80 = Hujan Lokal
 * 95 = Hujan Petir
 * 97 = Hujan Petir
 */
const WEATHER_CODES = {
  0: "Cerah",
  1: "Cerah Berawan",
  2: "Cerah Berawan",
  3: "Berawan",
  4: "Berawan Tebal",
  5: "Udara Kabur",
  10: "Asap",
  45: "Kabut",
  60: "Hujan Ringan",
  61: "Hujan Sedang",
  63: "Hujan Lebat",
  80: "Hujan Lokal",
  95: "Hujan Petir",
  97: "Hujan Petir"
};


/*
 * Normalisasi text untuk pencarian.
 */
function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


/*
 * Mengambil data wilayah BMKG.
 *
 * File wilayah BMKG berisi kode adm4,
 * provinsi, kota/kabupaten, kecamatan,
 * dan desa/kelurahan.
 */
async function getRegions() {
  const urls = [
    "https://raw.githubusercontent.com/infoBMKG/data-cuaca/master/adm4.json",
    "https://raw.githubusercontent.com/infoBMKG/data-cuaca/master/adm4/adm4.json"
  ];

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        timeout: 10000
      });

      if (Array.isArray(response.data)) {
        return response.data;
      }

      if (
        response.data &&
        typeof response.data === "object"
      ) {
        /*
         * Beberapa format bisa berupa object.
         */
        const values =
          Object.values(response.data);

        if (values.length) {
          return values;
        }
      }
    } catch (_) {}
  }

  return [];
}


/*
 * Cari wilayah berdasarkan provinsi + kota.
 */
async function findRegion(provinsi, kota) {
  const regions =
    await getRegions();

  if (!regions.length) {
    return null;
  }

  const province =
    normalizeText(provinsi);

  const city =
    normalizeText(kota);

  /*
   * Exact match terlebih dahulu.
   */
  let result = regions.find(item => {
    const itemProvince =
      normalizeText(
        item.province ||
        item.provinsi ||
        item.province_name
      );

    const itemCity =
      normalizeText(
        item.city ||
        item.kota ||
        item.kabupaten ||
        item.city_name
      );

    return (
      itemProvince === province &&
      itemCity === city
    );
  });

  if (result) {
    return result;
  }

  /*
   * Partial match.
   */
  result = regions.find(item => {
    const itemProvince =
      normalizeText(
        item.province ||
        item.provinsi ||
        item.province_name
      );

    const itemCity =
      normalizeText(
        item.city ||
        item.kota ||
        item.kabupaten ||
        item.city_name
      );

    return (
      itemProvince.includes(province) &&
      itemCity.includes(city)
    );
  });

  return result || null;
}


/*
 * Konversi kode cuaca BMKG.
 */
function weatherDescription(code) {
  const numericCode =
    Number(code);

  return (
    WEATHER_CODES[numericCode] ||
    "Kondisi Cuaca Tidak Diketahui"
  );
}


/*
 * Parse data prakiraan BMKG.
 */
function parseForecast(data) {
  const result = [];

  /*
   * Struktur API BMKG:
   *
   * data -> []
   * setiap item memiliki:
   * lokasi
   * cuaca
   */

  const lokasi =
    data?.lokasi || {};

  const forecasts =
    Array.isArray(data?.data)
      ? data.data
      : [];

  /*
   * Format API BMKG terbaru biasanya:
   *
   * data:
   * [
   *   {
   *     lokasi: {...},
   *     cuaca: [
   *       [...]
   *     ]
   *   }
   * ]
   *
   * Karena itu kita dukung array bertingkat.
   */
  for (const group of forecasts) {
    const weatherGroups =
      Array.isArray(group?.cuaca)
        ? group.cuaca
        : [];

    for (const weatherGroup of weatherGroups) {
      const items =
        Array.isArray(weatherGroup)
          ? weatherGroup
          : [weatherGroup];

      for (const item of items) {
        if (!item) continue;

        const weatherCode =
          Number(item.weather ?? 0);

        result.push({
          utcDatetime:
            item.utc_datetime || "",

          localDatetime:
            item.local_datetime || "",

          temperature:
            Number(item.t ?? 0),

          humidity:
            Number(item.hu ?? 0),

          weatherCode,

          weather:
            item.weather_desc ||
            weatherDescription(
              weatherCode
            ),

          weatherEnglish:
            item.weather_desc_en || "",

          windSpeed:
            Number(item.ws ?? 0),

          windDirection:
            item.wd || "",

          cloudCover:
            Number(item.tcc ?? 0),

          visibility:
            item.vs_text || "",

          analysisDate:
            item.analysis_date || ""
        });
      }
    }
  }

  return {
    lokasi,
    forecast: result
  };
}


module.exports = createApi({
  name: "Weather",

  description:
    "Mengambil prakiraan cuaca berdasarkan provinsi dan kota menggunakan data resmi BMKG.",

  method: "GET",

  endpoint:
    "/api/search/weather",

  category: "Search",

  parameters: [
    {
      name: "provinsi",

      type: "string",

      required: true,

      example:
        "Jawa Barat"
    },

    {
      name: "kota",

      type: "string",

      required: true,

      example:
        "Kota Bandung"
    }
  ],

  async handler(req, res) {
    /*
     * Validasi parameter.
     */
    const check =
      requireParams(
        req.query,
        [
          "provinsi",
          "kota"
        ]
      );

    if (!check.ok) {
      return res.status(400).json({
        success: false,

        message:
          `Parameter wajib diperlukan: ${check.missing.join(", ")}`
      });
    }

    const provinsi =
      String(
        req.query.provinsi || ""
      ).trim();

    const kota =
      String(
        req.query.kota || ""
      ).trim();

    if (!provinsi || !kota) {
      return res.status(400).json({
        success: false,

        message:
          "Parameter provinsi dan kota tidak boleh kosong."
      });
    }

    try {
      /*
       * Cari kode wilayah BMKG.
       */
      const region =
        await findRegion(
          provinsi,
          kota
        );

      if (!region) {
        return res.status(404).json({
          success: false,

          message:
            "Wilayah tidak ditemukan.",

          detail: {
            provinsi,
            kota
          }
        });
      }

      /*
       * Ambil adm4.
       */
      const adm4 =
        String(
          region.adm4 ||
          region.kode ||
          region.kode_wilayah ||
          region.code ||
          ""
        );

      if (!adm4) {
        return res.status(500).json({
          success: false,

          message:
            "Kode wilayah BMKG tidak ditemukan."
        });
      }

      /*
       * Request ke API resmi BMKG.
       */
      const response =
        await axios.get(
          BMKG_API,
          {
            params: {
              adm4
            },

            timeout: 15000,

            headers: {
              "User-Agent":
                "SamApi/1.0",

              Accept:
                "application/json"
            }
          }
        );

      if (!response.data) {
        return res.status(502).json({
          success: false,

          message:
            "BMKG tidak mengembalikan data."
        });
      }

      /*
       * Parse prakiraan.
       */
      const parsed =
        parseForecast(
          response.data
        );

      /*
       * Pastikan ada data cuaca.
       */
      if (
        !parsed.forecast ||
        !parsed.forecast.length
      ) {
        return res.status(404).json({
          success: false,

          message:
            "Data prakiraan cuaca tidak tersedia untuk wilayah tersebut."
        });
      }

      /*
       * Response API.
       */
      return res.status(200).json({
        success: true,

        data: {
          location: {
            provinsi:
              parsed.lokasi?.provinsi ||
              region.province ||
              region.provinsi ||
              provinsi,

            kota:
              parsed.lokasi?.kotkab ||
              parsed.lokasi?.kota ||
              region.city ||
              region.kota ||
              region.kabupaten ||
              kota,

            kecamatan:
              parsed.lokasi?.kecamatan ||
              region.district ||
              region.kecamatan ||
              "",

            desa:
              parsed.lokasi?.desa ||
              region.village ||
              region.desa ||
              "",

            adm4
          },

          forecast:
            parsed.forecast,

          source:
            "BMKG"
        }
      });

    } catch (error) {
      console.error(
        "WEATHER API ERROR:",
        error
      );

      const status =
        error.response?.status || 500;

      if (status === 404) {
        return res.status(404).json({
          success: false,

          message:
            "Data cuaca BMKG tidak ditemukan."
        });
      }

      if (status === 429) {
        return res.status(429).json({
          success: false,

          message:
            "Batas request BMKG tercapai. Silakan coba lagi nanti."
        });
      }

      if (
        error.code ===
          "ECONNABORTED" ||
        error.code ===
          "ETIMEDOUT"
      ) {
        return res.status(504).json({
          success: false,

          message:
            "Request ke BMKG timeout."
        });
      }

      return res.status(500).json({
        success: false,

        message:
          "Gagal mengambil data cuaca dari BMKG.",

        error:
          error.message ||
          String(error)
      });
    }
  }
});