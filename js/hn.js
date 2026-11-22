/* HappyNest v5 · fejléc, mobil menü, belépők, számláló, nyitókép-belépő és hóesés, Lenis + GSAP (lokális vendor, a load után).
   A tartalom nem függ a GSAP-tól: a belépő CSS + IntersectionObserver, a számláló és a hó rAF, a nyitókép címe CSS-ből
   emelkedik. A vendor (GSAP, ScrollTrigger, Lenis, a főoldalon SplitText) csak extra: simított görgetés, a nyitókép
   rétegeinek parallaxa, a szakaszcímek soronkénti felfedése és a képek lassú zoomja a keretükben.
   Mozgás nélkül (reduced-motion, ?motion=0): komponált végállapot, nincs hó, nincs Ken Burns, nincs vendor. */
(function () {
  'use strict';
  var d = document, de = d.documentElement;
  try {
    var q = new URLSearchParams(location.search).get('motion');
    if (q === '1' || q === '0') sessionStorage.setItem('hn-motion', q);
  } catch (e) {}
  var kenyszer = null; try { kenyszer = sessionStorage.getItem('hn-motion'); } catch (e) {}
  var csendes = kenyszer === '1' ? false : (kenyszer === '0' ? true : window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  de.classList.toggle('hn-csendes', csendes);
  var lenis = null;
  var mobil = function () { return window.innerWidth <= 760; };

  /* fejléc állapot (vonal nincs, az osztály a tesztekhez marad) */
  var fej = d.querySelector('[data-fej]');
  function fejAllapot() { if (fej) fej.classList.toggle('is-gorgetve', window.scrollY > 8); }
  window.addEventListener('scroll', fejAllapot, { passive: true }); fejAllapot();

  /* mobil menü (≤ 760 px) */
  var menu = d.querySelector('[data-menu]'), nyit = d.querySelector('[data-menu-nyit]'), zar = d.querySelector('[data-menu-zar]');
  function menuNyit() {
    menu.hidden = false; nyit.setAttribute('aria-expanded', 'true');
    if (lenis) lenis.stop(); de.style.overflow = 'hidden';
    setTimeout(function () { zar.focus(); }, 30);
  }
  function menuZar(fokusz) {
    menu.hidden = true; nyit.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start(); de.style.overflow = '';
    if (fokusz !== false) nyit.focus();
  }
  if (menu && nyit && zar) {
    nyit.addEventListener('click', menuNyit);
    zar.addEventListener('click', function () { menuZar(); });
    d.addEventListener('keydown', function (e) {
      if (menu.hidden) return;
      if (e.key === 'Escape') { menuZar(); return; }
      if (e.key === 'Tab') {
        var f = menu.querySelectorAll('a,button'), elso = f[0], utolso = f[f.length - 1];
        if (e.shiftKey && d.activeElement === elso) { e.preventDefault(); utolso.focus(); }
        else if (!e.shiftKey && d.activeElement === utolso) { e.preventDefault(); elso.focus(); }
      }
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) menuZar(false); });
    window.addEventListener('resize', function () { if (!menu.hidden && window.innerWidth > 760) menuZar(false); });
  }

  /* számláló: a tényszámok rövid felfutása (0,9 s, a tizedes vesszős értéké 1,2 s); reduced-motion alatt a végérték marad */
  function szamlal(el) {
    if (el.getAttribute('data-szam-kesz')) return;
    el.setAttribute('data-szam-kesz', '1');
    var szoveg = el.textContent.trim(), tized = szoveg.indexOf(',') > -1;
    var cel = parseFloat(szoveg.replace(',', '.'));
    if (!cel || csendes) return;
    el.style.minWidth = el.getBoundingClientRect().width + 'px';
    var t0 = performance.now(), ido = tized ? 1200 : 900;
    (function lep(t) {
      var p = Math.min(1, Math.max(0, (t - t0) / ido)), e = 1 - Math.pow(1 - p, 3), v = cel * e;
      el.textContent = tized ? v.toFixed(1).replace('.', ',') : String(Math.round(v));
      if (p < 1) requestAnimationFrame(lep); else { el.textContent = szoveg; el.style.minWidth = ''; }
    })(t0);
  }

  /* belépő: IntersectionObserver, egyszer; a lépcsős csoport gyerekei sorszámot kapnak */
  var rev = d.querySelectorAll('[data-r]');
  function be(el) {
    if (el.classList.contains('is-be')) return;
    if (el.getAttribute('data-r') === 'lepcso') {
      for (var i = 0; i < el.children.length; i++) el.children[i].style.setProperty('--i', i);
    }
    el.classList.add('is-be');
    var sz = el.querySelectorAll('[data-szam]');
    for (var k = 0; k < sz.length; k++) szamlal(sz[k]);
  }
  function mind() { for (var i = 0; i < rev.length; i++) be(rev[i]); }
  if (csendes || !('IntersectionObserver' in window)) mind();
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { be(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    for (var j = 0; j < rev.length; j++) io.observe(rev[j]);
    setTimeout(mind, 3500);  /* biztonsági háló: semmi nem marad rejtve */
  }

  /* hóesés: kevés, lassú pehely a fenyők előtt (a canvas maszkja a talaj felé elhalványítja).
     2026-11-20: ritkábban és kisebb súllyal (asztalon 30, mobilon 10 pehely, kisebb és halványabb), mert a nyitókép
     már nem csak a hóra épül (pára, nyitó koreográfia). Csak akkor fut, ha a nyitókép látszik és a lap nincs háttérben. */
  function ho(c) {
    if (!c || !c.getContext) return;
    var ctx = c.getContext('2d'), w = 0, h = 0, dpr = 1, pk = [], fut = false, lathato = true, elozo = 0, raf = 0;
    function uj(barhol) {
      var r = 0.8 + Math.random() * 1.3;
      return { x: Math.random() * w, y: barhol ? Math.random() * h * 0.9 : -6, r: r,
        v: 10 + r * 7 + Math.random() * 6, a: 0.45 + Math.random() * 0.35, f: Math.random() * 6.28, s: 0.3 + Math.random() * 0.5 };
    }
    function meret() {
      dpr = Math.min(mobil() ? 1 : 1.5, window.devicePixelRatio || 1);  /* a pehely kicsi és lágy: mobilon 1x, asztalon legfeljebb 1,5x raszter (4x CPU-lassítással mérve, cpu-ab.py) */
      w = c.clientWidth; h = c.clientHeight;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = mobil() ? 10 : 30;
      pk.length = Math.min(pk.length, n);
      while (pk.length < n) pk.push(uj(true));
    }
    function rajz(t) {
      /* 2026-11-20: a hó kb. 30 képkocka/s-mal rajzol (lassú pelyhek, szemre azonos), így a canvas-feltöltés költsége
         feleződik; a pára és a görgetés mellett 1920 px-en és 4x CPU-lassítással is a 16,7 ms-os keretben marad */
      if (t - elozo < 30) { raf = requestAnimationFrame(rajz); return; }
      var dt = Math.min(0.08, Math.max(0, (t - elozo) / 1000)); elozo = t;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#FFFFFF';
      for (var i = 0; i < pk.length; i++) {
        var p = pk[i];
        p.y += p.v * dt; p.f += p.s * dt; p.x += Math.sin(p.f) * 9 * dt;
        if (p.y > h) { pk[i] = uj(false); continue; }  /* a canvas a kép felső 62 %-a (fooldal.css), alján a maszk már átlátszó */
        ctx.globalAlpha = p.a;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
      raf = requestAnimationFrame(rajz);
    }
    function allit() {
      var kell = lathato && !d.hidden;
      if (kell && !fut) { fut = true; elozo = performance.now(); raf = requestAnimationFrame(rajz); }
      else if (!kell && fut) { fut = false; cancelAnimationFrame(raf); }
    }
    meret();
    if (window.ResizeObserver) new ResizeObserver(meret).observe(c); else window.addEventListener('resize', meret);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { lathato = es[0].isIntersecting; allit(); }).observe(c);
    d.addEventListener('visibilitychange', allit);
    allit();
  }

  /* nyitókép-belépő: amint a fotó megvan (vagy legkésőbb 1,2 s múlva) a cím sorai felemelkednek, a kép lassan hátrébb lép */
  var hero = d.querySelector('[data-hero]');
  if (hero) {
    var hImg = hero.querySelector('img');
    /* a kiinduló állapot legyen kiszámolva, mielőtt az osztály megjön (különben gyorsítótárból a nyitány átugrik) */
    var indit = function () { void hero.offsetWidth; hero.classList.add('is-be'); };
    if (csendes || !hImg || hImg.complete) requestAnimationFrame(function () { requestAnimationFrame(indit); });
    else {
      hImg.addEventListener('load', indit, { once: true });
      hImg.addEventListener('error', indit, { once: true });
      setTimeout(indit, 1200);
    }
    /* mobilon, ha az oldal ad CSS-hót (data-ho-css, kompozitorban fut), a canvas nem indul: 4x CPU-lassítással a
       canvas rajzolása vitte ki a képkockákat a keretből (2026-11-20, cpu-ab.py) */
    var cssHo = hero.querySelector('[data-ho-css]');
    if (!csendes && !(cssHo && mobil())) ho(hero.querySelector('[data-ho]'));
    else if (cssHo && !csendes) de.classList.add('hn-css-ho');
  }

  /* horgony-linkek Lenis alatt is a fejléc alá érkeznek */
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || !lenis || a.hasAttribute('data-cal-erdeklodes') || a.classList.contains('ugro')) return;
    var cel = d.getElementById(a.getAttribute('href').slice(1));
    if (!cel) return;
    e.preventDefault();
    lenis.scrollTo(cel, { offset: -(fej ? fej.offsetHeight : 0) - 8 });
  });

  /* nyitókép mélysége görgetésre: a kép rétege lassabban halad, mint a lap és a rajta ülő szöveg (egy scrub, egy elem) */
  function melyseg(gsap) {
    if (!hero) return;
    var reteg = hero.querySelector('[data-hero-reteg]');
    if (!reteg) return;  /* 2026-11-22: a főoldali betű-ablak nyitóképnek nincs külön parallax-rétege */
    gsap.fromTo(reteg, { y: 0 }, { y: function () { return hero.offsetHeight * (mobil() ? 0.2 : 0.28); }, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
  }

  /* képek lassú zoomja a keretükben (1,06 → 1), egy mozgató: a belső img; a wellness-pár zoomja a fooldal.js-ben (közös tween) */
  function zoom(gsap) {
    var kepek = d.querySelectorAll('.p-fo .feszek__kep img, .p-fo .mozaik .kp img, .p-fo .kepsor .kp img');
    for (var i = 0; i < kepek.length; i++) {
      gsap.fromTo(kepek[i], { scale: 1.06 }, { scale: 1, ease: 'none',
        scrollTrigger: { trigger: kepek[i].parentNode, start: 'top bottom', end: 'center 55%', scrub: true } });
    }
  }

  /* szakaszcímek: soronként maszkból emelkednek (SplitText mask:"lines"), a kicker halkan előtte jön.
     A már látható címhez nem nyúl (nincs villanás); a felfedés után a bontás visszaáll, a sortörés később is szabad. */
  function cimek(gsap, Split) {
    var el = d.querySelectorAll('[data-cim]');
    for (var i = 0; i < el.length; i++) (function (c) {
      if (c.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      var h2 = c.closest('h2'), kick = h2 && h2 !== c ? h2.querySelector('.kicker') : null;
      var sp = Split.create(c, { type: 'lines', mask: 'lines', linesClass: 'sor', aria: 'none' });
      /* a kicker betűnként, lágyan érkezik (2026-11-20), a cím sorai közben emelkednek */
      var kb = kick ? Split.create(kick, { type: 'chars', charsClass: 'kb', aria: 'none' }) : null;
      var tl = gsap.timeline({ scrollTrigger: { trigger: h2 || c, start: 'top 86%', once: true },
        onComplete: function () { sp.revert(); if (kb) kb.revert(); } });
      if (kb) tl.from(kb.chars, { autoAlpha: 0, y: 5, duration: 0.45, ease: 'power2.out', stagger: { each: 0.024, ease: 'power1.in' } }, 0);
      tl.from(sp.lines, { yPercent: 115, duration: 0.95, ease: 'expo.out', stagger: 0.09 }, kick ? 0.08 : 0);
    })(el[i]);
  }

  /* vendor a load után, sorban: az első képernyő nem vár rá */
  function tolt(src) {
    return new Promise(function (ok, hiba) {
      var s = d.createElement('script'); s.src = src; s.async = false; s.onload = ok; s.onerror = hiba; d.body.appendChild(s);
    });
  }
  function nincsMozgas() { de.classList.add('hn-nincs-mozgas'); }
  function mozgas() {
    if (window.Lenis) {
      lenis = new window.Lenis({ smoothWheel: true, syncTouch: false, lerp: 0.12, allowNestedScroll: true });
      window.HNLenis = lenis;
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
      if (menu && !menu.hidden) lenis.stop();
    }
    var gsap = window.gsap, ST = window.ScrollTrigger;
    if (!gsap || !ST) { nincsMozgas(); return; }
    gsap.registerPlugin(ST);
    ST.config({ ignoreMobileResize: true });
    if (lenis) lenis.on('scroll', ST.update);
    melyseg(gsap);
    zoom(gsap);
    /* refresh csak görgetés-csendben: koaleszkált, legfeljebb 40 próbálkozás */
    var utolso = 0, fuggo = null;
    window.addEventListener('scroll', function () { utolso = Date.now(); }, { passive: true });
    function frissit(n) {
      if (Date.now() - utolso > 600) { fuggo = null; ST.refresh(); }
      else if (n < 40) fuggo = setTimeout(function () { frissit(n + 1); }, 400);
    }
    function kesobb() { if (fuggo) clearTimeout(fuggo); fuggo = setTimeout(function () { frissit(0); }, 300); }
    if (window.SplitText) {
      gsap.registerPlugin(window.SplitText);
      (d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve()).then(function () { cimek(gsap, window.SplitText); kesobb(); });
    }
    kesobb();
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(kesobb);
    setTimeout(kesobb, 2500); setTimeout(kesobb, 6000);
    /* az oldal-specifikus mozgás (pl. a főoldal fooldal.js-e) erre az eseményre köt be, és ugyanezt a
       görgetés-csendre váró refresh-t használja */
    window.HNFrissit = kesobb;
    try { d.dispatchEvent(new CustomEvent('hn:mozgas')); } catch (e) {}
  }
  window.addEventListener('load', function () {
    if (csendes) return;
    var biztos = setTimeout(nincsMozgas, 8000);
    var lanc = tolt('js/vendor/gsap.min.js').then(function () { return tolt('js/vendor/ScrollTrigger.min.js'); })
      .then(function () { return tolt('js/vendor/lenis.min.js'); });
    if (d.querySelector('[data-cim]')) lanc = lanc.then(function () { return tolt('js/vendor/SplitText.min.js').catch(function () {}); });
    lanc.then(function () { clearTimeout(biztos); mozgas(); })
      .catch(function () { clearTimeout(biztos); nincsMozgas(); });
  });
})();
