const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(s="")=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const svg=d=>`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I={
 copy:svg('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
 eye:svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
 code:svg('<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>'),
 search:svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
 plus:svg('<path d="M12 5v14M5 12h14"/>'),
 edit:svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
 trash:svg('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>'),
 ext:svg('<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'),
 back:svg('<path d="m15 18-6-6 6-6"/>'),
 dl:svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
 check:svg('<path d="M20 6 9 17l-5-5"/>'),
 lock:svg('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
 term:svg('<path d="m4 17 6-6-6-6M12 19h8"/>'),
 x:svg('<path d="M18 6 6 18M6 6l12 12"/>'),
 out:svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
 link:svg('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
 grid:svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>')
};
async function api(path,opt={}){
 let r;try{r=await fetch(path,{credentials:"same-origin",...opt,headers:{"Content-Type":"application/json",...(opt.headers||{})}})}catch(e){throw new Error("Tidak dapat menghubungi server: "+e.message)}
 const raw=await r.text();let d={};
 try{d=raw?JSON.parse(raw):{}}catch{throw new Error(`Server mengirim respons bukan JSON (HTTP ${r.status}). Pastikan deploy terbaru sudah aktif.`)}
 if(!r.ok)throw new Error(d.error||`Permintaan gagal (HTTP ${r.status})`);
 return d;
}
const norm=c=>({...c,category:c.category||"Lainnya",language:c.language||"text",views:c.views||0,copies:c.copies||0});
const key=c=>c.slug||c.id;
const rawUrl=c=>`${location.origin}/raw/${key(c)}`;
const curlCmd=c=>`curl -sL ${rawUrl(c)}`;
const fmtDate=s=>s?new Date(s).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}):"";
const hue=s=>{let h=0;for(const ch of String(s).toLowerCase())h=(h*31+ch.charCodeAt(0))%360;return h};
const badge=t=>`<span class="bd" style="--h:${hue(t)}">${esc(t)}</span>`;
const debounce=(f,ms=160)=>{let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>f(...a),ms)}};
function toast(msg,bad){
 $$(".toast").forEach(t=>t.remove());
 const t=document.createElement("div");t.className="toast"+(bad?" bad":"");t.setAttribute("role","status");
 t.innerHTML=(bad?I.x:I.check)+esc(msg);document.body.append(t);
 setTimeout(()=>{t.classList.add("out");setTimeout(()=>t.remove(),260)},2200);
}
async function copyText(v){
 try{
  if(typeof v!=="string"&&window.ClipboardItem&&navigator.clipboard?.write){
   await navigator.clipboard.write([new ClipboardItem({"text/plain":Promise.resolve(v).then(s=>new Blob([s],{type:"text/plain"}))})]);return true;
  }
  await navigator.clipboard.writeText(await v);return true;
 }catch{
  try{const s=await v,a=document.createElement("textarea");a.value=s;a.style.cssText="position:fixed;opacity:0";document.body.append(a);a.select();const ok=document.execCommand("copy");a.remove();return ok}catch{return false}
 }
}
function track(id,event){fetch(`/api/code?id=${encodeURIComponent(id)}&event=${event}`,{method:"POST",keepalive:true}).catch(()=>{})}
function countUp(el,n){
 if(matchMedia("(prefers-reduced-motion:reduce)").matches||n<2){el.textContent=n.toLocaleString("id-ID");return}
 const t0=performance.now();(function f(t){const p=Math.min((t-t0)/700,1);el.textContent=Math.round(n*(1-Math.pow(1-p,3))).toLocaleString("id-ID");if(p<1)requestAnimationFrame(f)})(t0);
}
function mountHeader(active){
 $("#top").innerHTML=`<div class="wrap"><a class="brand" href="/"><span class="logo">${I.code}</span>Code<span style="color:var(--ac)">Vault</span></a>
 <nav class="nav"><a href="/" ${active==="home"?'aria-current="page"':""}>${I.grid}<span>Koleksi</span></a><a href="/admin" ${active==="admin"?'aria-current="page"':""}>${I.lock}<span>Admin</span></a></nav></div>`;
}
