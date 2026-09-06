(function () {
  "use strict";

  /* ============ Theme ============ */
  function initTheme() {
    const saved = localStorage.getItem("samapi_theme");
    const theme = saved === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.textContent = theme === "dark" ? "\u263E" : "\u2600";
      btn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
        localStorage.setItem("samapi_theme", next);
        btn.textContent = next === "dark" ? "\u263E" : "\u2600";
      });
    });
  }

  /* ============ Mobile drawer ============ */
  function initMobileNav() {
    const drawer = document.querySelector("[data-mobile-drawer]");
    const openBtn = document.querySelector("[data-hamburger]");
    if (!drawer || !openBtn) return;
    const close = () => drawer.classList.remove("open");
    openBtn.addEventListener("click", () => drawer.classList.add("open"));
    drawer.querySelector(".mobile-drawer-backdrop").addEventListener("click", close);
    drawer.querySelectorAll("a, button").forEach((el) => el.addEventListener("click", close));
  }

  /* ============ Toast ============ */
  let toastTimer = null;
  function showToast(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  /* ============ Clipboard ============ */
  function copyToClipboard(text, btn, doneLabel) {
    navigator.clipboard.writeText(text).then(() => {
      if (btn) {
        const original = btn.textContent;
        btn.textContent = doneLabel || "\u2713 Copied";
        setTimeout(() => (btn.textContent = original), 1600);
      } else {
        showToast("Copied to clipboard");
      }
    }).catch(() => showToast("Unable to copy"));
  }
  window.SamApiCopy = copyToClipboard;

  /* ============ Manifest loading ============ */
  let manifestCache = null;
  async function loadManifest() {
    if (manifestCache) return manifestCache;
    const res = await fetch("/api-manifest.json", { cache: "no-store" });
    if (!res.ok) throw new Error("manifest_load_failed");
    manifestCache = await res.json();
    return manifestCache;
  }

  function categoriesFromManifest(manifest) {
    return Array.from(new Set(manifest.map((a) => a.category))).sort();
  }

  /* ============ Auth state ============ */
  let currentUser = null;
  let authChecked = false;

  async function getCurrentUser() {
    if (authChecked) return currentUser;
    try {
      const res = await fetch("/api/auth/me", { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        currentUser = data.user || null;
      } else {
        currentUser = null;
      }
    } catch {
      currentUser = null;
    }
    authChecked = true;
    return currentUser;
  }

  function renderNavAuth(user) {
    const slot = document.querySelector("[data-nav-auth]");
    if (!slot) return;

    if (!user) {
      slot.innerHTML = '<a class="btn btn-primary" href="/login">Login</a>';
      return;
    }

    const initials = (user.name || user.email || "?").trim().charAt(0).toUpperCase();
    const avatarHtml = user.avatar
      ? `<img src="${escapeAttr(user.avatar)}" alt="${escapeAttr(user.name || "")}" />`
      : `<span style="width:24px;height:24px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">${initials}</span>`;

    slot.innerHTML = `
      <a class="user-chip" href="/account">
        ${avatarHtml}
        <span>${escapeHtml(user.name || user.email || "Account")}</span>
        <span class="usage-pill">${user.usage} / ${user.limit}</span>
      </a>
    `;
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }
  function escapeAttr(str) { return escapeHtml(str); }

  /* ============ Notifications ============ */
  async function initNotifications() {
    const bar = document.querySelector("[data-notif-bar]");
    if (!bar) return;
    try {
      const res = await fetch("/notifications.json", { cache: "no-store" });
      const notifications = res.ok ? await res.json() : [];
      if (Array.isArray(notifications) && notifications.length > 0) {
        const n = notifications[0];
        bar.innerHTML = `<strong>${escapeHtml(n.title || "")}</strong>${escapeHtml(n.message || "")}`;
        bar.classList.remove("hidden");
      }
    } catch {
      /* silently ignore — notifications are non-critical */
    }
  }

  /* ============ Search (Ctrl+K) ============ */
  function initSearchModal() {
    const overlay = document.querySelector("[data-search-overlay]");
    if (!overlay) return;
    const input = overlay.querySelector("[data-search-input]");
    const resultsEl = overlay.querySelector("[data-search-results]");
    let activeIndex = -1;
    let currentResults = [];

    function open() {
      overlay.classList.add("open");
      input.value = "";
      renderResults([]);
      setTimeout(() => input.focus(), 30);
      loadManifest().catch(() => {});
    }
    function close() { overlay.classList.remove("open"); }

    function matches(api, q) {
      const hay = [api.name, api.description, api.endpoint, api.category, ...(api.parameters || []).map((p) => p.name)]
        .join(" ").toLowerCase();
      return hay.includes(q);
    }

    function renderResults(list) {
      currentResults = list;
      activeIndex = -1;
      if (list.length === 0) {
        resultsEl.innerHTML = '<div class="search-empty">Type to search APIs\u2026</div>';
        return;
      }
      resultsEl.innerHTML = list.map((api, i) => `
        <a class="search-result-item" data-index="${i}" href="/docs?api=${encodeURIComponent(api.endpoint)}">
          <div class="name">${escapeHtml(api.name)}</div>
          <div class="meta">${escapeHtml(api.method)} ${escapeHtml(api.endpoint)} &middot; ${escapeHtml(api.category)}</div>
        </a>
      `).join("");
    }

    input.addEventListener("input", async () => {
      const q = input.value.trim().toLowerCase();
      if (!q) return renderResults([]);
      try {
        const manifest = await loadManifest();
        renderResults(manifest.filter((api) => matches(api, q)).slice(0, 20));
      } catch {
        resultsEl.innerHTML = '<div class="search-empty">Unable to load API catalog.</div>';
      }
    });

    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        overlay.classList.contains("open") ? close() : open();
      } else if (e.key === "Escape" && overlay.classList.contains("open")) {
        close();
      } else if (overlay.classList.contains("open") && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        e.preventDefault();
        if (currentResults.length === 0) return;
        activeIndex = e.key === "ArrowDown"
          ? Math.min(activeIndex + 1, currentResults.length - 1)
          : Math.max(activeIndex - 1, 0);
        resultsEl.querySelectorAll(".search-result-item").forEach((el, i) => el.classList.toggle("active", i === activeIndex));
      } else if (overlay.classList.contains("open") && e.key === "Enter" && activeIndex >= 0) {
        resultsEl.querySelectorAll(".search-result-item")[activeIndex]?.click();
      }
    });

    document.querySelectorAll("[data-search-open]").forEach((el) => el.addEventListener("click", open));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  }

  /* ============ Stats (homepage) ============ */
  async function initStats() {
    const el = document.querySelector("[data-stats]");
    if (!el) return;
    try {
      const manifest = await loadManifest();
      const categories = categoriesFromManifest(manifest);
      el.querySelector("[data-stat-total]").textContent = manifest.length;
      el.querySelector("[data-stat-online]").textContent = manifest.length;
      el.querySelector("[data-stat-categories]").textContent = categories.length;
    } catch {
      /* leave placeholders */
    }
  }

  /* ============ API Explorer (homepage) ============ */
  function apiCardHtml(api) {
    return `
      <div class="api-card" data-name="${escapeAttr(api.name)}">
        <div class="api-card-top">
          <h3>${escapeHtml(api.name)}</h3>
          <span class="method-tag">${escapeHtml(api.method)}</span>
        </div>
        <p>${escapeHtml(api.description)}</p>
        <code>${escapeHtml(api.endpoint)}</code>
        <div class="api-card-actions">
          <a class="btn btn-primary" href="/docs?api=${encodeURIComponent(api.endpoint)}&try=1">Try API</a>
          <a class="btn btn-ghost" href="/docs?api=${encodeURIComponent(api.endpoint)}">Docs</a>
        </div>
      </div>
    `;
  }

  async function initExplorer() {
    const grid = document.querySelector("[data-api-grid]");
    if (!grid) return;
    const searchInput = document.querySelector("[data-explorer-search]");
    const pillsEl = document.querySelector("[data-explorer-filters]");

    grid.innerHTML = Array(6).fill('<div class="skeleton"></div>').join("");

    let manifest;
    try {
      manifest = await loadManifest();
    } catch {
      grid.innerHTML = '<div class="empty-state">Unable to load API catalog. Please try again.</div>';
      return;
    }

    let activeCategory = "All";

    function render() {
      const q = (searchInput?.value || "").trim().toLowerCase();
      let list = manifest;
      if (activeCategory !== "All") list = list.filter((a) => a.category === activeCategory);
      if (q) {
        list = list.filter((a) => [a.name, a.description, a.endpoint, a.category].join(" ").toLowerCase().includes(q));
      }
      grid.innerHTML = list.length
        ? list.map(apiCardHtml).join("")
        : '<div class="empty-state">No APIs match your search.</div>';
    }

    if (pillsEl) {
      const categories = ["All", ...categoriesFromManifest(manifest)];
      pillsEl.innerHTML = categories.map((c) =>
        `<button class="pill${c === "All" ? " active" : ""}" data-cat="${escapeAttr(c)}">${escapeHtml(c)}</button>`
      ).join("");
      pillsEl.querySelectorAll(".pill").forEach((pill) => {
        pill.addEventListener("click", () => {
          pillsEl.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
          pill.classList.add("active");
          activeCategory = pill.dataset.cat;
          render();
        });
      });
    }

    searchInput?.addEventListener("input", render);
    render();
  }

  /* ============ Docs page ============ */
  async function initDocs() {
    const root = document.querySelector("[data-docs-root]");
    if (!root) return;

    const sidebar = document.querySelector("[data-docs-sidebar]");
    const content = document.querySelector("[data-docs-content]");

    let manifest;
    try {
      manifest = await loadManifest();
    } catch {
      content.innerHTML = '<div class="empty-state">Unable to load API catalog. Please try again.</div>';
      return;
    }

    if (manifest.length === 0) {
      content.innerHTML = '<div class="empty-state">No APIs available yet.</div>';
      return;
    }

    const byCategory = {};
    manifest.forEach((api) => {
      byCategory[api.category] = byCategory[api.category] || [];
      byCategory[api.category].push(api);
    });

    sidebar.innerHTML = Object.keys(byCategory).sort().map((cat) => `
      <h4>${escapeHtml(cat)}</h4>
      ${byCategory[cat].map((api) => `<a class="docs-nav-item" data-endpoint="${escapeAttr(api.endpoint)}">${escapeHtml(api.name)}</a>`).join("")}
    `).join("");

    const params = new URLSearchParams(location.search);
    const requested = params.get("api");
    const shouldOpenTry = params.get("try") === "1";
    const initial = manifest.find((a) => a.endpoint === requested) || manifest[0];

    function selectEndpoint(endpoint, openTry) {
      const api = manifest.find((a) => a.endpoint === endpoint);
      if (!api) return;
      sidebar.querySelectorAll(".docs-nav-item").forEach((el) => {
        el.classList.toggle("active", el.dataset.endpoint === endpoint);
      });
      renderApiDoc(content, api, openTry);
      const url = new URL(location.href);
      url.searchParams.set("api", endpoint);
      url.searchParams.delete("try");
      history.replaceState(null, "", url);
    }

    sidebar.querySelectorAll(".docs-nav-item").forEach((el) => {
      el.addEventListener("click", () => selectEndpoint(el.dataset.endpoint, false));
    });

    if (initial) selectEndpoint(initial.endpoint, shouldOpenTry);
  }

  function renderApiDoc(container, api, openTryDefault) {
    const paramsRows = (api.parameters || []).map((p) => `
      <tr>
        <td class="mono">${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.type || "string")}</td>
        <td>${p.required ? '<span class="tag-required">required</span>' : '<span class="tag-optional">optional</span>'}</td>
        <td class="mono text-dim">${escapeHtml(p.example ?? "")}</td>
      </tr>
    `).join("") || `<tr><td colspan="4" class="text-dim">No parameters</td></tr>`;

    const exampleRequest = api.method === "GET"
      ? `curl "${location.origin}${api.endpoint}${buildExampleQuery(api.parameters)}"`
      : `curl -X POST "${location.origin}${api.endpoint}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(buildExampleBody(api.parameters), null, 2)}'`;

    container.innerHTML = `
      <div class="docs-endpoint-header">
        <h1>${escapeHtml(api.name)}</h1>
        <p>${escapeHtml(api.description)}</p>
      </div>
      <div class="docs-meta-row">
        <span class="method-tag">${escapeHtml(api.method)}</span>
        <div class="endpoint-pill">
          <span class="mono" style="flex:1;overflow-x:auto;">${escapeHtml(api.endpoint)}</span>
          <button class="btn btn-ghost" style="padding:4px 10px;font-size:12px;" data-copy-endpoint>Copy</button>
        </div>
        <span class="category-chip">${escapeHtml(api.category)}</span>
      </div>

      <div class="docs-section">
        <h3>Parameters</h3>
        <table class="param-table">
          <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Example</th></tr></thead>
          <tbody>${paramsRows}</tbody>
        </table>
      </div>

      <div class="docs-section">
        <h3>Example Request</h3>
        <div class="code-block">${escapeHtml(exampleRequest)}</div>
      </div>

      <div class="docs-section">
        <h3>Try API</h3>
        <div class="tester-card" data-tester></div>
      </div>
    `;

    container.querySelector("[data-copy-endpoint]").addEventListener("click", (e) => {
      copyToClipboard(api.endpoint, e.currentTarget);
    });

    renderTester(container.querySelector("[data-tester]"), api, openTryDefault);
  }

  function buildExampleQuery(parameters) {
    const parts = (parameters || []).map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.example ?? "")}`);
    return parts.length ? `?${parts.join("&")}` : "";
  }
  function buildExampleBody(parameters) {
    const obj = {};
    (parameters || []).forEach((p) => { obj[p.name] = p.example ?? ""; });
    return obj;
  }

  /* ============ Try API tester ============ */
  function renderTester(el, api, openByDefault) {
    if (!el) return;
    const isPost = (api.method || "GET").toUpperCase() !== "GET";

    const fieldsHtml = isPost
      ? `<div class="form-row">
           <label>JSON Body</label>
           <textarea data-json-body>${escapeHtml(JSON.stringify(buildExampleBody(api.parameters), null, 2))}</textarea>
           <div class="json-error hidden" data-json-error>Invalid JSON</div>
         </div>`
      : (api.parameters || []).map((p) => `
          <div class="form-row">
            <label>${escapeHtml(p.name)}${p.required ? '<span class="req">*</span>' : ""}</label>
            <input type="text" data-param="${escapeAttr(p.name)}" placeholder="${escapeAttr(p.example ?? "")}" />
          </div>
        `).join("") || '<p class="text-dim" style="font-size:13px;">This endpoint has no parameters.</p>';

    el.innerHTML = `
      <h3>Try Request</h3>
      <div class="form-row">
        <label>Method</label>
        <input type="text" value="${escapeAttr(api.method)}" disabled />
      </div>
      <div class="form-row">
        <label>Endpoint</label>
        <input type="text" value="${escapeAttr(api.endpoint)}" disabled />
      </div>
      ${fieldsHtml}
      <button class="btn btn-primary btn-block" data-send-request>Send Request</button>
      <div class="response-panel hidden" data-response-panel></div>
    `;

    const sendBtn = el.querySelector("[data-send-request]");
    sendBtn.addEventListener("click", () => sendTestRequest(el, api, isPost));

    if (openByDefault) {
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  }

  async function sendTestRequest(el, api, isPost) {
    const user = await getCurrentUser();
    if (!user) {
      showAuthRequiredModal();
      return;
    }

    const sendBtn = el.querySelector("[data-send-request]");
    const panel = el.querySelector("[data-response-panel]");

    let url = api.endpoint;
    let fetchOptions = { method: api.method, credentials: "same-origin" };

    if (isPost) {
      const textarea = el.querySelector("[data-json-body]");
      const jsonError = el.querySelector("[data-json-error]");
      let parsed;
      try {
        parsed = JSON.parse(textarea.value || "{}");
        jsonError.classList.add("hidden");
      } catch {
        jsonError.classList.remove("hidden");
        return;
      }
      fetchOptions.headers = { "Content-Type": "application/json" };
      fetchOptions.body = JSON.stringify(parsed);
    } else {
      const query = new URLSearchParams();
      el.querySelectorAll("[data-param]").forEach((input) => {
        if (input.value) query.set(input.dataset.param, input.value);
      });
      const qs = query.toString();
      if (qs) url += `?${qs}`;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending\u2026";
    panel.classList.remove("hidden");
    panel.innerHTML = `<p class="text-dim" style="font-size:13px;">Sending\u2026</p>`;

    const started = performance.now();
    try {
      const res = await fetch(url, fetchOptions);
      const elapsed = Math.round(performance.now() - started);
      let body;
      const text = await res.text();
      try { body = JSON.parse(text); } catch { body = text; }

      renderResponsePanel(panel, res.status, elapsed, body, res.headers);

      if (res.status === 401) {
        showAuthRequiredModal();
      } else {
        getCurrentUser.cache = null;
        authChecked = false;
        const refreshed = await getCurrentUser();
        renderNavAuth(refreshed);
      }
    } catch (err) {
      const elapsed = Math.round(performance.now() - started);
      renderResponsePanel(panel, "Network Error", elapsed, { success: false, message: "Unable to connect to SamApi." });
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = "Send Request";
    }
  }

  function statusClass(status) {
    if (typeof status !== "number") return "status-err";
    if (status >= 200 && status < 300) return "status-2xx";
    if (status >= 400 && status < 500) return "status-4xx";
    return "status-5xx";
  }

  function renderResponsePanel(panel, status, elapsedMs, body, headers) {
    const statusLabel = typeof status === "number" ? `${status} ${statusText(status)}` : status;
    let headersText = "";
    if (headers) {
      const lines = [];
      headers.forEach((v, k) => lines.push(`${k}: ${v}`));
      headersText = lines.join("\n");
    }
    panel.innerHTML = `
      <div class="response-status-row">
        <span class="status-code ${statusClass(status)}">${escapeHtml(String(statusLabel))}</span>
        <span class="response-time">${elapsedMs} ms</span>
        <button class="btn btn-ghost" style="margin-left:auto;padding:5px 10px;font-size:12px;" data-copy-response>Copy Response</button>
        <button class="btn btn-ghost" style="padding:5px 10px;font-size:12px;" data-clear-response>Clear</button>
      </div>
      <div class="tabs">
        <button class="tab-btn active" data-tab="body">Body</button>
        <button class="tab-btn" data-tab="headers">Headers</button>
      </div>
      <div class="code-block" data-tab-body>${escapeHtml(typeof body === "string" ? body : JSON.stringify(body, null, 2))}</div>
      <div class="code-block hidden" data-tab-headers>${escapeHtml(headersText || "(unavailable)")}</div>
    `;

    panel.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        panel.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        panel.querySelector("[data-tab-body]").classList.toggle("hidden", btn.dataset.tab !== "body");
        panel.querySelector("[data-tab-headers]").classList.toggle("hidden", btn.dataset.tab !== "headers");
      });
    });

    panel.querySelector("[data-copy-response]").addEventListener("click", (e) => {
      copyToClipboard(typeof body === "string" ? body : JSON.stringify(body, null, 2), e.currentTarget, "\u2713 Copied");
    });
    panel.querySelector("[data-clear-response]").addEventListener("click", () => {
      panel.classList.add("hidden");
      panel.innerHTML = "";
    });
  }

  function statusText(code) {
    const map = { 200: "OK", 400: "Bad Request", 401: "Unauthorized", 404: "Not Found", 429: "Too Many Requests", 500: "Internal Server Error", 503: "Service Unavailable" };
    return map[code] || "";
  }

  /* ============ Auth required modal ============ */
  function showAuthRequiredModal() {
    let overlay = document.querySelector("[data-auth-required-overlay]");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      overlay.setAttribute("data-auth-required-overlay", "");
      overlay.innerHTML = `
        <div class="auth-modal-card">
          <h3>Authentication Required</h3>
          <p>Sign in to use SamApi APIs.</p>
          <a class="oauth-btn" href="/api/auth/google">Continue with Google</a>
          <a class="oauth-btn" href="/api/auth/github">Continue with GitHub</a>
          <a class="oauth-btn" href="/api/auth/facebook">Continue with Facebook</a>
          <button class="btn btn-ghost btn-block" style="margin-top:6px;" data-close-auth-modal>Cancel</button>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.classList.remove("open"); });
      overlay.querySelector("[data-close-auth-modal]").addEventListener("click", () => overlay.classList.remove("open"));
    }
    overlay.classList.add("open");
  }

  /* ============ Account page ============ */
  async function initAccountPage() {
    const root = document.querySelector("[data-account-root]");
    if (!root) return;

    const user = await getCurrentUser();
    if (!user) {
      location.href = "/login";
      return;
    }

    const remaining = Math.max(user.limit - user.usage, 0);
    const pct = Math.min((user.usage / user.limit) * 100, 100);
    let remClass = "";
    if (remaining === 0) remClass = "zero"; else if (remaining <= 5) remClass = "low";

    const created = user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long" }) : "\u2014";
    const initials = (user.name || user.email || "?").trim().charAt(0).toUpperCase();
    const avatarHtml = user.avatar
      ? `<img src="${escapeAttr(user.avatar)}" alt="" />`
      : `<span style="width:56px;height:56px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;">${initials}</span>`;

    root.innerHTML = `
      <div class="account-card">
        <div class="account-header">
          ${avatarHtml}
          <div>
            <h2>${escapeHtml(user.name || "\u2014")}</h2>
            <p>${escapeHtml(user.email || "")}</p>
          </div>
        </div>
        <div class="account-row"><span class="label">Login Provider</span><span>${escapeHtml(capitalize(user.provider))}</span></div>
        <div class="account-row"><span class="label">Account Created</span><span>${escapeHtml(created)}</span></div>
        <div style="padding-top:22px;">
          <div class="account-row" style="border-bottom:none;padding-bottom:4px;">
            <span class="label">API Usage</span><span>${user.usage} / ${user.limit}</span>
          </div>
          <div class="usage-bar-track"><div class="usage-bar-fill" style="width:${pct}%"></div></div>
          <div class="usage-remaining ${remClass}">${remaining === 0 ? "Limit reached" : `${remaining} requests remaining`}</div>
        </div>
        <button class="btn btn-danger btn-block" style="margin-top:26px;" data-logout>Logout</button>
      </div>
    `;

    root.querySelector("[data-logout]").addEventListener("click", async () => {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      location.href = "/";
    });
  }

  function capitalize(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ""; }

  /* ============ Login page ============ */
  function initLoginPage() {
    const root = document.querySelector("[data-login-root]");
    if (!root) return;
    const params = new URLSearchParams(location.search);
    const error = params.get("error");
    if (error) {
      const box = root.querySelector("[data-auth-error]");
      if (box) {
        const messages = {
          access_denied: "Sign-in was cancelled.",
          invalid_state: "Your sign-in session expired. Please try again.",
          oauth_failed: "Sign-in failed. Please try again.",
          oauth_not_configured: "This sign-in provider isn't configured yet.",
          profile_failed: "Couldn't retrieve your profile. Please try again.",
          database_unavailable: "Database service temporarily unavailable.",
        };
        box.textContent = messages[error] || "Something went wrong. Please try again.";
        box.classList.remove("hidden");
      }
    }
  }

  /* ============ Init ============ */
  document.addEventListener("DOMContentLoaded", async () => {
    initTheme();
    initMobileNav();
    initSearchModal();
    initNotifications();
    initLoginPage();

    const user = await getCurrentUser();
    renderNavAuth(user);

    initStats();
    initExplorer();
    initDocs();
    initAccountPage();
  });
})();
