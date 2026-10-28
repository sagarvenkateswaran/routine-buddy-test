// Service worker: offline cache + per-routine manifest/icon so "Add to Home Screen" uses the routine's name and icon.
const C='digimaa-v3';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html','style.css','i18n.js','i18n-ob.js','i18n-sub.js','i18n-ux.js','i18n-ux2.js','i18n-hs.js','speech.js','subscription.js','app.js','icon-192.png','icon-512.png'])))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
async function icon(e,c,size){try{const cv=new OffscreenCanvas(size,size),g=cv.getContext('2d');g.fillStyle=c;g.fillRect(0,0,size,size);g.font=`${size*.6}px serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(e,size/2,size*.55);
 return new Response(await cv.convertToBlob({type:'image/png'}),{headers:{'Content-Type':'image/png'}})}catch(x){return fetch('icon-512.png')}}
self.addEventListener('fetch',ev=>{const u=new URL(ev.request.url);if(ev.request.method!=='GET'||u.origin!==self.location.origin)return;
 const base=self.registration.scope;
 if(u.pathname.endsWith('/manifest.webmanifest')&&u.searchParams.get('r')){const r=u.searchParams.get('r'),n=u.searchParams.get('n')||'Routine',e=u.searchParams.get('e')||'⭐',c=u.searchParams.get('c')||'#4f46e5',d=u.searchParams.get('d')||'',q=`e=${encodeURIComponent(e)}&c=${encodeURIComponent(c)}`;
  const start=base+'?r='+encodeURIComponent(r)+(d?'&d='+d:'');
  ev.respondWith(new Response(JSON.stringify({id:'?r='+r,name:n,short_name:n.length>12?n.slice(0,12):n,start_url:start,scope:base,display:'standalone',background_color:'#f5f5ff',theme_color:c,description:'DigiMaa © Net Zero Strategic, LLC',
   icons:[{src:base+'routine-icon-192.png?'+q,sizes:'192x192',type:'image/png'},{src:base+'routine-icon-512.png?'+q,sizes:'512x512',type:'image/png',purpose:'any maskable'}]}),{headers:{'Content-Type':'application/manifest+json'}}));return}
 const m=/routine-icon-(\d+)\.png$/.exec(u.pathname);if(m){ev.respondWith(icon(u.searchParams.get('e')||'⭐',u.searchParams.get('c')||'#4f46e5',+m[1]));return}
 ev.respondWith(fetch(ev.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(ev.request,cp));return r}).catch(()=>caches.match(ev.request,{ignoreSearch:true})))});
