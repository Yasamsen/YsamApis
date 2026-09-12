(function () {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    document.getElementById('content').innerHTML = '<p style="color:var(--text-muted)">No file specified</p>';
    return;
  }

  fetch('/api/auth/session', { credentials: 'include' })
    .then((r) => r.json())
    .then((data) => {
      if (!data.authenticated) {
        window.location.href = '/';
        return;
      }
      loadPreview(id);
    })
    .catch(() => { window.location.href = '/'; });

  function loadPreview(fileId) {
    const content = document.getElementById('content');
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.href = `/api/files/download/${fileId}`;

    // We need mime type - fetch via a lightweight approach or just try common types
    // Use the preview endpoint and Content-Type header
    fetch(`/api/files/preview/${fileId}`, { credentials: 'include', method: 'HEAD' })
      .then(async (res) => {
        if (!res.ok) {
          content.innerHTML = '<p style="color:var(--text-muted)">Preview not available</p>';
          return;
        }
        const mime = (res.headers.get('Content-Type') || '').toLowerCase();
        const url = `/api/files/preview/${fileId}`;

        // Try to get filename from Content-Disposition
        const disp = res.headers.get('Content-Disposition') || '';
        const match = disp.match(/filename="?([^"]+)"?/);
        if (match) document.getElementById('fileName').textContent = decodeURIComponent(match[1]);

        if (mime.startsWith('image/')) {
          content.innerHTML = `<img src="${url}" alt="Preview">`;
        } else if (mime.startsWith('video/')) {
          content.innerHTML = `<video src="${url}" controls autoplay></video>`;
        } else if (mime.startsWith('audio/')) {
          content.innerHTML = `<audio src="${url}" controls autoplay style="width:100%;max-width:500px"></audio>`;
        } else if (mime === 'application/pdf') {
          content.innerHTML = `<iframe src="${url}"></iframe>`;
        } else if (mime.startsWith('text/') || mime === 'application/json') {
          const text = await fetch(url, { credentials: 'include' }).then((r) => r.text());
          const pre = document.createElement('pre');
          pre.textContent = text;
          content.innerHTML = '';
          content.appendChild(pre);
        } else {
          content.innerHTML = '<p style="color:var(--text-muted)">Preview not available for this file type.<br><br><a class="btn btn-primary" href="/api/files/download/' + fileId + '">Download</a></p>';
        }
      })
      .catch(() => {
        content.innerHTML = '<p style="color:var(--text-muted)">Failed to load preview</p>';
      });
  }
})();
