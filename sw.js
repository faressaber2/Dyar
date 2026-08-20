/* ════════════════════════════════════════════
   ديار — Service Worker
   يكتشف انقطاع الإنترنت ويعرض صفحة offline.html
   + يدمج OneSignal Service Worker لدعم الإشعارات
   ════════════════════════════════════════════ */

/* لازم يكون أول سطر فعلي في الملف عشان OneSignal يشتغل صح */
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

var SW_VERSION = 'diyar-sw-v3-onesignal';

/* ── عند التثبيت: خزّن صفحة offline فقط ──
   ✅ بنستخدم try/catch + fetch يدوي بدل cache.addAll المباشر، لأن addAll بيفشل بالكامل
   (وبالتالي الـ Service Worker كله ميتفعّلش) لو الطلب فشل لأي سبب لحظي — فمفيش حد
   بيمسك حالة الأوفلاين لاحقاً ويظهر المتصفح صفحته الافتراضية بدل offline.html بتاعتنا. */
self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(SW_VERSION).then(function(cache){
      return fetch('/offline.html', {cache: 'reload'})
        .then(function(res){
          if(res && res.ok) return cache.put('/offline.html', res);
          console.warn('[ديار SW] فشل جلب offline.html وقت التثبيت (status)');
        })
        .catch(function(err){
          console.warn('[ديار SW] فشل جلب offline.html وقت التثبيت:', err);
          /* لا نرمي الخطأ — نكمل التثبيت حتى لو فشل هذا الجزء، ونحاول تاني وقت أي fetch فاشل */
        });
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
        return caches.match('/offline.html').then(function(cached){
          if(cached) return cached;
          /* لو مش موجودة في الكاش لأي سبب — حاول تجيبها مباشرة كملاذ أخير
             قبل ما نسيب المتصفح يعرض صفحته الافتراضية */
          return fetch('/offline.html').catch(function(){
            return new Response(
              '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"></head>'+
              '<body style="font-family:sans-serif;background:#0a1628;color:#fff;display:flex;'+
              'align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px">'+
              '<div><h2>لا يوجد اتصال بالإنترنت</h2><p>تطبيق ديار يحتاج اتصال بالإنترنت للعمل.</p></div></body></html>',
              { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
          });
        });
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
        return caches.match('/offline.html').then(function(cached){
          return cached || new Response('', { status: 503 });
        });
      }
      return new Response('', { status: 503 });
    })
  );
});

/* ── رسائل من الصفحة الرئيسية ── */
self.addEventListener('message', function(event){
  if(event.data === 'SKIP_WAITING') self.skipWaiting();
});
