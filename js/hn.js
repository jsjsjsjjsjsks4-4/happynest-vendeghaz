/* HappyNest v5 · fejléc, mobil menü, belépő, Lenis + GSAP (lokális vendor, a load után).
   A tartalom nem függ a GSAP-tól: a belépő CSS + IntersectionObserver, a vendor csak a görgetést simítja. */
(function () {
  'use strict';
  var d = document, de = d.documentElement;
  try {
    var q = new URLSearchParams(location.search).get('motion');
    if (q === '1' || q === '0') sessionStorage.setItem('hn-motion', q);
  } catch (e) {}
  var kenyszer = null; try { kenyszer = sessionStorage.getItem('hn-motion'); } catch (e) {}
  var csendes = kenyszer === '1' ? false : (kenyszer === '0' ? true : window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var lenis = null;

  /* fejléc: görgetéskor finom alsó él */
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

  /* belépő: legfeljebb 0,4 s és 8 px; reduced-motion alatt kész végállapot */
  var rev = d.querySelectorAll('[data-r]');
  function mind() { for (var i = 0; i < rev.length; i++) rev[i].classList.add('is-be'); }
  if (csendes || !('IntersectionObserver' in window)) mind();
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-be'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px' });
    for (var j = 0; j < rev.length; j++) io.observe(rev[j]);
    setTimeout(mind, 3000);
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

  /* vendor a load után, sorban: az első képernyő nem vár rá */
  function tolt(src) {
    return new Promise(function (ok, hiba) {
      var s = d.createElement('script'); s.src = src; s.async = false; s.onload = ok; s.onerror = hiba; d.body.appendChild(s);
    });
  }
  function mozgas() {
    if (window.Lenis) {
      lenis = new window.Lenis({ smoothWheel: true, syncTouch: false, lerp: 0.12, allowNestedScroll: true });
      window.HNLenis = lenis;
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
      if (menu && !menu.hidden) lenis.stop();
    }
    if (!window.gsap || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.ScrollTrigger.config({ ignoreMobileResize: true });
    if (lenis) lenis.on('scroll', window.ScrollTrigger.update);
    var utolso = 0;
    window.addEventListener('scroll', function () { utolso = Date.now(); }, { passive: true });
    function frissit(n) { if (Date.now() - utolso > 600) window.ScrollTrigger.refresh(); else if (n < 40) setTimeout(function () { frissit(n + 1); }, 400); }
    setTimeout(function () { frissit(0); }, 700);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { frissit(0); });
  }
  window.addEventListener('load', function () {
    if (csendes) return;
    tolt('js/vendor/gsap.min.js').then(function () { return tolt('js/vendor/ScrollTrigger.min.js'); })
      .then(function () { return tolt('js/vendor/lenis.min.js'); })
      .then(mozgas).catch(function () { /* vendor nélkül natív görgetés, az oldal teljes */ });
  });
})();
