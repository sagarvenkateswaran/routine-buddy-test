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
 $('mode').value=setting('mode','touch');$('kid').value=setting('kid','');$('useWeather').checked=setting('weather',true);
 const R=allR();$('rlist').innerHTML='';
 Object.values(R).forEach(r=>{const d=document.createElement('div');d.className='rrow';
  d.innerHTML=`<button class="rbtn" style="background:${r.color}">${r.emoji} ${esc(r.name)}</button><button class="s" title="edit">✏️</button><button class="s" title="home screen">📲</button>`;
  const b=d.querySelectorAll('button');b[0].onclick=()=>canRun()?start(r.id):show('paywall');b[1].onclick=()=>openEditor(r.id);b[2].onclick=()=>{OB_R=r;wiz.page='hs';wiz.single=true;show('ob');renderOb()};
  $('rlist').appendChild(d)});renderSub();show('home')}
$('lang').onchange=()=>{L=$('lang').value;LS.set('lang',L);home()};
$('mode').onchange=()=>LS.set('mode',$('mode').value);$('kid').onchange=()=>LS.set('kid',$('kid').value.trim());$('useWeather').onchange=()=>LS.set('weather',$('useWeather').checked);
$('newR').onclick=()=>canCreate()?startWizard(true):show('paywall');
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
// ---------- onboarding wizard ----------
// Order (as specified): device → language → interview (type, time, tasks, days, timers, praise, check-ins) → review → "code it" (name/icon/color)
// → child's name → voice/touch → home-screen instructions. For later routines, device/language/name/mode are skipped.
const FIRST=['device','lang','type','time','tasks','days','timers','praise','checkin','review','code','kid','mode','hs'];
const LATER=['type','time','tasks','days','timers','praise','checkin','review','code','hs'];
let wiz={},OB_R=null;
function startWizard(later){wiz={pages:later?LATER:FIRST,i:0,type:null,time:'',tasks:[],praise:'every',checkin:120,device:setting('device',PLATFORM||(IOS_UA?'ios':/Android/i.test(navigator.userAgent)?'android':'ios'))};
 wiz.page=wiz.pages[0];OB_R=null;show('ob');renderOb()}
function suggestions(){const s=S(),m={morning:s.morning,bedtime:s.bedtime,homework:s.hwSteps}[wiz.type];
 const list=m||[...s.morning,...s.bedtime,...s.hwSteps];const seen=new Set();return list.filter(x=>!x.weather).map(x=>typeof x==='string'?x:x.text).filter(x=>!seen.has(x)&&seen.add(x))}
function micBtn(input){if(!(NATIVE||window.SpeechRecognition||window.webkitSpeechRecognition))return '';return `<button class="mic" data-for="${input}">${esc(t('speak'))}</button>`}
function wireMics(){document.querySelectorAll('#obBody .mic').forEach(b=>b.onclick=async()=>{b.disabled=true;const v=await Speech.dictate(S().tts);b.disabled=false;if(v){const i=$(b.dataset.for);i.value=v;i.dispatchEvent(new Event('change'));if(b.dataset.for==='taskIn')$('taskAdd').click()}})}
const dayNames=()=>[...Array(7)].map((_,d)=>new Intl.DateTimeFormat(L,{weekday:'short'}).format(new Date(2024,0,7+d)));
function renderOb(){const B=$('obBody'),p=wiz.page,s=S();applyLang();
 const idx=wiz.pages?wiz.pages.indexOf(p):0;$('obDots').innerHTML=`<i style="width:${wiz.pages?((idx+1)/wiz.pages.length*100):100}%"></i>`;
 $('obBack').style.visibility=(wiz.single||idx<=0||p==='hs')?'hidden':'visible';$('obNext').textContent=p==='hs'?t('finishOb'):p==='review'?t('codeIt'):t('next');
 const choice=(arr,cur,key)=>arr.map(([v,l])=>`<button class="choice${cur===v?' on':''}" data-v="${v}" data-k="${key}">${esc(l)}</button>`).join('');
 if(p==='device'){B.innerHTML=`<div class="q">${esc(t('obDevice'))}</div>${choice([['ios','📱 '+t('iphone')],['android','🤖 '+t('android')]],wiz.device,'device')}<p class="muted">${esc(t('detected',{d:wiz.device==='ios'?'iPhone':'Android'}))}</p>`}
 else if(p==='lang'){B.innerHTML=`<div class="q">${esc(t('obLang'))}</div>`+Object.entries(I18N).map(([k,v])=>`<button class="choice${k===L?' on':''}" data-v="${k}" data-k="lang">${v.name}</button>`).join('')}
 else if(p==='type'){B.innerHTML=`<div class="q">${esc(t('q1'))}</div>${choice([['morning','☀️ '+s.mName],['bedtime','🌙 '+s.bName],['homework','📚 '+t('hw')],['custom','⭐ '+t('custom')]],wiz.type,'type')}`}
 else if(p==='time'){B.innerHTML=`<div class="q">${esc(t('q2'))}</div><input type="time" id="timeIn" value="${wiz.time}" style="font-size:1.4em;padding:10px">`;$('timeIn').onchange=e=>wiz.time=e.target.value}
 else if(p==='tasks'){const sug=suggestions(),have=new Set(wiz.tasks.map(x=>x.text));
  B.innerHTML=`<div class="q">${esc(t('q3'))}</div><div class="chips">${sug.map((x,n)=>`<button class="chip${have.has(x)?' on':''}" data-n="${n}">${esc(x)}</button>`).join('')}</div>
  <div class="inrow"><input id="taskIn" placeholder="${esc(t('typeTask'))}"><button id="taskAdd">${esc(t('addB'))}</button>${micBtn('taskIn')}</div>
  <ol class="tl">${wiz.tasks.map((x,n)=>`<li><span>${esc(x.text)}</span><button data-u="${n}">↑</button><button data-x="${n}">✕</button></li>`).join('')}</ol>`;
  B.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{const x=sug[c.dataset.n],j=wiz.tasks.findIndex(y=>y.text===x);if(j>=0)wiz.tasks.splice(j,1);else wiz.tasks.push({text:x});renderOb()});
  const add=()=>{const v=$('taskIn').value.trim();if(v){wiz.tasks.push({text:v});renderOb();$('taskIn').focus()}};$('taskAdd').onclick=add;$('taskIn').onkeydown=e=>{if(e.key==='Enter')add()};
  B.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{const n=+b.dataset.u;if(n>0){[wiz.tasks[n-1],wiz.tasks[n]]=[wiz.tasks[n],wiz.tasks[n-1]];renderOb()}});
  B.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{wiz.tasks.splice(+b.dataset.x,1);renderOb()});wireMics()}
 else if(p==='days'){const dn=dayNames();B.innerHTML=`<div class="q">${esc(t('q4'))}</div>`+wiz.tasks.map((x,n)=>`<div class="tl"><li style="display:block"><b>${esc(x.text)}</b><div class="chips">${dn.map((d,j)=>`<button class="chip${!x.days||x.days.includes(j)?' on':''}" data-n="${n}" data-d="${j}">${d}</button>`).join('')}</div></li></div>`).join('');
  B.querySelectorAll('[data-d]').forEach(c=>c.onclick=()=>{const x=wiz.tasks[c.dataset.n],j=+c.dataset.d;let d=x.days||[0,1,2,3,4,5,6];d=d.includes(j)?d.filter(z=>z!==j):[...d,j].sort();x.days=d.length===7?undefined:d;renderOb()})}
 else if(p==='timers'){B.innerHTML=`<div class="q">${esc(t('q5'))}</div><ol class="tl">`+wiz.tasks.map((x,n)=>`<li><span>${esc(x.text)}</span><input type="number" min="0" step="0.5" data-n="${n}" value="${x.wait?x.wait/60:''}" placeholder="0" style="width:70px;font-size:1em;padding:6px"> ${esc(t('minutes'))}</li>`).join('')+'</ol>';
  B.querySelectorAll('input').forEach(i=>i.onchange=()=>{const x=wiz.tasks[i.dataset.n],m=+i.value||0;if(m>0){x.wait=Math.round(m*60);x.auto=true}else{delete x.wait;delete x.auto}})}
 else if(p==='praise'){B.innerHTML=`<div class="q">${esc(t('q6'))}</div>${choice([['every','🌟 '+t('pEvery')],['some','👍 '+t('pSome')],['end','🏁 '+t('pEnd')]],wiz.praise,'praise')}`}
 else if(p==='checkin'){B.innerHTML=`<div class="q">${esc(t('q7'))}</div>${choice([['120','✅ '+t('ckYes')],['0','✖️ '+t('ckNo')]],String(wiz.checkin),'checkin')}`}
 else if(p==='review'){if(!wiz.draft)wiz.draft=draftFromWiz();B.innerHTML=`<div class="q">${esc(t('review'))}</div><div id="rvSteps"></div>`;renderSteps($('rvSteps'),wiz.draft)}
 else if(p==='code'){const r=wiz.draft;B.innerHTML=`<div class="q">${esc(t('codeIt'))} ✨</div><label>${esc(t('rName'))}<div class="inrow"><input id="rnIn" value="${esc(r.name)}">${micBtn('rnIn')}</div></label>
  <div>${esc(t('icon'))}</div><div class="chips">${EMOJIS.map(e=>`<button class="chip emo${r.emoji===e?' on':''}" data-e="${e}">${e}</button>`).join('')}</div>
  <div>${esc(t('color'))}</div><div class="chips">${COLORS.map(c=>`<button class="sw${r.color===c?' on':''}" data-c2="${c}" style="background:${c}"></button>`).join('')}</div>
  <div class="bigicon" style="background:${r.color}">${r.emoji}</div><h3 style="text-align:center">${esc(r.name)}</h3>`;
  $('rnIn').onchange=$('rnIn').oninput=e=>{r.name=e.target.value;B.querySelector('h3').textContent=r.name};
  B.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{r.emoji=b.dataset.e;renderOb()});B.querySelectorAll('[data-c2]').forEach(b=>b.onclick=()=>{r.color=b.dataset.c2;renderOb()});wireMics()}
 else if(p==='kid'){B.innerHTML=`<div class="q">${esc(t('childQ'))}</div><div class="inrow"><input id="kidIn" value="${esc(setting('kid',''))}">${micBtn('kidIn')}</div>`;$('kidIn').onchange=$('kidIn').oninput=e=>LS.set('kid',e.target.value.trim());wireMics()}
 else if(p==='mode'){const m=setting('mode','touch');B.innerHTML=`<div class="q">${esc(t('modeQ'))}</div>${choice([['touch','👆 '+t('touch')],['voice','🎤 '+t('voice')]],m,'mode')}`+(m==='voice'?`<p class="muted">${esc(wiz.device==='ios'?t('speechIOS'):t('speechAndroid'))}</p>`:'')}
 else if(p==='hs')renderHS(B,OB_R);
 B.querySelectorAll('.choice').forEach(b=>b.onclick=()=>{const k=b.dataset.k,v=b.dataset.v;
  if(k==='device'){wiz.device=v;LS.set('device',v)}else if(k==='lang'){L=v;LS.set('lang',v)}else if(k==='type'){if(wiz.type!==v){wiz.type=v;wiz.tasks=[];wiz.draft=null;if(v==='bedtime')wiz.praise='every'}}
  else if(k==='praise')wiz.praise=v;else if(k==='checkin')wiz.checkin=+v;else if(k==='mode')LS.set('mode',v);renderOb()})}
function draftFromWiz(){const s=S(),names={morning:s.mName,bedtime:s.bName,homework:t('hw'),custom:t('custom')};
 const steps=wiz.tasks.map(x=>clone(x));if(wiz.type==='morning'&&setting('weather',true))steps.splice(Math.min(steps.length,5),0,{weather:true});
 return {id:'r'+Date.now().toString(36),name:names[wiz.type]||t('custom'),emoji:{morning:'☀️',bedtime:'🌙',homework:'📚'}[wiz.type]||'⭐',color:{morning:'#f97316',bedtime:'#1e3a8a',homework:'#16a34a'}[wiz.type]||'#7c3aed',
  lang:L,calm:wiz.type==='bedtime',praise:wiz.praise,checkin:wiz.checkin,time:wiz.time,steps}}
$('obBack').onclick=()=>{if(wiz.page==='review')collectSteps($('rvSteps'),wiz.draft);const i=wiz.pages.indexOf(wiz.page);if(i>0){wiz.page=wiz.pages[i-1];renderOb()}};
$('obNext').onclick=()=>{const p=wiz.page;
 if(p==='hs'){wiz={};return home()}
 if(p==='type'&&!wiz.type)return;
 if(p==='tasks'){const v=$('taskIn').value.trim();if(v)wiz.tasks.push({text:v});if(!wiz.tasks.length)return;wiz.draft=null}
 if(p==='review'){collectSteps($('rvSteps'),wiz.draft);if(!wiz.draft.steps.length)return}
 if(p==='code'){const R=allR();wiz.draft.name=wiz.draft.name.trim()||t('custom');R[wiz.draft.id]=wiz.draft;saveR(R);OB_R=wiz.draft}
 wiz.page=wiz.pages[wiz.pages.indexOf(p)+1];renderOb()};
// ---------- home-screen entry per routine ----------
function b64(o){return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function unb64(s){try{return JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/')))))}catch(e){return null}}
function launchUrl(r){return location.origin+location.pathname+'?r='+r.id+'#d='+b64({r,kid:setting('kid',''),mode:setting('mode','touch')})} // hash carries the routine: iOS home-screen web apps get their own empty storage
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
 if(!id)return false;const R=allR();if(data&&data.r&&!R[id]){R[id]=data.r;saveR(R);if(data.kid!=null&&!setting('kid',''))LS.set('kid',data.kid);if(data.mode&&!localStorage.mode)LS.set('mode',data.mode)}
 const r=allR()[id];if(!r)return false;if(!canRun()){show('paywall');return true}
 if(NATIVE){start(id);return true} // native TTS needs no tap
 setHeadFor(r);$('lIcon').style.background=r.color;$('lIcon').textContent=r.emoji;$('lName').textContent=r.name;$('lStart').onclick=()=>start(id);show('launch');return true} // browsers only allow speech after a tap
// ---------- weather (optional, device location) ----------
let TEMP=null;const FAHR=/^en-US/.test(navigator.language||'en-US');
function getWeather(){if(!setting('weather',true)||!navigator.geolocation)return;
 navigator.geolocation.getCurrentPosition(p=>{fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.coords.latitude.toFixed(2)}&longitude=${p.coords.longitude.toFixed(2)}&current=temperature_2m${FAHR?'&temperature_unit=fahrenheit':''}`)
  .then(r=>r.json()).then(d=>TEMP=d.current.temperature_2m).catch(()=>{})},()=>{},{timeout:8000,maximumAge:36e5})}
// ---------- runner ----------
let R=null,RS=null,steps=[],i=0,active=false,paused=false,voice=false,tm=[],check,run=0;
function weatherText(){if(TEMP==null)return RS.wNone;const n=Math.round(TEMP);return(n<(FAHR?50:10)?RS.wCold:RS.wMild).replace('{t}',n)}
const warm=()=>TEMP!=null&&TEMP>=(FAHR?65:18);
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
 i=0;active=true;paused=false;run++;keepAwake();const nm=setting('kid','');
 await say((r.calm?RS.greetB:RS.greetM).replace('{n}',nm?', '+nm:''));later(4000,()=>step(RS.first))}
function bar(){$('bar').style.width=(i/steps.length*100)+'%'}
async function step(intro){clr();if(i<steps.length&&steps[i].weather&&warm())steps.splice(i,1);if(i>=steps.length)return finish();
 const x=steps[i],me=i,r=run,txt=T(x),ad=typeof x==='object'&&x.auto===true;$('step').textContent=txt;bar();
 await say((intro?intro+' ':'')+txt+(ad?'':' '+(voice?RS.sayDone:RS.pressDone)));if(i!==me||r!==run)return;
 if(typeof x==='object'&&x.wait>0&&x.auto)later(x.wait*1000,()=>{if(i===me)next()});arm()}
function arm(){clearTimeout(check);const ms=(R.checkin??150)*1000;if(!ms)return;check=setTimeout(()=>{if(active&&!paused&&i<steps.length){say(RS.still.replace('{s}',T(steps[i]))+' '+(voice?RS.sayDone:RS.pressDone));arm()}},ms)}
function next(){if(!active||paused)return;clr();i++;if(i>=steps.length)return finish();
 const pm=R.praise||'every',give=pm==='every'||(pm==='some'&&i%3===0);const p=give?pick(R.calm?RS.calm:RS.praise):'';
 step((p+(i===steps.length-1&&pm!=='end'?' '+RS.last:'')).trim())}
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
function openEditor(id){EDR=clone(allR()[id]);show('edit');applyLang();$('erName').value=EDR.name;renderSteps($('erSteps'),EDR)}
$('erSave').onclick=()=>{collectSteps($('erSteps'),EDR);EDR.name=$('erName').value.trim()||EDR.name;const R=allR();R[EDR.id]=EDR;saveR(R);home()};
$('erHS').onclick=()=>{$('erSave').onclick();OB_R=allR()[EDR.id];wiz={page:'hs',single:true};show('ob');renderOb()};
$('erDel').onclick=()=>{if(!confirm(t('del')+'?'))return;const R=allR();delete R[EDR.id];saveR(R);home()};
// ---------- boot ----------
(async()=>{await SUB.init();applyLang();
 if(NATIVE&&NP('App')){NP('App').addListener('appUrlOpen',e=>routeLaunch(e.url));try{const u=await NP('App').getLaunchUrl();if(u&&u.url&&routeLaunch(u.url))return}catch(e){}}
 if(routeLaunch(location.href))return;
 if(!Object.keys(allR()).length)return startWizard(false);home()})();
if('serviceWorker'in navigator&&!NATIVE&&(location.protocol==='https:'||location.hostname==='127.0.0.1'||location.hostname==='localhost'))navigator.serviceWorker.register('sw.js').catch(()=>{});
