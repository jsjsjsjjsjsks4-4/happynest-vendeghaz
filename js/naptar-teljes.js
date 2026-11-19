/* HappyNest v4 · teljes, csak olvasható naptár (kapcsolat.html). A közös betöltést a naptar.js adja
   (window.HNFoglaltsag). Szerződés: functions/SZERZODES.md 3.1-3.3 és 4.2. Foglalni nem lehet:
   a kijelölés csak az érdeklődő űrlapot tölti elő. */
(function () {
  'use strict';
  var F = window.HNFoglaltsag;
  var gyoker = document.querySelector('[data-hn-naptar]');
  if (!F || !gyoker) return;
  var NAPNEV = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];

  function kulonbseg(a, b) { return Math.round((F.datum(b) - F.datum(a)) / 86400000); }
  function szep(s) { var d = F.datum(s); return d.getUTCFullYear() + '. ' + F.HONAPOK[d.getUTCMonth()] + ' ' + d.getUTCDate() + '.'; }
  function rovid(s) { var d = F.datum(s); return F.HONAPOK[d.getUTCMonth()] + ' ' + d.getUTCDate() + '.'; }

  function indit(adat) {
    var maiNap = F.ma(), eltolas = 0, MAX = 3, erk = null, tav = null;
    var tarolo = gyoker.querySelector('[data-cal-honapok]');
    var elozo = gyoker.querySelector('[data-cal-elozo]');
    var kov = gyoker.querySelector('[data-cal-kovetkezo]');
    var osszeg = gyoker.querySelector('[data-cal-osszeg]');
    var hiba = gyoker.querySelector('[data-cal-hiba]');
    var torol = gyoker.querySelector('[data-cal-torol]');
    var erdek = gyoker.querySelector('[data-cal-erdeklodes]');
    var frissult = gyoker.querySelector('[data-cal-frissult]');

    F.jeloles(gyoker, adat);
    if (frissult) {
      if (adat.forras === 'ical' && adat.frissitve) {
        var sz;
        try { sz = new Intl.DateTimeFormat('hu-HU', { timeZone: 'Europe/Budapest', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(adat.frissitve)); }
        catch (e) { sz = adat.frissitve; }
        frissult.textContent = 'Frissítve: ' + sz;
        frissult.hidden = false;
      } else frissult.hidden = true;
    }

    function hibat(s) {
      if (!hiba) return;
      if (s) { hiba.textContent = s; hiba.hidden = false; } else { hiba.hidden = true; hiba.textContent = ''; }
    }
    function vanFoglalt(a, b) { for (var d = a; d < b; d = F.plusz(d, 1)) if (adat.foglalt[d]) return true; return false; }

    function honap(ev, ho) {
      var elso = new Date(Date.UTC(ev, ho, 1));
      var kulcs = elso.toISOString().slice(0, 7);
      var napok = new Date(Date.UTC(ev, ho + 1, 0)).getUTCDate();
      var ures = (elso.getUTCDay() + 6) % 7;
      var h = '<div class="ho" data-naptar-honap="' + kulcs + '"><h3 class="ho__cim cimke" data-naptar-honap-cim>' + ev + '. ' + F.HONAPOK[ho] + '</h3><div class="ho__racs">';
      ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'].forEach(function (n) { h += '<span class="ho__hn" aria-hidden="true">' + n + '</span>'; });
      for (var u = 0; u < ures; u++) h += '<span aria-hidden="true"></span>';
      for (var n = 1; n <= napok; n++) {
        var d = kulcs + '-' + (n < 10 ? '0' + n : n);
        var a = F.allapot(adat, d, maiNap), k = null;
        if (erk && d === erk) k = 'erkezes';
        else if (tav && d === tav) k = 'tavozas';
        else if (erk && tav && d > erk && d < tav) k = 'kozte';
        var elo = k === 'erkezes' ? 'érkezés, kijelölve, ' : k === 'tavozas' ? 'távozás, kijelölve, ' : k === 'kozte' ? 'kijelölt éjszaka, ' : '';
        var dt = F.datum(d);
        var cimke = dt.getUTCFullYear() + '. ' + F.HONAPOK[dt.getUTCMonth()] + ' ' + n + '., ' + NAPNEV[dt.getUTCDay()] + ': ' + elo + F.ALLAPOT_SZO[a];
        h += '<button type="button" class="ho__nap" data-naptar-nap="' + d + '" data-allapot="' + a + '"' +
          (k ? ' data-kijeloles="' + k + '" aria-pressed="true"' : '') + (a === 'mult' ? ' disabled' : '') +
          ' aria-label="' + cimke + '"><span data-naptar-szam aria-hidden="true">' + n + '</span></button>';
      }
      return h + '</div></div>';
    }

    function rajzol(fokusz) {
      var p = maiNap.split('-'), ev = +p[0], ho = +p[1] - 1 + eltolas, html = '';
      for (var i = 0; i < 3; i++) { var t = new Date(Date.UTC(ev, ho + i, 1)); html += honap(t.getUTCFullYear(), t.getUTCMonth()); }
      tarolo.innerHTML = html;
      if (elozo) elozo.disabled = eltolas <= 0;
      if (kov) kov.disabled = eltolas >= MAX;
      if (torol) torol.hidden = !erk;
      if (osszeg) {
        if (erk && tav) osszeg.textContent = 'Érkezés: ' + szep(erk) + ', távozás: ' + rovid(tav) + ' Összesen ' + kulonbseg(erk, tav) + ' éjszaka.';
        else if (erk) osszeg.textContent = 'Érkezés: ' + szep(erk) + ' Most válaszd ki a távozás napját.';
        else osszeg.textContent = 'Válaszd ki az érkezés napját, majd a távozásét. A kijelölés csak az érdeklődő űrlapot tölti ki, foglalni itt nem lehet.';
      }
      if (fokusz) {
        var cel = tarolo.querySelector('[data-naptar-nap="' + fokusz + '"]');
        if (cel && !cel.disabled) cel.focus({ preventScroll: true });
      }
    }

    tarolo.addEventListener('click', function (ev) {
      var g = ev.target.closest('[data-naptar-nap]');
      if (!g || g.disabled) return;
      var d = g.getAttribute('data-naptar-nap'), foglalt = g.getAttribute('data-allapot') === 'foglalt';
      if (!erk || tav || d <= erk) {
        if (foglalt) { hibat('Ez az éjszaka foglalt, erre a napra nem lehet érkezni.'); return; }
        erk = d; tav = null; hibat('');
      } else if (vanFoglalt(erk, d)) {
        hibat('A kijelölt időszakban van foglalt éjszaka. Válassz korábbi távozást vagy másik érkezést.');
        return;
      } else { tav = d; hibat(''); }
      rajzol(d);
    });
    tarolo.addEventListener('keydown', function (ev) {
      var lep = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[ev.key];
      var g = ev.target.closest && ev.target.closest('[data-naptar-nap]');
      if (!lep || !g) return;
      var cel = tarolo.querySelector('[data-naptar-nap="' + F.plusz(g.getAttribute('data-naptar-nap'), lep) + '"]');
      if (cel && !cel.disabled) { ev.preventDefault(); cel.focus(); }
    });
    if (elozo) elozo.addEventListener('click', function () { if (eltolas > 0) { eltolas--; rajzol(); if (elozo.disabled && kov) kov.focus(); } });
    if (kov) kov.addEventListener('click', function () { if (eltolas < MAX) { eltolas++; rajzol(); if (kov.disabled && elozo) elozo.focus(); } });
    if (torol) torol.addEventListener('click', function () { erk = tav = null; hibat(''); rajzol(); });
    if (erdek) erdek.addEventListener('click', function (ev) {
      var urlap = document.querySelector('form[data-urlap]');
      if (!urlap) return;
      ev.preventDefault();
      if (erk) urlap.elements.erkezes.value = erk;
      if (tav) urlap.elements.tavozas.value = tav;
      var cel = urlap.closest('section') || urlap;
      if (window.HNLenis) window.HNLenis.scrollTo(cel, { offset: -80 });
      else cel.scrollIntoView({ behavior: 'auto', block: 'start' });
      setTimeout(function () { urlap.elements.nev.focus({ preventScroll: true }); }, window.HNLenis ? 900 : 0);
    });
    rajzol();
  }

  F.betolt().then(function (adat) {
    var b = gyoker.querySelector('[data-cal-betolt]'); if (b) b.remove();
    indit(adat);
  });
})();
