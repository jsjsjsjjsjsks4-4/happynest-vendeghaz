/* HappyNest v5 · Főoldal 2 (index-2.html): Nyáron / Télen váltó, vélemény-váltó, maszkos kép-felfedés.
   GSAP nélkül fut (CSS-átmenet + IntersectionObserver), a tartalom JS nélkül is teljes:
   JS nélkül mindkét évszak képei és mind a három vélemény egymás alatt látszik, a vezérlők rejtve maradnak. */
(function () {
  'use strict';
  var d = document;
  var kenyszer = null; try { kenyszer = sessionStorage.getItem('hn-motion'); } catch (e) {}
  var csendes = kenyszer === '1' ? false : (kenyszer === '0' ? true : window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- maszkos felfedés (wellness-képek) ---------- */
  var maszk = d.querySelectorAll('[data-maszk]');
  function mindFel() { for (var i = 0; i < maszk.length; i++) maszk[i].classList.add('is-be'); }
  if (csendes || !('IntersectionObserver' in window)) mindFel();
  else if (maszk.length) {
    var mio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-be'); mio.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    for (var m = 0; m < maszk.length; m++) mio.observe(maszk[m]);
    setTimeout(mindFel, 4000);
  }

  /* ---------- Nyáron / Télen ---------- */
  var ev = d.querySelector('[data-evszak]'), valto = d.querySelector('[data-evszak-valto]');
  if (ev && valto) {
    var gombok = valto.querySelectorAll('[data-evszak-gomb]');
    var allit = function (nev) {
      ev.setAttribute('data-evszak', nev);
      for (var i = 0; i < gombok.length; i++) gombok[i].setAttribute('aria-pressed', gombok[i].getAttribute('data-evszak-gomb') === nev ? 'true' : 'false');
    };
    for (var g = 0; g < gombok.length; g++) {
      gombok[g].addEventListener('click', function () { allit(this.getAttribute('data-evszak-gomb')); });
      gombok[g].addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        var masik = this === gombok[0] ? gombok[1] : gombok[0];
        masik.focus(); allit(masik.getAttribute('data-evszak-gomb'));
      });
    }
    valto.hidden = false;
    allit(ev.getAttribute('data-evszak') || 'nyar');
  }

  /* ---------- vendégvélemények: lassú váltás, kézzel lapozható, megállítható ---------- */
  var tar = d.querySelector('[data-idezetek]'), vez = d.querySelector('[data-idezet-vez]');
  if (tar && vez) {
    var lapok = tar.querySelectorAll('[data-idezet]'), hol = vez.querySelector('[data-idezet-hol]');
    var allj = vez.querySelector('[data-idezet-allj]');
    var akt = 0, ido = null, megallitva = csendes, lathato = false, szunet = false, IDO = 7000;
    var mutat = function (n) {
      akt = (n + lapok.length) % lapok.length;
      for (var i = 0; i < lapok.length; i++) lapok[i].classList.toggle('is-aktiv', i === akt);
      hol.textContent = String(akt + 1);
    };
    var felirat = function () { allj.textContent = megallitva ? 'Váltás folytatása' : 'Váltás megállítása'; };
    var leallit = function () { if (ido) { clearInterval(ido); ido = null; } };
    var indit = function () {
      leallit();
      if (megallitva || !lathato || szunet || d.hidden) return;
      ido = setInterval(function () { mutat(akt + 1); }, IDO);
    };
    var kezzel = function (n) {
      megallitva = true; felirat(); leallit();
      tar.setAttribute('aria-live', 'polite');
      mutat(n);
    };
    vez.querySelector('[data-idezet-elozo]').addEventListener('click', function () { kezzel(akt - 1); });
    vez.querySelector('[data-idezet-kovetkezo]').addEventListener('click', function () { kezzel(akt + 1); });
    allj.addEventListener('click', function () {
      megallitva = !megallitva; felirat();
      tar.setAttribute('aria-live', megallitva ? 'polite' : 'off');
      indit();
    });
    var szakasz = tar.closest('section') || tar;
    szakasz.addEventListener('mouseenter', function () { szunet = true; indit(); });
    szakasz.addEventListener('mouseleave', function () { szunet = false; indit(); });
    szakasz.addEventListener('focusin', function () { szunet = true; indit(); });
    szakasz.addEventListener('focusout', function (e) { if (!szakasz.contains(e.relatedTarget)) { szunet = false; indit(); } });
    d.addEventListener('visibilitychange', indit);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { lathato = es[0].isIntersecting; indit(); }, { threshold: 0.4 }).observe(tar);
    }
    tar.setAttribute('aria-live', megallitva ? 'polite' : 'off');
    if (csendes) allj.hidden = true; /* reduced-motion: nincs automatikus váltás, csak kézi lapozás */
    mutat(0); felirat();
    vez.hidden = false;
  }
})();
