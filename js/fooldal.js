/* HappyNest v5 · csak a főoldal (index.html). 2026-11-20 „több mozgás” kör; 2026-11-22 (t_544b7343) új motívumok
   (7. rész); 2026-11-22 este (t_5283e705, hero 4): a „betű-ablak” nyitókép helyett egyszerű, egyképes nyitókép, itt
   csak a görgetéses része van (6. rész: enyhe parallax és a szöveg halványulása, pin nélkül). 2026-11-22 késő este
   (t_a3fad1bd, hero 5): erősebb parallax (27 %), a szöveg felúszik, és a 8. rész: ritka hó, Ken Burns-szünet.
   GSAP nélkül is működik: a háttértónus-ritmus, a vendégvélemény-váltás és a naptár sorszámai sima JS. A GSAP-os rész
   (a nyitókép parallaxa, a Fészek-kép felfedése, a wellness-képek közös zoomja) a hn.js „hn:mozgas” eseményére köt
   be, a hn.js-ben betöltött lokális vendorral; ha az nem jön meg, az oldal változatlanul teljes, a nyitókép áll.
   Reduced-motion (.hn-csendes): csak a tónus-ritmus fut (szín, nem mozgás). */
(function () {
  'use strict';
  var d = document, de = d.documentElement;
  var csendes = de.classList.contains('hn-csendes');
  var mobil = function () { return window.innerWidth <= 760; };

  /* ---------- 1. háttértónus-ritmus: len (#F6F1E9) ↔ meleg felület (#EAE5DD) ----------
     A [data-ton="1"] szakaszok a melegebb tónust kérik. A lap színe a nézet közepének helyéből számolódik: a szakasz-
     határ körül (± 30 % képernyő) lágyan átúszik, megállva ott marad, ahol van (nincs idle-snap). A szakaszok helyét
     csak átméretezéskor méri újra (görgetés közben nincs layout-olvasás); csak akkor ír, ha a szín tényleg változik. */
  var szakaszok = [].slice.call(d.querySelectorAll('main > section'));
  var fej = d.querySelector('[data-fej]'), lip = d.querySelector('.feszek');
  function hex(v) { v = (v || '').trim().replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(v.substr(i, 2), 16); }); }
  var cs = getComputedStyle(de), A = hex(cs.getPropertyValue('--alap')), F = hex(cs.getPropertyValue('--felulet'));
  var hatarok = [], utolso = '', fuggo = false;
  function meres() {
    hatarok = [];
    var y0 = window.scrollY, elozo = null;
    for (var i = 0; i < szakaszok.length; i++) {
      var s = szakaszok[i], t = s.getBoundingClientRect().top + y0;
      var ton = s.classList.contains('sotet') ? (elozo === null ? 0 : elozo) : (s.getAttribute('data-ton') === '1' ? 1 : 0);
      if (elozo !== null && ton !== elozo) hatarok.push({ y: t, a: elozo, b: ton });
      elozo = ton;
    }
    ir();
  }
  function sima(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function ir() {
    fuggo = false;
    if (!hatarok.length || isNaN(A[0]) || isNaN(F[0])) return;
    var c = window.scrollY + window.innerHeight * 0.5, sav = window.innerHeight * 0.3, t = hatarok[0].a;
    for (var i = 0; i < hatarok.length; i++) {
      var h = hatarok[i];
      if (c >= h.y + sav) t = h.b;
      else { if (c > h.y - sav) t = h.a + (h.b - h.a) * sima((c - (h.y - sav)) / (2 * sav)); break; }
    }
    var szin = 'rgb(' + A.map(function (a, k) { return Math.round(a + (F[k] - a) * t); }).join(',') + ')';
    if (szin === utolso) return;
    utolso = szin;
    d.body.style.backgroundColor = szin;
    if (fej) fej.style.backgroundColor = szin;
    if (lip) lip.style.backgroundColor = szin;
  }
  function kerj() { if (!fuggo) { fuggo = true; requestAnimationFrame(ir); } }
  if (szakaszok.length) {
    window.addEventListener('scroll', kerj, { passive: true });
    window.addEventListener('resize', function () { requestAnimationFrame(meres); });
    window.addEventListener('load', meres);
    if (window.ResizeObserver) new ResizeObserver(function () { requestAnimationFrame(meres); }).observe(d.body);
    meres();
  }

  /* ---------- 2. vendégvélemények: lassú váltás áttűnéssel, a szavak egymás után ----------
     7 s-onként; megáll, ha az egér fölötte vagy a fókusz benne van, ha a szakasz nem látszik, ha a lap háttérben
     van, és a megállító gombbal (WCAG 2.2.2). Reduced-motion alatt az első idézet áll, váltás nincs. */
  var fig = d.querySelector('[data-idezetek]');
  if (fig) {
    var idk = [].slice.call(fig.querySelectorAll('.idezet'));
    var gomb = fig.querySelector('[data-idezet-szunet]');
    idk.forEach(function (bq) {
      var p = bq.querySelector('p'); if (!p) return;
      var szavak = p.textContent.split(' ');
      p.innerHTML = '';
      szavak.forEach(function (sz, i) {
        var s = d.createElement('span'); s.className = 'iszo';
        s.style.setProperty('--w', i); s.textContent = sz;
        p.appendChild(s); if (i < szavak.length - 1) p.appendChild(d.createTextNode(' '));
      });
    });
    /* az első idézet szavai akkor indulnak, amikor a szakasz belépője (hn.js .is-be) megtörténik */
    var elso = function () { if (idk[0]) idk[0].classList.add('is-szo'); };
    if (csendes || fig.classList.contains('is-be')) elso();
    else {
      if (window.MutationObserver) new MutationObserver(function () { if (fig.classList.contains('is-be')) elso(); }).observe(fig, { attributes: true, attributeFilter: ['class'] });
      setTimeout(elso, 4000);
    }
    if (!csendes && idk.length > 1) {
      var akt = 0, ido = 0, lathato = false, folotte = false, megallitva = false;
      if (gomb) gomb.hidden = false;
      var mehet = function () { return lathato && !folotte && !megallitva && !d.hidden; };
      var valt = function () {
        var regi = idk[akt]; akt = (akt + 1) % idk.length; var uj = idk[akt];
        regi.classList.remove('is-akt');
        setTimeout(function () { regi.classList.remove('is-szo'); }, 600);
        uj.classList.add('is-akt');
        requestAnimationFrame(function () { requestAnimationFrame(function () { uj.classList.add('is-szo'); }); });
      };
      var utem = function () {
        clearTimeout(ido);
        if (mehet()) ido = setTimeout(function () { if (mehet()) valt(); utem(); }, 7000);
      };
      fig.addEventListener('mouseenter', function () { folotte = true; utem(); });
      fig.addEventListener('mouseleave', function () { folotte = false; utem(); });
      fig.addEventListener('focusin', function () { folotte = true; utem(); });
      fig.addEventListener('focusout', function () { folotte = false; utem(); });
      d.addEventListener('visibilitychange', utem);
      if (gomb) gomb.addEventListener('click', function () {
        megallitva = !megallitva; gomb.setAttribute('aria-pressed', String(megallitva));
        gomb.setAttribute('aria-label', megallitva ? 'A vendégvélemények váltásának folytatása' : 'A vendégvélemények váltásának megállítása');
        utem();
      });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { lathato = es[0].isIntersecting; utem(); }).observe(fig);
      } else { lathato = true; utem(); }
    }
  }

  /* ---------- 4. naptár: a később érkező napok is kapjanak sorszámot (a gyors hullámhoz) ---------- */
  var sav = d.querySelector('.p-fo .sav[data-r="lepcso"]');
  if (sav) {
    var szamoz = function () { for (var i = 0; i < sav.children.length; i++) sav.children[i].style.setProperty('--i', i); };
    szamoz();
    if (window.MutationObserver) new MutationObserver(szamoz).observe(sav, { childList: true });
  }

  /* ---------- 5. telefonszám és lábléc-név: karakterenként (GSAP nélkül, IntersectionObserver) ----------
     A záró szakasz telefonszáma számjegyenként, maszkból gördül fel; a lábléc „HappyNest” neve széthúzott betűkből áll
     össze. A szöveg felolvasásra egyben marad (aria-label, sr-only).
     Reduced-motion alatt nincs bontás. */
  function karakterek(el, osztaly) {
    var t = el.textContent, frag = d.createDocumentFragment(), n = 0;
    for (var i = 0; i < t.length; i++) {
      var ch = t.charAt(i), s = d.createElement('span');
      s.className = osztaly; s.setAttribute('aria-hidden', 'true');
      if (ch === ' ') { s.className += ' is-ur'; s.textContent = '\u00a0'; }
      else { var b = d.createElement('span'); b.textContent = ch; s.appendChild(b); s.style.setProperty('--c', n++); }
      frag.appendChild(s);
    }
    el.textContent = ''; el.appendChild(frag);
    return n;
  }
  function figyel(el, fn) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { fn(); io.disconnect(); } }, { rootMargin: '0px 0px -10% 0px' });
    io.observe(el);
    setTimeout(function () { if (!el.classList.contains('is-be')) { /* biztonsági háló csak, ha már a nézetben van */
      var r = el.getBoundingClientRect(); if (r.top < window.innerHeight && r.bottom > 0) fn(); } }, 4000);
  }
  if (!csendes) {
    var tel = d.querySelector('[data-tel-gurul]');
    if (tel) {
      tel.setAttribute('aria-label', tel.textContent.trim());
      karakterek(tel, 'tsz');
      figyel(tel, function () { tel.classList.add('is-be'); });
    }
    var nev = d.querySelector('[data-lab-nev]');
    if (nev) {
      var szoveg = nev.textContent.trim(), sr = d.createElement('span');
      sr.className = 'sr-only'; sr.textContent = szoveg;
      var db = karakterek(nev, 'lb');
      var spanok = nev.querySelectorAll('.lb');
      for (var k = 0; k < spanok.length; k++) spanok[k].style.setProperty('--x', ((k - (db - 1) / 2) * 0.42).toFixed(2) + 'em');
      nev.insertBefore(sr, nev.firstChild);
      figyel(nev, function () { nev.classList.add('is-be'); });
    }
  }

  /* ---------- 6. nyitókép görgetésre: parallax, a szöveg felúszik és halványul (GSAP, pin nélkül) ----------
     2026-11-22 (hero 5): a kép rétege a szakasz kigördülése alatt a szakasz magasságának 27 %-ával lefelé tolódik,
     tehát 27 %-kal lassabban halad, mint a lap (a felső rés a képernyő fölött marad, az alsót a szakasz
     overflow:clip-je vágja). A szöveg-sáv a kigördülés első kétharmadában a szakasz 8 %-ával felfelé úszik (a lapnál
     kicsit gyorsabban) és elhalványul. Egy elem egy mozgató: .nyk__reteg = transform (y), img = scale és translate
     (CSS Ken Burns), [data-nyk-szoveg] = transform (y) és opacity, a belépő a gyerekein (CSS). */
  var nyk = d.querySelector('[data-hero]');
  var PARALLAX = 0.27, FELUSZ = 0.08;
  function nyitokep(gsap) {
    if (!nyk) return;
    var reteg = nyk.querySelector('[data-nyk-reteg]'), szoveg = nyk.querySelector('[data-nyk-szoveg]');
    if (reteg) gsap.fromTo(reteg, { y: 0 }, { y: function () { return nyk.offsetHeight * PARALLAX; }, ease: 'none',
      scrollTrigger: { trigger: nyk, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
    if (szoveg) gsap.fromTo(szoveg, { opacity: 1, y: 0 }, { opacity: 0, y: function () { return -nyk.offsetHeight * FELUSZ; }, ease: 'power1.in',
      scrollTrigger: { trigger: nyk, start: 'top top', end: '66% top', scrub: true, invalidateOnRefresh: true } });
  }

  /* ---------- 8. nyitókép: a Ken Burns szünetel, ha nem látszik; ritka hó a kép előtt (GSAP nélkül) ----------
     A hó: 2D canvas, asztalon 40, mobilon 16 apró pehely (1,4-3 px átmérő), alacsony alfa (0,32-0,65; halványabban a fehér égen nem látszott), lassú esés
     (kb. 12-30 px/s) és enyhe szinuszos sodródás, kb. 30 képkocka/s-mal rajzolva. A pelyhek a szöveg-sáv teteje
     fölött elhalványulnak, a szöveg mögé nem esnek (a kontrasztot nem rontják). Csak akkor fut, ha a nyitókép
     látszik (IntersectionObserver) és a lap nincs háttérben (visibilitychange); a méret a DPR-hez igazodik
     (asztalon legfeljebb 2x, mobilon 1,5x raszter), átméretezéskor újraszámol. Reduced-motion alatt el sem indul. */
  if (nyk && !csendes) {
    var hoC = nyk.querySelector('[data-nyk-ho]'), hoAllit = function () {};
    var nykLathato = true;
    if (hoC && hoC.getContext) (function () {
      var ctx = hoC.getContext('2d');
      if (!ctx) return;
      var talaj = nyk.querySelector('[data-hero-b]');
      var w = 0, h = 0, dpr = 1, alja = 0, lagy = 60, pk = [], fut = false, elozo = 0, raf = 0;
      function uj(barhol) {
        var r = 0.7 + Math.random() * 0.8;
        return { x: Math.random() * w, y: barhol ? Math.random() * alja : -4, r: r, v: 8 + r * 9 + Math.random() * 5,
          a: 0.32 + Math.random() * 0.33, f: Math.random() * 6.2832, s: 0.25 + Math.random() * 0.45, k: 5 + Math.random() * 7 };
      }
      function meret() {
        dpr = Math.min(window.devicePixelRatio || 1, mobil() ? 1.5 : 2);
        w = hoC.clientWidth; h = hoC.clientHeight;
        if (!w || !h) return;
        hoC.width = Math.round(w * dpr); hoC.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var t = talaj ? talaj.getBoundingClientRect().top - hoC.getBoundingClientRect().top : h;
        alja = Math.max(h * 0.35, Math.min(h, t)); lagy = Math.max(60, alja * 0.3);
        var n = mobil() ? 16 : 40;
        pk.length = Math.min(pk.length, n);
        for (var i = 0; i < pk.length; i++) if (pk[i].x > w) pk[i].x = Math.random() * w;
        while (pk.length < n) pk.push(uj(true));
      }
      function nykHoRajz(t) {
        raf = requestAnimationFrame(nykHoRajz);
        if (t - elozo < 30) return;
        var dt = Math.min(0.08, Math.max(0, (t - elozo) / 1000)); elozo = t;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#FFFFFF';
        for (var i = 0; i < pk.length; i++) {
          var p = pk[i];
          p.y += p.v * dt; p.f += p.s * dt; p.x += Math.sin(p.f) * p.k * dt;
          if (p.y > alja) { pk[i] = uj(false); continue; }
          if (p.x < -4) p.x += w + 8; else if (p.x > w + 4) p.x -= w + 8;
          var al = p.y > alja - lagy ? p.a * (alja - p.y) / lagy : p.a;
          if (al <= 0.01) continue;
          ctx.globalAlpha = al;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        }
      }
      hoAllit = function () {
        var kell = nykLathato && !d.hidden;
        if (kell && !fut) { fut = true; elozo = performance.now(); raf = requestAnimationFrame(nykHoRajz); }
        else if (!kell && fut) { fut = false; cancelAnimationFrame(raf); }
      };
      meret();
      if (window.ResizeObserver) new ResizeObserver(meret).observe(hoC); else window.addEventListener('resize', meret);
      d.addEventListener('visibilitychange', function () { hoAllit(); });
    })();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        nykLathato = es[0].isIntersecting;
        nyk.classList.toggle('is-kint', !nykLathato);
        hoAllit();
      }).observe(nyk);
    } else hoAllit();
  }

  /* a nyitókép csak egy képernyő, ezért a Fészek és A házban képei az első görgetés-mozdulatra már érkeznek: ha
     csak akkor töltődnek és dekódolódnak, mobilon (4× CPU-lassítással mérve) a képkockák fele kicsúszik a keretből.
     A betöltés UTÁN, üresjáratban előre kérjük és dekódoljuk őket (a HTML-ben lazy marad, az első képernyő és az LCP
     nem vár rájuk, a látvány nem változik). */
  function elotolt() {
    var kepek = d.querySelectorAll('.p-fo .feszek img, .p-fo .mozaik img');
    for (var i = 0; i < kepek.length; i++) {
      var k = kepek[i];
      if (k.loading === 'lazy') k.loading = 'eager';
      if (k.decode) k.decode().catch(function () {});
    }
  }
  window.addEventListener('load', function () {
    if ('requestIdleCallback' in window) requestIdleCallback(elotolt, { timeout: 1500 }); else setTimeout(elotolt, 600);
  });

  /* ---------- 7. további motívumok (GSAP): a Fészek-kép egyenes szélű felfedése görgetésre, a wellness-képek zoomja ---------- */
  function feszekKep(gsap) {
    var f = d.querySelector('[data-feszek-kep]');
    if (!f) return;
    gsap.fromTo(f, { clipPath: 'inset(0% 100% 0% 0% round 6px)' }, { clipPath: 'inset(0% 0% 0% 0% round 6px)', ease: 'power1.out',
      scrollTrigger: { trigger: f, start: 'top 88%', end: 'top 38%', scrub: true } });
  }

  /* ---------- 9. wellness: a két kép egy párként nyílik és közelít (2026-11-22, t_aad1ac3e) ----------
     Levente: az eltolt parallaxnál „fura, hogy az egyik feljebb megy”. Most a két kép ugyanazt teszi, ugyanakkor.
     Nyílás: egyetlen IntersectionObserver az első cikken (nem a kereten: a rejtett keret clip-pathja miatt a
     megfigyelő 0 metszetet látna); amikor a cikk 40 %-a látszik (a kép kb. fele, így a nyílás a szem előtt történik,
     nem a hajtás alatt), a szakasz .is-nyit osztályt kap, és a CSS mindkét keretet ugyanabban a képkockában nyitja (clip-path a .kp-n, a keret nem
     mozdul, a tetejük egy vonalban marad). A rejtést ez a kód élesíti (html.hn-wp): ha nem fut le, ha nincs
     IntersectionObserver, ha reduced-motion van, vagy ha a pár betöltéskor már a nézetben vagy fölötte van, a képek
     eleve nyitva vannak. GSAP nélkül is teljes: a nyílás CSS, csak a zoom GSAP. */
  var wSz = d.querySelector('.p-fo .wellness-f'), wKp = wSz ? wSz.querySelectorAll('.wp .kp') : [];
  if (wSz && wKp.length && !csendes && 'IntersectionObserver' in window &&
      wKp[0].parentNode.getBoundingClientRect().top + wKp[0].parentNode.offsetHeight * 0.4 > window.innerHeight) {
    de.classList.add('hn-wp');
    var wNyit = function () { void wSz.offsetWidth; wSz.classList.add('is-nyit'); };
    var wIo = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting || es[0].intersectionRatio < 0.38) return;
      wIo.disconnect(); wNyit();
    }, { threshold: [0.4] });
    wIo.observe(wKp[0].parentNode);
    window.addEventListener('beforeprint', wNyit);
  }
  /* zoom: a két belső img EGY tweenben (azonos érték minden képkockán), 1,08 → 1, a nyílással együtt indul és a
     második kép aljáig tart (mobilon a két kép egymás alatt van). Egy mozgató egy elemre: a clip a kereten, a scale
     a képen. */
  function wellnessZoom(gsap) {
    if (!wKp.length) return;
    var kepek = [];
    for (var i = 0; i < wKp.length; i++) { var im = wKp[i].querySelector('img'); if (im) kepek.push(im); }
    if (!kepek.length) return;
    gsap.fromTo(kepek, { scale: 1.08 }, { scale: 1, ease: 'none',
      scrollTrigger: { trigger: wKp[0], start: '50% bottom', endTrigger: wKp[wKp.length - 1], end: 'bottom 20%', scrub: true } });
  }

  function gsapResz() {
    var gsap = window.gsap;
    if (!gsap || !window.ScrollTrigger || csendes) return;
    nyitokep(gsap);
    feszekKep(gsap);
    wellnessZoom(gsap);
    if (window.HNFrissit) window.HNFrissit();
  }
  d.addEventListener('hn:mozgas', gsapResz);
})();
