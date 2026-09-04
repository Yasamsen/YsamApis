// api/search/lyrics.js

const axios = require("axios");
const createApi = require("../_lib/createApi");
const { requireParams } = require("../_lib/validate");

async function getLyrics(queryOrTrack, artist = "") {
  let trackName = queryOrTrack;
  let artistName = artist || "";

  /*
   * Jika query berupa URL Spotify,
   * ambil judul dan artist dari Spotify.
   */
  if (queryOrTrack.includes("spotify.com/track/")) {
    const match = queryOrTrack.match(
      /track\/([a-zA-Z0-9]+)/
    );

    if (match) {
      const trackId = match[1];

      try {
        const oembed = await axios.get(
          `https://open.spotify.com/oembed?url=https://open.spotify.com/track/${trackId}`,
          {
            timeout: 5000
          }
        );

        trackName =
          oembed.data?.title
            ?.replace(/\(feat\..*?\)/i, "")
            .trim() || trackName;

        /*
         * Ambil artist dari Spotify embed.
         */
        try {
          const resEmbed = await axios.get(
            `https://open.spotify.com/embed/track/${trackId}`,
            {
              timeout: 5000
            }
          );

          const matchArtist =
            resEmbed.data.match(
              /"artists":\[\{"name":"([^"]+)"/
            );

          if (matchArtist) {
            artistName = matchArtist[1];
          }
        } catch (_) {}
      } catch (_) {}
    }
  }

  /*
   * 1. Exact search LRCLIB
   */
  try {
    const response = await axios.get(
      "https://lrclib.net/api/get",
      {
        params: {
          track_name: trackName,
          artist_name: artistName
        },

        timeout: 10000
      }
    );

    const data = response.data;

    if (
      data &&
      (data.plainLyrics ||
        data.syncedLyrics)
    ) {
      return {
        status: true,

        trackName:
          data.trackName ||
          trackName,

        artistName:
          data.artistName ||
          artistName,

        albumName:
          data.albumName || "",

        duration:
          data.duration || 0,

        plainLyrics:
          data.plainLyrics || "",

        syncedLyrics:
          data.syncedLyrics || ""
      };
    }
  } catch (_) {}

  /*
   * 2. Fallback fuzzy search
   */
  try {
    const searchResponse =
      await axios.get(
        "https://lrclib.net/api/search",
        {
          params: {
            q:
              `${trackName} ${artistName}`
                .trim()
          },

          timeout: 10000
        }
      );

    const results =
      searchResponse.data;

    if (
      Array.isArray(results) &&
      results.length > 0
    ) {
      const best = results[0];

      return {
        status: true,

        trackName:
          best.trackName || "",

        artistName:
          best.artistName || "",

        albumName:
          best.albumName || "",

        duration:
          best.duration || 0,

        plainLyrics:
          best.plainLyrics || "",

        syncedLyrics:
          best.syncedLyrics || ""
      };
    }
  } catch (error) {
    return {
      status: false,

      message:
        error.message ||
        "Gagal mengambil lirik."
    };
  }

  return {
    status: false,

    message:
      "Lirik lagu tidak ditemukan."
  };
}


module.exports = createApi({
  name: "Lyrics",
  
  description:
    "Mencari lirik lagu berdasarkan judul, artis, atau URL Spotify.",

  method: "GET",

  endpoint:
    "/api/search/lyrics",

  category: "Search",

  parameters: [
    {
      name: "query",

      type: "string",

      required: true,

      example:
        "https://open.spotify.com/track/0X2bh8NVQ8svDQIn2AdCbW"
    },

    {
      name: "artist",

      type: "string",

      required: false,

      example:
        "Ed Sheeran"
    }
  ],

  async handler(req, res) {
    const check =
      requireParams(
        req.query,
        ["query"]
      );

    if (!check.ok) {
      return res.status(400).json({
        success: false,

        message:
          `Parameter wajib diperlukan: ${check.missing.join(", ")}`
      });
    }

    const query =
      String(
        req.query.query || ""
      ).trim();

    const artist =
      String(
        req.query.artist || ""
      ).trim();

    if (!query) {
      return res.status(400).json({
        success: false,

        message:
          "Parameter query tidak boleh kosong."
      });
    }

    try {
      const result =
        await getLyrics(
          query,
          artist
        );

      if (!result.status) {
        return res.status(404).json({
          success: false,

          message:
            result.message ||
            "Lirik lagu tidak ditemukan."
        });
      }

      /*
       * Format response API.
       */
      return res.status(200).json({
        success: true,

        data: {
          trackName:
            result.trackName || "",

          artistName:
            result.artistName || "",

          albumName:
            result.albumName || "",

          duration:
            result.duration || 0,

          durationSec:
            Number(
              (
                result.duration || 0
              ).toFixed(2)
            ),

          plainLyrics:
            result.plainLyrics || "",

          syncedLyrics:
            result.syncedLyrics || "",

          source:
            "LRCLIB"
        }
      });

    } catch (error) {
      console.error(
        "LYRICS API ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Gagal mengambil lirik lagu.",

        error:
          error.message ||
          String(error)
      });
    }
  }
});