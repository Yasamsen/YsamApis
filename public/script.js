/* script.js — logika bersama untuk seluruh halaman SamApi.
   Vanilla JavaScript murni, tidak ada framework/build step di sisi klien. */

(function () {
  "use strict";

  const THEME_KEY = "samapi-theme";

  /* ---------------------------------------------------------------------
   * Theme (dark default, disimpan di localStorage)
   * ------------------------------------------------------------------- */
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const theme = saved === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);

    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem(THEME_KEY, next);
      });
    });
  }

  /* ---------------------------------------------------------------------
   * Mobile navbar drawer
   * ------------------------------------------------------------------- */
  function initMobileNav() {
    const toggle = document.querySelector("[data-nav-toggle]");
    const drawer = document.querySelector("[data-mobile-drawer]");
    if (!toggle || !drawer) return;

    toggle.addEventListener("click", () => {
      drawer.classList.toggle("is-open");
      const expanded = drawer.classList.contains("is-open");
      toggle.setAttribute("aria-expanded", String(expanded));
    });

    drawer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => drawer.classList.remove("is-open"));
    });
  }

  /* ---------------------------------------------------------------------
   * Notifications (public/notifications.json) — hanya tampil jika ada isi
   * ------------------------------------------------------------------- */
  async function initNotifications() {
    const bar = document.querySelector("[data-notice-bar]");
    if (!bar) return;

    try {
      const res = await fetch("/notifications.json", { cache: "no-store" });
      if (!res.ok) return;
      const items = await res.json();

      if (!Array.isArray(items) || items.length === 0) return;

      const first = items[0];
      const text = typeof first === "string" ? first : first.message || "";
      if (!text) return;

      bar.innerHTML = `<strong>Pengumuman</strong><span>${escapeHtml(text)}</span>`;
      bar.classList.add("is-visible");
    } catch (err) {
      /* diam saja — notifikasi bersifat opsional */
    }
  }

  /* ---------------------------------------------------------------------
   * Manifest loader (di-cache di window supaya tidak fetch berulang)
   * ------------------------------------------------------------------- */
  let manifestPromise = null;

  function loadManifest() {
    if (!manifestPromise) {
      manifestPromise = fetch("/api-manifest.json", { cache: "no-store" })
        .then((res) => {
          if (!res.ok) throw new Error("Gagal memuat manifest API");
          return res.json();
        })
        .catch((err) => {
          console.error(err);
          return [];
        });
    }
    return manifestPromise;
  }

  /* ---------------------------------------------------------------------
   * Util
   * ------------------------------------------------------------------- */
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));
  }

  function methodTagClass(method) {
    if (method === "GET") return "method-tag--get";
    if (method === "POST") return "method-tag--post";
    return "method-tag--other";
  }

  function slugify(str) {
    return String(str)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // Syntax highlighting sederhana untuk JSON (tanpa library eksternal)
  function highlightJson(value) {
    const json = typeof value === "string" ? value : JSON.stringify(value, null, 2);
    const escaped = escapeHtml(json);
    return escaped.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        if (/^"/.test(match)) {
          return /:$/.test(match)
            ? `<span class="tok-key">${match}</span>`
            : `<span class="tok-str">${match}</span>`;
        }
        if (/true|false/.test(match)) return `<span class="tok-bool">${match}</span>`;
        if (/null/.test(match)) return `<span class="tok-null">${match}</span>`;
        return `<span class="tok-num">${match}</span>`;
      }
    );
  }

  let toastTimer = null;
  function showToast(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function copyText(text, successMessage) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => showToast(successMessage || "Disalin ke clipboard"))
        .catch(() => fallbackCopy(text, successMessage));
    } else {
      fallbackCopy(text, successMessage);
    }
  }

  function fallbackCopy(text, successMessage) {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    try {
      document.execCommand("copy");
      showToast(successMessage || "Disalin ke clipboard");
    } catch (err) {
      showToast("Gagal menyalin");
    }
    document.body.removeChild(el);
  }

  function setActiveNavLink() {
    const path = window.location.pathname.replace(/\/$/, "") || "/";
    document.querySelectorAll("[data-nav-link]").forEach((link) => {
      const target = link.getAttribute("data-nav-link");
      if (target === path) link.classList.add("is-active");
    });
  }

  // Expose ke namespace global supaya file lain (home.js, docs.js, status.js) bisa pakai
  window.SamApi = {
    loadManifest,
    escapeHtml,
    methodTagClass,
    slugify,
    highlightJson,
    showToast,
    copyText
  };

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initMobileNav();
    initNotifications();
    setActiveNavLink();
  });
})();
