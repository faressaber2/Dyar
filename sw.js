/* ════════════════════════════════════════════
   ديار — Service Worker
   يكتشف انقطاع الإنترنت ويعرض صفحة offline.html
   ════════════════════════════════════════════ */

var SW_VERSION = 'diyar-sw-v1';

/* ── عند التثبيت: خزّن صفحة offline فقط ── */
self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(SW_VERSION).then(function(cache){
      return cache.addAll(['/offline.html']);
    })
  );
  self.skipWaiting();
});

/* ── عند التفعيل: امسح الكاشات القديمة ── */
self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== SW_VERSION; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

/* ── عند كل طلب شبكة ── */
self.addEventListener('fetch', function(event){
  /* تجاهل الطلبات غير-GET وطلبات Firebase/Cloudinary/OpenRouter */
  if(event.request.method !== 'GET') return;
  var url = event.request.url;
  if(
    url.includes('firestore.googleapis.com') ||
    url.includes('firebase') ||
    url.includes('cloudinary.com') ||
    url.includes('openrouter.ai') ||
    url.includes('googleapis.com') ||
    url.includes('gstatic.com') ||
    url.startsWith('chrome-extension')
  ) return;

  /* للتنقل بين الصفحات (navigation) */
  if(event.request.mode === 'navigate'){
    event.respondWith(
      fetch(event.request).catch(function(){
        return caches.match('/offline.html');
      })
    );
    return;
  }

  /* للموارد الأخرى (JS, CSS, fonts …) — Network only, بدون كاش */
  event.respondWith(
    fetch(event.request).catch(function(){
      /* لو كان HTML ارجع offline.html */
      var accept = event.request.headers.get('Accept') || '';
      if(accept.includes('text/html')){
        return caches.match('/offline.html');
      }
      return new Response('', { status: 503 });
    })
  );
});

/* ── رسائل من الصفحة الرئيسية ── */
self.addEventListener('message', function(event){
  if(event.data === 'SKIP_WAITING') self.skipWaiting();
});
