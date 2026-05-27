/* ════════════════════════════════════════════
   ديار — المساعد الذكي (nvidia/nemotron via OpenRouter)
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
  text = text.replace(/\x00TABLE\x00(.+)/g, function(_, t) {
    tables.push(t); return '___T' + (tables.length - 1) + '___';
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
  var size     = (document.getElementById('size')     || {}).value || '';
  var aptArea  = (document.getElementById('apt-area') || {}).value || '';
  var price    = (document.getElementById('price')    || {}).value || '';
  var floor    = (document.getElementById('floor')    || {}).value || '';
  var nearSea  = '';
  var seaBtns  = document.querySelectorAll('.sea-btn.on');
  if (seaBtns.length) nearSea = seaBtns[0].textContent.trim().replace(/^\S+\s*/, '');

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

  var propOnBtn = document.querySelector('#btn-apt.on,#btn-land.on,#btn-shop.on');
  if (propOnBtn) {
    propType = propOnBtn.id === 'btn-apt' ? 'شقة / بيت'
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
  if (region)    summary.push('المنطقة: ' + region);
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
