const SORTS={new:["Terbaru",(a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt)],pop:["Terpopuler",(a,b)=>b.views-a.views],copy:["Terbanyak disalin",(a,b)=>b.copies-a.copies],az:["A–Z",(a,b)=>a.title.localeCompare(b.title)]};
const S={q:"",cat:"",lang:"",sort:"new"};
let all=[],firstRender=true;
mountHeader("home");
$("#si").innerHTML=I.search;
$("#sort").innerHTML=Object.entries(SORTS).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join("");
{const p=new URLSearchParams(location.search);S.q=p.get("q")||"";S.cat=p.get("cat")||"";S.lang=p.get("lang")||"";S.sort=SORTS[p.get("sort")]?p.get("sort"):"new";$("#q").value=S.q;$("#sort").value=S.sort}
function syncUrl(){const p=new URLSearchParams();for(const k of["q","cat","lang"])if(S[k])p.set(k,S[k]);if(S.sort!=="new")p.set("sort",S.sort);history.replaceState(null,"",p.toString()?"?"+p:location.pathname)}
function filtered(){
 const words=S.q.toLowerCase().split(/\s+/).filter(Boolean);
 return all.filter(c=>(!S.cat||c.category===S.cat)&&(!S.lang||c.language===S.lang)&&
  words.every(w=>(c.title+" "+c.description+" "+c.language+" "+c.category+" "+(c.install||"")).toLowerCase().includes(w))).sort(SORTS[S.sort][1]);
}
function pills(){
 const cats=[...new Set(all.map(c=>c.category))].sort();
 $("#cats").innerHTML=[["","Semua kategori",all.length],...cats.map(k=>[k,k,all.filter(c=>c.category===k).length])]
  .map(([v,l,n])=>`<button class="pill" data-cat="${esc(v)}" aria-pressed="${S.cat===v}">${esc(l)}<i>${n}</i></button>`).join("");
 const base=S.cat?all.filter(c=>c.category===S.cat):all,langs=[...new Set(base.map(c=>c.language))].sort();
 if(S.lang&&!langs.includes(S.lang))S.lang="";
 $("#langs").innerHTML=[["","Semua bahasa"],...langs.map(l=>[l,l])].map(([v,l])=>`<button class="pill sm" data-lang="${esc(v)}" aria-pressed="${S.lang===v}">${esc(l)}</button>`).join("");
}
const card=(c,i)=>`<article class="card${firstRender?" enter":""}" style="--i:${i}">
 <div class="ctop"><div class="badges">${badge(c.category)}${badge(c.language)}</div><button class="mini" data-code="${esc(key(c))}" aria-label="Salin kode ${esc(c.title)}">${I.copy}<span>Salin</span></button></div>
 <h3><a class="stretch" href="/view.html?id=${encodeURIComponent(key(c))}">${esc(c.title)}</a></h3>
 <p class="desc">${esc(c.description||"Source code tersimpan di CodeVault.")}</p>
 <div class="cmd"><span class="p">${I.term}</span><code>${esc(curlCmd(c))}</code><button class="ib" data-cmd="${esc(curlCmd(c))}" aria-label="Salin perintah curl">${I.copy}</button></div>
 ${c.install?`<div class="inst"><b>$</b> ${esc(c.install)}</div>`:""}
 <div class="cfoot"><span title="Dilihat">${I.eye}${c.views}</span><span title="Disalin">${I.copy}${c.copies}</span><a href="/view.html?id=${encodeURIComponent(key(c))}" tabindex="-1" aria-hidden="true">Lihat kode ›</a></div></article>`;
function render(){
 pills();const list=filtered();syncUrl();
 $("#count").textContent=list.length===all.length?`${all.length} snippet`:`${list.length} dari ${all.length} snippet`;
 $("#grid").innerHTML=list.length?list.map(card).join(""):`<div class="empty"><b>Tidak ada yang cocok</b>Coba kata kunci lain, atau <a href="/" style="color:var(--ac)">reset filter</a>.</div>`;
 firstRender=false;
}
async function load(){
 $("#grid").innerHTML=Array(6).fill('<div class="sk"></div>').join("");
 try{
  all=(await api("/api/codes")).map(norm);
  const chip=(id,ic,n,l)=>{$(id).innerHTML=`${ic}<b>0</b> ${l}`;countUp($(id+" b"),n)};
  chip("#cA",I.code,all.length,"snippet aktif");
  chip("#cB",I.copy,all.reduce((s,c)=>s+c.copies,0),"disalin");
  chip("#cC",I.eye,all.reduce((s,c)=>s+c.views,0),"dilihat");
  render();
 }catch(e){
  $("#count").textContent="Gagal memuat";
  $("#grid").innerHTML=`<div class="empty"><b>Library tidak bisa dimuat</b>${esc(e.message)}<br><button class="btn" style="margin-top:14px" id="retry">Coba lagi</button></div>`;
  $("#retry").onclick=load;
 }
}
$("#q").addEventListener("input",debounce(e=>{S.q=e.target.value.trim();render()}));
$("#sort").onchange=e=>{S.sort=e.target.value;render()};
$("#cats").onclick=e=>{const b=e.target.closest("[data-cat]");if(b){S.cat=b.dataset.cat;render()}};
$("#langs").onclick=e=>{const b=e.target.closest("[data-lang]");if(b){S.lang=b.dataset.lang;render()}};
$("#grid").onclick=async e=>{
 const m=e.target.closest("[data-code]"),k=e.target.closest("[data-cmd]");
 if(k){toast(await copyText(k.dataset.cmd)?"Perintah curl disalin":"Gagal menyalin",0);return}
 if(m){
  const id=m.dataset.code,ok=await copyText(api("/api/code?id="+encodeURIComponent(id)).then(d=>d.code));
  if(ok){track(id,"copy");const c=all.find(x=>key(x)===id);if(c){c.copies++;m.querySelector("span").textContent="Tersalin";m.classList.add("done");
   setTimeout(()=>{m.querySelector("span").textContent="Salin";m.classList.remove("done")},1600)}}
  toast(ok?"Kode disalin":"Gagal menyalin kode",!ok);
 }
};
addEventListener("keydown",e=>{if(e.key==="/"&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)){e.preventDefault();$("#q").focus()}});
load();
