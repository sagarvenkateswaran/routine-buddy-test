// Subscription layer. Native: RevenueCat (@revenuecat/purchases-capacitor). Web preview: local stub (no real payments).
// Web testing: set localStorage.fakeCI to a RevenueCat-like customerInfo JSON, localStorage.fakeOffline='1' to simulate offline.
const DAY=864e5,OFFLINE_GRACE=3*DAY;
const SUB={
 REVENUECAT_IOS_KEY:'appl_REPLACE_ME',REVENUECAT_ANDROID_KEY:'goog_REPLACE_ME', // TODO(Sagar): public SDK keys only
 ENTITLEMENT:'pro',PRODUCTS:{monthly:'routinebuddy_pro_monthly',yearly:'routinebuddy_pro_yearly'},
 TRIAL_DAYS:7, // web preview only; native trial = store intro offer
 status:null,   // {active,willRenew,exp,billingIssue,product,managementURL,source:'live'|'cache'}
 offline:false,_cbs:[],
 native(){return window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform()&&Capacitor.Plugins.Purchases},
 fake(){try{return localStorage.fakeCI?JSON.parse(localStorage.fakeCI):null}catch(e){return null}},
 onChange(cb){this._cbs.push(cb)},
 _emit(){this._cbs.forEach(f=>{try{f(this.status)}catch(e){}})},
 // RevenueCat keeps the entitlement in entitlements.active during store billing grace periods, so "active" already covers grace.
 _apply(ci){const e=ci&&ci.entitlements&&ci.entitlements.active&&ci.entitlements.active[this.ENTITLEMENT];
  const ms=v=>v==null?null:(typeof v==='number'?v:Date.parse(v));
  this.status={active:!!e,willRenew:e?e.willRenew!==false:false,exp:e?ms(e.expirationDateMillis??e.expirationDate):null,
   billingIssue:e?ms(e.billingIssueDetectedAtMillis??e.billingIssueDetectedAt):null,product:e?e.productIdentifier:null,
   managementURL:ci&&ci.managementURL||null,source:'live',checkedAt:Date.now()};
  this.offline=false;try{localStorage.subCache=JSON.stringify(this.status)}catch(x){}this._emit()},
 _useCache(){this.offline=true;let c=null;try{c=JSON.parse(localStorage.subCache||'null')}catch(e){}
  this.status=c?Object.assign(c,{source:'cache'}):null;this._emit()},
 async init(){const P=this.native();
  if(P){try{const ios=Capacitor.getPlatform()==='ios';await P.configure({apiKey:ios?this.REVENUECAT_IOS_KEY:this.REVENUECAT_ANDROID_KEY});
    await P.addCustomerInfoUpdateListener(ci=>this._apply(ci&&ci.customerInfo||ci))}catch(e){console.warn('RevenueCat init failed',e)}
   const A=Capacitor.Plugins.App;if(A)A.addListener('resume',()=>this.refresh())}
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')this.refresh()});
  window.addEventListener('online',()=>this.refresh());
  await this.refresh()},
 async refresh(){const P=this.native();
  try{if(P){const r=await P.getCustomerInfo();this._apply(r.customerInfo||r)}
   else{if(localStorage.fakeOffline==='1')throw new Error('offline');const f=this.fake();
    if(f)this._apply(f);else if(localStorage.devPro==='1')this._apply({entitlements:{active:{pro:{willRenew:true,expirationDate:new Date(Date.now()+30*DAY).toISOString(),productIdentifier:this.PRODUCTS.monthly}}}});
    else this._apply({entitlements:{active:{}}})}}
  catch(e){this._useCache()}return this.hasPro()},
 hasPro(){const s=this.status;if(!s)return false;
  if(s.source==='cache'){if(s.active&&s.exp==null)return true;return !!(s.exp&&Date.now()<s.exp+OFFLINE_GRACE)} // offline: allow until cached expiry + 3 days
  return s.active},
 trialLeft(){let s=+localStorage.firstRun;if(!s){s=Date.now();localStorage.firstRun=s}return Math.max(0,this.TRIAL_DAYS-(Date.now()-s)/DAY)},
 hasAccess(){return this.hasPro()||(!this.native()&&this.trialLeft()>0)},
 // banners for the parent
 warning(){const s=this.status;if(!s||!s.active)return null;
  if(s.billingIssue)return 'billing';
  if(s.willRenew===false&&s.exp&&s.exp-Date.now()<3*DAY)return 'expiring';return null},
 manageURL(){const s=this.status;if(s&&s.managementURL)return s.managementURL;
  const plat=window.Capacitor&&Capacitor.getPlatform?Capacitor.getPlatform():(/Android/i.test(navigator.userAgent)?'android':'ios');
  return plat==='android'?'https://play.google.com/store/account/subscriptions?package=com.netzerostrategic.routinebuddy':'https://apps.apple.com/account/subscriptions'},
 storeName(){const a=(window.Capacitor&&Capacitor.getPlatform&&Capacitor.getPlatform()==='android')||/Android/i.test(navigator.userAgent);return a?'Google Play':'App Store'},
 async buy(which){const P=this.native();
  if(!P){if(confirm('Web preview: no real payment. Simulate an active subscription?')){localStorage.devPro='1';localStorage.removeItem('fakeCI');await this.refresh()}return this.hasPro()}
  try{const {current}=await P.getOfferings();const id=this.PRODUCTS[which];
   const pkg=current&&current.availablePackages.find(p=>p.product.identifier===id||p.packageType===(which==='monthly'?'MONTHLY':'ANNUAL'));
   if(!pkg)throw new Error('Product not found: '+id);const r=await P.purchasePackage({aPackage:pkg});this._apply(r.customerInfo)}catch(e){if(!e.userCancelled)alert(e.message||e)}return this.hasPro()},
 async restore(){const P=this.native();if(!P)return this.refresh();try{const r=await P.restorePurchases();this._apply(r.customerInfo||r)}catch(e){}return this.hasPro()}
};
