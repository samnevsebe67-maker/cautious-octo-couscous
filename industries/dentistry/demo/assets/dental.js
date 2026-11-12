/* ============================================================
   SMILA — dental demo website behaviour
   Nav, reveal, 3D labels, booking flow, shared demo store.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };
  var RM = false;
  try { RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  window.smilaEsc = esc;

  /* ---------- year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- header ---------- */
  var hdr = $('.hdr');
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle('solid', window.scrollY > 14); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- current page ---------- */
  var path = location.pathname.replace(/index\.html$/, '');
  $$('.hdr-nav a,.mnav-links a').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    var norm = href.replace(/index\.html$/, '');
    if (norm === '/' ) return;
    if (path === norm || (norm.length > 1 && path.indexOf(norm) === 0 && norm !== '/industries/dentistry/demo/')) {
      a.setAttribute('aria-current', 'page');
    }
  });

  /* ---------- mobile nav ---------- */
  var burger = $('#burger'), mnav = $('#mnav');
  if (burger && mnav) {
    var setMenu = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      mnav.classList.toggle('open', open);
      document.body.classList.toggle('lock', open);
      if (open) { var f = mnav.querySelector('a'); if (f) f.focus({ preventScroll: true }); }
    };
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mnav.classList.contains('open')) setMenu(false);
    });
  }

  /* ---------- reveal ---------- */
  var rv = $$('[data-rv]');
  if (rv.length) {
    if (RM || !('IntersectionObserver' in window)) rv.forEach(function (el) { el.classList.add('in'); });
    else {
      var rio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('in');
          rio.unobserve(en.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
      rv.forEach(function (el) { rio.observe(el); });
    }
  }

  /* ---------- counters ---------- */
  $$('[data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (RM) { el.textContent = target + suffix; return; }
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      var t0 = performance.now();
      var tick = function (now) {
        var p = Math.min(1, (now - t0) / 1100);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * e) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: .4 });
    io.observe(el);
  });

  /* ---------- 3D scenes + labels ---------- */
  var scenes = [];
  $$('[data-scene]').forEach(function (canvas) {
    var host = canvas.closest('.hero-visual,.visual-box,.scene-box') || canvas.parentElement;
    var labelLayer = host.querySelector('.scene-labels');
    var anchors = [];
    var scene = null;
    var focusHandler = null;
    try {
      scene = window.DentalScene && window.DentalScene.create(canvas, {
        variant: canvas.getAttribute('data-scene') || 'hero',
        onFrame: function (map) {
          if (!labelLayer) return;
          if (!labelLayer.children.length && anchors.length) {
            anchors.forEach(function (a) {
              var b = document.createElement('button');
              b.type = 'button';
              b.className = 'scene-node';
              b.setAttribute('data-anchor', a.id);
              b.innerHTML = '<i></i><span>' + esc(a.label) + '</span>';
              b.addEventListener('click', function () {
                if (scene) scene.focus(a.id);
                labelLayer.querySelectorAll('.scene-node').forEach(function (x) { x.classList.toggle('on', x === b && scene.getFocus && scene.getFocus() === a.id); });
              });
              b.addEventListener('mouseenter', function () { if (scene) scene.focus(a.id); });
              labelLayer.appendChild(b);
            });
          }
          Object.keys(map).forEach(function (id) {
            var node = labelLayer.querySelector('[data-anchor="' + id + '"]');
            if (!node) return;
            var p = map[id];
            node.style.transform = 'translate(' + Math.round(p.x) + 'px,' + Math.round(p.y) + 'px) translate(-50%,-50%)';
            node.classList.toggle('vis', !!p.visible);
            node.classList.toggle('on', !!scene && scene.getFocus && scene.getFocus() === id);
          });
        }
      });
    } catch (err) { scene = null; }
    if (!scene) {
      host.classList.add('no-webgl');
      if (labelLayer) labelLayer.style.display = 'none';
      if (!host.querySelector('.scene-fallback')) {
        var fb = document.createElement('div');
        fb.className = 'scene-fallback';
        fb.textContent = '3D-візуалізація недоступна';
        host.appendChild(fb);
      }
      return;
    }
    anchors = scene.anchors;
    if (labelLayer) labelLayer.classList.add('ready');
    scenes.push(scene);
    window.addEventListener('pagehide', function () { try { scene.destroy(); } catch (e) {} });
  });

  /* ---------- demo toast ---------- */
  var toastEl = null;
  window.smilaToast = function (msg, ms) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 3400);
  };

  /* ---------- reset demo data (available on all pages) ---------- */
  $$('[data-demo-reset]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!window.confirm('Скинути всі демо-дані до початкового стану? Зміни в CRM, записах і автоматизаціях буде втрачено.')) return;
      KD.reset();
      window.smilaToast('Демо-дані скинуто до початкового стану.');
      setTimeout(function () { location.reload(); }, 700);
    });
  });

  /* ---------- booking ---------- */
  var bkRoot = $('#booking');
  if (!bkRoot || !window.KD) return;

  var state = {
    step: 1,
    service: null,
    doctor: null,
    date: null,
    time: null,
    name: '',
    phone: '',
    email: '',
    consentAppt: false,
    consentMkt: false,
    lead: null,
    appt: null
  };

  var panels = $$('.bk-panel', bkRoot);
  var stepEls = $$('.bk-steps li', bkRoot);
  var nextBtn = $('#bkNext', bkRoot);
  var backBtn = $('#bkBack', bkRoot);
  var summaryEl = $('#bkSummary', bkRoot);
  var doneEl = $('#bkDone', bkRoot);

  /* prefill from query (service/doctor slugs, no PII) */
  try {
    var qp = new URLSearchParams(location.search);
    var s = qp.get('service');
    var d = qp.get('doctor');
    if (s) { var sv = KD.SERVICES.filter(function (x) { return x.slug === s || x.id === s; })[0]; if (sv) state.service = sv.id; }
    if (d) { var dv = KD.DOCTORS.filter(function (x) { return x.slug === d || x.id === d; })[0]; if (dv) state.doctor = dv.id; }
  } catch (e) {}

  function serviceObj() { return state.service ? KD.serviceById(state.service) : null; }
  function doctorObj() { return state.doctor && state.doctor !== 'any' ? KD.doctorById(state.doctor) : null; }

  function renderDoctors() {
    var wrap = $('#bkDoctors', bkRoot);
    if (!wrap) return;
    var svc = serviceObj();
    var list = KD.DOCTORS.filter(function (d) { return !svc || svc.doctors.indexOf(d.id) >= 0; });
    var html = '<button type="button" class="opt" data-doc="any" aria-pressed="' + (state.doctor === 'any' || !state.doctor) + '"><b>Будь-який вільний лікар</b><span>Адміністратор підбере фахівця за напрямом</span><span class="tick">✓</span></button>';
    html += list.map(function (d) {
      return '<button type="button" class="opt" data-doc="' + d.id + '" aria-pressed="' + (state.doctor === d.id) + '"><b>' + esc(d.name) + '</b><span>' + esc(d.role) + '</span><span class="tick">✓</span></button>';
    }).join('');
    wrap.innerHTML = html;
    $$('[data-doc]', wrap).forEach(function (b) {
      b.addEventListener('click', function () {
        state.doctor = b.getAttribute('data-doc');
        $$('[data-doc]', wrap).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        renderDates();
      });
    });
  }

  function renderServices() {
    var wrap = $('#bkServices', bkRoot);
    if (!wrap) return;
    var list = KD.SERVICES.filter(function (s) { return s.enabled; });
    wrap.innerHTML = list.map(function (s) {
      return '<button type="button" class="opt" data-svc="' + s.id + '" aria-pressed="' + (state.service === s.id) + '"><b>' + esc(s.title) + '</b><span>' + esc(s.short) + '</span><span class="tick">✓</span></button>';
    }).join('');
    $$('[data-svc]', wrap).forEach(function (b) {
      b.addEventListener('click', function () {
        state.service = b.getAttribute('data-svc');
        state.doctor = null;
        $$('[data-svc]', wrap).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        renderDoctors();
        renderDates();
      });
    });
  }

  function nextDates(n) {
    var out = [], d = new Date();
    d.setHours(0, 0, 0, 0);
    for (var i = 1; out.length < n && i < n + 12; i++) {
      var x = new Date(d); x.setDate(x.getDate() + i);
      out.push(x);
    }
    return out;
  }

  var DOW = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  var MON = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];

  function renderDates() {
    var wrap = $('#bkDays', bkRoot);
    if (!wrap) return;
    var days = nextDates(7);
    wrap.innerHTML = days.map(function (d) {
      var iso = KD.isoDate(d);
      return '<button type="button" class="day" data-day="' + iso + '" aria-pressed="' + (state.date === iso) + '"><span>' + DOW[d.getDay()] + '</span><b>' + d.getDate() + '</b><em>' + MON[d.getMonth()] + '</em></button>';
    }).join('');
    $$('[data-day]', wrap).forEach(function (b) {
      b.addEventListener('click', function () {
        state.date = b.getAttribute('data-day');
        state.time = null;
        $$('[data-day]', wrap).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        renderTimes();
      });
    });
    if (!state.date) {
      state.date = KD.isoDate(days[0]);
      wrap.querySelector('[data-day="' + state.date + '"]').setAttribute('aria-pressed', 'true');
    }
    renderTimes();
  }

  var TIMES = ['09:00', '09:40', '10:20', '11:00', '11:40', '12:20', '14:00', '14:40', '15:20', '16:00', '16:40', '17:20', '18:00'];

  function renderTimes() {
    var wrap = $('#bkTimes', bkRoot);
    if (!wrap) return;
    /* deterministic availability so demo feels real but stable */
    var seed = (state.date || '') + (state.doctor || 'any') + (state.service || '');
    var h = 0;
    for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    wrap.innerHTML = TIMES.map(function (t, i) {
      var busy = ((h >> (i % 28)) & 1) === 1 && i % 5 === 0;
      return '<button type="button" class="time" data-time="' + t + '" aria-pressed="' + (state.time === t) + '"' + (busy ? ' disabled' : '') + '>' + t + '</button>';
    }).join('');
    $$('[data-time]', wrap).forEach(function (b) {
      b.addEventListener('click', function () {
        state.time = b.getAttribute('data-time');
        $$('[data-time]', wrap).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
  }

  function summaryHTML() {
    var svc = serviceObj(), doc = doctorObj();
    var d = state.date ? new Date(state.date + 'T12:00:00') : null;
    return [
      ['Напрям', svc ? svc.title : '—'],
      ['Лікар', doc ? doc.name : 'Будь-який вільний'],
      ['Дата', d ? d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear() : '—'],
      ['Час', state.time || '—'],
      ['Контакт', state.name || '—'],
      ['Телефон', state.phone || '—']
    ].map(function (r) { return '<div><span>' + r[0] + '</span><b>' + esc(r[1]) + '</b></div>'; }).join('');
  }

  function updateSummary() {
    if (summaryEl) summaryEl.innerHTML = summaryHTML();
  }

  function go(step) {
    state.step = Math.max(1, Math.min(5, step));
    panels.forEach(function (p) { p.classList.toggle('on', +p.getAttribute('data-step') === state.step); });
    stepEls.forEach(function (li) {
      var n = +li.getAttribute('data-step');
      li.classList.toggle('on', n === state.step);
      li.classList.toggle('done', n < state.step);
    });
    if (state.step === 3) renderDates();
    if (state.step === 4) { updateSummary(); }
    if (state.step === 5) { updateSummary(); submitBooking(); }
    if (backBtn) backBtn.hidden = state.step === 1 || state.step === 5;
    if (nextBtn) {
      nextBtn.textContent = state.step === 2 ? 'До вибору часу' : 'Далі';
      nextBtn.hidden = state.step === 5;
    }
    var body = $('.bk-body', bkRoot);
    if (body && state.step < 5) {
      var focusEl = $('.bk-panel.on h3', bkRoot);
      if (focusEl) { focusEl.setAttribute('tabindex', '-1'); focusEl.focus({ preventScroll: true }); }
      body.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'nearest' });
    }
  }

  function validate() {
    if (state.step === 1 && !state.service) { window.smilaToast('Оберіть напрям, щоб продовжити.'); return false; }
    if (state.step === 2 && !state.doctor) { window.smilaToast('Оберіть лікаря або варіант «будь-який вільний».'); return false; }
    if (state.step === 3 && (!state.date || !state.time)) { window.smilaToast('Оберіть дату й час візиту.'); return false; }
    if (state.step === 4) {
      var ok = true;
      var nameInput = $('#bkName', bkRoot), phoneInput = $('#bkPhone', bkRoot), emailInput = $('#bkEmail', bkRoot);
      var nameErr = $('#errName', bkRoot), phoneErr = $('#errPhone', bkRoot), emailErr = $('#errEmail', bkRoot);
      var cAppt = $('#consentAppt', bkRoot);
      [nameErr, phoneErr, emailErr].forEach(function (e) { if (e) e.classList.remove('show'); });
      [nameInput, phoneInput, emailInput].forEach(function (e) { if (e) e.setAttribute('aria-invalid', 'false'); });

      state.name = nameInput.value.trim();
      state.phone = phoneInput.value.trim();
      state.email = emailInput.value.trim();
      state.consentAppt = cAppt.checked;
      state.consentMkt = $('#consentMkt', bkRoot).checked;

      if (state.name.length < 2) { ok = false; nameErr.textContent = 'Вкажіть ім\'я (мінімум 2 символи).'; nameErr.classList.add('show'); nameInput.setAttribute('aria-invalid', 'true'); }
      var digits = state.phone.replace(/\D/g, '');
      if (digits.length < 10) { ok = false; phoneErr.textContent = 'Вкажіть телефон у форматі +380 XX XXX XX XX.'; phoneErr.classList.add('show'); phoneInput.setAttribute('aria-invalid', 'true'); }
      if (state.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(state.email)) { ok = false; emailErr.textContent = 'Перевірте формат email.'; emailErr.classList.add('show'); emailInput.setAttribute('aria-invalid', 'true'); }
      if (!state.consentAppt) { ok = false; window.smilaToast('Потрібна згода на обробку даних для запису.'); }
      if (!ok) {
        var first = $('[aria-invalid=true]', bkRoot);
        if (first) first.focus();
        return false;
      }
    }
    return true;
  }

  function submitBooking() {
    if (state.lead) return;
    var svc = serviceObj();
    var doc = doctorObj();
    var utm = { source: 'website', medium: 'booking', campaign: 'demo_booking' };
    try {
      var qp = new URLSearchParams(location.search);
      ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (k) {
        if (qp.get(k)) utm[k.replace('utm_', '')] = qp.get(k);
      });
    } catch (e) {}

    var lead = KD.addLead({
      name: state.name,
      phone: state.phone,
      email: state.email,
      source: 'direct',
      campaign: 'Форма запису на сайті',
      landing: '/industries/dentistry/demo/booking/',
      serviceId: state.service,
      doctorId: doc ? doc.id : svc.doctors[0],
      utm: utm,
      consent: {
        appointment: true,
        marketing: state.consentMkt,
        at: new Date().toISOString(),
        source: 'booking_form'
      }
    });
    var appt = KD.addAppointment({
      leadId: lead.id,
      serviceId: state.service,
      doctorId: doc ? doc.id : svc.doctors[0],
      date: state.date,
      time: state.time,
      status: 'request',
      note: 'Заявка з сайту. Очікує підтвердження адміністратором.'
    });
    state.lead = lead;
    state.appt = appt;

    var ref = $('#bkRef', bkRoot);
    if (ref) ref.textContent = 'Заявка ' + lead.id + ' · запис ' + appt.id;
    var doneName = $('#bkDoneName', bkRoot);
    if (doneName) doneName.textContent = state.name.split(' ')[0];
    var doneTime = $('#bkDoneTime', bkRoot);
    if (doneTime) {
      var d = new Date(state.date + 'T12:00:00');
      doneTime.textContent = d.getDate() + ' ' + MON[d.getMonth()] + ', ' + state.time;
    }
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      if (!validate()) return;
      if (state.step === 4) go(5);
      else go(state.step + 1);
    });
  }
  if (backBtn) backBtn.addEventListener('click', function () { go(state.step - 1); });

  /* formatting helpers */
  var phoneInput = $('#bkPhone', bkRoot);
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      var v = phoneInput.value.replace(/[^\d+]/g, '');
      if (v && v[0] !== '+') v = '+' + v;
      phoneInput.value = v;
    });
  }

  renderServices();
  renderDoctors();
  renderDates();
  go(1);

  /* reset demo data from any page */
  $$('[data-demo-reset]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!window.confirm('Скинути всі демо-дані до початкового стану? Зміни в CRM, записах і автоматизаціях буде втрачено.')) return;
      KD.reset();
      window.smilaToast('Демо-дані скинуто до початкового стану.');
      setTimeout(function () { location.reload(); }, 700);
    });
  });
})();
