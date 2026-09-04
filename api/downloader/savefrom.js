const createApi = require("../_lib/createApi");
const crypto = require("crypto");
const vm = require("vm");

const PAGE = "https://en.savefrom.net/";
const API = "https://worker.savefrom.net/savefrom.php";

const DEFAULT_HEADERS = {
  accept: "*/*",
  "accept-encoding": "gzip, deflate, br",
  "accept-language": "en-US,en;q=0.9",
  "sec-ch-ua":
    '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
  "sec-ch-ua-mobile": "?0",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
};

const SALT =
  "b7944d7a59c9cb654228624880e7de59a53842c2d912b449fdf11febcf81cb21";

function generateHash(url, ts) {
  return crypto
    .createHash("sha256")
    .update(url + ts + SALT)
    .digest("hex");
}

async function scrapeSaveFrom(url) {
  if (!url) {
    throw new Error("URL parameter is required");
  }

  const ts = Date.now();

  const form = new URLSearchParams({
    sf_url: url,
    sf_submit: "",
    new: "2",
    lang: "en",
    app: "",
    country: "en",
    os: "Windows",
    browser: "Chrome",
    channel: "main",
    "sf-nomad": "1",
    url: url,
    ts: String(ts),
    _ts: "1720433117117",
    _tsc: "0",
    _s: generateHash(url, ts),
    _x: "1"
  });

  const response = await fetch(API, {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      "content-type": "application/x-www-form-urlencoded",
      origin: PAGE,
      referer: PAGE
    },
    body: form
  });

  if (!response.ok) {
    throw new Error(
      `SaveFrom server returned HTTP error: ${response.status} ${response.statusText}`
    );
  }

  const jsResponse = await response.text();

  let resultData = null;
  let errorMessage = null;

  const sfMock = {
    videoResult: {
      show: (res) => {
        resultData = res;
      },
      showRows: (res) => {
        resultData = res;
      }
    },

    finishRequest: () => {},

    enableElement: () => {},

    result: {
      show: (res) => {
        if (res && res.success === false) {
          errorMessage = res.html || "Download links not found";
        } else {
          resultData = res;
        }
      },

      showEmptyResult: (res) => {
        errorMessage =
          (res && res.html) || "Download link not found";
      }
    }
  };

  const context = {
    window: null,
    location: {
      hostname: "en.savefrom.net"
    },
    frameElement: {},

    atob: (base64) =>
      Buffer.from(base64, "base64").toString(),

    _decodeURIComponent: (uri) =>
      decodeURIComponent(uri)
  };

  context.window = context;

  context.parent = {
    sf: sfMock,

    document: {
      location: {
        hostname: "en.savefrom.net"
      },

      getElementById: () => ({
        innerHTML: "mock"
      }),

      body: {
        firstChild: null,
        removeChild: () => {}
      }
    }
  };

  context.document = context.parent.document;

  try {
    vm.createContext(context);

    const script = new vm.Script(
      `decodeURIComponent=_decodeURIComponent;${jsResponse}`
    );

    script.runInContext(context);
  } catch (error) {
    throw new Error(
      `Failed to evaluate JS payload: ${error.message}`
    );
  }

  if (errorMessage) {
    throw new Error(
      errorMessage.replace(/<[^>]*>/g, "")
    );
  }

  if (!resultData) {
    throw new Error(
      "Could not parse download links from SaveFrom response"
    );
  }

  return parseResult(resultData);
}

function parseResult(raw) {
  const title = raw.meta?.title || "Untitled Video";
  const duration = raw.meta?.duration || "Unknown";
  const thumbnail = raw.thumb || "";
  const source = raw.meta?.source || "";
  const hosting = raw.hosting || "unknown";

  const downloads = [];

  if (Array.isArray(raw.url)) {
    raw.url.forEach((item) => {
      if (!item.url) return;

      downloads.push({
        url: item.url,
        quality: item.quality
          ? `${item.quality}p`
          : item.subname || "default",
        format: item.ext || item.type || "mp4",
        audio: item.audio !== false,
        size: item.filesize || null,
        name: `${item.name || "Video"} (${
          item.quality || item.subname || "SD"
        })`
      });
    });
  }

  if (raw.stream) {
    Object.keys(raw.stream).forEach((format) => {
      const qualities = raw.stream[format];

      Object.keys(qualities).forEach((quality) => {
        const item = qualities[quality];

        if (
          item.url &&
          item.url !== "#local-converter"
        ) {
          downloads.push({
            url: item.url,
            quality:
              quality.includes("p") || quality.includes("k")
                ? quality
                : `${quality}p`,
            format,
            audio: !item.no_audio,
            size: item.filesize || null,
            name: `${format.toUpperCase()} (${quality})`
          });
        }
      });
    });
  }

  return {
    title,
    duration,
    thumbnail,
    source,
    hosting,
    downloads
  };
}


/* =========================
   SAMAPI ENDPOINT
========================= */

module.exports = createApi({
  name: "SaveFrom Downloader",

  description:
    "Mengambil informasi video dan link download",

  method: "GET",

  endpoint: "/api/downloader/savefrom",

  category: "Downloader",

  parameters: [
    {
      name: "url",
      type: "string",
      required: true,
      example: "https://example.com/video"
    }
  ],

  async handler(req, res) {
    try {
      const url = String(
        req.query.url || ""
      ).trim();

      if (!url) {
        return res.status(400).json({
          success: false,
          message: "Parameter url wajib diisi"
        });
      }

      const result = await scrapeSaveFrom(url);

      return res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
});