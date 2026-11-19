/* HappyNest v4 · érdeklődő űrlap (Web3Forms, helyőrző kulccsal). Szerződés: functions/SZERZODES.md 3.3 és 4.4. */
(function () {
  'use strict';
  var urlap = document.querySelector('form[data-urlap]');
  if (!urlap) return;
  var TEL = '+36 20 372 6984';
  var HELYORZO = 'YOUR_ACCESS_KEY_HERE';
  var allapot = urlap.querySelector('[data-urlap-allapot]');
  var ma = window.HNFoglaltsag ? window.HNFoglaltsag.ma() : new Date().toISOString().slice(0, 10);
  ['erkezes', 'tavozas'].forEach(function (n) { if (urlap.elements[n]) urlap.elements[n].min = ma; });

  var UZENET = {
    nev: 'Add meg a neved.',
    email: 'Adj meg egy érvényes e-mail-címet.',
    erkezes: 'Add meg az érkezés napját.',
    tavozas: 'Add meg a távozás napját, az érkezés utáni napra vagy későbbre.',
    hozzajarulas: 'A válaszhoz el kell fogadnod az adatkezelést.'
  };

  function mezoHiba(nev, szoveg) {
    var mezo = urlap.elements[nev];
    var hely = urlap.querySelector('[data-mezo-hiba="' + nev + '"]');
    if (!mezo || !hely) return;
    if (szoveg) {
      hely.textContent = szoveg;
      hely.hidden = false;
      mezo.setAttribute('aria-invalid', 'true');
      mezo.setAttribute('aria-describedby', hely.id);
    } else {
      hely.hidden = true;
      hely.textContent = '';
      mezo.removeAttribute('aria-invalid');
      mezo.removeAttribute('aria-describedby');
    }
  }
  function ellenoriz() {
    var e = urlap.elements, hibak = {};
    if (!e.nev.value.trim()) hibak.nev = UZENET.nev;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.email.value.trim())) hibak.email = UZENET.email;
    if (!e.erkezes.value) hibak.erkezes = UZENET.erkezes;
    if (!e.tavozas.value || (e.erkezes.value && e.tavozas.value <= e.erkezes.value)) hibak.tavozas = UZENET.tavozas;
    if (!e.hozzajarulas.checked) hibak.hozzajarulas = UZENET.hozzajarulas;
    Object.keys(UZENET).forEach(function (n) { mezoHiba(n, hibak[n]); });
    return Object.keys(UZENET).filter(function (n) { return hibak[n]; });
  }
  function jelez(tipus, szoveg) {
    allapot.setAttribute('data-allapot', tipus);
    allapot.textContent = szoveg;
  }

  Object.keys(UZENET).forEach(function (n) {
    var m = urlap.elements[n];
    if (m) m.addEventListener('change', function () { if (m.getAttribute('aria-invalid')) ellenoriz(); });
  });

  urlap.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var hibas = ellenoriz();
    if (hibas.length) {
      jelez('hiba', 'Néhány mező hiányzik vagy hibás, lent jelöltük.');
      urlap.elements[hibas[0]].focus();
      return;
    }
    if (urlap.elements.botcheck && urlap.elements.botcheck.checked) return;
    if (urlap.elements.access_key.value === HELYORZO) {
      jelez('hiba', 'Az online érdeklődés beállítás alatt van, az üzenet most nem megy el. Hívj minket: ' + TEL + ', vagy írj a happynest.vendeghaz@gmail.com címre.');
      return;
    }
    var gomb = urlap.querySelector('[type=submit]');
    gomb.disabled = true;
    jelez('', 'Küldés folyamatban.');
    fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(urlap) })
      .then(function (v) { return v.json().catch(function () { return {}; }).then(function (j) { return v.ok && j && j.success === true; }); })
      .then(function (siker) {
        if (siker) {
          jelez('ok', 'Köszönjük, megkaptuk az üzeneted. Hamarosan válaszolunk a megadott e-mail-címre.');
          urlap.reset();
          ['erkezes', 'tavozas'].forEach(function (n) { urlap.elements[n].min = ma; });
        } else jelez('hiba', 'Az üzenet nem ment el. Próbáld újra, vagy hívj minket: ' + TEL + '.');
      })
      .catch(function () { jelez('hiba', 'Az üzenet nem ment el. Próbáld újra, vagy hívj minket: ' + TEL + '.'); })
      .then(function () { gomb.disabled = false; });
  });
})();
