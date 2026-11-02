const $ = id => document.getElementById(id);
function esc(s="") {
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
async function fetchJson(url) {
  const response = await fetch(url, { credentials:"same-origin", cache:"no-store" });
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : {}; }
  catch {
    throw new Error(`Server mengirim halaman non-JSON (HTTP ${response.status}). Pastikan deployment terbaru sudah aktif. ${raw.slice(0,100)}`);
  }
  if (!response.ok) throw new Error(data.error || `Gagal memuat kode (HTTP ${response.status}).`);
  return data;
}
async function run() {
  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    $("detail").innerHTML = "<div class='empty'>Link kode tidak lengkap.</div>";
    return;
  }
  try {
    const c = await fetchJson("/api/code?id=" + encodeURIComponent(id));
    document.title = c.title + " — CodeVault";
    $("detail").innerHTML = `
      <div class="detail-head">
        <span class="lang">${esc(c.language || "text")}</span>
        <h1>${esc(c.title)}</h1><p>${esc(c.description || "")}</p>
        <span class="date">Diperbarui ${c.updatedAt ? new Date(c.updatedAt).toLocaleString("id-ID") : "-"}</span>
      </div>
      <div class="code-toolbar"><span>${esc(c.language || "TEXT").toUpperCase()}</span>
        <div class="detail-actions">
          <button id="copyBtn" class="button primary">Salin kode</button>
          <button id="downloadBtn" class="button ghost">Download</button>
        </div>
      </div><pre><code id="codeText">${esc(c.code || "")}</code></pre>`;
    $("copyBtn").onclick = async () => {
      try { await navigator.clipboard.writeText(c.code || ""); $("copyBtn").textContent="Tersalin ✓"; }
      catch { $("copyBtn").textContent="Gagal menyalin"; }
    };
    $("downloadBtn").onclick = () => {
      const blob = new Blob([c.code || ""], {type:"text/plain;charset=utf-8"});
      const a = document.createElement("a");
      const ext = ({javascript:"js",python:"py",html:"html",css:"css",bash:"sh"})[c.language] || "txt";
      a.href = URL.createObjectURL(blob);
      a.download = (c.title || "code").replace(/[^a-z0-9-_]/gi,"_") + "." + ext;
      a.click();
      URL.revokeObjectURL(a.href);
    };
  } catch (e) {
    $("detail").innerHTML = `<div class="empty">${esc(e.message)}</div>`;
  }
}
run();
