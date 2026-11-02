const $ = id => document.getElementById(id);
let codes = [];
async function api(path, options = {}) {
  let response;
  try {
    response = await fetch("/api/" + path, {
      credentials: "same-origin",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
  } catch (error) {
    throw new Error("Tidak dapat menghubungi API: " + error.message);
  }

  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(
      `API mengirim respons bukan JSON (HTTP ${response.status}). ` +
      raw.slice(0, 180)
    );
  }

  if (!response.ok) {
    throw new Error(data.error || `API gagal (HTTP ${response.status})`);
  }
  return data;
}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function date(s){return s?new Date(s).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}):""}
function renderList(){
 const q=$("search").value.toLowerCase();
 const filtered=codes.filter(c=>(c.title+" "+c.language+" "+(c.description||"")).toLowerCase().includes(q));
 $("count").textContent=`${filtered.length} kode tersedia`;
 $("codeList").innerHTML=filtered.length?filtered.map(c=>`<article class="code-card" onclick="location.href='/view.html?id=${encodeURIComponent(c.id)}'"><div class="card-top"><span class="lang">${esc(c.language||"text")}</span><span class="date">${date(c.updatedAt)}</span></div><h3>${esc(c.title)}</h3><p>${esc(c.description||"Source code tersimpan di CodeVault.")}</p></article>`).join(""):`<div class="empty">Belum ada kode yang cocok.</div>`;
}
async function load(){try{codes=await api("codes");renderList();}catch(e){$("count").textContent="Gagal memuat";$("codeList").innerHTML=`<div class="empty">${esc(e.message)}<br>Pastikan database sudah dikonfigurasi.</div>`;}}
function open(id){$(id).classList.remove("hidden")}
function close(id){$(id).classList.add("hidden")}
$("search").addEventListener("input",renderList);
$("ownerBtn").onclick=async()=>{try{const me=await api("auth/me");if(me.owner){open("adminModal");renderAdmin();}else open("loginModal");}catch{open("loginModal");}};
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>close(b.dataset.close));
$("loginForm").onsubmit=async e=>{e.preventDefault();$("loginError").textContent="";try{await api("auth/login",{method:"POST",body:JSON.stringify({password:$("adminPassword").value})});$("adminPassword").value="";close("loginModal");open("adminModal");renderAdmin();}catch(err){$("loginError").textContent=err.message;}};
function reset(){ $("codeForm").reset();$("editId").value="";$("formMessage").textContent="";$("saveCode").textContent="Simpan kode";}
$("resetForm").onclick=reset;
$("logoutBtn").onclick=async()=>{await api("auth/logout",{method:"POST"});close("adminModal");reset();};
$("codeForm").onsubmit=async e=>{e.preventDefault();$("formMessage").textContent="Menyimpan...";const id=$("editId").value;const body={title:$("title").value,language:$("language").value,description:$("description").value,code:$("code").value};try{const result=await api(id?`codes/${id}`:"codes",{method:id?"PUT":"POST",body:JSON.stringify(body)});$("formMessage").textContent="Berhasil disimpan.";reset();await load();renderAdmin();if(result.slug)$("formMessage").textContent="Berhasil! Link: "+location.origin+"/view.html?id="+result.slug;}catch(err){$("formMessage").textContent=err.message;}};
function renderAdmin(){$("adminList").innerHTML=codes.length?codes.map(c=>`<div class="admin-row"><div><strong>${esc(c.title)}</strong><br><span>${esc(c.language||"text")} · ${date(c.updatedAt)}</span></div><div><button class="button ghost" onclick="editCode('${c.id}')">Edit</button><button class="button danger" onclick="deleteCode('${c.id}')">Hapus</button></div></div>`).join(""):"<p class='muted'>Belum ada kode.</p>";}
window.editCode=async id=>{try{const c=await api("codes/"+id);$("editId").value=c.id;$("title").value=c.title;$("language").value=c.language;$("description").value=c.description||"";$("code").value=c.code;$("saveCode").textContent="Simpan perubahan";$("formMessage").textContent="Mode edit aktif.";$("codeForm").scrollIntoView({behavior:"smooth"});}catch(e){alert(e.message);}};
window.deleteCode=async id=>{if(!confirm("Hapus kode ini secara permanen?"))return;try{await api("codes/"+id,{method:"DELETE"});await load();renderAdmin();}catch(e){alert(e.message);}};
load();
