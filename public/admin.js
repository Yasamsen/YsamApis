mountHeader("admin");
const root=$("#app");let all=[],q="";
const CATS=["Downloader","Scraper","Bot WhatsApp","AI & ML","Canvas","REST API","Utility","Tools"],LANGS=["javascript","typescript","python","bash","html","css","json","php"];
async function boot(){let o=false;try{o=(await api("/api/me")).owner}catch{}o?dash():login()}
function login(){
 root.innerHTML=`<div class="login"><form class="panel" id="lf"><div class="lock">${I.lock}</div><h2>Masuk sebagai owner</h2><p>Halaman ini hanya untuk pemilik CodeVault.</p>
  <div class="fld"><label for="pw">Password admin</label><input class="in" id="pw" type="password" required autocomplete="current-password" autofocus></div>
  <button class="btn pri big" style="width:100%" id="lb">Masuk</button><p class="err" id="le" role="alert"></p></form></div>`;
 $("#lf").onsubmit=async e=>{e.preventDefault();$("#le").textContent="";$("#lb").disabled=true;
  try{await api("/api/login",{method:"POST",body:JSON.stringify({password:$("#pw").value})});dash()}
  catch(x){$("#le").textContent=x.message;$("#lb").disabled=false;$("#pw").select()}};
}
function dash(){
 root.innerHTML=`<div class="stats" id="stats"></div>
 <div class="abar"><label class="search">${I.search}<input id="aq" type="search" placeholder="Cari judul, kategori, bahasa..." aria-label="Cari"></label><button class="btn pri" id="new">${I.plus}Snippet baru</button><button class="btn" id="out" title="Keluar" aria-label="Keluar">${I.out}</button></div>
 <div class="rows" id="rows"></div>
 <div class="drawer" id="dr" aria-hidden="true"><div class="scrim" data-x></div><form class="sheet" id="f" role="dialog" aria-modal="true" aria-labelledby="dt">
  <div class="sh"><h2 id="dt">Snippet baru</h2><button type="button" class="ib" data-x aria-label="Tutup">${I.x}</button></div>
  <div class="sb"><input type="hidden" id="fid">
   <div class="fld"><label for="ft">Judul</label><input class="in" id="ft" maxlength="120" required placeholder="Contoh: YouTube Music Downloader"></div>
   <div class="g2"><div class="fld"><label for="fc">Kategori</label><input class="in" id="fc" maxlength="40" list="dc" placeholder="Scraper"></div>
   <div class="fld"><label for="fl">Bahasa</label><input class="in" id="fl" maxlength="40" list="dl" placeholder="javascript"></div></div>
   <datalist id="dc">${CATS.map(c=>`<option value="${c}">`).join("")}</datalist><datalist id="dl">${LANGS.map(c=>`<option value="${c}">`).join("")}</datalist>
   <div class="fld"><label for="fi">Perintah install (opsional)</label><input class="in" id="fi" maxlength="200" placeholder="npm i axios cheerio"></div>
   <div class="fld"><label for="fd">Deskripsi (opsional)</label><input class="in" id="fd" maxlength="500" placeholder="Satu atau dua kalimat tentang fungsinya"></div>
   <div class="fld"><label for="fx">Isi kode</label><textarea id="fx" required spellcheck="false" placeholder="Tempel source code di sini..."></textarea><span class="hint" id="cnt"></span></div></div>
  <div class="sf"><button type="button" class="btn" data-x>Batal</button><button class="btn pri big" id="sv">Simpan</button></div></form></div>
 <dialog id="dg"><h3>Hapus snippet?</h3><p id="dp"></p><div class="acts"><button class="btn" value="no" id="dn">Batal</button><button class="btn bad" id="dy">Hapus permanen</button></div></dialog>`;
 $("#aq").oninput=debounce(e=>{q=e.target.value.toLowerCase().trim();rows()});
 $("#new").onclick=()=>edit();$("#out").onclick=async()=>{await api("/api/logout",{method:"POST"}).catch(()=>{});login()};
 $("#f").onsubmit=save;$$("[data-x]").forEach(b=>b.onclick=close);
 $("#fx").oninput=()=>{const v=$("#fx").value;$("#cnt").textContent=`${v.split("\n").length} baris · ${v.length.toLocaleString("id-ID")} karakter`};
 $("#rows").onclick=onRow;refresh();
}
async function refresh(){
 try{all=(await api("/api/codes")).map(norm)}catch(e){$("#rows").innerHTML=`<div class="empty"><b>Gagal memuat</b>${esc(e.message)}</div>`;return}
 const st=[[I.code,"Snippet",all.length],[I.eye,"Dilihat",all.reduce((s,c)=>s+c.views,0)],[I.copy,"Disalin",all.reduce((s,c)=>s+c.copies,0)],[I.grid,"Kategori",new Set(all.map(c=>c.category)).size]];
 $("#stats").innerHTML=st.map(([i,l])=>`<div class="stat"><span>${i}${l}</span><b>0</b></div>`).join("");
 $$("#stats b").forEach((b,i)=>countUp(b,st[i][2]));rows();
}
function rows(){
 const l=all.filter(c=>!q||(c.title+" "+c.category+" "+c.language).toLowerCase().includes(q));
 $("#rows").innerHTML=l.length?l.map(c=>`<div class="row" data-id="${esc(c.id)}" data-key="${esc(key(c))}"><div><a class="rt" href="/view.html?id=${encodeURIComponent(key(c))}">${esc(c.title)}</a><div class="badges">${badge(c.category)}${badge(c.language)}</div></div>
  <div class="rmeta"><span>${I.eye}${c.views}</span><span>${I.copy}${c.copies}</span><span>${fmtDate(c.updatedAt)}</span></div>
  <div class="racts"><button class="ib" data-a="link" aria-label="Salin link">${I.link}</button><button class="ib" data-a="edit" aria-label="Edit">${I.edit}</button><button class="ib bad" data-a="del" aria-label="Hapus">${I.trash}</button></div></div>`).join("")
  :`<div class="empty"><b>${all.length?"Tidak ada yang cocok":"Belum ada snippet"}</b>${all.length?"Coba kata kunci lain.":"Klik “Snippet baru” untuk menambahkan yang pertama."}</div>`;
}
async function onRow(e){
 const b=e.target.closest("[data-a]");if(!b)return;const r=b.closest(".row"),id=r.dataset.id,c=all.find(x=>x.id===id);
 if(b.dataset.a==="link")toast(await copyText(`${location.origin}/view.html?id=${r.dataset.key}`)?"Link disalin":"Gagal menyalin",0);
 if(b.dataset.a==="edit")edit(id);
 if(b.dataset.a==="del"){
  $("#dp").textContent=`“${c.title}” akan dihapus dan tidak bisa dikembalikan.`;$("#dg").showModal();
  $("#dn").onclick=()=>$("#dg").close();
  $("#dy").onclick=async()=>{$("#dg").close();try{await api("/api/code?id="+id,{method:"DELETE"});toast("Snippet dihapus",0);refresh()}catch(x){toast(x.message,1)}};
 }
}
async function edit(id){
 $("#f").reset();$("#fid").value="";$("#dt").textContent="Snippet baru";$("#sv").textContent="Simpan";$("#cnt").textContent="";
 const dr=$("#dr");dr.classList.add("on");dr.setAttribute("aria-hidden","false");document.body.style.overflow="hidden";
 if(!id){setTimeout(()=>$("#ft").focus(),280);return}
 $("#dt").textContent="Edit snippet";$("#sv").textContent="Simpan perubahan";$("#sv").disabled=true;
 try{const c=norm(await api("/api/code?id="+id));$("#fid").value=c.id;$("#ft").value=c.title;$("#fc").value=c.category;$("#fl").value=c.language;
  $("#fi").value=c.install||"";$("#fd").value=c.description||"";$("#fx").value=c.code;$("#fx").oninput()}
 catch(x){toast(x.message,1);close()}finally{$("#sv").disabled=false}
}
function close(){const d=$("#dr");d.classList.remove("on");d.setAttribute("aria-hidden","true");document.body.style.overflow=""}
async function save(e){
 e.preventDefault();const id=$("#fid").value,btn=$("#sv");btn.disabled=true;
 const body={title:$("#ft").value,category:$("#fc").value,language:$("#fl").value,install:$("#fi").value,description:$("#fd").value,code:$("#fx").value};
 try{const r=await api(id?"/api/code?id="+id:"/api/codes",{method:id?"PUT":"POST",body:JSON.stringify(body)});
  toast(id?"Perubahan disimpan":"Snippet ditambahkan",0);close();refresh()}
 catch(x){toast(x.message,1)}finally{btn.disabled=false}
}
addEventListener("keydown",e=>{
 if(!$("#dr"))return;
 if(e.key==="Escape"&&$("#dr").classList.contains("on"))close();
 if((e.ctrlKey||e.metaKey)&&e.key==="s"&&$("#dr").classList.contains("on")){e.preventDefault();$("#f").requestSubmit()}
});
boot();
