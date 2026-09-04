// api/system/status.js
//
// Endpoint diagnostik yang benar-benar hidup: membaca CPU, memori, dan
// uptime langsung dari instance serverless yang sedang menjalankan
// fungsi ini (menggunakan modul "os" bawaan Node.js). Ini bukan angka
// buatan, tapi tetap punya keterbatasan yang jujur kami sebutkan:
//
// - "requests.sinceColdStart" hanya menghitung request yang ditangani
//   oleh instance (warm) yang sama, karena serverless function tidak
//   punya memori permanen antar cold start.
// - "requests.today" hanya terisi jika Upstash Redis REST dikonfigurasi
//   lewat environment variable (lihat .env.example). Jika tidak
//   dikonfigurasi, field ini bernilai null dan frontend menampilkan
//   status "belum diaktifkan" apa adanya — bukan angka palsu.

const os = require("os");
const createApi = require("../_lib/createApi");

let instanceRequestCount = 0;
const instanceStartedAt = Date.now();

async function incrementDailyCounter() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const key = `samapi:requests:${today}`;

  try {
    const response = await fetch(`${url}/incr/${key}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) return null;

    const data = await response.json();
    return typeof data.result === "number" ? data.result : null;
  } catch (err) {
    return null;
  }
}

module.exports = createApi({
  name: "System Status",
  description: "Diagnostik live: CPU, memori, uptime, dan jumlah request",
  method: "GET",
  endpoint: "/api/system/status",
  category: "System",
  parameters: [],
  async handler(req, res) {
    instanceRequestCount += 1;

    const cpus = os.cpus() || [];
    const loadAverage = typeof os.loadavg === "function" ? os.loadavg() : [0, 0, 0];
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const requestsToday = await incrementDailyCounter();

    return res.status(200).json({
      success: true,
      data: {
        cpu: {
          cores: cpus.length,
          model: cpus[0] ? cpus[0].model.trim() : "unknown",
          loadAverage1m: Number(loadAverage[0].toFixed(2)),
          loadAverage5m: Number(loadAverage[1].toFixed(2)),
          loadAverage15m: Number(loadAverage[2].toFixed(2))
        },
        memory: {
          totalMB: Math.round(totalMem / 1024 / 1024),
          usedMB: Math.round(usedMem / 1024 / 1024),
          usagePercent: Math.round((usedMem / totalMem) * 100)
        },
        uptimeSeconds: Math.round(process.uptime()),
        instanceAliveSeconds: Math.round((Date.now() - instanceStartedAt) / 1000),
        requests: {
          sinceColdStart: instanceRequestCount,
          today: requestsToday,
          trackingEnabled: requestsToday !== null
        },
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      }
    });
  }
});
