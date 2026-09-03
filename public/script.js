/* script.js
 * Vanilla JS shared by every page. The page a visitor is on is read from
 * <body data-page="..."> and routes to the matching render function at the
 * bottom of this file. Nothing here knows about the filesystem - it only
 * ever talks to /api-manifest.json (written by scripts/generate-manifest.js)
 * and /notifications.json.
 */

(() => {
  'use strict';

  /* ----------------------------------------------------------
     Theme
  ---------------------------------------------------------- */

  function initTheme() {
    const saved = localStorage.getItem('samapi-theme');
    const theme = saved || 'dark';
    document.documentElement.setAttribute('data-theme', theme);

    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      updateThemeIcon(btn, theme);
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('samapi-theme', next);
        document.querySelectorAll('[data-theme-toggle]').forEach((b) => updateThemeIcon(b, next));
      });
    });
  }

  function updateThemeIcon(btn, theme) {
    btn.innerHTML = theme === 'dark' ? iconMoon() : iconSun();
    btn.setAttribute('aria-label', theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap');
  }

  /* ----------------------------------------------------------
     Navbar (mobile drawer)
  ---------------------------------------------------------- */

  function initNavbar() {
    const hamburger = document.querySelector('[data-hamburger]');
    const drawer = document.querySelector('[data-nav-drawer]');
    if (!hamburger || !drawer) return;

    hamburger.addEventListener('click', () => {
      const open = drawer.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      hamburger.innerHTML = open ? iconClose() : iconMenu();
    });

    drawer.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        drawer.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.innerHTML = iconMenu();
      });
    });
  }

  /* ----------------------------------------------------------
     Notifications
  ---------------------------------------------------------- */

  async function initNotifications() {
    const bar = document.querySelector('[data-notif-bar]');
    if (!bar) return;
    try {
      const res = await fetch('/notifications.json', { cache: 'no-store' });
      const items = await res.json();
      if (Array.isArray(items) && items.length > 0) {
        const first = items[0];
        const text = typeof first === 'string' ? first : first.message || '';
        if (text) {
          bar.querySelector('[data-notif-text]').textContent = text;
          bar.classList.add('show');
        }
      }
    } catch (err) {
      /* Notifications are optional - fail silently. */
    }
  }

  /* ----------------------------------------------------------
     Manifest
  ---------------------------------------------------------- */

  let manifestPromise = null;
  function loadManifest() {
    if (!manifestPromise) {
      manifestPromise = fetch('/api-manifest.json', { cache: 'no-store' })
        .then((r) => {
          if (!r.ok) throw new Error('Gagal memuat manifest API');
          return r.json();
        })
        .catch((err) => {
          console.error(err);
          return [];
        });
    }
    return manifestPromise;
  }

  /* ----------------------------------------------------------
     Small utilities
  ---------------------------------------------------------- */

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function slugify(name) {
    return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function copyText(text, onDone) {
    const done = () => { showToast('Disalin ke clipboard'); if (onDone) onDone(); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* noop */ }
    document.body.removeChild(ta);
    done();
  }

  function categoryCount(manifest) {
    return new Set(manifest.map((a) => a.category)).size;
  }

  /* Extremely small JSON syntax highlighter - avoids pulling in a library
     just to color a handful of tokens. */
  function highlightJSON(value) {
    const json = JSON.stringify(value, null, 2);
    const escaped = escapeHtml(json);
    return escaped.replace(
      /(&quot;.*?&quot;)(:)?|\b(true|false|null)\b|(-?\d+\.?\d*)/g,
      (match, str, colon, bool, num) => {
        if (str) {
          const cls = colon ? 'tok-key' : 'tok-str';
          return `<span class="${cls}">${str}</span>${colon || ''}`;
        }
        if (bool) return `<span class="tok-bool">${bool}</span>`;
        if (num) return `<span class="tok-bool">${num}</span>`;
        return match;
      }
    );
  }

  function methodTag(method) {
    return `<span class="method-tag method-${method}">${method}</span>`;
  }

  /* ----------------------------------------------------------
     Icons (inline SVG, no icon font)
  ---------------------------------------------------------- */

  function iconMoon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>';
  }
  function iconSun() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
  }
  function iconMenu() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
  }
  function iconClose() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  }
  function iconCopy() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  }
  function iconCheck() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  }
  function iconSearch() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>';
  }

  /* ----------------------------------------------------------
     API card markup (used on homepage)
  ---------------------------------------------------------- */

  function apiCardHTML(api) {
    return `
      <article class="api-card" data-name="${escapeHtml(api.name.toLowerCase())}" data-desc="${escapeHtml((api.description || '').toLowerCase())}" data-endpoint="${escapeHtml(api.endpoint.toLowerCase())}" data-category="${escapeHtml(api.category)}">
        <div class="api-card-top">
          <span class="api-card-cat">${escapeHtml(api.category)}</span>
          <h3 class="api-card-name">${escapeHtml(api.name)}</h3>
        </div>
        <p class="api-card-desc">${escapeHtml(api.description || '')}</p>
        <div class="endpoint-row">
          ${methodTag(api.method)}
          <span class="endpoint-path">${escapeHtml(api.endpoint)}</span>
          <button class="copy-icon-btn" type="button" data-copy="${escapeHtml(api.endpoint)}" aria-label="Salin endpoint">${iconCopy()}</button>
        </div>
        <div class="api-card-actions">
          <a class="btn btn-secondary btn-sm" href="/docs#${slugify(api.name)}">Try API</a>
          <a class="btn btn-ghost btn-sm" href="/docs#${slugify(api.name)}">Docs</a>
        </div>
      </article>`;
  }

  function bindCopyButtons(root) {
    root.querySelectorAll('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        copyText(btn.getAttribute('data-copy'));
        const original = btn.innerHTML;
        btn.innerHTML = iconCheck();
        setTimeout(() => { btn.innerHTML = original; }, 1400);
      });
    });
  }

  /* ----------------------------------------------------------
     Home page
  ---------------------------------------------------------- */

  async function renderHome() {
    const grid = document.querySelector('[data-api-grid]');
    const searchInput = document.querySelector('[data-search]');
    const filterGroup = document.querySelector('[data-filter-group]');
    const curlEl = document.querySelector('[data-curl]');
    if (curlEl) curlEl.textContent = `curl ${window.location.origin}/api/example`;

    const manifest = await loadManifest();

    const statTotal = document.querySelector('[data-stat-total]');
    const statOnline = document.querySelector('[data-stat-online]');
    const statCategories = document.querySelector('[data-stat-categories]');
    if (statTotal) statTotal.textContent = manifest.length;
    if (statOnline) statOnline.textContent = manifest.length;
    if (statCategories) statCategories.textContent = categoryCount(manifest);

    if (!grid) return;

    if (manifest.length === 0) {
      grid.innerHTML = '<div class="empty-state">Belum ada API yang terdaftar.</div>';
      return;
    }

    grid.innerHTML = manifest.map(apiCardHTML).join('');
    bindCopyButtons(grid);

    // Filter chips generated from actual categories present.
    if (filterGroup) {
      const categories = ['All', ...Array.from(new Set(manifest.map((a) => a.category)))];
      filterGroup.innerHTML = categories.map((cat, i) =>
        `<button class="filter-chip${i === 0 ? ' active' : ''}" data-cat="${escapeHtml(cat)}" type="button">${escapeHtml(cat)}</button>`
      ).join('');
    }

    let activeCategory = 'All';
    function applyFilters() {
      const q = (searchInput?.value || '').trim().toLowerCase();
      const cards = grid.querySelectorAll('.api-card');
      let visible = 0;
      cards.forEach((card) => {
        const matchesCat = activeCategory === 'All' || card.dataset.category === activeCategory;
        const matchesSearch = !q ||
          card.dataset.name.includes(q) ||
          card.dataset.desc.includes(q) ||
          card.dataset.endpoint.includes(q) ||
          card.dataset.category.toLowerCase().includes(q);
        const show = matchesCat && matchesSearch;
        card.style.display = show ? '' : 'none';
        if (show) visible += 1;
      });
      let empty = grid.querySelector('.empty-state');
      if (visible === 0) {
        if (!empty) {
          empty = document.createElement('div');
          empty.className = 'empty-state';
          empty.textContent = 'Tidak ada API yang cocok dengan pencarian.';
          grid.appendChild(empty);
        }
      } else if (empty) {
        empty.remove();
      }
    }

    searchInput?.addEventListener('input', applyFilters);
    filterGroup?.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-chip');
      if (!btn) return;
      filterGroup.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.cat;
      applyFilters();
    });
  }

  /* ----------------------------------------------------------
     Docs page
  ---------------------------------------------------------- */

  async function renderDocs() {
    const sidebar = document.querySelector('[data-docs-sidebar]');
    const main = document.querySelector('[data-docs-main]');
    const search = document.querySelector('[data-docs-search]');
    const mobileToggle = document.querySelector('[data-docs-toggle]');
    if (!sidebar || !main) return;

    const manifest = await loadManifest();

    if (manifest.length === 0) {
      main.innerHTML = '<div class="empty-state">Belum ada API yang terdaftar.</div>';
      sidebar.innerHTML = '';
      return;
    }

    const byCategory = {};
    manifest.forEach((api) => {
      (byCategory[api.category] = byCategory[api.category] || []).push(api);
    });

    sidebar.innerHTML = Object.keys(byCategory).map((cat) => `
      <div class="docs-cat">
        <div class="docs-cat-label">${escapeHtml(cat)}</div>
        <ul>
          ${byCategory[cat].map((api) => `
            <li>
              <button class="docs-nav-link" type="button" data-slug="${slugify(api.name)}">
                ${methodTag(api.method)}<span>${escapeHtml(api.name)}</span>
              </button>
            </li>`).join('')}
        </ul>
      </div>`).join('');

    function findApi(slug) {
      return manifest.find((a) => slugify(a.name) === slug);
    }

    function selectApi(slug, opts = {}) {
      const api = findApi(slug) || manifest[0];
      const realSlug = slugify(api.name);
      sidebar.querySelectorAll('.docs-nav-link').forEach((b) => {
        b.classList.toggle('active', b.dataset.slug === realSlug);
      });
      renderDoc(main, api);
      if (!opts.skipHash) history.replaceState(null, '', `#${realSlug}`);
      if (mobileToggle) {
        mobileToggle.querySelector('[data-docs-toggle-label]').textContent = api.name;
        sidebar.classList.remove('open');
      }
    }

    sidebar.addEventListener('click', (e) => {
      const btn = e.target.closest('.docs-nav-link');
      if (!btn) return;
      selectApi(btn.dataset.slug);
    });

    mobileToggle?.addEventListener('click', () => sidebar.classList.toggle('open'));

    search?.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      sidebar.querySelectorAll('.docs-cat').forEach((catBlock) => {
        let any = false;
        catBlock.querySelectorAll('li').forEach((li) => {
          const text = li.textContent.toLowerCase();
          const show = !q || text.includes(q);
          li.style.display = show ? '' : 'none';
          if (show) any = true;
        });
        catBlock.style.display = any ? '' : 'none';
      });
    });

    const initialSlug = window.location.hash ? window.location.hash.slice(1) : slugify(manifest[0].name);
    selectApi(initialSlug, { skipHash: true });

    window.addEventListener('hashchange', () => {
      if (window.location.hash) selectApi(window.location.hash.slice(1));
    });
  }

  function renderDoc(main, api) {
    const origin = window.location.origin;
    const exampleQuery = (api.parameters || [])
      .filter((p) => p.required)
      .map((p) => `${p.name}=${encodeURIComponent(p.example || '')}`)
      .join('&');
    const exampleUrl = `${origin}${api.endpoint}${exampleQuery ? '?' + exampleQuery : ''}`;

    main.innerHTML = `
      <div class="doc-header">
        <span class="api-card-cat">${escapeHtml(api.category)}</span>
        <h1>${escapeHtml(api.name)}</h1>
        <p>${escapeHtml(api.description || '')}</p>
        <div class="doc-meta-row">
          <div class="doc-endpoint-box">
            ${methodTag(api.method)}
            <span>${escapeHtml(api.endpoint)}</span>
            <button class="copy-icon-btn" type="button" data-copy="${escapeHtml(api.endpoint)}" aria-label="Salin endpoint" style="margin-left:auto">${iconCopy()}</button>
          </div>
        </div>
      </div>

      ${(api.parameters || []).length > 0 ? `
      <div class="doc-block">
        <h3>Parameters</h3>
        <table class="param-table">
          <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Example</th></tr></thead>
          <tbody>
            ${api.parameters.map((p) => `
              <tr>
                <td>${escapeHtml(p.name)}</td>
                <td>${escapeHtml(p.type || 'string')}</td>
                <td>${p.required ? '<span class="req-tag">required</span>' : '<span class="opt-tag">optional</span>'}</td>
                <td>${escapeHtml(p.example ?? '')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>` : ''}

      <div class="doc-block">
        <h3>Example request</h3>
        <div class="code-window">
          <div class="code-window-head">
            <div class="traffic-lights"><span></span><span></span><span></span></div>
            <span class="code-window-title">curl</span>
          </div>
          <pre class="mono cmd-line">${escapeHtml(`curl "${exampleUrl}"`)}</pre>
          <div class="code-window-foot">
            <button class="btn btn-ghost btn-sm" type="button" data-copy="${escapeHtml(`curl "${exampleUrl}"`)}">Copy</button>
          </div>
        </div>
      </div>

      <div class="doc-block">
        <h3>Try it</h3>
        <div class="try-panel">
          <div class="try-panel-head">
            ${methodTag(api.method)}
            <span class="mono">${escapeHtml(api.endpoint)}</span>
          </div>
          <div class="try-panel-body">
            <form data-try-form>
              ${(api.parameters || []).map((p) => `
                <div class="field" data-field="${escapeHtml(p.name)}">
                  <label for="try-${escapeHtml(p.name)}">${escapeHtml(p.name)}${p.required ? ' <span class="req-tag">required</span>' : ' <span class="opt-tag">optional</span>'}</label>
                  <input id="try-${escapeHtml(p.name)}" type="text" name="${escapeHtml(p.name)}" placeholder="${escapeHtml(p.example ?? '')}" ${p.required ? 'required' : ''} />
                  <div class="field-error">Parameter "${escapeHtml(p.name)}" diperlukan.</div>
                </div>`).join('')}
              ${(api.parameters || []).length === 0 ? '<p class="field-hint">Endpoint ini tidak memerlukan parameter.</p>' : ''}
              <button class="btn btn-primary btn-block" type="submit" data-send-btn>Send Request</button>
            </form>

            <div class="try-response" data-try-response hidden>
              <div class="response-meta">
                <span class="status-chip" data-resp-status></span>
                <span class="timing" data-resp-time></span>
              </div>
              <div class="tabs">
                <button class="tab-btn active" type="button" data-tab="body">Body</button>
                <button class="tab-btn" type="button" data-tab="headers">Headers</button>
              </div>
              <pre class="response-body" data-resp-body></pre>
              <pre class="response-body" data-resp-headers hidden></pre>
              <div class="response-actions">
                <button class="btn btn-ghost btn-sm" type="button" data-resp-copy>Copy Response</button>
                <button class="btn btn-ghost btn-sm" type="button" data-resp-clear>Clear</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    bindCopyButtons(main);
    bindTryPanel(main, api);
  }

  function bindTryPanel(main, api) {
    const form = main.querySelector('[data-try-form]');
    const responseBox = main.querySelector('[data-try-response]');
    const statusChip = main.querySelector('[data-resp-status]');
    const timingEl = main.querySelector('[data-resp-time]');
    const bodyEl = main.querySelector('[data-resp-body]');
    const headersEl = main.querySelector('[data-resp-headers]');
    if (!form) return;

    let lastRawBody = '';

    main.querySelectorAll('.tab-btn').forEach((tab) => {
      tab.addEventListener('click', () => {
        main.querySelectorAll('.tab-btn').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const showHeaders = tab.dataset.tab === 'headers';
        bodyEl.hidden = showHeaders;
        headersEl.hidden = !showHeaders;
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;
      const params = {};

      (api.parameters || []).forEach((p) => {
        const fieldWrap = form.querySelector(`[data-field="${CSS.escape(p.name)}"]`);
        const input = fieldWrap?.querySelector('input');
        const value = input?.value.trim() || '';
        fieldWrap?.classList.toggle('invalid', p.required && !value);
        if (p.required && !value) valid = false;
        if (value) params[p.name] = value;
      });

      if (!valid) return;

      const sendBtn = form.querySelector('[data-send-btn]');
      const original = sendBtn.textContent;
      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending...';

      const url = new URL(api.endpoint, window.location.origin);
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

      const started = performance.now();
      try {
        const res = await fetch(url.toString(), { method: api.method || 'GET' });
        const elapsed = Math.round(performance.now() - started);
        let data;
        const text = await res.text();
        try { data = JSON.parse(text); } catch (e) { data = text; }

        lastRawBody = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        bodyEl.innerHTML = typeof data === 'string' ? escapeHtml(data) : highlightJSON(data);

        const headerLines = [];
        res.headers.forEach((v, k) => headerLines.push(`${k}: ${v}`));
        headersEl.textContent = headerLines.join('\n') || '(no headers)';

        statusChip.textContent = `${res.status} ${res.statusText}`;
        statusChip.className = 'status-chip ' + (res.status < 300 ? 'status-2xx' : res.status < 500 ? 'status-4xx' : 'status-5xx');
        timingEl.textContent = `${elapsed} ms`;
        responseBox.hidden = false;
      } catch (err) {
        lastRawBody = JSON.stringify({ success: false, message: 'Network error atau request timeout.' }, null, 2);
        bodyEl.textContent = lastRawBody;
        headersEl.textContent = '(no headers)';
        statusChip.textContent = 'Network Error';
        statusChip.className = 'status-chip status-5xx';
        timingEl.textContent = `${Math.round(performance.now() - started)} ms`;
        responseBox.hidden = false;
      } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = original;
      }
    });

    main.querySelector('[data-resp-copy]')?.addEventListener('click', () => copyText(lastRawBody));
    main.querySelector('[data-resp-clear]')?.addEventListener('click', () => {
      responseBox.hidden = true;
      form.reset();
      form.querySelectorAll('.field').forEach((f) => f.classList.remove('invalid'));
    });
  }

  /* ----------------------------------------------------------
     Global keyboard shortcut: Ctrl/Cmd + K focuses search
  ---------------------------------------------------------- */

  function initSearchShortcut() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        const field = document.querySelector('[data-search], [data-docs-search]');
        if (field) { e.preventDefault(); field.focus(); }
      }
    });
  }

  /* ----------------------------------------------------------
     Boot
  ---------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavbar();
    initNotifications();
    initSearchShortcut();

    document.querySelectorAll('[data-hamburger]').forEach((btn) => { btn.innerHTML = iconMenu(); });
    document.querySelectorAll('[data-search-icon]').forEach((el) => { el.innerHTML = iconSearch(); });

    const page = document.body.dataset.page;
    if (page === 'home') renderHome();
    if (page === 'docs') renderDocs();
  });
})();
