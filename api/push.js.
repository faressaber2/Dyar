/* Vercel Serverless Function — /api/push
   وسيط بين لوحة الأدمن و OneSignal. المفتاح السري بيفضل هنا على السيرفر ومش بيظهر في الفرونت.

   Environment Variables المطلوبة على Vercel (Project → Settings → Environment Variables):
     ONESIGNAL_REST_API_KEY  → مفتاح REST API الجديد من OneSignal (Settings → Keys & IDs)
     PUSH_SECRET             → (اختياري، لكن موصى بيه) كلمة سر تختارها، بتتكتب مرة واحدة من تبويب "إشعارات".
                               من غيرها السيرفر بيقبل الطلبات اللي جاية من موقعك بس (حماية أضعف)
     ONESIGNAL_APP_ID        → (اختياري) لو مش موجود بيستخدم القيمة المبعوتة من التطبيق
*/
const crypto = require('crypto');

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ errors: ['POST only'] });

  const key = String(process.env.ONESIGNAL_REST_API_KEY || '').replace(/\s+/g, ''); // بيشيل أي مسافات/أسطر دخلت مع اللصق
  const secret = process.env.PUSH_SECRET;
  if (!key) {
    return res.status(500).json({ errors: ['السيرفر مش متظبط: ONESIGNAL_REST_API_KEY ناقص'] });
  }
  if (secret) {
    if (!safeEqual(req.headers['x-push-secret'], secret)) {
      return res.status(401).json({ errors: ['bad secret'] });
    }
  } else {
    /* من غير PUSH_SECRET: نقبل الطلب بس لو جاي من نفس الموقع (Origin/Referer) */
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
    let from = '';
    try { from = new URL(req.headers.origin || req.headers.referer || '').host.toLowerCase(); } catch (_) {}
    if (!host || from !== host) return res.status(403).json({ errors: ['forbidden origin'] });
  }

  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (_) { b = {}; } }

  /* بنمرّر الحقول المسموحة بس */
  const payload = {
    app_id: process.env.ONESIGNAL_APP_ID || b.app_id,
    target_channel: 'push',
    headings: b.headings,
    contents: b.contents
  };
  if (b.url && /^https?:\/\//i.test(b.url)) payload.url = b.url;
  ['include_aliases', 'included_segments', 'filters'].forEach(function (k) {
    if (b[k]) payload[k] = b[k];
  });
  if (!payload.app_id || !payload.contents || !(payload.include_aliases || payload.included_segments || payload.filters)) {
    return res.status(400).json({ errors: ['بيانات ناقصة'] });
  }

  try {
    const r = await fetch('https://api.onesignal.com/notifications?c=push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: 'Key ' + key },
      body: JSON.stringify(payload)
    });
    const text = await r.text();
    let j;
    try { j = JSON.parse(text); } catch (_) { j = { errors: [text.slice(0, 300)] }; }
    if (r.status === 401 || r.status === 403) {
      return res.status(502).json({ errors: ['OneSignal رفض المفتاح (' + r.status + '): ' + JSON.stringify(j.errors || j).slice(0, 300)] });
    }
    return res.status(r.status).json(j);
  } catch (e) {
    return res.status(502).json({ errors: ['تعذّر الوصول لـ OneSignal: ' + e.message] });
  }
};
