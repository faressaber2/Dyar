/* ════════════════════════════════════════════
   ديار — المساعد الذكي (nvidia/nemotron via OpenRouter)
   ════════════════════════════════════════════ */

var OPENROUTER_API_KEY = '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';
var OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

var _aiOpen = false;
var _aiMessages = []; // {role: 'user'|'assistant', text: '...'}
var _aiThinking = false;
var _aiAdsCache = null;
var _aiCurrentUserPhone = null; // الحساب المرتبط بالمحادثة الحالية

/* ── مفتاح localStorage للمحادثة حسب الحساب (fallback) ── */
function _aiStorageKey(phone) {
  return 'diyar_ai_history_' + (phone || 'guest');
}

/* ── حفظ المحادثة في Firestore + localStorage ── */
function _aiSaveHistory() {
  if (!_aiCurrentUserPhone) return;
  try {
    var toSave = _aiMessages.slice(-40); // آخر 40 رسالة بس
    // localStorage كـ fallback
    localStorage.setItem(_aiStorageKey(_aiCurrentUserPhone), JSON.stringify(toSave));
    // Firestore في الخلفية
    if(typeof _db !== 'undefined' && _db){
      try{
        _db.collection('users_data').doc(_aiCurrentUserPhone)
          .set({ai_history: toSave, ai_updated: new Date().toISOString()},{merge:true})
          .catch(function(){});
      }catch(e){}
    }
  } catch(e) {}
}

/* ── تحميل المحادثة من Firestore ثم localStorage ── */
function _aiLoadHistory(phone) {
  try {
    var raw = localStorage.getItem(_aiStorageKey(phone));
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}

/* ── مسح محادثة حساب معين ── */
function _aiClearHistoryForUser(phone) {
  try { localStorage.removeItem(_aiStorageKey(phone)); } catch(e) {}
  // مسح من Firestore كمان
  if(typeof _db !== 'undefined' && _db && phone){
    try{
      _db.collection('users_data').doc(phone)
        .set({ai_history:[], ai_updated: new Date().toISOString()},{merge:true})
        .catch(function(){});
    }catch(e){}
  }
}

/* ── تحميل تاريخ AI من Firestore ── */
function _aiLoadHistoryFromDB(phone){
  return new Promise(function(resolve, reject){
    if(!phone || typeof _db === 'undefined' || !_db){ resolve([]); return; }
    try{
      _db.collection('users_data').doc(phone).get()
        .then(function(doc){
          if(doc.exists && doc.data().ai_history && doc.data().ai_history.length > 0){
            resolve(doc.data().ai_history);
          } else {
            resolve([]);
          }
        })
        .catch(function(){ resolve([]); });
    }catch(e){ resolve([]); }
  });
}



/**
 * يُستدعى عند تسجيل الدخول — يربط المساعد بالحساب الجديد
 * لو حساب مختلف → يمسح الرسائل الحالية ويجيب تاريخ الحساب الجديد
 */
function aiOnLogin(phone) {
  var isNewAccount = (phone !== _aiCurrentUserPhone);
  _aiCurrentUserPhone = phone;

  if (isNewAccount) {
    // مسح الـ UI الحالي
    _aiMessages = [];
    var list = document.getElementById('ai-messages');
    if (list) list.innerHTML = '';

    // أولاً: حاول تحميل من Firestore
    _aiLoadHistoryFromDB(phone).then(function(dbHistory){
      if(dbHistory && dbHistory.length > 0){
        _aiMessages = dbHistory;
        var listEl = document.getElementById('ai-messages');
        if(listEl){
          dbHistory.forEach(function(m){ _aiAppendMessage(m.role, m.text); });
          if(listEl.parentElement) listEl.parentElement.scrollTop = listEl.parentElement.scrollHeight;
        }
      } else {
        // fallback: localStorage
        var history = _aiLoadHistory(phone);
        if (history.length > 0) {
          _aiMessages = history;
          var listEl2 = document.getElementById('ai-messages');
          if (listEl2) {
            history.forEach(function(m) { _aiAppendMessage(m.role, m.text); });
          }
        }
      }
    }).catch(function(){
      // fallback: localStorage
      var history = _aiLoadHistory(phone);
      if (history.length > 0) {
        _aiMessages = history;
        var listEl3 = document.getElementById('ai-messages');
        if (listEl3) {
          history.forEach(function(m) { _aiAppendMessage(m.role, m.text); });
        }
      }
    });
  }

  // أظهر الـ FAB
  _aiShowFab();

  // فقاعة الترحيب لو أول مرة يفتح التطبيق (ما شافش المساعد قبل كده)
  var seenKey = 'diyar_ai_bubble_seen_' + phone;
  var seen = false;
  try { seen = !!localStorage.getItem(seenKey); } catch(e) {}
  if (!seen) {
    setTimeout(function() { _aiShowWelcomeBubble(seenKey); }, 1800);
  }
}

/**
 * يُستدعى عند تسجيل الخروج — يخفي المساعد ويمسح الـ state
 */
function aiOnLogout() {
  _aiSaveHistory(); // احفظ قبل ما تمسح
  _aiCurrentUserPhone = null;
  _aiMessages = [];
  _aiOpen = false;

  // إغلاق أي محادثة مفتوحة
  var panel = document.getElementById('ai-chat-panel');
  var fab   = document.getElementById('ai-fab');
  if (panel) { panel.classList.remove('open'); panel.style.display = ''; }
  if (fab)   { fab.style.display = 'none'; fab.classList.remove('active'); fab.style.opacity=''; fab.style.pointerEvents=''; fab.style.transform=''; fab.style.animationPlayState=''; }

  // أخفِ فقاعة الترحيب لو كانت ظاهرة
  _aiHideWelcomeBubble();

  // مسح رسائل الـ UI
  var list = document.getElementById('ai-messages');
  if (list) list.innerHTML = '';
}

/* ── إظهار الـ FAB (للمستخدمين العاديين فقط — الأدمن لا يرى المساعد) ── */
function _aiShowFab() {
  if (typeof currentUser !== 'undefined' && currentUser && currentUser.isAdmin) return;
  var fab = document.getElementById('ai-fab');
  if (!fab) return;
  fab.style.display = 'flex';
}

/* ── إخفاء الـ FAB (للأدمن) ── */
function _aiHideFabForAdmin() {
  var fab = document.getElementById('ai-fab');
  var panel = document.getElementById('ai-chat-panel');
  if (fab)   { fab.style.display = 'none'; }
  if (panel) { panel.style.display = 'none'; }
}
function _aiShowFabForNonAdmin() {
  if (typeof currentUser !== 'undefined' && currentUser && currentUser.isAdmin) return;
  var fab = document.getElementById('ai-fab');
  var panel = document.getElementById('ai-chat-panel');
  if (fab && _aiCurrentUserPhone)   { fab.style.display = 'flex'; }
  if (panel) { panel.style.display = ''; }
}

/* ── فقاعة الترحيب ── */
function _aiShowWelcomeBubble(seenKey) {
  var bubble = document.getElementById('ai-welcome-bubble');
  var fab    = document.getElementById('ai-fab');
  if (!bubble || !fab) return;
  // لو الـ fab مش ظاهر ما نعرضش الفقاعة
  if (fab.style.display === 'none') return;
  bubble.style.display = 'flex';
  bubble.classList.add('ai-bubble-anim');
  // إخفاء بعد 6 ثوان
  setTimeout(function() { _aiHideWelcomeBubble(); }, 6000);
  // حفظ إن المستخدم شاف الفقاعة
  try { localStorage.setItem(seenKey, '1'); } catch(e) {}
}

function _aiHideWelcomeBubble() {
  var bubble = document.getElementById('ai-welcome-bubble');
  if (!bubble) return;
  bubble.style.opacity = '0';
  bubble.style.transform = 'scale(0.85) translateY(6px)';
  setTimeout(function() {
    bubble.style.display = 'none';
    bubble.style.opacity = '';
    bubble.style.transform = '';
  }, 300);
}

/* ── فتح / إغلاق نافذة المساعد ── */
function toggleAIChat() {
  _aiOpen = !_aiOpen;
  var panel = document.getElementById('ai-chat-panel');
  var fab   = document.getElementById('ai-fab');
  if (!panel || !fab) return;
  if (_aiOpen) {
    _aiHideWelcomeBubble(); // أخفِ الفقاعة لما يفتح الشات
    panel.classList.add('open');
    fab.classList.add('active');
    fab.style.opacity = '0';
    fab.style.pointerEvents = 'none';
    fab.style.transform = 'scale(0.7)';
    fab.style.animationPlayState = 'paused';
    if (_aiMessages.length === 0) _aiShowWelcome();
    setTimeout(function(){ 
      var inp = document.getElementById('ai-input');
      if (inp) inp.focus();
    }, 350);
  } else {
    panel.classList.remove('open');
    fab.classList.remove('active');
    fab.style.opacity = '';
    fab.style.pointerEvents = '';
    fab.style.transform = '';
    fab.style.animationPlayState = '';
  }
}

function closeAIChat() {
  _aiOpen = false;
  var panel = document.getElementById('ai-chat-panel');
  var fab   = document.getElementById('ai-fab');
  if (panel) panel.classList.remove('open');
  if (fab) {
    fab.classList.remove('active');
    fab.style.opacity = '';
    fab.style.pointerEvents = '';
    fab.style.transform = '';
    fab.style.animationPlayState = '';
  }
  _aiHideWelcomeBubble();
}

/* ── رسالة الترحيب ── */
function _aiShowWelcome() {
  var welcome = 'أهلاً! أنا مساعد ديار الذكي 🏠\n\nأستطيع مساعدتك في:\n• البحث عن إعلانات عقارية في مطروح والساحل\n• مقارنة الأسعار والمناطق\n• الإجابة عن أي سؤال يخص العقارات\n\nاسألني عن أي شيء!';
  // ✅ FIX: نخزن رسالة الترحيب في _aiMessages عشان تكون في context لما يرد المستخدم
  _aiMessages.push({ role: 'assistant', text: welcome });
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
    var role = msg.role === 'user' ? 'user' : 'assistant';
    // ✅ FIX: تجنب إرسال رسالتين متتاليتين بنفس الـ role (بعض الـ models بترفضه)
    if (messages.length > 1 && messages[messages.length - 1].role === role) continue;
    messages.push({ role: role, content: msg.text });
  }
  // ✅ FIX: لو آخر رسالة assistant (مثلاً رسالة الترحيب بدون رد مستخدم بعدها)
  // مش هيحصل لأن aiSendMessage بتضيف user msg قبل ما تبني الـ messages
  // لكن كـ safety: لو messages فيها system بس أو منتهية بـ assistant → أضف dummy user
  if (messages.length === 1 || messages[messages.length - 1].role === 'assistant') {
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
      'أنت مساعد عقاري اسمك "ديار"، بتساعد ناس مطروح والساحل الشمالي يلاقوا عقارات.\n\n' +
      'أسلوبك:\n' +
      '- اتكلم بالعامية المصرية الودودة، زي ما بتكلم جار أو صاحب\n' +
      '- استخدم كلام أهل مطروح المعتاد، مثل: "يسطا"، "تمام"، "حلو أوي"، "والله"، "ماشي"\n' +
      '- كن مرح وخفيف ودافي في ردودك، مش رسمي ومتشدد\n' +
      '- أجب بإيجاز ووضوح، متطولش\n\n' +
      'قواعد العرض:\n' +
      '- لا تستخدم جداول أبداً (لا تكتب | أو ---)\n' +
      '- اعرض كل عقار كبطاقة منفصلة بالشكل ده:\n' +
      '\n' +
      '🏠 [نوع العقار] — [المنطقة]\n' +
      '💰 السعر: [السعر]\n' +
      '📋 [تفاصيل زي المساحة أو الدور أو التشطيب]\n' +
      '📞 [رقم الهاتف لو موجود]\n' +
      '#[كود الإعلان]\n' +
      '──────────\n' +
      '\n' +
      '- لو ملقتش حاجة تناسبه، قوله بأسلوب ودود\n' +
      '- لو عنده سؤال تاني، شجعه يسأل\n\n' +
      'الإعلانات المتاحة دلوقتي (' + ads.length + ' إعلان):\n' +
      adsText;

    var messages = _aiBuildMessages(systemPrompt);

    var resp = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENROUTER_API_KEY,
        'HTTP-Referer': window.location.href,
        'X-Title': 'Diar - Real Estate Assistant'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
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
    _aiSaveHistory(); // ✅ حفظ بعد كل رد

  } catch(err) {
    _aiHideTyping();
    var errMsg = 'حدث خطأ: ' + (err.message || 'تحقق من الإنترنت وحاول مجدداً');
    _aiMessages.push({ role: 'assistant', text: errMsg });
    _aiAppendMessage('assistant', errMsg, true);
  } finally {
    _aiThinking = false;
  }
}

/* ── إضافة رسالة للواجهة ── */
function _aiAppendMessage(role, text, isError) {
  var list = document.getElementById('ai-messages');
  if (!list) return;

  var div = document.createElement('div');
  div.className = 'ai-msg ai-msg-' + role + (isError ? ' ai-msg-error' : '');

  var formatted = role === 'user' ? _aiEscapeHtml(text) : _aiFormatText(text);

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

/* ── HTML escape للمستخدم (XSS prevention) ── */
function _aiEscapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br>');
}

/* ── تنسيق نص الرد ── */
function _aiFormatText(text) {
  // تحويل جداول Markdown لـ HTML أولاً
  var lines = text.split('\n');
  var result = [];
  var i = 0;
  while (i < lines.length) {
    if (i + 1 < lines.length && lines[i].includes('|') && /^[\|\s\-:]+$/.test(lines[i+1])) {
      var tableLines = [lines[i]];
      i += 2;
      while (i < lines.length && lines[i].includes('|')) { tableLines.push(lines[i++]); }
      var tHtml = '<table class="ai-table">';
      tableLines.forEach(function(tl, idx) {
        var cells = tl.split('|').map(function(c){ return c.trim(); }).filter(Boolean);
        tHtml += '<tr>' + cells.map(function(cell) {
          var tag = idx === 0 ? 'th' : 'td';
          return '<' + tag + '>' + cell + '</' + tag + '>';
        }).join('') + '</tr>';
      });
      tHtml += '</table>';
      result.push('\x00TABLE\x00' + tHtml);
      continue;
    }
    result.push(lines[i++]);
  }
  text = result.join('\n');

  // حفظ الجداول من الـ escape
  var tables = [];
  text = text.replace(/\x00TABLE\x00([\s\S]+?)(?=\x00TABLE\x00|$)/g, function(_, t) {
    tables.push(t.trim()); return '___T' + (tables.length - 1) + '___';
  });

  // Escape HTML
  var s = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // إرجاع الجداول
  s = s.replace(/___T(\d+)___/g, function(_, n) { return tables[+n]; });

  // عناوين
  s = s.replace(/^### (.+)$/gm, '<div class="ai-h3">$1</div>');
  s = s.replace(/^## (.+)$/gm,  '<div class="ai-h2">$1</div>');
  // Bold
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // نقاط
  s = s.replace(/^[•\-\*] (.+)$/gm, '<span class="ai-bullet">•</span> $1');
  // أرقام
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
  _aiClearHistoryForUser(_aiCurrentUserPhone); // مسح من localStorage
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

/* ── توليد وصف العقار بالذكاء الاصطناعي ── */
async function aiGenerateDesc() {
  var btn     = document.getElementById('ai-desc-btn');
  var btnIcon = document.getElementById('ai-desc-btn-icon');
  var btnText = document.getElementById('ai-desc-btn-text');
  var descEl  = document.getElementById('desc');
  if (!descEl) return;

  // ── قراءة المدخلات ──
  var region   = (document.getElementById('region')   || {}).value || '';
  var subRegion = (document.getElementById('subregion') || {}).value || '';
  var size     = (document.getElementById('size')     || {}).value || '';
  var aptArea  = (document.getElementById('apt-area') || {}).value || '';
  var price    = (document.getElementById('price')    || {}).value || '';
  var floor    = (document.getElementById('floor')    || {}).value || '';
  var nearSea  = '';
  var seaBtns  = document.querySelectorAll('.sea-btn.on');
  if (seaBtns.length) nearSea = seaBtns[0].textContent.trim().replace(/^\S+\s*/, '');
  var compoundName = (document.getElementById('compound-name') || {}).value || '';

  // ── تجميع الخدمات المختارة ──
  var chips = document.querySelectorAll('.chip.on');
  var services = [];
  chips.forEach(function(c) {
    var chipTxt = c.textContent.replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').replace(/\s+/g,' ').trim();
    if (chipTxt) services.push(chipTxt);
  });

  // ── نوع العقار والصفقة ──
  var propType  = '';
  var dealType  = '';
  var rentType  = '';
  var finish    = '';
  var furnish   = '';
  var payment   = '';

  var propOnBtn = document.querySelector('#btn-apt.on,#btn-house.on,#btn-chalet.on,#btn-land.on,#btn-shop.on');
  if (propOnBtn) {
    propType = propOnBtn.id === 'btn-apt' ? 'شقة'
             : propOnBtn.id === 'btn-house' ? 'بيت'
             : propOnBtn.id === 'btn-chalet' ? 'شاليه'
             : propOnBtn.id === 'btn-land' ? 'أرض'
             : 'محل تجاري';
  }
  var dealOnBtn = document.querySelector('#btn-sale.on,#btn-rent.on,#btn-shop-sale.on,#btn-shop-rent.on');
  if (dealOnBtn) {
    dealType = (dealOnBtn.id === 'btn-sale' || dealOnBtn.id === 'btn-shop-sale') ? 'تمليك' : 'إيجار';
    if (dealType === 'إيجار') {
      var rentSel = document.getElementById('rentType');
      rentType = rentSel ? rentSel.value : '';
    }
  }
  var finishOnBtn = document.querySelector('#fin-super.on,#fin-lux.on,#fin-semi.on,#fin-bare.on');
  if (finishOnBtn) finish = finishOnBtn.textContent.trim().replace(/^\S+\s*/, '');
  var furnOnBtn = document.querySelector('#btn-furn-yes.on,#btn-furn-no.on');
  if (furnOnBtn) furnish = furnOnBtn.textContent.trim().replace(/^\S+\s*/, '');
  var payOnBtn = document.querySelector('#btn-pay-cash.on,#btn-pay-install.on,#btn-apt-cash.on,#btn-apt-install.on');
  if (payOnBtn) payment = payOnBtn.textContent.trim().replace(/^\S+\s*/, '');

  // ── التحقق من وجود مدخلات كافية ──
  if (!region && !size && !aptArea && services.length === 0) {
    toast('⚠️ اختر المنطقة والخدمات أولاً حتى يكتب الذكاء الاصطناعي وصفاً دقيقاً');
    return;
  }

  // ── بناء ملخص العقار ──
  var summary = [];
  if (propType)  summary.push('نوع العقار: ' + propType);
  if (dealType)  summary.push('نوع المعاملة: ' + dealType + (rentType ? ' (' + rentType + ')' : ''));
  if (region)     summary.push('المنطقة: ' + region + (subRegion ? ' — الحي: ' + subRegion : ''));
  if (compoundName) summary.push('اسم الكومباوند أو البحر: ' + compoundName);
  if (size)      summary.push((propType === 'أرض' || propType === 'محل تجاري') ? 'المساحة: ' + size + ' م²' : 'عدد الغرف: ' + size);
  if (aptArea)   summary.push('مساحة الشقة: ' + aptArea + ' م²');
  if (floor)     summary.push('الدور: ' + floor);
  if (nearSea)   summary.push('المسافة عن البحر: ' + nearSea);
  if (finish)    summary.push('التشطيب: ' + finish);
  if (furnish)   summary.push('الفرش: ' + furnish);
  if (payment)   summary.push('طريقة الدفع: ' + payment);
  if (price)     summary.push('السعر: ' + Number(price).toLocaleString('ar-EG') + ' ج.م');
  if (services.length) summary.push('الخدمات المتاحة: ' + services.join('، '));

  var summaryText = summary.join('\n');

  // ── حالة التحميل ──
  if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }
  if (btnIcon) btnIcon.textContent = '⏳';
  if (btnText) btnText.textContent = 'جاري الكتابة...';

  try {
    var resp = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENROUTER_API_KEY,
        'HTTP-Referer': window.location.href,
        'X-Title': 'Diar - Property Description Generator'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'أنت خبير تسويق عقاري في مطروح والساحل الشمالي بمصر.\nمهمتك كتابة وصف إعلاني جذاب ومقنع لعقار بناءً على مواصفاته.\n\nشروط الوصف:\n- اكتب بالعربية الفصحى البسيطة المفهومة\n- الوصف بين 3 و5 جمل فقط (لا تطول)\n- ركّز على أبرز مميزات العقار\n- استخدم كلمات تسويقية جاذبة\n- لا تذكر السعر في الوصف\n- لا تستخدم رموز خاصة أو نقاط قائمة\n- اكتب الوصف فقط بدون مقدمة أو خاتمة'
          },
          {
            role: 'user',
            content: 'اكتب وصفاً إعلانياً لهذا العقار:\n\n' + summaryText
          }
        ],
        temperature: 0.75,
        max_tokens: 300
      })
    });

    if (!resp.ok) {
      var errData = {};
      try { errData = await resp.json(); } catch(e) {}
      throw new Error((errData.error && errData.error.message) || 'HTTP ' + resp.status);
    }

    var data = await resp.json();
    var generated = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    generated = generated.trim();

    if (generated) {
      descEl.value = generated;
      descEl.style.borderColor = '#7c3aed';
      descEl.style.boxShadow   = '0 0 0 3px rgba(124,58,237,.15)';
      setTimeout(function() { descEl.style.borderColor = ''; descEl.style.boxShadow = ''; }, 2000);
      toast('✅ تم كتابة الوصف بالذكاء الاصطناعي بنجاح!');
    } else {
      throw new Error('لم يتم توليد وصف');
    }

  } catch(err) {
    toast('❌ حدث خطأ: ' + (err.message || 'تحقق من الإنترنت'));
  } finally {
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
    if (btnIcon) btnIcon.textContent = '✨';
    if (btnText) btnText.textContent = 'اكتب بالذكاء الاصطناعي';
  }
}

/* ════════════════════════════════════════════
   مساعد الأدمن الذكي — Admin AI Assistant
   ════════════════════════════════════════════ */

var _adminAIMessages = [];
var _adminAIThinking = false;

/* ── تهيئة عند فتح تاب AI للأدمن ── */
function initAdminAI() {
  var input = document.getElementById('adminai-input');
  if (input && !input._adminAIInited) {
    input._adminAIInited = true;
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); adminAISend(); }
    });
    input.addEventListener('input', function() {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    });
  }
  if (_adminAIMessages.length === 0) _adminAIWelcome();
}

/* ── رسالة الترحيب ── */
function _adminAIWelcome() {
  var msg = '👋 أهلاً فارس!\n\nأنا مساعدك الذكي — ولديّ صلاحيات كاملة على التطبيق.\n\n' +
    '⚡ أقدر أنفّذ أوامرك مباشرة:\n' +
    '• ✅ وافق على إعلان / وافق على جميع الإعلانات\n' +
    '• 🗑️ احذف إعلان / ارفض إعلان\n' +
    '• ⭐ ميّز إعلان بالذهبي\n' +
    '• ✏️ عدّل سعر / منطقة / وصف إعلان\n' +
    '• 🚫 احظر / ارفع حظر مستخدم\n' +
    '• 🏅 وثّق / الغِ توثيق سمسار\n' +
    '• ⚙️ غيّر الإعدادات (أسعار، أرقام، كلمة السر)\n\n' +
    '📊 أو اسألني عن أي بيانات أو إحصائيات.\n\nمرحباً بأوامرك! 🚀';
  _adminAIMessages.push({ role: 'assistant', text: msg });
  _adminAIAppend('assistant', msg);
}

/* ── جمع كل بيانات التطبيق للـ AI ── */
function _adminAIGetContext() {
  try {
    var db = (typeof loadDB === 'function') ? loadDB() : { approved: [], pending: [] };
    var users = (typeof loadUsers === 'function') ? loadUsers() : [];
    var settings = (typeof loadSettings === 'function') ? loadSettings() : {};
    var approved = db.approved || [];
    var pending  = db.pending  || [];
    var brokers  = users.filter(function(u) { return u.profile_type; });
    var blocked  = users.filter(function(u) { return u.blocked; });
    var verified = users.filter(function(u) { return u.verified; });
    var featured = approved.filter(function(a) { return a.featured; });

    // إحصائيات
    var byType = { apt: 0, land: 0, shop: 0 };
    approved.forEach(function(a) { byType[a.propType] = (byType[a.propType] || 0) + 1; });

    // إحصائيات المناطق مع التطبيع الذكي (يجمع الأحياء المتشابهة في الكتابة — فرق حرف أو مسافة)
    var byRegion = {}; // canonicalKey → {display, count}
    if(typeof groupSimilarAreaNames === 'function'){
      // جمّع كل أسماء الأحياء الفعلية (subRegion) داخل "مدينة مطروح" في مجموعات متشابهة
      var subNames = approved.filter(function(a){return a.subRegion;}).map(function(a){return a.subRegion;});
      var nameToCanonical = groupSimilarAreaNames(subNames);
      approved.forEach(function(a){
        var display, key;
        if(a.subRegion){
          var canon = nameToCanonical[a.subRegion] || a.subRegion;
          display = a.region + ' — ' + canon;
          key = a.region + '|' + canon;
        } else {
          display = a.region;
          key = a.region + '|';
        }
        if(!byRegion[key]){ byRegion[key] = {display: display, count: 0}; }
        byRegion[key].count++;
      });
    } else {
      // fallback بسيط لو الدالة غير متاحة لأي سبب
      approved.forEach(function(a){
        var display = a.subRegion ? (a.region + ' — ' + a.subRegion) : a.region;
        var key = (a.subRegion || a.region || '').trim().replace(/\s+/g,' ').toLowerCase();
        if(!byRegion[key]){ byRegion[key] = {display: display, count: 0}; }
        byRegion[key].count++;
      });
    }

    var avgPrice = approved.length ? Math.round(approved.reduce(function(s, a) { return s + Number(a.price || 0); }, 0) / approved.length) : 0;

    // ملخص الإعلانات المعلقة — مع الـ ID الكامل
    var pendingLines = pending.slice(0, 30).map(function(a, i) {
      return '[ID:' + a.id + '] ' + (i+1) + '. ' + (a.ownerName||'—') +
        ' | ' + (a.region||'—') + (a.subRegion ? ' — ' + a.subRegion : '') +
        ' | ' + ({apt:'شقة',land:'أرض',shop:'محل',chalet:'شاليه',house:'بيت'}[a.propType]||'عقار') +
        ' | ' + (a.dealType==='sale'?'تمليك':'إيجار') +
        ' | ' + Number(a.price||0).toLocaleString('ar-EG') + ' ج.م' +
        ' | 📞 ' + (a.phone||'—') +
        (a.adCode ? ' | كود:#' + a.adCode : '');
    });
    if (pending.length > 30) pendingLines.push('... و' + (pending.length - 30) + ' إعلان آخر');

    // ملخص الإعلانات المنشورة — مع الـ ID الكامل
    var approvedLines = approved.slice(0, 40).map(function(a, i) {
      return '[ID:' + a.id + '] ' + (i+1) + '. ' + (a.ownerName||'—') +
        ' | ' + (a.region||'—') + (a.subRegion ? ' — ' + a.subRegion : '') +
        ' | ' + ({apt:'شقة',land:'أرض',shop:'محل',chalet:'شاليه',house:'بيت'}[a.propType]||'عقار') +
        ' | ' + Number(a.price||0).toLocaleString('ar-EG') + ' ج.م' +
        (a.featured ? ' ⭐' : '') +
        ' | 📞 ' + (a.phone||'—') +
        (a.adCode ? ' | كود:#' + a.adCode : '');
    });
    if (approved.length > 40) approvedLines.push('... و' + (approved.length - 40) + ' إعلان آخر');

    // ملخص المستخدمين — مع الـ phone كـ ID
    var usersLines = users.slice(0, 30).map(function(u) {
      return '[PHONE:' + (u.phone||'—') + '] ' +
        (u.profile_name || 'مجهول') +
        ' | ' + (u.profile_type || 'مستخدم') +
        (u.verified ? ' ✓موثق' : '') +
        (u.blocked ? ' 🚫محظور' : '') +
        ' | انضم: ' + (u.joinedAt||'—');
    });

    return [
      '=== بيانات ديار الكاملة (للأدمن فقط) ===',
      '',
      '📊 الإحصائيات:',
      '- إجمالي الإعلانات المنشورة: ' + approved.length,
      '- إعلانات قيد المراجعة: ' + pending.length,
      '- إعلانات مميزة ⭐: ' + featured.length,
      '- شقق: ' + (byType.apt||0) + ' | أراضي: ' + (byType.land||0) + ' | محلات: ' + (byType.shop||0),
      '- متوسط السعر: ' + avgPrice.toLocaleString('ar-EG') + ' ج.م',
      '- إجمالي المستخدمين: ' + users.length,
      '- سماسرة/ملاك: ' + brokers.length,
      '- موثقون: ' + verified.length + ' | محظورون: ' + blocked.length,
      '',
      '📍 المناطق الأكثر إعلانات:',
      Object.values(byRegion).sort(function(a,b){return b.count-a.count;}).slice(0,8).map(function(r){return '- ' + r.display + ': ' + r.count + ' إعلان';}).join('\n'),
      '',
      '⚙️ الإعدادات:',
      '- سعر التمييز: ' + (settings.featuredPrice||50) + ' ج.م',
      '- سعر التوثيق: ' + (settings.verifyPrice||100) + ' ج.م',
      '- رقم فودافون كاش: ' + (settings.vodafoneNum||'—'),
      '',
      '⏳ الإعلانات قيد المراجعة (' + pending.length + '):',
      pendingLines.join('\n') || 'لا يوجد',
      '',
      '✅ الإعلانات المنشورة (' + approved.length + '):',
      approvedLines.join('\n') || 'لا يوجد',
      '',
      '👥 المستخدمون (' + users.length + '):',
      usersLines.join('\n') || 'لا يوجد',
    ].join('\n');
  } catch(e) {
    return 'تعذر جلب البيانات: ' + e.message;
  }
}

/* ════════════════════════════════════════════
   نظام الأوامر القابلة للتنفيذ — Admin AI Actions
   ════════════════════════════════════════════ */

/* تنفيذ أمر مُعاد من الـ AI بصيغة JSON */
async function _adminAIExecuteActions(actionsArr) {
  if (!Array.isArray(actionsArr) || actionsArr.length === 0) return [];
  var results = [];

  for (var i = 0; i < actionsArr.length; i++) {
    var action = actionsArr[i];
    var type   = action.type || '';
    var id     = action.id   || '';
    var phone  = action.phone || '';

    try {
      /* ─── إعلانات ─── */
      if (type === 'approve_ad') {
        await _adminAI_approveAd(id);
        results.push('✅ تم قبول ونشر الإعلان #' + id);

      } else if (type === 'approve_all_pending') {
        var db0 = loadDB();
        var toApprove = (db0.pending || []).slice();
        var count = 0;
        for (var j = 0; j < toApprove.length; j++) {
          await _adminAI_approveAd(toApprove[j].id);
          count++;
        }
        results.push('✅ تم نشر جميع الإعلانات المعلقة (' + count + ' إعلان)');

      } else if (type === 'reject_ad') {
        await _adminAI_rejectAd(id);
        results.push('🗑️ تم رفض الإعلان #' + id);

      } else if (type === 'delete_ad') {
        await _adminAI_deleteAd(id, action.source || 'approved');
        results.push('🗑️ تم حذف الإعلان #' + id);

      } else if (type === 'delete_all_approved') {
        var db1 = loadDB();
        var toDelete = (db1.approved || []).slice();
        var dc = 0;
        for (var k = 0; k < toDelete.length; k++) {
          await _adminAI_deleteAd(toDelete[k].id, 'approved');
          dc++;
        }
        results.push('🗑️ تم حذف جميع الإعلانات المنشورة (' + dc + ')');

      } else if (type === 'feature_ad') {
        _adminAI_featureAd(id, true);
        results.push('⭐ تم تمييز الإعلان #' + id);

      } else if (type === 'unfeature_ad') {
        _adminAI_featureAd(id, false);
        results.push('☆ تم إلغاء تمييز الإعلان #' + id);

      } else if (type === 'feature_all') {
        var db2 = loadDB();
        var fc = 0;
        (db2.approved || []).forEach(function(a){ a.featured = true; fc++; });
        saveDB(db2);
        db2.approved.forEach(function(a){ saveAdToSB(a,'approved').catch(function(){}); });
        results.push('⭐ تم تمييز جميع الإعلانات (' + fc + ')');

      } else if (type === 'edit_ad') {
        _adminAI_editAd(id, action.fields || {}, action.source || 'approved');
        results.push('✏️ تم تعديل الإعلان #' + id);

      /* ─── مستخدمون ─── */
      } else if (type === 'block_user') {
        await _adminAI_blockUser(phone, true);
        results.push('🚫 تم حظر المستخدم ' + phone);

      } else if (type === 'unblock_user') {
        await _adminAI_blockUser(phone, false);
        results.push('✅ تم رفع الحظر عن ' + phone);

      } else if (type === 'verify_broker') {
        _adminAI_verifyBroker(phone, true);
        results.push('🏅 تم توثيق الحساب ' + phone);

      } else if (type === 'unverify_broker') {
        _adminAI_verifyBroker(phone, false);
        results.push('☆ تم إلغاء توثيق ' + phone);

      } else if (type === 'delete_user') {
        _adminAI_deleteUser(phone);
        results.push('🗑️ تم حذف المستخدم ' + phone);

      } else if (type === 'block_all_users') {
        var users0 = loadUsers();
        var bc = 0;
        users0.forEach(function(u){ if(!u.isAdmin){ u.blocked = true; bc++; } });
        saveUsers(users0);
        users0.forEach(function(u){ saveUserToSB(u).catch(function(){}); });
        results.push('🚫 تم حظر جميع المستخدمين (' + bc + ')');

      } else if (type === 'unblock_all_users') {
        var users1 = loadUsers();
        users1.forEach(function(u){ u.blocked = false; });
        saveUsers(users1);
        users1.forEach(function(u){ saveUserToSB(u).catch(function(){}); });
        results.push('✅ تم رفع الحظر عن جميع المستخدمين (' + users1.length + ')');

      /* ─── الإعدادات ─── */
      } else if (type === 'update_settings') {
        var s = loadSettings();
        if (action.featuredPrice) s.featuredPrice = action.featuredPrice;
        if (action.verifyPrice)   s.verifyPrice   = action.verifyPrice;
        if (action.vodafoneNum)   s.vodafoneNum    = action.vodafoneNum;
        if (action.waNumber)      s.waNumber       = action.waNumber;
        if (action.adminPass)     s.adminPass      = action.adminPass;
        saveSettings_direct(s);
        results.push('⚙️ تم تحديث الإعدادات');

      } else {
        results.push('⚠️ أمر غير معروف: ' + type);
      }
    } catch(err) {
      results.push('❌ فشل ' + type + ': ' + (err.message || err));
    }
  }

  // تحديث الواجهة
  try { renderAdminPanel(); updateNotifDot(); } catch(e) {}
  try { updateAdminStats(); } catch(e) {}

  return results;
}

/* ── دوال مساعدة للتنفيذ المباشر (بدون فتح واتساب) ── */
async function _adminAI_approveAd(id) {
  var db = loadDB();
  var idx = db.pending.findIndex(function(a){ return a.id === id; });
  if (idx === -1) throw new Error('إعلان غير موجود: ' + id);
  var ad = db.pending.splice(idx, 1)[0];
  if (!db.approved) db.approved = [];
  db.approved.unshift(ad);
  saveDB(db);
  await _upsertAdSB(ad, 'approved');
  _dbCacheTime = 0;
  _aiAdsCache = null; // مسح cache المساعد عشان يشوف الإعلان الجديد فوراً
}

async function _adminAI_rejectAd(id) {
  var db = loadDB();
  var idx = db.pending.findIndex(function(a){ return a.id === id; });
  if (idx !== -1) {
    db.pending.splice(idx, 1);
    saveDB(db);
    await deleteAdFromSB(id);
    _dbCacheTime = 0;
    return;
  }
  // fallback: search approved too
  var idx2 = (db.approved||[]).findIndex(function(a){ return a.id === id; });
  if (idx2 !== -1) {
    db.approved.splice(idx2, 1);
    saveDB(db);
    await deleteAdFromSB(id);
    _dbCacheTime = 0;
    return;
  }
  throw new Error('إعلان غير موجود: ' + id);
}

async function _adminAI_deleteAd(id, source) {
  var db = loadDB();
  if (source === 'pending') {
    db.pending = (db.pending || []).filter(function(a){ return a.id !== id; });
  } else {
    db.approved = (db.approved || []).filter(function(a){ return a.id !== id; });
  }
  saveDB(db);
  await deleteAdFromSB(id);
  _dbCacheTime = 0;
}

function _adminAI_featureAd(id, state) {
  var db = loadDB();
  var ad = (db.approved || []).find(function(a){ return a.id === id; });
  if (!ad) throw new Error('إعلان غير موجود: ' + id);
  ad.featured = state;
  saveDB(db);
  saveAdToSB(ad, 'approved').catch(function(e){ console.error('_adminAI_featureAd SB:', e.message); });
}

function _adminAI_editAd(id, fields, source) {
  var db = loadDB();
  var list = source === 'pending' ? (db.pending || []) : (db.approved || []);
  var ad = list.find(function(a){ return a.id === id; });
  if (!ad) throw new Error('إعلان غير موجود: ' + id);
  if (fields.ownerName) ad.ownerName = fields.ownerName;
  if (fields.price)     ad.price     = fields.price;
  if (fields.region)    ad.region    = fields.region;
  if (fields.desc)      ad.desc      = fields.desc;
  if (fields.phone)     ad.phone     = fields.phone;
  if (fields.size)      ad.size      = fields.size;
  ad.editedAt = new Date().toLocaleString('ar-EG');
  saveDB(db);
  var adStatus = source === 'pending' ? 'pending' : 'approved';
  saveAdToSB(ad, adStatus).catch(function(e){ console.error('_adminAI_editAd SB:', e.message); });
}

async function _adminAI_blockUser(phone, block) {
  var users = loadUsers();
  var u = users.find(function(x){ return x.phone === phone; });
  if (!u) throw new Error('مستخدم غير موجود: ' + phone);
  u.blocked = block;
  saveUsers(users);
  await saveUserToSB(u);
}

function _adminAI_verifyBroker(phone, verify) {
  var users = loadUsers();
  var u = users.find(function(x){ return x.phone === phone; });
  if (!u) throw new Error('مستخدم غير موجود: ' + phone);
  u.verified = verify;
  saveUsers(users);
  saveUserToSB(u).catch(function(e){ console.error('_adminAI_verifyBroker SB:', e.message); });
}

function _adminAI_deleteUser(phone) {
  var users = loadUsers();
  users = users.filter(function(u){ return u.phone !== phone; });
  saveUsers(users);
  // حذف من Firebase
  (async function(){
    try{
      var snap = await _db.collection('users').where('phone','==',phone).get();
      var batch = _db.batch();
      snap.docs.forEach(function(d){ batch.delete(d.ref); });
      if(snap.size > 0) await batch.commit();
    } catch(e){ console.error('_adminAI_deleteUser Firebase:', e.message); }
  })();
}

function saveSettings_direct(s) {
  try {
    localStorage.setItem('fares_settings_cache', JSON.stringify(s));
    _settingsCache = s;
    if (typeof saveSettingsToSB === 'function') saveSettingsToSB(s).catch(function(){});
  } catch(e) {}
}

/* ── إرسال رسالة ── */
async function adminAISend() {
  if (_adminAIThinking) return;
  var input = document.getElementById('adminai-input');
  if (!input) return;
  var text = (input.value || '').trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';
  _adminAIMessages.push({ role: 'user', text: text });
  _adminAIAppend('user', text);
  _adminAIThinking = true;
  _adminAIShowTyping();

  try {
    var context = _adminAIGetContext();

    var systemPrompt =
      'أنت مساعد ذكي خاص بـ"فارس" — مدير تطبيق ديار العقاري. لديك صلاحيات كاملة لتنفيذ أي أمر.\n\n' +
      '══ قدراتك ══\n' +
      'يمكنك قبول / رفض / حذف / تعديل الإعلانات، وإدارة المستخدمين والسماسرة، وتغيير الإعدادات.\n\n' +
      '══ ملاحظة مهمة عن الأحياء ══\n' +
      'الحي يُكتب يدوياً من السمسار — قد يكتب نفس الحي بطرق مختلفة (مثل: "العوام" و"العوام " و"الأعوام").\n' +
      'عند الإحصاء أو الفلترة بالمنطقة، اعتبر الأسماء المتشابهة منطقة واحدة. البيانات تحتوي على حقل subRegion للحي.\n\n' +
      '══ قواعد الرد ══\n' +
      'عندما يطلب فارس تنفيذ أمر، ردّ بـ JSON فقط داخل بلوك ```json ``` بهذا الشكل:\n' +
      '{"message":"نص الرد","actions":[{"type":"approve_ad","id":"xxx"}]}\n\n' +
      'أنواع الأوامر المتاحة:\n' +
      'approve_ad / reject_ad / delete_ad(+source) / approve_all_pending / delete_all_approved\n' +
      'feature_ad / unfeature_ad / feature_all / edit_ad(+source,fields)\n' +
      'block_user / unblock_user / block_all_users / unblock_all_users\n' +
      'verify_broker / unverify_broker / delete_user\n' +
      'update_settings(featuredPrice,verifyPrice,vodafoneNum,waNumber,adminPass)\n\n' +
      'قواعد مهمة:\n' +
      '- لو السؤال استعلام فقط → ردّ بنص عادي بدون JSON\n' +
      '- لو في أوامر → ردّ بـ JSON فقط، actions يكون array\n' +
      '- الـ id موجود في البيانات أمام كل إعلان\n' +
      '- source: "pending" للمعلقة أو "approved" للمنشورة\n' +
      '- تكلم بالعامية المصرية الودودة في حقل message\n\n' +
      'بيانات التطبيق:\n\n' + context;

    var messages = [{ role: 'system', content: systemPrompt }];
    var start = Math.max(0, _adminAIMessages.length - 10);
    for (var i = start; i < _adminAIMessages.length; i++) {
      var m = _adminAIMessages[i];
      if (messages.length > 1 && messages[messages.length-1].role === (m.role === 'user' ? 'user' : 'assistant')) continue;
      messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text });
    }
    if (messages[messages.length-1].role !== 'user') {
      messages.push({ role: 'user', content: text });
    }

    var resp = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OPENROUTER_API_KEY,
        'HTTP-Referer': window.location.href,
        'X-Title': 'Diar Admin AI'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: messages,
        temperature: 0.3,
        max_tokens: 1500
      })
    });

    if (!resp.ok) {
      var errData = {}; try { errData = await resp.json(); } catch(e) {}
      throw new Error((errData.error && errData.error.message) || 'HTTP ' + resp.status);
    }

    var data = await resp.json();
    var rawReply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';

    _adminAIHideTyping();

    /* ── تحليل JSON وتنفيذ الأوامر ── */
    var jsonMatch = rawReply.match(/```json\s*([\s\S]*?)```/i) ||
                    rawReply.match(/^(\s*\{[\s\S]*\}\s*)$/);
    if (jsonMatch) {
      try {
        var parsed  = JSON.parse((jsonMatch[1] || jsonMatch[0]).trim());
        var actions = parsed.actions || [];
        var replyMsg = parsed.message || '';

        if (actions.length > 0) {
          var execDiv = _adminAIAppendExecuting(actions.length);
          var execResults = await _adminAIExecuteActions(actions);
          if (execDiv && execDiv.parentNode) execDiv.parentNode.removeChild(execDiv);
          var resultText = (replyMsg ? replyMsg + '\n\n' : '') +
            '⚡ تم تنفيذ ' + execResults.length + ' عملية:\n' +
            execResults.map(function(r){ return '• ' + r; }).join('\n');
          _adminAIMessages.push({ role: 'assistant', text: resultText });
          _adminAIAppend('assistant', resultText);
        } else {
          var onlyMsg = replyMsg || rawReply;
          _adminAIMessages.push({ role: 'assistant', text: onlyMsg });
          _adminAIAppend('assistant', onlyMsg);
        }
      } catch(parseErr) {
        _adminAIMessages.push({ role: 'assistant', text: rawReply });
        _adminAIAppend('assistant', rawReply);
      }
    } else {
      _adminAIMessages.push({ role: 'assistant', text: rawReply });
      _adminAIAppend('assistant', rawReply);
    }

  } catch(err) {
    _adminAIHideTyping();
    var errMsg = '❌ خطأ: ' + (err.message || 'تحقق من الإنترنت');
    _adminAIMessages.push({ role: 'assistant', text: errMsg });
    _adminAIAppend('assistant', errMsg, true);
  } finally {
    _adminAIThinking = false;
  }
}

/* ── div مؤقت أثناء التنفيذ ── */
function _adminAIAppendExecuting(count) {
  var list = document.getElementById('adminai-messages');
  if (!list) return null;
  var div = document.createElement('div');
  div.className = 'adminai-msg adminai-msg-assistant';
  div.innerHTML =
    '<div class="adminai-msg-avatar">⚡</div>' +
    '<div class="adminai-bubble" style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1.5px solid #fcd34d;color:#92400e">' +
    '⏳ جاري تنفيذ ' + count + ' عملية...' +
    '</div>';
  list.appendChild(div);
  var body = document.getElementById('adminai-body');
  if (body) body.scrollTop = body.scrollHeight;
  return div;
}


/* ── append رسالة ── */
function _adminAIAppend(role, text, isError) {
  var list = document.getElementById('adminai-messages');
  if (!list) return;
  var div = document.createElement('div');
  div.className = 'adminai-msg adminai-msg-' + role + (isError ? ' adminai-msg-error' : '');
  var formatted = role === 'user' ? _aiEscapeHtml(text) : _aiFormatText(text);
  var bubble = '<div class="adminai-bubble">' + formatted + '</div>';
  div.innerHTML = role === 'assistant'
    ? '<div class="adminai-msg-avatar">🤖</div>' + bubble
    : bubble;
  list.appendChild(div);
  var body = document.getElementById('adminai-body');
  if (body) setTimeout(function(){ body.scrollTop = body.scrollHeight; }, 50);
}

/* ── typing indicator ── */
function _adminAIShowTyping() {
  var list = document.getElementById('adminai-messages');
  if (!list) return;
  var old = document.getElementById('adminai-typing');
  if (old) old.remove();
  var div = document.createElement('div');
  div.id = 'adminai-typing';
  div.className = 'adminai-msg adminai-msg-assistant';
  div.innerHTML = '<div class="adminai-msg-avatar">🤖</div><div class="adminai-bubble adminai-typing-bubble"><span></span><span></span><span></span></div>';
  list.appendChild(div);
  var body = document.getElementById('adminai-body');
  if (body) body.scrollTop = body.scrollHeight;
}
function _adminAIHideTyping() {
  var el = document.getElementById('adminai-typing');
  if (el) el.remove();
}

/* ── مسح المحادثة ── */
function adminAIClear() {
  _adminAIMessages = [];
  var list = document.getElementById('adminai-messages');
  if (list) list.innerHTML = '';
  _adminAIWelcome();
}
