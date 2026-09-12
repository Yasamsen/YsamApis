(function () {
  let currentFolderId = null;
  let currentPath = [{ id: null, name: 'Home' }];
  let viewMode = 'grid';
  let sortBy = 'name';
  let sortOrder = 'asc';
  let searchQuery = '';
  let previewFileId = null;
  let renameTarget = null;
  let deleteTarget = null;

  // Auth
  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      const data = await res.json();
      if (!data.authenticated || data.user.role !== 'admin') {
        window.location.href = data.authenticated ? '/storage' : '/';
        return null;
      }
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
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
    const c = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function openModal(id) {
    document.getElementById(id).classList.add('show');
  }

  function closeModal(id) {
    document.getElementById(id).classList.remove('show');
  }

  // Sections
  function showSection(name) {
    document.querySelectorAll('.admin-section').forEach((s) => s.classList.remove('active'));
    document.querySelectorAll('.nav-item[data-section]').forEach((n) => n.classList.remove('active'));
    const section = document.getElementById('section-' + name);
    if (section) section.classList.add('active');
    const nav = document.querySelector(`.nav-item[data-section="${name}"]`);
    if (nav) nav.classList.add('active');

    document.getElementById('filesSearchBox').style.display = name === 'files' ? '' : 'none';

    if (name === 'dashboard' || name === 'storage') loadStats();
    if (name === 'files') loadContents();
    if (name === 'keys') loadKeys();
  }

  // Stats
  async function loadStats() {
    try {
      const res = await fetch('/api/admin/stats', { credentials: 'include' });
      const data = await res.json();
      if (!data.success) return;

      const s = data.storage;
      const percent = s.percentUsed;

      // Dashboard
      document.getElementById('dashUsed').textContent = `${s.usedFormatted} used`;
      document.getElementById('dashPercent').textContent = `${percent}%`;
      document.getElementById('dashAvailable').textContent = s.availableFormatted;
      document.getElementById('dashLimit').textContent = s.limitFormatted;
      const be = document.getElementById('dashBackend');
      if (be) be.textContent = (s.backend || 'local').toUpperCase();
      const bar = document.getElementById('dashBar');
      bar.style.width = Math.min(100, percent) + '%';
      bar.className = 'storage-bar' + (percent >= 90 ? ' critical' : percent >= 80 ? ' warning' : '');

      const warn = document.getElementById('dashWarning');
      if (data.warning) {
        warn.textContent = (data.warning.level === 'full' ? '🛑 ' : '⚠️ ') + data.warning.message;
        warn.className = 'storage-warning show ' + data.warning.level;
      } else {
        warn.className = 'storage-warning';
      }

      document.getElementById('statFiles').textContent = data.files.total;
      document.getElementById('statFolders').textContent = data.folders.total;
      document.getElementById('statActiveKeys').textContent = data.keys.active;
      document.getElementById('statDisabledKeys').textContent = data.keys.disabled;
      document.getElementById('statLargest').textContent = data.files.largest
        ? `${data.files.largest.name} (${data.files.largest.sizeFormatted})`
        : '—';

      // Storage section
      document.getElementById('stUsed').textContent = s.usedFormatted;
      document.getElementById('stPercent').textContent = `${percent}% used`;
      document.getElementById('stAvailable').textContent = s.availableFormatted;
      document.getElementById('stLimit').textContent = s.limitFormatted;
      const be2 = document.getElementById('stBackend');
      if (be2) be2.textContent = (s.backend || 'local').toUpperCase();
      const stBar = document.getElementById('stBar');
      stBar.style.width = Math.min(100, percent) + '%';
      stBar.className = 'storage-bar' + (percent >= 90 ? ' critical' : percent >= 80 ? ' warning' : '');

      const stWarn = document.getElementById('stWarning');
      if (data.warning) {
        stWarn.textContent = (data.warning.level === 'full' ? '🛑 ' : '⚠️ ') + data.warning.message;
        stWarn.className = 'storage-warning show ' + data.warning.level;
      } else {
        stWarn.className = 'storage-warning';
      }

      document.getElementById('stFiles').textContent = data.files.total;
      document.getElementById('stFolders').textContent = data.folders.total;
      document.getElementById('stLargest').textContent = data.files.largest
        ? `${data.files.largest.name} (${data.files.largest.sizeFormatted})`
        : '—';
    } catch (err) {
      toast('Failed to load stats', 'error');
    }
  }

  // Files
  async function loadContents() {
    const container = document.getElementById('fileContainer');
    const empty = document.getElementById('emptyState');
    container.innerHTML = '<div style="padding:2rem;color:var(--text-muted)">Loading...</div>';
    empty.classList.add('hidden');

    try {
      let folders = [];
      let files = [];
      if (searchQuery) {
        const [fRes, foRes] = await Promise.all([
          fetch(`/api/files/list?search=${encodeURIComponent(searchQuery)}&sort=${sortBy}&order=${sortOrder}`, { credentials: 'include' }),
          fetch(`/api/folders/list?search=${encodeURIComponent(searchQuery)}`, { credentials: 'include' }),
        ]);
        const fD = await fRes.json();
        const foD = await foRes.json();
        if (fD.success) files = fD.files;
        if (foD.success) folders = foD.folders;
      } else {
        const p = currentFolderId || 'root';
        const [fRes, foRes] = await Promise.all([
          fetch(`/api/files/list?folderId=${p}&sort=${sortBy}&order=${sortOrder}`, { credentials: 'include' }),
          fetch(`/api/folders/list?parentId=${p}`, { credentials: 'include' }),
        ]);
        const fD = await fRes.json();
        const foD = await foRes.json();
        if (fD.success) files = fD.files;
        if (foD.success) folders = foD.folders;
      }
      renderItems(folders, files);
    } catch {
      container.innerHTML = '';
      toast('Failed to load files', 'error');
    }
  }

  function renderItems(folders, files) {
    const container = document.getElementById('fileContainer');
    const empty = document.getElementById('emptyState');
    container.innerHTML = '';
    container.className = viewMode === 'grid' ? 'file-grid' : 'file-list';

    if (!folders.length && !files.length) {
      empty.classList.remove('hidden');
      empty.querySelector('p').textContent = searchQuery ? 'No results found' : 'This folder is empty';
      return;
    }
    empty.classList.add('hidden');

    folders.forEach((folder) => {
      if (viewMode === 'grid') {
        const card = document.createElement('div');
        card.className = 'file-card';
        card.innerHTML = `
          <div class="actions">
            <button class="btn btn-sm btn-secondary" data-act="rename-folder">Rename</button>
            <button class="btn btn-sm btn-danger" data-act="delete-folder">Delete</button>
          </div>
          <div class="icon">📁</div>
          <div class="name">${escapeHtml(folder.name)}</div>
          <div class="meta">Folder</div>
        `;
        card.querySelector('[data-act="rename-folder"]').onclick = (e) => { e.stopPropagation(); startRename('folder', folder); };
        card.querySelector('[data-act="delete-folder"]').onclick = (e) => { e.stopPropagation(); startDelete('folder', folder); };
        card.onclick = () => openFolder(folder.id, folder.name);
        container.appendChild(card);
      } else {
        const row = document.createElement('div');
        row.className = 'file-row';
        row.innerHTML = `
          <div class="icon">📁</div>
          <div class="info"><div class="name">${escapeHtml(folder.name)}</div><div class="meta">Folder · ${formatDate(folder.createdAt)}</div></div>
          <div class="actions">
            <button class="btn btn-sm btn-secondary" data-act="rename">Rename</button>
            <button class="btn btn-sm btn-danger" data-act="delete">Delete</button>
          </div>
        `;
        row.querySelector('[data-act="rename"]').onclick = (e) => { e.stopPropagation(); startRename('folder', folder); };
        row.querySelector('[data-act="delete"]').onclick = (e) => { e.stopPropagation(); startDelete('folder', folder); };
        row.onclick = () => openFolder(folder.id, folder.name);
        container.appendChild(row);
      }
    });

    files.forEach((file) => {
      const icon = getIcon(file.mimeType);
      const sizeStr = formatBytes(file.size);
      const typeStr = (file.mimeType || 'file').split('/').pop().toUpperCase();

      if (viewMode === 'grid') {
        const card = document.createElement('div');
        card.className = 'file-card';
        card.innerHTML = `
          <div class="actions">
            <button class="btn btn-sm btn-secondary" data-act="preview">Preview</button>
            <button class="btn btn-sm btn-secondary" data-act="download">Download</button>
            <button class="btn btn-sm btn-secondary" data-act="rename">Rename</button>
            <button class="btn btn-sm btn-danger" data-act="delete">Delete</button>
          </div>
          <div class="icon">${icon}</div>
          <div class="name">${escapeHtml(file.name)}</div>
          <div class="meta">${sizeStr} · ${typeStr}</div>
        `;
        card.querySelector('[data-act="preview"]').onclick = (e) => { e.stopPropagation(); openPreview(file); };
        card.querySelector('[data-act="download"]').onclick = (e) => { e.stopPropagation(); downloadFile(file.id, file.name); };
        card.querySelector('[data-act="rename"]').onclick = (e) => { e.stopPropagation(); startRename('file', file); };
        card.querySelector('[data-act="delete"]').onclick = (e) => { e.stopPropagation(); startDelete('file', file); };
        card.onclick = () => openPreview(file);
        container.appendChild(card);
      } else {
        const row = document.createElement('div');
        row.className = 'file-row';
        row.innerHTML = `
          <div class="icon">${icon}</div>
          <div class="info"><div class="name">${escapeHtml(file.name)}</div><div class="meta">${sizeStr} · ${typeStr} · ${formatDate(file.createdAt)}</div></div>
          <div class="actions">
            <button class="btn btn-sm btn-secondary" data-act="preview">Preview</button>
            <button class="btn btn-sm btn-secondary" data-act="download">DL</button>
            <button class="btn btn-sm btn-secondary" data-act="rename">Rename</button>
            <button class="btn btn-sm btn-danger" data-act="delete">Del</button>
          </div>
        `;
        row.querySelector('[data-act="preview"]').onclick = (e) => { e.stopPropagation(); openPreview(file); };
        row.querySelector('[data-act="download"]').onclick = (e) => { e.stopPropagation(); downloadFile(file.id, file.name); };
        row.querySelector('[data-act="rename"]').onclick = (e) => { e.stopPropagation(); startRename('file', file); };
        row.querySelector('[data-act="delete"]').onclick = (e) => { e.stopPropagation(); startDelete('file', file); };
        row.onclick = () => openPreview(file);
        container.appendChild(row);
      }
    });
  }

  function openFolder(id, name) {
    searchQuery = '';
    document.getElementById('searchInput').value = '';
    currentFolderId = id;
    currentPath.push({ id, name });
    updateBreadcrumb();
    loadContents();
  }

  function navigateTo(index) {
    currentPath = currentPath.slice(0, index + 1);
    currentFolderId = currentPath[currentPath.length - 1].id;
    searchQuery = '';
    document.getElementById('searchInput').value = '';
    updateBreadcrumb();
    loadContents();
  }

  function updateBreadcrumb() {
    const el = document.getElementById('breadcrumb');
    el.innerHTML = currentPath.map((p, i) => {
      if (i === currentPath.length - 1) return `<span>${escapeHtml(p.name)}</span>`;
      return `<a data-index="${i}">${escapeHtml(p.name)}</a><span class="sep">/</span>`;
    }).join('');
    el.querySelectorAll('a').forEach((a) => {
      a.onclick = () => navigateTo(Number(a.dataset.index));
    });
  }

  // Upload
  async function uploadFiles(fileList) {
    if (!fileList || !fileList.length) return;
    for (const file of fileList) {
      const form = new FormData();
      form.append('file', file);
      if (currentFolderId) form.append('folderId', currentFolderId);

      try {
        const res = await fetch('/api/files/upload', {
          method: 'POST',
          credentials: 'include',
          body: form,
        });
        const data = await res.json();
        if (data.success) {
          toast(`Uploaded: ${file.name}`);
        } else {
          toast(data.message || data.error || 'Upload failed', 'error');
        }
      } catch {
        toast(`Failed to upload ${file.name}`, 'error');
      }
    }
    loadContents();
    loadStats();
  }

  // Rename
  function startRename(type, item) {
    renameTarget = { type, item };
    document.getElementById('renameTitle').textContent = type === 'folder' ? 'Rename Folder' : 'Rename File';
    document.getElementById('renameInput').value = item.name;
    openModal('renameModal');
    document.getElementById('renameInput').focus();
  }

  async function confirmRename() {
    if (!renameTarget) return;
    const name = document.getElementById('renameInput').value.trim();
    if (!name) return toast('Name is required', 'error');

    const { type, item } = renameTarget;
    const url = type === 'folder' ? `/api/folders/rename/${item.id}` : `/api/files/rename/${item.id}`;
    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.success) {
        toast('Renamed successfully');
        closeModal('renameModal');
        loadContents();
      } else {
        toast(data.message || data.error, 'error');
      }
    } catch {
      toast('Rename failed', 'error');
    }
  }

  // Delete
  function startDelete(type, item) {
    deleteTarget = { type, item };
    document.getElementById('deleteMessage').textContent =
      type === 'folder'
        ? `Delete folder "${item.name}" and all its contents? This cannot be undone.`
        : `Delete file "${item.name}"? This cannot be undone.`;
    openModal('deleteModal');
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const { type, item } = deleteTarget;
    const url = type === 'folder' ? `/api/folders/delete/${item.id}` : `/api/files/delete/${item.id}`;
    try {
      const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        toast('Deleted successfully');
        closeModal('deleteModal');
        loadContents();
        loadStats();
      } else {
        toast(data.message || data.error, 'error');
      }
    } catch {
      toast('Delete failed', 'error');
    }
  }

  // Preview & Download
  function openPreview(file) {
    previewFileId = file.id;
    const body = document.getElementById('previewBody');
    document.getElementById('previewTitle').textContent = file.name;
    body.innerHTML = '<div class="spinner" style="border-top-color:var(--primary)"></div>';
    openModal('previewModal');

    const mime = (file.mimeType || '').toLowerCase();
    const url = `/api/files/preview/${file.id}`;

    if (mime.startsWith('image/')) {
      body.innerHTML = `<img src="${url}" style="max-width:100%;max-height:70vh;border-radius:8px" alt="">`;
    } else if (mime.startsWith('video/')) {
      body.innerHTML = `<video src="${url}" controls autoplay style="max-width:100%;max-height:70vh;border-radius:8px"></video>`;
    } else if (mime.startsWith('audio/')) {
      body.innerHTML = `<audio src="${url}" controls autoplay style="width:100%"></audio>`;
    } else if (mime === 'application/pdf') {
      body.innerHTML = `<iframe src="${url}" style="width:100%;height:70vh;border:none;border-radius:8px"></iframe>`;
    } else if (mime.startsWith('text/') || mime === 'application/json') {
      fetch(url, { credentials: 'include' }).then((r) => r.text()).then((t) => {
        body.innerHTML = `<pre style="text-align:left;max-height:60vh;overflow:auto;background:var(--bg);padding:1rem;border-radius:8px;font-size:0.85rem;width:100%">${escapeHtml(t)}</pre>`;
      }).catch(() => { body.innerHTML = '<p>Preview not available</p>'; });
    } else {
      body.innerHTML = '<p style="color:var(--text-muted)">Preview not available</p>';
    }
  }

  function downloadFile(id, name) {
    const a = document.createElement('a');
    a.href = `/api/files/download/${id}`;
    a.download = name || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Keys
  async function loadKeys() {
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      const data = await res.json();
      if (!data.success) return;

      const tbody = document.getElementById('keysTableBody');
      tbody.innerHTML = '';

      if (!data.keys.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:2rem">No user keys yet</td></tr>';
        return;
      }

      data.keys.forEach((k) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${escapeHtml(k.label)}</strong></td>
          <td><span class="status-badge ${k.status}">${k.status}</span></td>
          <td>${formatDate(k.createdAt)}</td>
          <td>${k.expiresAt ? formatDate(k.expiresAt) : 'Never'}</td>
          <td>${k.lastUsedAt ? formatDate(k.lastUsedAt) : '—'}</td>
          <td class="actions-cell">
            <button class="btn btn-sm btn-secondary" data-act="toggle">${k.status === 'active' ? 'Disable' : 'Enable'}</button>
            <button class="btn btn-sm btn-secondary" data-act="edit">Edit</button>
            <button class="btn btn-sm btn-danger" data-act="delete">Delete</button>
          </td>
        `;
        tr.querySelector('[data-act="toggle"]').onclick = () => toggleKey(k.id);
        tr.querySelector('[data-act="edit"]').onclick = () => editKey(k);
        tr.querySelector('[data-act="delete"]').onclick = () => deleteKey(k.id, k.label);
        tbody.appendChild(tr);
      });
    } catch {
      toast('Failed to load keys', 'error');
    }
  }

  async function toggleKey(id) {
    try {
      const res = await fetch(`/api/admin/toggle-key/${id}`, { method: 'PATCH', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        toast(`Key ${data.key.status}`);
        loadKeys();
        loadStats();
      } else toast(data.error, 'error');
    } catch { toast('Failed', 'error'); }
  }

  function editKey(k) {
    const newLabel = prompt('New label:', k.label);
    if (newLabel === null || newLabel.trim() === '') return;
    fetch(`/api/admin/edit-key/${k.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ label: newLabel.trim() }),
    }).then((r) => r.json()).then((d) => {
      if (d.success) { toast('Updated'); loadKeys(); }
      else toast(d.error, 'error');
    });
  }

  async function deleteKey(id, label) {
    if (!confirm(`Delete key "${label}"? Users with this key will lose access.`)) return;
    try {
      const res = await fetch(`/api/admin/delete-key/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        toast('Key deleted');
        loadKeys();
        loadStats();
      } else toast(data.error, 'error');
    } catch { toast('Failed', 'error'); }
  }

  function generateRandomKey() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const segs = [];
    for (let s = 0; s < 3; s++) {
      let seg = '';
      for (let i = 0; i < 4; i++) seg += chars[Math.floor(Math.random() * chars.length)];
      segs.push(seg);
    }
    return segs.join('-');
  }

  async function createKey() {
    const label = document.getElementById('keyLabel').value.trim();
    if (!label) return toast('Label is required', 'error');

    const customKey = document.getElementById('keyValue').value.trim();
    const expSel = document.getElementById('keyExpiration').value;
    const status = document.getElementById('keyStatus').value;

    let expiresAt = null;
    if (expSel === 'custom') {
      const d = document.getElementById('keyCustomDate').value;
      if (!d) return toast('Select a date', 'error');
      expiresAt = new Date(d).toISOString();
    } else if (expSel !== 'never') {
      const days = parseInt(expSel, 10);
      const d = new Date();
      d.setDate(d.getDate() + days);
      expiresAt = d.toISOString();
    }

    try {
      const res = await fetch('/api/admin/generate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          label,
          key: customKey || undefined,
          expiresAt: expiresAt || 'never',
          status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('keyResult').classList.remove('hidden');
        document.getElementById('keyReveal').textContent = data.key.plainKey;
        document.getElementById('createKeyBtn').textContent = 'Done';
        document.getElementById('createKeyBtn').onclick = () => {
          closeModal('generateKeyModal');
          resetKeyModal();
          loadKeys();
          loadStats();
        };
        toast('Key created — save it now!');
      } else {
        toast(data.message || data.error, 'error');
      }
    } catch {
      toast('Failed to create key', 'error');
    }
  }

  function resetKeyModal() {
    document.getElementById('keyLabel').value = '';
    document.getElementById('keyValue').value = '';
    document.getElementById('keyExpiration').value = 'never';
    document.getElementById('keyCustomDate').classList.add('hidden');
    document.getElementById('keyStatus').value = 'active';
    document.getElementById('keyResult').classList.add('hidden');
    document.getElementById('keyReveal').textContent = '';
    document.getElementById('createKeyBtn').textContent = 'Create Key';
    document.getElementById('createKeyBtn').onclick = createKey;
  }

  // Create folder
  async function createFolder() {
    const name = document.getElementById('folderNameInput').value.trim();
    if (!name) return toast('Name required', 'error');
    try {
      const res = await fetch('/api/folders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, parentId: currentFolderId }),
      });
      const data = await res.json();
      if (data.success) {
        toast('Folder created');
        closeModal('folderModal');
        document.getElementById('folderNameInput').value = '';
        loadContents();
        loadStats();
      } else toast(data.message || data.error, 'error');
    } catch { toast('Failed', 'error'); }
  }

  async function logout() {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    window.location.href = '/';
  }

  // Event bindings
  document.getElementById('logoutBtn').onclick = logout;
  document.getElementById('menuToggle').onclick = () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('show');
  };
  document.getElementById('sidebarOverlay').onclick = () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
  };

  document.querySelectorAll('.nav-item[data-section]').forEach((btn) => {
    btn.onclick = () => {
      showSection(btn.dataset.section);
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebarOverlay').classList.remove('show');
    };
  });

  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.onclick = () => closeModal(btn.dataset.close);
  });

  document.getElementById('generateKeyBtn').onclick = () => {
    resetKeyModal();
    openModal('generateKeyModal');
  };
  document.getElementById('createKeyBtn').onclick = createKey;
  document.getElementById('autoGenKeyBtn').onclick = () => {
    document.getElementById('keyValue').value = generateRandomKey();
  };
  document.getElementById('keyExpiration').onchange = (e) => {
    document.getElementById('keyCustomDate').classList.toggle('hidden', e.target.value !== 'custom');
  };

  document.getElementById('createFolderBtn').onclick = () => openModal('folderModal');
  document.getElementById('folderCreateBtn').onclick = createFolder;
  document.getElementById('renameConfirm').onclick = confirmRename;
  document.getElementById('deleteConfirm').onclick = confirmDelete;
  document.getElementById('previewDownload').onclick = () => {
    if (previewFileId) downloadFile(previewFileId);
  };

  // Upload zone
  const zone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  zone.onclick = () => fileInput.click();
  fileInput.onchange = () => uploadFiles(fileInput.files);
  zone.ondragover = (e) => { e.preventDefault(); zone.classList.add('dragover'); };
  zone.ondragleave = () => zone.classList.remove('dragover');
  zone.ondrop = (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    uploadFiles(e.dataTransfer.files);
  };

  document.querySelectorAll('.view-toggle button').forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll('.view-toggle button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      viewMode = btn.dataset.view;
      loadContents();
    };
  });

  document.getElementById('sortSelect').onchange = () => {
    const [by, order] = document.getElementById('sortSelect').value.split('-');
    sortBy = by;
    sortOrder = order;
    loadContents();
  };

  let searchTimeout;
  document.getElementById('searchInput').oninput = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = document.getElementById('searchInput').value.trim();
      if (searchQuery) {
        currentPath = [{ id: null, name: 'Search' }];
      } else {
        currentPath = [{ id: null, name: 'Home' }];
        currentFolderId = null;
      }
      updateBreadcrumb();
      loadContents();
    }, 300);
  };

  // Init
  checkAuth().then((user) => {
    if (user) {
      updateBreadcrumb();
      loadStats();
    }
  });
})();
