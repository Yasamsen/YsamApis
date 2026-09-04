/* status.js — panel diagnostik live: CPU, memori, uptime, request/hari */

(function () {
  "use strict";

  const POLL_INTERVAL_MS = 5000;
  let pollTimer = null;
  let lastFetchedAt = null;

  function usageBarClass(percent) {
    if (percent >= 85) return "gauge-fill--danger";
    if (percent >= 60) return "gauge-fill--warn";
    return "";
  }

  function renderMetrics(data) {
    const cpuPercent = Math.min(100, Math.round((data.cpu.loadAverage1m / Math.max(data.cpu.cores, 1)) * 100));

    setText("[data-metric-cpu-value]", `${cpuPercent}%`);
    setText("[data-metric-cpu-cores]", `${data.cpu.cores} core · load rata-rata ${data.cpu.loadAverage1m}`);
    setGauge("[data-metric-cpu-gauge]", cpuPercent);

    setText("[data-metric-mem-value]", `${data.memory.usagePercent}%`);
    setText("[data-metric-mem-detail]", `${data.memory.usedMB} MB / ${data.memory.totalMB} MB`);
    setGauge("[data-metric-mem-gauge]", data.memory.usagePercent);

    setText("[data-metric-uptime-value]", formatDuration(data.uptimeSeconds));
    setText("[data-metric-uptime-detail]", `Node ${data.nodeVersion}`);

    setText("[data-metric-requests-value]", data.requests.sinceColdStart.toLocaleString("id-ID"));

    const todayEl = document.querySelector("[data-metric-requests-today]");
    const noteEl = document.querySelector("[data-metric-requests-note]");
    if (todayEl) {
      if (data.requests.trackingEnabled) {
        todayEl.textContent = `${data.requests.today.toLocaleString("id-ID")} request hari ini`;
        if (noteEl) {
          noteEl.textContent = "Dihitung via Upstash Redis, direset setiap hari.";
          noteEl.classList.remove("status-note--pending");
        }
      } else {
        todayEl.textContent = "Belum diaktifkan";
        if (noteEl) {
          noteEl.textContent = "Set UPSTASH_REDIS_REST_URL & TOKEN di environment variable untuk mengaktifkan hitungan per hari.";
          noteEl.classList.add("status-note--pending");
        }
      }
    }

    lastFetchedAt = Date.now();
    updateLastUpdated();
  }

  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  function setGauge(selector, percent) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.style.width = `${Math.max(2, Math.min(100, percent))}%`;
    el.className = `gauge-fill ${usageBarClass(percent)}`.trim();
  }

  function formatDuration(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}h ${hours}j`;
    if (hours > 0) return `${hours}j ${minutes}m`;
    return `${minutes}m ${seconds % 60}d`;
  }

  function updateLastUpdated() {
    const el = document.querySelector("[data-last-updated]");
    if (!el || !lastFetchedAt) return;
    const seconds = Math.max(0, Math.round((Date.now() - lastFetchedAt) / 1000));
    el.textContent = seconds <= 1 ? "Baru saja diperbarui" : `Diperbarui ${seconds} detik lalu`;
  }

  async function fetchMetrics() {
    try {
      const res = await fetch("/api/system/status", { cache: "no-store" });
      const json = await res.json();
      if (json && json.success) renderMetrics(json.data);
    } catch (err) {
      console.error("Gagal memuat metrik server:", err);
    }
  }

  function init() {
    fetchMetrics();
    pollTimer = setInterval(fetchMetrics, POLL_INTERVAL_MS);
    setInterval(updateLastUpdated, 1000);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearInterval(pollTimer);
      } else {
        fetchMetrics();
        pollTimer = setInterval(fetchMetrics, POLL_INTERVAL_MS);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
