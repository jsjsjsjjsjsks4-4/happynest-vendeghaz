/* HappyNest v5 · galéria: szűrő, darabszám, natív <dialog> nagyító (nyilak, Escape, Lenis megállítva),
   és az első képernyő: a csempék magassága úgy igazodik, hogy a hajtásnál ne vágódjon kép. */
(function () {
  'use strict';
  var d = document;
  var racs = d.querySelector('[data-galeria]');
  if (!racs) return;
  var elemek = Array.prototype.slice.call(racs.children);
  var db = d.querySelector('[data-gal-db]');

  /* hajtás-illesztés: ha egy csempesor a hajtásra esne, a sorok magasságát úgy állítja, hogy egész sorok férjenek be */
  function illeszt() {
    racs.removeAttribute('data-csempe-h'); racs.style.removeProperty('--csempe-h');
    var lathato = elemek.filter(function (li) { return !li.hidden; });
    if (!lathato.length || window.scrollY > 4) return;
    var h = window.innerHeight, elso = lathato[0].getBoundingClientRect();
    var ter = parseFloat(getComputedStyle(racs).rowGap) || 16;
    var csh = elso.height, top = elso.top + window.scrollY;
    if (top >= h) return;
    var oszlop = getComputedStyle(racs).gridTemplateColumns.split(' ').length || 1;
    var osszes = Math.ceil(lathato.length / oszlop);   /* a valódi sorok száma */
    var sorok = 0, y = top;
    while (y < h && sorok < osszes) { if (y + csh <= h - 8) { sorok++; y += csh + ter; } else break; }
    if (sorok >= osszes || y >= h) return;  /* minden sor befér, vagy a következő a hajtás alatt kezdődik */
    var szel = elso.width, k = sorok + 1;  /* két lehetőség: k sor összenyomva, vagy (k-1) sor nyújtva */
    /* a k-adik sor a hajtás fölött zárul, a következő pontosan a hajtás alatt kezdődik */
    var hA = Math.ceil((h - top) / k - ter) + 1;
    var hB = sorok > 0 ? Math.ceil((h - top) / sorok - ter) + 1 : 0;
    var jo = function (x) { return x > 0 && szel / x >= 1.15 && szel / x <= 1.85; };
    var uj = jo(hA) ? hA : (jo(hB) ? hB : 0);
    if (!uj) uj = hA > 40 ? hA : 0;        /* végső eset: összenyomott sorok */
    if (!uj) return;
    racs.setAttribute('data-csempe-h', '');
    racs.style.setProperty('--csempe-h', Math.floor(uj) + 'px');
  }

  /* szűrő */
  var gombok = d.querySelectorAll('[data-szuro]');
  function szur(kat) {
    var n = 0;
    elemek.forEach(function (li) {
      var be = kat === 'mind' || (' ' + li.getAttribute('data-kat') + ' ').indexOf(' ' + kat + ' ') > -1;
      li.hidden = !be; if (be) n++;
    });
    if (db) db.textContent = n + ' fotó';
    if (window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.gsap.fromTo(elemek.filter(function (li) { return !li.hidden; }), { opacity: 0 }, { opacity: 1, duration: 0.3, stagger: 0.03, ease: 'power1.out', clearProps: 'opacity' });
    }
  }
  Array.prototype.forEach.call(gombok, function (g) {
    g.addEventListener('click', function () {
      Array.prototype.forEach.call(gombok, function (x) { x.setAttribute('aria-pressed', x === g ? 'true' : 'false'); });
      szur(g.getAttribute('data-szuro'));
    });
  });

  /* nagyító: csak a látható képek között lapoz */
  var dlg = d.querySelector('[data-nagyito]');
  if (dlg && typeof dlg.showModal === 'function') {
    var img = dlg.querySelector('[data-nagyito-img]'), felirat = dlg.querySelector('[data-nagyito-felirat]');
    var szam = dlg.querySelector('[data-nagyito-szam]'), aktiv = 0, sor = [], vissza = null;
    var mutat = function (i) {
      aktiv = (i + sor.length) % sor.length;
      var g = sor[aktiv], kis = g.querySelector('img');
      img.src = g.getAttribute('data-nagy'); img.alt = kis ? kis.alt : '';
      felirat.textContent = kis ? kis.alt : '';
      szam.textContent = (aktiv + 1) + ' / ' + sor.length;
    };
    racs.addEventListener('click', function (e) {
      var g = e.target.closest('.cs'); if (!g) return;
      sor = elemek.filter(function (li) { return !li.hidden; }).map(function (li) { return li.querySelector('.cs'); });
      vissza = g; mutat(sor.indexOf(g)); dlg.showModal();
      if (window.HNLenis) window.HNLenis.stop();
    });
    dlg.querySelector('[data-nagyito-zar]').addEventListener('click', function () { dlg.close(); });
    dlg.querySelector('[data-nagyito-elozo]').addEventListener('click', function () { mutat(aktiv - 1); });
    dlg.querySelector('[data-nagyito-kov]').addEventListener('click', function () { mutat(aktiv + 1); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); mutat(aktiv - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); mutat(aktiv + 1); }
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { if (window.HNLenis) window.HNLenis.start(); if (vissza) vissza.focus(); });
  }

  illeszt();
  var ido = 0;
  window.addEventListener('resize', function () { clearTimeout(ido); ido = setTimeout(illeszt, 150); });
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(illeszt);
})();
