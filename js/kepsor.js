/* HappyNest v5 · főoldali képsor („Kert és környék”).
   Alap: natív vízszintes görgetés scroll-snappel, a gombok egy csempével lapoznak, a végeken letiltva. JS nélkül is
   görgethető (érintés, görgő, Shift + görgő, billentyűzet a fókuszált sávon).
   Élő réteg (2026-11-19, hero 2): asztalon, ha a mozgás engedélyezett, a sor halkan magától csúszik (20 px/s, a végeken
   megáll és visszafordul). Megáll, amíg az egér fölötte van, a sávban vagy a gombokon a fókusz, húzás és kézi lapozás
   után 6 s-ig, ha a szakasz nem látszik vagy a lap háttérben van, és amíg a „mozgás megállítása” gomb be van nyomva.
   A gomb csak ott látszik, ahol a sor magától mozog (asztal, mozgás engedélyezve). Egérrel húzható; elengedéskor a
   legközelebbi képhez igazodik. */
(function () {
  'use strict';
  var d = document;
  var sor = d.querySelector('[data-kepsor]');
  var gombok = d.querySelector('[data-kepsor-gombok]');
  if (!sor || !gombok) return;
  var elozo = gombok.querySelector('[data-kepsor-elozo]'), kov = gombok.querySelector('[data-kepsor-kovetkezo]');
  var szunet = d.querySelector('[data-mozgas-szunet]');
  /* a fejléc inline szkriptje már beállította (reduced-motion vagy ?motion=0) */
  var csendes = d.documentElement.classList.contains('hn-csendes');
  var asztal = function () { return window.innerWidth > 760; };
  var max = function () { return sor.scrollWidth - sor.clientWidth; };

  function lepes() {
    var li = sor.querySelector('li');
    if (!li) return sor.clientWidth;
    var gap = parseFloat(getComputedStyle(li.parentNode).columnGap) || 0;
    return li.getBoundingClientRect().width + gap;
  }
  function allapot() {
    var m = max();
    gombok.hidden = m <= 2;
    elozo.disabled = sor.scrollLeft <= 2;
    kov.disabled = sor.scrollLeft >= m - 2;
  }
  function ide(i, sima) {
    var x = Math.max(0, Math.min(max(), Math.round(i) * lepes()));
    sor.scrollTo({ left: x, behavior: sima === false || csendes ? 'auto' : 'smooth' });
  }
  function hol() { return sor.scrollLeft / lepes(); }

  /* ---- önjárás ---- */
  var kezi = -1e9, rafId = 0, fut = false, lathato = false, folotte = false, fokusz = false, huz = false;
  var x = 0, irany = 1, varakoz = 0, elozoT = 0, gombSzunet = false;
  function autoMod() { return !csendes && asztal() && max() > 2; }
  function mehet() {
    return autoMod() && !gombSzunet && lathato && !d.hidden && !folotte && !fokusz && !huz && performance.now() - kezi > 6000;
  }
  function lep(t) {
    rafId = 0;
    var dt = Math.min(0.05, Math.max(0, (t - elozoT) / 1000)); elozoT = t;
    if (!mehet()) { fut = false; return; }
    if (Math.abs(sor.scrollLeft - x) > 2) x = sor.scrollLeft;   /* közben kézzel mozdult */
    var m = max();
    if (varakoz > 0) varakoz -= dt;
    else {
      x += irany * 20 * dt;
      if (x >= m) { x = m; irany = -1; varakoz = 1.8; }
      else if (x <= 0) { x = 0; irany = 1; varakoz = 1.8; }
      sor.scrollLeft = x;
    }
    rafId = requestAnimationFrame(lep);
  }
  function igazit() {
    sor.classList.toggle('is-auto', autoMod());
    if (szunet && !csendes) szunet.hidden = !autoMod();
    if (mehet() && !fut) { fut = true; x = sor.scrollLeft; elozoT = performance.now(); rafId = requestAnimationFrame(lep); }
  }
  function kezzel() { kezi = performance.now(); setTimeout(igazit, 6100); }

  function lapoz(irany2) { kezzel(); ide(Math.round(hol()) + irany2); }
  elozo.addEventListener('click', function () { lapoz(-1); });
  kov.addEventListener('click', function () { lapoz(1); });
  sor.addEventListener('scroll', allapot, { passive: true });
  window.addEventListener('resize', function () { allapot(); igazit(); });

  sor.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { folotte = true; } });
  sor.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { folotte = false; igazit(); } });
  sor.addEventListener('touchstart', kezzel, { passive: true });
  sor.addEventListener('wheel', function (e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) kezzel(); }, { passive: true });
  [sor, gombok].forEach(function (el) {
    el.addEventListener('focusin', function () { fokusz = true; });
    el.addEventListener('focusout', function () { setTimeout(function () {
      fokusz = sor.contains(d.activeElement) || gombok.contains(d.activeElement); igazit(); }, 0); });
  });

  /* húzás egérrel (érintésen a natív görgetés marad) */
  var hx = 0, hs = 0, mozdult = false;
  sor.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0 || max() <= 2) return;
    huz = true; mozdult = false; hx = e.clientX; hs = sor.scrollLeft;
    sor.setPointerCapture(e.pointerId);
  });
  sor.addEventListener('pointermove', function (e) {
    if (!huz) return;
    var dx = e.clientX - hx;
    if (!mozdult && Math.abs(dx) > 4) { mozdult = true; sor.classList.add('is-huz'); }
    if (mozdult) sor.scrollLeft = hs - dx;
  });
  function enged(e) {
    if (!huz) return;
    huz = false;
    try { sor.releasePointerCapture(e.pointerId); } catch (err) {}
    if (mozdult) {
      kezzel();
      ide(Math.round(hol()));
      setTimeout(function () { sor.classList.remove('is-huz'); }, 600);
    }
  }
  sor.addEventListener('pointerup', enged);
  sor.addEventListener('pointercancel', enged);
  sor.addEventListener('click', function (e) { if (mozdult) { e.preventDefault(); e.stopPropagation(); mozdult = false; } }, true);
  sor.addEventListener('dragstart', function (e) { e.preventDefault(); });

  /* a „mozgás megállítása” gomb: a képsor önjárását állítja meg és indítja (csak ha a sor magától mozog) */
  if (szunet && !csendes) {
    szunet.addEventListener('click', function () {
      gombSzunet = !gombSzunet;
      szunet.setAttribute('aria-pressed', gombSzunet ? 'true' : 'false');
      szunet.setAttribute('aria-label', gombSzunet ? 'A képsor mozgásának indítása' : 'A képsor mozgásának megállítása');
      igazit();
    });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { lathato = es[0].isIntersecting; igazit(); }, { threshold: 0.25 }).observe(sor);
  }
  d.addEventListener('visibilitychange', igazit);
  allapot();
  igazit();
})();
