// Routine Buddy – onboarding wizard, multi-routine home, per-routine launch, runner, editor. © Net Zero Strategic, LLC
const $=id=>document.getElementById(id),clone=o=>JSON.parse(JSON.stringify(o)),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LS={get:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const nav2=(navigator.language||'en').slice(0,2);
let L=LS.get('lang',null)||(I18N[nav2]?nav2:'en');const S=()=>I18N[L],SL=l=>I18N[l]||I18N.en;
const EMOJIS=['☀️','🌙','📚','🪥','🚿','🧸','🎒','⭐','🌈','🦖','⚽','🎨'],COLORS=['#f97316','#1e3a8a','#16a34a','#db2777','#7c3aed','#0891b2','#ca8a04','#dc2626'];
const IOS_UA=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const PLATFORM=NATIVE?Capacitor.getPlatform():null; // 'ios' | 'android' | null (web)
// ---------- storage ----------
const allR=()=>LS.get('routines',{}),saveR=r=>LS.set('routines',r);
const setting=(k,d)=>LS.get(k,d);
function t(k,v){let s=S()[k];if(s==null)s=I18N.en[k];if(v)for(const x in v)s=s.split('{'+x+'}').join(v[x]);return s}
function applyLang(){const s=S();document.documentElement.lang=L;document.documentElement.dir=s.rtl?'rtl':'ltr';Speech.lang=s.tts;
 document.querySelectorAll('[data-t]').forEach(e=>{const v=s[e.dataset.t]??I18N.en[e.dataset.t];if(v!=null)e.textContent=v});
 const d=Math.ceil(SUB.trialLeft());$('trialTag').textContent=SUB.hasPro()?'':(d>0?t('trialLeft',{d}):'')}
function show(id){['ob','home','launch','run','edit','paywall','about'].forEach(s=>$(s).hidden=s!==id);window.scrollTo(0,0)}
// ---------- access policy ----------
// 7-day trial from first launch unlocks everything. The FIRST routine can always be created (onboarding is never paywalled).
// After the trial: running any routine or creating a 2nd+ routine requires the subscription.
const canCreate=()=>Object.keys(allR()).length===0||SUB.hasAccess();
const canRun=()=>SUB.hasAccess();
$('buyM').onclick=async()=>{if(await SUB.buy('monthly'))home()};$('buyY').onclick=async()=>{if(await SUB.buy('yearly'))home()};
$('restore').onclick=async()=>{if(await SUB.restore())home()};$('trial').onclick=()=>SUB.buy('yearly').then(ok=>ok&&home());
document.querySelectorAll('.toHome').forEach(a=>a.onclick=e=>{e.preventDefault();home()});
$('toAbout').onclick=e=>{e.preventDefault();show('about')};
// ---------- home ----------
function home(){history.replaceState(null,'',location.pathname);setHeadFor(null);applyLang();
 $('lang').innerHTML=Object.entries(I18N).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join('');$('lang').value=L;
 $('mode').value=setting('mode','touch');$('kid').value=kidName(activeKid());$('praiseSel').value=setting('praise','every');$('checkSel').value=String(setting('checkin',120));$('tempSel').value=setting('tempUnit','auto');renderKids();$('useWeather').checked=setting('weather',true);
 const R=allR();$('rlist').innerHTML='';
 Object.values(R).filter(r=>!r.kid||r.kid===activeKid()).forEach(r=>{const d=document.createElement('div');d.className='rrow';
  d.innerHTML=`<button class="rbtn" style="background:${r.color}">${r.emoji} ${esc(r.name)}</button><button class="s" title="edit">✏️</button><button class="s" title="home screen">📲</button>`;
  const b=d.querySelectorAll('button');b[0].onclick=()=>canRun()?start(r.id):show('paywall');b[1].onclick=()=>openEditor(r.id);b[2].onclick=()=>{OB_R=r;wiz.page='hs';wiz.single=true;show('ob');renderOb()};
  $('rlist').appendChild(d)});renderSub();show('home')}
$('lang').onchange=()=>{L=$('lang').value;LS.set('lang',L);home()};
$('mode').onchange=()=>LS.set('mode',$('mode').value);$('kid').onchange=()=>{setKidName($('kid').value.trim());renderKids()};$('tempSel').onchange=()=>LS.set('tempUnit',$('tempSel').value);$('praiseSel').onchange=()=>LS.set('praise',$('praiseSel').value);$('checkSel').onchange=()=>LS.set('checkin',+$('checkSel').value);$('useWeather').onchange=()=>LS.set('weather',$('useWeather').checked);
$('newR').onclick=()=>canCreate()?startWizard(true):show('paywall');
function renderKids(){const k=kids(),a=activeKid(),bar=$('kidBar');
 bar.innerHTML=(k.length>1||k[0].name?k.map(x=>`<button class="chip${x.id===a?' on':''}" data-kid="${x.id}">🧒 ${esc(x.name||'…')}</button>`).join(''):'')+`<button class="chip" id="addKid">＋ ${esc(t('addKid'))}</button>`;
 bar.querySelectorAll('[data-kid]').forEach(b=>b.onclick=()=>{LS.set('kidActive',b.dataset.kid);home()});
 $('addKid').onclick=()=>{const n=(prompt(t('childQ'))||'').trim();if(!n)return;const k2=kids();if(k2.length===1&&!k2[0].name){k2[0].name=n}else{const id='k'+Date.now().toString(36);k2.push({id,name:n});LS.set('kidActive',id)}LS.set('kids',k2);home()}}
// ---------- subscription status (home page only; never touches a running routine) ----------
const fmtD=ms=>new Intl.DateTimeFormat(L,{dateStyle:'medium'}).format(new Date(ms));
function renderSub(){const st=SUB.status,w=SUB.warning(),bn=$('subBanner');
 const key=w&&(w+':'+(st.exp||st.billingIssue));
 if(w&&LS.get('dismissed',null)!==key){bn.hidden=false;bn.className='banner'+(w==='billing'?' bad':'');
  bn.innerHTML=w==='billing'?`<span>⚠️ ${esc(t('bannerBill',{store:SUB.storeName()}))}</span><a class="primary" style="padding:8px 12px;border-radius:10px;text-decoration:none" href="${esc(SUB.manageURL())}" target="_blank" rel="noopener">${esc(t('manage'))}</a><button class="x">✕</button>`
   :`<span>⏳ ${esc(t('bannerExp',{d:fmtD(st.exp)}))}</span><button class="primary rn">${esc(t('renew'))}</button><button class="x">✕</button>`;
  bn.querySelector('.x').onclick=()=>{LS.set('dismissed',key);bn.hidden=true};const rn=bn.querySelector('.rn');if(rn)rn.onclick=()=>show('paywall')}
 else bn.hidden=true;
 let line;if(st&&SUB.hasPro()){const plan=/year|annual/i.test(st.product||'')?t('stYearly'):t('stMonthly');
  line=plan+(st.exp?' · '+(st.willRenew&&st.exp>Date.now()?t('stRenews',{d:fmtD(st.exp)}):t('stExpires',{d:fmtD(st.exp)})):'')}
 else{const d=Math.ceil(SUB.trialLeft());line=(!SUB.native()&&d>0)?t('trialLeft',{d}):t('stNone')}
 if(SUB.offline)line+=' · '+t('stOffline');$('subLine').textContent=line;$('manageSub').href=SUB.manageURL()}
SUB.onChange(()=>{applyLang();if(!$('home').hidden)renderSub()});
// ---------- routine builder (fast, tap-first) ----------
// First run: device → language → pick a routine → tap steps → name & look → child's name → voice/touch → all set.
// Later routines: pick → steps → look → all set. "⚡ School morning" makes the ready-made routine and starts it in one tap.
const FIRST=['device','lang','pick','steps','look','kid','mode','hs'],LATER=['pick','steps','look','hs'];
const EMO={morning:['🚽','🧼','🚿','🧖','👕','🧥','💇','🥣','🍽️','🎒','👟'],bedtime:['🚽','🧼','🪥','💧','👚','🛏️'],homework:['📚','🧹','📖','✏️','🧃','✅','🎒']};
let wiz={},OB_R=null;
function startWizard(later){wiz={pages:later?LATER:FIRST,type:null,items:[],device:setting('device',PLATFORM||(IOS_UA?'ios':/Android/i.test(navigator.userAgent)?'android':'ios'))};
 wiz.page=wiz.pages[0];OB_R=null;show('ob');renderOb()}
function template(type){const s=S();const mk=(arr,em,on)=>arr.map((x,n)=>x.weather?{weather:true,emoji:'🧥',on}:Object.assign({emoji:em[n]||'⭐',on},typeof x==='string'?{text:x}:clone(x)));
 if(type==='custom'){const seen=new Set();return [...mk(s.morning,EMO.morning,false),...mk(s.bedtime,EMO.bedtime,false),...mk(s.hwSteps,EMO.homework,false)].filter(x=>{const k=x.weather?'w':x.text;return !seen.has(k)&&seen.add(k)})}
 return mk({morning:s.morning,bedtime:s.bedtime,homework:s.hwSteps}[type],EMO[type],true)}
function makeRoutine(type,items){const s=S();return {id:'r'+Date.now().toString(36),kid:activeKid(),name:{morning:t('schoolM'),bedtime:s.bName,homework:t('afterSchool')}[type]||t('makeOwn'),
 emoji:{morning:'☀️',bedtime:'🌙',homework:'📚'}[type]||'⭐',color:{morning:'#f97316',bedtime:'#1e3a8a',homework:'#16a34a'}[type]||'#7c3aed',lang:L,calm:type==='bedtime',doneBy:'',
 steps:items.filter(x=>x.on&&(x.weather?setting('weather',true):true)).map(x=>{const y=clone(x);delete y.on;return y})}}
function quickStart(){const r=makeRoutine('morning',template('morning'));const R=allR();R[r.id]=r;saveR(R);if(!SUB.hasAccess()&&Object.keys(R).length>1)return show('paywall');start(r.id)}
function micBtn(input){if(!(NATIVE||window.SpeechRecognition||window.webkitSpeechRecognition))return '';return `<button class="mic" data-for="${input}">🎤</button>`}
function wireMics(){document.querySelectorAll('#obBody .mic').forEach(b=>b.onclick=async()=>{b.disabled=true;const v=await Speech.dictate(S().tts);b.disabled=false;if(v){const i=$(b.dataset.for);i.value=v;i.dispatchEvent(new Event('input'));if(b.dataset.for==='ownIn')$('ownAdd').click()}})}
const dayNames=()=>[...Array(7)].map((_,d)=>new Intl.DateTimeFormat(L,{weekday:'short'}).format(new Date(2024,0,7+d)));
const tag=x=>[x.wait?Math.round(x.wait/60)+' '+t('minutes'):'',x.days?x.days.map(d=>dayNames()[d]).join(' '):''].filter(Boolean).join(' · ');
function renderOb(){const B=$('obBody'),p=wiz.page,s=S();applyLang();
 const idx=wiz.pages?wiz.pages.indexOf(p):0,n=wiz.pages?wiz.pages.length:1;$('obProg').textContent=wiz.single?'':t('progress',{a:idx+1,b:n});$('obDots').innerHTML=`<i style="width:${(idx+1)/n*100}%"></i>`;
 $('obBack').style.visibility=(wiz.single||idx<=0||p==='hs')?'hidden':'visible';
 $('obNext').hidden=p==='pick';$('obNext').textContent=p==='hs'?t('allSet')+' 🎉':p==='look'?t('makeR')+' ✨':t('next');
 const choice=(arr,cur,key)=>arr.map(([v,l])=>`<button class="choice${cur===v?' on':''}" data-v="${v}" data-k="${key}">${esc(l)}</button>`).join('');
 if(p==='device')B.innerHTML=`<div class="q">${esc(t('obDevice'))}</div>${choice([['ios','📱 '+t('iphone')],['android','🤖 '+t('android')]],wiz.device,'device')}<p class="muted">${esc(t('detected',{d:wiz.device==='ios'?'iPhone':'Android'}))}</p>`;
 else if(p==='lang')B.innerHTML=`<div class="q">${esc(t('obLang'))}</div>`+Object.entries(I18N).map(([k,v])=>`<button class="choice${k===L?' on':''}" data-v="${k}" data-k="lang">${v.name}</button>`).join('');
 else if(p==='pick'){B.innerHTML=`<button class="quick" id="quickBtn">${esc(t('quick'))}</button><div class="q">${esc(t('pickQ'))}</div><div class="cards">`+
   [['morning','☀️',t('schoolM')],['bedtime','🌙',s.bName],['homework','🎒',t('afterSchool')],['custom','✨',t('makeOwn')]].map(([v,e,l])=>`<button class="card" data-pick="${v}"><span class="e">${e}</span>${esc(l)}</button>`).join('')+'</div>';
  $('quickBtn').onclick=quickStart;
  B.querySelectorAll('[data-pick]').forEach(c=>c.onclick=()=>{const v=c.dataset.pick;if(wiz.type!==v){wiz.type=v;wiz.items=template(v)}wiz.page='steps';renderOb()})}
 else if(p==='steps'){const on=wiz.items.filter(x=>x.on).length;
  B.innerHTML=`<div class="q">${esc(t('stepsQ'))}</div><p class="muted small">${esc(t('dragHint'))} · ✓ ${on}</p><ul class="slist" id="slist">`+
   wiz.items.map((x,n)=>`<li class="srow ${x.on?'on':'off'}" data-n="${n}"><span class="h" aria-label="drag">☰</span><span class="e">${x.emoji}</span><button class="tx" data-tg="${n}">${esc(x.weather?t('weatherStep'):x.text)}<br><span class="tag">${esc(tag(x))}</span></button><button class="mv" data-ex="${n}" aria-label="more">⏱</button><span style="display:flex;flex-direction:column"><button class="mv" data-u="${n}" aria-label="up">↑</button><button class="mv" data-d="${n}" aria-label="down">↓</button></span><button class="ck" data-tg="${n}">${x.on?'✓':'+'}</button></li>`).join('')+
   `</ul><div class="inrow"><input id="ownIn" placeholder="${esc(t('addOwn'))}"><button id="ownAdd">＋</button>${micBtn('ownIn')}</div>`;
  B.querySelectorAll('[data-tg]').forEach(b=>b.onclick=()=>{const x=wiz.items[b.dataset.tg];x.on=!x.on;renderOb()});
  B.querySelectorAll('[data-ex]').forEach(b=>b.onclick=()=>openSheet(wiz.items[b.dataset.ex]));
  const mv=(n,d)=>{const m=n+d;if(m<0||m>=wiz.items.length)return;[wiz.items[n],wiz.items[m]]=[wiz.items[m],wiz.items[n]];renderOb()};
  B.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>mv(+b.dataset.u,-1));B.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>mv(+b.dataset.d,1));
  const add=()=>{const v=$('ownIn').value.trim();if(v){wiz.items.push({text:v,emoji:'⭐',on:true});renderOb();$('ownIn').focus()}};$('ownAdd').onclick=add;$('ownIn').onkeydown=e=>{if(e.key==='Enter')add()};
  wireDrag($('slist'));wireMics()}
 else if(p==='look'){const r=wiz.draft;B.innerHTML=`<div class="q">${esc(t('lookQ'))}</div><div class="bigicon" style="background:${r.color}">${r.emoji}</div>
  <div class="inrow"><input id="rnIn" value="${esc(r.name)}" aria-label="${esc(t('rName'))}">${micBtn('rnIn')}</div>
  <div class="chips">${EMOJIS.map(e=>`<button class="chip emo${r.emoji===e?' on':''}" data-e="${e}">${e}</button>`).join('')}</div>
  <div class="chips">${COLORS.map(c=>`<button class="sw${r.color===c?' on':''}" data-c2="${c}" style="background:${c}"></button>`).join('')}</div>
  <label>⏰ ${esc(t('doneBy'))}<input type="time" id="dbIn" value="${r.doneBy||''}"></label>`;
  $('rnIn').oninput=e=>r.name=e.target.value;$('dbIn').onchange=e=>r.doneBy=e.target.value;
  B.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{r.emoji=b.dataset.e;renderOb()});B.querySelectorAll('[data-c2]').forEach(b=>b.onclick=()=>{r.color=b.dataset.c2;renderOb()});wireMics()}
 else if(p==='kid'){B.innerHTML=`<div class="q">${esc(t('childQ'))}</div><div class="inrow"><input id="kidIn" value="${esc(kidName(activeKid()))}">${micBtn('kidIn')}</div>`;$('kidIn').oninput=e=>setKidName(e.target.value.trim());wireMics()}
 else if(p==='mode'){const m=setting('mode','touch');B.innerHTML=`<div class="q">${esc(t('modeQ'))}</div>${choice([['touch','👆 '+t('touch')],['voice','🎤 '+t('voice')]],m,'mode')}`+(m==='voice'?`<p class="muted">${esc(wiz.device==='ios'?t('speechIOS'):t('speechAndroid'))}</p>`:'')}
 else if(p==='hs')renderHS(B,OB_R);
 B.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{const k=b.dataset.k,v=b.dataset.v;
  if(k==='device'){wiz.device=v;LS.set('device',v)}else if(k==='lang'){L=v;LS.set('lang',v);wiz.type=null}else if(k==='mode')LS.set('mode',v);renderOb()})}
function openSheet(x){const dn=dayNames(),el=$('sheetIn');const draw=()=>{const mins=x.wait?x.wait/60:0;
 el.innerHTML=`<div class="q">${x.emoji} ${esc(x.weather?t('weatherStep'):x.text)}</div><b>⏱ ${esc(t('giveTime'))}</b><div class="chips">`+[0,1,2,5,10].map(m=>`<button class="chip${mins===m?' on':''}" data-m="${m}">${m?m+' '+esc(t('minutes')):esc(t('noTimer'))}</button>`).join('')+
  `</div><b>📅 ${esc(t('someDays'))}</b><div class="chips">`+dn.map((d,j)=>`<button class="chip${!x.days||x.days.includes(j)?' on':''}" data-dd="${j}">${d}</button>`).join('')+`</div><button class="big" id="sheetOk">${esc(t('okB'))}</button>`;
 el.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{const m=+b.dataset.m;if(m){x.wait=m*60;x.auto=true}else{delete x.wait;delete x.auto}draw()});
 el.querySelectorAll('[data-dd]').forEach(b=>b.onclick=()=>{const j=+b.dataset.dd;let d=x.days||[0,1,2,3,4,5,6];d=d.includes(j)?d.filter(z=>z!==j):[...d,j].sort();if(!d.length)return;x.days=d.length===7?undefined:d;if(!x.days)delete x.days;draw()});
 $('sheetOk').onclick=()=>{$('sheet').hidden=true;renderOb()}};draw();$('sheet').hidden=false}
$('sheet').onclick=e=>{if(e.target.id==='sheet'){$('sheet').hidden=true;renderOb()}};
function wireDrag(list){list.querySelectorAll('.h').forEach(h=>h.onpointerdown=e=>{e.preventDefault();const li=h.closest('li');let from=+li.dataset.n;li.classList.add('drag');
 const mv=ev=>{ev.preventDefault();const over=document.elementFromPoint(ev.clientX,ev.clientY);const tli=over&&over.closest&&over.closest('#slist li');
  if(ev.clientY<60)window.scrollBy(0,-12);else if(ev.clientY>innerHeight-60)window.scrollBy(0,12); // auto-scroll on long lists
  if(!tli||tli===li)return;const to=+tli.dataset.n;const it=wiz.items.splice(from,1)[0];wiz.items.splice(to,0,it);(to>from?tli.after(li):tli.before(li));[...list.children].forEach((c,i)=>c.dataset.n=i);from=to};
 const up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);li.classList.remove('drag');renderOb()};
 addEventListener('pointermove',mv,{passive:false});addEventListener('pointerup',up);addEventListener('pointercancel',up)})}
$('obBack').onclick=()=>{const i=wiz.pages.indexOf(wiz.page);if(i>0){wiz.page=wiz.pages[i-1];renderOb()}};
$('obNext').onclick=()=>{const p=wiz.page;
 if(p==='hs'){wiz={};return home()}
 if(p==='steps'){if(!wiz.items.some(x=>x.on))return;const keep=wiz.draft;wiz.draft=makeRoutine(wiz.type,wiz.items);if(keep){wiz.draft.id=keep.id;wiz.draft.name=keep.name;wiz.draft.emoji=keep.emoji;wiz.draft.color=keep.color;wiz.draft.doneBy=keep.doneBy}}
 if(p==='look'){const R=allR();wiz.draft.name=(wiz.draft.name||'').trim()||t('makeOwn');R[wiz.draft.id]=wiz.draft;saveR(R);OB_R=wiz.draft}
 wiz.page=wiz.pages[wiz.pages.indexOf(p)+1];renderOb()};
// ---------- children ----------
function kids(){let k=LS.get('kids',null);if(!k){k=[{id:'k1',name:setting('kid','')}];LS.set('kids',k);LS.set('kidActive','k1')}return k}
const activeKid=()=>{const k=kids(),a=setting('kidActive',k[0].id);return k.some(x=>x.id===a)?a:k[0].id};
const kidName=id=>(kids().find(x=>x.id===id)||{}).name||'';
function setKidName(n){const k=kids(),a=activeKid();k.forEach(x=>{if(x.id===a)x.name=n});LS.set('kids',k)}
// ---------- home-screen entry per routine ----------
function b64(o){return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function unb64(s){try{return JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/')))))}catch(e){return null}}
function launchUrl(r){return location.origin+location.pathname+'?r='+r.id+'#d='+b64({r,kidName:kidName(r.kid||activeKid()),mode:setting('mode','touch')})} // hash carries the routine: iOS home-screen web apps get their own empty storage
function iconDataUrl(r,size=180){const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');g.fillStyle=r.color;g.fillRect(0,0,size,size);
 g.font=`${size*.6}px serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(r.emoji,size/2,size*.55);return c.toDataURL('image/png')}
function setHeadFor(r){document.title=r?r.name:'Routine Buddy';$('appTitle').content=r?r.name:'Routine Buddy';
 $('touchIcon').href=r?iconDataUrl(r):'icon-192.png';
 $('manifest').href=r?`manifest.webmanifest?r=${encodeURIComponent(r.id)}&n=${encodeURIComponent(r.name)}&e=${encodeURIComponent(r.emoji)}&c=${encodeURIComponent(r.color)}`:'manifest.webmanifest'}
function renderHS(B,r){const dev=setting('device',wiz.device||'ios');setHeadFor(r);
 let body='';
 if(PLATFORM==='android')body=`<p>${esc(t('hsNativeA',{r:r.name}))}</p><button class="big" id="pinBtn">📲 ${esc(t('pin'))}</button>`;
 else if(PLATFORM==='ios')body=`<p>${esc(t('hsNativeI',{r:r.name}))}</p><code id="lnk">routinebuddy://run?r=${r.id}</code><button id="cpBtn">${esc(t('copyLink'))}</button>`;
 else{history.replaceState(null,'',launchUrl(r)); // Add to Home Screen saves the CURRENT url, name and icon
  body=`<p>${esc(dev==='ios'?t('hsIOS',{r:r.name}):t('hsAndroid',{r:r.name}))}</p><code id="lnk">${esc(launchUrl(r))}</code><button id="cpBtn">${esc(t('copyLink'))}</button>`}
 B.innerHTML=`<div class="q">${esc(t('homeTitle',{r:r.name}))}</div><div class="bigicon" style="background:${r.color}">${r.emoji}</div><h3 style="text-align:center">${esc(r.name)}</h3>${body}
  <button class="big" id="openR">${esc(t('openR'))}</button>`+(setting('mode','touch')==='voice'?`<p class="muted">${esc(dev==='ios'?t('speechIOS'):t('speechAndroid'))}</p>`:'');
 if($('pinBtn'))$('pinBtn').onclick=()=>NP('RoutineShortcuts').pin({id:r.id,label:r.name,emoji:r.emoji,color:r.color}).catch(e=>alert(e.message||e));
 if($('cpBtn'))$('cpBtn').onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText($('lnk').textContent);$('cpBtn').textContent=t('copied')};
 $('openR').onclick=()=>canRun()?start(r.id):show('paywall')}
// ---------- launching straight into a routine ----------
function routeLaunch(url){let id=null,data=null;try{const u=new URL(url);id=u.searchParams.get('r');const m=/[#&]d=([^&]+)/.exec(u.hash);if(m)data=unb64(m[1])}catch(e){}
 if(!id)return false;const R=allR();if(data&&data.r&&!R[id]){R[id]=data.r;saveR(R);if(data.kidName){const k=kids();let c=k.find(x=>x.name===data.kidName);if(!c){if(k.length===1&&!k[0].name){k[0].name=data.kidName;c=k[0]}else{c={id:'k'+Date.now().toString(36),name:data.kidName};k.push(c)}LS.set('kids',k)}R[id].kid=c.id;saveR(R)}if(data.mode&&!localStorage.mode)LS.set('mode',data.mode)}
 const r=allR()[id];if(!r)return false;if(!canRun()){show('paywall');return true}
 if(NATIVE){start(id);return true} // native TTS needs no tap
 setHeadFor(r);$('lIcon').style.background=r.color;$('lIcon').textContent=r.emoji;$('lName').textContent=r.name;$('lStart').onclick=()=>start(id);show('launch');return true} // browsers only allow speech after a tap
// ---------- weather (optional, device location) ----------
// Temperature unit follows where the device actually is (not the UI language). Decisions are made in °C; °F only for speaking.
const F_COUNTRIES=['US','PR','GU','VI','AS','MP','UM','LR','BS','BZ','KY','PW','FM','MH'];
let TEMP_C=null;
function regionFromDevice(){for(const l of [...(navigator.languages||[]),navigator.language,Intl.DateTimeFormat().resolvedOptions().locale]){try{const r=new Intl.Locale(l).maximize().region;if(r&&/^[A-Z]{2}$/.test(r))return r}catch(e){}}return null}
function useF(){const o=setting('tempUnit','auto');if(o==='F')return true;if(o==='C')return false;const c=setting('country',null)||regionFromDevice();return F_COUNTRIES.includes(c)}
function timeoutFetch(url,ms){const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);return fetch(url,{signal:c.signal}).finally(()=>clearTimeout(t))}
async function countryFromCoords(lat,lon){try{const d=await (await timeoutFetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,4000)).json();
  if(d&&/^[A-Z]{2}$/.test(d.countryCode||'')){LS.set('country',d.countryCode);return d.countryCode}}catch(e){}return null}
function getWeather(){if(!setting('weather',true)||!navigator.geolocation)return;
 navigator.geolocation.getCurrentPosition(p=>{const lat=p.coords.latitude.toFixed(2),lon=p.coords.longitude.toFixed(2);countryFromCoords(lat,lon);
  timeoutFetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`,6000).then(r=>r.json()).then(d=>TEMP_C=d.current.temperature_2m).catch(()=>{})},
  ()=>{},{timeout:8000,maximumAge:36e5})}
// ---------- runner ----------
let R=null,RS=null,steps=[],i=0,active=false,paused=false,voice=false,tm=[],check,run=0;
function weatherText(){if(TEMP_C==null)return RS.wNone;const n=Math.round(useF()?TEMP_C*9/5+32:TEMP_C);return(TEMP_C<10?RS.wCold:RS.wMild).replace('{t}',n)} // cold < 10 °C (= 50 °F)
const warm=()=>TEMP_C!=null&&TEMP_C>=18.3; // skip jacket at 18.3 °C (= 65 °F) or warmer
const T=x=>typeof x==='string'?x:x.weather?weatherText():x.text;
const later=(ms,f)=>{const r=run;tm.push(setTimeout(()=>{if(active&&!paused&&r===run)f()},ms))};
const clr=()=>{tm.forEach(clearTimeout);tm=[];clearTimeout(check)};
async function say(x){if(voice)await Speech.pauseListening();await Speech.speak(x);if(voice&&active)Speech.listen()}
const pick=a=>a[Math.floor(Math.random()*a.length)];
async function start(id){const r=allR()[id];if(!r)return home();R=r;RS=SL(r.lang||L);Speech.lang=RS.tts;voice=setting('mode','touch')==='voice';
 document.documentElement.dir=RS.rtl?'rtl':'ltr';Speech.unlock();getWeather();show('run');$('rname').textContent=r.emoji+' '+r.name;$('step').textContent='…';$('status').textContent='';
 ['done','back','repeat','pause','stop'].forEach(k=>document.querySelectorAll(`#run [data-t=${k}]`).forEach(e=>e.textContent=RS[k]));
 if(voice){const ok=await Speech.micAvailable();if(!ok){voice=false;$('status').textContent=RS.micNo}}
 const d=new Date().getDay();Speech.onHeard=heard;steps=r.steps.filter(x=>!(x&&x.days&&x.days.length&&!x.days.includes(d))&&!(x&&x.weather&&!setting('weather',true)));
 i=0;active=true;paused=false;run++;keepAwake();const nm=kidName(r.kid||activeKid());
 await say((r.calm?RS.greetB:RS.greetM).replace('{n}',nm?', '+nm:''));later(4000,()=>step(RS.first))}
// "Out the door by": gentle pace cues. Behind = less than ~1.5 min per remaining step (or past the time).
function pace(){if(!R.doneBy)return '';const [h,m]=R.doneBy.split(':').map(Number),d=new Date();d.setHours(h,m,0,0);const left=Math.round((d-Date.now())/6e4),rem=steps.length-i;
 if(left<-60||left>240)return '';if(left<=0||left<rem*1.5){if(i-(R._lastBehind??-9)>=2){R._lastBehind=i;return ' '+RS.behind}return ''}
 if(i%3===0)return ' '+RS.minsLeft.replace('{m}',left);return ''}
function bar(){$('bar').style.width=(i/steps.length*100)+'%'}
async function step(intro){clr();if(i<steps.length&&steps[i].weather&&warm())steps.splice(i,1);if(i>=steps.length)return finish();
 const x=steps[i],me=i,r=run,txt=T(x),ad=typeof x==='object'&&x.auto===true;$('step').textContent=txt;bar();
 await say((intro?intro+' ':'')+txt+(ad?'':' '+(voice?RS.sayDone:RS.pressDone)));if(i!==me||r!==run)return;
 if(typeof x==='object'&&x.wait>0&&x.auto)later(x.wait*1000,()=>{if(i===me)next()});arm()}
function arm(){clearTimeout(check);const ms=(+setting('checkin',120))*1000;if(!ms)return;check=setTimeout(()=>{if(active&&!paused&&i<steps.length){say(RS.still.replace('{s}',T(steps[i]))+' '+(voice?RS.sayDone:RS.pressDone));arm()}},ms)}
function next(){if(!active||paused)return;clr();i++;if(i>=steps.length)return finish();
 const pm=setting('praise','every'),give=pm==='every'||(pm==='some'&&i%3===0);const p=give?pick(R.calm?RS.calm:RS.praise):'';
 step((p+(i===steps.length-1&&pm!=='end'?' '+RS.last:'')+pace()).trim())}
async function finish(){clr();$('bar').style.width='100%';$('step').textContent=R.calm?'🌙':'🎉';active=false;await Speech.pauseListening();await Speech.speak(R.calm?RS.night:RS.finish);releaseWake()}
async function stop(){active=false;run++;clr();await Speech.pauseListening();Speech.stopSpeaking();await Speech.speak(RS.stopped);releaseWake();home()}
function heard(x){x=(x||'').toLowerCase().trim();$('status').textContent='🎤 '+x;if(!active||paused)return;if(RS.dw.some(w=>x.includes(w)))next()}
$('doneBtn').onclick=()=>next();
document.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const c=b.dataset.c;
 if(c==='stop')return stop();if(!active)return;if(c==='repeat')return step('');if(c==='back'){i=Math.max(0,i-1);return step('')}
 if(c==='pause'){paused=!paused;$('pauseBtn').textContent=paused?RS.resume:RS.pause;if(paused){clr();Speech.stopSpeaking();Speech.pauseListening()}else{run++;step('')}}});
let wake;async function keepAwake(){try{if(NP('KeepAwake'))return NP('KeepAwake').keepAwake();if('wakeLock'in navigator)wake=await navigator.wakeLock.request('screen')}catch(e){}}
function releaseWake(){try{if(NP('KeepAwake'))return NP('KeepAwake').allowSleep();wake&&wake.release()}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&active)keepAwake()});
// ---------- step editor (used by review page and ✏️) ----------
function renderSteps(box,r){const dn=dayNames();box.innerHTML='<ol class="tl" style="padding:0"></ol><div class="row"><button class="as">'+esc(t('add'))+'</button><button class="aw">'+esc(t('weatherStep'))+'</button></div><p class="muted small">⏱ '+esc(t('timer'))+'</p>';
 const ol=box.querySelector('ol');r.steps=r.steps.map(x=>typeof x==='string'?{text:x}:x);
 r.steps.forEach((x,n)=>{const li=document.createElement('li');li.style.display='block';
  li.innerHTML=(x.weather?`<b>🌦 ${esc(t('weatherStep'))}</b>`:`<input type="text" class="tx" style="width:100%;font-size:1em;padding:6px">`)+`<div class="opts row small">⏱<input type="number" min="0" class="wt" style="width:64px">`+
   dn.map((d,j)=>`<label class="row" style="margin:0"><input type="checkbox" class="dy" data-d="${j}">${d}</label>`).join('')+`<button class="up">↑</button><button class="dn">↓</button><button class="rm">✕</button></div>`;
  if(!x.weather)li.querySelector('.tx').value=x.text||'';li.querySelector('.wt').value=x.wait||0;
  li.querySelectorAll('.dy').forEach(c=>c.checked=!x.days||!x.days.length||x.days.includes(+c.dataset.d));
  const re=f=>()=>{collectSteps(box,r);f();renderSteps(box,r)};
  li.querySelector('.up').onclick=re(()=>{if(n>0)[r.steps[n-1],r.steps[n]]=[r.steps[n],r.steps[n-1]]});
  li.querySelector('.dn').onclick=re(()=>{if(n<r.steps.length-1)[r.steps[n+1],r.steps[n]]=[r.steps[n],r.steps[n+1]]});
  li.querySelector('.rm').onclick=re(()=>r.steps.splice(n,1));ol.appendChild(li)});
 box.querySelector('.as').onclick=()=>{collectSteps(box,r);r.steps.push({text:''});renderSteps(box,r)};
 box.querySelector('.aw').onclick=()=>{collectSteps(box,r);r.steps.push({weather:true});renderSteps(box,r)}}
function collectSteps(box,r){[...box.querySelectorAll('ol>li')].forEach((li,n)=>{const x=r.steps[n];if(!x)return;
 if(!x.weather)x.text=li.querySelector('.tx').value;const w=+li.querySelector('.wt').value||0;if(w>0){x.wait=w;x.auto=x.auto||true}else{delete x.wait;delete x.auto}
 const d=[...li.querySelectorAll('.dy')].filter(c=>c.checked).map(c=>+c.dataset.d);if(d.length===7||!d.length)delete x.days;else x.days=d});
 r.steps=r.steps.filter(x=>x.weather||(x.text||'').trim()!==''||!box.isConnected)}
let EDR=null;
function openEditor(id){EDR=clone(allR()[id]);show('edit');applyLang();$('erName').value=EDR.name;$('erDoneBy').value=EDR.doneBy||'';renderSteps($('erSteps'),EDR)}
$('erSave').onclick=()=>{collectSteps($('erSteps'),EDR);EDR.name=$('erName').value.trim()||EDR.name;EDR.doneBy=$('erDoneBy').value;const R=allR();R[EDR.id]=EDR;saveR(R);home()};
$('erHS').onclick=()=>{$('erSave').onclick();OB_R=allR()[EDR.id];wiz={page:'hs',single:true};show('ob');renderOb()};
$('erDel').onclick=()=>{if(!confirm(t('del')+'?'))return;const R=allR();delete R[EDR.id];saveR(R);home()};
// ---------- boot ----------
(async()=>{await SUB.init();applyLang();
 if(NATIVE&&NP('App')){NP('App').addListener('appUrlOpen',e=>routeLaunch(e.url));try{const u=await NP('App').getLaunchUrl();if(u&&u.url&&routeLaunch(u.url))return}catch(e){}}
 if(routeLaunch(location.href))return;
 if(!Object.keys(allR()).length)return startWizard(false);home()})();
if('serviceWorker'in navigator&&!NATIVE&&(location.protocol==='https:'||location.hostname==='127.0.0.1'||location.hostname==='localhost'))navigator.serviceWorker.register('sw.js').catch(()=>{});
