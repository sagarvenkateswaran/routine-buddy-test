// Speech layer: native Capacitor plugins when running as an app, Web Speech API in the browser.
const Cap=window.Capacitor,NATIVE=!!(Cap&&Cap.isNativePlatform&&Cap.isNativePlatform());
const NP=n=>NATIVE&&Cap.Plugins&&Cap.Plugins[n];
const Speech={lang:'en-US',onHeard:null,_rec:null,_on:false,_say:0,
 async speak(text){const id=++this._say;
  if(NP('TextToSpeech')){try{await NP('TextToSpeech').stop()}catch(e){}try{await NP('TextToSpeech').speak({text,lang:this.lang,rate:.9})}catch(e){}return}
  if(!window.speechSynthesis)return;
  return new Promise(res=>{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=this.lang;u.rate=.9;
   const v=speechSynthesis.getVoices().find(v=>v.lang&&v.lang.replace('_','-').toLowerCase().startsWith(this.lang.slice(0,2).toLowerCase()));if(v)u.voice=v;
   window._u=u;let f=false;const fin=()=>{if(!f){f=true;res()}};u.onend=fin;u.onerror=fin;
   setTimeout(fin,3000+text.length*120); // Android Chrome sometimes never fires onend
   speechSynthesis.speak(u)})},
 stopSpeaking(){this._say++;if(NP('TextToSpeech'))NP('TextToSpeech').stop().catch(()=>{});else if(window.speechSynthesis)speechSynthesis.cancel()},
 unlock(){try{if(!NATIVE&&window.speechSynthesis){const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u)}}catch(e){}},
 async micAvailable(){
  if(NP('SpeechRecognition')){const p=NP('SpeechRecognition');try{const a=await p.available();if(!a.available)return false;let s=await p.checkPermissions();
    if(s.speechRecognition!=='granted')s=await p.requestPermissions();return s.speechRecognition==='granted'}catch(e){return false}}
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return false;
  try{const s=await navigator.mediaDevices.getUserMedia({audio:true});s.getTracks().forEach(t=>t.stop())}catch(e){return false}
  const r=new SR();r.lang=this.lang;r.continuous=!/iPad|iPhone|iPod/.test(navigator.userAgent);r.interimResults=false;
  r.onresult=e=>{const t=e.results[e.results.length-1][0].transcript;this.onHeard&&this.onHeard(t)};
  r.onend=()=>{if(this._on)setTimeout(()=>{try{this._on&&r.start()}catch(e){}},250)};
  r.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed')this._on=false};
  this._rec=r;return true},
 async listen(){if(this._on)return;this._on=true;
  if(NP('SpeechRecognition')){const p=NP('SpeechRecognition');
   if(!this._l){this._l=await p.addListener('partialResults',d=>{const m=d.matches&&d.matches[0];if(m&&/\S/.test(m)){clearTimeout(this._pt);this._pt=setTimeout(()=>this.onHeard&&this.onHeard(m),900)}});
    p.addListener('listeningState',d=>{if(d.status==='stopped'&&this._on)setTimeout(()=>{this._on=false;this.listen()},300)})}
   try{await p.start({language:this.lang,partialResults:true,popup:false,maxResults:1})}catch(e){this._on=false;setTimeout(()=>this.listen(),1000)}return}
  try{this._rec&&this._rec.start()}catch(e){}},
 async pauseListening(){this._on=false;if(NP('SpeechRecognition'))try{await NP('SpeechRecognition').stop()}catch(e){};try{this._rec&&this._rec.abort()}catch(e){}}
};
// one-shot dictation for typed answers in the interview
Speech.dictate=async function(lang){
 if(NP('SpeechRecognition')){const p=NP('SpeechRecognition');try{let s=await p.checkPermissions();if(s.speechRecognition!=='granted')s=await p.requestPermissions();
   const r=await p.start({language:lang,partialResults:false,popup:true,maxResults:1});return (r&&r.matches&&r.matches[0])||''}catch(e){return ''}}
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return '';
 return new Promise(res=>{const r=new SR();r.lang=lang;r.interimResults=false;r.maxAlternatives=1;let t='';
  r.onresult=e=>{t=e.results[0][0].transcript};r.onend=()=>res(t);r.onerror=()=>res('');try{r.start()}catch(e){res('')}setTimeout(()=>{try{r.stop()}catch(e){}},8000)})};
