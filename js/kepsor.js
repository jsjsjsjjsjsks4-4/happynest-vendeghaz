/* HappyNest v5 · főoldali képsor: natív scroll-snap, a gombok egy csempével lapoznak, a végeken letiltva.
   JS nélkül is görgethető (érintés, görgő, Shift + görgő, billentyűzet a fókuszált sávon). */
(function () {
  'use strict';
  var sor = document.querySelector('[data-kepsor]');
  var gombok = document.querySelector('[data-kepsor-gombok]');
  if (!sor || !gombok) return;
  var elozo = gombok.querySelector('[data-kepsor-elozo]'), kov = gombok.querySelector('[data-kepsor-kovetkezo]');
  var csendes = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function lepes() {
    var li = sor.querySelector('li');
    if (!li) return sor.clientWidth;
    var gap = parseFloat(getComputedStyle(li.parentNode).columnGap) || 0;
    return li.getBoundingClientRect().width + gap;
  }
  function allapot() {
    var max = sor.scrollWidth - sor.clientWidth;
    gombok.hidden = max <= 2;
    elozo.disabled = sor.scrollLeft <= 2;
    kov.disabled = sor.scrollLeft >= max - 2;
  }
  function lapoz(irany) { sor.scrollBy({ left: irany * lepes(), behavior: csendes ? 'auto' : 'smooth' }); }
  elozo.addEventListener('click', function () { lapoz(-1); });
  kov.addEventListener('click', function () { lapoz(1); });
  sor.addEventListener('scroll', allapot, { passive: true });
  window.addEventListener('resize', allapot);
  allapot();
})();
