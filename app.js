/* ══ SPLASH: في PWA — شاشة "ديار مرحبتين في دارك" بس تظهر عند كل فتح للتطبيق (standalone) لمدة ثانيتين ══
   ملحوظة: قرار الإظهار (flex) أو الإخفاء (none) بيتحدد فورًا في <head>
   (قبل ما الصفحة ترسم) عشان منع أي "فلاش" للصفحة الحقيقية قبل الـ splash.
   هنا شغلنا بس إدارة توقيت الإخفاء بعد المدة المحددة. */
(function(){
  var splash  = document.getElementById('native-splash');
  var splash2 = document.getElementById('native-splash-2');
  if(splash) splash.style.display = 'none'; // شاشة الشعار ملغية
  if(!splash2) return;
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || window.navigator.standalone === true;

  // ملحوظة: الـ fullscreen بقى بيتحدد من manifest.json فقط ("display": "fullscreen")
  // وشلنا استدعاء Fullscreen API (requestFullscreen) من هنا لأنه كان بيتعارك مع
  // فُل-سكرين الـ PWA نفسها ويسبب تعليق التطبيق وتقلّبه بين fullscreen و standalone.

  if(isStandalone){
    splash2.style.display = 'flex';

    // ديار مرحبتين في دارك — تظهر لمدة ثانيتين (2000ms) بالظبط ثم تختفي
    setTimeout(function(){
      splash2.classList.add('hide');
      setTimeout(function(){ splash2.style.display = 'none'; }, 650);
    }, 2000);
  } else {
    splash2.style.display = 'none';
  }
})();

/* ════════ CONFIG ════════ */
var ADMIN_PHONE = '201040986955';
var CLOUDINARY_CLOUD = 'dkq9kctcv';
var CLOUDINARY_PRESET = 'fares7877';
var CLOUDINARY_API_KEY = '689424573773272';
var CLOUDINARY_API_SECRET = 'Hbq3ojyoT-aWDrBsmJYBdRfb5XI';
var ADMIN_PASS  = 'b57daaad0b664e373f69ed7c319d13a8027486cc775e9043e616a8415f6f54e0'; // fares2025 SHA-256
var ADMIN_NUMBER = '01040986955'; // local format

/* ════════ FIREBASE CONFIG ════════ */
var _firebaseConfig = {
  apiKey: "AIzaSyDdVzqTxPb4cdjYMr0vx2KgvfRblTLuDos",
  authDomain: "diyar-2b395.firebaseapp.com",
  projectId: "diyar-2b395",
  storageBucket: "diyar-2b395.firebasestorage.app",
  messagingSenderId: "209548395073",
  appId: "1:209548395073:web:e866d9698e35f7e8463cc0",
  measurementId: "G-MB951MNY4P"
};

/* ── Initialize Firebase (compat SDK loaded via CDN in index.html) ── */
var _fbApp, _db;
(function initFirebase(){
  if(typeof firebase === 'undefined'){ console.error('[ديار] Firebase SDK غير محمّل'); return; }
  if(!firebase.apps.length){ _fbApp = firebase.initializeApp(_firebaseConfig); }
  else { _fbApp = firebase.apps[0]; }
  _db = firebase.firestore();
  // Enable offline persistence for PWA
  _db.enablePersistence({synchronizeTabs:true}).catch(function(err){
    if(err.code === 'failed-precondition'){
      console.warn('[Firebase] persistence: multiple tabs open');
    } else if(err.code === 'unimplemented'){
      console.warn('[Firebase] persistence: not supported');
    }
  });
})();

/* ════════ FIREBASE HELPER FUNCTIONS ════════ */

/* fbCollection(name) → Firestore collection reference */
function fbCol(name){ return _db.collection(name); }

/* جيب وثيقة واحدة بـ id */
async function fbGetDoc(col, id){
  var snap = await _db.collection(col).doc(id).get();
  if(!snap.exists) return null;
  return Object.assign({id: snap.id}, snap.data());
}

/* جيب كل وثائق collection مع optional query */
async function fbGetAll(col, queryFn){
  var ref = _db.collection(col);
  if(queryFn) ref = queryFn(ref);
  var snap = await ref.get();
  return snap.docs.map(function(d){ return Object.assign({id: d.id}, d.data()); });
}

/* upsert وثيقة (merge) */
async function fbSet(col, id, data){
  await _db.collection(col).doc(id).set(data, {merge: true});
}

/* حذف وثيقة */
async function fbDelete(col, id){
  await _db.collection(col).doc(id).delete();
}

/* ════════ Legacy compatibility stubs (kept for minimal code change) ════════ */
var SUPABASE_URL = ''; // unused — kept to avoid ReferenceErrors in dead code
var SUPABASE_KEY = ''; // unused

/* ════════ CONFIRM MODAL — يجب أن يكون قبل أي استخدام ════════ */
var _confirmCb = null;

function showConfirmModal(opts){
  return new Promise(function(resolve){
    /* إذا لم يُحمَّل الـ DOM بعد — fallback مؤقت فقط */
    var overlay = document.getElementById('confirm-modal-overlay');
    if(!overlay){
      resolve(window.__nativeConfirm
        ? window.__nativeConfirm(opts.msg || opts.title || 'تأكيد؟')
        : true);
      return;
    }
    _confirmCb = resolve;
    document.getElementById('confirm-modal-icon').textContent   = opts.icon       || '⚠️';
    document.getElementById('confirm-modal-title').textContent  = opts.title      || 'تأكيد';
    document.getElementById('confirm-modal-msg').textContent    = opts.msg        || '';
    document.getElementById('confirm-modal-cancel').textContent = opts.cancelText || 'إلغاء';

    var ok = document.getElementById('confirm-modal-ok');
    ok.textContent      = opts.okText || 'تأكيد';
    ok.style.background = opts.okColor || 'linear-gradient(135deg,#dc2626,#b91c1c)';

    var isDanger = !opts.okColor
      || opts.okColor.indexOf('dc2626') !== -1
      || opts.okColor.indexOf('b91c1c') !== -1
      || opts.okColor.indexOf('7f1d1d') !== -1
      || opts.okColor.indexOf('991b1b') !== -1;

    ok.style.boxShadow = isDanger
      ? '0 4px 18px rgba(220,38,38,.35)'
      : '0 4px 18px rgba(26,47,94,.35)';

    var iconWrap = document.querySelector('.cm-icon-wrap');
    if(iconWrap) iconWrap.classList.toggle('danger', isDanger);

    overlay.style.display = 'flex';
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        var box = document.getElementById('confirm-modal-box');
        if(box) box.style.transform = 'translateY(0)';
      });
    });
  });
}

function _confirmResolve(val){
  var box = document.getElementById('confirm-modal-box');
  if(box) box.style.transform = 'translateY(100%)';
  setTimeout(function(){
    var overlay = document.getElementById('confirm-modal-overlay');
    if(overlay) overlay.style.display = 'none';
    if(_confirmCb){ _confirmCb(val); _confirmCb = null; }
  }, 380);
}

function _confirmOverlayClick(e){
  if(e.target === document.getElementById('confirm-modal-overlay')) _confirmResolve(false);
}

/* حفظ confirm الأصلية قبل أي شيء آخر — لا نحذفها */
window.__nativeConfirm = window.confirm.bind(window);

/* ════════ SECURITY: HTML ESCAPE (XSS Prevention) ════════ */
function escapeHTML(str){
  if(str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

/* ── تنسيق تاريخ الانضمام للعرض: يقبل ISO أو نص عربي قديم ── */
function _fmtJoinDate(raw){
  if(!raw) return '—';
  var d = new Date(raw);
  if(!isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}T/.test(String(raw))){
    return d.toLocaleDateString('ar-EG', {year:'numeric', month:'short', day:'numeric'});
  }
  // نص عربي قديم مش ISO — اعرضه زي ما هو
  return raw;
}

/* ════════ PASSWORD SECURITY ════════ */
async function hashPassword(password){
  try{
    var encoder = new TextEncoder();
    var data = encoder.encode(password + 'diyar_salt_2025');
    var hashBuffer = await crypto.subtle.digest('SHA-256', data);
    var hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
  } catch(e){ return password; } // fallback if crypto not available
}
async function verifyPassword(input, stored){
  if(!stored) return false;
  if(stored.length !== 64) return input === stored;
  try{
    var hashed = await hashPassword(input);
    return hashed === stored;
  }catch(e){
    console.error('verifyPassword error:',e);
    return false;
  }
}

/* ════════ STATE ════════ */
var propType='', dealType='', nearSea='', finishVal='', aptFurnish='', aptPayment='', shopPayment='', chaletPool='';
var _vsAllAds=[], _vsPage=0, _vsPageSize=25, _vsLoading=false;
var selectedChips={}, uploadedPhotos=[];
var _uploadedPhotoFiles = [];
var MAX_IMAGES = 5;
var MAX_VIDEOS = 5;
var uploadedPhotoTypes = []; // 'image' | 'video' لكل عنصر في uploadedPhotos بالتوازي
var _regPhotoData = '';
var _userSyncInterval = null;
var currentFilter='الكل';
var currentSubregionFilter='الكل';
var currentPropTypeFilter='الكل'; // فلتر شقة/بيت داخل صفحة الإعلانات
var currentSort='default';
var headerTaps=0, headerTimer;
var currentUser = null; // {phone, isAdmin}

/* ════════ OneSignal — إشعارات ════════ */
var ONESIGNAL_APP_ID = '222b457d-01f7-4eb0-b051-1bc36ae92bab';
var ONESIGNAL_REST_API_KEY = 'os_v2_app_eivuk7ib65hlbmcrdpbwv2jlvnqgkz62ecweu2ezhyjdncou622admvky4qxhvfd35gxye33q7iiyy3ansjpst5wydy35a5jinimety';

/* اربط الجهاز الحالي برقم هاتف المستخدم (External ID) عشان نقدر نبعتله إشعار مخصص لاحقًا */
function osIdentifyUser(phone, accountType){
  if(!phone) return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function(OneSignal){
    try{
      await OneSignal.login(String(phone));
      OneSignal.User.addTag('role', accountType || 'user');
    }catch(e){ console.warn('[OneSignal] identify error:', e); }
  });
}

/* فك ربط الجهاز عند تسجيل الخروج */
function osLogoutUser(){
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function(OneSignal){
    try{ await OneSignal.logout(); }catch(e){}
  });
}

/* إرسال إشعار لمستخدم واحد معين (برقم هاتفه) */
async function sendPushToUser(phone, title, body, url){
  if(!phone) return;
  try{
    await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Key ' + ONESIGNAL_REST_API_KEY
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        include_aliases: { external_id: [String(phone).replace(/\s/g,'')] },
        target_channel: 'push',
        headings: { en: title, ar: title },
        contents: { en: body, ar: body },
        url: url || 'https://dyarapp.vercel.app/'
      })
    });
  }catch(e){ console.warn('[OneSignal] sendPushToUser error:', e); }
}

/* إرسال لكل المستخدمين اللي عندهم Tag معين (مثلاً role=broker) */
async function sendPushToSegmentTag(tagKey, tagValue, title, body, url){
  try{
    await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Key ' + ONESIGNAL_REST_API_KEY
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        target_channel: 'push',
        filters: [{ field: 'tag', key: tagKey, relation: '=', value: tagValue }],
        headings: { en: title, ar: title },
        contents: { en: body, ar: body },
        url: url || 'https://dyarapp.vercel.app/'
      })
    });
  }catch(e){ console.warn('[OneSignal] sendPushToSegmentTag error:', e); }
}
var featuredEnabled = false;
var _currentScreenId = 'home'; // الصفحة الحالية المعروضة — تُستخدم لتلوين شريط الحالة
var _homeBrowseMode = false; // true لو السمسار/المالك فاتح صفحة "تصفح" (نفس صفحة الرئيسية بس بعرض المصيف/مقيم)

/* ════════ THEME TOGGLE ════════ */
/* لون شريط الحالة الافتراضي للصفحات العادية (مالهاش هيدر خاص) — نفس لون خلفية الصفحة */
var PAGE_BG_COLORS = { dark: '#f5f2ea', light: '#e8f6ff' };

/* ألوان شريط الحالة الخاصة بكل صفحة (لو الصفحة عندها هيدر/خلفية مميزة بلون ثابت لا يتغير مع الثيم) */
var SCREEN_THEME_COLORS = {
  home: { dark: '#0a1628', light: '#29abe2' }, // هيدر التطبيق (كحلي/أزرق حسب الثيم)
  success: { dark: '#0a3d62', light: '#0a3d62' } // هيرو صفحة نجاح الإعلان (أخضر مزرق ثابت)
};
/* باقي الصفحات (المصيف، سكن واستثمار، الإعلانات، إضافة إعلان، الحساب...) لا تملك هيدر خاص بها
   وتعرض خلفية الصفحة العادية (كريمي في الوضع الغامق، أزرق سماوي فاتح في الوضع الفاتح) */

var _currentThemeMode = 'dark';

function _updateThemeColorMeta(mode, screenId){
  mode = 'dark'; // ✅ تم حذف الوضع الفاتح بالكامل — التطبيق غامق دائماً
  var color;
  var special = screenId && SCREEN_THEME_COLORS[screenId];
  if(special){
    color = special[mode] || special.dark;
  } else {
    color = PAGE_BG_COLORS[mode] || PAGE_BG_COLORS.dark;
  }
  var meta = document.querySelector('meta[name="theme-color"]');
  if(!meta){
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', color);
}


var _adCodeLock = Promise.resolve(); // mutex — يمنع استدعاءين متزامنين يولّدان نفس الكود
var _AD_CODE_TIMEOUT_MS = 15000; // مهلة معقولة حتى على نت ضعيف — بعدها نستخدم fallback محلي فوراً
async function getNextAdCode(){
  var result = await (_adCodeLock = _adCodeLock.then(async function(){
    try{
      // استخدم Firestore transaction لضمان الـ atomicity، بمهلة زمنية تمنع التعليق على نت ضعيف
      var counterRef = _db.collection('settings').doc('ad_counter');
      var next = await (function(){
        var txPromise = _db.runTransaction(async function(t){
          var doc = await t.get(counterRef);
          var current = doc.exists ? (parseInt(doc.data().value)||100) : 100;
          var n = current + 1;
          t.set(counterRef, {key:'ad_counter', value: String(n)}, {merge:true});
          return n;
        });
        return typeof _withTimeout === 'function'
          ? _withTimeout(txPromise, _AD_CODE_TIMEOUT_MS, 'انتهت مهلة توليد كود الإعلان')
          : txPromise;
      })();
      localStorage.setItem('fares_ad_counter', next);
      return 'MT-' + next;
    } catch(e){
      var n = parseInt(localStorage.getItem('fares_ad_counter')||'100') + 1;
      localStorage.setItem('fares_ad_counter', n);
      return 'MT-' + n;
    }
  }).catch(function(e){
    var n = parseInt(localStorage.getItem('fares_ad_counter')||'100') + 1;
    localStorage.setItem('fares_ad_counter', n);
    return 'MT-' + n;
  }));
  return result;
}

/* ════════ VIEWS ════════ */
function loadViews(){ try{return JSON.parse(localStorage.getItem('fares_views')||'{}')}catch(e){return {};} }
function saveViews(v){ localStorage.setItem('fares_views', JSON.stringify(v)); }
function getViews(id){ var v=loadViews(); return v[id]||0; }
function incrementViews(id){
  var v=loadViews(); v[id]=(v[id]||0)+1; saveViews(v);
  // مزامنة في الخلفية مع Firebase
  (async function(){
    try{
      await fbSet('settings', 'views_'+id, {key:'views_'+id, value: String(v[id])});
    } catch(e){ /* صامت */ }
  })();
  return v[id];
}

/* ════════ FAVORITES — Firestore primary, localStorage fallback ════════ */
var _favsCache = null; // in-memory cache

function _favsDocRef(phone){
  return _db.collection('users_data').doc(phone || 'guest');
}

function loadFavs(){
  // 1. من الـ in-memory cache أولاً
  if(_favsCache !== null) return _favsCache;
  // 2. من localStorage كـ fallback
  try{ return JSON.parse(localStorage.getItem('fares_favs')||'[]'); }catch(e){ return []; }
}

function saveFavs(f){
  _favsCache = f;
  // دائماً احفظ في localStorage كـ fallback
  try{ localStorage.setItem('fares_favs', JSON.stringify(f)); }catch(e){}
  // ازامن مع Firestore في الخلفية
  var phone = currentUser && currentUser.phone;
  if(phone && _db){
    try{
      _favsDocRef(phone).set({favs: f, favs_updated: new Date().toISOString()},{merge:true})
        .catch(function(e){ console.warn('[ديار] saveFavs Firestore:', e.message); });
    }catch(e){}
  }
}

/* تحميل المفضلة من Firestore عند تسجيل الدخول */
async function loadFavsFromDB(phone){
  if(!phone || !_db) return;
  try{
    var doc = await _favsDocRef(phone).get();
    if(doc.exists && doc.data().favs){
      var dbFavs = doc.data().favs;
      _favsCache = dbFavs;
      try{ localStorage.setItem('fares_favs', JSON.stringify(dbFavs)); }catch(e){}
      updateFavsCard();
    }
  }catch(e){ console.warn('[ديار] loadFavsFromDB:', e.message); }
}


function isFav(id){ return loadFavs().indexOf(id)!==-1; }
function toggleFav(id, event){
  if(event) event.stopPropagation();
  var f=loadFavs(), idx=f.indexOf(id);
  if(idx===-1){ f.push(id); saveFavs(f); toast('❤️ أُضيف للمفضلة'); }
  else { f.splice(idx,1); saveFavs(f); toast('💔 أُزيل من المفضلة'); }
  var btn=document.getElementById('fav-'+id);
  if(btn){ btn.textContent=isFav(id)?'❤️':'🤍'; btn.classList.toggle('on',isFav(id)); }
  updateFavsCard();
}

/* ════════ HOME FEATURED ADS ════════ */
/* ════════ RECENTLY VIEWED — Firestore primary, localStorage fallback ════════ */
var _RV_KEY = 'diyar_recently_viewed';
var _RV_MAX = 10;
var _rvCache = null; // in-memory cache

function _rvDocRef(phone){
  return _db.collection('users_data').doc(phone || 'guest');
}

function _loadRecentlyViewed(){
  if(_rvCache !== null) return _rvCache;
  try{ return JSON.parse(localStorage.getItem(_RV_KEY)||'[]'); }catch(e){ return []; }
}
function _saveRecentlyViewed(list){
  _rvCache = list;
  try{ localStorage.setItem(_RV_KEY, JSON.stringify(list)); }catch(e){}
  // مزامنة Firestore في الخلفية
  var phone = currentUser && currentUser.phone;
  if(phone && _db){
    try{
      _rvDocRef(phone).set({recently_viewed: list, rv_updated: new Date().toISOString()},{merge:true})
        .catch(function(e){ console.warn('[ديار] _saveRecentlyViewed Firestore:', e.message); });
    }catch(e){}
  }
}

/* تحميل Recently Viewed من Firestore عند تسجيل الدخول */
async function loadRecentlyViewedFromDB(phone){
  if(!phone || !_db) return;
  try{
    var doc = await _rvDocRef(phone).get();
    if(doc.exists && doc.data().recently_viewed){
      var dbRv = doc.data().recently_viewed;
      _rvCache = dbRv;
      try{ localStorage.setItem(_RV_KEY, JSON.stringify(dbRv)); }catch(e){}
    }
  }catch(e){ console.warn('[ديار] loadRecentlyViewedFromDB:', e.message); }
}


function _trackRecentlyViewed(id){
  if(!id) return;
  var list = _loadRecentlyViewed().filter(function(x){ return x.id !== id; });
  list.unshift({id: id, ts: Date.now()});
  if(list.length > _RV_MAX) list = list.slice(0, _RV_MAX);
  _saveRecentlyViewed(list);
}
function clearRecentlyViewed(){
  _saveRecentlyViewed([]);
  renderFeaturedAds(); // هترجع تلقائياً لوضع "أحدث الإعلانات"
}
function _rvTimeLabel(ts){
  var diff = Date.now() - ts;
  var m = Math.floor(diff / 60000);
  if(m < 1)  return 'الآن';
  if(m < 60) return 'منذ ' + m + ' د';
  var h = Math.floor(m / 60);
  if(h < 24) return 'منذ ' + h + ' س';
  var d = Math.floor(h / 24);
  return 'منذ ' + d + ' يوم';
}

function renderFeaturedAds(){
  var section    = document.getElementById('home-featured-section');
  var scroll     = document.getElementById('home-featured-scroll');
  var titleEl    = document.getElementById('home-section-title');
  var actionEl   = document.getElementById('home-section-action');
  if(!section || !scroll) return;

  // أخفِ القسم للسمسار / المالك / الأدمن
  var _bp = loadBrokerProfile();
  var hasProfile = !!(_bp && _bp.name);
  var isAdm = !!(currentUser && currentUser.isAdmin);
  if(hasProfile || isAdm){ section.style.display = 'none'; return; }

  var db      = loadDB();
  var allAds  = db.approved || [];
  var rvList  = _loadRecentlyViewed();
  var hasRV   = rvList.length > 0;

  var propLabel = {apt:'شقة', house:'بيت', chalet:'شاليه', land:'أرض', shop:'محل'};
  var propIcon  = {apt:'🏠', house:'🏡', chalet:'🏖️', land:'🌿', shop:'🏪'};
  var propBg    = {
    apt:   {bg:'linear-gradient(135deg,#e8f4fd,#c8e8ff)', iconBg:'linear-gradient(135deg,#3b82f6,#60a5fa)'},
    house: {bg:'linear-gradient(135deg,#fff4e6,#ffe2c0)',  iconBg:'linear-gradient(135deg,#d97706,#f59e0b)'},
    chalet:{bg:'linear-gradient(135deg,#e0fbfc,#bdf0f5)',  iconBg:'linear-gradient(135deg,#0891b2,#22d3ee)'},
    land:  {bg:'linear-gradient(135deg,#e6faf5,#b8f0d8)',  iconBg:'linear-gradient(135deg,#059669,#34d399)'},
    shop:  {bg:'linear-gradient(135deg,#faf5ff,#ede9fe)',  iconBg:'linear-gradient(135deg,#7c3aed,#a78bfa)'}
  };

  function _buildCard(a, timeBadge){
    var style  = propBg[a.propType] || propBg.apt;
    var label  = propLabel[a.propType] || 'عقار';
    var icon   = propIcon[a.propType]  || '🏠';
    var imgContent = (a.photos && a.photos.length)
      ? '<img src="'+a.photos[0]+'" style="width:100%;height:100%;object-fit:cover">'
      : '<div class="hf-img-icon" style="background:'+style.iconBg+'">'+icon+'</div>';
    var dealColor = a.dealType === 'sale' ? '#0a1628' : '#0077b6';
    var dealLabel = a.dealType === 'sale' ? 'تمليك' : (a.rentType || 'إيجار');
    var priceUnit = '';
    if(a.dealType === 'rent'){
      if(a.rentType === 'يومي')        priceUnit = 'ج.م / يوم';
      else if(a.rentType === 'أسبوعي') priceUnit = 'ج.م / أسبوع';
      else if(a.rentType === 'شهري صيفي' || a.rentType === 'شهري') priceUnit = 'ج.م / شهر';
      else priceUnit = 'ج.م / سنة';
    } else { priceUnit = 'ج.م'; }
    var tags = [];
    if(a.size)       tags.push('<span class="hf-tag hf-tag-blue">'+((a.propType==='apt'||a.propType==='house'||a.propType==='chalet')?a.size+' غرف':a.size+' م²')+'</span>');
    if(a.aptArea)    tags.push('<span class="hf-tag hf-tag-blue">'+a.aptArea+' م²</span>');
    if(a.aptFurnish) tags.push('<span class="hf-tag hf-tag-purple">'+a.aptFurnish+'</span>');
    if(a.finishVal)  tags.push('<span class="hf-tag hf-tag-green">'+a.finishVal+'</span>');
    var seaLine = a.nearSea
      ? '<div class="hf-sea">🌊 '+a.nearSea+'</div>'
      : '<div class="hf-sea" style="visibility:hidden">_</div>';
    return '<div class="hf-card" onclick="openPropModal(\''+a.id+'\')">' +
      '<div class="hf-img" style="background:'+style.bg+'">' +
        imgContent +
        '<div class="hf-deal-badge" style="background:'+dealColor+'">'+dealLabel+'</div>' +
        (timeBadge ? '<div class="hf-time-badge">'+timeBadge+'</div>' : '') +
        (a.adCode ? '<div class="hf-code-badge">#'+a.adCode+'</div>' : '') +
      '</div>' +
      '<div class="hf-body">' +
        '<div class="hf-name">'+label+(a.compoundName?' — '+escapeHTML(a.compoundName):'')+' — '+escapeHTML(a.subRegion?a.subRegion+'، '+a.region:a.region)+'</div>' +
        seaLine +
        '<div class="hf-tags">'+tags.join('')+'</div>' +
        '<div class="hf-footer">' +
          '<div class="hf-price">'+Number(a.price).toLocaleString('ar-EG')+' <span>'+priceUnit+'</span></div>' +
          '<button class="hf-btn">تفاصيل</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  if(hasRV){
    // ── وضع: شاهدتها مؤخراً ──
    var rvAds = [];
    rvList.forEach(function(rv){
      var ad = allAds.find(function(a){ return a.id === rv.id; });
      if(ad) rvAds.push({ad: ad, ts: rv.ts});
    });
    if(!rvAds.length){ section.style.display = 'none'; return; }
    if(titleEl)  titleEl.textContent  = '🕐 شاهدتها مؤخراً';
    if(actionEl){ actionEl.textContent = 'مسح ›'; actionEl.style.color = '#aaa'; actionEl.onclick = function(){ clearRecentlyViewed(); }; }
    scroll.innerHTML = rvAds.map(function(item){ return _buildCard(item.ad, _rvTimeLabel(item.ts)); }).join('');
  } else {
    // ── وضع: أحدث الإعلانات — المميزة أولاً ──
    var featuredAds = allAds.filter(function(a){ return !!a.featured; }).reverse();
    var nonFeatured = allAds.filter(function(a){ return !a.featured; }).slice(-5).reverse();
    // دمج: المميزة أولاً ثم الأحدث (حتى 8 إعلانات)
    var latestAds = featuredAds.concat(nonFeatured).slice(0, 8);
    if(!latestAds.length){ section.style.display = 'none'; return; }
    if(titleEl)  titleEl.textContent  = featuredAds.length ? '⭐ إعلانات مميزة وأحدث العروض' : '🔥 أحدث الإعلانات';
    if(actionEl){ actionEl.textContent = 'عرض الكل ›'; actionEl.style.color = '#0077b6'; actionEl.onclick = function(){ go('tourist'); }; }
    scroll.innerHTML = latestAds.map(function(a){ return _buildCard(a, a.featured ? '⭐ مميز' : 'جديد'); }).join('');
  }
  section.style.display = 'block';
}

function updateFavsCard(){
  var f=loadFavs(), card=document.getElementById('favs-card');
  if(!card) return;
  if(f.length>0){ card.style.display='flex'; var _fcs=document.getElementById('favs-card-sub'); if(_fcs) _fcs.textContent=f.length+' عقار محفوظ'; }
  else card.style.display='none';
}
function renderFavs(){
  var f=loadFavs();
  var sub=document.getElementById('favs-sub'), grid=document.getElementById('favs-grid');
  var cachedDb=loadDB();
  // عرض من الـ cache فوراً لو فيه بيانات
  var favAds=(cachedDb.approved||[]).filter(a=>f.indexOf(a.id)!==-1);
  if(favAds.length){
    sub.textContent = favAds.length + ' عقار محفوظ';
    grid.innerHTML = buildAdCards(favAds);
  } else {
    sub.textContent='';
    grid.innerHTML='<div style="text-align:center;padding:40px 20px;color:#8a9ab8"><div style="font-size:36px;margin-bottom:12px">⏳</div><div style="font-size:14px;font-weight:700">جاري التحميل...</div></div>';
  }
  // تحديث من Supabase دايماً
  loadDBAsync().then(function(db){
    var favAds2=(db.approved||[]).filter(a=>f.indexOf(a.id)!==-1);
    if(!favAds2.length){
      sub.textContent='';
      grid.innerHTML='<div class="favs-empty"><div class="eico">🤍</div><div style="font-weight:700;font-size:16px;color:#1a2744;margin-bottom:6px">لا توجد مفضلات بعد</div><div style="font-size:13px">اضغط ❤️ على أي إعلان لحفظه</div></div>';
      return;
    }
    sub.textContent = favAds2.length + ' عقار محفوظ';
    grid.innerHTML = buildAdCards(favAds2);
  }).catch(function(){/* الـ cache يكفي */});
}
/* transferPhoto: يُستخدم داخل دوال النموذج فقط */

/* ── يلفّ أي Promise بمهلة زمنية، عشان الاتصال الضعيف ميعلقش التطبيق للأبد ── */
function _withTimeout(promise, ms, timeoutMsg){
  return new Promise(function(resolve, reject){
    var settled = false;
    var timer = setTimeout(function(){
      if(settled) return;
      settled = true;
      reject(new Error(timeoutMsg || 'انتهت مهلة الاتصال بالسيرفر'));
    }, ms);
    promise.then(function(val){
      if(settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(val);
    }, function(err){
      if(settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
  });
}

// ✅ حفظ الإعلان في Firebase — محاولة واحدة فقط (بدون إعادة محاولة تلقائية)
var _SAVE_AD_TIMEOUT_MS = 25000; // 25 ثانية مهلة للمحاولة الوحيدة

async function _upsertAdSB(ad, status, onRetry){
  await _withTimeout(
    fbSet('ads', String(ad.id), {
      id: ad.id,
      data: ad,
      status: status,
      updated_at: new Date().toISOString()
    }),
    _SAVE_AD_TIMEOUT_MS,
    'تعذّر إرسال الإعلان، تحقق من اتصال الإنترنت وحاول مجدداً'
  );
}

/* ════════ sbFetch — DEPRECATED (replaced by Firebase) ════════ */
/* Kept as stub to avoid ReferenceError from any missed call sites */
async function sbFetch(path, opts){
  console.warn('[ديار] sbFetch called (should be replaced):', path);
  return [];
}

/* ════════ STORAGE — Firebase Firestore + localStorage fallback ════════ */
var _dbCache = null;
var _dbCacheTime = 0;
var _dbFetchPromise = null;

async function loadDBAsync(forceRefresh){
  if(_dbFetchPromise && !forceRefresh) return _dbFetchPromise;

  var cacheAge = Date.now() - _dbCacheTime;
  if(!forceRefresh && _dbCache && cacheAge < 60000) return _dbCache;
  _dbFetchPromise = (async function(){
    try{
      var snap = await _db.collection('ads').orderBy('updated_at','desc').get();
      var pending = [], approved = [];
      snap.docs.forEach(function(d){
        var r = d.data();
        if(!r.data || typeof r.data !== 'object') return;
        var ad = Object.assign({}, r.data, {id: r.id || d.id, _sbStatus: r.status});
        if(r.status === 'approved') approved.push(ad);
        else pending.push(ad);
      });
      var db = {pending: pending, approved: approved};
      _dbCache = db;
      _dbCacheTime = Date.now();
      try{ localStorage.setItem('fares_db_cache', JSON.stringify(db)); }catch(e){}
      return db;
    } catch(e){
      console.error('loadDBAsync error:', e.message);
      if(!_dbCache){
        try{
          var saved = localStorage.getItem('fares_db_cache');
          if(saved){ _dbCache = JSON.parse(saved); }
        }catch(_e){}
      }
      return _dbCache || {pending:[], approved:[]};
    } finally {
      _dbFetchPromise = null;
    }
  })();
  return _dbFetchPromise;
}

function loadDB(){
  if(_dbCache) return _dbCache;
  // ✅ FIX 2: استرجع من localStorage لو الـ cache فاضي (بعد إغلاق التطبيق وفتحه)
  try{
    var saved = localStorage.getItem('fares_db_cache');
    if(saved){ _dbCache = JSON.parse(saved); return _dbCache; }
  }catch(e){}
  return {pending:[], approved:[]};
}

async function saveAdToSB(ad, status){
  status = status || 'pending';
  await _upsertAdSB(ad, status);
  _dbCacheTime = 0; // أبطل الـ cache عشان الـ fetch الجاي يجيب أحدث
  try{ await loadDBAsync(true); } catch(e){}
}

async function deleteAdFromSB(id){
  try{
    await fbDelete('ads', String(id));
    _dbCacheTime = 0;
  } catch(err){
    _dbCacheTime = 0;
    console.error('deleteAdFromSB error:', err.message);
  }
}

function saveDB(db){
  if(!db) return;
  if(!db.pending) db.pending=[];
  if(!db.approved) db.approved=[];
  _dbCache = db;
  // ✅ FIX: احفظ في localStorage عشان التعديلات المحلية تتحفظ
  try{ localStorage.setItem('fares_db_cache', JSON.stringify(db)); }catch(e){}
}

var _usersCache = null;
async function loadUsersAsync(){
  try{
    var snap = await _db.collection('users').get();
    var normalized = snap.docs.map(function(d){
      var r = d.data();
      return Object.assign({}, r, {
        joinedAt: r.joinedAt || r.joined_at || '',
        profile_name: r.profile_name != null ? r.profile_name : '',
        profile_type: r.profile_type != null ? r.profile_type : '',
        profile_phone: r.profile_phone != null ? r.profile_phone : '',
        profile_photo: r.profile_photo != null ? r.profile_photo : ''
      });
    });
    _usersCache = normalized;
    // ✅ FIX 3: احفظ المستخدمين في localStorage
    try{ localStorage.setItem('fares_users_cache', JSON.stringify(normalized)); }catch(e){}
    return normalized;
  } catch(e){
    console.error('loadUsersAsync error:', e.message);
    // ✅ FIX 3: استرجع من localStorage لو فشل الاتصال
    if(!_usersCache){
      try{
        var savedU = localStorage.getItem('fares_users_cache');
        if(savedU){ _usersCache = JSON.parse(savedU); }
      }catch(_e){}
    }
    return _usersCache || [];
  }
}
function loadUsers(){
  if(_usersCache) return _usersCache;
  // ✅ FIX 4: استرجع من localStorage لو الـ cache فاضي
  try{
    var savedU = localStorage.getItem('fares_users_cache');
    if(savedU){ _usersCache = JSON.parse(savedU); return _usersCache; }
  }catch(e){}
  return [];
}
async function saveUserToSB(user){
  try{
    var payload = {
      phone: user.phone,
      blocked: user.blocked||false,
      joined_at: user.joinedAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if(user.profile_name) payload.profile_name = user.profile_name;
    if(user.profile_type) payload.profile_type = user.profile_type;
    if(user.profile_phone) payload.profile_phone = user.profile_phone;
    if(user.profile_photo !== undefined) payload.profile_photo = user.profile_photo;
    if(user.password) payload.password = user.password;
    if(user.verified !== undefined) payload.verified = user.verified;
    // Use phone as doc ID (replace + and spaces)
    var docId = (user.phone||'').replace(/[^0-9a-zA-Z]/g,'_');
    await fbSet('users', docId, payload);
  } catch(e){ console.error('saveUserToSB error:', e.message); }
}
function saveUsers(u){
  _usersCache = u;
  // ✅ FIX: احفظ في localStorage عشان المستخدمين الجدد يتحفظوا
  try{ localStorage.setItem('fares_users_cache', JSON.stringify(u)); }catch(e){}
}

var _settingsCache = null;
async function loadSettingsAsync(){
  try{
    var snap = await _db.collection('settings').get();
    var s = {};
    snap.docs.forEach(function(d){
      var r = d.data();
      try{ s[r.key]=JSON.parse(r.value); }catch(e){ s[r.key]=r.value; }
    });
    _settingsCache = s;
    try{ localStorage.setItem('fares_settings_cache', JSON.stringify(s)); }catch(e){}
    return s;
  } catch(e){
    console.error('loadSettingsAsync error:', e.message);
    if(!_settingsCache){
      try{
        var savedS = localStorage.getItem('fares_settings_cache');
        if(savedS){ _settingsCache = JSON.parse(savedS); }
      }catch(_e){}
    }
    return _settingsCache || {};
  }
}
function loadSettings(){
  if(_settingsCache) return _settingsCache;
  // ✅ FIX 6: استرجع من localStorage لو الـ cache فاضي
  try{
    var savedS = localStorage.getItem('fares_settings_cache');
    if(savedS){ _settingsCache = JSON.parse(savedS); return _settingsCache; }
  }catch(e){}
  return {};
}

/* ════════ تطابق أسماء الأحياء (مرسى مطروح) — يُستخدم لتجميع الأسماء المتشابهة في فلتر واحد ════════ */

/* ── تطبيع اسم الحي: إزالة المسافات الزايدة، توحيد الألف/الهمزة/التاء المربوطة، إلخ ──
   ده يخلي "العوام" و"العوام " و"الـعوام" و"العوامً" تُحسب نفس الاسم منطقياً */
function _normalizeAreaName(s){
  if(!s) return '';
  return s.toString()
    .trim()
    .replace(/\s+/g,' ')                 // مسافات متعددة → مسافة واحدة
    .replace(/[\u064B-\u0652]/g,'')       // إزالة التشكيل
    .replace(/[إأآا]/g,'ا')               // توحيد أشكال الألف
    .replace(/ى/g,'ي')                    // الألف المقصورة → ياء
    .replace(/ة/g,'ه')                    // تاء مربوطة → هاء
    .replace(/ؤ/g,'و').replace(/ئ/g,'ي')
    .toLowerCase();
}

/* ── مسافة Levenshtein (عدد التعديلات: إضافة/حذف/تبديل حرف) بين نصين ── */
function _levenshteinDistance(a, b){
  if(a===b) return 0;
  var al=a.length, bl=b.length;
  if(al===0) return bl;
  if(bl===0) return al;
  var prev = new Array(bl+1);
  for(var j=0;j<=bl;j++) prev[j]=j;
  for(var i=1;i<=al;i++){
    var cur=[i];
    for(var j2=1;j2<=bl;j2++){
      var cost = a[i-1]===b[j2-1] ? 0 : 1;
      cur[j2] = Math.min(prev[j2]+1, cur[j2-1]+1, prev[j2-1]+cost);
    }
    prev = cur;
  }
  return prev[bl];
}

/* ── هل اسمين للحي قريبين بدرجة كافية لاعتبارهم نفس الحي؟ (فرق حرف أو مسافة واحدة بسيطة) ──
   نسمح بمسافة تعديل أكبر كلما طال الاسم، لكن نظل متحفظين لتفادي دمج أحياء مختلفة فعلاً */
function _areAreasSimilar(nameA, nameB){
  var na=_normalizeAreaName(nameA), nb=_normalizeAreaName(nameB);
  if(!na || !nb) return false;
  if(na===nb) return true;
  var maxLen = Math.max(na.length, nb.length);
  var dist = _levenshteinDistance(na, nb);
  // أسماء قصيرة (≤4 حروف): لازم تطابق تام أو فرق حرف واحد فقط لتفادي دمج أحياء قصيرة مختلفة
  if(maxLen<=4) return dist<=1;
  if(maxLen<=8) return dist<=1;
  return dist<=2; // أسماء طويلة: تسمح بفرق حرفين (مثلاً سقطة أو زيادة حرف وسط الاسم)
}

/* ── تجميع قائمة أسماء أحياء حرة (من إعلانات فعلية) إلى مجموعات منطقية ──
   يُرجع Map: الاسم الخام → الاسم الكنسي (الأكثر تكراراً بين المتشابهين) — يُستخدم في بناء فلتر موحّد للمنطقة */
function groupSimilarAreaNames(rawNames){
  var counts = {};
  rawNames.forEach(function(n){
    if(!n) return;
    var t = n.trim();
    if(!t) return;
    counts[t] = (counts[t]||0) + 1;
  });
  var uniqueNames = Object.keys(counts);
  var clusters = []; // كل عنصر: {canonical, members:[name,...]}
  uniqueNames.forEach(function(name){
    var matched = null;
    for(var i=0;i<clusters.length;i++){
      // قارن بأي عضو من المجموعة، مش بس الكنسي، لتفادي "انجراف" التطابق التراكمي
      if(clusters[i].members.some(function(m){ return _areAreasSimilar(name, m); })){
        matched = clusters[i]; break;
      }
    }
    if(matched){
      matched.members.push(name);
      // الاسم الكنسي = الأكثر تكراراً بين أعضاء المجموعة
      if(counts[name] > counts[matched.canonical]) matched.canonical = name;
    } else {
      clusters.push({canonical: name, members: [name]});
    }
  });
  var nameToCanonical = {};
  clusters.forEach(function(c){
    c.members.forEach(function(m){ nameToCanonical[m] = c.canonical; });
  });
  return nameToCanonical;
}
async function saveSettingsToSB(s){
  try{
    var keys = Object.keys(s);
    var batch = _db.batch();
    keys.forEach(function(k){
      var ref = _db.collection('settings').doc(k);
      batch.set(ref, {key:k, value: JSON.stringify(s[k])}, {merge:true});
    });
    await batch.commit();
  } catch(e){ console.error('saveSettingsToSB error:', e.message); }
}
/* ── حفظ الإعدادات في الـ cache و Firebase ── */
function _saveSettingsCore(s){
  _settingsCache = s;
  try{ localStorage.setItem('fares_settings_cache', JSON.stringify(s)); }catch(e){}
  saveSettingsToSB(s);
}

/* ════════ OTP SYSTEM ════════ */
/* ════════ LOGIN STARS ════════ */
(function(){
  var container = document.getElementById('otp-stars-bg');
  if(!container) return;
  for(var i=0;i<60;i++){
    var s = document.createElement('div');
    s.className = 'otp-star';
    s.style.cssText = 'left:'+Math.random()*100+'%;top:'+Math.random()*100+'%;--d:'+(2+Math.random()*4)+'s;--delay:'+(Math.random()*4)+'s;opacity:'+(Math.random()*.5+.1);
    container.appendChild(s);
  }
})();

function getSavedPhones(){
  try{ return JSON.parse(localStorage.getItem('fares_saved_phones')||'[]'); }catch(e){return [];}
}
function savePhone(phone){
  var phones = getSavedPhones();
  phones = phones.filter(p=>p!==phone); // ازل لو موجود
  phones.unshift(phone); // حطه في الأول
  phones = phones.slice(0,3); // احتفظ بآخر 3 بس
  localStorage.setItem('fares_saved_phones', JSON.stringify(phones));
}
function loadSavedPhones(){
  var phones = getSavedPhones();
  var wrap = document.getElementById('saved-phones-wrap');
  var list = document.getElementById('saved-phones-list');
  if(!phones.length){ wrap.style.display='none'; return; }
  wrap.style.display='block';
  list.innerHTML = phones.map(function(p){
    var label = p === '01040986955' ? p + ' 👑' : p;
    return '<button class="saved-phone-btn" onclick="selectSavedPhone(\''+p+'\')">'+
      '<span>'+label+'</span><span style="color:#8a95a8;font-size:11px">اختر</span>'+
    '</button>';
  }).join('');
}
function selectSavedPhone(phone){
  document.getElementById('otp-phone').value = phone;
  var pwInp = document.getElementById('otp-password');
  if(pwInp) { pwInp.focus(); pwInp.value=''; }
}
function forgotPasswordWhatsApp(){
  var phone = (document.getElementById('otp-phone').value || '').trim();
  var msg = phone
    ? 'مرحباً، نسيت كلمة المرور الخاصة بحسابي على منصة ديار. رقمي: ' + phone
    : 'مرحباً، نسيت كلمة المرور الخاصة بحسابي على منصة ديار.';
  var url = 'https://wa.me/' + ADMIN_PHONE + '?text=' + encodeURIComponent(msg);
  window.open(url, '_blank');
}

async function loginWithPhone(){
  var phone = document.getElementById('otp-phone').value.trim();
  var password = document.getElementById('otp-password') ? document.getElementById('otp-password').value.trim() : '';
  if(!/^(010|011|012|015)\d{8}$/.test(phone)){
    toast('⚠️ أدخل رقم هاتف مصري صحيح'); return;
  }
  if(!password || password.length < 4){
    toast('⚠️ أدخل كلمة مرور (4 أحرف على الأقل)'); return;
  }
  var isAdmin = (phone === ADMIN_NUMBER);
  if(isAdmin){
    // استخدم كلمة السر من الإعدادات (متسقة مع adminLogin)
    var _s = loadSettings();
    var _storedAdminPass = _s.adminPass || ADMIN_PASS;
    var _adminOk = await verifyPassword(password, _storedAdminPass);
    if(!_adminOk){
      toast('⚠️ كلمة السر غير صحيحة'); return;
    }
  }

  // ── فحص: هل هذا الرقم مسجّل كحساب أدمن فرعي؟ ──
  // لو كان، يدخل مباشرة لوحته الخاصة بدل الشاشة الرئيسية العادية
  if(!isAdmin){
    var _subList = await loadSubAdminsAsync();
    var _sa = _subList.find(function(s){ return s.phone === phone; });
    if(_sa){
      var _saOk = await verifyPassword(password, _sa.password);
      if(!_saOk){
        toast('❌ كلمة المرور غير صحيحة لهذا الرقم'); return;
      }
      currentUser = {
        phone: phone,
        isAdmin: true,
        isSubAdmin: true,
        adminPermissions: _sa.permissions || []
      };
      localStorage.setItem('fares_current_user', JSON.stringify(currentUser));
      savePhone(phone);
      var _otpElSA = document.getElementById('otp-overlay'); if(_otpElSA) _otpElSA.style.display='none';
      show('admin-overlay');
      _doAdminEnter(false);
      if(typeof renderBottomNav==='function') renderBottomNav();
      toast('👑 مرحباً '+phone+' — دخول كأدمن فرعي');
      startRealtimeSync();
      return;
    }
  }

  // تحقق من كلمة السر للمستخدمين العاديين
  // جيب أحدث بيانات المستخدمين من Supabase (مهم للتحقق من الحظر)
  if(!isAdmin){
    try{ await loadUsersAsync(); } catch(e){}
  }
  var users = loadUsers();
  var existingUser = users.find(u => u.phone === phone);

  // Fix 3: فحص المستخدم المحظور قبل أي شيء آخر
  if(existingUser && existingUser.blocked && !isAdmin){
    toast('🚫 حسابك محظور — تواصل مع الإدارة');
    return;
  }

  if(existingUser && !isAdmin){
    // مستخدم موجود - تحقق من كلمة السر
    var passwordOk = await verifyPassword(password, existingUser.password);
    if(existingUser.password && !passwordOk){
      toast('❌ كلمة المرور غير صحيحة لهذا الرقم'); return;
    }
    // لو مفيش password محفوظ أو legacy - حفظ hashed
    if(!existingUser.password || existingUser.password.length !== 64){
      existingUser.password = await hashPassword(password);
      saveUsers(users);
      saveUserToSB(existingUser);
    }
    // ✅ FIX: أخفِ hint المستخدم الجديد لأن هذا مستخدم موجود
    var _hint = document.getElementById('otp-new-user-hint');
    if(_hint) _hint.style.display = 'none';
  } else if(!existingUser && !isAdmin){
    // ✅ FIX: مستخدم جديد — أظهر hint ليعرف أن كلمة السر ستُحفظ
    var _hintNew = document.getElementById('otp-new-user-hint');
    if(_hintNew) _hintNew.style.display = 'block';
    // سجّله مع كلمة السر hashed
    var hashedPw = await hashPassword(password);
    var newUser = {phone, password: hashedPw, blocked:false, joinedAt:new Date().toISOString()};
    users.push(newUser);
    saveUsers(users);
    saveUserToSB(newUser);
  }

  savePhone(phone);
  currentUser = {phone, isAdmin};
  localStorage.setItem('fares_current_user', JSON.stringify(currentUser));
  osIdentifyUser(phone, (loadBrokerProfile()||{}).accountType);
  // مسح بيانات أي حساب قديم مختلف فوراً قبل أي عرض
  var _oldP=loadBrokerProfile();
  if(_oldP && _oldP.linkedPhone && _oldP.linkedPhone!==phone){
    localStorage.removeItem('fares_broker_profile');
  }
  // مسح الـ favs والـ recently viewed المرتبطة بالحساب القديم
  var _prevUser = null;
  try{ _prevUser = sessionStorage.getItem('fares_prev_user') || null; }catch(e){}
  if(_prevUser && _prevUser !== phone){
    localStorage.removeItem('fares_favs_'+_prevUser);
    localStorage.removeItem('fares_recently_viewed_'+_prevUser);
  }
  sessionStorage.setItem('fares_prev_user', phone);
  var _otpEl=document.getElementById('otp-overlay'); if(_otpEl) _otpEl.style.display='none';
  updateUserBadge();
  if(typeof renderBottomNav==='function') renderBottomNav();
  // عرض الإعلانات من الـ cache المحفوظ فوراً (بعد مسح البيانات القديمة)
  updateMyAdsCard();
  updateBrokerHomeCard();
  if('Notification' in window && Notification.permission === 'default'){
    Notification.requestPermission();
  }
  if(!isAdmin){
    // استعادة الملف الشخصي والإعلانات معاً من Supabase
    restoreUserSession(phone);
  }
  if(isAdmin){
    var _fabEl=document.getElementById('admin-fab'); if(_fabEl) _fabEl.style.display='flex';
    toast('🎉 مرحباً بك يا أدمن!');
    setTimeout(()=>openAdmin(),600);
  } else {
    toast('🎉 تم الدخول بنجاح');
    // ربط المساعد الذكي بالحساب الجديد
    if(typeof aiOnLogin === 'function') aiOnLogin(phone);
  }
  startRealtimeSync();
}

/* ════════ RESTORE SESSION ════════ */
/* تُستدعى بعد الدخول — تستعيد الملف الشخصي والإعلانات معاً من Firebase */
async function restoreUserSession(phone){
  // 1. استعادة الملف الشخصي
  await restoreUserProfile(phone);
  // 2. تحميل المفضلة والـ Recently Viewed من Firestore
  _favsCache = null; _rvCache = null; // أعد تهيئة الـ cache
  Promise.all([
    loadFavsFromDB(phone),
    loadRecentlyViewedFromDB(phone)
  ]).catch(function(){});
  // 3. تحديث الإعلانات من Firebase وعرضها فوراً
  try{
    await loadDBAsync(true); // forceRefresh = true
    updateMyAdsCard();
    updateBrokerHomeCard();
    // لو صفحة "إعلاناتي" مفتوحة — حدّثها
    var _ms = document.getElementById('s-myads');
    if(_ms && _ms.classList.contains('active')) _doRenderMyAds();
  } catch(e){
    // الـ cache الموجود كافٍ كـ fallback
    updateMyAdsCard();
  }
}





async function restoreUserProfile(phone){
  try{
    var snap = await _db.collection('users').where('phone','==',phone).limit(1).get();
    var rows = snap.docs.map(function(d){ return d.data(); });
    if(rows && rows.length){
      var row = rows[0];
      // حدّث cache المستخدمين
      var users = loadUsers();
      var idx = users.findIndex(function(u){ return u.phone === phone; });
      if(idx !== -1){ users[idx] = Object.assign(users[idx], row); }
      else { users.push(row); }
      _usersCache = users;
      try{ localStorage.setItem('fares_users_cache', JSON.stringify(users)); }catch(e){}
      // استعادة بيانات السمسار/المالك
      if(row.profile_name){
        var profile = {
          name: row.profile_name,
          phone: row.profile_phone || phone,
          accountType: row.profile_type || '',
          photo: row.profile_photo || '',
          linkedPhone: phone,
          verified: row.verified || false
        };
        _saveBrokerProfileLocal(profile); // ✅ محلي فقط — البيانات قادمة من Firebase أصلاً
        updateBrokerHomeCard();
        toast('👋 مرحباً ' + profile.name + '!');
      } else {
        var existingProfile = loadBrokerProfile();
        // حدّث الـ verified status على الأقل
        if(existingProfile && existingProfile.linkedPhone === phone){
          existingProfile.verified = row.verified || false;
          _saveBrokerProfileLocal(existingProfile);
          updateBrokerHomeCard();
        }
      }
    } else {
      var existingLocal = loadBrokerProfile();
      if(existingLocal && existingLocal.linkedPhone === phone){
        updateBrokerHomeCard();
      }
    }
  } catch(e){
    var existingFallback = loadBrokerProfile();
    if(existingFallback && existingFallback.linkedPhone === phone){
      updateBrokerHomeCard();
    }
  }
}
function sendOTP(){ loginWithPhone(); }
function verifyOTP(){}
function digitInput(){}
function digitBack(){}
function skipLogin(){
  toast('⚠️ يجب تسجيل الدخول أولاً');
}
function backToPhone(){
  /* otp-step1/otp-step2 removed — single-step login UI */
  var _s2=document.getElementById('otp-step2');if(_s2)_s2.classList.remove('active');
  var _s1=document.getElementById('otp-step1');if(_s1)_s1.classList.add('active');
  /* fallback: just clear the password field */
  var pw=document.getElementById('otp-password');
  if(pw){ pw.value=''; pw.focus(); }
}
function updateUserBadge(){
  // badge removed
}
function showUserMenu(){
  if(currentUser&&currentUser.isAdmin){openAdmin();return;}
  showConfirmModal({
    icon:'🚪', title:'تسجيل الخروج',
    msg:'هل تريد الخروج من حسابك الحالي؟',
    okText:'خروج', cancelText:'إلغاء',
    okColor:'linear-gradient(135deg,#dc2626,#b91c1c)'
  }).then(function(r){ if(!r) return;
    // احتفظ بكل البيانات غير المرتبطة بالجلسة
    var savedPhones   = localStorage.getItem('fares_saved_phones');
    var savedDb       = localStorage.getItem('fares_db_cache');
    var savedViews    = localStorage.getItem('fares_views');
    var savedSettings = localStorage.getItem('fares_settings_cache');
    var savedUsers    = localStorage.getItem('fares_users_cache');
    localStorage.clear();
    if(savedPhones)   localStorage.setItem('fares_saved_phones',   savedPhones);
    if(savedDb)       localStorage.setItem('fares_db_cache',       savedDb);
    if(savedViews)    localStorage.setItem('fares_views',          savedViews);
    if(savedSettings) localStorage.setItem('fares_settings_cache', savedSettings);
    if(savedUsers)    localStorage.setItem('fares_users_cache',     savedUsers);
    currentUser = null;
    osLogoutUser();
    clearUploadedMedia();
    _usersCache = null;
    _settingsCache = null;
    _favsCache = null;
    _rvCache = null;
    // أوقف المزامنة التلقائية عند تسجيل الخروج
    if(_realtimeInterval){ clearInterval(_realtimeInterval); _realtimeInterval = null; }
    // _dbCache و _dbCacheTime يبقيان لتسريع الدخول التالي
    var _afb=document.getElementById('admin-fab'); if(_afb) _afb.style.display='none';
    document.getElementById('broker-home-card').style.display='none';
    document.getElementById('visitor-choices').style.display='block';
    var _oto=document.getElementById('otp-overlay'); if(_oto) _oto.style.display='flex';
    loadSavedPhones();
    updateBrokerHomeCard();
    if(typeof aiOnLogout === 'function') aiOnLogout();
    toast('👋 تم تسجيل الخروج بأمان');
    go('home');
  });
}

/* ════════ FEATURED TOGGLE ════════ */
function toggleFeaturedOption(){
  featuredEnabled = !featuredEnabled;
  var sw = document.getElementById('featured-toggle-sw');
  var box = document.getElementById('featured-payment-box');
  sw.classList.toggle('on', featuredEnabled);
  box.style.display = featuredEnabled ? 'block' : 'none';
  if(featuredEnabled) updateFormFeaturedPrices();
}

function updateFormFeaturedPrices(){
  var s = loadSettings();
  var price  = s.featuredPrice || '50';
  var wallet = s.vodafoneNum   || '01005581620';
  ['form-feat-price-hint','form-feat-price-sub','form-feat-price-pill'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.textContent=price;
  });
  var fw=document.getElementById('form-feat-wallet'); if(fw) fw.textContent=wallet;
}

function sendFeaturedRequest(){
  var settings = loadSettings();
  var waNum = (settings.adminWa||ADMIN_NUMBER).replace(/^0/,'20');
  var price = settings.featuredPrice || '50';
  var pl={apt:'شقة',house:'بيت',chalet:'شاليه',land:'أرض',shop:'محل'};
  var dl={sale:'تمليك',rent:'إيجار'};
  var name    = document.getElementById('owner-name').value.trim() || '—';
  var phone   = document.getElementById('phone').value.trim() || '—';
  var region  = document.getElementById('region').value || '—';
  var adPrice = document.getElementById('price').value;
  var size    = document.getElementById('size').value;
  var desc    = document.getElementById('desc').value.trim();
  var rentType = dealType==='rent'&&(propType==='apt'||propType==='house'||propType==='chalet') ? document.getElementById('rentType').value : '';
  var msg = '⭐ *طلب تمييز إعلان*\n';
  msg += '━━━━━━━━━━━━━━━━━\n';
  msg += '👤 *المعلن:* '  + name + '\n';
  msg += '📞 *الواتساب:* ' + phone + '\n';
  msg += '🏠 *النوع:* '   + (pl[propType]||propType||'—') + ' — ' + (dl[dealType]||'—') + (rentType?' ('+rentType+')':'') + '\n';
  msg += '📍 *المنطقة:* ' + region + '\n';
  if(adPrice) msg += '💰 *السعر:* ' + Number(adPrice).toLocaleString('ar-EG') + ' ج.م\n';
  if(size)    msg += ((propType==='apt'||propType==='house'||propType==='chalet')?'🛏 *الغرف:* ':'📐 *المساحة:* ') + size + ((propType!=='apt'&&propType!=='house'&&propType!=='chalet')?' م²':'') + '\n';
  if(nearSea) msg += '🌊 *قرب البحر:* ' + nearSea + '\n';
  if(finishVal) msg += '🎨 *التشطيب:* ' + finishVal + '\n';
  if(desc)    msg += '📝 ' + desc + '\n';
  msg += '━━━━━━━━━━━━━━━━━\n';
  msg += '💳 *تم تحويل ' + price + ' ج.م فودافون كاش*\n';
  msg += 'رجاء تمييز الإعلان بالإطار الذهبي ⭐🙏';
  window.open('https://wa.me/'+waNum+'?text='+encodeURIComponent(msg),'_blank');
}

/* ════════ HELPERS ════════ */
/* ════════ CLOSE ALL OVERLAYS ════════ */
/* يُستدعى قبل كل تنقل لضمان عدم تداخل المودالات مع الصفحات */
var _scrollLockCount = 0; // عداد حالات تأمين الـ scroll
function _lockScroll(){
  _scrollLockCount++;
  document.body.style.overflow = 'hidden';
}
function _unlockScroll(){
  _scrollLockCount = Math.max(0, _scrollLockCount - 1);
  if(_scrollLockCount === 0) document.body.style.overflow = '';
}
function _forceUnlockScroll(){
  _scrollLockCount = 0;
  document.body.style.overflow = '';
}

function _closeAllModals(){
  // إغلاق مودال تفاصيل العقار
  var pm = document.getElementById('prop-modal-overlay');
  if(pm && pm.classList.contains('open')){
    pm.classList.remove('open');
    pm.style.pointerEvents = 'none'; // فوراً — بدون انتظار الـ animation
    setTimeout(function(){ if(pm){ pm.style.display='none'; pm.style.pointerEvents=''; } }, 300);
  }
  // إغلاق مودال إعلانات السمسار
  var bm = document.getElementById('broker-ads-overlay');
  if(bm && bm.classList.contains('open')){
    bm.classList.remove('open');
    bm.style.pointerEvents = 'none'; // فوراً — بدون انتظار الـ animation
    setTimeout(function(){ if(bm){ bm.style.display='none'; bm.style.pointerEvents=''; } }, 300);
  }
  // إغلاق verify card (داخل s-home — لكن نضمن إغلاقه صراحةً)
  var vc = document.getElementById('verify-card-overlay');
  if(vc) vc.style.display = 'none';
  // فك تأمين الـ scroll بالكامل
  _forceUnlockScroll();
}

function go(id, _afterScreenSwitch){
  // ✅ الأدمن (رئيسي أو فرعي): لوحة التحكم هي "الرئيسية" بالنسبة له — أي محاولة توجّه لـ home تفتح لوحة التحكم بدلاً من الصفحة الرئيسية العادية
  if(id==='home' && currentUser && currentUser.isAdmin){
    openAdmin();
    return;
  }
  _homeBrowseMode = false; // أي تنقّل عادي عبر go() يلغي وضع "تصفح" المؤقت للسمسار/المالك
  // صفحات تحتاج تسجيل دخول — نتحقق أولاً قبل أي حاجة
  var authRequired=['add','myads','favs','register','account'];
  if(authRequired.indexOf(id)!==-1 && !currentUser){
    toast('⚠️ سجّل دخولك أولاً');
    document.getElementById('otp-overlay').style.display='flex';
    loadSavedPhones();
    return;
  }
  // إغلاق أي مودال مفتوح بعد التحقق من الصلاحية
  _closeAllModals();
  // استخدام requestAnimationFrame لتجنب layout thrashing
  requestAnimationFrame(function(){
    // تحديد الـ screen الفعلي — السمسار/المالك يروح broker-account بدل account
    var _resolvedId = id;
    if(id==='account'){
      var _bpCheck = loadBrokerProfile();
      var _isBrokerUser = _bpCheck && currentUser && (_bpCheck.linkedPhone===currentUser.phone||_bpCheck.phone===currentUser.phone);
      if(_isBrokerUser) _resolvedId = 'broker-account';
    }
    var _targetEl = document.getElementById('s-'+_resolvedId);
    var _prevScreen = document.querySelector('.screen.active');
    // انتقال سلس: نطفّي الشاشة الحالية بسرعة ثم نظهر الجديدة، بدل القطع الفجائي
    function _finishScreenSwitch(){
      document.querySelectorAll('.screen').forEach(s=>{ s.classList.remove('active'); s.classList.remove('screen-out'); });
      if(_targetEl) _targetEl.classList.add('active');
      _currentScreenId = _resolvedId;
      _updateThemeColorMeta(_currentThemeMode, _resolvedId);
      if(_resolvedId==='home'){ resetForm(); updateBrokerHomeCard(); updateMyAdsCard(); updateFavsCard(); renderFeaturedAds(); }
      if(_resolvedId==='add')  { updateFormFeaturedPrices(); fillAddFormFromProfile(); }
      if(id==='register') loadRegisterForm();
      if(id==='account'){
        if(_resolvedId==='broker-account') loadBrokerAccountScreen();
        else loadAccountScreen();
      }
      if(id==='myads') renderMyAds();
      if(id==='favs') renderFavs();
      // إخفاء الهيدر في كل الصفحات ما عدا home
      var hdr = document.getElementById('header-tap');
      if(hdr) hdr.style.display = (_resolvedId==='home') ? '' : 'none';
      window.scrollTo({top:0,behavior:'instant'});
      // مزامنة أيقونة الشريط السفلي فورًا لحظة اكتمال التبديل الفعلي للشاشة
      // (بدل الاعتماد على تايمر مستقل ممكن يسبق أو يتأخر عن التبديل الحقيقي)
      if(typeof window._syncBottomNavActive === 'function') window._syncBottomNavActive();
      if(typeof _afterScreenSwitch === 'function'){ _afterScreenSwitch(); _afterScreenSwitch = null; }
    }
    if(_prevScreen && _prevScreen !== _targetEl){
      _prevScreen.classList.remove('active');
      _prevScreen.classList.add('screen-out');
      setTimeout(_finishScreenSwitch, 65);
    } else {
      _finishScreenSwitch();
    }
  });

  // ── حفظ الصفحة الحالية لاستعادتها عند العودة من الخلفية ──
  // نستثني 'success' لأنها شاشة مؤقتة لا يجب الرجوع إليها
  // تحديد الـ id الفعلي للحفظ (broker-account بدل account للسمسار/المالك)
  var _savedId = id;
  if(id==='account'){
    var _bp2 = loadBrokerProfile();
    if(_bp2 && currentUser && (_bp2.linkedPhone===currentUser.phone||_bp2.phone===currentUser.phone))
      _savedId = 'broker-account';
  }
  if(_savedId !== 'success'){
    try { sessionStorage.setItem('_diyar_last_screen', _savedId); } catch(e){}
  }

  // ── دفع state في History API لتفعيل زر الرجوع الفيزيائي ──
  if(_savedId !== 'success'){
    try {
      var currentState = window.history.state;
      if(!currentState || currentState.screen !== _savedId){
        window.history.pushState({ screen: _savedId }, '', window.location.pathname);
      }
    } catch(e){}
  }
}
function toast(msg){
  var t=document.getElementById('toast-el');
  if(!t){ console.warn('[toast]',msg); return; }
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._t); t._t=setTimeout(function(){ t.classList.remove('show'); },3200);
}
function hide(id){var e=document.getElementById(id);if(e)e.classList.add('hidden');}
function show(id){var e=document.getElementById(id);if(e)e.classList.remove('hidden');}

/* ════════ LISTINGS ════════ */
var _currentListingsCat = '';
var _listingsSource = 'home'; // تتبع الصفحة التي جاء منها المستخدم لتشغيل زر الرجوع الصحيح
async function showListings(cat, source){
  _currentListingsCat = cat;
  _listingsSource = source || 'home';
  try {
    sessionStorage.setItem('_diyar_listings_cat', cat || '');
    sessionStorage.setItem('_diyar_listings_source', _listingsSource);
  } catch(e){}
  go('listings');
  // تحديث زر الرجوع ليعود للصفحة الصحيحة
  var backBtn = document.querySelector('#s-listings .back-btn');
  if(backBtn){
    var srcLabels = {tourist:'المصيف ⛱️', resident:'الإقامة 🏡', home:'الرئيسية 🏠'};
    backBtn.textContent = '← ' + (srcLabels[_listingsSource] || 'رجوع');
    backBtn.onclick = function(){ go(_listingsSource); };
  }
  currentFilter='الكل';
  document.getElementById('listings-title').textContent = getCatLabel(cat);

  var _lg = document.getElementById('listings-grid');

  // ── Stale-While-Revalidate ──
  // لو في cache → اعرضه فوراً بدون skeleton
  if(_dbCache && (Date.now() - _dbCacheTime) < 300000){ // 5 دقايق
    renderListings(cat);
    // حدّث في الخلفية بصمت (لو الـ cache عمره أكتر من 30 ثانية)
    if((Date.now() - _dbCacheTime) > 30000){
      loadDBAsync().then(function(){
        renderListings(cat);
      }).catch(function(){});
    }
    return;
  }

  // مفيش cache → skeleton + fetch
  if(_lg) _lg.innerHTML = buildSkeletonCards(5);
  var _fetchOk = false;
  try{ await loadDBAsync(); _fetchOk = true; } catch(e){ console.warn('showListings fetch error:', e.message); }
  var _localDb = loadDB();
  var _hasAny = (_localDb.approved||[]).length > 0 || (_localDb.pending||[]).length > 0;
  if(!_fetchOk && !_hasAny){
    var _lg2 = document.getElementById('listings-grid');
    if(_lg2) _lg2.innerHTML = '<div class="no-listings"><div class="nl-ico">📡</div>' +
      '<div style="font-weight:700;font-size:16px;color:#1a2744;margin-bottom:8px">تعذّر تحميل الإعلانات</div>' +
      '<div style="font-size:13px;color:#3d4a5c;margin-bottom:16px">تحقق من الاتصال وحاول مرة أخرى</div>' +
      '<button onclick="showListings(\'' + cat + '\',\'' + (_listingsSource||'home') + '\')" style="background:#1a2f5e;color:#fff;border:none;padding:10px 28px;border-radius:50px;font-family:Cairo,sans-serif;font-size:14px;cursor:pointer">🔄 إعادة المحاولة</button></div>';
    return;
  }
  renderListings(cat);
}
function getCatLabel(c){
  if(!c || c==='all') return 'جميع الإعلانات 🏘️';
  return {
    'يومي':'إيجار يومي 📅','أسبوعي':'إيجار أسبوعي 🗓️',
    'شهري (صيفي)':'إيجار شهري صيفي ☀️','شهري (شتوي)':'إيجار شتوي ❄️',
    'سنوي':'إيجار سنوي 🏡','تمليك':'شقق وبيوت وشاليهات تمليك 🔑',
    'أرض':'أراضي 🌍','محل':'محلات تجارية 🏪'
  }[c]||c;
}
function renderListings(cat){
  var db=loadDB(); var all=db.approved||[];
  var filtered=all.filter(function(a){
    if(!cat || cat==='all') return true;
    if(cat==='تمليك') return a.dealType==='sale'&&(a.propType==='apt'||a.propType==='house'||a.propType==='chalet');
    if(cat==='أرض')   return a.propType==='land';
    if(cat==='محل')   return a.propType==='shop';
    return a.rentType===cat;
  });
  _currentListingsData = filtered;
  _priceFilterActive = false;
  currentPropTypeFilter = 'الكل';
  currentSort = 'default';
  var sortBtns = document.querySelectorAll('.sort-btn');
  if(sortBtns.length){ sortBtns.forEach(b=>b.classList.remove('on')); sortBtns[0].classList.add('on'); }
  var clearBtn=document.getElementById('price-filter-clear');
  if(clearBtn) clearBtn.style.display='none';
  var _lc=document.getElementById('listings-count'); if(_lc) _lc.textContent=filtered.length?filtered.length+' إعلان متاح':'';

  // ── فلتر نوع العقار (شقة / بيت / شاليه) — يظهر فقط لو الفئة ممكن تحتوي أكتر من نوع معاً ──
  var typeFilEl=document.getElementById('listings-type-filters');
  var isMixedCat = (!cat || cat==='all' || cat==='تمليك' || ['يومي','أسبوعي','شهري (صيفي)','شهري (شتوي)','سنوي'].indexOf(cat)!==-1);
  var typeOptions=[{val:'apt',label:'🏠 شقة'},{val:'house',label:'🏡 بيت'},{val:'chalet',label:'🏖️ شاليه'}];
  var presentTypes=typeOptions.filter(function(t){return filtered.some(function(a){return a.propType===t.val;});});
  if(typeFilEl){
    typeFilEl.innerHTML='';
    if(isMixedCat && presentTypes.length>1){
      [{val:'الكل',label:'الكل'}].concat(presentTypes).forEach(function(t){
        var b=document.createElement('button');
        b.className='filter-btn type-filter-btn'+(t.val===currentPropTypeFilter?' on':'');
        b.textContent=t.label;
        b.onclick=function(){
          currentPropTypeFilter=t.val;
          typeFilEl.querySelectorAll('.type-filter-btn').forEach(x=>x.classList.remove('on'));
          b.classList.add('on');
          renderCards(filtered,currentFilter);
        };
        typeFilEl.appendChild(b);
      });
    }
  }

  var filEl=document.getElementById('listings-filters');
  filEl.innerHTML='';
  var regions=['الكل'].concat([...new Set(filtered.map(a=>a.region))]);
  regions.forEach(function(r){
    var b=document.createElement('button');
    b.className='filter-btn'+(r===currentFilter?' on':'');
    b.textContent=r;
    b.onclick=function(){
      currentFilter=r;
      currentSubregionFilter='الكل';
      filEl.querySelectorAll('.filter-btn').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');
      renderSubregionFilters(filtered, r);
      renderCards(filtered,r);
    };
    filEl.appendChild(b);
  });
  renderSubregionFilters(filtered, 'الكل');
  renderCards(filtered,'الكل');
}

/* ── فلتر الحي/المنطقة داخل "مدينة مطروح" — يجمّع الأسماء المتشابهة (فرق حرف/مسافة) في فلتر واحد
   باستخدام مطابقة تقريبية (fuzzy)، فمثلاً "العوام" و"العوامم" و"العوام " تظهر كفلتر واحد فقط ── */
function renderSubregionFilters(filtered, regionFilter){
  var box = document.getElementById('listings-subregion-filters');
  if(!box) return;
  currentSubregionFilter='الكل';
  if(regionFilter !== 'مدينة مطروح'){ box.innerHTML=''; return; }
  var inRegion = filtered.filter(function(a){ return a.region==='مدينة مطروح' && a.subRegion; });
  if(!inRegion.length){ box.innerHTML=''; return; }
  var rawNames = inRegion.map(function(a){ return a.subRegion; });
  var nameToCanonical = groupSimilarAreaNames(rawNames);
  // عدّاد الإعلانات لكل مجموعة كنسية
  var counts = {};
  inRegion.forEach(function(a){
    var canon = nameToCanonical[a.subRegion] || a.subRegion;
    counts[canon] = (counts[canon]||0) + 1;
  });
  var canonicalNames = Object.keys(counts).sort(function(a,b){ return counts[b]-counts[a]; });
  box.innerHTML='';
  if(!canonicalNames.length) return;
  var allBtn=document.createElement('button');
  allBtn.className='filter-btn'+(currentSubregionFilter==='الكل'?' on':'');
  allBtn.textContent='كل الأحياء';
  allBtn.onclick=function(){
    currentSubregionFilter='الكل';
    box.querySelectorAll('.filter-btn').forEach(x=>x.classList.remove('on'));
    allBtn.classList.add('on');
    renderCards(filtered, regionFilter);
  };
  box.appendChild(allBtn);
  canonicalNames.forEach(function(name){
    var b=document.createElement('button');
    b.className='filter-btn';
    b.textContent='📍 '+name+' ('+counts[name]+')';
    b.onclick=function(){
      currentSubregionFilter=name;
      box.querySelectorAll('.filter-btn').forEach(x=>x.classList.remove('on'));
      b.classList.add('on');
      renderCards(filtered, regionFilter);
    };
    box.appendChild(b);
  });
}
function setSort(type, btn){
  currentSort = type;
  document.querySelectorAll('.sort-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  // ✅ FIX: مرر الفلتر الحالي للمنطقة بدل 'الكل'
  renderCards(_currentListingsData, currentFilter);
}

function renderCards(ads,regionFilter){
  var shown = (currentPropTypeFilter && currentPropTypeFilter!=='الكل') ? ads.filter(a=>a.propType===currentPropTypeFilter) : ads;
  shown = regionFilter==='الكل'?shown:shown.filter(a=>a.region===regionFilter);
  // ✅ فلتر الحي (داخل مدينة مطروح) — يطابق بالتجميع التقريبي، فلو اختار "العوام" يشمل كل الصيغ المتشابهة
  if(currentSubregionFilter && currentSubregionFilter!=='الكل'){
    shown = shown.filter(function(a){ return a.subRegion && _areAreasSimilar(a.subRegion, currentSubregionFilter); });
  }
  // ترتيب
  shown = shown.slice();
  if(currentSort==='default'){
    shown.sort(function(a,b){return (b.featured?1:0)-(a.featured?1:0);});
  } else if(currentSort==='new'){
    shown.sort(function(a,b){
      var ta=a.submitted_ts ? new Date(a.submitted_ts).getTime() : 0;
      var tb=b.submitted_ts ? new Date(b.submitted_ts).getTime() : 0;
      return tb-ta;
    });
  } else if(currentSort==='cheap'){
    shown.sort(function(a,b){return Number(a.price)-Number(b.price);});
  } else if(currentSort==='expensive'){
    shown.sort(function(a,b){return Number(b.price)-Number(a.price);});
  }
  var grid=document.getElementById('listings-grid');
  if(!shown.length){
    grid.innerHTML='<div class="no-listings"><div class="nl-ico">🔍</div><div style="font-weight:700;font-size:16px;color:#1a2744;margin-bottom:8px">لا توجد إعلانات في هذه الفئة حالياً</div><div style="font-size:13px;color:#3d4a5c">كن أول من يضيف إعلان!</div></div>';
    return;
  }
  // Virtual scroll — render first 25, load more on scroll
  _vsAllAds = shown;
  _vsPage = 0;
  renderVirtualBatch(grid, true);
}

/* ════════ VIDEO HELPERS ════════ */
function isVideoUrl(url){
  if(!url) return false;
  return /\/video\/upload\//.test(url) || /\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(url);
}
function getVideoThumbnail(url){
  if(/\/video\/upload\//.test(url)){
    return url.replace('/video/upload/', '/image/upload/so_0/').replace(/\.(mp4|webm|mov|avi|mkv)(\?.*)?$/i, '.jpg');
  }
  return '';
}

function buildAdCards(ads){
  var pe={apt:'🏠',house:'🏡',chalet:'🏖️',land:'🌍',shop:'🏪'};
  return ads.map(function(a){
    var isFeatured = !!a.featured;
    var favActive = isFav(a.id);
    var isNew = false;
    try{ var t=new Date(a.submitted_ts||a.submittedAt); isNew=(Date.now()-t.getTime())<48*3600*1000 && !isNaN(t.getTime()); }catch(e){}
    var pLabel={apt:'شقة',house:'بيت',chalet:'شاليه',land:'أرض',shop:'محل'}[a.propType]||'عقار';
    var safeOwnerName = escapeHTML(a.ownerName);
    var safeRegion    = escapeHTML(a.region);
    var tags=[];
    if(a.size) tags.push((a.propType==='apt'||a.propType==='house'||a.propType==='chalet')?'🛏 '+escapeHTML(a.size)+' غرف':'📐 '+escapeHTML(a.size)+' م²');
    if(a.aptArea) tags.push('📐 '+escapeHTML(a.aptArea)+' م²');
    if(a.nearSea) tags.push('🌊 '+escapeHTML(a.nearSea));
    if(a.floor&&a.floor!=='') tags.push('🏢 دور '+escapeHTML(a.floor));
    if(a.finishVal) tags.push('🎨 '+escapeHTML(a.finishVal));
    if(a.aptFurnish) tags.push('🛋 '+escapeHTML(a.aptFurnish));
    var dealBdg=a.dealType==='sale'
      ?'<span class="nc-badge nc-sale">تمليك</span>'
      :'<span class="nc-badge nc-rent">'+(a.rentType||'إيجار')+'</span>';
    var topBadges=(isFeatured?'<span class="nc-badge nc-feat">⭐ مميز</span>':'')+(isNew?'<span class="nc-badge nc-new">✨ جديد</span>':'');
    var _firstMedia = a.photos&&a.photos.length ? a.photos[0] : null;
    var _isVid = _firstMedia && isVideoUrl(_firstMedia);
    var _vidThumb = _isVid ? getVideoThumbnail(_firstMedia) : '';
    var imgSrc = !_firstMedia
      ? '<span style="font-size:62px">'+(pe[a.propType]||'🏠')+'</span>'
      : _isVid
        ? '<div class="nc-video-thumb">'
          + (_vidThumb
              ? '<img src="'+_vidThumb+'" alt="فيديو" style="width:100%;height:100%;object-fit:cover">'
              : '<div style="width:100%;height:100%;background:#050d1a;display:flex;align-items:center;justify-content:center"><svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="8" fill="rgba(201,168,76,0.15)"/><path d="M18 14l20 10-20 10V14z" fill="#c9a84c"/></svg></div>')
          + '<div class="nc-vid-play-overlay"><div class="nc-vid-play-btn"><svg viewBox="0 0 36 36" fill="none" width="36" height="36"><circle cx="18" cy="18" r="18" fill="rgba(10,22,40,0.55)"/><circle cx="18" cy="18" r="17" stroke="rgba(201,168,76,0.6)" stroke-width="1.5"/><path d="M14 11.5l14 6.5-14 6.5V11.5z" fill="white"/></svg></div><div class="nc-vid-label">▶ فيديو</div></div>'
          + '</div>'
        : '<img src="'+_firstMedia+'" alt="صورة" style="width:100%;height:100%;object-fit:cover">';
    var viewCount = getViews(a.id);
    var aid=a.id, aphone=a.phone;
    // Broker info row
    var brokerHtml='';
    if(a.ownerName){
      var bAvatar = a.brokerPhoto
        ?'<img src="'+escapeHTML(a.brokerPhoto)+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%">'
        :(a.brokerType==='سمسار'?'🤝':'🏠');
      // Check if broker is verified
      var _cardUsers = loadUsers();
      var _cardBrokerUser = _cardUsers.find(function(u){ return u.phone===a.phone || u.phone===a.submitterPhone; });
      var _cardIsVerified = _cardBrokerUser && _cardBrokerUser.verified;
      var _cardVerifiedBadge = _cardIsVerified
        ? '<span class="verified-badge-card">✓ موثق</span>'
        : '';
      brokerHtml='<div style="display:flex;align-items:center;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid #f0ece0">'+
        '<div style="width:28px;height:28px;border-radius:50%;background:#e8e2d4;display:flex;align-items:center;justify-content:center;font-size:14px;overflow:hidden;flex-shrink:0;position:relative">'+
          bAvatar+
          (_cardIsVerified?'<div style="position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;background:linear-gradient(135deg,#0ea5e9,#0284c7);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:7px;color:white;border:1.5px solid white;font-weight:900">✓</div>':'')+
        '</div>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">'+
            '<span style="font-size:11px;color:#3d4a5c;font-weight:700">'+safeOwnerName+(a.brokerType?' · '+escapeHTML(a.brokerType):'')+'</span>'+
            _cardVerifiedBadge+
          '</div>'+
        '</div>'+
      '</div>';
    }
    var html='<div class="nc-card'+(isFeatured?' nc-featured':'')+'" id="card-'+aid+'" onclick="openPropModal(\''+aid+'\')">';
    html+='<div class="nc-img" style="position:relative">'+imgSrc;
    html+='<div class="nc-img-top">';
    html+='<div class="nc-badges">'+dealBdg+topBadges+'</div>';
    html+='<button class="nc-fav'+(favActive?' on':'')+'" id="fav-'+aid+'" onclick="toggleFav(\''+aid+'\',event)">'+(favActive?'❤️':'🤍')+'</button>';
    html+='</div>';
    html+='<div class="nc-over">';
    html+='<div class="nc-title">'+pLabel+' في '+safeRegion+'</div>';
    html+='<div class="nc-loc">📍 '+safeRegion+' · مطروح</div>';
    html+='</div></div>';
    html+='<div class="nc-body"><div style="flex:1">';
    html+='<div class="nc-price">'+Number(a.price).toLocaleString('ar-EG')+' <small>ج.م</small></div>';
    if(a.adCode) html+='<div style="font-size:10px;color:#8a9ab8;font-weight:700;margin-top:2px">#'+a.adCode+'</div>';
    if(tags.length) html+='<div class="nc-tags" style="margin-top:6px">'+tags.map(function(t){return'<span class="nc-tag">'+t+'</span>';}).join('')+'</div>';
    if(viewCount>0) html+='<div style="font-size:10px;color:#8a9ab8;margin-top:5px">👁️ '+viewCount+' مشاهدة</div>';
    html+=brokerHtml;
    html+='</div>';
    html+='<div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">';
    html+='<button class="nc-wa" onclick="contactOwner(\''+aphone+'\',\''+aid+'\',event)" style="width:auto;padding:10px 13px;display:flex;align-items:center;justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></button>';
    html+='<button class="nc-share" onclick="shareAd(\''+aid+'\',event)" style="width:auto;padding:8px 13px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f0f7ff,#e0eeff);border:1.5px solid #93c5fd;border-radius:12px;cursor:pointer;transition:all .2s" title="مشاركة الإعلان"><svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#0077b6\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"18\" height=\"18\"><circle cx=\"18\" cy=\"5\" r=\"3\"/><circle cx=\"6\" cy=\"12\" r=\"3\"/><circle cx=\"18\" cy=\"19\" r=\"3\"/><line x1=\"8.59\" y1=\"13.51\" x2=\"15.42\" y2=\"17.49\"/><line x1=\"15.41\" y1=\"6.51\" x2=\"8.59\" y2=\"10.49\"/></svg></button>';
    html+='</div>';
    html+='</div></div>';
    return html;
  }).join('');
}
function recordView(id){
  var newCount = incrementViews(id);
  // تحديث عدد المشاهدات في بطاقة الإعلان لو ظاهرة
  var card = document.getElementById('card-'+id);
  if(card){
    var viewEls = card.querySelectorAll('[style*="مشاهدة"]');
    viewEls.forEach(function(el){
      if(el.textContent && el.textContent.indexOf('مشاهدة') !== -1){
        el.textContent = '👁️ '+newCount+' مشاهدة';
      }
    });
  }
  return newCount;
}
function contactOwner(phone,id,event){
  if(event) event.stopPropagation();
  var db=loadDB(); var ad=(db.approved||[]).find(function(a){ return a.id===id; });
  if(!ad){toast('⚠️ إعلان غير موجود');return;}
  var clean=(phone||'').replace(/\s/g,'').replace(/^0/,'20');
  if(!clean){ toast('⚠️ رقم التواصل غير متاح'); return; }
  var pl={apt:'شقة',house:'بيت',chalet:'شاليه',land:'أرض',shop:'محل'};
  var msg='مرحبا 👋\nشفت إعلانك على موقع *ديار* 🏠\n';
  msg+='📌 '+(pl[ad.propType]||'عقار')+' في '+ad.region+'\n';
  msg+='💰 '+Number(ad.price).toLocaleString('ar-EG')+' ج.م\n';
  if(ad.rentType) msg+='🗓️ '+ad.rentType+'\n';
  if(ad.adCode) msg+='🔖 كود الإعلان: #'+ad.adCode+'\n';
  msg+='هل هو متاح؟';
  window.open('https://wa.me/'+clean+'?text='+encodeURIComponent(msg),'_blank');
}
function callOwner(phone,event){
  if(event) event.stopPropagation();
  window.location.href='tel:'+phone;
}
function shareAd(id,event){
  if(event) event.stopPropagation();
  var db=loadDB(); var ad=(db.approved||[]).find(a=>a.id===id);
  if(!ad){toast('⚠️ إعلان غير موجود');return;}
  var pl={apt:'شقة',house:'بيت',chalet:'شاليه',land:'أرض',shop:'محل'};
  var txt='🏠 *ديار*\n';
  txt+=''+(pl[ad.propType]||'عقار')+' في '+ad.region+'\n';
  txt+='💰 '+Number(ad.price).toLocaleString('ar-EG')+' ج.م\n';
  if(ad.rentType) txt+='🗓️ '+ad.rentType+'\n';
  if(ad.adCode) txt+='🔖 #'+ad.adCode+'\n';
  txt+='\nتواصل مع المعلن: 📞 '+ad.phone;
  var shareUrl = window.location.origin + window.location.pathname + '?ad=' + id;
  if(navigator.share){
    navigator.share({title:'ديار — '+(({apt:'شقة',house:'بيت',chalet:'شاليه',land:'أرض',shop:'محل'})[ad.propType]||'عقار')+' في '+ad.region, text:txt, url:shareUrl}).catch(()=>{});
  } else {
    var fullTxt = txt + '\n🔗 ' + shareUrl;
    navigator.clipboard.writeText(fullTxt).then(()=>toast('✅ تم نسخ تفاصيل الإعلان')).catch(()=>{
      window.open('https://wa.me/?text='+encodeURIComponent(txt),'_blank');
    });
  }
}

/* ════════ IMAGE SLIDER ════════ */
var _sliderIdx = {};
function sliderMove(id, dir, event){
  if(event) event.stopPropagation();
  var inner=document.getElementById('slider-inner-'+id);
  if(!inner) return;
  var total=inner.children.length;
  _sliderIdx[id]=(_sliderIdx[id]||0);
  _sliderIdx[id]=(_sliderIdx[id]+dir+total)%total;
  sliderApply(id,total);
}
function sliderGo(id, idx, event){
  if(event) event.stopPropagation();
  var inner=document.getElementById('slider-inner-'+id);
  if(!inner) return;
  _sliderIdx[id]=idx;
  sliderApply(id,inner.children.length);
}
function sliderApply(id,total){
  var inner=document.getElementById('slider-inner-'+id);
  var ctr=document.getElementById('slider-ctr-'+id);
  var slider=document.getElementById('slider-'+id);
  if(!inner) return;
  inner.style.transform='translateX(-'+((_sliderIdx[id]||0)*100)+'%)';
  if(ctr) ctr.textContent=(_sliderIdx[id]+1)+' / '+total;
  if(slider){
    slider.querySelectorAll('.img-slider-dot').forEach(function(d,i){
      d.classList.toggle('active',i===_sliderIdx[id]);
    });
  }
}

/* ════════ PRICE FILTER ════════ */
var _priceFilterActive = false;
var _currentListingsData = [];
function applyPriceFilter(){
  var mn=parseFloat(document.getElementById('price-min').value)||0;
  var mx=parseFloat(document.getElementById('price-max').value)||Infinity;
  if(mn>mx){toast('⚠️ السعر الأدنى أكبر من الأقصى');return;}
  _priceFilterActive=true;
  var clearBtn=document.getElementById('price-filter-clear');
  if(clearBtn) clearBtn.style.display='block';
  var toShow=_currentListingsData.filter(function(a){
    var p=Number(a.price||0);
    return p>=mn && p<=mx;
  });
  if(currentPropTypeFilter && currentPropTypeFilter!=='الكل'){
    toShow=toShow.filter(a=>a.propType===currentPropTypeFilter);
  }
  toShow=toShow.filter(a=>currentFilter==='الكل'||a.region===currentFilter);
  // ✅ FIX: احترام نظام الترتيب الحالي بدل تجاوزه دائماً
  toShow=toShow.slice();
  if(currentSort==='new'){
    toShow.sort(function(a,b){
      var ta=a.submitted_ts ? new Date(a.submitted_ts).getTime() : 0;
      var tb=b.submitted_ts ? new Date(b.submitted_ts).getTime() : 0;
      return tb-ta;
    });
  } else if(currentSort==='cheap'){
    toShow.sort(function(a,b){return Number(a.price)-Number(b.price);});
  } else if(currentSort==='expensive'){
    toShow.sort(function(a,b){return Number(b.price)-Number(a.price);});
  } else {
    toShow.sort(function(a,b){return (b.featured?1:0)-(a.featured?1:0);});
  }
  var grid=document.getElementById('listings-grid');
  var _lc=document.getElementById('listings-count'); if(_lc) _lc.textContent=toShow.length+' إعلان متاح';
  if(!toShow.length){
    grid.innerHTML='<div class="no-listings"><div class="nl-ico">🔍</div><div style="font-weight:700;font-size:16px;color:#1a2744;margin-bottom:8px">لا توجد إعلانات بهذا النطاق السعري</div><button onclick="clearPriceFilter()" style="background:linear-gradient(135deg,#023e8a,#0077b6);color:white;border:none;padding:12px 24px;border-radius:12px;font-family:Cairo,sans-serif;font-weight:700;cursor:pointer;font-size:14px;margin-top:10px">✕ مسح الفلتر</button></div>';
    return;
  }
  grid.innerHTML=buildAdCards(toShow);
}
function clearPriceFilter(){
  _priceFilterActive=false;
  document.getElementById('price-min').value='';
  document.getElementById('price-max').value='';
  var clearBtn=document.getElementById('price-filter-clear');
  if(clearBtn) clearBtn.style.display='none';
  renderCards(_currentListingsData,currentFilter);
  var _lc=document.getElementById('listings-count'); if(_lc) _lc.textContent=_currentListingsData.length+' إعلان متاح';
}

/* ════════ FORM ════════ */
// ✅ يحدد أي مجموعة chips تظهر حسب نوع العقار ونوع المعاملة:
// - شاليه: مجموعة خاصة (شاطئ خاص، حمام سباحة، كومباوند أمن...) في كل الحالات (تمليك أو إيجار)
// - شقة/بيت تمليك: مجموعة sale (مياه، غاز، أسانسير...)
// - شقة/بيت إيجار: مجموعة rent (كل الخدمات بما فيها مفروشة)
function _setActiveSvcChips(){
  var rc=document.getElementById('svc-chips-rent');
  var sc=document.getElementById('svc-chips-sale');
  var cc=document.getElementById('svc-chips-chalet');
  [rc,sc,cc].forEach(function(el){ if(el){ el.style.display='none'; } });
  var active;
  if(propType==='chalet') active=cc;
  else if(dealType==='sale') active=sc;
  else active=rc;
  if(active){ active.style.display='flex'; active.style.flexWrap='wrap'; active.style.gap='8px'; }
}
function selectProp(val){
  // ✅ FIX: مسح حقول الـ input عند تغيير نوع العقار لمنع انتقال البيانات
  // نمسح فقط الحقول الخاصة بالنوع (السعر، المساحة، الوصف، الدور، المساحة الإضافية)
  // ونحتفظ باسم المالك، الهاتف، والمنطقة لأنها مشتركة
  ['price','size','apt-area','floor','desc','compound-name'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.value = '';
  });
  // مسح عرض حقل الدور (لأن خيارات شقة وبيت مختلفة)
  var floorDisp = document.getElementById('floor-display');
  if(floorDisp){ floorDisp.textContent = 'اختر...'; floorDisp.classList.add('diyar-select-placeholder'); floorDisp.classList.remove('diyar-select-chosen'); }
  var priceHintEl = document.getElementById('price-hint');
  if(priceHintEl) priceHintEl.textContent = '';
  var rentTypeEl = document.getElementById('rentType');
  if(rentTypeEl) rentTypeEl.value = 'يومي';
  var rentTypeDisp = document.getElementById('rentType-display');
  if(rentTypeDisp){ rentTypeDisp.textContent='يومي'; rentTypeDisp.classList.remove('diyar-select-placeholder'); rentTypeDisp.classList.add('diyar-select-chosen'); }

  propType=val; dealType=''; selectedChips={}; nearSea=''; finishVal='';
  aptFurnish=''; aptPayment=''; shopPayment=''; chaletPool='';
  ['apt','house','chalet','land','shop'].forEach(v=>document.getElementById('btn-'+v).classList.toggle('on',v===val));
  ['sale','rent'].forEach(v=>document.getElementById('btn-'+v).classList.remove('on'));
  ['rest-form','rent-box','svc-box','finish-box','land-note','shop-deal-sec','deal-sec','svc-summary','finish-summary','shop-payment-row','apt-sale-extras','apt-area-wrap','compound-row','chalet-pool-row','subregion-row'].forEach(id=>hide(id));
  document.querySelectorAll('.chip,.sea-btn,.finish-btn').forEach(b=>b.classList.remove('on'));
  // reset shop/apt payment btns
  ['btn-shop-sale','btn-shop-rent','btn-pay-cash','btn-pay-install',
   'btn-furn-yes','btn-furn-no','btn-apt-cash','btn-apt-install','btn-pool-yes','btn-pool-no'].forEach(function(id){
    var b=document.getElementById(id);if(b)b.classList.remove('on');
  });
  if(val==='land'){show('land-note');dealType='sale';showRest();}
  else if(val==='shop'){show('shop-deal-sec');}
  else show('deal-sec'); // apt و house و chalet بيستخدموا نفس قسم اختيار المعاملة (تمليك/إيجار)
  if(val==='chalet') show('compound-row'); // اسم الكومباوند أو البحر — خاص بالشاليهات
  // ✅ إعادة تقييم ظهور حقل الحي بعد تغيير نوع العقار (مخفي دايماً للشاليه)
  onRegionChange();
  updateStepNumbers();
  var sl=document.getElementById('size-lbl'),si=document.getElementById('size');
  if(val==='apt'||val==='house'||val==='chalet'){sl.textContent='عدد الغرف';si.placeholder='3';}
  else{sl.textContent='المساحة (م²)';si.placeholder='200';}
  // تحديث تسمية حقل "الدور" حسب النوع — شقة/شاليه: الدور داخل العمارة، بيت: عدد الأدوار
  var flbl=document.getElementById('floor-lbl');
  if(flbl) flbl.textContent = (val==='house') ? 'كام دور' : 'الدور';
  if(floorDisp) floorDisp.textContent = (val==='house') ? 'اختر عدد الأدوار...' : 'اختر الدور...';
  document.getElementById('price-lbl').textContent='السعر (ج.م)';
  var d=document.getElementById('desc');
  d.placeholder=val==='apt'?'مثلاً: شقة بإطلالة بحرية، دور ثالث...':val==='house'?'مثلاً: بيت مستقل بحديقة خاصة، دورين...':val==='chalet'?'مثلاً: شاليه بكومباوند مميز، دور أرضي بحديقة...':val==='land'?'مثلاً: أرض في موقع مميز...':'مثلاً: محل في موقع حيوي، واجهة زجاجية...';
}

function selectShopDeal(val){
  // ✅ FIX: مسح السعر عند تغيير نوع صفقة المحل
  var _shopPriceEl = document.getElementById('price');
  if(_shopPriceEl) _shopPriceEl.value = '';
  var _shopHintEl = document.getElementById('price-hint');
  if(_shopHintEl) _shopHintEl.textContent = '';
  dealType=val;
  ['btn-shop-sale','btn-shop-rent'].forEach(function(id){var b=document.getElementById(id);if(b)b.classList.toggle('on',id==='btn-shop-'+val);});
  ['shop-payment-row','svc-box','finish-box','svc-summary','finish-summary'].forEach(id=>hide(id));
  document.querySelectorAll('.chip,.finish-btn').forEach(b=>b.classList.remove('on'));
  selectedChips={}; finishVal=''; shopPayment='';
  ['btn-pay-cash','btn-pay-install'].forEach(function(id){var b=document.getElementById(id);if(b)b.classList.remove('on');});
  if(val==='sale'){
    show('shop-payment-row');
  }
  document.getElementById('price-lbl').textContent = val==='sale' ? 'سعر التمليك (ج.م)' : 'الإيجار السنوي (ج.م)';
  showRest();
}

/* shopPayment declared globally above */
function selectShopPayment(val){
  shopPayment = val;
  ['btn-pay-cash','btn-pay-install'].forEach(function(id){
    var b=document.getElementById(id);
    if(b) b.classList.toggle('on', (val==='كاش'&&id==='btn-pay-cash')||(val==='أقساط'&&id==='btn-pay-install'));
  });
}
function selectDeal(val){
  // ✅ FIX: مسح حقول السعر والخصائص عند تغيير نوع الصفقة
  ['price','size','apt-area'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.value = '';
  });
  var priceHintEl2 = document.getElementById('price-hint');
  if(priceHintEl2) priceHintEl2.textContent = '';
  dealType=val;
  ['sale','rent'].forEach(v=>document.getElementById('btn-'+v).classList.toggle('on',v===val));
  ['svc-box','finish-box','rent-box','svc-summary','finish-summary','apt-sale-extras','apt-area-wrap'].forEach(id=>hide(id));
  document.querySelectorAll('.chip,.finish-btn').forEach(b=>b.classList.remove('on'));
  selectedChips={}; finishVal=''; aptFurnish=''; aptPayment='';
  ['btn-furn-yes','btn-furn-no','btn-apt-cash','btn-apt-install'].forEach(function(id){var b=document.getElementById(id);if(b)b.classList.remove('on');});
  if(val==='rent') show('rent-box');
  if(propType==='chalet'){
    // الشاليه: الخدمات (chips) ظاهرة دايماً (تمليك أو إيجار) بمجموعتها الخاصة
    // التشطيب يظهر فقط عند التمليك — غير مهم في سياق الإيجار اليومي/الأسبوعي/الموسمي
    show('svc-box'); _setActiveSvcChips();
    if(val==='sale'){ show('finish-box'); show('apt-sale-extras'); show('apt-area-wrap'); }
  } else if(val==='sale'&&(propType==='apt'||propType==='house')){
    show('svc-box'); show('finish-box'); show('apt-sale-extras'); show('apt-area-wrap');
    _setActiveSvcChips();
  } else if(val==='rent'&&(propType==='apt'||propType==='house')){
    // عند الإيجار: تظهر الخدمات فقط لو نوع الإيجار شتوي/سنوي (تُحسم في onRentTypeChange)
    _setActiveSvcChips();
  }
  showRest();
}
function onRentTypeChange(){
  var rt=document.getElementById('rentType').value;
  if(propType==='chalet'){
    // الشاليه: الخدمات ظاهرة دايماً بغض النظر عن نوع الإيجار — مفيش تشطيب في سياق الإيجار
    show('svc-box'); hide('finish-box'); hide('finish-summary');
    _setActiveSvcChips();
  } else {
    ['svc-box','finish-box','svc-summary','finish-summary'].forEach(id=>hide(id));
    document.querySelectorAll('.chip,.finish-btn').forEach(b=>b.classList.remove('on'));
    selectedChips={}; finishVal='';
    if((propType==='apt'||propType==='house')&&(rt==='شهري (شتوي)'||rt==='سنوي')){show('svc-box');show('finish-box');_setActiveSvcChips();}
  }
  var sr=document.getElementById('sea-row');
  if(propType==='chalet'){
    sr.classList.remove('hidden'); // الشاليه: المسافة عن البحر (الصف) ثابتة دايماً مهما كان نوع الإيجار
  } else if(rt==='يومي'||rt==='أسبوعي'||rt==='شهري (صيفي)'){sr.classList.remove('hidden');}
  else{sr.classList.add('hidden');document.querySelectorAll('.sea-btn').forEach(b=>b.classList.remove('on'));nearSea='';}
  updateStepNumbers();
}
/* لما يختار "مدينة مطروح" بالذات يظهر حقل الحي/المنطقة الفرعية، غير ذلك يتخفي ويتصفّر */
function onRegionChange(){
  var region = document.getElementById('region').value;
  var row = document.getElementById('subregion-row');
  if(!row) return;
  // ✅ الحي/المنطقة بقى حقل كتابة حر، ولا يظهر أصلاً للشاليه (مش منطقي فيه)
  if(region === 'مدينة مطروح' && propType !== 'chalet'){
    row.classList.remove('hidden');
  } else {
    row.classList.add('hidden');
    var subEl = document.getElementById('subregion');
    if(subEl) subEl.value = '';
  }
}
function selectFurnish(val){
  aptFurnish=val;
  document.getElementById('btn-furn-yes').classList.toggle('on',val==='مفروشة');
  document.getElementById('btn-furn-no').classList.toggle('on',val==='غير مفروشة');
}
function selectAptPayment(val){
  aptPayment=val;
  document.getElementById('btn-apt-cash').classList.toggle('on',val==='كاش');
  document.getElementById('btn-apt-install').classList.toggle('on',val==='أقساط');
}
function showRest(){
  show('rest-form');
  document.getElementById('floor-row').classList.toggle('hidden',propType!=='apt'&&propType!=='house');
  document.getElementById('shop-area-row').classList.add('hidden'); // always hidden
  var sr=document.getElementById('sea-row');
  var seaNormal=document.getElementById('sea-options-normal');
  var seaChalet=document.getElementById('sea-options-chalet');
  if(propType==='chalet'){
    sr.classList.remove('hidden'); // الشاليه: المسافة عن البحر مهمة دايماً — تمليك أو أي نوع إيجار
    if(seaNormal) seaNormal.style.display='none';
    if(seaChalet) seaChalet.style.display='grid';
  } else {
    if(seaNormal) seaNormal.style.display='grid';
    if(seaChalet) seaChalet.style.display='none';
    if((propType==='apt'||propType==='house')&&dealType==='rent'){
      var rt=document.getElementById('rentType').value;
      sr.classList.toggle('hidden',!(rt==='يومي'||rt==='أسبوعي'||rt==='شهري (صيفي)'));
    } else sr.classList.add('hidden');
  }
  document.getElementById('chalet-pool-row').classList.toggle('hidden',propType!=='chalet');
  updateStepNumbers();
}
function updateStepNumbers(){
  var circled=['①','②','③','④','⑤','⑥','⑦'];
  var n=1; // ① نوع العقار — ثابت دايماً
  var propLbl=document.getElementById('prop-type-lbl');
  if(propLbl) propLbl.textContent=circled[n-1]+' نوع العقار';

  // ② نوع المعاملة (deal-sec أو shop-deal-sec — أيًّا منهم ظاهر)
  var dealVisible = !document.getElementById('deal-sec').classList.contains('hidden')
                  || !document.getElementById('shop-deal-sec').classList.contains('hidden');
  if(dealVisible){
    n++;
    var dl=document.getElementById('deal-sec-lbl'), sdl=document.getElementById('shop-deal-sec-lbl');
    if(dl) dl.textContent=circled[n-1]+' نوع المعاملة';
    if(sdl) sdl.textContent=circled[n-1]+' نوع المعاملة';
  }

  // نوع الإيجار (rent-box)
  var rentVisible = !document.getElementById('rent-box').classList.contains('hidden');
  if(rentVisible){
    n++;
    var rl=document.getElementById('rent-box-lbl');
    if(rl) rl.textContent=circled[n-1]+' نوع الإيجار';
  }

  // الخدمات والمرافق (svc-box)
  var hs=!document.getElementById('svc-box').classList.contains('hidden');
  if(hs){
    n++;
    document.getElementById('svc-lbl').textContent=circled[n-1]+' الخدمات والمرافق المتاحة';
  }

  // التشطيب (finish-box)
  var hf=!document.getElementById('finish-box').classList.contains('hidden');
  if(hf){
    n++;
    document.getElementById('finish-lbl').textContent=circled[n-1]+' التشطيب';
  }

  // المنطقة — آخر خطوة دايماً
  n++;
  document.getElementById('region-lbl').textContent=(circled[n-1]||n+'.')+' المنطقة في مطروح';
}
function toggleChip(el,id){
  selectedChips[id]=!selectedChips[id]; el.classList.toggle('on',!!selectedChips[id]);
  var lm={water:'مياه',gas:'غاز',elec:'كهرباء',sewage:'صرف صحي',elev:'أسانسير',park:'جراج',sec:'أمن وحراسة',seaview:'إطلالة بحر',furn:'مفروشة',ac:'تكييف',pool:'حمام سباحة',privatebeach:'شاطئ خاص',gym:'جيم',compsec:'كومباوند أمن'};
  var ch=Object.keys(selectedChips).filter(k=>selectedChips[k]).map(k=>lm[k]);
  var s=document.getElementById('svc-summary');
  if(ch.length){s.textContent='✅ '+ch.join(' · ');s.classList.remove('hidden');}else s.classList.add('hidden');
}
function selectFinish(val){
  finishVal=val;
  document.querySelectorAll('.finish-btn').forEach(b=>b.classList.remove('on'));
  document.getElementById({'سوبر لوكس':'fin-super','لوكس':'fin-lux','نص تشطيب':'fin-semi','عظم':'fin-bare'}[val]).classList.add('on');
  var s=document.getElementById('finish-summary');s.textContent='🎨 التشطيب: '+val;s.classList.remove('hidden');
}
function selectSea(el,val){
  nearSea=val;document.querySelectorAll('.sea-btn').forEach(b=>b.classList.remove('on'));el.classList.add('on');
}
function selectChaletPool(val){
  chaletPool=val;
  document.getElementById('btn-pool-yes').classList.toggle('on',val==='حمام سباحة');
  document.getElementById('btn-pool-no').classList.toggle('on',val==='بدون');
}

/* ════════ PHOTOS & VIDEOS ════════ */

// ضغط الصور قبل الرفع (Canvas-based) — يقلّل الحجم دون التأثير على الجودة المرئية
// الحد الأقصى للبعد الطويل 1920px وجودة JPEG 0.82 (متوازن بين الوضوح وحجم الملف)
function compressImageFile(file, maxDim, quality){
  maxDim = maxDim || 1280;
  quality = quality || 0.78;
  return new Promise(function(resolve){
    // GIF تُترك كما هي — إعادة ترميزها كـ JPEG يكسر الحركة
    if(file.type === 'image/gif'){ resolve(file); return; }
    var img = new Image();
    var objUrl = URL.createObjectURL(file);
    var _done = false;
    function _cleanup(){ if(!_done){ _done=true; try{ URL.revokeObjectURL(objUrl); }catch(e){} } }

    img.onload = function(){
      _cleanup();
      var w = img.naturalWidth || img.width;
      var h = img.naturalHeight || img.height;
      if(!w || !h){ resolve(file); return; }

      // صورة صغيرة بالفعل وحجمها مناسب — ما تضغطهاش
      if(w <= maxDim && h <= maxDim && file.size <= 500 * 1024){ resolve(file); return; }

      if(w > maxDim || h > maxDim){
        if(w >= h){ h = Math.round(h * (maxDim / w)); w = maxDim; }
        else { w = Math.round(w * (maxDim / h)); h = maxDim; }
      }

      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      // جرّب WebP أولاً (أصغر 20-30% من JPEG بنفس الجودة)
      var outputType = 'image/jpeg', outputExt = '.jpg';
      try{
        var t = canvas.toDataURL('image/webp');
        if(t && t.startsWith('data:image/webp')){ outputType='image/webp'; outputExt='.webp'; }
      } catch(e){}

      canvas.toBlob(function(blob){
        if(!blob || blob.size >= file.size){ resolve(file); return; }
        var baseName = (file.name || 'photo').replace(/\.[^.]+$/, '');
        resolve(new File([blob], baseName + outputExt, { type: outputType, lastModified: Date.now() }));
      }, outputType, quality);
    };

    img.onerror = function(){ _cleanup(); resolve(file); };
    setTimeout(function(){ if(!_done){ _cleanup(); resolve(file); } }, 30000);
    img.src = objUrl;
  });
}

function _countByType(type){
  return uploadedPhotoTypes.filter(function(t){ return t === type; }).length;
}

async function handlePhotos(input){
  var files = Array.from(input.files);
  if(!files.length) return;

  // HEIC/HEIF من iOS — المتصفح يعرفها بـ type فارغ أو image/heic
  // نقبلها ونحاول ضغطها عبر Canvas (الـ img.onload يعالجها في أغلب المتصفحات الحديثة)
  function _isImage(f){ return f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name); }
  function _isVideo(f){ return f.type.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(f.name); }

  var incomingImages = files.filter(function(f){ return _isImage(f); });
  var incomingVideos = files.filter(function(f){ return !_isImage(f) && _isVideo(f); });
  var unknown = files.filter(function(f){ return !_isImage(f) && !_isVideo(f); });
  if(unknown.length){
    toast('⚠️ تم تجاهل ' + unknown.length + ' ملف غير مدعوم (فقط صور وفيديوهات)');
  }

  var curImages = _countByType('image');
  var curVideos = _countByType('video');
  var remainImg = Math.max(0, MAX_IMAGES - curImages);
  var remainVid = Math.max(0, MAX_VIDEOS - curVideos);

  if(incomingImages.length > remainImg){
    toast('⚠️ يمكن إضافة ' + remainImg + ' صورة فقط (وصلت الحد الأقصى ' + MAX_IMAGES + ')');
    incomingImages = incomingImages.slice(0, remainImg);
  }
  if(incomingVideos.length > remainVid){
    toast('⚠️ يمكن إضافة ' + remainVid + ' فيديو فقط (الحد الأقصى ' + MAX_VIDEOS + ')');
    incomingVideos = incomingVideos.slice(0, remainVid);
  }

  var MAX_IMAGE_SIZE = 25 * 1024 * 1024;   // 25MB قبل الضغط
  // ⚠️ حد Cloudinary لرفع غير موقّع (unsigned upload) على الخطة المجانية هو 100MB للفيديو.
  // رفع فيديو أكبر من هذا سينجح محلياً (يمر الفحص هنا) لكن Cloudinary سيرفضه بخطأ 400/413،
  // لذلك يجب أن يطابق هذا الحد إعدادات الحساب الفعلية في Cloudinary Dashboard.
  var MAX_VIDEO_SIZE = 100 * 1024 * 1024;  // 100MB

  // معالجة الصور: ضغط ثم push للمعاينة
  for(var i=0; i<incomingImages.length; i++){
    var f = incomingImages[i];
    if(f.size > MAX_IMAGE_SIZE){
      toast('❌ الصورة كبيرة جداً (الحد 25MB): ' + (f.name || ''));
      continue;
    }
    try{
      var compressed = await compressImageFile(f);
      await _pushMediaFile(compressed, 'image');
    } catch(e){
      console.warn('[compress] فشل الضغط، سيُستخدم الأصل:', e);
      await _pushMediaFile(f, 'image');
    }
  }

  // الفيديو: لا ضغط في المتصفح (مكلف جداً) — يُحسَّن عبر Cloudinary URL transform عند العرض
  for(var j=0; j<incomingVideos.length; j++){
    var vf = incomingVideos[j];
    if(vf.size > MAX_VIDEO_SIZE){
      var sizeMB = Math.round(vf.size / 1024 / 1024);
      toast('❌ الفيديو كبير جداً (' + sizeMB + 'MB — الحد 100MB): ' + (vf.name || ''));
      continue;
    }
    await _pushMediaFile(vf, 'video');
  }

  input.value = '';
}

function _pushMediaFile(file, type){
  return new Promise(function(resolve){
    if(type === 'video'){
      // معاينة الفيديو كـ object URL (أخف من قراءته بالكامل كـ base64)
      var url = URL.createObjectURL(file);
      _uploadedPhotoFiles.push(file);
      uploadedPhotoTypes.push(type);
      uploadedPhotos.push(url);
      renderPhotos();
      resolve();
    } else {
      var r = new FileReader();
      r.onload = function(e){
        // الـ push يحدث فقط بعد نجاح القراءة، حفاظاً على تطابق فهرسة
        // uploadedPhotos مع _uploadedPhotoFiles و uploadedPhotoTypes دائماً
        _uploadedPhotoFiles.push(file);
        uploadedPhotoTypes.push(type);
        uploadedPhotos.push(e.target.result);
        renderPhotos();
        resolve();
      };
      r.onerror = function(){
        toast('❌ تعذّرت قراءة الملف: ' + (file.name || ''));
        resolve();
      };
      r.readAsDataURL(file);
    }
  });
}

function renderPhotos(){
  var prev = document.getElementById('photo-previews');
  var ph = document.getElementById('photo-placeholder');
  if(!prev || !ph) return;
  prev.innerHTML = '';
  var total = uploadedPhotos.length;
  if(total){
    ph.style.display = 'none';
    prev.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%';
    uploadedPhotos.forEach(function(src, i){
      var isVideo = uploadedPhotoTypes[i] === 'video';
      var w = document.createElement('div');
      w.className = 'photo-thumb-wrap';
      w.style.cssText = 'position:relative;aspect-ratio:1;border-radius:12px;overflow:hidden;background:#0a1628';
      var mediaHtml = isVideo
        ? '<video src="'+src+'" style="width:100%;height:100%;object-fit:cover" muted></video>'+
          '<div style="position:absolute;bottom:4px;left:4px;background:rgba(10,22,40,.7);color:#fff;border-radius:8px;padding:2px 6px;font-size:11px;display:flex;align-items:center;gap:3px">🎬 فيديو</div>'
        : '<img src="'+src+'" style="width:100%;height:100%;object-fit:cover">';
      w.innerHTML = mediaHtml +
        '<button class="photo-del" onclick="removePhoto('+i+')" style="position:absolute;top:4px;right:4px;background:rgba(220,38,38,.85);color:white;border:none;border-radius:50%;width:22px;height:22px;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700">✕</button>';
      prev.appendChild(w);
    });
    if(_countByType('image') < MAX_IMAGES || _countByType('video') < MAX_VIDEOS){
      var a = document.createElement('div');
      a.style.cssText = 'aspect-ratio:1;border-radius:12px;border:2px dashed #c9a84c;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;font-size:24px;color:#c9a84c;background:#fdfaf4;gap:4px';
      a.innerHTML = '+<span style="font-size:10px;font-weight:700">إضافة</span>';
      a.onclick = function(){ document.getElementById('photo-input').click(); };
      prev.appendChild(a);
    }
  } else {
    ph.style.display = '';
    prev.style.display = 'none';
  }
  _updatePhotoCounterLabel();
}

function _updatePhotoCounterLabel(){
  var label = document.getElementById('photo-area-label');
  if(!label) return;
  var imgC = _countByType('image'), vidC = _countByType('video');
  label.textContent = '📸 صور وفيديوهات العقار — اختياري (حتى ' + MAX_IMAGES + ' صور و ' + MAX_VIDEOS + ' فيديو) · ' + imgC + '/' + MAX_IMAGES + ' صور، ' + vidC + '/' + MAX_VIDEOS + ' فيديو';
}

function removePhoto(i){
  var src = uploadedPhotos[i];
  if(uploadedPhotoTypes[i] === 'video' && src && src.startsWith('blob:')){
    try{ URL.revokeObjectURL(src); }catch(e){}
  }
  uploadedPhotos.splice(i,1);
  uploadedPhotoTypes.splice(i,1);
  if(_uploadedPhotoFiles) _uploadedPhotoFiles.splice(i,1);
  renderPhotos();
}

// تحرّر كل blob URLs الخاصة بمعاينات الفيديو، ثم تُصفّر الحالة بالكامل
// يجب استدعاء هذه الدالة بدل التصفير المباشر (uploadedPhotos=[]) في أي نقطة
// تُنهي جلسة النموذج (نشر ناجح، تسجيل خروج، إلغاء)، لتفادي تسريب ذاكرة الـ blob URLs
function clearUploadedMedia(){
  uploadedPhotos.forEach(function(src, i){
    if(uploadedPhotoTypes[i] === 'video' && src && src.indexOf('blob:') === 0){
      try{ URL.revokeObjectURL(src); }catch(e){}
    }
  });
  uploadedPhotos = [];
  uploadedPhotoTypes = [];
  _uploadedPhotoFiles = [];
}


function buildSkeletonCards(count){
  var html = '<div class="shimmer-wrap">';
  for(var i=0;i<(count||4);i++){
    html += '<div class="sk-card">'+
      '<div class="sk-img skeleton"></div>'+
      '<div class="sk-body">'+
        '<div class="sk-line w80 h16 skeleton"></div>'+
        '<div class="sk-line w60 skeleton"></div>'+
        '<div class="sk-line w40 skeleton"></div>'+
        '<div class="sk-line w100 h20 skeleton" style="margin-top:auto"></div>'+
      '</div>'+
    '</div>';
  }
  html += '</div>';
  return html;
}


/* ════════ VIRTUAL SCROLL ════════ */
function renderVirtualBatch(grid, reset){
  if(!grid) grid = document.getElementById('listings-grid');
  if(!grid) return;
  var start = reset ? 0 : (_vsPage * _vsPageSize);
  var batch = _vsAllAds.slice(start, start + _vsPageSize);
  if(reset){
    grid.innerHTML = buildAdCards(batch);
    _vsPage = 1;
  } else {
    var loadMoreBtn = document.getElementById('vs-load-more');
    if(loadMoreBtn) loadMoreBtn.remove();
    grid.insertAdjacentHTML('beforeend', buildAdCards(batch));
    _vsPage++;
  }
  // Show "load more" button if more ads exist
  var shown = _vsPage * _vsPageSize;
  if(shown < _vsAllAds.length){
    var remaining = _vsAllAds.length - shown;
    var btn = document.createElement('div');
    btn.id = 'vs-load-more';
    btn.style.cssText = 'text-align:center;padding:16px 0;';
    btn.innerHTML = '<button onclick="renderVirtualBatch()" style="background:linear-gradient(135deg,#c9a84c,#e8d08a);color:#0a1628;border:none;padding:12px 32px;border-radius:50px;font-family:Cairo,sans-serif;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 4px 16px rgba(201,168,76,.3)">عرض '+remaining+' إعلان آخر ↓</button>';
    grid.appendChild(btn);
  }
}
/* ════════ PREVIEW SYSTEM ════════ */
var _pendingAd = null;

function buildAdMsg(ad){
  var pl={apt:'شقة',house:'بيت',chalet:'شاليه',land:'أرض',shop:'محل'};
  var dl={sale:'تمليك',rent:'إيجار'};
  var lm={water:'مياه',gas:'غاز',elec:'كهرباء',sewage:'صرف صحي',elev:'أسانسير',park:'جراج',sec:'أمن',seaview:'إطلالة بحر',furn:'مفروشة',ac:'تكييف',pool:'حمام سباحة',privatebeach:'شاطئ خاص',gym:'جيم',compsec:'كومباوند أمن'};
  var msg='🔔 *إعلان جديد ينتظر مراجعتك*\n';
  msg+='━━━━━━━━━━━━━━━━━\n';
  msg+='👤 *المعلن:* '+ad.ownerName+'\n';
  msg+='📌 *النوع:* '+(pl[ad.propType]||ad.propType)+' — '+(dl[ad.dealType]||'')+(ad.rentType?' ('+ad.rentType+')':'')+'\n';
  msg+='📍 *المنطقة:* '+ad.region+'\n';
  if(ad.subRegion) msg+='📍 *الحي:* '+ad.subRegion+'\n';
  if(ad.compoundName) msg+='🏘️ *الكومباوند:* '+ad.compoundName+'\n';
  msg+='💰 *السعر:* '+Number(ad.price).toLocaleString('ar-EG')+' ج.م\n';
  if(ad.size) msg+=((ad.propType==='apt'||ad.propType==='house'||ad.propType==='chalet')?'🛏 *الغرف:* ':'📐 *المساحة:* ')+ad.size+((ad.propType!=='apt'&&ad.propType!=='house'&&ad.propType!=='chalet')?' م²':'')+'\n';
  if(ad.aptArea) msg+='📐 *المساحة:* '+ad.aptArea+' م²\n';
  if(ad.floor) msg+='🏢 *الدور:* '+ad.floor+'\n';
  if(ad.nearSea) msg+='🌊 *قرب البحر:* '+ad.nearSea+'\n';
  if(ad.chaletPool) msg+='🏊 *حمام سباحة:* '+ad.chaletPool+'\n';
  if(ad.finishVal) msg+='🎨 *التشطيب:* '+ad.finishVal+'\n';
  if(ad.aptFurnish) msg+='🛋️ *الفرش:* '+ad.aptFurnish+'\n';
  if(ad.aptPayment) msg+='💳 *الدفع:* '+ad.aptPayment+'\n';
  if(ad.services&&ad.services.length) msg+='✅ *الخدمات:* '+ad.services.map(function(k){return lm[k]||k;}).join(' · ')+'\n';
  if(ad.desc) msg+='📝 '+ad.desc+'\n';
  msg+='━━━━━━━━━━━━━━━━━\n';
  msg+='📞 *واتساب المعلن:* '+ad.phone+'\n';
  msg+='🔗 wa.me/'+ad.phone.replace(/^0/,'20')+'\n';
  msg+='🕐 '+ad.submittedAt+'\n\n';
  msg+='افتح لوحة التحكم للموافقة أو الرفض ✅❌';
  return msg;
}

async function validateForm(){
  try{
  var profile=loadBrokerProfile();
  var _hasProfile = !!(profile && profile.name && profile.phone);
  var _onEl=document.getElementById('owner-name');
  var name=_hasProfile?profile.name:(_onEl?_onEl.value.trim():'');
  var region=document.getElementById('region').value;
  var price = _toEn(document.getElementById('price').value||'').replace(/[^\d]/g,'');
  /* رقم الواتساب: لو فيه ملف شخصي كامل نستخدمه، غير ذلك نأخذ القيمة المكتوبة في الحقل (وهو ظاهر للمستخدم في هذه الحالة) */
  var _phEl=document.getElementById('phone');
  var phone=_hasProfile?profile.phone:(_phEl?_phEl.value.replace(/\s/g,''):'');
  if(!name){toast('❌ الاسم مطلوب — من فضلك أدخل اسمك الكامل');return null;}
  if(!propType){toast('❌ اختر نوع العقار أولاً (شقة / بيت / شاليه / أرض / محل)');return null;}
  if(!dealType){toast('❌ اختر نوع المعاملة (بيع / إيجار)');return null;}
  if(!region){toast('❌ اختر المنطقة من القائمة');return null;}
  var subRegion = '';
  if(region === 'مدينة مطروح' && propType !== 'chalet'){
    var _subEl=document.getElementById('subregion');
    subRegion = _subEl ? _subEl.value.trim() : '';
    if(!subRegion){toast('❌ اكتب اسم الحي أو المنطقة في مدينة مطروح');return null;}
  }
  if(!price || isNaN(Number(price)) || Number(price) <= 0){toast('❌ السعر مطلوب ويجب أن يكون رقمًا أكبر من الصفر');return null;}
  if(!phone){toast('❌ رقم الواتساب مطلوب — من فضلك أدخله');return null;}
  if(!/^(010|011|012|015)\d{8}$/.test(phone)){toast('⚠️ رقم الواتساب غير صحيح — من فضلك تأكد منه');return null;}
  var adCode = '_PENDING_'; // سيُعيَّن عند الإرسال الفعلي فقط لتجنب هدر أرقام
  return {
    id:'ad_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),
    adCode: adCode,
    submitterPhone: currentUser ? currentUser.phone : phone,
    ownerName:name, region, subRegion, price, phone, propType, dealType,
    rentType:dealType==='rent'&&(propType==='apt'||propType==='house'||propType==='chalet')?document.getElementById('rentType').value:'',
    shopPayment:propType==='shop'&&dealType==='sale'?shopPayment:'',
    size:document.getElementById('size').value,
    aptArea:(propType==='apt'||propType==='house'||propType==='chalet')&&dealType==='sale'?(document.getElementById('apt-area')?document.getElementById('apt-area').value:''):'',
    floor:(propType==='apt'||propType==='house')?document.getElementById('floor').value:'',
    compoundName: propType==='chalet'?(document.getElementById('compound-name')?document.getElementById('compound-name').value.trim():''):'',
    chaletPool: propType==='chalet'?chaletPool:'',
    nearSea, finishVal, aptFurnish, aptPayment,
    services:Object.keys(selectedChips).filter(function(k){return selectedChips[k];}),
    desc:document.getElementById('desc').value.trim(),
    photos:[],
    brokerPhoto: profile?profile.photo:'',
    brokerType: profile?profile.accountType:'',
    submittedAt:new Date().toLocaleString('ar-EG'),
    submitted_ts: new Date().toISOString()
  };
  }catch(e){
    console.error('validateForm error:',e);
    toast('❌ حدث خطأ أثناء التحقق من البيانات');
    return null;
  }
}

async function openPreview(){
  try{
    var ad = await validateForm();
    if(!ad) return;
    _pendingAd = ad;
    document.getElementById('preview-msg').textContent = buildAdMsg(ad);
    (function(){var _e=document.getElementById('preview-overlay');if(_e)_e.classList.remove('hidden')})();
    window.scrollTo({top:0,behavior:'smooth'});
  }catch(e){
    console.error('openPreview error:',e);
    toast('❌ حدث خطأ أثناء فتح المعاينة');
  }
}

function closePreview(){
  (function(){var _e=document.getElementById('preview-overlay');if(_e)_e.classList.add('hidden')})();
  _pendingAd = null;
}

async function confirmSend(){
  if(!_pendingAd){closePreview();return;}
  var ad = _pendingAd;
  var _bp = loadBrokerProfile();
  ad.submitterPhone = _bp ? (_bp.linkedPhone || _bp.phone) : (currentUser ? currentUser.phone : ad.phone);
  (function(){var _e=document.getElementById('preview-overlay');if(_e)_e.classList.add('hidden')})();
  _pendingAd = null;
  try{
    var photoFiles = _uploadedPhotoFiles || [];
    ad.updated_at = new Date().toISOString();
    ad.adCode = 'MT-' + ad.id.slice(-6).toUpperCase(); // كود مؤقت فوري
    ad.photos = [];

    // ⚡⚡ نجاح فوري — نفس أسلوب submitAdDirect: الحفظ الفعلي ورفع الصور يحصلان بالخلفية
    ad._sending = true;
    (function(){ var _ld=loadDB(); _ld.pending=[ad].concat(_ld.pending||[]); saveDB(_ld); })();
    updateNotifDot();
    updateMyAdsCard();
    showSuccessScreen();
    toast('✅ تم إرسال إعلانك للمراجعة!');
    var _ms=document.getElementById('s-myads'); if(_ms&&_ms.classList.contains('active')) _doRenderMyAds();

    _finishAdSubmissionInBackground(ad, photoFiles);
  } catch(e){
    console.error('confirmSend error:', e);
    toast('❌ ' + (e.message || 'حدث خطأ أثناء إرسال الإعلان'));
  }
}

var _adSubmitCancelled = false;
var _adSubmitInProgress = false;

function cancelAdSubmit(){
  if(!_adSubmitInProgress) return;
  _adSubmitCancelled = true;
  abortActiveUploads();
  hideUploadProgress();
  hideSendAdProgress();
  _resetSubmitBtnUI();
  toast('🚫 تم إلغاء إرسال الإعلان');
}

function _setSubmitBtnBusy(busy){
  var btn  = document.getElementById('submit-ad-btn');
  var cancelBtn = document.getElementById('submit-cancel-btn');
  if(btn){
    if(busy){
      btn.dataset.origHtml = btn.innerHTML;
      btn.disabled = true;
      btn.style.opacity = '0.75';
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" style="animation:spin 1s linear infinite;flex-shrink:0"><circle cx="12" cy="12" r="10" stroke-opacity=".3"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg><span style="margin-right:6px">جاري الإرسال...</span>';
    } else if(btn.dataset.origHtml){
      btn.innerHTML = btn.dataset.origHtml;
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  }
  if(cancelBtn) cancelBtn.classList.toggle('hidden', !busy);
}
function _resetSubmitBtnUI(){
  _adSubmitInProgress = false;
  _setSubmitBtnBusy(false);
}

async function submitAdDirect(){
  if(_adSubmitInProgress) return; // ✅ يمنع الإرسال المزدوج لو المستخدم ضغط الزر مرتين بسرعة
  _adSubmitCancelled = false;
  _adSubmitInProgress = true;
  try{
    var ad = await validateForm();
    if(!ad){ _resetSubmitBtnUI(); return; }

    var _bp2 = loadBrokerProfile();
    ad.submitterPhone = _bp2 ? (_bp2.linkedPhone || _bp2.phone) : (currentUser ? currentUser.phone : ad.phone);
    ad.updated_at = new Date().toISOString();
    ad.adCode = 'MT-' + ad.id.slice(-6).toUpperCase(); // كود مؤقت فوري، يُستبدل بالكود الرسمي فور جاهزيته في الخلفية
    ad.photos = []; // الصور (لو وُجدت) تُرفع في الخلفية وتُلحق بالإعلان لاحقاً

    var photoFiles = _uploadedPhotoFiles || [];

    // ⚡⚡ نجاح فوري: بمجرد التحقق من البيانات، نعتبر الإعلان "مُرسل" من منظور المستخدم —
    // رفع الصور وحفظ Firebase الفعلي يحصلان بالكامل في الخلفية دون أي انتظار
    ad._sending = true; // علامة محلية فقط (لا تُحفظ على السيرفر) تدل إنه لسه بيتبعت فعلياً
    (function(){ var _ld=loadDB(); _ld.pending=[ad].concat(_ld.pending||[]); saveDB(_ld); })();
    updateNotifDot();
    updateMyAdsCard();
    renderSuccessAdPreview(ad);
    resetForm();
    _resetSubmitBtnUI();
    go('success');
    toast('✅ تم إرسال إعلانك بنجاح!');
    var _ms=document.getElementById('s-myads'); if(_ms&&_ms.classList.contains('active')) _doRenderMyAds();

    // ── من هنا فصاعداً: كل حاجة في الخلفية، لا تُعطّل واجهة المستخدم أبداً ──
    _finishAdSubmissionInBackground(ad, photoFiles);
  } catch(err){
    console.error('submitAdDirect error:', err);
    _resetSubmitBtnUI();
    var msg = err.message || 'حدث خطأ غير معروف';
    if(msg.includes('network') || msg.includes('fetch')) msg = 'تحقق من اتصال الإنترنت';
    toast('❌ ' + msg);
  }
}

// ── يكمل رفع الصور وتوليد كود الإعلان الرسمي وحفظ الإعلان فعلياً على Firebase، كل ده بعد ما المستخدم شاف رسالة النجاح ──
var _BG_FINISH_TIMEOUT_MS = 120000; // سقف زمني شامل 2 دقيقة — بعده نعتبرها فشلت حتى لو حصل تعليق غير متوقع في أي خطوة

async function _finishAdSubmissionInBackground(ad, photoFiles){
  var adCodePromise = getNextAdCode();

  var uploadPromise = (photoFiles && photoFiles.length > 0)
    ? uploadAllPhotosToCloudinary(photoFiles, function(){ /* بدون شريط تقدّم — المستخدم غادر الشاشة بالفعل */ }).catch(function(e){
        console.warn('[submit-bg] فشل رفع الصور:', e.message);
        return []; // الإعلان أهم من الصور — يُحفظ بدونها لو فشل الرفع نهائياً
      })
    : Promise.resolve([]);

  try{
    var results = await _withTimeout(
      Promise.all([adCodePromise.catch(function(){ return ad.adCode; }), uploadPromise]),
      _BG_FINISH_TIMEOUT_MS,
      'انتهت مهلة رفع الصور'
    );
    var realCode = results[0];
    var cloudUrls = results[1];
    if(realCode) ad.adCode = realCode;
    if(cloudUrls && cloudUrls.length) ad.photos = cloudUrls;
    ad.updated_at = new Date().toISOString();

    // ✅ نُرسل نسخة نظيفة للسيرفر بدون أعلام محلية (_sending/_sendFailed) — لا يجب أن تُخزَّن في Firestore
    var _serverCopy = Object.assign({}, ad);
    delete _serverCopy._sending;
    delete _serverCopy._sendFailed;
    await _upsertAdSB(_serverCopy, 'pending');

    // ── نجح الحفظ الفعلي — حدّث الكاش المحلي والواجهة بصمت ──
    delete ad._sending;
    delete ad._sendFailed;
    (function(){
      var _ld = loadDB();
      _ld.pending = (_ld.pending||[]).map(function(a){ return a.id === ad.id ? ad : a; });
      saveDB(_ld);
    })();
    _dbCacheTime = 0;
    loadDBAsync(true).catch(function(e){ console.warn('loadDBAsync:', e.message); });
    updateMyAdsCard();
    var _ms2 = document.getElementById('s-myads'); if(_ms2 && _ms2.classList.contains('active')) _doRenderMyAds();
    var _ao = document.getElementById('admin-overlay'); if(_ao && !_ao.classList.contains('hidden')) renderAdminPanel();
    _notifyAdminNewAd(ad);
  } catch(err){
    // ── فشل الحفظ نهائياً (أو تجاوز السقف الزمني الشامل) — الإعلان ظاهر محلياً لكن لم يصل للسيرفر بعد ──
    console.error('[submit-bg] فشل حفظ الإعلان نهائياً:', err.message);
    ad._sendFailed = true;
    delete ad._sending;
    (function(){
      var _ld = loadDB();
      _ld.pending = (_ld.pending||[]).map(function(a){ return a.id === ad.id ? ad : a; });
      saveDB(_ld);
    })();
    updateMyAdsCard();
    var _ms3 = document.getElementById('s-myads'); if(_ms3 && _ms3.classList.contains('active')) _doRenderMyAds();
    toast('⚠️ تعذّر إرسال إعلانك (' + (ad.adCode||'') + ') — تحقق من الاتصال وأعد المحاولة من "إعلاناتي"');
  }
}

// ── إعادة محاولة إرسال إعلان فشل حفظه نهائياً في الخلفية ──
async function retryFailedAd(id){
  var db = loadDB();
  var ad = (db.pending||[]).find(function(a){ return a.id === id; });
  if(!ad) return;
  delete ad._sendFailed;
  ad._sending = true;
  db.pending = db.pending.map(function(a){ return a.id === id ? ad : a; });
  saveDB(db);
  updateMyAdsCard();
  var _ms = document.getElementById('s-myads'); if(_ms && _ms.classList.contains('active')) _doRenderMyAds();
  toast('🔄 جاري إعادة إرسال الإعلان...');
  _finishAdSubmissionInBackground(ad, []);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  