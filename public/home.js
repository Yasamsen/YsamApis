/* home.js — homepage: statistik otomatis + API Explorer */

(function () {
  "use strict";

  const { loadManifest, escapeHtml, methodTagClass, slugify, showToast, copyText } = window.SamApi;

  let allApis = [];
  let activeCategory = "all";
  let searchTerm = "";

  function renderStats(apis) {
    const categories = new Set(apis.map((a) => a.category));

    const values = {
      total: apis.length,
      online: apis.length,
      categories: categories.size,
      response: "<500ms"
    };

    document.querySelectorAll("[data-stat]").forEach((el) => {
      const key = el.getAttribute("data-stat");
      if (values[key] !== undefined) el.textContent = values[key];
    });
  }

  function renderFilters(apis) {
    const container = document.querySelector("[data-filter-pills]");
    if (!container) return;

    const categories = Array.from(new Set(apis.map((a) => a.category))).sort();

    const pills = ["all", ...categories];
    container.innerHTML = pills
      .map((cat) => {
        const label = cat === "all" ? "All" : escapeHtml(cat);
        const isActive = cat === activeCategory ? " is-active" : "";
        return `<button class="pill${isActive}" data-category="${escapeHtml(cat)}">${label}</button>`;
      })
      .join("");

    container.querySelectorAll(".pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        activeCategory = pill.getAttribute("data-category");
        renderFilters(apis);
        renderGrid();
      });
    });
  }

  function matchesSearch(api, term) {
    if (!term) return true;
    const haystack = [
      api.name,
      api.description,
      api.endpoint,
      api.category,
      ...(api.parameters || []).map((p) => p.name)
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term.toLowerCase());
  }

  function apiCardHtml(api) {
    const methodClass = methodTagClass(api.method);
    const slug = slugify(api.endpoint);
    return `
      <article class="api-card">
        <div class="api-card__top">
          <div>
            <div class="api-card__name">${escapeHtml(api.name)}</div>
            <div class="category-tag">${escapeHtml(api.category)}</div>
          </div>
          <span class="method-tag ${methodClass}">${escapeHtml(api.method)}</span>
        </div>
        <p class="api-card__desc">${escapeHtml(api.description)}</p>
        <div class="api-card__endpoint">${escapeHtml(api.endpoint)}</div>
        <div class="api-card__actions">
          <a class="btn btn--primary btn--sm" href="/docs#${encodeURIComponent(slug)}">Try API</a>
          <a class="btn btn--ghost btn--sm" href="/docs#${encodeURIComponent(slug)}">Docs</a>
        </div>
      </article>
    `;
  }

  function renderGrid() {
    const grid = document.querySelector("[data-api-grid]");
    const emptyState = document.querySelector("[data-empty-state]");
    if (!grid) return;

    const filtered = allApis.filter((api) => {
      const categoryMatch = activeCategory === "all" || api.category === activeCategory;
      return categoryMatch && matchesSearch(api, searchTerm);
    });

    if (filtered.length === 0) {
      grid.innerHTML = "";
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";
    grid.innerHTML = filtered.map(apiCardHtml).join("");
  }

  function initSearch() {
    const input = document.querySelector("[data-search-input]");
    if (!input) return;

    input.addEventListener("input", (e) => {
      searchTerm = e.target.value.trim();
      renderGrid();
    });

    document.addEventListener("keydown", (e) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        input.focus();
        input.select();
      }
    });
  }

  function initHeroTerminal() {
    const copyBtn = document.querySelector("[data-hero-copy]");
    if (!copyBtn) return;
    copyBtn.addEventListener("click", () => {
      copyText("curl https://your-domain.vercel.app/api/example", "Perintah disalin");
    });
  }

  function showSkeletons() {
    const grid = document.querySelector("[data-api-grid]");
    if (!grid) return;
    grid.innerHTML = Array.from({ length: 6 })
      .map(() => '<div class="skeleton skeleton-card"></div>')
      .join("");
  }

  async function init() {
    initHeroTerminal();
    initSearch();
    showSkeletons();

    allApis = await loadManifest();
    renderStats(allApis);
    renderFilters(allApis);
    renderGrid();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
