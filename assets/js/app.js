/* ============================================================
   HORECA HUB — app.js
   ============================================================ */
(function () {
  'use strict';

  var D        = window.HH_DATA || { categories: [], products: [] };
  var CATS     = D.categories;
  var PRODS    = D.products;
  var TG       = 'horecahubuz';
  var WA       = '998935928800';
  var IMG      = 'assets/img/products/';
  var $        = function (s, r) { return (r || document).querySelector(s); };
  var $$       = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* =========================================================
     I18N — интерфейс ru / uz / en.
     Названия и описания товаров остаются на русском.
     ========================================================= */
  var I18N  = window.HH_I18N || { t: {}, cats: {}, catsDesc: {} };
  var LANGS = ['ru', 'uz', 'en'];
  var LKEY  = 'hh_lang';

  function pickLang() {
    var q = (location.search.match(/[?&]lang=(\w+)/) || [])[1];
    if (q && LANGS.indexOf(q) > -1) return q;
    var saved;
    try { saved = localStorage.getItem(LKEY); } catch (e) {}
    if (saved && LANGS.indexOf(saved) > -1) return saved;
    var nav = (navigator.language || 'ru').slice(0, 2).toLowerCase();
    if (nav === 'uz') return 'uz';
    if (nav === 'en') return 'en';
    return 'ru';
  }
  var LANG = pickLang();

  function T(key) {
    var e = I18N.t[key];
    if (!e) return '';
    return e[LANG] || e.ru || '';
  }
  function catName(id) {
    var e = I18N.cats[id];
    if (e) return e[LANG] || e.ru;
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].name;
    return '';
  }
  function catDesc(id) {
    var e = I18N.catsDesc[id];
    if (e) return e[LANG] || e.ru;
    for (var i = 0; i < CATS.length; i++) if (CATS[i].id === id) return CATS[i].desc;
    return '';
  }

  function applyI18N() {
    document.documentElement.lang = LANG;
    $$('[data-i18n]').forEach(function (el) {
      var v = T(el.dataset.i18n); if (v) el.textContent = v;
    });
    $$('[data-i18n-html]').forEach(function (el) {
      var v = T(el.dataset.i18nHtml); if (v) el.innerHTML = v;
    });
    $$('[data-i18n-ph]').forEach(function (el) {
      var v = T(el.dataset.i18nPh); if (v) el.placeholder = v;
    });
    $$('[data-i18n-aria]').forEach(function (el) {
      var v = T(el.dataset.i18nAria); if (v) el.setAttribute('aria-label', v);
    });
    $$('[data-i18n-meta]').forEach(function (el) {
      var v = T(el.dataset.i18nMeta); if (v) el.setAttribute('content', v);
    });
    $$('.lang button').forEach(function (b) {
      b.classList.toggle('on', b.dataset.lang === LANG);
    });
  }

  function setLang(l) {
    if (LANGS.indexOf(l) < 0 || l === LANG) return;
    LANG = l;
    try { localStorage.setItem(LKEY, l); } catch (e) {}
    applyI18N();
    rerender();          // перерисовать карточки и корзину на новом языке
  }

  /* ---------- helpers ---------- */
  function money(n) { return new Intl.NumberFormat('ru-RU').format(n) + ' сўм'; }
  /* объём, не указанный в прайсе, показываем как «по запросу», а не прочерком */
  function volLabel(v) { return (!v || v === '—') ? T('vol.ask') : v; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* category → tile palette + icon */
  var THEME = {
    kitchen:    { c: ['#0F6B4F', '#07323F'], i: 'flame'  },
    dish:       { c: ['#0C5F6E', '#07293C'], i: 'drop'   },
    disinfect:  { c: ['#13596B', '#0A2A46'], i: 'shield' },
    hands:      { c: ['#116B5F', '#073440'], i: 'hand'   },
    rooms:      { c: ['#1C5F52', '#0A2E3A'], i: 'spray'  },
    toilet:     { c: ['#155E63', '#092C3E'], i: 'drop'   },
    paper:      { c: ['#2A5B63', '#0D2F3C'], i: 'roll'   },
    inventory:  { c: ['#275C54', '#0B2E38'], i: 'broom'  },
    dispensers: { c: ['#1E5E66', '#0A2D3E'], i: 'box'    },
    disposables:{ c: ['#2C5A5E', '#0D2D39'], i: 'box'    },
    laundry:    { c: ['#1A5C68', '#082B3F'], i: 'drop'   },
    coffee:     { c: ['#3A5540', '#102C2E'], i: 'cup'    }
  };
  var ICONS = {
    flame:  '<path d="M12 2.6c3.6 4 5.9 7 5.9 10a5.9 5.9 0 1 1-11.8 0c0-3 2.3-6 5.9-10Z"/>',
    drop:   '<path d="M12 2.6c3.6 4 5.9 7 5.9 10a5.9 5.9 0 1 1-11.8 0c0-3 2.3-6 5.9-10Z"/>',
    shield: '<path d="M12 2 4 6v6c0 5 3.4 9.4 8 10 4.6-.6 8-5 8-10V6l-8-4Z"/><path d="m9 12 2 2 4-4"/>',
    hand:   '<path d="M8 13V5a2 2 0 1 1 4 0v6M12 11V4a2 2 0 1 1 4 0v8M16 12V7a2 2 0 1 1 4 0v8a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6v-3a2 2 0 1 1 4 0"/>',
    spray:  '<path d="M9 3h5v4H9zM9 5H5M7 10h9v11H7zM18 3v4M21 5h-3"/>',
    roll:   '<path d="M8 3h11v18H8zM8 3a4 5 0 0 0 0 10 4 5 0 0 0 0-10ZM5 21h3"/>',
    broom:  '<path d="m16 3 5 5M19 6 9.5 15.5 4 20l4.5-5.5L18 5M5 13l-2 8 8-2"/>',
    box:    '<path d="M3 7h18v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1ZM3 7l2-4h14l2 4M12 3v4M9 12h6"/>',
    cup:    '<path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4ZM6 2v3M10 2v3M14 2v3"/>'
  };

  function mediaHTML(p) {
    if (p.img) {
      return '<img src="' + IMG + p.img + '" alt="' + esc(p.name) + '" loading="lazy" width="800" height="800">';
    }
    var t = THEME[p.cat] || THEME.rooms;
    return '<span class="tile" style="--t1:' + t.c[0] + ';--t2:' + t.c[1] + '">' +
      '<span class="tile-top">' +
        '<span class="tile-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICONS[t.i] + '</svg></span>' +
        (p.line ? '<span class="tile-line">' + esc(p.line) + '</span>' : '') +
      '</span>' +
      '<span>' +
        '<span class="tile-code">' + esc(p.code || p.name.slice(0, 14)) + '</span>' +
        '<span class="tile-brand">' + esc(p.brand || 'HORECA HUB') + '</span>' +
      '</span></span>';
  }

  function cardHTML(p) {
    var v = p.variants[0];
    return '<article class="prod rv" data-id="' + p.id + '">' +
      '<div class="prod-med" data-open="' + p.id + '" role="button" tabindex="0" aria-label="' + esc(p.name) + '">' +
        mediaHTML(p) +
        /* на плитке бренд уже подписан под кодом — бейдж только поверх фото */
        (p.brand && p.img ? '<span class="brand-tag">' + esc(p.brand) + '</span>' : '') +
      '</div>' +
      '<div class="prod-b">' +
        '<span class="prod-cat">' + esc(catName(p.cat)) + '</span>' +
        '<h3 class="prod-n" data-open="' + p.id + '" role="button" tabindex="0">' + esc(p.name) + '</h3>' +
        (p.variants.length > 1
          ? '<div class="prod-vars">' + p.variants.map(function (x, i) {
              return '<span class="vchip' + (i === 0 ? ' on' : '') + '" data-v="' + i + '">' + esc(volLabel(x.v)) + '</span>';
            }).join('') + '</div>'
          : (v.v && v.v !== '—' ? '<div class="prod-vars"><span class="vchip on" data-v="0">' + esc(v.v) + '</span></div>' : '')) +
        '<div class="prod-ft">' +
          '<span class="price" data-price>' + money(v.p) + '</span>' +
          '<button class="add" data-add="' + p.id + '" aria-label="Добавить в заявку">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>' +
          '</button>' +
        '</div>' +
      '</div></article>';
  }

  /* ---------- reveal on scroll ---------- */
  var io = 'IntersectionObserver' in window
    ? new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: .06 })
    : null;
  function reveal(root) {
    $$('.rv', root || document).forEach(function (el, i) {
      if (!io) { el.classList.add('in'); return; }
      if (el.classList.contains('in')) return;
      el.style.transitionDelay = Math.min(i % 8, 7) * 55 + 'ms';
      io.observe(el);
    });
  }

  /* ---------- toast ---------- */
  var toastT;
  function toast(msg) {
    var t = $('#toast'); if (!t) return;
    $('#toast-t').textContent = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  /* ---------- header / nav ---------- */
  var hdr = $('#hdr');
  if (hdr && !hdr.classList.contains('stuck')) {
    var onScroll = function () { hdr.classList.toggle('stuck', window.scrollY > 24); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }
  var burger = $('#burger'), drawer = $('#drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      burger.classList.toggle('x', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('a', drawer).forEach(function (a) {
      a.addEventListener('click', function () {
        drawer.classList.remove('open'); burger.classList.remove('x');
        burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
      });
    });
  }
  var yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- footer categories ---------- */
  var ftc = $('#ft-cats');
  function paintFooterCats() {
    if (!ftc) return;
    ftc.innerHTML = CATS.slice(0, 6).map(function (c) {
      return '<li><a href="catalog.html#c=' + c.id + '">' + esc(catName(c.id)) + '</a></li>';
    }).join('');
  }
  paintFooterCats();

  /* =========================================================
     HOME PAGE
     ========================================================= */
  var catsEl = $('#cats');
  var CICON = {
    kitchen: 'flame', dish: 'drop', disinfect: 'shield', hands: 'hand', rooms: 'spray',
    toilet: 'drop', paper: 'roll', inventory: 'broom', dispensers: 'box',
    disposables: 'box', laundry: 'drop', coffee: 'cup'
  };
  function paintCats() {
    if (!catsEl) return;
    catsEl.innerHTML = CATS.map(function (c) {
      var pic = null;
      for (var i = 0; i < PRODS.length; i++) if (PRODS[i].cat === c.id && PRODS[i].img) { pic = PRODS[i].img; break; }
      return '<a class="cat rv" href="catalog.html#c=' + c.id + '">' +
        '<span class="cat-n">' + c.count + '</span>' +
        '<span class="cat-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICONS[CICON[c.id] || 'drop'] + '</svg></span>' +
        '<h3>' + esc(catName(c.id)) + '</h3><p>' + esc(catDesc(c.id)) + '</p>' +
        (pic ? '<img class="cat-img" src="' + IMG + pic + '" alt="" loading="lazy">' : '') +
        '</a>';
    }).join('');
  }
  paintCats();

  var popEl = $('#popular');
  function paintPopular() {
    if (!popEl) return;
    var picks = ['K-206 Ultra', 'K-213', 'K-205', 'K-215'];
    var pop = [];
    picks.forEach(function (code) {
      for (var i = 0; i < PRODS.length; i++) if (PRODS[i].code === code) { pop.push(PRODS[i]); break; }
    });
    PRODS.forEach(function (p) {
      if (pop.length < 8 && p.img && pop.indexOf(p) < 0) pop.push(p);
    });
    popEl.innerHTML = pop.slice(0, 8).map(cardHTML).join('');
  }
  paintPopular();

  var marq = $('#marq');
  if (marq) {
    var brands = [];
    PRODS.forEach(function (p) { if (p.brand && brands.indexOf(p.brand) < 0) brands.push(p.brand); });
    var one = brands.map(function (b) { return '<span class="marq-i">' + esc(b) + '</span>'; }).join('');
    marq.innerHTML = one + one;
  }

  /* ---------- partners ---------- */
  var PAR = window.HH_PARTNERS || { venues: [], corporate: [] };
  function parHTML(x) {
    var inner = x.logo
      ? '<img src="assets/img/partners/' + esc(x.logo) + '" alt="' + esc(x.name) + '" loading="lazy">'
      : (x.mark ? '<img class="par-mk" src="assets/img/partners/' + esc(x.mark) + '" alt="" loading="lazy">' : '') +
        '<span class="par-wm">' + esc(x.name) + '</span>';
    return '<div class="par rv' + (x.logo ? '' : ' par-txt') + '" title="' + esc(x.note ? x.name + ' — ' + x.note : x.name) + '">' + inner + '</div>';
  }
  var pv = $('#parVenues'), pc = $('#parCorp');
  if (pv) pv.innerHTML = PAR.venues.map(parHTML).join('');
  if (pc) pc.innerHTML = PAR.corporate.map(parHTML).join('');

  /* hero counters */
  var counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, to = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || 0, 10);
        var t0 = null, dur = 1500, done = false;
        el.textContent = (0).toFixed(dec).replace('.', ',');
        var finish = function () {
          if (done) return;
          done = true;
          el.textContent = to.toFixed(dec).replace('.', ',');
        };
        requestAnimationFrame(function step(t) {
          if (done) return;
          if (!t0) t0 = t;
          var k = Math.min((t - t0) / dur, 1), e2 = 1 - Math.pow(1 - k, 3);
          if (k >= 1) { finish(); return; }
          el.textContent = (to * e2).toFixed(dec).replace('.', ',');
          requestAnimationFrame(step);
        });
        /* rAF is paused in background/unpainted tabs — guarantee the final value */
        setTimeout(finish, dur + 250);
      });
    }, { threshold: .4 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* order form → Telegram */
  var form = $('#orderForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = $('#f-name').value.trim(), ph = $('#f-phone').value.trim();
      if (!n || !ph) { toast(T('f.errName')); (!n ? $('#f-name') : $('#f-phone')).focus(); return; }
      var txt = T('ord.title') + '\n\n' + T('ord.name') + ': ' + n + '\n' + T('ord.phone') + ': ' + ph;
      var co = $('#f-company').value.trim(), m = $('#f-msg').value.trim();
      if (co) txt += '\n' + T('ord.company') + ': ' + co;
      if (m) txt += '\n\n' + T('ord.task') + ': ' + m;
      window.open('https://t.me/' + TG + '?text=' + encodeURIComponent(txt), '_blank', 'noopener');
      toast(T('f.sent'));
      form.reset();
    });
  }

  /* =========================================================
     CART (shared)
     ========================================================= */
  var KEY = 'hh_cart_v1';
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { cart = []; }

  function saveCart() {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {}
    paintCart();
  }
  function findProd(id) { for (var i = 0; i < PRODS.length; i++) if (PRODS[i].id === id) return PRODS[i]; return null; }
  function addToCart(id, vi) {
    var p = findProd(id); if (!p) return;
    var v = p.variants[vi] || p.variants[0];
    var key = id + '|' + (v.v || '');
    for (var i = 0; i < cart.length; i++) if (cart[i].k === key) { cart[i].q++; saveCart(); toast(T('cart.upd')); return; }
    cart.push({ k: key, id: id, vi: vi, q: 1 });
    saveCart();
    toast(T('cart.added'));
  }
  function cartTotal() {
    return cart.reduce(function (s, it) {
      var p = findProd(it.id); if (!p) return s;
      var v = p.variants[it.vi] || p.variants[0];
      return s + v.p * it.q;
    }, 0);
  }
  function orderText() {
    var t = T('ord.title') + '\n\n';
    cart.forEach(function (it, i) {
      var p = findProd(it.id); if (!p) return;
      var v = p.variants[it.vi] || p.variants[0];
      t += (i + 1) + '. ' + p.name + (p.code ? ' (' + p.code + ')' : '') +
        ' — ' + volLabel(v.v) + ' × ' + it.q + ' = ' + money(v.p * it.q) + '\n';
    });
    t += '\n' + T('ord.total') + ': ' + money(cartTotal()) + '\n\n' + T('ord.confirm');
    return t;
  }

  var fab = $('#cartFab'), cartB = $('#cartB'), cartF = $('#cartF');
  function paintCart() {
    var n = cart.reduce(function (s, i) { return s + i.q; }, 0);
    var badge = $('#cartN');
    if (badge) { badge.textContent = n; badge.hidden = n === 0; }
    if (fab) fab.classList.toggle('show', n > 0);
    if (!cartB) return;

    if (!cart.length) {
      cartB.innerHTML = '<div class="cart-empty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0"/></svg>' +
        '<h3 class="h-m">' + esc(T('cart.emptyH')) + '</h3><p style="margin-top:8px">' + esc(T('cart.emptyP')) + '</p></div>';
      if (cartF) cartF.hidden = true;
      return;
    }
    cartB.innerHTML = cart.map(function (it) {
      var p = findProd(it.id); if (!p) return '';
      var v = p.variants[it.vi] || p.variants[0];
      return '<div class="ci" data-k="' + esc(it.k) + '">' +
        '<div class="ci-m">' + mediaHTML(p) + '</div>' +
        '<div class="ci-b"><b>' + esc(p.name) + '</b>' +
          '<span>' + esc(volLabel(v.v)) + ' · ' + money(v.p) + '</span>' +
          '<div class="ci-ctl">' +
            '<button class="qb" data-q="-1" aria-label="−">−</button>' +
            '<span class="ci-q">' + it.q + '</span>' +
            '<button class="qb" data-q="1" aria-label="+">+</button>' +
            '<span class="ci-p">' + money(v.p * it.q) + '</span>' +
            '<button class="ci-x" data-del aria-label="×"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
          '</div></div></div>';
    }).join('');
    if (cartF) cartF.hidden = false;
    var sum = $('#cartSum'); if (sum) sum.textContent = money(cartTotal());
    var tg = $('#sendTg'), wa = $('#sendWa'), txt = encodeURIComponent(orderText());
    if (tg) tg.href = 'https://t.me/' + TG + '?text=' + txt;
    if (wa) wa.href = 'https://wa.me/' + WA + '?text=' + txt;
  }

  if (cartB) {
    cartB.addEventListener('click', function (e) {
      var row = e.target.closest('.ci'); if (!row) return;
      var k = row.dataset.k, idx = -1;
      for (var i = 0; i < cart.length; i++) if (cart[i].k === k) { idx = i; break; }
      if (idx < 0) return;
      if (e.target.closest('[data-del]')) { cart.splice(idx, 1); saveCart(); return; }
      var q = e.target.closest('[data-q]');
      if (q) {
        cart[idx].q += parseInt(q.dataset.q, 10);
        if (cart[idx].q < 1) cart.splice(idx, 1);
        saveCart();
      }
    });
  }

  var ov = $('#ov'), panel = $('#panel');
  function openPanel(o) {
    if (!panel) return;
    panel.classList.toggle('open', o);
    if (ov) ov.classList.toggle('open', o);
    panel.setAttribute('aria-hidden', o ? 'false' : 'true');
    document.body.style.overflow = o ? 'hidden' : '';
  }
  if (fab)       fab.addEventListener('click', function () { openPanel(true); });
  if ($('#panelX')) $('#panelX').addEventListener('click', function () { openPanel(false); });
  if (ov)        ov.addEventListener('click', function () { openPanel(false); closeModal(); });
  if ($('#clearCart')) $('#clearCart').addEventListener('click', function () {
    cart = []; saveCart(); toast(T('cart.cleared'));
  });

  /* =========================================================
     PRODUCT MODAL
     ========================================================= */
  var modal = $('#modal'), modalC = $('#modalC');
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    if (!panel || !panel.classList.contains('open')) document.body.style.overflow = '';
  }
  function openModal(id) {
    if (!modal) return;
    var p = findProd(id); if (!p) return;
    var vi = 0;
    modalC.innerHTML =
      '<div class="modal-m">' + mediaHTML(p) + '</div>' +
      '<div class="modal-b">' +
        '<div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start">' +
          '<span class="prod-cat">' + esc(catName(p.cat)) + (p.brand ? ' · ' + esc(p.brand) : '') + '</span>' +
          '<button class="x" id="mX" aria-label="Закрыть"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
        '</div>' +
        '<h3>' + esc(p.name) + (p.code ? ' <span class="muted">' + esc(p.code) + '</span>' : '') + '</h3>' +
        (p.desc ? '<p class="modal-d">' + esc(p.desc) + '</p>' : '') +
        (p.variants.length > 1 || (p.variants[0].v && p.variants[0].v !== '—')
          ? '<div class="modal-v">' + p.variants.map(function (x, i) {
              return '<span class="vchip' + (i === 0 ? ' on' : '') + '" data-mv="' + i + '">' + esc(volLabel(x.v)) + '</span>';
            }).join('') + '</div>' : '') +
        '<div class="modal-f">' +
          '<span class="price" id="mPrice" style="font-size:1.5rem">' + money(p.variants[0].p) + '</span>' +
          '<button class="btn btn-a" id="mAdd">' + esc(T('cart.add')) + '</button>' +
          '<a class="btn btn-o btn-s" href="tel:+998935928800">' + esc(T('btn.call')) + '</a>' +
        '</div></div>';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('#mX').addEventListener('click', closeModal);
    $$('[data-mv]', modalC).forEach(function (c) {
      c.addEventListener('click', function () {
        vi = parseInt(c.dataset.mv, 10);
        $$('[data-mv]', modalC).forEach(function (o) { o.classList.remove('on'); });
        c.classList.add('on');
        $('#mPrice').textContent = money(p.variants[vi].p);
      });
    });
    $('#mAdd').addEventListener('click', function () { addToCart(p.id, vi); closeModal(); });
  }
  if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeModal(); openPanel(false); }
  });

  /* delegated card interactions */
  document.addEventListener('click', function (e) {
    var add = e.target.closest('[data-add]');
    if (add) {
      var card = add.closest('.prod');
      var on = card ? card.querySelector('.vchip.on') : null;
      addToCart(add.dataset.add, on ? parseInt(on.dataset.v, 10) : 0);
      add.classList.add('done');
      setTimeout(function () { add.classList.remove('done'); }, 900);
      return;
    }
    var chip = e.target.closest('.vchip[data-v]');
    if (chip) {
      var c2 = chip.closest('.prod'); if (!c2) return;
      var p = findProd(c2.dataset.id); if (!p) return;
      $$('.vchip', c2).forEach(function (o) { o.classList.remove('on'); });
      chip.classList.add('on');
      c2.querySelector('[data-price]').textContent = money(p.variants[parseInt(chip.dataset.v, 10)].p);
      return;
    }
    var op = e.target.closest('[data-open]');
    if (op) openModal(op.dataset.open);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var op = e.target.closest && e.target.closest('[data-open]');
    if (op) { e.preventDefault(); openModal(op.dataset.open); }
  });

  /* =========================================================
     CATALOG PAGE
     ========================================================= */
  var grid = $('#grid');
  var state = { q: '', cat: 'all', sort: 'def' };
  var paintChips = function () {};
  var render = function () {};
  if (grid) {
    var chips = $('#chips');

    paintChips = function () {
      var cur = state.cat;
      chips.innerHTML = '<button class="chip' + (cur === 'all' ? ' on' : '') + '" data-c="all">' +
          esc(T('cp.all')) + '<b>' + PRODS.length + '</b></button>' +
        CATS.map(function (c) {
          return '<button class="chip' + (cur === c.id ? ' on' : '') + '" data-c="' + c.id + '">' +
            esc(catName(c.id)) + '<b>' + c.count + '</b></button>';
        }).join('');
    };
    paintChips();

    render = function () {
      var q = state.q.toLowerCase().trim();
      var list = PRODS.filter(function (p) {
        if (state.cat !== 'all' && p.cat !== state.cat) return false;
        if (!q) return true;
        return (p.name + ' ' + (p.code || '') + ' ' + (p.brand || '') + ' ' +
                (p.desc || '') + ' ' + catName(p.cat)).toLowerCase().indexOf(q) > -1;
      });
      if (state.sort === 'asc')  list = list.slice().sort(function (a, b) { return a.variants[0].p - b.variants[0].p; });
      if (state.sort === 'desc') list = list.slice().sort(function (a, b) { return b.variants[0].p - a.variants[0].p; });
      if (state.sort === 'az')   list = list.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });

      grid.innerHTML = list.map(cardHTML).join('');
      $('#empty').hidden = list.length > 0;
      $('#resN').textContent = list.length
        ? T('cp.found') + ' ' + list.length + (state.cat !== 'all' ? ' · ' + catName(state.cat) : '')
        : '';
      reveal(grid);
    };

    chips.addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (!b) return;
      $$('.chip', chips).forEach(function (o) { o.classList.remove('on'); });
      b.classList.add('on');
      state.cat = b.dataset.c;
      history.replaceState(null, '', state.cat === 'all' ? location.pathname + location.search : '#c=' + state.cat);
      render();
    });

    var qi = $('#q'), tmr;
    qi.addEventListener('input', function () {
      clearTimeout(tmr);
      tmr = setTimeout(function () { state.q = qi.value; render(); }, 180);
    });
    $('#sort').addEventListener('change', function (e) { state.sort = e.target.value; render(); });

    var h = (location.hash.match(/c=([a-z]+)/) || [])[1];
    if (h) {
      var btn = chips.querySelector('[data-c="' + h + '"]');
      if (btn) { $$('.chip', chips).forEach(function (o) { o.classList.remove('on'); }); btn.classList.add('on'); state.cat = h; }
    }
    render();
  }

  /* перерисовка всего, что строится из JS (вызывается при смене языка) */
  function rerender() {
    if (catsEl) paintCats();
    if (popEl)  paintPopular();
    if (ftc)    paintFooterCats();
    if (grid)   { paintChips(); render(); }
    paintCart();
    reveal();
  }

  $$('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.dataset.lang); });
  });

  applyI18N();
  paintCart();
  reveal();
  window.addEventListener('pageshow', function () { reveal(); });
})();
