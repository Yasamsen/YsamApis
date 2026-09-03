// ============ Theme Toggle ============
(function initTheme() {
  const saved = localStorage.getItem("samapi-theme");
  const theme = saved || "dark";
  document.documentElement.setAttribute("data-theme", theme);
  document.addEventListener("DOMContentLoaded", () => {
    const icon = document.getElementById("themeIcon");
    if (icon) icon.textContent = theme === "dark" ? "🌙" : "☀️";
  });
})();

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("samapi-theme", next);
  const icon = document.getElementById("themeIcon");
  if (icon) icon.textContent = next === "dark" ? "🌙" : "☀️";
}

// ============ Toast ============
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

function copyText(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => showToast("Berhasil disalin ✔"))
    .catch(() => showToast("Gagal menyalin"));
}

// ============ Status Check ============
async function checkStatus() {
  const dot = document.getElementById("statusDot");
  const text = document.getElementById("statusText");
  const dot500 = document.getElementById("statusDot500");
  const text500 = document.getElementById("statusText500");

  try {
    const start = performance.now();
    const res = await fetch("/api/status");
    const elapsed = Math.round(performance.now() - start);
    if (!res.ok) throw new Error("offline");
    const data = await res.json();

    if (dot && text) {
      dot.classList.remove("dot-red");
      text.textContent = "Online";
    }
    if (dot500 && text500) {
      text500.textContent = "API kembali online.";
    }

    const statResponse = document.getElementById("statResponse");
    if (statResponse) statResponse.textContent = elapsed + "ms";

    const statOnline = document.getElementById("statOnline");
    if (statOnline) statOnline.textContent = data.total_endpoints ?? "-";

    return data;
  } catch (e) {
    if (dot && text) {
      dot.classList.add("dot-red");
      text.textContent = "Offline";
    }
    if (dot500 && text500) {
      text500.textContent = "API masih belum merespons.";
    }
    return null;
  }
}

// ============ Fetch API List ============
async function fetchApiList() {
  try {
    const res = await fetch("/api");
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    return [];
  }
}

// ============ Homepage Rendering ============
function methodBadge(method) {
  return `<span class="method-badge method-${method}">${method}</span>`;
}

function renderEndpointCards(apis, container) {
  if (!apis.length) {
    container.innerHTML = `<div class="loading-card">Tidak ada endpoint ditemukan.</div>`;
    return;
  }
  container.innerHTML = apis
    .map(
      (api) => `
    <div class="endpoint-card" data-name="${api.name.toLowerCase()}" data-cat="${(api.category || "").toLowerCase()}">
      <div class="card-top">
        <div>
          <div class="card-cat">${api.category || "General"}</div>
          <div class="card-title">${api.name}</div>
        </div>
        ${methodBadge(api.method)}
      </div>
      <div class="card-desc">${api.description || ""}</div>
      <div class="card-endpoint">
        <span>${api.endpoint}</span>
        <button class="icon-btn" onclick="copyText('${location.origin}${api.endpoint}')" title="Copy endpoint">📋</button>
      </div>
      <a href="/docs.html#${slugify(api.name)}" class="btn btn-outline" style="justify-content:center;">Lihat Detail</a>
    </div>
  `
    )
    .join("");
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function renderCategoryTabs(apis, tabsContainer, onSelect) {
  const cats = ["All", ...new Set(apis.map((a) => a.category || "General"))];
  tabsContainer.innerHTML = cats
    .map(
      (c, i) =>
        `<button class="tab-btn ${i === 0 ? "active" : ""}" data-cat="${c}">${c}</button>`
    )
    .join("");

  tabsContainer.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      tabsContainer.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      onSelect(btn.dataset.cat);
    });
  });
}

async function initHomepage() {
  const grid = document.getElementById("endpointGrid");
  const tabsContainer = document.getElementById("categoryTabs");
  const searchInput = document.getElementById("searchInput");
  if (!grid) return;

  const apis = await fetchApiList();

  const statTotal = document.getElementById("statTotal");
  if (statTotal) statTotal.textContent = apis.length;

  renderEndpointCards(apis, grid);
  renderCategoryTabs(apis, tabsContainer, (cat) => {
    const filtered =
      cat === "All" ? apis : apis.filter((a) => (a.category || "General") === cat);
    renderEndpointCards(filtered, grid);
  });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.toLowerCase();
      const filtered = apis.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.endpoint.toLowerCase().includes(q) ||
          (a.category || "").toLowerCase().includes(q)
      );
      renderEndpointCards(filtered, grid);
    });
  }
}

// ============ Docs Page Rendering ============
function renderSidebar(apis, container, onClick) {
  const grouped = {};
  apis.forEach((a) => {
    const cat = a.category || "General";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(a);
  });

  let html = "";
  Object.keys(grouped).forEach((cat) => {
    html += `<div class="sidebar-cat-title">${cat}</div>`;
    grouped[cat].forEach((api) => {
      html += `
        <div class="sidebar-item" data-slug="${slugify(api.name)}">
          <span class="mini-badge method-${api.method}">${api.method}</span>
          <span>${api.name}</span>
        </div>`;
    });
  });

  container.innerHTML = html || `<div class="loading-card small">Tidak ada API.</div>`;

  container.querySelectorAll(".sidebar-item").forEach((item) => {
    item.addEventListener("click", () => {
      const target = document.getElementById(item.dataset.slug);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderDocCards(apis, container) {
  if (!apis.length) {
    container.innerHTML = `<div class="loading-card">Tidak ada endpoint untuk ditampilkan.</div>`;
    return;
  }

  container.innerHTML = apis
    .map((api) => {
      const slug = slugify(api.name);
      const paramsRows = (api.params || [])
        .map(
          (p) => `
        <tr>
          <td><code>${p.name}</code></td>
          <td>${p.type || "string"}</td>
          <td>${p.required ? '<span class="required-tag">required</span>' : '<span class="optional-tag">optional</span>'}</td>
          <td>${p.description || "-"}</td>
        </tr>`
        )
        .join("");

      const exampleReq = api.example?.request || api.endpoint;
      const exampleRes = api.example?.response
        ? JSON.stringify(api.example.response, null, 2)
        : "{}";

      return `
      <div class="doc-card" id="${slug}">
        <div class="doc-card-head">
          <h3>${api.name}</h3>
          ${methodBadge(api.method)}
        </div>
        <div class="doc-desc">${api.description || ""}</div>

        <div class="doc-endpoint-row">
          <span class="path">${api.endpoint}</span>
          <button class="icon-btn" onclick="copyText('${location.origin}${api.endpoint}')" title="Copy">📋</button>
        </div>

        ${
          paramsRows
            ? `<div class="doc-section-title">Parameters</div>
        <table class="param-table">
          <thead><tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
          <tbody>${paramsRows}</tbody>
        </table>`
            : ""
        }

        <div class="doc-section-title">Contoh Request</div>
        <div class="code-wrap">
          <pre class="code-block"><code>${exampleReq}</code></pre>
          <button class="code-copy-btn" onclick="copyText('${location.origin}${exampleReq}')">Copy</button>
        </div>

        <div class="doc-section-title">Contoh Response</div>
        <div class="code-wrap">
          <pre class="code-block"><code>${exampleRes}</code></pre>
          <button class="code-copy-btn" onclick='copyText(${JSON.stringify(exampleRes)})'>Copy</button>
        </div>

        <div class="doc-actions">
          <button class="btn btn-primary" onclick="tryApi('${slug}', '${api.endpoint}')">▶ Try API</button>
        </div>
        <div class="try-result" id="try-${slug}">
          <div class="doc-section-title">Hasil</div>
          <pre class="code-block"><code id="try-output-${slug}">-</code></pre>
        </div>
      </div>`;
    })
    .join("");
}

async function tryApi(slug, endpoint) {
  const box = document.getElementById(`try-${slug}`);
  const output = document.getElementById(`try-output-${slug}`);
  if (!box || !output) return;
  box.style.display = "block";
  output.textContent = "Loading...";
  try {
    const res = await fetch(endpoint);
    const json = await res.json();
    output.textContent = JSON.stringify(json, null, 2);
  } catch (e) {
    output.textContent = "Gagal memanggil endpoint: " + e.message;
  }
}
window.tryApi = tryApi;
window.copyText = copyText;

async function initDocsPage() {
  const content = document.getElementById("docsContent");
  const sidebarList = document.getElementById("sidebarList");
  const docSearch = document.getElementById("docSearchInput");
  if (!content) return;

  const apis = await fetchApiList();
  renderDocCards(apis, content);
  renderSidebar(apis, sidebarList);

  if (docSearch) {
    docSearch.addEventListener("input", () => {
      const q = docSearch.value.toLowerCase();
      const filtered = apis.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.endpoint.toLowerCase().includes(q)
      );
      renderDocCards(filtered, content);
      renderSidebar(filtered, sidebarList);
    });
  }

  // scroll ke hash jika ada
  if (location.hash) {
    setTimeout(() => {
      const target = document.querySelector(location.hash);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    }, 300);
  }
}

// ============ Init ============
document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) themeToggle.addEventListener("click", toggleTheme);

  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");
  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", () => mobileMenu.classList.toggle("open"));
  }

  checkStatus();
  initHomepage();
  initDocsPage();
});
