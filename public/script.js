/**
 * SamApi Frontend Core
 */
(function () {
  'use strict';

  const API_BASE = '';
  let manifest = [];
  let currentUser = null;

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
      btn.innerHTML = theme === 'dark' ? '☀' : '☾';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  // ---------- User / Auth ----------
  async function fetchUser() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
      if (!res.ok) {
        currentUser = null;
        return null;
      }
      const data = await res.json();
      if (data.success && data.user) {
        currentUser = data.user;
        return currentUser;
      }
      currentUser = null;
      return null;
    } catch {
      currentUser = null;
      return null;
    }
  }

  async function logout() {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch {}
    currentUser = null;
    window.location.href = '/';
  }

  function renderNavUser() {
    const containers = document.querySelectorAll('[data-user-slot]');
    containers.forEach((el) => {
      if (currentUser) {
        const remaining = currentUser.remaining;
        const used = currentUser.usage;
        const limit = currentUser.limit;
        el.innerHTML = `
          <a href="/account" class="user-menu" aria-label="Account">
            <img class="avatar" src="${escapeHtml(currentUser.avatar || '')}" alt="" onerror="this.style.display='none'" />
            <div class="user-info">
              <span class="name">${escapeHtml(currentUser.name || 'User')}</span>
              <span class="usage">${used} / ${limit}</span>
            </div>
          </a>
        `;
      } else {
        el.innerHTML = `<a href="/login" class="btn btn-primary btn-sm">Login</a>`;
      }
    });
  }

  // ---------- Manifest ----------
  async function loadManifest() {
    try {
      const res = await fetch(`${API_BASE}/api-manifest.json`);
      if (!res.ok) throw new Error('Failed');
      manifest = await res.json();
      return manifest;
    } catch (e) {
      console.error('Unable to load API catalog');
      return [];
    }
  }

  function getCategories() {
    const set = new Set(manifest.map((a) => a.category));
    return Array.from(set).sort();
  }

  // ---------- Homepage ----------
  function renderStats() {
    const total = manifest.length;
    const cats = getCategories().length;
    const el = document.getElementById('stats-grid');
    if (!el) return;
    el.innerHTML = `
      <div class="stat-card"><div class="value">${total}</div><div class="label">Total API</div></div>
      <div class="stat-card"><div class="value">${total}</div><div class="label">API Online</div></div>
      <div class="stat-card"><div class="value">${cats}</div><div class="label">Categories</div></div>
      <div class="stat-card"><div class="value">&lt;100ms</div><div class="label">Response</div></div>
    `;
  }

  function renderApiCards(filterCategory = 'All', query = '') {
    const grid = document.getElementById('api-grid');
    if (!grid) return;

    let list = manifest;
    if (filterCategory && filterCategory !== 'All') {
      list = list.filter((a) => a.category === filterCategory);
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.endpoint.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          (a.parameters || []).some((p) => p.name.toLowerCase().includes(q))
      );
    }

    if (!list.length) {
      grid.innerHTML = `<p style="color:var(--text-dim);grid-column:1/-1;padding:2rem;text-align:center;">No APIs found.</p>`;
      return;
    }

    grid.innerHTML = list
      .map(
        (api) => `
      <article class="api-card">
        <div class="api-card-top">
          <h3>${escapeHtml(api.name)}</h3>
          <span class="method-badge ${api.method}">${api.method}</span>
        </div>
        <p>${escapeHtml(api.description)}</p>
        <div class="endpoint">${escapeHtml(api.endpoint)}</div>
        <div class="api-card-actions">
          <a href="/docs#${slug(api.endpoint)}" class="btn btn-primary btn-sm">Try API</a>
          <a href="/docs#${slug(api.endpoint)}" class="btn btn-ghost btn-sm">Docs</a>
        </div>
      </article>
    `
      )
      .join('');
  }

  function renderFilters() {
    const el = document.getElementById('api-filters');
    if (!el) return;
    const cats = ['All', ...getCategories()];
    el.innerHTML = cats
      .map(
        (c, i) =>
          `<button type="button" class="filter-btn${i === 0 ? ' active' : ''}" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`
      )
      .join('');

    el.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        el.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const q = document.getElementById('api-search')?.value || '';
        renderApiCards(btn.dataset.category, q);
      });
    });
  }

  // ---------- Docs ----------
  function renderDocsSidebar() {
    const el = document.getElementById('docs-sidebar');
    if (!el) return;
    const byCat = {};
    manifest.forEach((a) => {
      if (!byCat[a.category]) byCat[a.category] = [];
      byCat[a.category].push(a);
    });

    let html = '';
    Object.keys(byCat)
      .sort()
      .forEach((cat) => {
        html += `<h4>${escapeHtml(cat)}</h4>`;
        byCat[cat].forEach((api) => {
          html += `<a href="#${slug(api.endpoint)}" data-endpoint="${escapeHtml(api.endpoint)}">${escapeHtml(api.name)}</a>`;
        });
      });
    el.innerHTML = html || '<p style="color:var(--text-dim);font-size:0.85rem;">No APIs</p>';
  }

  function renderDocsContent() {
    const el = document.getElementById('docs-content');
    if (!el) return;

    if (!manifest.length) {
      el.innerHTML = `<div class="doc-block"><p style="color:var(--text-dim);">Unable to load API catalog. Please try again.</p></div>`;
      return;
    }

    el.innerHTML = manifest
      .map((api) => {
        const paramsRows =
          (api.parameters || [])
            .map(
              (p) => `
          <tr>
            <td><code>${escapeHtml(p.name)}</code>${p.required ? ' <span class="required-badge">required</span>' : ''}</td>
            <td>${escapeHtml(p.type)}</td>
            <td>${escapeHtml(p.example || '—')}</td>
          </tr>
        `
            )
            .join('') ||
          '<tr><td colspan="3" style="color:var(--text-dim);">No parameters</td></tr>';

        const exampleQuery = (api.parameters || [])
          .filter((p) => p.required || p.example)
          .map((p) => `${p.name}=${encodeURIComponent(p.example || '')}`)
          .join('&');

        return `
        <article class="doc-block" id="${slug(api.endpoint)}">
          <h2>${escapeHtml(api.name)}</h2>
          <p style="color:var(--text-muted);margin-bottom:0.5rem;">${escapeHtml(api.description)}</p>
          <div class="meta-row">
            <span class="method-badge ${api.method}">${api.method}</span>
            <span>${escapeHtml(api.category)}</span>
          </div>
          <div class="endpoint-row">
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(api.endpoint)}</span>
            <button type="button" class="btn btn-ghost btn-sm copy-btn" data-copy="${escapeHtml(api.endpoint)}">Copy</button>
          </div>
          <h3 style="font-size:0.9rem;margin-bottom:0.5rem;">Parameters</h3>
          <table class="params-table">
            <thead><tr><th>Name</th><th>Type</th><th>Example</th></tr></thead>
            <tbody>${paramsRows}</tbody>
          </table>
          <h3 style="font-size:0.9rem;margin:1rem 0 0.5rem;">Example Request</h3>
          <pre style="background:var(--bg);padding:0.75rem;border-radius:8px;font-family:var(--mono);font-size:0.8rem;overflow-x:auto;color:var(--text-muted);">curl "${escapeHtml(api.endpoint)}${exampleQuery ? '?' + exampleQuery : ''}"</pre>
          <div class="try-panel" data-api-endpoint="${escapeHtml(api.endpoint)}" data-api-method="${api.method}">
            <h3>Try Request</h3>
            <div class="form-group">
              <label>Method</label>
              <input type="text" value="${api.method}" readonly />
            </div>
            <div class="form-group">
              <label>Endpoint</label>
              <input type="text" value="${escapeHtml(api.endpoint)}" readonly />
            </div>
            <div class="params-fields">
              ${(api.parameters || [])
                .map(
                  (p) => `
                <div class="form-group">
                  <label for="param-${slug(api.endpoint)}-${p.name}">${escapeHtml(p.name)}${p.required ? ' *' : ''}</label>
                  <input type="${p.type === 'number' ? 'number' : 'text'}" id="param-${slug(api.endpoint)}-${p.name}" name="${escapeHtml(p.name)}" placeholder="${escapeHtml(p.example || p.name)}" data-required="${p.required ? '1' : '0'}" />
                </div>
              `
                )
                .join('')}
            </div>
            <button type="button" class="btn btn-primary send-request-btn">Send Request</button>
            <div class="response-area"></div>
          </div>
        </article>
      `;
      })
      .join('');

    // Copy buttons
    el.querySelectorAll('.copy-btn').forEach((btn) => {
      btn.addEventListener('click', () => copyText(btn.dataset.copy, btn));
    });

    // Send request
    el.querySelectorAll('.send-request-btn').forEach((btn) => {
      btn.addEventListener('click', () => handleSendRequest(btn));
    });

    // Highlight active sidebar
    const hash = window.location.hash.slice(1);
    if (hash) {
      const target = document.getElementById(hash);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async function handleSendRequest(btn) {
    const panel = btn.closest('.try-panel');
    const responseArea = panel.querySelector('.response-area');

    if (!currentUser) {
      responseArea.innerHTML = `
        <div class="auth-required">
          <h3>Authentication Required</h3>
          <p>Sign in to use SamApi APIs.</p>
          <div class="auth-buttons">
            <a href="/api/auth/google" class="oauth-btn">Continue with Google</a>
            <a href="/api/auth/github" class="oauth-btn">Continue with GitHub</a>
            <a href="/api/auth/facebook" class="oauth-btn">Continue with Facebook</a>
          </div>
        </div>
      `;
      return;
    }

    const endpoint = panel.dataset.apiEndpoint;
    const method = panel.dataset.apiMethod || 'GET';
    const inputs = panel.querySelectorAll('.params-fields input');
    const params = {};
    let missing = false;

    inputs.forEach((input) => {
      if (input.dataset.required === '1' && !input.value.trim()) {
        missing = true;
        input.style.borderColor = 'var(--danger)';
      } else {
        input.style.borderColor = '';
        if (input.value.trim()) params[input.name] = input.value.trim();
      }
    });

    if (missing) {
      responseArea.innerHTML = `<p style="color:var(--danger);margin-top:1rem;font-size:0.9rem;">Please fill required parameters.</p>`;
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending...';
    responseArea.innerHTML = '';

    const start = performance.now();
    try {
      let url = endpoint;
      let options = {
        method,
        credentials: 'include',
        headers: {}
      };

      if (method === 'GET') {
        const qs = new URLSearchParams(params).toString();
        if (qs) url += '?' + qs;
      } else {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(params);
      }

      const res = await fetch(url, options);
      const ms = Math.round(performance.now() - start);
      let body;
      const text = await res.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }

      // Refresh user usage if present
      if (body && body.usage) {
        if (currentUser) {
          currentUser.usage = body.usage.used;
          currentUser.remaining = body.usage.remaining;
          currentUser.limit = body.usage.limit;
          renderNavUser();
        }
      }

      const statusClass = res.ok ? 'status-ok' : 'status-err';
      const pretty = typeof body === 'object' ? JSON.stringify(body, null, 2) : String(body);

      responseArea.innerHTML = `
        <div class="response-viewer">
          <div class="response-header">
            <span class="${statusClass}">${res.status} ${res.statusText}</span>
            <span style="color:var(--text-dim);">${ms} ms</span>
            <div class="response-tabs">
              <button type="button" class="active">Body</button>
            </div>
            <button type="button" class="btn btn-ghost btn-sm copy-response-btn">Copy Response</button>
          </div>
          <div class="response-body"><pre>${escapeHtml(pretty)}</pre></div>
        </div>
      `;

      responseArea.querySelector('.copy-response-btn')?.addEventListener('click', function () {
        copyText(pretty, this);
      });
    } catch (err) {
      const ms = Math.round(performance.now() - start);
      responseArea.innerHTML = `
        <div class="response-viewer">
          <div class="response-header">
            <span class="status-err">Network Error</span>
            <span style="color:var(--text-dim);">${ms} ms</span>
          </div>
          <div class="response-body"><pre>Unable to connect to SamApi.</pre></div>
        </div>
      `;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Request';
    }
  }

  // ---------- Search Modal ----------
  function openSearchModal() {
    const overlay = document.getElementById('search-modal');
    if (!overlay) return;
    overlay.classList.add('open');
    const input = overlay.querySelector('input');
    if (input) {
      input.value = '';
      input.focus();
      renderSearchResults('');
    }
  }

  function closeSearchModal() {
    document.getElementById('search-modal')?.classList.remove('open');
  }

  function renderSearchResults(query) {
    const container = document.getElementById('search-results');
    if (!container) return;
    const q = (query || '').toLowerCase().trim();
    let list = manifest;
    if (q) {
      list = manifest.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.endpoint.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      );
    }

    if (!list.length) {
      container.innerHTML = `<div class="search-empty">No results found</div>`;
      return;
    }

    container.innerHTML = list
      .slice(0, 12)
      .map(
        (a) => `
      <a class="search-result-item" href="/docs#${slug(a.endpoint)}" onclick="document.getElementById('search-modal').classList.remove('open')">
        <div class="name">${escapeHtml(a.name)}</div>
        <div class="meta">${escapeHtml(a.method)} · ${escapeHtml(a.endpoint)} · ${escapeHtml(a.category)}</div>
      </a>
    `
      )
      .join('');
  }

  // ---------- Account page ----------
  function renderAccount() {
    const el = document.getElementById('account-content');
    if (!el) return;

    if (!currentUser) {
      el.innerHTML = `
        <div class="auth-required" style="padding:3rem 1rem;">
          <h3>Authentication Required</h3>
          <p>Sign in to view your account.</p>
          <div class="auth-buttons">
            <a href="/login" class="btn btn-primary">Go to Login</a>
          </div>
        </div>
      `;
      return;
    }

    const pct = Math.min(100, Math.round((currentUser.usage / currentUser.limit) * 100));
    let fillClass = '';
    if (pct >= 90) fillClass = 'danger';
    else if (pct >= 70) fillClass = 'warning';

    const remainingText =
      currentUser.remaining === 0
        ? 'Limit reached'
        : `${currentUser.remaining} request${currentUser.remaining === 1 ? '' : 's'} remaining`;

    const created = currentUser.createdAt
      ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : '—';

    el.innerHTML = `
      <div class="account-card">
        <div class="account-header">
          <img class="avatar" src="${escapeHtml(currentUser.avatar || '')}" alt="" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%236366f1%22 width=%2240%22 height=%2240%22/><text x=%2250%%22 y=%2255%%22 fill=%22white%22 font-size=%2218%22 text-anchor=%22middle%22>${escapeHtml((currentUser.name || 'U')[0])}</text></svg>'" />
          <div>
            <h2>${escapeHtml(currentUser.name || 'User')}</h2>
            <div class="email">${escapeHtml(currentUser.email || '—')}</div>
            <div class="provider">Signed in with ${escapeHtml((currentUser.provider || '').charAt(0).toUpperCase() + (currentUser.provider || '').slice(1))}</div>
          </div>
        </div>
        <div class="usage-box">
          <h3>API Usage</h3>
          <div class="usage-numbers">
            <span>${currentUser.usage} / ${currentUser.limit}</span>
            <span>${pct}%</span>
          </div>
          <div class="progress-bar"><div class="fill ${fillClass}" style="width:${pct}%"></div></div>
          <div class="usage-remaining">${remainingText}</div>
        </div>
        <div class="account-meta">Account created: ${created}</div>
        <button type="button" class="btn btn-outline btn-block" id="logout-btn">Logout</button>
      </div>
    `;

    document.getElementById('logout-btn')?.addEventListener('click', logout);
  }

  // ---------- Utils ----------
  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function slug(endpoint) {
    return String(endpoint)
      .replace(/^\//, '')
      .replace(/\//g, '-');
  }

  async function copyText(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✓ Copied';
        setTimeout(() => {
          btn.textContent = orig;
        }, 1500);
      }
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✓ Copied';
        setTimeout(() => {
          btn.textContent = orig;
        }, 1500);
      }
    }
  }

  // ---------- Mobile nav ----------
  function initMobileNav() {
    const btn = document.querySelector('.hamburger');
    const panel = document.querySelector('.mobile-nav');
    if (!btn || !panel) return;
    btn.addEventListener('click', () => {
      panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', panel.classList.contains('open'));
    });
  }

  // ---------- Notifications ----------
  async function loadNotifications() {
    try {
      const res = await fetch('/notifications.json');
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) return;
      const bar = document.getElementById('notification-bar');
      if (!bar) return;
      const n = data[0];
      bar.innerHTML = `<strong>${escapeHtml(n.title || '')}</strong> ${escapeHtml(n.message || '')}`;
      bar.classList.remove('hidden');
    } catch {}
  }

  // ---------- Init ----------
  async function init() {
    initTheme();
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      btn.addEventListener('click', toggleTheme);
    });

    initMobileNav();

    // Search shortcut
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearchModal();
      }
      if (e.key === 'Escape') closeSearchModal();
    });

    document.querySelectorAll('[data-open-search]').forEach((el) => {
      el.addEventListener('click', openSearchModal);
    });

    const searchInput = document.querySelector('#search-modal input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => renderSearchResults(e.target.value));
    }
    document.getElementById('search-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'search-modal') closeSearchModal();
    });

    // Code preview copy
    document.querySelectorAll('[data-copy-code]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const code = btn.closest('.code-preview')?.querySelector('pre')?.textContent || '';
        copyText(code.trim(), btn);
      });
    });

    await Promise.all([fetchUser(), loadManifest()]);
    renderNavUser();
    loadNotifications();

    // Page-specific
    const page = document.body.dataset.page;
    if (page === 'home') {
      renderStats();
      renderFilters();
      renderApiCards();
      const search = document.getElementById('api-search');
      if (search) {
        search.addEventListener('input', () => {
          const cat = document.querySelector('.filter-btn.active')?.dataset.category || 'All';
          renderApiCards(cat, search.value);
        });
      }
    } else if (page === 'docs') {
      renderDocsSidebar();
      renderDocsContent();
    } else if (page === 'account') {
      renderAccount();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.SamApi = { fetchUser, logout, loadManifest, getManifest: () => manifest };
})();
