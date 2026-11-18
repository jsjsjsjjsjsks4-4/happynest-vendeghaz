/* =========================================================================
   HappyNest · site.js (sima script, nem ES-modul: file:// dupla kattra megy)
   Robusztus gerinc: a tartalom GSAP és Lenis nélkül is teljes (Motion Recipes 05).
   GSAP csak degradálható réteg; Lenis saját rAF-fal, nem gsap.tickerrel.
   ========================================================================= */
(function () {
  'use strict';
  var d = document, root = d.documentElement, body = d.body;

  /* ---- Mozgás-mód: reduced motion tisztelete, ?motion=1 bemutató-felülírás ---- */
  try {
    if (/[?&]motion=1/.test(location.search)) sessionStorage.setItem('hn-motion', '1');
    if (/[?&]motion=0/.test(location.search)) sessionStorage.removeItem('hn-motion');
  } catch (e) {}
  var forced = false;
  try { forced = sessionStorage.getItem('hn-motion') === '1'; } catch (e) {}
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches && !forced;
  if (!reduce) root.classList.add('motion-ok');

  var hasG = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (hasG) gsap.registerPlugin(ScrollTrigger);

  /* ---- Hero belépő (RB1): egy osztály billen, CSS hajtja ---- */
  var hero = d.querySelector('[data-hero]');
  function heroIn() { if (hero) hero.classList.add('is-in'); }
  if (reduce) heroIn();
  else {
    var heroImg = hero && hero.querySelector('img');
    var indul = function () { requestAnimationFrame(function () { setTimeout(heroIn, 60); }); };
    if (heroImg && !heroImg.complete) { heroImg.addEventListener('load', indul, { once: true }); setTimeout(heroIn, 1600); }
    else indul();
  }

  /* ---- Reveal: csak a hajtás alatti elemek indulnak rejtve (RB2) ---- */
  var pres = [];
  if (!reduce) {
    d.querySelectorAll('[data-reveal]').forEach(function (el) {
      if (el.getBoundingClientRect().top > innerHeight * 0.96) { el.classList.add('pre'); pres.push(el); }
    });
  }
  function reveal() {
    for (var i = pres.length - 1; i >= 0; i--) {
      var el = pres[i];
      if (el.getBoundingClientRect().top < innerHeight * 0.9) { el.classList.add('in'); pres.splice(i, 1); }
    }
  }
  addEventListener('scroll', reveal, { passive: true });
  addEventListener('resize', reveal, { passive: true });
  setTimeout(reveal, 300);
  function flushReveal() { pres.forEach(function (el) { el.classList.add('in'); }); pres = []; }
  setTimeout(function () { if (d.visibilityState === 'hidden') flushReveal(); }, 4000);
  d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'hidden') flushReveal(); });

  /* ---- Nav: tömör háttér a hero után, elrejtés lefelé görgetéskor (hiszterézis) ---- */
  var nav = d.getElementById('nav');
  var lastY = scrollY, acc = 0;
  function solidHatar() {
    if (hero) return hero.offsetHeight - (nav ? nav.offsetHeight : 80);
    return 24;
  }
  function navTick() {
    var y = scrollY, dy = y - lastY; lastY = y;
    if (nav) nav.classList.toggle('is-solid', y > solidHatar());
    if (body.classList.contains('menu-open') || body.classList.contains('lb-open')) return;
    if (y < 140) { body.classList.remove('nav-hidden'); acc = 0; return; }
    if ((dy > 0 && acc < 0) || (dy < 0 && acc > 0)) acc = 0;
    acc += dy;
    if (acc > 70) body.classList.add('nav-hidden');
    else if (acc < -40) body.classList.remove('nav-hidden');
  }
  addEventListener('scroll', navTick, { passive: true });
  navTick();

  /* ---- Lenis (helyesen: lenis.css + overflow-x:clip + saját rAF) ---- */
  var lenis = null;
  if (!reduce && typeof window.Lenis !== 'undefined') {
    try {
      lenis = new Lenis({ duration: 1.1, smoothWheel: true, syncTouch: false });
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
      lenis.on('scroll', function () { if (hasG) ScrollTrigger.update(); });
    } catch (e) { lenis = null; }
  }
  window.__lenis = lenis;
  function scrollToEl(t) {
    if (lenis) lenis.scrollTo(t);
    else t.scrollIntoView({ block: 'start' });
  }

  /* ---- Mobil menü: lenis.stop/start, Esc, fókusz vissza ---- */
  var tog = d.querySelector('.nav__toggle'), menu = d.getElementById('menu');
  function setMenu(open) {
    if (!tog || !menu) return;
    tog.setAttribute('aria-expanded', open ? 'true' : 'false');
    tog.querySelector('.nav__toggle-txt').textContent = open ? 'Bezár' : 'Menü';
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if ('inert' in menu) menu.inert = !open;
    body.classList.toggle('menu-open', open);
    if (lenis) { open ? lenis.stop() : lenis.start(); }
    root.style.overflow = open ? 'hidden' : '';
    if (open) { var f = menu.querySelector('a'); if (f) f.focus(); } else tog.focus();
  }
  if (tog && menu) {
    if ('inert' in menu) menu.inert = true;
    tog.addEventListener('click', function () { setMenu(tog.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false); });
  }

  /* ---- Horgony-linkek Lenisszel (a scroll-padding a navot levonja) ---- */
  d.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    var t = d.getElementById(a.getAttribute('href').slice(1));
    if (!t) return;
    if (lenis) { e.preventDefault(); lenis.scrollTo(t); history.replaceState(null, '', a.getAttribute('href')); }
  });
  // másik oldalról érkező horgony (#foglaltsag): betöltés után a helyére áll
  if (location.hash && d.getElementById(location.hash.slice(1))) {
    var hashEl = d.getElementById(location.hash.slice(1));
    addEventListener('load', function () { setTimeout(function () { if (lenis) lenis.scrollTo(hashEl, { immediate: true }); }, 50); });
  }

  /* =========================================================================
     SIGNATURE · Egy nap a fészekben (főoldal)
     A háttér görgetéshez kötve megy át nappaliból éjszakába és vissza.
     Szín-átúszás, nem mozgás: reduced-motion alatt is fut (MUSE-szabály).
     Egy driver: scroll -> rAF -> inline háttérszín. GSAP nélkül.
     ========================================================================= */
  var nap = d.querySelector('[data-egynap]');
  if (nap) {
    var fejek = [].slice.call(nap.querySelectorAll('.fej'));
    var VIL = [238, 240, 234], SOT = [21, 33, 27];
    var hatarok = [];
    var napAktiv = true;
    nap.classList.add('is-live');
    function meres() {
      hatarok = [];
      var y0 = scrollY;
      for (var i = 0; i < fejek.length - 1; i++) {
        var a = fejek[i].getAttribute('data-tonus'), b = fejek[i + 1].getAttribute('data-tonus');
        if (a !== b) hatarok.push({ y: fejek[i + 1].getBoundingClientRect().top + y0, a: a, b: b });
      }
    }
    function szin(t) { return t === 'sotet' ? SOT : VIL; }
    function sstep(x) { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); }
    var napRaf = 0;
    function napFrissit() {
      napRaf = 0;
      if (!napAktiv) return;
      var c = scrollY + innerHeight * 0.5, w = innerHeight * 0.2;
      var tonus = fejek[0].getAttribute('data-tonus');
      var szinRGB = szin(tonus);
      for (var i = 0; i < hatarok.length; i++) {
        var h = hatarok[i];
        if (c < h.y - w) break;
        var k = sstep((c - (h.y - w)) / (2 * w));
        var A = szin(h.a), B = szin(h.b);
        szinRGB = [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k];
      }
      var kk = 0, fgTonus = tonus;
      for (var j = 0; j < hatarok.length; j++) { var hh = hatarok[j]; if (c >= hh.y) fgTonus = hh.b; }
      nap.style.setProperty('--nap-bg', 'rgb(' + szinRGB.map(Math.round).join(',') + ')');
      nap.setAttribute('data-szoveg', fgTonus);
    }
    function napKer() { if (!napRaf) napRaf = requestAnimationFrame(napFrissit); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { napAktiv = es[0].isIntersecting; if (napAktiv) napKer(); }, { rootMargin: '100px 0px' }).observe(nap);
    }
    addEventListener('scroll', napKer, { passive: true });
    addEventListener('resize', function () { meres(); napKer(); });
    addEventListener('load', function () { meres(); napKer(); });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { meres(); napKer(); });
    meres(); napFrissit();
    setTimeout(function () { nap.classList.add('is-anim'); }, 400);

    // degradálható réteg: a fejezetek képei függönyként nyílnak (GSAP ScrollTrigger)
    if (hasG && !reduce) {
      fejek.forEach(function (f) {
        var k = f.querySelector('.fej__kep');
        if (k) gsap.fromTo(k, { clipPath: 'inset(12% 0% 12% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: f, start: 'top 85%', end: 'top 25%', scrub: 0.6, invalidateOnRefresh: true } });
      });
    }
  }

  /* ---- A ház: ragadós index aktív pontja ---- */
  var idx = d.querySelector('[data-terek-idx]');
  if (idx && 'IntersectionObserver' in window) {
    var linkek = [].slice.call(idx.querySelectorAll('a'));
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        linkek.forEach(function (a) { a.classList.toggle('is-aktiv', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    linkek.forEach(function (a) { var t = d.getElementById(a.getAttribute('href').slice(1)); if (t) io.observe(t); });
  }
  // vonalzó és hasonló, egyszer belépő elemek: ugyanaz a reveal-rendszer (data-reveal)

  /* =========================================================================
     GALÉRIA · szűrő (GSAP Flip, ha van) + nagyító (billentyű, húzás, Lenis stop)
     ========================================================================= */
  var gal = d.querySelector('[data-gal]');
  if (gal) {
    var elemek = [].slice.call(gal.querySelectorAll('.gal__elem'));
    var gombok = [].slice.call(d.querySelectorAll('[data-szuro]'));
    var db = d.querySelector('[data-gal-db]');
    var hasFlip = hasG && typeof window.Flip !== 'undefined';
    if (hasFlip) gsap.registerPlugin(Flip);
    function lathatok() { return elemek.filter(function (e) { return !e.hidden; }); }
    function szur(kat) {
      var state = hasFlip && !reduce ? Flip.getState(elemek) : null;
      elemek.forEach(function (e) { e.hidden = !(kat === 'mind' || (' ' + e.getAttribute('data-kat') + ' ').indexOf(' ' + kat + ' ') > -1); });
      gombok.forEach(function (g) { g.setAttribute('aria-pressed', g.getAttribute('data-szuro') === kat ? 'true' : 'false'); });
      if (db) db.textContent = lathatok().length + ' fotó';
      if (state) Flip.from(state, { duration: 0.6, ease: 'power3.inOut', absolute: true, onEnter: function (els) { return gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.4 }); }, onLeave: function (els) { return gsap.to(els, { opacity: 0, duration: 0.25 }); } });
      if (hasG) ScrollTrigger.refresh();
    }
    gombok.forEach(function (g) { g.addEventListener('click', function () {
      var k = g.getAttribute('data-szuro'); szur(k);
      try { history.replaceState(null, '', k === 'mind' ? location.pathname : '?szuro=' + k); } catch (e) {}
    }); });
    var kezdo = (location.search.match(/[?&]szuro=(\w+)/) || [])[1];
    if (kezdo && d.querySelector('[data-szuro="' + kezdo + '"]')) szur(kezdo);

    /* Hajtás-őr: ha alacsony ablakban a fejléc + első sor nem fér egy képernyőre, egyetlen kép teteje
       se lógjon be alulról: a fejléc tipográfiai borító lesz (100svh), a képek a hajtás alatt indulnak. */
    var galFej = d.querySelector('.gal-fej');
    function hajtasOr() {
      if (!galFej || elemek.some(function (e) { return e.hidden; })) return;
      galFej.classList.remove('is-borito');
      var h = window.innerHeight, y = window.pageYOffset || 0;
      var lo = elemek.some(function (e) { var r = e.getBoundingClientRect(); return r.top + y < h - 1 && r.bottom + y > h + 1; });
      if (lo) galFej.classList.add('is-borito');
    }
    hajtasOr();
    window.addEventListener('load', hajtasOr);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(hajtasOr);
    var hajtasKes = 0;
    window.addEventListener('resize', function () { cancelAnimationFrame(hajtasKes); hajtasKes = requestAnimationFrame(hajtasOr); });

    var lb = d.getElementById('nagyito');
    var lbImg = lb.querySelector('img'), lbSz = lb.querySelector('[data-lb-szaml]');
    var aktiv = 0, lista = [], visszaFokusz = null;
    function mutat(i) {
      aktiv = (i + lista.length) % lista.length;
      var forras = lista[aktiv].querySelector('img');
      var ss = (forras.getAttribute('srcset') || '').split(',');
      lbImg.src = ss.length ? ss[ss.length - 1].trim().split(' ')[0] : forras.currentSrc;
      lbImg.alt = forras.alt;
      lbImg.width = +forras.getAttribute('width'); lbImg.height = +forras.getAttribute('height');
      lbSz.textContent = (aktiv + 1) + ' / ' + lista.length;
    }
    function nyit(el) {
      lista = lathatok(); visszaFokusz = el.querySelector('button');
      mutat(lista.indexOf(el));
      lb.hidden = false;
      requestAnimationFrame(function () { lb.classList.add('is-open'); });
      body.classList.add('lb-open');
      if (lenis) lenis.stop();
      root.style.overflow = 'hidden';
      [].slice.call(d.body.children).forEach(function (c) { if (c !== lb && 'inert' in c) c.inert = true; });
      lb.querySelector('[data-lb-zar]').focus();
    }
    function zar() {
      lb.classList.remove('is-open');
      body.classList.remove('lb-open');
      [].slice.call(d.body.children).forEach(function (c) { if ('inert' in c) c.inert = false; });
      if (lenis) lenis.start();
      root.style.overflow = '';
      setTimeout(function () { lb.hidden = true; }, 360);
      if (visszaFokusz) visszaFokusz.focus();
    }
    elemek.forEach(function (el) { el.querySelector('button').addEventListener('click', function () { nyit(el); }); });
    lb.querySelector('[data-lb-zar]').addEventListener('click', zar);
    lb.querySelector('[data-lb-elozo]').addEventListener('click', function () { mutat(aktiv - 1); });
    lb.querySelector('[data-lb-kov]').addEventListener('click', function () { mutat(aktiv + 1); });
    d.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') zar();
      else if (e.key === 'ArrowRight') mutat(aktiv + 1);
      else if (e.key === 'ArrowLeft') mutat(aktiv - 1);
      else if (e.key === 'Tab') { // fókusz a nagyítón belül
        var f = [].slice.call(lb.querySelectorAll('button'));
        var i = f.indexOf(d.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    // húzás (swipe) érintésre és egérrel
    var sx = null, sy = null;
    var kepDoboz = lb.querySelector('.lb__kep');
    kepDoboz.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; });
    kepDoboz.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy; sx = sy = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) mutat(aktiv + (dx < 0 ? 1 : -1));
    });
    kepDoboz.addEventListener('pointercancel', function () { sx = sy = null; });
  }

  /* =========================================================================
     KAPCSOLAT · naptár-kijelölés -> űrlap előtöltése, Web3Forms küldés
     ========================================================================= */
  var form = d.getElementById('urlap');
  var naptarEl = d.querySelector('[data-hn-naptar]');
  if (form) {
    var erkI = form.querySelector('[name="erkezes"]'), tavI = form.querySelector('[name="tavozas"]');
    var ma = window.HNFoglaltsag ? window.HNFoglaltsag.ma() : new Date().toISOString().slice(0, 10);
    erkI.min = ma; tavI.min = ma;
    erkI.addEventListener('change', function () { if (erkI.value) tavI.min = erkI.value; });
    var gomb = d.querySelector('[data-cal-erdeklodes]');
    if (gomb && naptarEl) {
      gomb.addEventListener('click', function (e) {
        var k = naptarEl.hnKijeloles ? naptarEl.hnKijeloles() : {};
        if (k.erkezes) { erkI.value = k.erkezes; tavI.min = k.erkezes; }
        if (k.tavozas) tavI.value = k.tavozas;
        e.preventDefault();
        scrollToEl(d.getElementById('erdeklodes'));
        setTimeout(function () { form.querySelector('[name="nev"]').focus({ preventScroll: true }); }, lenis ? 900 : 50);
      });
    }

    var allapot = form.querySelector('[data-urlap-allapot]');
    var kuld = form.querySelector('[type="submit"]');
    function mezoHiba(input, uzenet) {
      var id = input.id + '-hiba';
      var h = d.getElementById(id);
      if (!uzenet) { input.removeAttribute('aria-invalid'); if (h) h.hidden = true; return; }
      input.setAttribute('aria-invalid', 'true');
      if (!h) { h = d.createElement('p'); h.className = 'mezo__hiba'; h.id = id; input.closest('.mezo, .jelolo').appendChild(h); }
      h.textContent = uzenet; h.hidden = false;
      var db2 = (input.getAttribute('aria-describedby') || '').split(' ');
      if (db2.indexOf(id) < 0) input.setAttribute('aria-describedby', (db2.join(' ') + ' ' + id).trim());
    }
    function ellenoriz() {
      var elso = null;
      function jelol(inp, ok, uz) { mezoHiba(inp, ok ? '' : uz); if (!ok && !elso) elso = inp; }
      var nev = form.nev, mail = form.email, hoz = form.hozzajarulas;
      jelol(nev, nev.value.trim().length > 1, 'Add meg a neved.');
      jelol(mail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim()), 'Adj meg egy érvényes e-mail-címet.');
      jelol(erkI, !!erkI.value, 'Válaszd ki az érkezés napját.');
      jelol(tavI, !!tavI.value && (!erkI.value || tavI.value > erkI.value), 'A távozás az érkezés utáni nap legyen.');
      jelol(hoz, hoz.checked, 'Az elküldéshez fogadd el az adatkezelést.');
      if (elso) elso.focus();
      return !elso;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      allapot.hidden = true;
      if (!ellenoriz()) return;
      var kulcs = form.access_key.value;
      if (!kulcs || kulcs === 'YOUR_ACCESS_KEY_HERE') {
        allapot.className = 'urlap__allapot is-hiba';
        allapot.textContent = 'Az űrlap még beállítás alatt áll, ezért most nem tudjuk elküldeni. Hívj a +36 20 372 6984 számon, vagy írj a happynest.vendeghaz@gmail.com címre.';
        allapot.hidden = false; allapot.focus();
        return;
      }
      kuld.disabled = true; kuld.textContent = 'Küldés…';
      var adat = new FormData(form);
      adat.set('subject', 'Érdeklődés a HappyNest weboldalról: ' + (erkI.value || '') + ' és ' + (tavI.value || '') + ' között');
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: adat, headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.success, j: j }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error('kuldes');
          allapot.className = 'urlap__allapot is-ok';
          allapot.textContent = 'Köszönjük, megkaptuk az üzeneted. Hamarosan válaszolunk a megadott e-mail-címre.';
          form.reset();
        })
        .catch(function () {
          allapot.className = 'urlap__allapot is-hiba';
          allapot.textContent = 'Az üzenet nem ment el. Próbáld újra, vagy hívj a +36 20 372 6984 számon.';
        })
        .then(function () { allapot.hidden = false; allapot.focus(); kuld.disabled = false; kuld.textContent = 'Érdeklődés elküldése'; });
    });
  }

  /* ---- ScrollTrigger frissítés csak görgetési szünetben (pin/scrub védelem) ---- */
  if (hasG) {
    var lastScrollT = 0, frissPend = 0, probak = 0;
    addEventListener('scroll', function () { lastScrollT = performance.now(); }, { passive: true });
    function queueRefresh() {
      if (frissPend) return;
      frissPend = setTimeout(function tick() {
        frissPend = 0;
        if (performance.now() - lastScrollT < 500 && probak++ < 40) { frissPend = setTimeout(tick, 300); return; }
        probak = 0; ScrollTrigger.refresh();
      }, 300);
    }
    addEventListener('load', queueRefresh);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(queueRefresh);
    setTimeout(queueRefresh, 2500);
  }
})();
