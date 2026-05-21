/* ════════════════════════════════════════════
   ديار — المساعد الذكي (DeepSeek via OpenRouter)
   ════════════════════════════════════════════ */

var OPENROUTER_API_KEY = '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';
var OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

var _aiOpen = false;
var _aiMessages = []; // {role: 'user'|'assistant', text: '...'}
var _aiThinking = false;
var _aiAdsCache = null;

/* ── فتح / إغلاق نافذة المساعد ── */
function toggleAIChat() {
  _aiOpen = !_aiOpen;
  var panel = document.getElementById('ai-chat-panel');
  var fab   = document.getElementById('ai-fab');
  if (!panel || !fab) return;
  if (_aiOpen) {
    panel.classList.add('open');
    fab.classList.add('active');
    if (_aiMessages.length === 0) _aiShowWelcome();
    setTimeout(function(){ 
      var inp = document.getElementById('ai-input');
      if (inp) inp.focus();
    }, 350);
  } else {
    panel.classList.remove('open');
    fab.classList.remove('active');
  }
}

function closeAIChat() {
  _aiOpen = false;
  var panel = document.getElementById('ai-chat-panel');
  var fab   = document.getElementById('ai-fab');
  if (panel) panel.classList.remove('open');
  if (fab)   fab.classList.remove('active');
}

/* ── رسالة الترحيب ── */
function _aiShowWelcome() {
  var welcome = 'أهلاً! أنا مساعد ديار الذكي 🏠\n\nأستطيع مساعدتك في:\n• البحث عن إعلانات عقارية في مطروح والساحل\n• مقارنة الأسعار والمناطق\n• الإجابة عن أي سؤال يخص العقارات\n\nاسألني عن أي شيء!';
  _aiAppendMessage('assistant', welcome);
}

/* ── جلب الإعلانات للـ AI ── */
async function _aiGetAds() {
  if (_aiAdsCache) return _aiAdsCache;
  try {
    var db = (typeof loadDB === 'function') ? loadDB() : {approved: []};
    var approved = (db && db.approved) ? db.approved : [];
    if (approved.length === 0 && typeof loadDBAsync === 'function') {
      var freshDb = await loadDBAsync();
      approved = (freshDb && freshDb.approved) ? freshDb.approved : [];
    }
    _aiAdsCache = approved;
    setTimeout(function(){ _aiAdsCache = null; }, 5 * 60 * 1000);
    return approved;
  } catch(e) {
    return [];
  }
}

/* ── تحويل الإعلانات لنص موجز للـ AI ── */
function _aiFormatAds(ads) {
  if (!ads || ads.length === 0) return 'لا توجد إعلانات متاحة حالياً.';
  var lines = ads.slice(0, 80).map(function(a, i) {
    var type    = {apt:'شقة/بيت', land:'أرض', shop:'محل'}[a.propType] || 'عقار';
    var deal    = a.dealType === 'sale' ? 'تمليك' : ('إيجار ' + (a.rentType || ''));
    var price   = Number(a.price).toLocaleString('ar-EG') + ' ج.م';
    var extras  = [];
    if (a.size)      extras.push(a.propType === 'apt' ? a.size + ' غرف' : a.size + ' م²');
    if (a.aptArea)   extras.push(a.aptArea + ' م²');
    if (a.floor)     extras.push('دور ' + a.floor);
    if (a.nearSea)   extras.push(a.nearSea);
    if (a.finishVal) extras.push(a.finishVal);
    if (a.aptFurnish)extras.push(a.aptFurnish);
    var extrasStr = extras.length ? ' | ' + extras.join(', ') : '';
    var code   = a.adCode   ? ' [#' + a.adCode + ']'        : '';
    var owner  = a.ownerName? ' | صاحب: ' + a.ownerName     : '';
    var phone  = a.phone    ? ' | هاتف: ' + a.phone         : '';
    var region = a.region   || 'مطروح';
    return (i+1) + '. ' + type + ' — ' + region + ' — ' + deal + ' — ' + price + extrasStr + owner + phone + code;
  });
  if (ads.length > 80) lines.push('... و' + (ads.length - 80) + ' إعلان آخر');
  return lines.join('\n');
}

/* ── بناء الـ messages لـ OpenRouter بصيغة ChatML ── */
function _aiBuildMessages(systemPrompt) {
  var messages = [];
  messages.push({ role: 'system', content: systemPrompt });
  var msgs = _aiMessages;
  var start = Math.max(0, msgs.length - 8);
  for (var i = start; i < msgs.length; i++) {
    var msg = msgs[i];
    messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.text });
  }
  if (messages.length === 1) {
    messages.push({ role: 'user', content: 'مرحباً' });
  }
  return messages;
}

/* ── إرسال رسالة ── */
async function aiSendMessage() {
  if (_aiThinking) return;
  var input = document.getElementById('ai-input');
  if (!input) return;
  var text = (input.value || '').trim();
  if (!text) return;

  input.value = '';
  _aiResizeInput();
  _aiAppendMessage('user', text);
  _aiMessages.push({ role: 'user', text: text });

  _aiThinking = true;
  _aiShowTyping();

  try {
    var ads     = await _aiGetAds();
    var adsText = _aiFormatAds(ads);

    var systemPrompt =
      'أنت مساعد عقاري ذكي لتطبيق "ديار" — منصة عقارية متخصصة في مطروح والساحل الشمالي بمصر.\n\n' +
      'قواعد مهمة:\n' +
      '- رد بالعربية دائماً وبأسلوب ودود ومهني\n' +
      '- أجب بإيجاز ووضوح، لا تطل كثيراً\n' +
      '- إذا سأل المستخدم عن إعلانات، ابحث في القائمة التالية وقدم نتائج مناسبة\n' +
      '- إذا لم تجد ما يبحث عنه في الإعلانات، أخبره بذلك بوضوح\n' +
      '- يمكنك مقارنة الأسعار والمناطق بناءً على البيانات المتاحة\n' +
      '- إذا كان هناك رقم هاتف لصاحب الإعلان، اذكره في ردك\n\n' +
      'الإعلانات المتاحة حالياً (' + ads.length + ' إعلان):\n' +
      adsText;

    var messages = _aiBuildMessages(systemPrompt);

    var resp = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENROUTER_API_KEY,
        'HTTP-Referer': window.location.href,
        'X-Title': 'ديار - مساعد عقاري'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!resp.ok) {
      var errData = {};
      try { errData = await resp.json(); } catch(e) {}
      throw new Error((errData.error && errData.error.message) || 'HTTP ' + resp.status);
    }

    var data = await resp.json();
    var replyText =
      (data.choices &&
       data.choices[0] &&
       data.choices[0].message &&
       data.choices[0].message.content)
      || 'عذراً، لم أتمكن من الرد. حاول مرة أخرى.';

    _aiHideTyping();
    _aiMessages.push({ role: 'assistant', text: replyText });
    _aiAppendMessage('assistant', replyText);

  } catch(err) {
    _aiHideTyping();
    var errMsg = 'حدث خطأ: ' + (err.message || 'تحقق من الإنترنت وحاول مجدداً');
    _aiMessages.push({ role: 'assistant', text: errMsg });
    _aiAppendMessage('assistant', errMsg, true);
  }

  _aiThinking = false;
}

/* ── إضافة رسالة للواجهة ── */
function _aiAppendMessage(role, text, isError) {
  var list = document.getElementById('ai-messages');
  if (!list) return;

  var div = document.createElement('div');
  div.className = 'ai-msg ai-msg-' + role + (isError ? ' ai-msg-error' : '');

  var formatted = _aiFormatText(text);

  if (role === 'assistant') {
    div.innerHTML =
      '<div class="ai-msg-avatar">🤖</div>' +
      '<div class="ai-msg-bubble">' + formatted + '</div>';
  } else {
    div.innerHTML = '<div class="ai-msg-bubble">' + formatted + '</div>';
  }

  list.appendChild(div);

  setTimeout(function() {
    var body = document.getElementById('ai-chat-body');
    if (body) body.scrollTop = body.scrollHeight;
  }, 50);
}

/* ── تنسيق نص الرد ── */
function _aiFormatText(text) {
  // Escape HTML أولاً
  var s = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold: **text**
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // نقاط البداية • - *
  s = s.replace(/^[•\-\*] (.+)$/gm, '<span class="ai-bullet">•</span> $1');
  // أرقام 1. 2. 3.
  s = s.replace(/^(\d+)\. /gm, '<span class="ai-num">$1.</span> ');
  // سطور جديدة
  s = s.replace(/\n/g, '<br>');

  return s;
}

/* ── مؤشر الكتابة ── */
function _aiShowTyping() {
  var list = document.getElementById('ai-messages');
  if (!list) return;
  // إزالة أي مؤشر قديم
  var old = document.getElementById('ai-typing-indicator');
  if (old) old.remove();

  var div = document.createElement('div');
  div.className = 'ai-msg ai-msg-assistant';
  div.id = 'ai-typing-indicator';
  div.innerHTML =
    '<div class="ai-msg-avatar">🤖</div>' +
    '<div class="ai-msg-bubble ai-typing-bubble"><span></span><span></span><span></span></div>';
  list.appendChild(div);

  var body = document.getElementById('ai-chat-body');
  if (body) body.scrollTop = body.scrollHeight;
}

function _aiHideTyping() {
  var el = document.getElementById('ai-typing-indicator');
  if (el) el.remove();
}

/* ── اقتراحات سريعة ── */
function aiQuickAsk(question) {
  var input = document.getElementById('ai-input');
  if (!input) return;
  input.value = question;
  _aiResizeInput();
  aiSendMessage();
}

/* ── مسح المحادثة ── */
function aiClearChat() {
  _aiMessages = [];
  var list = document.getElementById('ai-messages');
  if (list) list.innerHTML = '';
  _aiShowWelcome();
}

/* ── تعديل حجم textarea ── */
function _aiResizeInput() {
  var el = document.getElementById('ai-input');
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

/* ── Enter للإرسال (Shift+Enter = سطر جديد) ── */
function _aiHandleKey(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    aiSendMessage();
  }
}

/* ── تهيئة المساعد ── */
(function _aiInit() {
  function setup() {
    var input = document.getElementById('ai-input');
    if (input) {
      input.addEventListener('keydown', _aiHandleKey);
      input.addEventListener('input', _aiResizeInput);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
