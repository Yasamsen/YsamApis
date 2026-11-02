mountHeader("home");
$(".back").insertAdjacentHTML("afterbegin",I.back);
const EXT={javascript:"js",typescript:"ts",python:"py",html:"html",css:"css",bash:"sh",shell:"sh",json:"json",php:"php",java:"java",go:"go",rust:"rs",sql:"sql",text:"txt"};
async function run(){
 const id=new URLSearchParams(location.search).get("id"),box=$("#detail");
 if(!id){box.innerHTML='<div class="empty"><b>Link tidak lengkap</b>Buka kode dari halaman koleksi.</div>';return}
 try{
  const [d,list]=await Promise.all([api("/api/code?id="+encodeURIComponent(id)),api("/api/codes").catch(()=>[])]);
  const c=norm(d);document.title=c.title+" — CodeVault";
  const lines=c.code.split("\n"),numbered=lines.length<=4000;
  box.innerHTML=`<div class="vhead"><div class="badges">${badge(c.category)}${badge(c.language)}</div><h1>${esc(c.title)}</h1>${c.description?`<p>${esc(c.description)}</p>`:""}
   <div class="vstats"><span>${I.eye}<b id="vv">${c.views}</b>&nbsp;dilihat</span><span>${I.copy}<b id="vc">${c.copies}</b>&nbsp;disalin</span><span>${lines.length} baris</span><span>Diperbarui ${fmtDate(c.updatedAt)}</span></div></div>
   <div class="cmds"><div class="cmd"><span class="p">${I.term}</span><code>${esc(curlCmd(c))}</code><button class="ib" data-cmd="${esc(curlCmd(c))}" aria-label="Salin curl">${I.copy}</button></div>
   ${c.install?`<div class="cmd"><span class="p">$</span><code>${esc(c.install)}</code><button class="ib" data-cmd="${esc(c.install)}" aria-label="Salin perintah install">${I.copy}</button></div>`:""}</div>
   <div class="bar"><span class="sp">${esc(c.language)}</span><a class="btn" href="/raw/${encodeURIComponent(key(c))}" target="_blank" rel="noopener">${I.ext}<span>Raw</span></a><button class="btn" id="dl">${I.dl}<span>Unduh</span></button><button class="btn pri" id="cp">${I.copy}<span>Salin kode</span></button></div>
   <div class="codebox"><pre><code>${numbered?lines.map(l=>`<span class="l">${esc(l)||" "}</span>`).join(""):esc(c.code)}</code></pre></div><div id="rel"></div>`;
  const vk="cv_seen_"+c.id;
  if(!sessionStorage.getItem(vk)){sessionStorage.setItem(vk,1);track(id,"view");$("#vv").textContent=c.views+1}
  $("#cp").onclick=async()=>{const ok=await copyText(c.code);toast(ok?"Kode disalin":"Gagal menyalin kode",!ok);
   if(ok){track(id,"copy");$("#vc").textContent=++c.copies;const s=$("#cp span");s.textContent="Tersalin";setTimeout(()=>s.textContent="Salin kode",1600)}};
  $("#dl").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([c.code],{type:"text/plain;charset=utf-8"}));
   a.download=c.title.replace(/[^a-z0-9-_]+/gi,"_").slice(0,60)+"."+(EXT[c.language]||"txt");a.click();URL.revokeObjectURL(a.href)};
  box.onclick=async e=>{const k=e.target.closest("[data-cmd]");if(k)toast(await copyText(k.dataset.cmd)?"Tersalin":"Gagal menyalin",0)};
  const rel=list.map(norm).filter(x=>x.id!==c.id&&x.category===c.category).slice(0,3);
  if(rel.length)$("#rel").innerHTML=`<h2 class="sec">Kode lain di ${esc(c.category)}</h2><div class="grid">${rel.map(r=>`<article class="card"><div class="badges">${badge(r.language)}</div><h3><a class="stretch" href="/view.html?id=${encodeURIComponent(key(r))}">${esc(r.title)}</a></h3><p class="desc">${esc(r.description)}</p></article>`).join("")}</div>`;
 }catch(e){box.innerHTML=`<div class="empty"><b>Kode tidak bisa dibuka</b>${esc(e.message)}</div>`}
}
run();
