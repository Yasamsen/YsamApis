const $=id=>document.getElementById(id);
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function run(){
 const id=new URLSearchParams(location.search).get("id");
 if(!id){$("detail").innerHTML="<div class='empty'>Link kode tidak lengkap.</div>";return;}
 try{
  const r=await fetch("/api/codes/"+encodeURIComponent(id));const c=await r.json();if(!r.ok)throw new Error(c.error||"Kode tidak ditemukan");
  document.title=c.title+" — CodeVault";
  $("detail").innerHTML=`<div class="detail-head"><span class="lang">${esc(c.language||"text")}</span><h1>${esc(c.title)}</h1><p>${esc(c.description||"")}</p><span class="date">Diperbarui ${new Date(c.updatedAt).toLocaleString("id-ID")}</span></div><div class="code-toolbar"><span>${esc(c.language||"TEXT").toUpperCase()}</span><div class="detail-actions"><button id="copyBtn" class="button primary">Salin kode</button><button id="downloadBtn" class="button ghost">Download</button></div></div><pre><code id="codeText">${esc(c.code)}</code></pre>`;
  $("copyBtn").onclick=async()=>{try{await navigator.clipboard.writeText(c.code);$("copyBtn").textContent="Tersalin ✓";setTimeout(()=>$("copyBtn").textContent="Salin kode",1500);}catch{$("copyBtn").textContent="Gagal menyalin";}};
  $("downloadBtn").onclick=()=>{const blob=new Blob([c.code],{type:"text/plain;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=(c.title||"code").replace(/[^a-z0-9-_]/gi,"_")+"."+(c.language==="javascript"?"js":c.language==="python"?"py":c.language==="html"?"html":c.language==="css"?"css":c.language==="bash"?"sh":"txt");a.click();URL.revokeObjectURL(a.href);};
 }catch(e){$("detail").innerHTML=`<div class="empty">${esc(e.message)}</div>`;}
}
run();
