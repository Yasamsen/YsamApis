/**
 * SamApi — Frontend Application
 * Vanilla JS • No frameworks
 */

(function () {
  'use strict';

  // ---------- State ----------
  let manifest = [];
  let currentFilter = 'All';
  let searchQuery = '';

  // ---------- Theme ----------
  function initTheme() {
    const saved = localStorage.getItem('samapi-theme');
    const theme = saved || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('samapi-theme', next);
    updateThemeIcon(next);
  }

  function updateThemeIcon(theme) {
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      btn.textContent = theme === 'dark' ? '☾' : '☀';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  // ---------- Navbar mobile ----------
  function initNav() {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
        const open = mobileMenu.classList.contains('open');
        hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }

    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      btn.addEventListener('click', toggleTheme);
    });
  }

  // ---------- Manifest ----------
  async function loadManifest() {
    try {
      const res = await fetch('/api-manifest.json');
      if (!res.ok) throw new Error('Failed to load manifest');
      manifest = await res.json();
      return manifest;
    } catch (err) {
      console.error('Manifest load error:', err);
      manifest = [];
      return [];
    }
  }

  // ---------- Helpers ----------
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function highlightJson(jsonStr) {
    try {
      const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      const str = JSON.stringify(obj, null, 2);
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
          let cls = 'json-number';
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              cls = 'json-key';
              return '<span class="' + cls + '">' + match.slice(0, -1) + '</span>:';
            }
            cls = 'json-string';
          } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
          } else if (/null/.test(match)) {
            cls = 'json-null';
          }
          return '<span class="' + cls + '">' + match + '</span>';
        });
    } catch {
      return escapeHtml(String(jsonStr));
    }
  }

  function methodClass(method) {
    const m = (method || 'GET').toUpperCase();
    if (m === 'GET') return 'method-get';
    if (m === 'POST') return 'method-post';
    if (m === 'PUT') return 'method-put';
    if (m === 'DELETE') return 'method-delete';
    return 'method-get';
  }

  function copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const original = btn.textContent;
      btn.textContent = '✓ Copied';
      btn.classList.add('copy-success');
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove('copy-success');
      }, 1800);
    }).catch(() => {
      btn.textContent = 'Failed';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    });
  }

  function getCategories() {
    const cats = new Set(manifest.map((a) => a.category || 'Other'));
    return Array.from(cats).sort();
  }

  // ---------- Homepage ----------
  function renderStats() {
    const totalEl = document.getElementById('stat-total');
    const onlineEl = document.getElementById('stat-online');
    const catsEl = document.getElementById('stat-categories');
    if (!totalEl) return;

    const total = manifest.length;
    const cats = getCategories().length;

    totalEl.textContent = total;
    if (onlineEl) onlineEl.textContent = total;
    if (catsEl) catsEl.textContent = cats;
  }

  function renderApiCards(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let filtered = manifest;

    if (currentFilter && currentFilter !== 'All') {
      filtered = filtered.filter((a) => (a.category || 'Other') === currentFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((a) => {
        const params = (a.parameters || []).map((p) => p.name).join(' ');
        return (
          (a.name || '').toLowerCase().includes(q) ||
          (a.description || '').toLowerCase().includes(q) ||
          (a.endpoint || '').toLowerCase().includes(q) ||
          (a.category || '').toLowerCase().includes(q) ||
          params.toLowerCase().includes(q)
        );
      });
    }

    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-state">No APIs found matching your search.</div>';
      return;
    }

    container.innerHTML = filtered
      .map((api) => {
        const method = (api.method || 'GET').toUpperCase();
        return `
        <article class="api-card">
          <h3 class="api-card-title">${escapeHtml(api.name)}</h3>
          <p class="api-card-desc">${escapeHtml(api.description || '')}</p>
          <div class="api-card-meta">
            <span class="method-badge ${methodClass(method)}">${method}</span>
            <span class="endpoint-path" title="${escapeHtml(api.endpoint)}">${escapeHtml(api.endpoint)}</span>
          </div>
          <div class="api-card-actions">
            <a href="/docs#${encodeURIComponent(api.endpoint)}" class="btn btn-primary btn-sm">Try API</a>
            <a href="/docs#${encodeURIComponent(api.endpoint)}" class="btn btn-secondary btn-sm">Docs</a>
          </div>
        </article>`;
      })
      .join('');
  }

  function renderFilterPills() {
    const container = document.getElementById('filter-pills');
    if (!container) return;

    const cats = ['All', ...getCategories()];
    container.innerHTML = cats
      .map(
        (c) =>
          `<button type="button" class="filter-pill ${c === currentFilter ? 'active' : ''}" data-filter="${escapeHtml(c)}">${escapeHtml(c)}</button>`
      )
      .join('');

    container.querySelectorAll('.filter-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        container.querySelectorAll('.filter-pill').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderApiCards('api-grid');
      });
    });
  }

  function initSearch() {
    const input = document.getElementById('api-search');
    if (!input) return;

    input.addEventListener('input', () => {
      searchQuery = input.value.trim();
      renderApiCards('api-grid');
    });

    // Ctrl/Cmd + K
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        input.focus();
      }
    });
  }

  function initHome() {
    renderStats();
    renderFilterPills();
    renderApiCards('api-grid');
    initSearch();

    // Hero copy buttons
    document.querySelectorAll('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.copy;
        const el = document.getElementById(target);
        if (el) copyText(el.textContent.trim(), btn);
      });
    });
  }

  // ---------- Docs ----------
  function renderDocsSidebar() {
    const sidebar = document.getElementById('docs-sidebar');
    if (!sidebar) return;

    const byCat = {};
    manifest.forEach((api) => {
      const cat = api.category || 'Other';
      if (!byCat[cat]) byCat[cat] = [];
      byCat[cat].push(api);
    });

    const cats = Object.keys(byCat).sort();
    let html = '';

    cats.forEach((cat) => {
      html += `<div class="sidebar-section">
        <div class="sidebar-category">${escapeHtml(cat)}</div>`;
      byCat[cat].forEach((api) => {
        html += `<a href="#${encodeURIComponent(api.endpoint)}" class="sidebar-link" data-endpoint="${escapeHtml(api.endpoint)}">${escapeHtml(api.name)}</a>`;
      });
      html += '</div>';
    });

    sidebar.innerHTML = html || '<div class="empty-state">No APIs yet</div>';

    sidebar.querySelectorAll('.sidebar-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const endpoint = link.dataset.endpoint;
        history.replaceState(null, '', '#' + encodeURIComponent(endpoint));
        showApiDoc(endpoint);
        sidebar.querySelectorAll('.sidebar-link').forEach((l) => l.classList.remove('active'));
        link.classList.add('active');
      });
    });
  }

  function showApiDoc(endpoint) {
    const content = document.getElementById('docs-content');
    if (!content) return;

    const api = manifest.find((a) => a.endpoint === endpoint);
    if (!api) {
      content.innerHTML = `
        <div class="empty-state">
          <h2>Select an API</h2>
          <p>Choose an endpoint from the sidebar to view documentation.</p>
        </div>`;
      return;
    }

    const method = (api.method || 'GET').toUpperCase();
    const params = api.parameters || [];

    let paramsHtml = '';
    if (params.length === 0) {
      paramsHtml = '<p style="color:var(--text-muted);font-size:0.9rem;">No parameters required.</p>';
    } else {
      paramsHtml = `<table class="param-table">
        <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Example</th></tr></thead>
        <tbody>
          ${params
            .map(
              (p) => `<tr>
              <td><code>${escapeHtml(p.name)}</code></td>
              <td>${escapeHtml(p.type || 'string')}</td>
              <td>${p.required ? '<span class="required-badge">required</span>' : 'optional'}</td>
              <td><code>${escapeHtml(String(p.example ?? ''))}</code></td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>`;
    }

    // Build form fields for Try API
    let formFields = '';
    if (method === 'POST' || method === 'PUT') {
      // JSON body editor
      const exampleBody = {};
      params.forEach((p) => {
        exampleBody[p.name] = p.example ?? '';
      });
      formFields = `
        <div class="form-group">
          <label for="try-body">Request Body (JSON)</label>
          <textarea id="try-body" rows="6">${escapeHtml(JSON.stringify(exampleBody, null, 2))}</textarea>
        </div>`;
    } else {
      formFields = params
        .map(
          (p) => `
        <div class="form-group">
          <label for="param-${escapeHtml(p.name)}">${escapeHtml(p.name)}${p.required ? ' *' : ''}</label>
          <input type="text" id="param-${escapeHtml(p.name)}" name="${escapeHtml(p.name)}"
            placeholder="${escapeHtml(String(p.example ?? ''))}"
            ${p.required ? 'required' : ''}
            value=""
            autocomplete="off" />
        </div>`
        )
        .join('');
      if (params.length === 0) {
        formFields = '<p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:12px;">No parameters needed.</p>';
      }
    }

    content.innerHTML = `
      <h1>${escapeHtml(api.name)}</h1>
      <div class="docs-meta">
        <span class="method-badge ${methodClass(method)}">${method}</span>
        <code class="endpoint-path">${escapeHtml(api.endpoint)}</code>
        <button type="button" class="btn btn-secondary btn-sm" id="copy-endpoint-btn">Copy</button>
      </div>
      <p class="docs-description">${escapeHtml(api.description || '')}</p>

      <div class="doc-section">
        <h3>Parameters</h3>
        ${paramsHtml}
      </div>

      <div class="doc-section">
        <h3>Example Request</h3>
        <div class="code-preview">
          <div class="code-preview-header">
            <span>cURL</span>
            <button type="button" class="copy-btn" id="copy-curl-btn">Copy</button>
          </div>
          <pre id="example-curl"></pre>
        </div>
      </div>

      <div class="doc-section">
        <h3>Try Request</h3>
        <div class="try-panel">
          <div class="try-header">Send a live request</div>
          <div class="try-body">
            <div class="form-group">
              <label>Method</label>
              <input type="text" value="${method}" disabled />
            </div>
            <div class="form-group">
              <label>Endpoint</label>
              <input type="text" value="${escapeHtml(api.endpoint)}" disabled />
            </div>
            ${formFields}
            <div class="try-actions">
              <button type="button" class="btn btn-primary" id="send-request-btn">Send Request</button>
            </div>
            <div id="response-container" class="hidden"></div>
          </div>
        </div>
      </div>
    `;

    // Example cURL
    const curlEl = document.getElementById('example-curl');
    let curl = `curl -X ${method} "${window.location.origin}${api.endpoint}`;
    if (method === 'GET' && params.length) {
      const qs = params.map((p) => `${p.name}=${encodeURIComponent(p.example || 'value')}`).join('&');
      curl += `?${qs}"`;
    } else {
      curl += '"';
    }
    if (method === 'POST' || method === 'PUT') {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '{}'`;
    }
    curlEl.textContent = curl;

    // Copy endpoint
    document.getElementById('copy-endpoint-btn').addEventListener('click', function () {
      copyText(window.location.origin + api.endpoint, this);
    });

    document.getElementById('copy-curl-btn').addEventListener('click', function () {
      copyText(curlEl.textContent, this);
    });

    // Send request
    document.getElementById('send-request-btn').addEventListener('click', () => sendApiRequest(api));
  }

  async function sendApiRequest(api) {
    const btn = document.getElementById('send-request-btn');
    const container = document.getElementById('response-container');
    const method = (api.method || 'GET').toUpperCase();
    const params = api.parameters || [];

    btn.disabled = true;
    btn.textContent = 'Sending...';

    let url = api.endpoint;
    let body = null;
    const headers = { Accept: 'application/json' };

    try {
      if (method === 'GET' || method === 'DELETE') {
        const searchParams = new URLSearchParams();
        params.forEach((p) => {
          const input = document.getElementById('param-' + p.name);
          if (input && input.value.trim()) {
            searchParams.append(p.name, input.value.trim());
          } else if (p.required) {
            throw new Error(`Parameter "${p.name}" is required`);
          }
        });
        const qs = searchParams.toString();
        if (qs) url += '?' + qs;
      } else {
        // POST / PUT
        const bodyEl = document.getElementById('try-body');
        if (bodyEl) {
          try {
            body = JSON.parse(bodyEl.value);
          } catch {
            throw new Error('Invalid JSON body');
          }
        } else {
          body = {};
          params.forEach((p) => {
            const input = document.getElementById('param-' + p.name);
            if (input) body[p.name] = input.value;
          });
        }
        headers['Content-Type'] = 'application/json';
      }

      const start = performance.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });
      clearTimeout(timeout);

      const elapsed = Math.round(performance.now() - start);
      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      const statusClass = res.ok ? 'status-ok' : 'status-err';
      container.classList.remove('hidden');
      container.innerHTML = `
        <div class="response-panel">
          <div class="response-header">
            <div class="response-status">
              <span class="${statusClass}">${res.status} ${res.statusText || ''}</span>
              <span class="response-time">${elapsed} ms</span>
            </div>
            <div>
              <button type="button" class="btn btn-secondary btn-sm" id="copy-response-btn">Copy Response</button>
              <button type="button" class="btn btn-secondary btn-sm" id="clear-response-btn">Clear</button>
            </div>
          </div>
          <div class="response-body">
            <pre>${typeof data === 'object' ? highlightJson(data) : escapeHtml(String(data))}</pre>
          </div>
        </div>`;

      document.getElementById('copy-response-btn').addEventListener('click', function () {
        const textToCopy = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
        copyText(textToCopy, this);
      });
      document.getElementById('clear-response-btn').addEventListener('click', () => {
        container.classList.add('hidden');
        container.innerHTML = '';
      });
    } catch (err) {
      container.classList.remove('hidden');
      const isAbort = err.name === 'AbortError';
      container.innerHTML = `
        <div class="response-panel">
          <div class="response-header">
            <span class="status-err">${isAbort ? 'Timeout' : 'Error'}</span>
          </div>
          <div class="response-body">
            <pre>${escapeHtml(err.message || 'Network error')}</pre>
          </div>
        </div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Request';
    }
  }

  function initDocs() {
    renderDocsSidebar();

    // Load from hash
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (hash && manifest.some((a) => a.endpoint === hash)) {
      showApiDoc(hash);
      const link = document.querySelector(`.sidebar-link[data-endpoint="${hash}"]`);
      if (link) link.classList.add('active');
    } else if (manifest.length > 0) {
      showApiDoc(manifest[0].endpoint);
      const link = document.querySelector(`.sidebar-link[data-endpoint="${manifest[0].endpoint}"]`);
      if (link) link.classList.add('active');
    } else {
      showApiDoc(null);
    }

    window.addEventListener('hashchange', () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      if (h) showApiDoc(h);
    });
  }

  // ---------- Notifications ----------
  async function loadNotifications() {
    try {
      const res = await fetch('/notifications.json');
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return;

      // Simple banner for first notification
      const n = data[0];
      if (!n || !n.message) return;

      const bar = document.createElement('div');
      bar.style.cssText =
        'background:var(--accent-muted);border-bottom:1px solid rgba(59,130,246,0.3);padding:10px 24px;text-align:center;font-size:0.875rem;color:var(--accent);position:relative;z-index:101;';
      bar.innerHTML = escapeHtml(n.message) +
        ' <button type="button" style="margin-left:12px;background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1rem;" aria-label="Dismiss">×</button>';
      bar.querySelector('button').addEventListener('click', () => bar.remove());
      document.body.insertBefore(bar, document.body.firstChild);
    } catch {
      // ignore
    }
  }

  // ---------- Init ----------
  async function init() {
    initTheme();
    initNav();
    loadNotifications();

    await loadManifest();

    const page = document.body.dataset.page;

    if (page === 'home') {
      initHome();
    } else if (page === 'docs') {
      initDocs();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
