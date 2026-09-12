(function () {
  let currentFolderId = null; // null = root
  let currentPath = [{ id: null, name: 'Home' }];
  let viewMode = 'grid';
  let sortBy = 'name';
  let sortOrder = 'asc';
  let searchQuery = '';
  let previewFileId = null;

  const fileContainer = document.getElementById('fileContainer');
  const emptyState = document.getElementById('emptyState');
  const breadcrumb = document.getElementById('breadcrumb');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  // Auth check
  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      const data = await res.json();
      if (!data.authenticated) {
        window.location.href = '/';
        return null;
      }
      // If admin lands on /storage, still allow (read-only view)
      document.getElementById('userLabel').textContent = data.user.label || '';
      return data.user;
    } catch {
      window.location.href = '/';
      return null;
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function formatDate(d) {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function getIcon(mimeType, isFolder) {
    if (isFolder) return '📁';
    if (!mimeType) return '📄';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType === 'application/pdf') return '📕';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
    if (mimeType.startsWith('text/') || mimeType === 'application/json') return '📝';
    return '📄';
  }

  function toast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  async function loadContents() {
    fileContainer.innerHTML = '<div style="padding:2rem;color:var(--text-muted)">Loading...</div>';
    emptyState.classList.add('hidden');

    try {
      let folders = [];
      let files = [];

      if (searchQuery) {
        const [fRes, foRes] = await Promise.all([
          fetch(`/api/files/list?search=${encodeURIComponent(searchQuery)}&sort=${sortBy}&order=${sortOrder}`, { credentials: 'include' }),
          fetch(`/api/folders/list?search=${encodeURIComponent(searchQuery)}`, { credentials: 'include' }),
        ]);
        const fData = await fRes.json();
        const foData = await foRes.json();
        if (fData.success) files = fData.files;
        if (foData.success) folders = foData.folders;
      } else {
        const folderParam = currentFolderId || 'root';
        const [fRes, foRes] = await Promise.all([
          fetch(`/api/files/list?folderId=${folderParam}&sort=${sortBy}&order=${sortOrder}`, { credentials: 'include' }),
          fetch(`/api/folders/list?parentId=${folderParam}`, { credentials: 'include' }),
        ]);
        const fData = await fRes.json();
        const foData = await foRes.json();
        if (fData.success) files = fData.files;
        if (foData.success) folders = foData.folders;
      }

      renderItems(folders, files);
    } catch (err) {
      fileContainer.innerHTML = '';
      toast('Failed to load files', 'error');
    }
  }

  function renderItems(folders, files) {
    fileContainer.innerHTML = '';
    fileContainer.className = viewMode === 'grid' ? 'file-grid' : 'file-list';

    if (folders.length === 0 && files.length === 0) {
      emptyState.classList.remove('hidden');
      emptyState.querySelector('p').textContent = searchQuery ? 'No results found' : 'This folder is empty';
      return;
    }
    emptyState.classList.add('hidden');

    folders.forEach((folder) => {
      if (viewMode === 'grid') {
        const card = document.createElement('div');
        card.className = 'file-card';
        card.innerHTML = `
          <div class="icon">📁</div>
          <div class="name" title="${escapeHtml(folder.name)}">${escapeHtml(folder.name)}</div>
          <div class="meta">Folder</div>
        `;
        card.addEventListener('click', () => openFolder(folder.id, folder.name));
        fileContainer.appendChild(card);
      } else {
        const row = document.createElement('div');
        row.className = 'file-row';
        row.innerHTML = `
          <div class="icon">📁</div>
          <div class="info">
            <div class="name">${escapeHtml(folder.name)}</div>
            <div class="meta">Folder · ${formatDate(folder.createdAt)}</div>
          </div>
        `;
        row.addEventListener('click', () => openFolder(folder.id, folder.name));
        fileContainer.appendChild(row);
      }
    });

    files.forEach((file) => {
      const icon = getIcon(file.mimeType, false);
      const sizeStr = formatBytes(file.size);
      const typeStr = (file.mimeType || 'file').split('/').pop().toUpperCase();

      if (viewMode === 'grid') {
        const card = document.createElement('div');
        card.className = 'file-card';
        card.innerHTML = `
          <div class="actions">
            <button class="btn btn-sm btn-secondary" data-action="preview" data-id="${file.id}">Preview</button>
            <button class="btn btn-sm btn-secondary" data-action="download" data-id="${file.id}">Download</button>
          </div>
          <div class="icon">${icon}</div>
          <div class="name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
          <div class="meta">${sizeStr} · ${typeStr}</div>
        `;
        card.querySelectorAll('[data-action]').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleAction(btn.dataset.action, file);
          });
        });
        card.addEventListener('click', () => openPreview(file));
        fileContainer.appendChild(card);
      } else {
        const row = document.createElement('div');
        row.className = 'file-row';
        row.innerHTML = `
          <div class="icon">${icon}</div>
          <div class="info">
            <div class="name">${escapeHtml(file.name)}</div>
            <div class="meta">${sizeStr} · ${typeStr} · ${formatDate(file.createdAt)}</div>
          </div>
          <div class="actions">
            <button class="btn btn-sm btn-secondary" data-action="preview">Preview</button>
            <button class="btn btn-sm btn-secondary" data-action="download">Download</button>
          </div>
        `;
        row.querySelectorAll('[data-action]').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleAction(btn.dataset.action, file);
          });
        });
        row.addEventListener('click', () => openPreview(file));
        fileContainer.appendChild(row);
      }
    });
  }

  function handleAction(action, file) {
    if (action === 'preview') openPreview(file);
    if (action === 'download') downloadFile(file.id, file.name);
  }

  function openFolder(id, name) {
    searchQuery = '';
    searchInput.value = '';
    currentFolderId = id;
    currentPath.push({ id, name });
    updateBreadcrumb();
    loadContents();
  }

  function navigateTo(index) {
    currentPath = currentPath.slice(0, index + 1);
    currentFolderId = currentPath[currentPath.length - 1].id;
    searchQuery = '';
    searchInput.value = '';
    updateBreadcrumb();
    loadContents();
  }

  function updateBreadcrumb() {
    breadcrumb.innerHTML = currentPath
      .map((p, i) => {
        if (i === currentPath.length - 1) {
          return `<span>${escapeHtml(p.name)}</span>`;
        }
        return `<a data-index="${i}">${escapeHtml(p.name)}</a><span class="sep">/</span>`;
      })
      .join('');
    breadcrumb.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => navigateTo(Number(a.dataset.index)));
    });
  }

  function openPreview(file) {
    previewFileId = file.id;
    const modal = document.getElementById('previewModal');
    const body = document.getElementById('previewBody');
    const title = document.getElementById('previewTitle');
    title.textContent = file.name;
    body.innerHTML = '<div class="spinner" style="border-top-color:var(--primary)"></div>';
    modal.classList.add('show');

    const mime = (file.mimeType || '').toLowerCase();
    const url = `/api/files/preview/${file.id}`;

    if (mime.startsWith('image/')) {
      body.innerHTML = `<img src="${url}" alt="${escapeHtml(file.name)}" style="max-width:100%;max-height:70vh;border-radius:8px">`;
    } else if (mime.startsWith('video/')) {
      body.innerHTML = `<video src="${url}" controls autoplay style="max-width:100%;max-height:70vh;border-radius:8px"></video>`;
    } else if (mime.startsWith('audio/')) {
      body.innerHTML = `<audio src="${url}" controls autoplay style="width:100%"></audio>`;
    } else if (mime === 'application/pdf') {
      body.innerHTML = `<iframe src="${url}" style="width:100%;height:70vh;border:none;border-radius:8px"></iframe>`;
    } else if (mime.startsWith('text/') || mime === 'application/json') {
      fetch(url, { credentials: 'include' })
        .then((r) => r.text())
        .then((text) => {
          body.innerHTML = `<pre style="text-align:left;max-height:60vh;overflow:auto;background:var(--bg);padding:1rem;border-radius:8px;font-size:0.85rem;width:100%">${escapeHtml(text)}</pre>`;
        })
        .catch(() => {
          body.innerHTML = '<p>Preview not available</p>';
        });
    } else {
      body.innerHTML = `
        <p style="color:var(--text-muted)">Preview not available for this file type</p>
        <button class="btn btn-primary" onclick="document.getElementById('previewDownload').click()">Download</button>
      `;
    }
  }

  function downloadFile(id, name) {
    const a = document.createElement('a');
    a.href = `/api/files/download/${id}`;
    a.download = name || 'download';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    window.location.href = '/';
  }

  // Event listeners
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('logoutBtnMobile').addEventListener('click', logout);

  document.getElementById('menuToggle').addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('show');
  });
  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
  });

  document.querySelectorAll('.view-toggle button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-toggle button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      viewMode = btn.dataset.view;
      loadContents();
    });
  });

  sortSelect.addEventListener('change', () => {
    const [by, order] = sortSelect.value.split('-');
    sortBy = by;
    sortOrder = order;
    loadContents();
  });

  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = searchInput.value.trim();
      if (searchQuery) {
        currentPath = [{ id: null, name: 'Search' }];
        updateBreadcrumb();
      } else {
        currentPath = [{ id: null, name: 'Home' }];
        currentFolderId = null;
        updateBreadcrumb();
      }
      loadContents();
    }, 300);
  });

  document.getElementById('previewClose').addEventListener('click', () => {
    document.getElementById('previewModal').classList.remove('show');
    document.getElementById('previewBody').innerHTML = '';
  });
  document.getElementById('previewCloseBtn').addEventListener('click', () => {
    document.getElementById('previewModal').classList.remove('show');
    document.getElementById('previewBody').innerHTML = '';
  });
  document.getElementById('previewDownload').addEventListener('click', () => {
    if (previewFileId) downloadFile(previewFileId);
  });

  document.querySelectorAll('.nav-item[data-action="home"], .bottom-nav button[data-action="home"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentFolderId = null;
      currentPath = [{ id: null, name: 'Home' }];
      searchQuery = '';
      searchInput.value = '';
      updateBreadcrumb();
      loadContents();
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('show');
    });
  });

  document.querySelector('.bottom-nav button[data-action="search"]').addEventListener('click', () => {
    searchInput.focus();
  });

  // Init
  checkAuth().then((user) => {
    if (user) {
      updateBreadcrumb();
      loadContents();
    }
  });
})();
