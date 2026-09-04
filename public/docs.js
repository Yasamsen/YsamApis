/* docs.js — sidebar otomatis dari manifest + API tester interaktif */

(function () {
  "use strict";

  const { loadManifest, escapeHtml, methodTagClass, slugify, highlightJson, copyText, showToast } = window.SamApi;

  function groupByCategory(apis) {
    const groups = {};
    apis.forEach((api) => {
      if (!groups[api.category]) groups[api.category] = [];
      groups[api.category].push(api);
    });
    return groups;
  }

  function buildCurl(api) {
    const params = api.parameters || [];
    if (api.method === "GET") {
      const query = params
        .filter((p) => p.example !== undefined)
        .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.example)}`)
        .join("&");
      const url = query ? `${api.endpoint}?${query}` : api.endpoint;
      return `curl "https://your-domain.vercel.app${url}"`;
    }

    const bodyObj = {};
    params.forEach((p) => { bodyObj[p.name] = p.example; });
    return `curl -X POST "https://your-domain.vercel.app${api.endpoint}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(bodyObj)}'`;
  }

  function buildExampleResponse(api) {
    if (api.category === "Downloader") {
      return { success: false, message: "Endpoint belum dikonfigurasi." };
    }
    return { success: true, message: "SamApi is working", data: {} };
  }

  function paramFieldHtml(slug, param) {
    const badge = param.required
      ? '<span class="req-badge req-badge--required">wajib</span>'
      : '<span class="req-badge req-badge--optional">opsional</span>';

    return `
      <div class="field">
        <label for="${slug}-param-${escapeHtml(param.name)}">${escapeHtml(param.name)} ${badge}</label>
        <input
          type="text"
          id="${slug}-param-${escapeHtml(param.name)}"
          data-param="${escapeHtml(param.name)}"
          data-required="${param.required ? "1" : "0"}"
          placeholder="${escapeHtml(String(param.example !== undefined ? param.example : ""))}"
        />
        <div class="field-error" data-param-error="${escapeHtml(param.name)}">Parameter ini wajib diisi.</div>
      </div>
    `;
  }

  function paramTableHtml(params) {
    if (!params || params.length === 0) {
      return `<p style="color:var(--text-3); font-size:13.5px; margin:0;">Endpoint ini tidak memerlukan parameter.</p>`;
    }
    const rows = params
      .map(
        (p) => `
        <tr>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.type || "string")}</td>
          <td>${p.required ? '<span class="req-badge req-badge--required">wajib</span>' : '<span class="req-badge req-badge--optional">opsional</span>'}</td>
          <td>${escapeHtml(String(p.example !== undefined ? p.example : "—"))}</td>
        </tr>`
      )
      .join("");

    return `
      <table class="param-table">
        <thead>
          <tr><th>Nama</th><th>Tipe</th><th>Status</th><th>Contoh</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function docPanelHtml(api) {
    const slug = slugify(api.endpoint);
    const methodClass = methodTagClass(api.method);
    const params = api.parameters || [];
    const isPost = api.method === "POST";

    const tryFieldsHtml = isPost
      ? `
        <div class="field">
          <label for="${slug}-body">Request Body (JSON)</label>
          <textarea id="${slug}-body" data-json-body>${escapeHtml(JSON.stringify(
            params.reduce((acc, p) => { acc[p.name] = p.example; return acc; }, {}),
            null,
            2
          ))}</textarea>
          <div class="field-error" data-json-error>JSON tidak valid.</div>
        </div>
      `
      : params.map((p) => paramFieldHtml(slug, p)).join("");

    return `
      <section class="doc-panel" id="doc-${slug}" data-doc-panel data-slug="${slug}">
        <div class="doc-panel__header">
          <div class="doc-panel__category">${escapeHtml(api.category)}</div>
          <h1 class="doc-panel__title">${escapeHtml(api.name)}</h1>
          <p class="doc-panel__desc">${escapeHtml(api.description)}</p>
          <div class="endpoint-row">
            <span class="method-tag ${methodClass}">${escapeHtml(api.method)}</span>
            <div class="endpoint-pill">
              <span>${escapeHtml(api.endpoint)}</span>
            </div>
            <button class="btn btn--ghost btn--sm" data-copy-endpoint="${escapeHtml(api.endpoint)}">Copy</button>
          </div>
        </div>

        <div class="doc-card">
          <h3>Parameters</h3>
          ${paramTableHtml(params)}
        </div>

        <div class="doc-card doc-card--relative">
          <h3>Example Request</h3>
          <button class="btn btn--ghost btn--sm copy-btn" data-copy-text="${escapeHtml(buildCurl(api))}">Copy</button>
          <div class="code-block">${escapeHtml(buildCurl(api))}</div>
        </div>

        <div class="doc-card doc-card--relative">
          <h3>Example Response</h3>
          <button class="btn btn--ghost btn--sm copy-btn" data-copy-text="${escapeHtml(JSON.stringify(buildExampleResponse(api), null, 2))}">Copy</button>
          <div class="code-block">${highlightJson(buildExampleResponse(api))}</div>
        </div>

        <div class="doc-card" data-try-panel data-method="${escapeHtml(api.method)}" data-endpoint="${escapeHtml(api.endpoint)}" data-slug="${slug}">
          <h3>Try Request</h3>
          <div class="field">
            <label>Method</label>
            <input type="text" value="${escapeHtml(api.method)}" disabled />
          </div>
          <div class="field">
            <label>Endpoint</label>
            <input type="text" value="${escapeHtml(api.endpoint)}" disabled />
          </div>
          ${tryFieldsHtml}
          <button class="btn btn--primary btn--block" data-send-request>Send Request</button>

          <div class="response-panel" data-response-panel style="display:none;">
            <div class="response-meta">
              <span class="status-pill" data-response-status>—</span>
              <span class="response-time" data-response-time></span>
            </div>
            <div class="response-tabs">
              <button class="response-tab is-active" data-tab="body">Body</button>
              <button class="response-tab" data-tab="headers">Headers</button>
            </div>
            <div class="response-body" data-tab-panel="body"></div>
            <div class="response-body" data-tab-panel="headers" style="display:none;"></div>
            <div class="response-actions">
              <button class="btn btn--ghost btn--sm" data-copy-response>Copy Response</button>
              <button class="btn btn--ghost btn--sm" data-clear-response>Clear</button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function sidebarHtml(groups) {
    return Object.keys(groups)
      .sort()
      .map((category) => {
        const links = groups[category]
          .map((api) => {
            const slug = slugify(api.endpoint);
            return `<a class="sidebar-link" data-slug="${slug}" href="#${slug}">${escapeHtml(api.name)}</a>`;
          })
          .join("");
        return `
          <div class="sidebar-group">
            <div class="sidebar-group__label">${escapeHtml(category)}</div>
            ${links}
          </div>
        `;
      })
      .join("");
  }

  function activatePanel(slug) {
    document.querySelectorAll("[data-doc-panel]").forEach((panel) => {
      panel.classList.toggle("is-active", panel.getAttribute("data-slug") === slug);
    });
    document.querySelectorAll(".sidebar-link").forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("data-slug") === slug);
    });
  }

  function initSidebarNav(apis) {
    document.querySelectorAll(".sidebar-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const slug = link.getAttribute("data-slug");
        activatePanel(slug);
        history.replaceState(null, "", `#${slug}`);
        const drawer = document.querySelector("[data-docs-sidebar]");
        if (drawer && window.innerWidth <= 900) drawer.classList.remove("is-open");
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });

    const initialSlug = window.location.hash ? window.location.hash.slice(1) : slugify(apis[0].endpoint);
    activatePanel(initialSlug);
  }

  function initSidebarToggle() {
    const btn = document.querySelector("[data-docs-sidebar-toggle]");
    const sidebar = document.querySelector("[data-docs-sidebar]");
    if (!btn || !sidebar) return;
    btn.addEventListener("click", () => sidebar.classList.toggle("is-open"));
  }

  function initCopyButtons() {
    document.body.addEventListener("click", (e) => {
      const endpointBtn = e.target.closest("[data-copy-endpoint]");
      if (endpointBtn) {
        copyText(endpointBtn.getAttribute("data-copy-endpoint"), "Endpoint disalin");
        const original = endpointBtn.textContent;
        endpointBtn.textContent = "✓ Copied";
        setTimeout(() => { endpointBtn.textContent = original; }, 1600);
        return;
      }

      const textBtn = e.target.closest("[data-copy-text]");
      if (textBtn) {
        copyText(textBtn.getAttribute("data-copy-text"), "Disalin ke clipboard");
        const original = textBtn.textContent;
        textBtn.textContent = "✓ Copied";
        setTimeout(() => { textBtn.textContent = original; }, 1600);
      }
    });
  }

  function initResponseTabs() {
    document.body.addEventListener("click", (e) => {
      const tabBtn = e.target.closest(".response-tab");
      if (!tabBtn) return;
      const panel = tabBtn.closest(".response-panel");
      const target = tabBtn.getAttribute("data-tab");

      panel.querySelectorAll(".response-tab").forEach((t) => t.classList.toggle("is-active", t === tabBtn));
      panel.querySelectorAll("[data-tab-panel]").forEach((p) => {
        p.style.display = p.getAttribute("data-tab-panel") === target ? "block" : "none";
      });
    });
  }

  function validateGetFields(tryPanel) {
    let valid = true;
    const values = {};

    tryPanel.querySelectorAll("[data-param]").forEach((input) => {
      const name = input.getAttribute("data-param");
      const required = input.getAttribute("data-required") === "1";
      const errorEl = tryPanel.querySelector(`[data-param-error="${name}"]`);
      const value = input.value.trim();

      if (required && !value) {
        valid = false;
        if (errorEl) errorEl.classList.add("is-visible");
      } else if (errorEl) {
        errorEl.classList.remove("is-visible");
      }

      if (value) values[name] = value;
    });

    return { valid, values };
  }

  async function sendRequest(tryPanel) {
    const method = tryPanel.getAttribute("data-method");
    const endpoint = tryPanel.getAttribute("data-endpoint");
    const sendBtn = tryPanel.querySelector("[data-send-request]");
    const responsePanel = tryPanel.querySelector("[data-response-panel]");
    const statusEl = tryPanel.querySelector("[data-response-status]");
    const timeEl = tryPanel.querySelector("[data-response-time]");
    const bodyPanel = tryPanel.querySelector('[data-tab-panel="body"]');
    const headersPanel = tryPanel.querySelector('[data-tab-panel="headers"]');

    let url = endpoint;
    let fetchOptions = { method, headers: {} };

    if (method === "POST") {
      const textarea = tryPanel.querySelector("[data-json-body]");
      const jsonError = tryPanel.querySelector("[data-json-error]");
      try {
        const parsedBody = textarea.value.trim() ? JSON.parse(textarea.value) : {};
        fetchOptions.headers["Content-Type"] = "application/json";
        fetchOptions.body = JSON.stringify(parsedBody);
        if (jsonError) jsonError.classList.remove("is-visible");
      } catch (err) {
        if (jsonError) jsonError.classList.add("is-visible");
        return;
      }
    } else {
      const { valid, values } = validateGetFields(tryPanel);
      if (!valid) return;
      const query = new URLSearchParams(values).toString();
      url = query ? `${endpoint}?${query}` : endpoint;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";

    const startedAt = performance.now();

    try {
      const res = await fetch(url, fetchOptions);
      const elapsed = Math.round(performance.now() - startedAt);

      let parsedBody;
      const rawText = await res.text();
      try {
        parsedBody = rawText ? JSON.parse(rawText) : {};
      } catch (err) {
        parsedBody = rawText;
      }

      const headersObj = {};
      res.headers.forEach((value, key) => { headersObj[key] = value; });

      responsePanel.style.display = "block";
      statusEl.textContent = `${res.status} ${res.statusText}`;
      statusEl.className = `status-pill ${res.ok ? "status-pill--ok" : "status-pill--err"}`;
      timeEl.textContent = `${elapsed} ms`;
      bodyPanel.innerHTML = highlightJson(parsedBody);
      headersPanel.innerHTML = highlightJson(headersObj);
      tryPanel.dataset.lastResponse = typeof parsedBody === "string" ? parsedBody : JSON.stringify(parsedBody, null, 2);
    } catch (err) {
      const elapsed = Math.round(performance.now() - startedAt);
      responsePanel.style.display = "block";
      statusEl.textContent = "Network Error";
      statusEl.className = "status-pill status-pill--err";
      timeEl.textContent = `${elapsed} ms`;
      bodyPanel.innerHTML = highlightJson({ success: false, message: "Tidak dapat menghubungi server. Periksa koneksi internet Anda." });
      headersPanel.innerHTML = "";
      tryPanel.dataset.lastResponse = "";
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = "Send Request";
    }
  }

  function initTryPanels() {
    document.body.addEventListener("click", (e) => {
      const sendBtn = e.target.closest("[data-send-request]");
      if (sendBtn) {
        sendRequest(sendBtn.closest("[data-try-panel]"));
        return;
      }

      const clearBtn = e.target.closest("[data-clear-response]");
      if (clearBtn) {
        const tryPanel = clearBtn.closest("[data-try-panel]");
        tryPanel.querySelector("[data-response-panel]").style.display = "none";
        return;
      }

      const copyResponseBtn = e.target.closest("[data-copy-response]");
      if (copyResponseBtn) {
        const tryPanel = copyResponseBtn.closest("[data-try-panel]");
        const text = tryPanel.dataset.lastResponse || "";
        if (text) copyText(text, "Response disalin");
        else showToast("Belum ada response untuk disalin");
      }
    });
  }

  async function init() {
    const apis = await loadManifest();

    if (!apis.length) {
      const content = document.querySelector("[data-docs-content]");
      if (content) {
        content.innerHTML = `<div class="empty-state"><div class="empty-state__title">Belum ada API</div><p>Tambahkan file baru di folder api/ lalu jalankan npm run build.</p></div>`;
      }
      return;
    }

    const groups = groupByCategory(apis);

    const sidebar = document.querySelector("[data-sidebar-groups]");
    if (sidebar) sidebar.innerHTML = sidebarHtml(groups);

    const content = document.querySelector("[data-docs-content]");
    if (content) content.innerHTML = apis.map(docPanelHtml).join("");

    initSidebarNav(apis);
    initSidebarToggle();
    initCopyButtons();
    initResponseTabs();
    initTryPanels();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
