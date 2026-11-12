/* ============================================================
   KINETIA × SMILA — Dentistry sales presentation
   Independent product. Reads the shared demo store, never writes
   patient PII anywhere except localStorage demo keys.
   ============================================================ */
(function () {
  'use strict';

  var KD = window.KD;
  var RM = false;
  try { RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function nf(n) { return new Intl.NumberFormat('uk-UA').format(Math.round(n || 0)); }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function money(n) { return nf(n) + ' ₴'; }

  var toastEl = $('#presToast');
  var toastTimer = null;
  function toast(msg, bad) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('err', !!bad);
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 3200);
  }

  if (!KD) {
    toast('Демо-дані не завантажились. Оновіть сторінку.', true);
    return;
  }

  /* ============================================================
     NAV · progress · section tracking
     ============================================================ */
  var nav = $('#pnav');
  var navLinks = $('#pnavLinks');
  var menuBtn = $('#pmenuBtn');
  var progress = $('#pProgress');
  var dots = $$('#pdots button');
  var sections = $$('main .ps');
  var navAnchors = $$('#pnavLinks a');

  function closeMenu() {
    if (!navLinks) return;
    navLinks.classList.remove('open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
  }
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  var navCta = $('#navCta');
  if (navCta) navCta.addEventListener('click', function () {
    var target = document.getElementById('partnership');
    if (target) target.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    var first = $('#finalForm input[name="clinic"]');
    if (first) setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (e) {} }, 500);
  });

  dots.forEach(function (b) {
    b.addEventListener('click', function () {
      var target = document.getElementById(b.getAttribute('data-go'));
      if (target) target.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    });
  });

  function setActive(id) {
    navAnchors.forEach(function (a) {
      a.classList.toggle('on', a.getAttribute('href') === '#' + id);
    });
    dots.forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-go') === id);
    });
  }

  var sectionObserver = null;
  if ('IntersectionObserver' in window && sections.length) {
    sectionObserver = new IntersectionObserver(function (entries) {
      var best = null;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        if (!best || en.intersectionRatio > best.intersectionRatio) best = en;
      });
      if (best) setActive(best.target.getAttribute('data-section'));
    }, { rootMargin: '-38% 0px -50% 0px', threshold: [0, .12, .4, .75] });
    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      if (progress) progress.style.width = (p * 100).toFixed(2) + '%';
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 12);
      if (!sectionObserver) {
        var mid = window.scrollY + window.innerHeight * .42;
        var current = null;
        sections.forEach(function (s) {
          if (s.offsetTop <= mid) current = s;
        });
        if (current) setActive(current.getAttribute('data-section'));
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ============================================================
     HERO 3D SCENE
     ============================================================ */
  (function initScene() {
    var canvas = $('#heroScene');
    var host = canvas ? canvas.closest('.hero-visual') : null;
    var labelLayer = $('#heroLabels');
    var fallback = $('#heroFallback');
    var fps = $('#sceneFps');
    if (!canvas || !host) return;

    var scene = null;
    var anchors = [];
    try {
      scene = window.DentalScene && window.DentalScene.create(canvas, {
        variant: 'hero',
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
              });
              b.addEventListener('mouseenter', function () { if (scene) scene.focus(a.id); });
              b.addEventListener('focus', function () { if (scene) scene.focus(a.id); });
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
      if (fallback) fallback.hidden = false;
      if (canvas) {
        canvas.style.opacity = '0';
        canvas.setAttribute('aria-hidden', 'true');
      }
      if (labelLayer) labelLayer.style.display = 'none';
      if (fps) fps.textContent = 'Fallback';
      return;
    }

    anchors = scene.anchors;
    if (labelLayer) labelLayer.classList.add('ready');
    if (fps) fps.textContent = 'WebGL · ' + anchors.length + ' nodes';
    if (fallback) fallback.hidden = true;
    window.addEventListener('pagehide', function () { try { scene.destroy(); } catch (e) {} });
  })();

  /* ============================================================
     ECOSYSTEM — channel explorer
     ============================================================ */
  var CHANNEL_ROLE = {
    google_search: {
      role: 'Гарячий попит. Людина вже сформулювала потребу й шукає рішення. Тут вирішують релевантна сторінка послуги, ціна-орієнтир і швидкість відповіді.',
      note: 'Оголошення ведуть на сторінку конкретного напряму, не на головну.'
    },
    google_maps: {
      role: 'Локальне рішення «поруч зі мною». Картка клініки, години, фото, категорії та відповіді на відгуки формують довіру до дзвінка.',
      note: 'Жодних вигаданих рейтингів і відгуків у демо.'
    },
    local_seo: {
      role: 'Довгий органічний шар: сторінки напрямів, районів і частих питань. Працює повільно, але знижує залежність від платного трафіку.',
      note: 'Структура сторінок будується навколо запиту, а не ключових слів.'
    },
    meta: {
      role: 'Попит, який ще не сформульовано. Освітній контент і знайомство з лікарями. Кампанії будуються без медичних сегментів і обіцянок лікування.',
      note: 'Policy-aware: без health-based аудиторій і тиску.'
    },
    organic_social: {
      role: 'Регулярний контент: лікарі, процеси, пояснення, за лаштунками. Формує впізнаваність і знижує страх першого візиту.',
      note: 'Контент-план на 30 днів живе в CRM.'
    },
    youtube: {
      role: 'Глибший формат довіри: тур клінікою, знайомство з лікарем, пояснення процедур. Працює на рішення задовго до заявки.',
      note: 'Відео веде на релевантну сторінку, а не в порожнечу.'
    },
    retargeting: {
      role: 'Повернення тих, хто вже цікавився. Обмежений дозволеними аудиторіями: без списків пацієнтів і медичних станів.',
      note: 'Кожен рівень аудиторії має правило дозволу.'
    },
    referral: {
      role: 'Найдешевше джерело довіри. Рекомендація пацієнта потребує окремої згоди на згадку та коректної атрибуції.',
      note: 'Без вигаданих відгуків і рейтингів.'
    },
    direct: {
      role: 'Прямі звернення: телефон, месенджер, візит. Джерело все одно фіксується, інакше воно зникає з аналітики.',
      note: 'Адміністратор зобов\'язаний вказати джерело.'
    },
    recall: {
      role: 'Повторні візити та профілактичний цикл. Найприбутковіший шар, який зазвичай не вимірюють.',
      note: 'Комунікація лише за маркетинговою згодою.'
    }
  };

  var ecoSel = 'google_search';
  var ecoChannels = $('#ecoChannels');
  var ecoDetail = $('#ecoDetail');

  function renderEco() {
    if (!ecoChannels || !ecoDetail) return;
    var rows = KD.bySource(30);
    var map = {};
    rows.forEach(function (r) { map[r.id] = r; });

    ecoChannels.innerHTML = KD.SOURCES.map(function (src) {
      var r = map[src.id] || { inquiries: 0 };
      return '<button type="button" class="eco-ch' + (src.id === ecoSel ? ' on' : '') + '" data-ch="' + esc(src.id) + '">' +
        '<i style="background:' + esc(src.color) + '"></i>' +
        '<span class="ch-txt"><b>' + esc(src.short) + '</b><span>' + esc(src.type) + '</span></span>' +
        '<em>' + nf(r.inquiries) + '</em>' +
      '</button>';
    }).join('');

    var src = KD.sourceById(ecoSel) || KD.SOURCES[0];
    var row = map[src.id] || { visitors: src.visitors, inquiries: 0, booked: 0, visits: 0, spend: src.spend, cpi: 0 };
    var role = CHANNEL_ROLE[src.id] || { role: '', note: '' };
    var max = Math.max(row.visitors, row.inquiries, row.booked, row.visits, 1);

    function mini(label, val, color) {
      var w = Math.max(2, Math.round(val / max * 100));
      return '<div class="ed-fr"><span>' + esc(label) + '</span><i style="width:' + w + '%;background:linear-gradient(90deg,' + esc(color) + '66,' + esc(color) + ')"></i><b>' + nf(val) + '</b></div>';
    }

    ecoDetail.innerHTML =
      '<div class="ed-top"><i style="background:' + esc(src.color) + '"></i><h3>' + esc(src.label) + '</h3><span class="tag">' + esc(src.type) + '</span></div>' +
      '<p class="ed-role">' + esc(role.role) + '</p>' +
      '<div class="ed-kpis">' +
        '<div class="ed-kpi"><span>Трафік / 30 днів</span><b>' + nf(row.visitors) + '</b></div>' +
        '<div class="ed-kpi"><span>Звернення</span><b>' + nf(row.inquiries) + '</b></div>' +
        '<div class="ed-kpi"><span>Бронювання</span><b>' + nf(row.booked) + '</b></div>' +
        '<div class="ed-kpi"><span>CPI демо</span><b>' + (row.cpi ? money(row.cpi) : '—') + '</b></div>' +
      '</div>' +
      '<div class="ed-funnel">' +
        mini('Трафік', row.visitors, src.color) +
        mini('Звернення', row.inquiries, src.color) +
        mini('Бронь', row.booked, src.color) +
        mini('Візити', row.visits, src.color) +
      '</div>' +
      '<p class="recall-note">' + esc(role.note) + '</p>';

    $$('.eco-ch', ecoChannels).forEach(function (b) {
      b.addEventListener('click', function () {
        ecoSel = b.getAttribute('data-ch');
        renderEco();
      });
    });
  }

  /* ============================================================
     CRM PREVIEW — aggregated live demo metrics
     ============================================================ */
  var crmKpis = $('#crmKpis');
  var crmToday = $('#crmToday');
  var crmTodayCount = $('#crmTodayCount');
  var crmStages = $('#crmStages');
  var crmSources = $('#crmSources');

  function renderCrm() {
    if (!crmKpis) return;
    var s = KD.read();
    var m = KD.metrics(30);

    crmKpis.innerHTML = [
      { label: 'Звернення', value: nf(m.leads), sub: 'за 30 днів' },
      { label: 'Заброньовано', value: nf(m.booked), sub: 'з усіх звернень' },
      { label: 'Перші візити', value: nf(m.firstVisits), sub: 'завершені візити' },
      { label: 'Відкриті задачі', value: nf(m.tasksOpen), sub: 'потребують дії' }
    ].map(function (k) {
      return '<div class="crm-kpi"><span>' + esc(k.label) + '</span><b>' + esc(k.value) + '</b><small>' + esc(k.sub) + '</small></div>';
    }).join('');

    var today = KD.todayISO();
    var appts = s.appointments.filter(function (a) { return a.date === today; })
      .sort(function (a, b) { return a.time < b.time ? -1 : 1; });
    if (crmTodayCount) crmTodayCount.textContent = appts.length + ' записів';
    if (crmToday) {
      crmToday.innerHTML = appts.length ? appts.slice(0, 5).map(function (a) {
        var lead = s.leads.filter(function (l) { return l.id === a.leadId; })[0];
        var svc = KD.serviceById(a.serviceId);
        return '<div class="crm-today-row"><time>' + esc(a.time) + '</time><div><b>' + esc(lead ? lead.name : 'Пацієнт') + '</b>' +
          '<span>' + esc(svc ? svc.title : 'Консультація') + ' · ' + esc(a.status) + '</span></div></div>';
      }).join('') : '<p class="crm-empty">На сьогодні записів немає. Створіть запис у CRM.</p>';
    }

    var counts = {};
    KD.STAGES.forEach(function (st) { counts[st.id] = 0; });
    s.leads.forEach(function (l) { if (counts[l.stage] != null) counts[l.stage]++; });
    var maxStage = Math.max.apply(null, KD.STAGES.map(function (st) { return counts[st.id]; }).concat([1]));
    if (crmStages) {
      crmStages.innerHTML = KD.STAGES.map(function (st) {
        return '<div class="crm-stage"><span>' + esc(st.short) + '</span><i><b style="width:' +
          Math.max(2, Math.round(counts[st.id] / maxStage * 100)) + '%"></b></i><em>' + counts[st.id] + '</em></div>';
      }).join('');
    }

    var by = KD.bySource(30).sort(function (a, b) { return b.inquiries - a.inquiries; }).slice(0, 5);
    var maxSrc = Math.max.apply(null, by.map(function (x) { return x.inquiries; }).concat([1]));
    if (crmSources) {
      crmSources.innerHTML = by.map(function (r) {
        return '<div class="crm-src"><span>' + esc(r.short) + '</span><i><b style="width:' +
          Math.max(2, Math.round(r.inquiries / maxSrc * 100)) + '%;background:' + esc(r.color) + '"></b></i><em>' + r.inquiries + '</em></div>';
      }).join('');
    }
  }

  /* ============================================================
     AUTOMATION CENTRE
     ============================================================ */
  var autoList = $('#autoList');
  var autoHistory = $('#autoHistory');
  var autoHistoryCount = $('#autoHistoryCount');
  var autoSimTitle = $('#autoSimTitle');
  var autoSimText = $('#autoSimText');
  var autoSimBtn = $('#autoSimBtn');
  var autoSel = null;

  var ST_LABEL = { active: 'активна', paused: 'вимкнена', error: 'помилка' };

  function autoState(id) {
    var s = KD.read().automationState.filter(function (x) { return x.id === id; })[0];
    return s || { id: id, enabled: false, runs: 0, lastRun: '', nextRun: '', status: 'paused' };
  }

  function fmtStamp(v) {
    if (!v) return '—';
    var d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    return KD.pad(d.getDate()) + '.' + KD.pad(d.getMonth() + 1) + ' ' + KD.pad(d.getHours()) + ':' + KD.pad(d.getMinutes());
  }

  function renderAuto() {
    if (!autoList) return;
    var s = KD.read();
    autoList.innerHTML = KD.AUTOMATIONS.map(function (a) {
      var st = s.automationState.filter(function (x) { return x.id === a.id; })[0] || autoState(a.id);
      var cls = 'auto-item' + (a.id === autoSel ? ' on' : '') + (st.status === 'error' ? ' err' : '') + (st.enabled ? '' : ' off');
      return '<article class="' + cls + '" data-auto="' + esc(a.id) + '" role="listitem">' +
        '<div class="ai-top"><span class="ai-no">' + esc(a.no) + '</span><div class="ai-title"><b>' + esc(a.name) + '</b><p>' + esc(a.trigger) + '</p></div></div>' +
        '<div class="ai-meta"><span class="st"><i></i>' + esc(ST_LABEL[st.status] || st.status) + '</span><span>' + nf(st.runs) + ' запусків</span></div>' +
        '<button type="button" data-run="' + esc(a.id) + '">Симулювати</button>' +
      '</article>';
    }).join('');

    $$('[data-auto]', autoList).forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('[data-run]')) return;
        autoSel = card.getAttribute('data-auto');
        renderAuto();
      });
    });
    $$('[data-run]', autoList).forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        autoSel = b.getAttribute('data-run');
        simulate(autoSel);
      });
    });

    var hist = s.automationHistory.slice(0, 8);
    if (autoHistoryCount) autoHistoryCount.textContent = s.automationHistory.length + ' подій';
    if (autoHistory) {
      autoHistory.innerHTML = hist.length ? hist.map(function (h) {
        var def = KD.AUTOMATIONS.filter(function (a) { return a.id === h.automationId; })[0];
        return '<li class="' + (h.ok ? '' : 'bad') + '"><i></i><div><b>' + esc(def ? def.name : h.automationId) + '</b>' +
          '<span>' + esc(h.text) + '</span><time>' + esc(fmtStamp(h.at)) + '</time></div></li>';
      }).join('') : '<li class="auto-empty">Історія порожня. Запустіть симуляцію.</li>';
    }

    if (autoSimBtn) autoSimBtn.disabled = !autoSel;
    if (autoSel) {
      var def = KD.AUTOMATIONS.filter(function (a) { return a.id === autoSel; })[0];
      var st = autoState(autoSel);
      if (autoSimTitle) autoSimTitle.textContent = def ? def.no + ' · ' + def.name : 'Оберіть сценарій';
      if (autoSimText) {
        autoSimText.textContent = def
          ? def.actions.slice(0, 3).join(' → ') + '. Статус: ' + (ST_LABEL[st.status] || st.status) + '. Останній запуск: ' + fmtStamp(st.lastRun) + '.'
          : '';
      }
    }
  }

  function simulate(id) {
    var res = KD.runAutomation(id);
    if (!res) { toast('Сценарій не знайдено в демо-даних.', true); return; }
    if (res.error) { toast('Симуляція неможлива: ' + res.error, true); renderAuto(); return; }
    if (res.ok) {
      toast('Симуляція «' + res.def.name + '»: успішно. Реальні повідомлення не надсилались.');
    } else {
      toast('Симуляція «' + res.def.name + '»: демонстраційна помилка каналу.', true);
    }
    renderAuto();
    renderCrm();
    renderAnalytics();
    renderRetention();
  }

  if (autoSimBtn) autoSimBtn.addEventListener('click', function () {
    if (autoSel) simulate(autoSel);
  });

  /* ============================================================
     ANALYTICS — range, funnel, attribution, channel table
     ============================================================ */
  var range = 30;
  var funnelEl = $('#funnel');
  var funnelNote = $('#funnelNote');
  var attrSample = $('#attrSample');
  var channelRows = $('#channelRows');

  function renderAnalytics() {
    if (!funnelEl) return;
    var f = KD.funnel(range);
    var max = f[0].value || 1;
    funnelEl.innerHTML = f.map(function (step) {
      return '<div class="fn-row"><span>' + esc(step.label) + '</span>' +
        '<div class="fn-bar"><i style="width:' + Math.max(1.5, step.value / max * 100) + '%"></i></div>' +
        '<b>' + nf(step.value) + '</b><em>' + step.rate + '%</em></div>';
    }).join('');
    if (funnelNote) funnelNote.textContent = range + ' днів';

    var s = KD.read();
    var lead = s.leads[0];
    if (attrSample && lead) {
      var src = KD.sourceById(lead.source);
      var svc = KD.serviceById(lead.serviceId);
      var adm = KD.adminById(lead.adminId);
      attrSample.innerHTML =
        '<div class="as-name">' + esc(lead.name) + ' · ' + esc(lead.id) + '</div>' +
        '<div class="as-sub">' + esc(svc ? svc.title : 'Консультація') + ' · звернення ' + esc(fmtStamp(lead.createdAt)) + '</div>' +
        '<div class="attr-chain">' +
          '<span class="on">' + esc(src ? src.short : lead.source) + '</span>' +
          '<span>' + esc(lead.campaign) + '</span>' +
          '<span>' + esc(lead.adgroup) + '</span>' +
          '<span>' + esc(lead.creative) + '</span>' +
          '<span>' + esc(lead.landing) + '</span>' +
          '<span>' + esc(adm ? adm.name : 'Адміністратор') + '</span>' +
        '</div>';
    }

    if (channelRows) {
      var by = KD.bySource(range).sort(function (a, b) { return b.visitors - a.visitors; });
      channelRows.innerHTML = by.map(function (r) {
        return '<div class="ch-row">' +
          '<div class="ch-name"><i style="background:' + esc(r.color) + '"></i><span>' + esc(r.label) + '</span></div>' +
          '<em>' + nf(r.visitors) + '</em>' +
          '<em>' + nf(r.inquiries) + '</em>' +
          '<em>' + nf(r.booked) + '</em>' +
          '<em>' + nf(r.visits) + '</em>' +
          '<em>' + (r.cpi ? nf(r.cpi) : '—') + '</em>' +
        '</div>';
      }).join('');
    }
  }

  $$('.range-switch button').forEach(function (b) {
    b.addEventListener('click', function () {
      range = parseInt(b.getAttribute('data-range'), 10) || 30;
      $$('.range-switch button').forEach(function (x) { x.classList.toggle('on', x === b); });
      renderAnalytics();
      toast('Період демо-аналітики: ' + range + ' днів.');
    });
  });

  /* ============================================================
     RETENTION — recall queue + consent split
     ============================================================ */
  var loopStats = $('#loopStats');
  var recallList = $('#recallList');
  var recallCount = $('#recallCount');
  var consentSplit = $('#consentSplit');

  function renderRetention() {
    if (!recallList) return;
    var q = KD.recallQueue();
    var m = KD.metrics(30);
    var consent = q.filter(function (x) { return x.consent; }).length;
    var noConsent = q.length - consent;

    if (recallCount) recallCount.textContent = q.length + ' у черзі';
    if (loopStats) {
      loopStats.innerHTML =
        '<div><span>У черзі recall</span><b>' + nf(q.length) + '</b></div>' +
        '<div><span>Повторні візити</span><b>' + nf(m.repeat) + '</b></div>' +
        '<div><span>Show rate</span><b>' + m.showRate + '%</b></div>';
    }

    recallList.innerHTML = q.length ? q.slice(0, 6).map(function (x) {
      var days = x.daysSince >= 999 ? '—' : x.daysSince + ' дн';
      return '<li><span class="' + (x.consent ? 'ok' : '') + '">' + days + '</span><div><b>' + esc(x.lead.name) + '</b>' +
        '<p>' + esc(x.channel === '—' ? 'без маркетингової згоди' : 'канал: ' + x.channel) + ' · останній візит ' + esc(x.lastVisit) + '</p></div>' +
        '<em>' + esc(x.lead.id) + '</em></li>';
    }).join('') : '<li class="auto-empty">Черга порожня.</li>';

    if (consentSplit) {
      var total = q.length || 1;
      consentSplit.innerHTML =
        '<div class="cs-legend"><span>Маркетингова згода</span><span><b>' + consent + '</b> з ' + q.length + '</span></div>' +
        '<div class="cs-bar"><i style="width:' + (consent / total * 100) + '%;background:var(--em3)"></i>' +
        '<i style="width:' + (noConsent / total * 100) + '%;background:rgba(244,247,245,.14)"></i></div>' +
        '<div class="cs-legend"><span>Згода: ' + consent + '</span><span>Без згоди: ' + noConsent + '</span></div>';
    }
  }

  /* ============================================================
     ROADMAP
     ============================================================ */
  var roadmapList = $('#roadmapList');
  var ROADMAP = [
    { no: 'PHASE 01', time: 'Тиждень 1–2', title: 'Аудит і вимірювання', text: 'Аналіз поточних джерел, сторінок, швидкості відповіді та втрат у маршруті пацієнта. Налаштування подій і атрибуції.', out: 'Карта втрат + базова аналітика' },
    { no: 'PHASE 02', time: 'Тиждень 2–4', title: 'Сайт і сторінки послуг', text: 'Публічний сайт клініки: напрями, лікарі, ціни, галерея, контакти. Окремі згоди та безпечні форми запису.', out: 'Сайт, готовий приймати трафік' },
    { no: 'PHASE 03', time: 'Тиждень 4–6', title: 'CRM і маршрутизація', text: 'Ліди, пацієнти, 12-етапний пайплайн, календар, задачі, ролі адміністраторів. Єдине місце для кожного звернення.', out: 'Жодне звернення не губиться' },
    { no: 'PHASE 04', time: 'Тиждень 6–9', title: 'Платний трафік', text: 'Google Search, Maps, Meta за політиками платформ. Релевантні landing-сторінки, мінус-слова, локальний попит.', out: 'Керований потік звернень' },
    { no: 'PHASE 05', time: 'Тиждень 9–11', title: 'Автоматизації та утримання', text: '10 сценаріїв: підтвердження, нагадування, неявки, супровід плану, recall, реактивація. Згоди та канали комунікації.', out: 'Менше неявок, більше повторних візитів' },
    { no: 'PHASE 06', time: 'Тиждень 11–12+', title: 'Аналітика й масштаб', text: 'Атрибуція до візиту, вартість звернення й пацієнта, щомісячний цикл покращень і розширення каналів.', out: 'Рішення на цифрах, а не на відчуттях' }
  ];

  if (roadmapList) {
    roadmapList.innerHTML = ROADMAP.map(function (p) {
      return '<article class="rm-card"><div class="rm-top"><span class="rm-no">' + esc(p.no) + '</span><span class="rm-time">' + esc(p.time) + '</span></div>' +
        '<h3>' + esc(p.title) + '</h3><p>' + esc(p.text) + '</p>' +
        '<div class="rm-out"><span>Результат фази</span><b>' + esc(p.out) + '</b></div></article>';
    }).join('');
  }

  /* ============================================================
     PARTNERSHIP FORM — local only
     ============================================================ */
  var form = $('#finalForm');
  var formError = $('#finalError');
  var formSuccess = $('#finalSuccess');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var clinic = String(data.get('clinic') || '').trim();
      var name = String(data.get('name') || '').trim();
      var contact = String(data.get('contact') || '').trim();
      var consent = data.get('consent');
      var err = '';

      if (clinic.length < 2) err = 'Вкажіть назву клініки.';
      else if (name.length < 2) err = 'Вкажіть, як до вас звертатися.';
      else if (contact.length < 5) err = 'Вкажіть телефон або email для демо-зв\'язку.';
      else if (!consent) err = 'Потрібна згода на обробку даних для демо-зв\'язку.';

      if (err) {
        if (formError) { formError.textContent = err; formError.hidden = false; }
        if (formSuccess) formSuccess.hidden = true;
        toast(err, true);
        return;
      }

      KD.logEvent('Презентація: демо-запит на розбір (локально, без надсилання)');
      if (formError) formError.hidden = true;
      if (formSuccess) formSuccess.hidden = false;
      form.reset();
      toast('Демо-запит прийнято локально. Реальне повідомлення не надсилалося.');
      renderCrm();
    });
  }

  /* ============================================================
     REVEAL
     ============================================================ */
  var reveals = $$('[data-reveal]');
  if (RM || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        ro.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    reveals.forEach(function (el) { ro.observe(el); });
  }

  /* ============================================================
     LIVE SYNC — website booking / CRM changes update the deck
     ============================================================ */
  KD.subscribe(function () {
    renderCrm();
    renderEco();
    renderAuto();
    renderAnalytics();
    renderRetention();
  });

  /* ============================================================
     BOOT
     ============================================================ */
  renderEco();
  renderCrm();
  renderAuto();
  renderAnalytics();
  renderRetention();

  window.addEventListener('storage', function (e) {
    if (e.key && e.key !== KD.KEY) return;
    renderEco(); renderCrm(); renderAuto(); renderAnalytics(); renderRetention();
  });

  window.presentationDemo = {
    refresh: function () {
      renderEco(); renderCrm(); renderAuto(); renderAnalytics(); renderRetention();
    }
  };
})();
