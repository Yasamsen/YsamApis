// api/search/weather.js

const axios = require("axios");
const createApi = require("../_lib/createApi");
const { requireParams } = require("../_lib/validate");

const BMKG_API =
  "https://api.bmkg.go.id/publik/prakiraan-cuaca";

/*
 * Daftar kode provinsi dan kota/kabupaten penting.
 *
 * Untuk Kota Bandung:
 * Jawa Barat = 32
 * Kota Bandung = 32.73
 */
const REGION_CODES = {
  "jawa barat": {
    "kota bandung": "32.73",
    "bandung": "32.73"
  }
};


/*
 * Normalisasi nama wilayah.
 */
function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bprovinsi\b/g, "")
    .replace(/\bkota\b/g, "kota")
    .replace(/\bkabupaten\b/g, "kabupaten")
    .replace(/\s+/g, " ")
    .trim();
}


/*
 * Cari kode adm2.
 */
function findAdm2(provinsi, kota) {
  const province =
    normalizeText(provinsi);

  const city =
    normalizeText(kota);

  /*
   * Exact.
   */
  if (
    REGION_CODES[province] &&
    REGION_CODES[province][city]
  ) {
    return REGION_CODES[province][city];
  }

  /*
   * Partial match.
   */
  const provinceData =
    Object.entries(
      REGION_CODES
    ).find(([name]) =>
      name.includes(province) ||
      province.includes(name)
    );

  if (!provinceData) {
    return null;
  }

  const cities =
    provinceData[1];

  const cityData =
    Object.entries(cities)
      .find(([name]) =>
        name.includes(city) ||
        city.includes(name)
      );

  return cityData
    ? cityData[1]
    : null;
}


/*
 * Mendapatkan daftar adm4
 * berdasarkan kode adm2.
 *
 * Sumber kode wilayah:
 * Kepmendagri / data wilayah Indonesia.
 *
 * Kita gunakan dataset terbuka untuk
 * mendapatkan desa/kelurahan yang
 * berada di dalam kota tersebut.
 */
async function getAdm4ByAdm2(adm2) {
  const url =
    "https://raw.githubusercontent.com/yonatanyl/KODE-WILAYAH-KEPMENDAGRI-2025/main/KEPMENDAGRI%202025_PUBLIC_GITHUB.csv";

  try {
    const response =
      await axios.get(url, {
        timeout: 15000,
        responseType: "text"
      });

    const csv =
      String(response.data || "");

    const lines =
      csv.split(/\r?\n/);

    if (lines.length < 2) {
      return [];
    }

    /*
     * Parser CSV sederhana.
     */
    function parseCSVLine(line) {
      const result = [];
      let current = "";
      let quoted = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          quoted = !quoted;
          continue;
        }

        if (char === "," && !quoted) {
          result.push(
            current.trim()
          );
          current = "";
        } else {
          current += char;
        }
      }

      result.push(
        current.trim()
      );

      return result;
    }

    const header =
      parseCSVLine(lines[0])
        .map(x =>
          x
            .toUpperCase()
            .trim()
        );

    const provinceIndex =
      header.indexOf(
        "KODE PROVINSI"
      );

    const cityIndex =
      header.indexOf(
        "KODE KABUPATEN"
      );

    const villageIndex =
      header.findIndex(x =>
        x.includes(
          "KODE DESA"
        )
      );

    if (
      cityIndex === -1 ||
      villageIndex === -1
    ) {
      return [];
    }

    const result = [];

    for (
      let i = 1;
      i < lines.length;
      i++
    ) {
      if (!lines[i].trim()) {
        continue;
      }

      const row =
        parseCSVLine(lines[i]);

      const cityCode =
        String(
          row[cityIndex] || ""
        ).trim();

      if (
        cityCode !== adm2
      ) {
        continue;
      }

      const adm4 =
        String(
          row[villageIndex] || ""
        ).trim();

      if (
        /^\d{2}\.\d{2}\.\d{2}\.\d{4}$/
          .test(adm4)
      ) {
        result.push(adm4);
      }
    }

    return [
      ...new Set(result)
    ];

  } catch (error) {
    console.error(
      "GET ADM4 ERROR:",
      error.message
    );

    return [];
  }
}


/*
 * Ambil prakiraan BMKG.
 */
async function getWeather(adm4) {
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

  return response.data;
}


/*
 * Parse data cuaca.
 */
function parseWeather(data) {
  const lokasi =
    data?.lokasi || {};

  const forecast = [];

  /*
   * Struktur BMKG:
   *
   * data[0].cuaca[0]
   * data[0].cuaca[1]
   * dst.
   */
  const groups =
    Array.isArray(
      data?.data?.[0]?.cuaca
    )
      ? data.data[0].cuaca
      : [];

  for (const group of groups) {
    const items =
      Array.isArray(group)
        ? group
        : [group];

    for (const item of items) {
      if (!item) {
        continue;
      }

      const weatherCode =
        Number(
          item.weather
        );

      forecast.push({
        utcDatetime:
          item.utc_datetime || "",

        localDatetime:
          item.local_datetime || "",

        temperature:
          Number(item.t || 0),

        humidity:
          Number(item.hu || 0),

        weatherCode,

        weather:
          item.weather_desc ||
          "Tidak diketahui",

        weatherEnglish:
          item.weather_desc_en ||
          "",

        windSpeed:
          Number(item.ws || 0),

        windDirection:
          item.wd || "",

        cloudCover:
          Number(item.tcc || 0),

        visibility:
          item.vs_text || "",

        analysisDate:
          item.analysis_date || "",

        image:
          item.image || ""
      });
    }
  }

  return {
    lokasi,
    forecast
  };
}


/*
 * API
 */
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
     * Validasi.
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
       * Cari adm2.
       */
      const adm2 =
        findAdm2(
          provinsi,
          kota
        );

      if (!adm2) {
        return res.status(404).json({
          success: false,

          message:
            "Provinsi atau kota belum tersedia di database wilayah SamApi.",

          detail: {
            provinsi,
            kota
          }
        });
      }

      /*
       * Cari seluruh adm4
       * dalam kota/kabupaten.
       */
      const adm4List =
        await getAdm4ByAdm2(
          adm2
        );

      if (!adm4List.length) {
        return res.status(404).json({
          success: false,

          message:
            "Kode desa/kelurahan BMKG untuk kota tersebut tidak ditemukan.",

          detail: {
            adm2,
            provinsi,
            kota
          }
        });
      }

      /*
       * Ambil satu titik prakiraan.
       *
       * Karena parameter API hanya
       * provinsi + kota, kita gunakan
       * adm4 pertama sebagai titik
       * representatif kota.
       */
      let weatherData = null;
      let selectedAdm4 = null;

      for (const adm4 of adm4List) {
        try {
          const data =
            await getWeather(
              adm4
            );

          if (
            data?.lokasi &&
            Array.isArray(
              data?.data?.[0]?.cuaca
            )
          ) {
            weatherData = data;
            selectedAdm4 = adm4;
            break;
          }
        } catch (_) {}
      }

      if (!weatherData) {
        return res.status(502).json({
          success: false,

          message:
            "BMKG tidak mengembalikan data cuaca untuk wilayah tersebut."
        });
      }

      /*
       * Parse.
       */
      const parsed =
        parseWeather(
          weatherData
        );

      if (
        !parsed.forecast.length
      ) {
        return res.status(404).json({
          success: false,

          message:
            "Data prakiraan cuaca kosong."
        });
      }

      /*
       * Response.
       */
      return res.status(200).json({
        success: true,

        data: {
          location: {
            provinsi:
              parsed.lokasi.provinsi ||
              provinsi,

            kota:
              parsed.lokasi.kotkab ||
              kota,

            kecamatan:
              parsed.lokasi.kecamatan ||
              "",

            desa:
              parsed.lokasi.desa ||
              "",

            latitude:
              Number(
                parsed.lokasi.lat || 0
              ),

            longitude:
              Number(
                parsed.lokasi.lon || 0
              ),

            timezone:
              parsed.lokasi.timezone ||
              "",

            adm4:
              parsed.lokasi.adm4 ||
              selectedAdm4
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
        error.response?.status ||
        500;

      if (status === 400) {
        return res.status(400).json({
          success: false,

          message:
            "Parameter BMKG tidak valid."
        });
      }

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