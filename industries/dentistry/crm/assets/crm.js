/* ============================================================
   SMILA OS · KINETIA Dental CRM — application layer
   Shared demo store: /industries/dentistry/assets/demo-data.js
   ============================================================ */
(function () {
  'use strict';

  var KD = window.KD;
  if (!KD) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var ADMIN_KEY = 'kinetia_dentistry_admin_v1';

  var MONTHS = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
  var DOW = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
  var TIMES = ['09:00', '09:40', '10:20', '11:00', '11:40', '12:20', '14:00', '14:40', '15:20', '16:00', '16:40', '17:20', '18:00', '18:40'];
  var APP_STATUS = {
    request: { label: 'Заявка', tone: 'warn' },
    confirmed: { label: 'Підтверджено', tone: 'ok' },
    completed: { label: 'Завершено', tone: 'mut' },
    no_show: { label: 'Неявка', tone: 'bad' },
    cancelled: { label: 'Скасовано', tone: 'mut' }
  };
  var AUTO_STATUS = {
    active: { label: 'Активна', tone: 'ok' },
    paused: { label: 'Вимкнена', tone: 'mut' },
    error: { label: 'Помилка', tone: 'bad' }
  };

  var S = {
    view: 'dashboard',
    range: 30,
    search: '',
    leadStage: '',
    leadSource: '',
    leadAdmin: '',
    calMode: 'month',
    calDate: new Date(),
    taskTab: 'open',
    taskOwner: '',
    drawer: null
  };

  var admin = readAdmin();

  /* ---------------- utilities ---------------- */
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function initials(name) {
    return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2)
      .map(function (w) { return w[0]; }).join('').toUpperCase();
  }
  function fmtDate(d) {
    if (!d) return '—';
    var x = new Date(d.length <= 10 ? d + 'T00:00' : d);
    if (isNaN(x)) return d;
    return pad(x.getDate()) + '.' + pad(x.getMonth() + 1) + '.' + x.getFullYear();
  }
  function fmtStamp(s) {
    if (!s) return '—';
    var parts = String(s).split('T');
    return fmtDate(parts[0]) + (parts[1] ? ' · ' + parts[1] : '');
  }
  function fmtShort(s) {
    if (!s) return '—';
    var parts = String(s).split('T');
    var p = parts[0].split('-');
    return p[2] + '.' + p[1] + (parts[1] ? ' ' + parts[1] : '');
  }
  function relTime(s) {
    if (!s) return '—';
    var t = new Date(s).getTime();
    if (isNaN(t)) return s;
    var diff = Math.round((Date.now() - t) / 60000);
    if (diff < 1) return 'щойно';
    if (diff < 60) return diff + ' хв тому';
    if (diff < 1440) return Math.round(diff / 60) + ' год тому';
    return Math.round(diff / 1440) + ' дн тому';
  }
  function fmtNext(s) {
    if (!s) return '—';
    var t = new Date(s).getTime();
    if (isNaN(t)) return s;
    var diff = Math.round((t - Date.now()) / 60000);
    if (diff <= 0) return 'зараз';
    if (diff < 60) return 'через ' + diff + ' хв';
    if (diff < 1440) return 'через ' + Math.round(diff / 60) + ' год';
    return 'через ' + Math.round(diff / 1440) + ' дн';
  }
  function alpha(hex, a) {
    var h = String(hex || '#19DFA0').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function stageTag(stageId) {
    var st = KD.STAGE_MAP[stageId] || KD.STAGES[0];
    return '<span class="stage-cell" data-tone="' + st.tone + '"><i></i>' + esc(st.short) + '</span>';
  }
  function apptTag(status) {
    var st = APP_STATUS[status] || APP_STATUS.request;
    return '<span class="tag ' + (st.tone === 'mut' ? 'mut' : st.tone) + '"><i class="dot"></i>' + st.label + '</span>';
  }
  function sourceDot(srcId) {
    var src = KD.sourceById(srcId);
    return '<i style="background:' + (src ? src.color : '#5B8F7C') + '"></i>';
  }
  function lor(lead) { return KD.read().leads.filter(function (l) { return l.id === lead; })[0] || null; }
  function todayISO() { return KD.todayISO(); }
  function daysBetween(a, b) {
    var d1 = new Date(a + 'T00:00').getTime();
    var d2 = new Date(b + 'T00:00').getTime();
    return Math.round((d2 - d1) / 86400000);
  }
  function toast(msg, err) {
    var el = $('#toast');
    el.textContent = msg;
    el.className = 'toast on' + (err ? ' err' : '');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.className = 'toast'; }, 3200);
  }
  function readAdmin() {
    try {
      var raw = localStorage.getItem(ADMIN_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }
  function saveAdmin(a) {
    admin = a;
    try {
      if (a) localStorage.setItem(ADMIN_KEY, JSON.stringify(a));
      else localStorage.removeItem(ADMIN_KEY);
    } catch (e) {}
  }
  function actor() { return admin ? admin.name : 'Адміністратор'; }

  /* ============================================================
     BOOT / LOGIN
     ============================================================ */
  function boot() {
    bindLogin();
    bindShell();
    if (admin) enterApp();
    else {
      $('#gate').hidden = false;
      $('#shell').hidden = true;
      var em = $('#loginEmail');
      if (em) em.focus();
    }
  }

  function bindLogin() {
    $('#loginForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('#loginEmail').value.trim();
      var pass = $('#loginPass').value;
      var role = $('#loginRole').value;
      var err = $('#loginError');
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        err.textContent = 'Введіть коректний email демо-користувача.';
        err.hidden = false;
        return;
      }
      if (!pass || pass.length < 4) {
        err.textContent = 'Пароль демо-доступу — мінімум 4 символи.';
        err.hidden = false;
        return;
      }
      err.hidden = true;
      var a;
      if (role === 'manager') {
        a = { id: 'manager', name: 'Ірина Коваль', role: 'Керівниця клініки', initials: 'ІК', manager: true };
      } else {
        var def = KD.adminById(role) || KD.ADMINS[0];
        a = { id: def.id, name: def.name, role: def.role, initials: def.initials, manager: false };
      }
      saveAdmin(a);
      enterApp();
    });
  }

  function enterApp() {
    $('#gate').hidden = true;
    $('#shell').hidden = false;
    $('#sideAvatar').textContent = admin.initials || initials(admin.name);
    $('#sideUser').textContent = admin.name;
    $('#sideRole').textContent = admin.role;
    var h = (location.hash || '').replace('#', '');
    if (h && $('#sideNav [data-view="' + h + '"]')) S.view = h;
    setView(S.view, true);
    setupDemoReset();
    window.addEventListener('hashchange', function () {
      var v = location.hash.replace('#', '');
      if (v && $('#sideNav [data-view="' + v + '"]')) setView(v);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeModal(); closeDrawer(); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        var g = $('#globalSearch');
        if (g) g.focus();
      }
    });
  }

  function bindShell() {
    $('#sideToggle').addEventListener('click', function () {
      var side = $('#side');
      var open = side.classList.toggle('open');
      this.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $('#sideNav').addEventListener('click', function (e) {
      var b = e.target.closest('[data-view]');
      if (!b) return;
      $('#side').classList.remove('open');
      setView(b.getAttribute('data-view'));
    });
    $('#logoutBtn').addEventListener('click', function () {
      saveAdmin(null);
      location.reload();
    });
    $$('.range button').forEach(function (b) {
      b.addEventListener('click', function () {
        S.range = parseInt(b.getAttribute('data-range'), 10);
        $$('.range button').forEach(function (x) { x.classList.toggle('on', x === b); });
        render();
      });
    });
    var search = $('#globalSearch');
    var t = null;
    search.addEventListener('input', function () {
      S.search = search.value.trim().toLowerCase();
      if (S.view !== 'leads' && S.view !== 'patients') setView('leads', true);
      else render();
    });
    search.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { search.value = ''; S.search = ''; render(); }
    });
    $('#scrim').addEventListener('click', function () { closeDrawer(); });
    $('#modalWrap').addEventListener('click', function (e) {
      if (e.target === $('#modalWrap')) closeModal();
    });
    document.addEventListener('click', onDocClick);
  }

  function setupDemoReset() {
    $('#demoReset').addEventListener('click', function () {
      if (!window.confirm('Скинути всі демо-дані? Заявки, записи, задачі, автоматизації та історія повернуться до початкового стану.')) return;
      KD.reset();
      closeDrawer();
      closeModal();
      render();
      toast('Демо-дані скинуто до початкового стану.');
    });
  }

  function setView(v, silent) {
    S.view = v;
    if (v !== 'leads' && v !== 'patients') {
      S.search = '';
      var gs = $('#globalSearch');
      if (gs) gs.value = '';
    }
    $$('#sideNav .nav-item').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-view') === v);
    });
    if (!silent && location.hash !== '#' + v) {
      try { history.replaceState(null, '', '#' + v); } catch (e) {}
    }
    render();
  }

  function updateCounts() {
    var s = KD.read();
    var open = s.leads.filter(function (l) { return ['new', 'attempt', 'contacted', 'booked', 'plan', 'decision', 'recall'].indexOf(l.stage) >= 0; }).length;
    var tasks = s.tasks.filter(function (t) { return t.status === 'open'; }).length;
    var a = $('[data-count="leads"]'); if (a) a.textContent = open;
    var b = $('[data-count="tasks"]'); if (b) b.textContent = tasks;
  }

  /* ============================================================
     RENDER ROUTER
     ============================================================ */
  function render() {
    if (!admin) return;
    updateCounts();
    var root = $('#viewRoot');
    var titles = {
      dashboard: 'Огляд', leads: 'Ліди', patients: 'Пацієнти', pipeline: 'Пайплайн',
      calendar: 'Календар', tasks: 'Задачі', automations: 'Автоматизації',
      analytics: 'Аналітика', settings: 'Налаштування'
    };
    $('#crumbView').textContent = titles[S.view] || 'Огляд';
    var html = '';
    switch (S.view) {
      case 'dashboard': html = viewDashboard(); break;
      case 'leads': html = viewLeads(); break;
      case 'patients': html = viewPatients(); break;
      case 'pipeline': html = viewPipeline(); break;
      case 'calendar': html = viewCalendar(); break;
      case 'tasks': html = viewTasks(); break;
      case 'automations': html = viewAutomations(); break;
      case 'analytics': html = viewAnalytics(); break;
      case 'settings': html = viewSettings(); break;
      default: html = viewDashboard();
    }
    root.innerHTML = html;
    afterRender();
  }

  function afterRender() {
    if (S.view === 'pipeline') bindPipeline();
  }

  /* ---------------- dashboard ---------------- */
  function viewDashboard() {
    var s = KD.read();
    var m = KD.metrics(S.range);
    var today = todayISO();
    var appts = s.appointments.filter(function (a) { return a.date === today; })
      .sort(function (a, b) { return a.time < b.time ? -1 : 1; });
    var tasks = s.tasks.filter(function (t) { return t.status === 'open'; })
      .sort(function (a, b) { return a.due < b.due ? -1 : 1; });
    var bySrc = KD.bySource(S.range).sort(function (a, b) { return b.inquiries - a.inquiries; }).slice(0, 6);
    var maxInq = Math.max.apply(null, bySrc.map(function (x) { return x.inquiries; }).concat([1]));
    var funnel = KD.funnel(S.range);
    var attention = s.leads.filter(function (l) { return l.stage === 'new' || l.stage === 'attempt'; })
      .sort(function (a, b) { return a.stageSince < b.stageSince ? -1 : 1; }).slice(0, 5);
    var logs = s.logs.slice(0, 6);

    var kpis = '<div class="kpis">' +
      kpi('Звернення', m.newInquiries, 'за ' + rangeLabel(), '◧', '<b>+ демо</b> канал-мікс') +
      kpi('Заброньовано', m.booked, 'консультації', '▦', '<b>' + m.confirmed + '</b> підтверджено') +
      kpi('Show rate', m.showRate + '<small>%</small>', 'перші візити', '◔', '<b>' + m.firstVisits + '</b> візитів у періоді', true) +
      kpi('Відкриті задачі', m.tasksOpen, 'потребують дії', '✓', '<b class="' + (m.tasksOpen > 8 ? 'bad' : '') + '">' + m.tasksOpen + '</b> у черзі', true) +
      '</div>';

    var todayCard = '<div class="card"><div class="card-head"><div><h2>Записи сьогодні</h2><p>' + fmtDate(today) + ' · ' + appts.length + ' у календарі</p></div>' +
      '<button class="btn sm" data-open="new-appt">+ Запис</button></div>' +
      (appts.length ? appts.slice(0, 6).map(function (a) {
        var l = lor(a.leadId) || {};
        return '<div class="today-row"><span class="time-chip">' + esc(a.time) + '</span><div class="who"><b>' + esc(l.name || a.leadId) + '</b>' +
          '<p>' + esc(serviceName(a.serviceId)) + ' · ' + esc(doctorName(a.doctorId)) + '</p></div>' +
          '<div class="mini-actions">' +
          (a.status !== 'confirmed' && a.status !== 'completed' ?
            '<button data-appt="' + a.id + '" data-set="confirmed" title="Підтвердити" aria-label="Підтвердити">✓</button>' : '') +
          '<button data-lead="' + esc(a.leadId) + '" title="Відкрити ліда" aria-label="Відкрити ліда">↗</button></div></div>';
      }).join('') : '<div class="empty">На сьогодні записів немає.</div>') +
      (appts.length > 6 ? '<p class="small" style="margin-top:8px;color:var(--mut2);font-size:11px">+ ще ' + (appts.length - 6) + ' у календарі</p>' : '') +
      '</div>';

    var tasksCard = '<div class="card"><div class="card-head"><div><h2>Черга задач</h2><p>перший контакт, підтвердження, супровід</p></div><button class="link" data-goto="tasks">Усі →</button></div>' +
      (tasks.length ? tasks.slice(0, 6).map(function (t) {
        var l = t.leadId ? lor(t.leadId) : null;
        var over = t.due < today;
        return '<div class="today-row"><span class="tag ' + (over ? 'bad' : 'mut') + '" style="flex:none">' + (over ? 'прострочено' : fmtShort(t.due).slice(0, 5)) + '</span>' +
          '<div class="who" ' + (l ? 'data-lead="' + esc(l.id) + '" style="cursor:pointer"' : '') + '><b>' + esc(t.title) + '</b>' +
          '<p>' + esc(l ? l.name + ' · ' + adminName(t.owner) : adminName(t.owner)) + '</p></div>' +
          '<div class="mini-actions"><button data-task="' + t.id + '" title="Позначити виконаною" aria-label="Позначити виконаною">✓</button></div></div>';
      }).join('') : '<div class="empty">Відкритих задач немає.</div>') + '</div>';

    var sourceCard = '<div class="card"><div class="card-head"><div><h2>Джерела</h2><p>звернення за ' + rangeLabel() + '</p></div><button class="link" data-goto="analytics">Аналітика →</button></div>' +
      (bySrc.length ? bySrc.map(function (x) {
        return '<div class="source-row"><span class="name">' + esc(x.label) + '</span><span class="bar"><i style="width:' + Math.max(3, Math.round(x.inquiries / maxInq * 100)) + '%;background:' + alpha(x.color, .95) + '"></i></span><b>' + x.inquiries + '</b></div>';
      }).join('') : '<div class="empty">Немає звернень у періоді.</div>') +
      '<div class="legend"><span><i style="background:' + KD.SOURCES[0].color + '"></i>заявки з каналів</span><span><i style="background:var(--mut2)"></i>демо-значення</span></div></div>';

    var funnelCard = '<div class="card"><div class="card-head"><div><h2>Воронка пацієнта</h2><p>від відвідувача до повторного візиту</p></div></div>' +
      '<div class="funnel-mini">' + funnel.map(function (f, i) {
        var max = funnel[0].value || 1;
        return '<div class="fm-row"><span>' + esc(f.label) + '</span><span class="bar"><i style="width:' + Math.max(2, Math.round(f.value / max * 100)) + '%;opacity:' + (1 - i * .07) + '"></i></span><b>' + f.value + '</b></div>';
      }).join('') + '</div>' +
      '<div class="legend"><span>конверсія кроку — у розділі «Аналітика»</span></div></div>';

    var attentionCard = '<div class="card"><div class="card-head"><div><h2>Потребують уваги</h2><p>нові звернення без контакту</p></div><button class="link" data-goto="pipeline">Пайплайн →</button></div>' +
      (attention.length ? attention.map(function (l) {
        return '<div class="today-row"><span class="tag info" style="flex:none">' + KD.timeInStage(l) + '</span>' +
          '<div class="who" data-lead="' + esc(l.id) + '" style="cursor:pointer"><b>' + esc(l.name) + '</b><p>' + esc(l.id) + ' · ' + esc(sourceLabel(l.source)) + ' · ' + esc(l.nextAction) + '</p></div>' +
          '<div class="mini-actions"><button data-lead="' + esc(l.id) + '" title="Відкрити" aria-label="Відкрити">↗</button></div></div>';
      }).join('') : '<div class="empty">Усі звернення опрацьовані.</div>') + '</div>';

    var activityCard = '<div class="card"><div class="card-head"><div><h2>Журнал системи</h2><p>останні події демо-середовища</p></div></div>' +
      (logs.length ? '<ul class="activity">' + logs.map(function (l) {
        return '<li><span class="dot"></span><div class="txt"><p>' + esc(l.text) + '</p><time>' + relTime(l.at) + ' · ' + fmtShort(l.at) + '</time></div></li>';
      }).join('') + '</ul>' : '<div class="empty">Подій ще немає.</div>') + '</div>';

    return '<div class="page-head"><div><p class="eyebrow">Операційний огляд</p><h1>Добрий день, ' + esc(firstName(admin.name)) + '</h1>' +
      '<p>Сьогодні ' + fmtDate(today) + '. Демо-дані синхронізовані з сайтом клініки та презентацією KINETIA.</p></div>' +
      '<div class="head-actions"><button class="btn ghost" data-open="new-lead">+ Лід</button><button class="btn pri" data-open="new-appt">Записати пацієнта <span class="arw">→</span></button></div></div>' +
      kpis +
      '<div class="grid-2">' + todayCard + tasksCard + '</div>' +
      '<div class="grid-2" style="margin-top:14px">' + sourceCard + funnelCard + '</div>' +
      '<div class="grid-2" style="margin-top:14px">' + attentionCard + activityCard + '</div>';
  }

  function kpi(label, val, sub, ico, foot, raw) {
    return '<div class="kpi"><div class="k-label"><span>' + label + '</span><span class="ico">' + ico + '</span></div>' +
      '<div class="k-val">' + (raw ? val : esc(String(val))) + '</div>' +
      '<div class="k-sub">' + foot + '</div></div>';
  }
  function rangeLabel() { return S.range === 1 ? 'день' : S.range === 7 ? '7 днів' : '30 днів'; }
  function firstName(n) { return String(n || '').split(' ')[0]; }
  function serviceName(id) { var s = KD.serviceById(id); return s ? s.name : id; }
  function doctorName(id) { var d = KD.doctorById(id); return d ? d.name : id; }
  function sourceLabel(id) { var s = KD.sourceById(id); return s ? s.short : id; }
  function adminName(id) { var a = KD.adminById(id); return a ? a.name : id === 'manager' ? 'Керівниця клініки' : 'Адміністратор'; }

  /* ---------------- leads ---------------- */
  function filteredLeads() {
    var s = KD.read();
    return s.leads.filter(function (l) {
      if (S.leadStage && l.stage !== S.leadStage) return false;
      if (S.leadSource && l.source !== S.leadSource) return false;
      if (S.leadAdmin && l.adminId !== S.leadAdmin) return false;
      if (S.search) {
        var hay = [l.id, l.name, l.phone, l.email, l.city, l.campaign, sourceLabel(l.source)].join(' ').toLowerCase();
        if (hay.indexOf(S.search) < 0) return false;
      }
      return true;
    }).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; });
  }

  function viewLeads() {
    var list = filteredLeads();
    var stagesOpts = '<option value="">Усі етапи</option>' + KD.STAGES.map(function (s) {
      return '<option value="' + s.id + '"' + (S.leadStage === s.id ? ' selected' : '') + '>' + esc(s.label) + '</option>';
    }).join('');
    var srcOpts = '<option value="">Усі джерела</option>' + KD.SOURCES.map(function (s) {
      return '<option value="' + s.id + '"' + (S.leadSource === s.id ? ' selected' : '') + '>' + esc(s.label) + '</option>';
    }).join('');
    var admOpts = '<option value="">Усі адміністратори</option>' + KD.ADMINS.map(function (a) {
      return '<option value="' + a.id + '"' + (S.leadAdmin === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>';
    }).join('');

    var rows = list.map(function (l) {
      var src = KD.sourceById(l.source);
      return '<tr data-lead="' + esc(l.id) + '">' +
        '<td><span class="mono" style="color:var(--mut2)">' + esc(l.id) + '</span></td>' +
        '<td><div class="nm">' + esc(l.name) + '</div><div class="sub">' + esc(l.city || '—') + '</div></td>' +
        '<td><div class="mono" style="font-size:11px">' + esc(l.phone) + '</div><div class="sub">' + (l.consent && l.consent.marketing ? 'маркетинг: так' : 'маркетинг: ні') + '</div></td>' +
        '<td><div class="row-src">' + sourceDot(l.source) + '<span>' + esc(src ? src.label : l.source) + '</span></div><div class="sub">' + esc(l.campaign) + '</div></td>' +
        '<td>' + stageTag(l.stage) + '<div class="sub">' + esc(KD.timeInStage(l)) + ' на етапі</div></td>' +
        '<td><div class="sub" style="color:var(--fg)">' + esc(adminName(l.adminId)) + '</div><div class="sub">' + esc(l.nextAction || '—') + '</div></td>' +
        '<td><div class="mono" style="font-size:11px">' + fmtDate(l.createdAt) + '</div><div class="sub">' + relTime(l.createdAt) + '</div></td>' +
        '<td style="text-align:right"><button class="btn sm" data-lead="' + esc(l.id) + '">Відкрити</button></td>' +
        '</tr>';
    }).join('');

    return '<div class="page-head"><div><p class="eyebrow">Усі звернення</p><h1>Ліди</h1>' +
      '<p>Єдиний реєстр звернень із сайту клініки та каналів залучення. Джерело, UTM, адміністратор і поточний етап зберігаються разом.</p></div>' +
      '<div class="head-actions"><button class="btn ghost" id="exportLeads">Експорт CSV</button><button class="btn pri" data-open="new-lead">+ Новий лід</button></div></div>' +
      '<div class="filters">' +
      '<select id="fStage" aria-label="Фільтр за етапом">' + stagesOpts + '</select>' +
      '<select id="fSource" aria-label="Фільтр за джерелом">' + srcOpts + '</select>' +
      '<select id="fAdmin" aria-label="Фільтр за адміністратором">' + admOpts + '</select>' +
      '<button class="btn sm ghost" id="fClear">Очистити</button>' +
      '<span class="spacer"></span><span class="count">' + list.length + ' із ' + KD.read().leads.length + '</span></div>' +
      '<div class="table-wrap"><table><thead><tr>' +
      '<th>ID</th><th>Пацієнт</th><th>Контакт</th><th>Джерело</th><th>Етап</th><th>Відповідальний</th><th>Створено</th><th></th>' +
      '</tr></thead><tbody>' + (rows || '<tr><td colspan="8"><div class="empty">Немає лідів за цими фільтрами.</div></td></tr>') + '</tbody></table></div>';
  }

  function bindLeadFilters() {
    var fs = $('#fStage'), fo = $('#fSource'), fa = $('#fAdmin');
    if (fs) fs.addEventListener('change', function () { S.leadStage = fs.value; render(); });
    if (fo) fo.addEventListener('change', function () { S.leadSource = fo.value; render(); });
    if (fa) fa.addEventListener('change', function () { S.leadAdmin = fa.value; render(); });
    var cl = $('#fClear');
    if (cl) cl.addEventListener('click', function () {
      S.leadStage = S.leadSource = S.leadAdmin = ''; S.search = ''; $('#globalSearch').value = ''; render();
    });
    var ex = $('#exportLeads');
    if (ex) ex.addEventListener('click', exportLeads);
  }

  function exportLeads() {
    var list = filteredLeads();
    var rows = [['ID', 'Імʼя', 'Телефон', 'Email', 'Місто', 'Джерело', 'Кампанія', 'UTM', 'Landing', 'Етап', 'Адміністратор', 'Створено', 'Згода marketing']];
    list.forEach(function (l) {
      rows.push([l.id, l.name, l.phone, l.email, l.city, sourceLabel(l.source), l.campaign,
        'source=' + l.utm.source + ';medium=' + l.utm.medium + ';campaign=' + l.utm.campaign,
        l.landing, (KD.STAGE_MAP[l.stage] || {}).label || l.stage, adminName(l.adminId), l.createdAt,
        l.consent && l.consent.marketing ? 'так' : 'ні']);
    });
    var csv = rows.map(function (r) {
      return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\r\n');
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'smila-os-leads-demo.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Експорт демо-лідів сформовано (CSV).');
  }

  /* ---------------- patients ---------------- */
  function viewPatients() {
    var s = KD.read();
    var patientStages = ['visited', 'plan', 'decision', 'next', 'done', 'recall'];
    var list = s.leads.filter(function (l) {
      var hasAppt = s.appointments.some(function (a) { return a.leadId === l.id && a.status !== 'cancelled'; });
      var isPatient = patientStages.indexOf(l.stage) >= 0;
      if (!hasAppt && !isPatient) return false;
      if (S.search) {
        var hay = [l.id, l.name, l.phone, l.email, l.city].join(' ').toLowerCase();
        if (hay.indexOf(S.search) < 0) return false;
      }
      return true;
    }).sort(function (a, b) {
      var la = lastVisit(s, a.id), lb = lastVisit(s, b.id);
      return (lb || '') < (la || '') ? -1 : 1;
    });

    var rows = list.map(function (l) {
      var appts = s.appointments.filter(function (a) { return a.leadId === l.id; });
      var last = lastVisit(s, l.id), next = nextVisit(s, l.id);
      var consent = l.consent || {};
      return '<tr data-lead="' + esc(l.id) + '">' +
        '<td><div class="nm">' + esc(l.name) + '</div><div class="sub">' + esc(l.id) + ' · ' + esc(l.city) + '</div></td>' +
        '<td><div class="mono" style="font-size:11px">' + esc(l.phone) + '</div><div class="sub">' + esc(l.email || 'email не вказано') + '</div></td>' +
        '<td><div class="mono" style="font-size:11px">' + (last ? fmtDate(last) : '—') + '</div><div class="sub">останній візит</div></td>' +
        '<td><div class="mono" style="font-size:11px">' + (next ? fmtDate(next) : '—') + '</div><div class="sub">наступний візит</div></td>' +
        '<td><span class="tag mut">' + appts.length + ' запис(ів)</span></td>' +
        '<td>' + (consent.marketing ? '<span class="tag ok"><i class="dot"></i>маркетинг</span>' : '<span class="tag mut">лише сервіс</span>') + '</td>' +
        '<td>' + stageTag(l.stage) + '</td>' +
        '<td style="text-align:right"><button class="btn sm" data-lead="' + esc(l.id) + '">Картка</button></td></tr>';
    }).join('');

    return '<div class="page-head"><div><p class="eyebrow">Адміністративні записи</p><h1>Пацієнти</h1>' +
      '<p>Контактні та сервісні дані для роботи адміністратора. Клінічні записи, діагнози й документи тут не зберігаються — вони належать медичній системі клініки.</p></div>' +
      '<div class="head-actions"><button class="btn ghost" data-goto="analytics">Утримання →</button><button class="btn pri" data-open="new-appt">+ Запис</button></div></div>' +
      '<div class="filters"><span class="tag info">Лише адміністративні дані</span><span class="tag mut">без клінічної інформації</span>' +
      '<span class="spacer"></span><span class="count">' + list.length + ' пацієнтів у демо</span></div>' +
      '<div class="table-wrap"><table><thead><tr><th>Пацієнт</th><th>Контакт</th><th>Останній візит</th><th>Наступний</th><th>Записи</th><th>Згода</th><th>Етап</th><th></th></tr></thead>' +
      '<tbody>' + (rows || '<tr><td colspan="8"><div class="empty">Пацієнтів не знайдено.</div></td></tr>') + '</tbody></table></div>' +
      '<div class="retention-box" style="margin-top:14px"><b>Обмеження доступу</b>Клінічні дані (діагнози, знімки, плани лікування) зберігаються поза CRM у медичній системі. CRM фіксує лише адміністративний статус візиту та комунікаційні згоди.</div>';
  }

  function lastVisit(s, leadId) {
    var a = s.appointments.filter(function (x) { return x.leadId === leadId && x.status === 'completed' && x.date <= todayISO(); })
      .sort(function (x, y) { return x.date < y.date ? 1 : -1; })[0];
    return a ? a.date : null;
  }
  function nextVisit(s, leadId) {
    var a = s.appointments.filter(function (x) { return x.leadId === leadId && (x.status === 'confirmed' || x.status === 'request') && x.date >= todayISO(); })
      .sort(function (x, y) { return x.date > y.date ? 1 : -1; })[0];
    return a ? a.date : null;
  }

  /* ---------------- pipeline ---------------- */
  function viewPipeline() {
    var s = KD.read();
    var cols = KD.STAGES.map(function (st) {
      var items = s.leads.filter(function (l) { return l.stage === st.id; })
        .sort(function (a, b) { return a.stageSince < b.stageSince ? 1 : -1; });
      var cards = items.map(function (l) {
        var src = KD.sourceById(l.source);
        return '<article class="pipe-card" draggable="true" data-lead-id="' + esc(l.id) + '">' +
          '<div class="pc-top"><span class="pc-id">' + esc(l.id) + '</span><span class="pc-avatar">' + esc(initials(l.name)) + '</span></div>' +
          '<div class="pc-name">' + esc(l.name) + '</div>' +
          '<div class="pc-src">' + sourceDot(l.source) + '<span>' + esc(src ? src.short : l.source) + ' · ' + esc(serviceName(l.serviceId)) + '</span></div>' +
          '<div class="pc-foot"><span>' + esc(KD.timeInStage(l)) + '</span><span>' + esc(adminName(l.adminId).split(' ')[0]) + '</span></div>' +
          '</article>';
      }).join('');
      return '<div class="pipe-col" data-stage="' + st.id + '">' +
        '<div class="pipe-head"><b><i style="background:' + (st.tone === 'bad' ? 'var(--bad)' : st.tone === 'warn' ? 'var(--warn)' : st.tone === 'info' ? 'var(--info)' : 'var(--em3)') + '"></i>' + esc(st.label) + '</b><span class="n">' + items.length + '</span></div>' +
        '<div class="pipe-body">' + (cards || '<div class="pipe-empty">Перетягніть ліда сюди</div>') + '</div></div>';
    }).join('');

    return '<div class="page-head"><div><p class="eyebrow">12 етапів</p><h1>Пайплайн пацієнта</h1>' +
      '<p>Перетягніть картку між етапами. Кожен перехід фіксується в історії ліда з часом і відповідальним.</p></div>' +
      '<div class="head-actions"><button class="btn ghost" data-goto="leads">Список лідів</button><button class="btn pri" data-open="new-lead">+ Новий лід</button></div></div>' +
      '<div class="pipeline">' + cols + '</div>';
  }

  function bindPipeline() {
    var dragId = null;
    $$('.pipe-card').forEach(function (c) {
      c.addEventListener('dragstart', function (e) {
        dragId = c.getAttribute('data-lead-id');
        c.classList.add('dragging');
        try { e.dataTransfer.setData('text/plain', dragId); e.dataTransfer.effectAllowed = 'move'; } catch (err) {}
      });
      c.addEventListener('dragend', function () {
        c.classList.remove('dragging');
        $$('.pipe-col').forEach(function (x) { x.classList.remove('drop'); });
        dragId = null;
      });
      c.addEventListener('click', function () {
        if (dragId) return;
        openDrawer(c.getAttribute('data-lead-id'));
      });
    });
    $$('.pipe-col').forEach(function (col) {
      col.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        col.classList.add('drop');
      });
      col.addEventListener('dragleave', function (e) {
        if (!col.contains(e.relatedTarget)) col.classList.remove('drop');
      });
      col.addEventListener('drop', function (e) {
        e.preventDefault();
        col.classList.remove('drop');
        var id = dragId || e.dataTransfer.getData('text/plain');
        dragId = null;
        if (!id) return;
        var stage = col.getAttribute('data-stage');
        var l = lor(id);
        if (!l || l.stage === stage) return;
        KD.moveStage(id, stage, actor());
        toast(l.name + ' → ' + KD.STAGE_MAP[stage].label);
        render();
        if (S.drawer === id) openDrawer(id);
      });
    });
  }

  /* ---------------- calendar ---------------- */
  function viewCalendar() {
    var date = S.calDate;
    var label = S.calMode === 'day'
      ? fmtDate(date)
      : MONTHS[date.getMonth()] + ' ' + date.getFullYear();
    var toolbar = '<div class="cal-toolbar">' +
      '<button class="icon-btn" data-cal="prev" aria-label="Попередній">‹</button>' +
      '<button class="btn sm ghost" data-cal="today">Сьогодні</button>' +
      '<button class="icon-btn" data-cal="next" aria-label="Наступний">›</button>' +
      '<span class="month">' + label + '</span>' +
      '<div class="seg"><button data-calmode="month" class="' + (S.calMode === 'month' ? 'on' : '') + '">Місяць</button>' +
      '<button data-calmode="week" class="' + (S.calMode === 'week' ? 'on' : '') + '">Тиждень</button>' +
      '<button data-calmode="day" class="' + (S.calMode === 'day' ? 'on' : '') + '">День</button></div>' +
      '<span class="spacer" style="flex:1"></span><button class="btn pri" data-open="new-appt">+ Запис</button></div>';

    var body = S.calMode === 'month' ? calMonth(date) : S.calMode === 'week' ? calWeek(date) : calDay(date);

    var upcoming = KD.read().appointments.filter(function (a) {
      return a.date >= todayISO() && (a.status === 'request' || a.status === 'confirmed');
    }).sort(function (a, b) { return (a.date + a.time) > (b.date + b.time) ? 1 : -1; }).slice(0, 5);
    var nextCard = '<div class="card" style="margin-top:14px"><div class="card-head"><div><h2>Найближчі підтвердження</h2><p>записи, що очікують підтвердження або вже підтверджені</p></div></div>' +
      (upcoming.length ? upcoming.map(function (a) {
        var l = lor(a.leadId) || {};
        return '<div class="today-row"><span class="time-chip">' + fmtShort(a.date).slice(0, 5) + '</span>' +
          '<div class="who"><b>' + esc(l.name || a.leadId) + ' · ' + esc(a.time) + '</b><p>' + esc(serviceName(a.serviceId)) + ' · ' + esc(doctorName(a.doctorId)) + '</p></div>' +
          apptTag(a.status) + '<div class="mini-actions"><button data-appt="' + a.id + '" title="Деталі" aria-label="Деталі">↗</button></div></div>';
      }).join('') : '<div class="empty">Немає майбутніх записів.</div>') + '</div>';

    return '<div class="page-head"><div><p class="eyebrow">Розклад клініки</p><h1>Календар записів</h1>' +
      '<p>Заявки з сайту, підтверджені візити та історія. Статуси синхронізуються з пайплайном і пацієнтом.</p></div></div>' +
      toolbar + body + nextCard;
  }

  function eventsFor(dateISO) {
    return KD.read().appointments.filter(function (a) { return a.date === dateISO; })
      .sort(function (a, b) { return a.time < b.time ? -1 : 1; });
  }

  function calEventBtn(a) {
    var l = lor(a.leadId) || {};
    return '<button class="cal-ev" data-appt="' + a.id + '" data-st="' + a.status + '" title="' + esc((l.name || a.leadId) + ' · ' + a.time + ' · ' + serviceName(a.serviceId)) + '">' +
      '<b>' + esc(a.time) + '</b>' + esc(l.name || a.leadId) + '</button>';
  }

  function calMonth(date) {
    var first = new Date(date.getFullYear(), date.getMonth(), 1);
    var start = new Date(first);
    var dow = (first.getDay() + 6) % 7;
    start.setDate(1 - dow);
    var today = todayISO();
    var cells = DOW.map(function (d) { return '<div class="cal-dow">' + d + '</div>'; }).join('');
    for (var i = 0; i < 42; i++) {
      var d = new Date(start);
      d.setDate(start.getDate() + i);
      var iso = KD.isoDate(d);
      var evs = eventsFor(iso);
      var shown = evs.slice(0, 3).map(calEventBtn).join('');
      if (evs.length > 3) shown += '<span class="cal-more">+ ще ' + (evs.length - 3) + '</span>';
      cells += '<div class="cal-day' + (d.getMonth() !== date.getMonth() ? ' out' : '') + (iso === today ? ' today' : '') + '">' +
        '<div class="dnum"><span>' + d.getDate() + '</span></div>' + shown + '</div>';
    }
    return '<div class="cal-month">' + cells + '</div>';
  }

  function calWeek(date) {
    var d = new Date(date);
    var dow = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dow);
    var today = todayISO();
    var html = '';
    for (var i = 0; i < 7; i++) {
      var x = new Date(d);
      x.setDate(d.getDate() + i);
      var iso = KD.isoDate(x);
      var evs = eventsFor(iso);
      html += '<div class="wcol' + (iso === today ? ' today' : '') + '">' +
        '<div class="whead"><span>' + DOW[i] + '</span><b>' + x.getDate() + '</b></div>' +
        evs.map(calEventBtn).join('') +
        (evs.length ? '' : '<div class="cal-more" style="text-align:center;padding-top:14px">—</div>') + '</div>';
    }
    return '<div class="cal-week">' + html + '</div>';
  }

  function calDay(date) {
    var iso = KD.isoDate(date);
    var evs = eventsFor(iso);
    if (!evs.length) return '<div class="empty">На ' + fmtDate(iso) + ' записів немає. Додайте новий запис.</div>';
    return '<div class="cal-list">' + evs.map(function (a) {
      var l = lor(a.leadId) || {};
      return '<div class="cal-item" data-appt="' + a.id + '"><time>' + esc(a.time) + '</time>' +
        '<div><b>' + esc(l.name || a.leadId) + '</b><p>' + esc(serviceName(a.serviceId)) + ' · ' + esc(doctorName(a.doctorId)) + ' · ' + esc(l.phone || '') + '</p></div>' +
        apptTag(a.status) + '</div>';
    }).join('') + '</div>';
  }

  function bindCalendar() {
    $$('[data-cal]').forEach(function (b) {
      b.addEventListener('click', function () {
        var act = b.getAttribute('data-cal');
        var d = new Date(S.calDate);
        if (act === 'today') S.calDate = new Date();
        else {
          var step = S.calMode === 'day' ? 1 : S.calMode === 'week' ? 7 : 1;
          if (act === 'prev') {
            if (S.calMode === 'month') d.setMonth(d.getMonth() - 1); else d.setDate(d.getDate() - step);
            S.calDate = d;
          } else {
            if (S.calMode === 'month') d.setMonth(d.getMonth() + 1); else d.setDate(d.getDate() + step);
            S.calDate = d;
          }
        }
        render();
      });
    });
    $$('[data-calmode]').forEach(function (b) {
      b.addEventListener('click', function () { S.calMode = b.getAttribute('data-calmode'); render(); });
    });
  }

  /* ---------------- tasks ---------------- */
  function viewTasks() {
    var s = KD.read();
    var open = s.tasks.filter(function (t) { return t.status === 'open' && (!S.taskOwner || t.owner === S.taskOwner); })
      .sort(function (a, b) { return a.due < b.due ? -1 : 1; });
    var done = s.tasks.filter(function (t) { return t.status === 'done' && (!S.taskOwner || t.owner === S.taskOwner); })
      .sort(function (a, b) { return a.due > b.due ? -1 : 1; }).slice(0, 16);
    var today = todayISO();

    function taskEl(t, isDone) {
      var l = t.leadId ? lor(t.leadId) : null;
      var over = !isDone && t.due < today;
      return '<div class="task' + (isDone ? ' done' : '') + '">' +
        '<button class="chk" data-task="' + t.id + '" aria-label="' + (isDone ? 'Повернути в роботу' : 'Позначити виконаною') + '"></button>' +
        '<div class="t-body"' + (l ? ' data-lead="' + esc(l.id) + '" style="cursor:pointer"' : '') + '>' +
        '<b>' + esc(t.title) + '</b>' +
        '<p><span' + (over ? ' class="over"' : '') + '>до ' + fmtDate(t.due) + '</span>' +
        '<span>' + esc(l ? l.name : 'Без ліда') + '</span>' +
        '<span>' + esc(adminName(t.owner)) + '</span></p></div>' +
        '<span class="tag ' + (isDone ? 'mut' : over ? 'bad' : 'info') + '">' + (isDone ? 'виконано' : over ? 'прострочено' : 'у роботі') + '</span></div>';
    }

    var ownerOpts = '<option value="">Усі відповідальні</option>' + KD.ADMINS.map(function (a) {
      return '<option value="' + a.id + '"' + (S.taskOwner === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>';
    }).join('');

    return '<div class="page-head"><div><p class="eyebrow">Follow-up</p><h1>Задачі</h1>' +
      '<p>Черга дій адміністраторів: перший контакт, підтвердження, супровід після консультації, recall.</p></div>' +
      '<div class="head-actions"><select id="taskOwner" class="btn ghost" style="padding:9px 12px">' + ownerOpts + '</select>' +
      '<button class="btn pri" data-open="new-task">+ Задача</button></div></div>' +
      '<div class="task-board">' +
      '<div class="card"><div class="card-head"><div><h2>Відкриті <span class="pill warn" style="margin-left:4px">' + open.length + '</span></h2><p>сортовано за дедлайном</p></div></div>' +
      '<div class="task-list">' + (open.map(function (t) { return taskEl(t, false); }).join('') || '<div class="empty">Немає відкритих задач.</div>') + '</div></div>' +
      '<div class="card"><div class="card-head"><div><h2>Завершені</h2><p>останні 16 у демо</p></div></div>' +
      '<div class="task-list">' + (done.map(function (t) { return taskEl(t, true); }).join('') || '<div class="empty">Ще немає завершених задач.</div>') + '</div></div>' +
      '</div>';
  }

  /* ---------------- automations ---------------- */
  function viewAutomations() {
    var s = KD.read();
    var stMap = {};
    s.automationState.forEach(function (x) { stMap[x.id] = x; });
    var active = s.automationState.filter(function (x) { return x.enabled; }).length;
    var errors = s.automationState.filter(function (x) { return x.status === 'error'; }).length;
    var runs = s.automationState.reduce(function (n, x) { return n + x.runs; }, 0);

    var cards = KD.AUTOMATIONS.map(function (d) {
      var st = stMap[d.id] || { enabled: d.enabled, runs: 0, status: 'paused' };
      var badge = AUTO_STATUS[st.status] || AUTO_STATUS.paused;
      var off = !st.enabled;
      return '<article class="auto-card' + (st.status === 'error' ? ' err' : '') + (off ? ' off' : '') + '">' +
        '<div class="auto-top"><span class="auto-no">' + d.no + '</span><div class="auto-title"><b>' + esc(d.name) + '</b><p>' + esc(d.trigger) + '</p></div>' +
        '<button class="switch' + (st.enabled ? ' on' : '') + '" data-auto-toggle="' + d.id + '" role="switch" aria-checked="' + (st.enabled ? 'true' : 'false') + '" aria-label="Увімкнути автоматизацію ' + esc(d.name) + '"></button></div>' +
        '<div class="auto-line"></div>' +
        '<div class="auto-meta">' +
        '<div>Канал<b>' + esc(d.channel) + '</b></div>' +
        '<div>Статус<b><span class="tag ' + badge.tone + '"><i class="dot"></i>' + badge.label + '</span></b></div>' +
        '<div>Останній запуск<b>' + (st.lastRun ? relTime(st.lastRun) : '—') + '</b></div>' +
        '<div>Наступний<b>' + (st.nextRun && st.enabled ? fmtNext(st.nextRun) : '—') + '</b></div>' +
        '<div>Запусків<b>' + st.runs + '</b></div>' +
        '<div>SLA<b>' + (d.sla ? d.sla + ' хв' : 'подія') + '</b></div>' +
        '</div>' +
        (st.status === 'error' && st.lastError ? '<div class="auto-error">' + esc(st.lastError) + '</div>' : '') +
        '<div class="auto-actions"><button class="btn sm" data-auto-run="' + d.id + '">Симулювати</button>' +
        '<button class="btn sm ghost" data-auto-info="' + d.id + '">Деталі</button></div></article>';
    }).join('');

    var hist = s.automationHistory.slice(0, 12).map(function (h) {
      var d = KD.AUTOMATIONS.filter(function (x) { return x.id === h.automationId; })[0] || { name: h.automationId };
      return '<tr data-auto-hist="' + h.id + '"><td><span class="mono" style="color:var(--mut2)">' + esc(h.id) + '</span></td>' +
        '<td><div class="nm" style="font-size:11.5px">' + esc(d.name) + '</div><div class="sub">' + esc(h.text) + '</div></td>' +
        '<td><span class="mono" style="font-size:10.5px">' + esc(h.leadId || '—') + '</span></td>' +
        '<td>' + (h.ok ? '<span class="tag ok">успішно</span>' : '<span class="tag bad">помилка</span>') + '</td>' +
        '<td><span class="mono" style="font-size:10.5px">' + fmtStamp(h.at) + '</span></td></tr>';
    }).join('');

    return '<div class="page-head"><div><p class="eyebrow">Automation center</p><h1>Автоматизації супроводу</h1>' +
      '<p>10 сценаріїв реагують на події пайплайну. У демо повідомлення не надсилаються — фіксується лише симуляція, статус і історія.</p></div>' +
      '<div class="head-actions"><span class="tag ok"><i class="dot"></i>' + active + ' активні</span>' +
      '<span class="tag ' + (errors ? 'bad' : 'mut') + '"><i class="dot"></i>' + errors + ' з помилкою</span>' +
      '<span class="tag mut">' + runs + ' запусків</span></div></div>' +
      '<div class="auto-grid">' + cards + '</div>' +
      '<div class="card" style="margin-top:16px"><div class="card-head"><div><h2>Історія запусків</h2><p>останні 12 симуляцій · без реальних комунікацій</p></div></div>' +
      '<div class="table-wrap"><table style="min-width:680px"><thead><tr><th>Подія</th><th>Сценарій</th><th>Лід</th><th>Результат</th><th>Час</th></tr></thead><tbody>' +
      (hist || '<tr><td colspan="5"><div class="empty">Історія порожня.</div></td></tr>') + '</tbody></table></div></div>';
  }

  function autoInfo(id) {
    var def = KD.AUTOMATIONS.filter(function (a) { return a.id === id; })[0];
    if (!def) return;
    var s = KD.read();
    var st = s.automationState.filter(function (a) { return a.id === id; })[0] || {};
    var hist = s.automationHistory.filter(function (h) { return h.automationId === id; }).slice(0, 6);
    openModal('<div class="modal-head"><div><h2 id="modalTitle">' + def.no + ' · ' + esc(def.name) + '</h2>' +
      '<p>Тригер: ' + esc(def.trigger) + '</p></div><button class="icon-btn" data-close="1" aria-label="Закрити">✕</button></div>' +
      '<div class="d-sec"><h3>Дії сценарію</h3><ol class="hist">' + def.actions.map(function (a) {
        return '<li><b>' + esc(a) + '</b></li>';
      }).join('') + '</ol></div>' +
      '<div class="d-grid"><div class="d-item"><span>Канал</span><b>' + esc(def.channel) + '</b></div>' +
      '<div class="d-item"><span>Статус</span><b>' + esc((AUTO_STATUS[st.status] || {}).label || '—') + '</b></div>' +
      '<div class="d-item"><span>Запусків</span><b class="mono">' + (st.runs || 0) + '</b></div>' +
      '<div class="d-item"><span>SLA</span><b>' + (def.sla ? def.sla + ' хв' : 'за подією') + '</b></div></div>' +
      '<div class="d-sec" style="margin-top:16px"><h3>Останні події</h3>' +
      (hist.length ? hist.map(function (h) {
        return '<div class="note"><p>' + esc(h.text) + '</p><time>' + fmtStamp(h.at) + ' · ' + esc(h.leadId || 'система') + '</time></div>';
      }).join('') : '<div class="empty">Запусків ще не було.</div>') + '</div>' +
      '<div class="modal-actions"><button class="btn ghost" data-close="1">Закрити</button><button class="btn pri" data-auto-run="' + def.id + '">Симулювати запуск</button></div>');
  }

  /* ---------------- analytics ---------------- */
  function viewAnalytics() {
    var m = KD.metrics(S.range);
    var funnel = KD.funnel(S.range);
    var by = KD.bySource(S.range).sort(function (a, b) { return b.inquiries - a.inquiries; });
    var s = KD.read();
    var maxVisitors = Math.max.apply(null, by.map(function (x) { return x.visitors; }).concat([1]));
    var topBooked = by.slice().sort(function (a, b) { return b.booked - a.booked; })[0] || by[0];
    var sample = s.leads.slice().sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; })[0];
    var recall = KD.recallQueue().slice(0, 6);

    var channelRows = by.map(function (x) {
      return '<tr data-source="' + x.id + '"><td><div class="row-src"><i style="background:' + x.color + '"></i><div><div class="nm" style="font-size:11.5px">' + esc(x.label) + '</div><div class="sub">' + (x.spend ? 'бюджет ' + x.spend.toLocaleString('uk-UA') + ' ₴' : 'без медіабюджету') + '</div></div></div></td>' +
        '<td class="mono">' + x.visitors + '</td><td class="mono">' + x.inquiries + '</td><td class="mono">' + x.contacted + '</td>' +
        '<td class="mono">' + x.booked + '</td><td class="mono">' + x.confirmed + '</td><td class="mono">' + x.visits + '</td>' +
        '<td class="mono">' + (x.cpi ? x.cpi + ' ₴' : '—') + '</td><td class="mono">' + (x.cpVisit ? x.cpVisit + ' ₴' : '—') + '</td></tr>';
    }).join('');

    var attrTable = s.leads.slice().sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; }).slice(0, 8).map(function (l) {
      var src = KD.sourceById(l.source);
      return '<tr data-lead="' + esc(l.id) + '"><td class="mono" style="font-size:10.5px">' + esc(l.id) + '</td>' +
        '<td><div class="row-src"><i style="background:' + (src ? src.color : '#888') + '"></i><span>' + esc(src ? src.short : l.source) + '</span></div></td>' +
        '<td><span class="mono" style="font-size:10px">' + esc(l.utm.source) + ' / ' + esc(l.utm.medium) + '<br>' + esc(l.utm.campaign) + '</span></td>' +
        '<td><span class="mono" style="font-size:10px">' + esc(l.landing) + '</span></td>' +
        '<td>' + stageTag(l.stage) + '</td>' +
        '<td><span class="mono" style="font-size:10px">' + fmtStamp(l.createdAt) + '</span></td></tr>';
    }).join('');

    var funnelHtml = funnel.map(function (f, i) {
      var pct = funnel[0].value ? Math.round(f.value / funnel[0].value * 100) : 0;
      return '<div class="fn-row"><span class="lbl">' + esc(f.label) + '</span><span class="bar"><i style="width:' + Math.max(2, pct) + '%;opacity:' + (1 - i * .05) + '"></i></span>' +
        '<b>' + f.value + '</b><span class="rate">' + (i === 0 ? '—' : f.rate + '%') + '</span></div>';
    }).join('');

    return '<div class="page-head"><div><p class="eyebrow">Аналітика · ' + rangeLabel() + '</p><h1>Джерела, воронка, утримання</h1>' +
      '<p>Усі цифри — умовні демонстраційні дані. Вони показують структуру звітності, а не результати реальної клініки.</p></div>' +
      '<div class="head-actions"><span class="tag warn"><i class="dot"></i>демо-значення</span><button class="btn ghost" id="exportAttr">Експорт атрибуції</button></div></div>' +
      '<div class="kpis">' +
      kpi('Звернення', m.newInquiries, 'усі канали', '◧', '<b>' + m.contacted + '</b> контакт встановлено') +
      kpi('Заброньовано', m.booked, 'консультації', '▦', '<b>' + m.confirmed + '</b> підтверджено') +
      kpi('Show rate', m.showRate + '<small>%</small>', 'візити / (візити + неявки)', '◔', '<b>' + m.firstVisits + '</b> перших візитів', true) +
      kpi('Recall-черга', m.recallDue, 'потребують нагадування', '⟳', '<b>' + m.repeat + '</b> у повторному циклі') +
      '</div>' +
      '<div class="grid-2">' +
      '<div class="card"><div class="card-head"><div><h2>Воронка каналів</h2><p>відвідувачі → звернення → контакт → бронь → підтвердження → візит → повтор</p></div></div>' +
      '<div class="funnel">' + funnelHtml + '</div>' +
      '<div class="legend"><span><i style="background:var(--em3)"></i>значення кроку</span><span>праворуч — конверсія з попереднього кроку</span></div></div>' +
      '<div class="card"><div class="card-head"><div><h2>Джерело за бронюваннями</h2><p>демо-структура атрибуції</p></div></div>' +
      (topBooked ? '<div class="attr-card" style="margin-bottom:10px"><div class="a-lab">Лідер за бронюваннями</div><div class="a-val"><b>' + esc(topBooked.label) + '</b><br>' + topBooked.booked + ' броней · CPI ' + (topBooked.cpi || '—') + ' ₴ · CP visit ' + (topBooked.cpVisit || '—') + ' ₴</div></div>' : '') +
      '<div class="attr-card"><div class="a-lab">Приклад шляху ліда</div>' +
      (sample ? '<div class="a-val">' + esc(sample.name) + ' · <b>' + esc(sample.id) + '</b><br><span style="color:var(--mut)">' + esc(sample.campaign) + '</span></div>' +
        '<div class="attr-chain"><span class="on">' + esc(sourceLabel(sample.source)) + '</span><span>' + esc(sample.utm.medium) + '</span><span>' + esc(sample.utm.campaign) + '</span><span>' + esc(sample.landing) + '</span><span>' + fmtDate(sample.createdAt) + '</span><span>' + esc(adminName(sample.adminId)) + '</span><span class="on">' + esc((KD.STAGE_MAP[sample.stage] || {}).short || '') + '</span></div>' : '') +
      '</div>' +
      '<p class="small" style="margin-top:10px;color:var(--mut2);font-size:10.5px">Атрибуція: first touch / last touch / кампанія / група / креатив / UTM / landing / час / адміністратор / результат. PII не передається в рекламні системи.</p>' +
      '</div></div>' +
      '<div class="card" style="margin-top:14px"><div class="card-head"><div><h2>Канали залучення</h2><p>структура звіту · умовні дані · бюджет у демо-гривні</p></div></div>' +
      '<div class="table-wrap"><table style="min-width:920px"><thead><tr><th>Канал</th><th>Відвідувачі</th><th>Звернення</th><th>Контакт</th><th>Бронь</th><th>Підтверджено</th><th>Візити</th><th>CPI</th><th>CP visit</th></tr></thead><tbody>' + channelRows + '</tbody></table></div></div>' +
      '<div class="grid-2" style="margin-top:14px">' +
      '<div class="card"><div class="card-head"><div><h2>Атрибуція останніх звернень</h2><p>UTM, landing, етап, адміністратор</p></div><button class="link" data-goto="leads">Усі ліди →</button></div>' +
      '<div class="table-wrap"><table style="min-width:620px"><thead><tr><th>ID</th><th>Джерело</th><th>UTM</th><th>Landing</th><th>Етап</th><th>Час</th></tr></thead><tbody>' + attrTable + '</tbody></table></div></div>' +
      '<div class="card"><div class="card-head"><div><h2>Recall та згоди</h2><p>черга повторних візитів · комунікація лише за згодою</p></div></div>' +
      (recall.length ? recall.map(function (r) {
        return '<div class="today-row"><span class="tag ' + (r.daysSince >= 180 ? 'warn' : 'mut') + '" style="flex:none">' + (r.daysSince >= 900 ? '—' : r.daysSince + ' дн') + '</span>' +
          '<div class="who" data-lead="' + esc(r.lead.id) + '" style="cursor:pointer"><b>' + esc(r.lead.name) + '</b><p>' + esc(r.lead.id) + ' · останній візит ' + (r.lastVisit ? fmtDate(r.lastVisit) : '—') + '</p></div>' +
          (r.consent ? '<span class="tag ok">' + esc(r.channel) + '</span>' : '<span class="tag mut">без згоди</span>') + '</div>';
      }).join('') : '<div class="empty">Recall-черга порожня.</div>') +
      '</div></div>' +
      '<p class="small" style="margin-top:14px;color:var(--mut2);font-size:10.5px">Демо-дані не містять реальних пацієнтів, відгуків, рейтингів чи результатів клінік. Метрики не можна використовувати як обіцянку результату.</p>';
  }

  function exportAttr() {
    var by = KD.bySource(S.range);
    var rows = [['Channel', 'Visitors', 'Inquiries', 'Contacted', 'Booked', 'Confirmed', 'Visits', 'Spend', 'CPI', 'CP booking', 'CP visit']];
    by.forEach(function (x) {
      rows.push([x.label, x.visitors, x.inquiries, x.contacted, x.booked, x.confirmed, x.visits, x.spend, x.cpi, x.cpBooking, x.cpVisit]);
    });
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'smila-os-attribution-demo.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Демо-звіт атрибуції експортовано.');
  }

  /* ---------------- settings ---------------- */
  function viewSettings() {
    var s = KD.read();
    var consents = s.leads.filter(function (l) { return l.consent && l.consent.marketing; }).length;
    var total = s.leads.length || 1;
    var roles = [
      { name: 'Керівниця клініки', access: 'Повний доступ', scope: 'усі розділи, аналітика, налаштування, експорт' },
      { name: 'Адміністраторка', access: 'Операційний доступ', scope: 'ліди, пацієнти, календар, задачі, автоматизації' },
      { name: 'Координатор пацієнтів', access: 'Обмежений доступ', scope: 'ліди, задачі, календар; без налаштувань і експорту' },
      { name: 'Медичний персонал', access: 'Без доступу до CRM', scope: 'клінічні дані — в окремій медичній системі' }
    ];
    return '<div class="page-head"><div><p class="eyebrow">Конфігурація демо</p><h1>Налаштування</h1>' +
      '<p>Доступ, згоди, терміни зберігання та межі демонстраційного середовища.</p></div>' +
      '<div class="head-actions"><a class="btn ghost" href="/industries/dentistry/demo/privacy/">Політика приватності ↗</a></div></div>' +
      '<div class="settings-grid">' +
      '<div class="card"><div class="card-head"><div><h2>Клініка</h2><p>демонстраційний профіль</p></div></div>' +
      setRow('Назва', 'SMILA Dental Studio') +
      setRow('Формат', 'Приватна стоматологічна клініка · демо') +
      setRow('Локація', KD.CLINIC.address) +
      setRow('Телефон', KD.CLINIC.phone) +
      setRow('Графік', KD.CLINIC.hours.map(function (h) { return h.d + ': ' + h.t; }).join(' · ')) +
      '<div class="retention-box" style="margin-top:12px"><b>Демо-середовище</b>Усі контакти, імена, записи та метрики — умовні. Реальні пацієнти не використовуються.</div></div>' +

      '<div class="card"><div class="card-head"><div><h2>Доступ і ролі</h2><p>концепція дозволів у демо</p></div></div>' +
      roles.map(function (r) {
        return '<div class="set-row"><div><b>' + esc(r.name) + '</b><p>' + esc(r.scope) + '</p></div><span class="tag ' + (r.access === 'Повний доступ' ? 'ok' : r.access === 'Без доступу до CRM' ? 'mut' : 'info') + '">' + esc(r.access) + '</span></div>';
      }).join('') + '</div>' +

      '<div class="card"><div class="card-head"><div><h2>Адміністратори</h2><p>призначення лідів і задач</p></div></div>' +
      KD.ADMINS.map(function (a) {
        return '<div class="admin-row"><span class="avatar">' + a.initials + '</span><div><b>' + esc(a.name) + '</b><p>' + esc(a.role) + ' · доступ до операційних розділів</p></div><span class="tag ok">активна</span></div>';
      }).join('') +
      '<div class="admin-row"><span class="avatar">ІК</span><div><b>Ірина Коваль</b><p>Керівниця клініки · повний доступ</p></div><span class="tag ok">активна</span></div>' +
      '<p class="small" style="margin-top:10px;color:var(--mut2);font-size:10.5px">Додавання користувачів і реальне керування ролями — поза демо.</p></div>' +

      '<div class="card"><div class="card-head"><div><h2>Комунікаційні згоди</h2><p>окремо від запису на прийом</p></div></div>' +
      '<p class="small" style="margin-bottom:4px">Маркетингова згода: <b style="color:var(--mint)">' + consents + '</b> із ' + s.leads.length + ' демо-лідів</p>' +
      '<div class="consent-bar"><i style="width:' + Math.round(consents / total * 100) + '%;background:var(--em3)"></i><i style="width:' + (100 - Math.round(consents / total * 100)) + '%;background:rgba(244,247,245,.12)"></i></div>' +
      '<div class="legend"><span><i style="background:var(--em3)"></i>маркетинг дозволено</span><span><i style="background:rgba(244,247,245,.18)"></i>лише сервісні повідомлення</span></div>' +
      setRow('Згода на запис', 'Фіксується з часом у картці ліда') +
      setRow('Маркетингова згода', 'Окремий чекбокс · не впливає на запис') +
      setRow('Канал комунікації', 'Email / SMS / телефон · за вибором пацієнта') +
      setRow('Відкликання', 'Фіксується адміністратором у картці') + '</div>' +

      '<div class="card"><div class="card-head"><div><h2>Зберігання даних</h2><p>плейсхолдери політики, не юридична консультація</p></div></div>' +
      setRow('Термін зберігання адміністративних записів', s.retention.years + ' роки (демо)') +
      setRow('Анонімізація неактивних', 'через ' + s.retention.anonymizeAfter + ' міс (демо)') +
      setRow('Клінічні дані', 'Поза CRM · медична система клініки') +
      setRow('Аналітика', 'Без PII · лише агрегати та UTM') +
      '<div class="retention-box" style="margin-top:12px"><b>Важливо</b>Це демонстраційні налаштування. Перед реальним запуском потрібні юридична перевірка, DPIA та договори з підрядниками.</div></div>' +

      '<div class="card"><div class="card-head"><div><h2>Демо-дані</h2><p>синхронізація між трьома продуктами</p></div></div>' +
      setRow('Ключ сховища', 'kinetia_dentistry_demo_v1') +
      setRow('Лідів', String(s.leads.length)) +
      setRow('Записів', String(s.appointments.length)) +
      setRow('Задач', String(s.tasks.length)) +
      setRow('Подій автоматизацій', String(s.automationHistory.length)) +
      '<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn danger" id="settingsReset">Скинути всі демо-дані</button>' +
      '<a class="btn ghost" href="/industries/dentistry/presentation/">Переглянути презентацію ↗</a></div></div>' +
      '</div>';
  }

  function setRow(label, value) {
    return '<div class="set-row"><div><b>' + esc(label) + '</b></div><span class="set-val">' + esc(value) + '</span></div>';
  }

  /* ---------------- patient drawer ---------------- */
  function openDrawer(id) {
    var l = lor(id);
    if (!l) return;
    S.drawer = id;
    var s = KD.read();
    var src = KD.sourceById(l.source);
    var svc = KD.serviceById(l.serviceId);
    var doc = KD.doctorById(l.doctorId);
    var appts = s.appointments.filter(function (a) { return a.leadId === id; }).sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
    var tasks = s.tasks.filter(function (t) { return t.leadId === id; });
    var notes = l.notes || [];
    var hist = (l.history || []).slice().reverse();
    var stageOpts = KD.STAGES.map(function (st) {
      return '<option value="' + st.id + '"' + (l.stage === st.id ? ' selected' : '') + '>' + esc(st.label) + '</option>';
    }).join('');
    var lostOpts = KD.LOST_REASONS.map(function (r) {
      return '<option' + (l.lostReason === r ? ' selected' : '') + '>' + esc(r) + '</option>';
    }).join('');

    var future = appts.filter(function (a) { return a.date >= todayISO() && a.status !== 'cancelled' && a.status !== 'completed'; })[0];
    var latestAppt = future || appts[appts.length - 1];
    var older = appts.filter(function (a) { return latestAppt && a.id !== latestAppt.id; }).slice().reverse();
    var apptBlock = latestAppt ? (function () {
      return '<div class="d-item" style="margin-bottom:6px"><span>' + (future ? 'Найближчий запис' : 'Останній запис') + '</span>' +
        '<b>' + fmtDate(latestAppt.date) + ' · ' + esc(latestAppt.time) + ' · ' + esc(serviceName(latestAppt.serviceId)) + '</b>' +
        '<div style="margin-top:7px;display:flex;gap:5px;flex-wrap:wrap">' + apptTag(latestAppt.status) +
        (latestAppt.status === 'request' ? '<button class="btn sm" data-appt="' + latestAppt.id + '" data-set="confirmed">Підтвердити</button>' : '') +
        (latestAppt.status !== 'completed' && latestAppt.status !== 'cancelled' ? '<button class="btn sm ghost" data-appt="' + latestAppt.id + '" data-set="completed">Візит відбувся</button><button class="btn sm ghost" data-appt="' + latestAppt.id + '" data-set="no_show">Неявка</button>' : '') +
        '<button class="btn sm ghost" data-appt="' + latestAppt.id + '">Деталі</button></div></div>';
    })() : '<div class="empty" style="margin-bottom:6px">Записів ще немає.</div>';

    var html = '<div class="drawer-head"><div class="dh-main">' +
      '<p class="mono">' + esc(l.id) + ' · ' + esc(l.city) + '</p>' +
      '<h2>' + esc(l.name) + '</h2>' +
      '<div class="dh-sub">' + stageTag(l.stage) + '<span class="tag mut">' + esc(KD.timeInStage(l)) + ' на етапі</span>' +
      '<span class="tag ' + (l.consent && l.consent.marketing ? 'ok' : 'mut') + '">' + (l.consent && l.consent.marketing ? 'маркетинг: так' : 'маркетинг: ні') + '</span></div></div>' +
      '<button class="icon-btn" data-drawer-close aria-label="Закрити картку">✕</button></div>' +
      '<div class="drawer-body">' +

      '<div class="d-sec"><h3>Контакт</h3><div class="d-grid">' +
      '<div class="d-item"><span>Телефон</span><b class="mono">' + esc(l.phone || '—') + '</b></div>' +
      '<div class="d-item"><span>Email</span><b>' + esc(l.email || 'не вказано') + '</b></div>' +
      '<div class="d-item"><span>Місто</span><b>' + esc(l.city || '—') + '</b></div>' +
      '<div class="d-item"><span>Відповідальний</span><b>' + esc(adminName(l.adminId)) + '</b></div>' +
      '<div class="d-item"><span>Напрям</span><b>' + esc(svc ? svc.name : l.serviceId) + '</b></div>' +
      '<div class="d-item"><span>Лікар</span><b>' + esc(doc ? doc.name : l.doctorId) + '</b></div>' +
      '</div><div class="d-actions" style="margin-top:8px"><button class="btn sm ghost" data-edit="' + esc(l.id) + '">Редагувати контакт</button>' +
      '<button class="btn sm ghost" data-newappt-for="' + esc(l.id) + '">+ Запис</button>' +
      '<button class="btn sm ghost" data-newtask-for="' + esc(l.id) + '">+ Задача</button></div></div>' +

      '<div class="d-sec"><h3>Етап пайплайну</h3>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">' +
      '<select class="btn ghost" data-stage-select="' + esc(l.id) + '" style="padding:8px 10px;font-size:11.5px">' + stageOpts + '</select>' +
      (l.stage === 'lost' ? '<select class="btn ghost" data-lost-select="' + esc(l.id) + '" style="padding:8px 10px;font-size:11.5px">' + lostOpts + '</select>' : '') +
      '</div><div style="margin-top:6px;color:var(--mut2);font-size:10.5px">Зміна етапу фіксується в історії з часом і адміністратором.</div></div>' +

      '<div class="d-sec"><h3>Джерело та атрибуція</h3><div class="d-grid">' +
      '<div class="d-item"><span>Джерело</span><b>' + esc(src ? src.label : l.source) + '</b></div>' +
      '<div class="d-item"><span>Кампанія</span><b>' + esc(l.campaign) + '</b></div>' +
      '<div class="d-item"><span>Група / креатив</span><b>' + esc(l.adgroup || '—') + ' · ' + esc(l.creative || '—') + '</b></div>' +
      '<div class="d-item"><span>Landing</span><b class="mono" style="font-size:10px">' + esc(l.landing) + '</b></div>' +
      '<div class="d-item" style="grid-column:1/-1"><span>UTM</span><b class="mono" style="font-size:10px">utm_source=' + esc(l.utm.source) + '&utm_medium=' + esc(l.utm.medium) + '&utm_campaign=' + esc(l.utm.campaign) + '</b></div>' +
      '<div class="d-item"><span>Створено</span><b class="mono" style="font-size:10px">' + fmtStamp(l.createdAt) + '</b></div>' +
      '<div class="d-item"><span>Останній контакт</span><b class="mono" style="font-size:10px">' + fmtStamp(l.lastContact) + '</b></div>' +
      '</div><div class="consent-chips">' +
      '<span class="tag ' + (l.consent && l.consent.appointment ? 'ok' : 'mut') + '">запис: ' + (l.consent && l.consent.appointment ? 'так' : 'ні') + '</span>' +
      '<span class="tag ' + (l.consent && l.consent.marketing ? 'ok' : 'mut') + '">маркетинг: ' + (l.consent && l.consent.marketing ? 'так' : 'ні') + '</span>' +
      (l.consent && l.consent.at ? '<span class="tag mut">згода ' + fmtStamp(l.consent.at) + '</span>' : '') + '</div></div>' +

      '<div class="d-sec"><h3>Записи на прийом</h3>' + apptBlock +
      (older.length ? '<div style="margin-top:6px">' + older.slice(0, 3).map(function (a) {
        return '<div class="note"><p>' + fmtDate(a.date) + ' · ' + a.time + ' · ' + esc(serviceName(a.serviceId)) + '</p><time>' + (APP_STATUS[a.status] || {}).label + '</time></div>';
      }).join('') + '</div>' : '') + '</div>' +

      '<div class="d-sec"><h3>Задачі пацієнта</h3>' +
      (tasks.length ? tasks.map(function (t) {
        return '<div class="task' + (t.status === 'done' ? ' done' : '') + '" style="margin-bottom:6px"><button class="chk" data-task="' + t.id + '" aria-label="Перемкнути задачу"></button>' +
          '<div class="t-body"><b>' + esc(t.title) + '</b><p><span>' + fmtDate(t.due) + '</span><span>' + esc(adminName(t.owner)) + '</span></p></div></div>';
      }).join('') : '<div class="empty" style="margin-bottom:6px">Задач немає.</div>') +
      '<div class="task-form"><input id="drawerTask" placeholder="Нова задача для пацієнта…" aria-label="Нова задача"><button class="btn sm pri" data-addtask="' + esc(l.id) + '">Додати</button></div></div>' +

      '<div class="d-sec"><h3>Нотатки</h3>' +
      (notes.length ? notes.map(function (n) {
        return '<div class="note"><p>' + esc(n.text) + '</p><time>' + fmtStamp(n.at) + ' · ' + esc(n.by) + '</time></div>';
      }).join('') : '<div class="empty" style="margin-bottom:6px">Нотаток ще немає.</div>') +
      '<div class="note-form"><input id="drawerNote" placeholder="Додати адміністративну нотатку…" aria-label="Нова нотатка"><button class="btn sm pri" data-addnote="' + esc(l.id) + '">Додати</button></div>' +
      '<p style="color:var(--mut2);font-size:10px;margin-top:6px">Не вносьте клінічні дані: діагнози, результати обстежень і документи зберігаються поза CRM.</p></div>' +

      '<div class="d-sec"><h3>Історія етапів</h3><ul class="hist">' + hist.map(function (h) {
        var st = KD.STAGE_MAP[h.stage] || { label: h.stage };
        return '<li><b>' + esc(st.label) + '</b><span>' + fmtStamp(h.at) + ' · ' + esc(h.by) + '</span></li>';
      }).join('') + '</ul></div>' +

      '</div>' +
      '<div class="drawer-foot"><button class="btn ghost" data-drawer-close>Закрити</button>' +
      '<button class="btn ghost" data-goto="pipeline">Пайплайн</button>' +
      '<button class="btn pri" data-newappt-for="' + esc(l.id) + '">Створити запис</button></div>';

    var dr = $('#drawer');
    dr.innerHTML = html;
    dr.hidden = false;
    $('#scrim').hidden = false;
    document.body.style.overflow = 'hidden';
    var cb = dr.querySelector('[data-drawer-close]');
    if (cb) cb.focus();
    dr.onclick = onDrawerClick;
    dr.onchange = onDrawerChange;
  }

  function onDrawerChange(e) {
    var t = e.target;
    if (t.getAttribute('data-stage-select')) {
      var id = t.getAttribute('data-stage-select');
      KD.moveStage(id, t.value, actor());
      toast('Етап оновлено: ' + KD.STAGE_MAP[t.value].label);
      render(); openDrawer(id);
      return;
    }
    if (t.getAttribute('data-lost-select')) {
      var lid = t.getAttribute('data-lost-select');
      KD.updateLead(lid, { lostReason: t.value });
      toast('Причину втрати оновлено.');
    }
  }

  function closeDrawer() {
    S.drawer = null;
    var dr = $('#drawer');
    if (!dr) return;
    dr.hidden = true;
    dr.innerHTML = '';
    $('#scrim').hidden = true;
    if (!isModalOpen()) document.body.style.overflow = '';
  }

  function onDrawerClick(e) {
    var t = e.target.closest('button,select,[data-lead]');
    if (!t) return;
    if (t.hasAttribute('data-drawer-close')) { closeDrawer(); return; }
    if (t.getAttribute('data-goto')) { closeDrawer(); setView(t.getAttribute('data-goto')); return; }
    if (t.getAttribute('data-edit')) { openLeadEdit(t.getAttribute('data-edit')); return; }
    if (t.getAttribute('data-newappt-for')) { openApptModal(t.getAttribute('data-newappt-for')); return; }
    if (t.getAttribute('data-newtask-for')) { openTaskModal(t.getAttribute('data-newtask-for')); return; }
    if (t.getAttribute('data-addnote')) { addNoteFromDrawer(t.getAttribute('data-addnote')); return; }
    if (t.getAttribute('data-addtask')) { addTaskFromDrawer(t.getAttribute('data-addtask')); return; }
    if (t.getAttribute('data-appt')) { openApptModal(null, t.getAttribute('data-appt'), t.getAttribute('data-set')); return; }
    if (t.hasAttribute('data-task')) { KD.toggleTask(t.getAttribute('data-task')); render(); openDrawer(S.drawer); return; }
    if (t.hasAttribute('data-lead') && !t.classList.contains('btn')) {
      openDrawer(t.getAttribute('data-lead'));
    }
  }

  function addNoteFromDrawer(id) {
    var inp = $('#drawerNote');
    if (!inp || !inp.value.trim()) { toast('Введіть текст нотатки.', true); return; }
    KD.addNote(id, inp.value.trim(), actor());
    render(); openDrawer(id);
    toast('Нотатку додано.');
  }
  function addTaskFromDrawer(id) {
    var inp = $('#drawerTask');
    if (!inp || !inp.value.trim()) { toast('Введіть назву задачі.', true); return; }
    KD.addTask({ leadId: id, title: inp.value.trim(), type: 'call', owner: (lor(id) || {}).adminId });
    render(); openDrawer(id);
    toast('Задачу створено.');
  }

  /* ---------------- modals ---------------- */
  function isModalOpen() { return !$('#modalWrap').hidden; }
  function openModal(html) {
    $('#modal').innerHTML = html;
    $('#modalWrap').hidden = false;
    document.body.style.overflow = 'hidden';
    var f = $('#modal').querySelector('input,select,textarea,button');
    if (f) f.focus();
  }
  function closeModal() {
    $('#modalWrap').hidden = true;
    $('#modal').innerHTML = '';
    if (!S.drawer) document.body.style.overflow = '';
  }

  function openLeadModal() {
    var svc = KD.SERVICES.map(function (s) { return '<option value="' + s.id + '">' + esc(s.name) + '</option>'; }).join('');
    var src = KD.SOURCES.map(function (s) { return '<option value="' + s.id + '">' + esc(s.label) + '</option>'; }).join('');
    var adm = KD.ADMINS.map(function (a) { return '<option value="' + a.id + '"' + (admin.id === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('');
    openModal('<div class="modal-head"><div><h2 id="modalTitle">Новий лід</h2><p>Ручне створення звернення в демо-CRM</p></div><button class="icon-btn" data-close="1">✕</button></div>' +
      '<form id="leadForm" class="modal-grid">' +
      '<label class="field full"><span>Імʼя пацієнта</span><input name="name" required placeholder="Наприклад, Марія Коваль" autocomplete="off"></label>' +
      '<label class="field"><span>Телефон</span><input name="phone" required placeholder="+380 (44) 000-00-00" autocomplete="off"></label>' +
      '<label class="field"><span>Email (необовʼязково)</span><input name="email" type="email" placeholder="patient@example.com" autocomplete="off"></label>' +
      '<label class="field"><span>Місто</span><input name="city" value="Київ"></label>' +
      '<label class="field"><span>Напрям</span><select name="serviceId">' + svc + '</select></label>' +
      '<label class="field"><span>Джерело</span><select name="source">' + src + '</select></label>' +
      '<label class="field"><span>Відповідальний</span><select name="adminId">' + adm + '</select></label>' +
      '<label class="field full" style="display:flex;gap:8px;align-items:flex-start;padding:10px;border:1px solid var(--line);border-radius:8px"><input type="checkbox" name="marketing" style="width:auto;margin-top:3px"><span style="text-transform:none;letter-spacing:0;font-size:11.5px;color:var(--mut)">Окрема згода на маркетингову комунікацію. Не впливає на запис на прийом.</span></label>' +
      '</form>' +
      '<div class="modal-actions"><button class="btn ghost" data-close="1">Скасувати</button><button class="btn pri" id="leadSave">Створити лід</button></div>');

    $('#leadSave').addEventListener('click', function () {
      var f = $('#leadForm');
      if (!f.reportValidity()) return;
      var fd = new FormData(f);
      var lead = KD.addLead({
        name: String(fd.get('name') || '').trim(),
        phone: String(fd.get('phone') || '').trim(),
        email: String(fd.get('email') || '').trim(),
        city: String(fd.get('city') || 'Київ').trim(),
        source: fd.get('source'),
        serviceId: fd.get('serviceId'),
        adminId: fd.get('adminId'),
        campaign: 'Ручне звернення · CRM',
        adgroup: '—', creative: '—',
        landing: '/crm/manual/',
        utm: { source: 'crm', medium: 'manual', campaign: 'admin_created' },
        consent: { appointment: true, marketing: !!fd.get('marketing'), at: KD.isoStamp(new Date()) },
        notes: [{ at: KD.isoStamp(new Date()), by: actor(), text: 'Лід створений вручну в CRM.' }]
      });
      closeModal(); render();
      openDrawer(lead.id);
      toast('Лід ' + lead.id + ' створено.');
    });
  }

  function openLeadEdit(id) {
    var l = lor(id);
    if (!l) return;
    var svc = KD.SERVICES.map(function (s) { return '<option value="' + s.id + '"' + (l.serviceId === s.id ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('');
    var doc = KD.DOCTORS.map(function (d) { return '<option value="' + d.id + '"' + (l.doctorId === d.id ? ' selected' : '') + '>' + esc(d.name) + '</option>'; }).join('');
    var adm = KD.ADMINS.map(function (a) { return '<option value="' + a.id + '"' + (l.adminId === a.id ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('');
    openModal('<div class="modal-head"><div><h2 id="modalTitle">Редагувати ' + esc(l.id) + '</h2><p>Контактні та сервісні поля адміністративного запису</p></div><button class="icon-btn" data-close="1">✕</button></div>' +
      '<form id="editForm" class="modal-grid">' +
      '<label class="field full"><span>Імʼя</span><input name="name" value="' + esc(l.name) + '" required></label>' +
      '<label class="field"><span>Телефон</span><input name="phone" value="' + esc(l.phone) + '"></label>' +
      '<label class="field"><span>Email</span><input name="email" value="' + esc(l.email) + '" type="email"></label>' +
      '<label class="field"><span>Місто</span><input name="city" value="' + esc(l.city) + '"></label>' +
      '<label class="field"><span>Напрям</span><select name="serviceId">' + svc + '</select></label>' +
      '<label class="field"><span>Лікар</span><select name="doctorId">' + doc + '</select></label>' +
      '<label class="field"><span>Адміністратор</span><select name="adminId">' + adm + '</select></label>' +
      '<label class="field full" style="display:flex;gap:8px;align-items:flex-start;padding:10px;border:1px solid var(--line);border-radius:8px"><input type="checkbox" name="marketing"' + (l.consent && l.consent.marketing ? ' checked' : '') + ' style="width:auto;margin-top:3px"><span style="text-transform:none;letter-spacing:0;font-size:11.5px;color:var(--mut)">Маркетингова згода. Зміна фіксується в демо-даних.</span></label>' +
      '</form><div class="modal-actions"><button class="btn ghost" data-close="1">Скасувати</button><button class="btn pri" id="editSave">Зберегти</button></div>');
    $('#editSave').addEventListener('click', function () {
      var f = $('#editForm');
      if (!f.reportValidity()) return;
      var fd = new FormData(f);
      var consent = l.consent || { appointment: true, at: KD.isoStamp(new Date()) };
      consent.marketing = !!fd.get('marketing');
      consent.at = KD.isoStamp(new Date());
      KD.updateLead(id, {
        name: String(fd.get('name')).trim(), phone: String(fd.get('phone')).trim(),
        email: String(fd.get('email')).trim(), city: String(fd.get('city')).trim(),
        serviceId: fd.get('serviceId'), doctorId: fd.get('doctorId'), adminId: fd.get('adminId'),
        consent: consent
      });
      closeModal(); render(); openDrawer(id);
      toast('Контактні дані оновлено.');
    });
  }

  function openApptModal(leadId, apptId, setStatus) {
    if (apptId) {
      var s = KD.read();
      var a = s.appointments.filter(function (x) { return x.id === apptId; })[0];
      if (!a) return;
      if (setStatus) {
        KD.updateAppointment(apptId, { status: setStatus });
        toast('Запис ' + apptId + ': ' + (APP_STATUS[setStatus] || {}).label);
        render();
        if (S.drawer) openDrawer(S.drawer);
        return;
      }
      var l = lor(a.leadId) || {};
      openModal('<div class="modal-head"><div><h2 id="modalTitle">Запис ' + esc(a.id) + '</h2><p>' + fmtDate(a.date) + ' · ' + esc(a.time) + '</p></div><button class="icon-btn" data-close="1">✕</button></div>' +
        '<div class="detail-list">' +
        '<div class="dr"><span>Пацієнт</span><b>' + esc(l.name || a.leadId) + '</b></div>' +
        '<div class="dr"><span>Телефон</span><b class="mono">' + esc(l.phone || '—') + '</b></div>' +
        '<div class="dr"><span>Послуга</span><b>' + esc(serviceName(a.serviceId)) + '</b></div>' +
        '<div class="dr"><span>Лікар</span><b>' + esc(doctorName(a.doctorId)) + '</b></div>' +
        '<div class="dr"><span>Статус</span><b>' + apptTag(a.status) + '</b></div>' +
        '<div class="dr"><span>Створено</span><b class="mono" style="font-size:10.5px">' + fmtStamp(a.createdAt) + '</b></div>' +
        (a.note ? '<div class="dr"><span>Нотатка</span><b>' + esc(a.note) + '</b></div>' : '') +
        '</div>' +
        '<div class="d-actions" style="flex-wrap:wrap">' +
        (a.status === 'request' ? '<button class="btn sm pri" data-appt="' + a.id + '" data-set="confirmed">Підтвердити</button>' : '') +
        (a.status !== 'completed' && a.status !== 'cancelled' ? '<button class="btn sm ghost" data-appt="' + a.id + '" data-set="completed">Візит відбувся</button>' : '') +
        (a.status !== 'no_show' && a.status !== 'completed' ? '<button class="btn sm ghost" data-appt="' + a.id + '" data-set="no_show">Неявка</button>' : '') +
        (a.status !== 'cancelled' && a.status !== 'completed' ? '<button class="btn sm ghost" data-appt="' + a.id + '" data-set="cancelled">Скасувати</button>' : '') +
        '<button class="btn sm ghost" data-lead="' + esc(a.leadId) + '">Картка пацієнта</button></div>' +
        '<div class="modal-actions"><button class="btn ghost" data-close="1">Закрити</button></div>');
      return;
    }

    var s2 = KD.read();
    var leads = s2.leads.slice(0, 60).map(function (x) {
      return '<option value="' + x.id + '"' + (leadId === x.id ? ' selected' : '') + '>' + esc(x.name) + ' · ' + esc(x.id) + '</option>';
    }).join('');
    var svc = KD.SERVICES.map(function (x) { return '<option value="' + x.id + '">' + esc(x.name) + '</option>'; }).join('');
    var doc = KD.DOCTORS.map(function (x) { return '<option value="' + x.id + '">' + esc(x.name) + '</option>'; }).join('');
    var times = TIMES.map(function (t) { return '<option>' + t + '</option>'; }).join('');
    var defLead = leadId ? lor(leadId) : null;
    openModal('<div class="modal-head"><div><h2 id="modalTitle">Новий запис</h2><p>Створює запис і оновлює етап пацієнта в пайплайні</p></div><button class="icon-btn" data-close="1">✕</button></div>' +
      '<form id="apptForm" class="modal-grid">' +
      '<label class="field full"><span>Пацієнт</span><select name="leadId" required>' + leads + '</select></label>' +
      '<label class="field full"><span>Послуга</span><select name="serviceId">' + svc + '</select></label>' +
      '<label class="field"><span>Лікар</span><select name="doctorId">' + doc + '</select></label>' +
      '<label class="field"><span>Дата</span><input type="date" name="date" value="' + todayISO() + '" required></label>' +
      '<label class="field"><span>Час</span><select name="time">' + times + '</select></label>' +
      '<label class="field"><span>Статус</span><select name="status"><option value="request">Заявка</option><option value="confirmed">Підтверджено</option></select></label>' +
      '<label class="field full"><span>Нотатка</span><input name="note" placeholder="Необовʼязково · адміністративна нотатка"></label>' +
      '</form><div class="modal-actions"><button class="btn ghost" data-close="1">Скасувати</button><button class="btn pri" id="apptSave">Створити запис</button></div>');
    if (defLead) {
      var sel = $('#apptForm [name="leadId"]');
      if (sel) sel.value = defLead.id;
      var sn = $('#apptForm [name="serviceId"]');
      if (sn) sn.value = defLead.serviceId;
      var dn = $('#apptForm [name="doctorId"]');
      if (dn) dn.value = defLead.doctorId;
    }
    $('#apptSave').addEventListener('click', function () {
      var f = $('#apptForm');
      if (!f.reportValidity()) return;
      var fd = new FormData(f);
      if (!fd.get('leadId')) { toast('Оберіть пацієнта.', true); return; }
      var appt = KD.addAppointment({
        leadId: fd.get('leadId'), serviceId: fd.get('serviceId'),
        doctorId: fd.get('doctorId'), date: fd.get('date'), time: fd.get('time'),
        status: fd.get('status'), note: String(fd.get('note') || '')
      });
      closeModal(); render();
      if (S.drawer) openDrawer(S.drawer);
      toast('Запис ' + appt.id + ' створено на ' + fmtDate(appt.date) + ' ' + appt.time);
    });
  }

  function openTaskModal(leadId) {
    var s = KD.read();
    var leads = s.leads.slice(0, 60).map(function (x) {
      return '<option value="' + x.id + '"' + (leadId === x.id ? ' selected' : '') + '>' + esc(x.name) + ' · ' + esc(x.id) + '</option>';
    }).join('');
    var adm = KD.ADMINS.map(function (a) { return '<option value="' + a.id + '">' + esc(a.name) + '</option>'; }).join('');
    openModal('<div class="modal-head"><div><h2 id="modalTitle">Нова задача</h2><p>Follow-up дія для адміністратора</p></div><button class="icon-btn" data-close="1">✕</button></div>' +
      '<form id="taskForm" class="modal-grid">' +
      '<label class="field full"><span>Пацієнт</span><select name="leadId"><option value="">Без привʼязки</option>' + leads + '</select></label>' +
      '<label class="field full"><span>Назва задачі</span><input name="title" required placeholder="Наприклад, підтвердити візит"></label>' +
      '<label class="field"><span>Тип</span><select name="type"><option value="call">Дзвінок</option><option value="confirm">Підтвердження</option><option value="followup">Супровід</option><option value="recall">Recall</option></select></label>' +
      '<label class="field"><span>Дедлайн</span><input type="date" name="due" value="' + todayISO() + '"></label>' +
      '<label class="field full"><span>Відповідальний</span><select name="owner">' + adm + '</select></label>' +
      '</form><div class="modal-actions"><button class="btn ghost" data-close="1">Скасувати</button><button class="btn pri" id="taskSave">Створити задачу</button></div>');
    $('#taskSave').addEventListener('click', function () {
      var f = $('#taskForm');
      if (!f.reportValidity()) return;
      var fd = new FormData(f);
      KD.addTask({
        leadId: fd.get('leadId') || null,
        title: String(fd.get('title')).trim(),
        type: fd.get('type'), due: fd.get('due'), owner: fd.get('owner')
      });
      closeModal(); render();
      if (S.drawer) openDrawer(S.drawer);
      toast('Задачу створено.');
    });
  }

  /* ---------------- global clicks ---------------- */
  function onDocClick(e) {
    if (e.target.closest('#drawer')) return;

    var close = e.target.closest('[data-close]');
    if (close) { closeModal(); return; }

    var go = e.target.closest('[data-goto]');
    if (go) { setView(go.getAttribute('data-goto')); return; }

    var open = e.target.closest('[data-open]');
    if (open) {
      var kind = open.getAttribute('data-open');
      if (kind === 'new-lead') openLeadModal();
      if (kind === 'new-appt') openApptModal(null);
      if (kind === 'new-task') openTaskModal(null);
      return;
    }

    var task = e.target.closest('[data-task]');
    if (task) {
      e.preventDefault();
      KD.toggleTask(task.getAttribute('data-task'));
      render();
      if (S.drawer) openDrawer(S.drawer);
      return;
    }

    var appt = e.target.closest('[data-appt]');
    if (appt) {
      openApptModal(null, appt.getAttribute('data-appt'), appt.getAttribute('data-set'));
      return;
    }

    var lead = e.target.closest('[data-lead]');
    if (lead) {
      if (isModalOpen()) closeModal();
      openDrawer(lead.getAttribute('data-lead'));
      return;
    }

    var autoT = e.target.closest('[data-auto-toggle]');
    if (autoT) {
      KD.toggleAutomation(autoT.getAttribute('data-auto-toggle'));
      var def = KD.AUTOMATIONS.filter(function (a) { return a.id === autoT.getAttribute('data-auto-toggle'); })[0];
      var st = KD.read().automationState.filter(function (a) { return a.id === autoT.getAttribute('data-auto-toggle'); })[0];
      toast(def.name + ': ' + (st && st.enabled ? 'увімкнено' : 'вимкнено'));
      render();
      return;
    }

    var autoR = e.target.closest('[data-auto-run]');
    if (autoR) {
      var r = KD.runAutomation(autoR.getAttribute('data-auto-run'));
      if (!r) return;
      if (r.error) { toast(r.error, true); return; }
      toast(r.ok ? 'Симуляція успішна · ' + (r.lead || 'система') : 'Симуляційна помилка каналу', !r.ok);
      closeModal();
      render();
      return;
    }

    var autoI = e.target.closest('[data-auto-info]');
    if (autoI) { autoInfo(autoI.getAttribute('data-auto-info')); return; }
  }

  /* filters need binding after each render */
  var _render = render;
  render = function () {
    _render();
    if (S.view === 'leads') bindLeadFilters();
    if (S.view === 'calendar') bindCalendar();
    if (S.view === 'tasks') {
      var to = $('#taskOwner');
      if (to) to.addEventListener('change', function () { S.taskOwner = to.value; render(); });
    }
    if (S.view === 'settings') {
      var rs = $('#settingsReset');
      if (rs) rs.addEventListener('click', function () {
        if (!window.confirm('Скинути всі демо-дані до початкового стану?')) return;
        KD.reset(); render(); toast('Демо-дані скинуто.');
      });
    }
  };

  boot();
})();
