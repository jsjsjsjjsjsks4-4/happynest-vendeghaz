/* =========================================================================
   HappyNest · foglaltság (csak olvasható naptár), sima script, nem ES-modul
   Adatforrás (Caesarral közös felület, TERV.md 5. pont):
     1. http(s) alatt fetch('/api/foglaltsag'), 10 mp timeout (a backend forrásonként 8 mp-ig vár)
     2. ha bukik, vagy a válasz forras mezője nem "ical": window.HN_FOGLALTSAG
        (data/foglaltsag-minta.js), látható „Mintaadat” jelöléssel
     3. kivétel: hiba:true válasz (a források be vannak állítva, de egyik sem elérhető).
        Ilyenkor NINCS minta: üres naptár, és látható szöveg, hogy kérdezzen rá űrlapon vagy telefonon.
   foglalt = foglalt ÉJSZAKÁK; a távozás napja szabad (aznap új vendég érkezhet).
   Foglalni nem lehet: a kijelölés csak az érdeklődő űrlapot tölti elő.
   ========================================================================= */
(function () {
  'use strict';
  var d = document;
  var NAP = 864e5;
  var HONAP = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  var NAPNEV = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
  var NAPROV = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'];
  var HORUV = ['jan.', 'febr.', 'márc.', 'ápr.', 'máj.', 'jún.', 'júl.', 'aug.', 'szept.', 'okt.', 'nov.', 'dec.'];

  function maBudapest() {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    } catch (e) {
      var x = new Date();
      return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2);
    }
  }
  function toUTC(s) { var p = s.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  function hn(s) { return new Date(toUTC(s)).getUTCDay(); }
  function szep(s, ev) {
    var p = s.split('-');
    return (ev ? p[0] + '. ' : '') + HONAP[+p[1] - 1] + ' ' + (+p[2]) + '.';
  }

  /* ---- adat betöltése (egyszer) ---- */
  var igeret = null;
  var IDOKORLAT = 10000;
  var HIBA_SZOVEG = 'A foglaltság most nem tölthető be. Kérdezz rá az űrlapon vagy telefonon: ';
  var TELEFON = '+36 20 372 6984';
  function normal(j) {
    var set = {};
    var forras = j.forras === 'ical' ? 'ical' : (j.hiba === true ? 'hiba' : 'minta');
    if (forras !== 'hiba') (j.foglalt || []).forEach(function (x) { if (/^\d{4}-\d{2}-\d{2}$/.test(x)) set[x] = 1; });
    return { forras: forras, frissitve: j.frissitve || null, tol: j.tol || maBudapest(), ig: j.ig || null, foglalt: set };
  }
  function betolt() {
    if (igeret) return igeret;
    igeret = new Promise(function (resolve) {
      var kesz = false;
      function vege(j) { if (!kesz) { kesz = true; resolve(normal(j)); } }
      function minta() { vege(window.HN_FOGLALTSAG || { forras: 'minta', foglalt: [] }); }
      if (!/^https?:$/.test(location.protocol) || !window.fetch) { minta(); return; }
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var idozito = setTimeout(function () { if (ctrl) ctrl.abort(); minta(); }, IDOKORLAT);
      fetch('/api/foglaltsag', { headers: { Accept: 'application/json' }, cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (j) {
          clearTimeout(idozito);
          if (j && j.forras === 'ical' && Array.isArray(j.foglalt)) vege(j);
          else if (j && j.hiba === true) vege(j); // elérhetetlen források: üres naptár, nem minta
          else minta();
        })
        .catch(function () { clearTimeout(idozito); minta(); });
    });
    return igeret;
  }

  function mintaJel(adat) {
    d.querySelectorAll('[data-minta-jel]').forEach(function (el) {
      el.hidden = adat.forras === 'ical';
      if (adat.forras === 'hiba') {
        el.classList.add('minta-jel--hiba');
        el.textContent = '';
        var t = d.createElement('span'), a = d.createElement('a');
        t.textContent = HIBA_SZOVEG;
        a.href = 'tel:' + TELEFON.replace(/\s/g, '');
        a.textContent = TELEFON;
        t.appendChild(a);
        t.appendChild(d.createTextNode('.'));
        el.appendChild(t);
      }
    });
    d.querySelectorAll('[data-hn-forras]').forEach(function (el) { el.setAttribute('data-hn-forras', adat.forras); });
  }

  /* ---- főoldali sáv: a következő N nap ---- */
  function mini(el, adat) {
    var n = +el.getAttribute('data-hn-mini') || 21;
    var t0 = toUTC(maBudapest());
    var html = '';
    for (var i = 0; i < n; i++) {
      var s = iso(t0 + i * NAP), w = hn(s), f = !!adat.foglalt[s];
      html += '<li class="napsav__nap' + (f ? ' is-foglalt' : '') + (w === 5 || w === 6 ? ' is-hetvege' : '') + '" aria-label="' +
        szep(s) + ', ' + NAPNEV[w] + ': ' + (adat.forras === 'hiba' ? 'foglaltság most nem ismert' : f ? 'foglalt éjszaka' : 'szabad éjszaka') + '">' +
        '<span class="napsav__het" aria-hidden="true">' + NAPROV[w] + '</span><span class="napsav__d" aria-hidden="true">' + (+s.slice(8)) + '</span><span class="napsav__ho" aria-hidden="true">' + (i === 0 || s.slice(8) === '01' ? HORUV[+s.slice(5, 7) - 1] : '') + '</span></li>';
    }
    el.innerHTML = html;
  }

  /* ---- teljes naptár (kapcsolat oldal) ---- */
  function naptar(root, adat) {
    var ma = maBudapest();
    var mp = ma.split('-');
    var MAXELTOLAS = 3;          // 3 látható hónap, előre legfeljebb 6 hónapig
    var eltolas = 0, erk = null, tav = null;
    var doboz = root.querySelector('[data-cal-honapok]');
    var elozo = root.querySelector('[data-cal-elozo]');
    var kov = root.querySelector('[data-cal-kovetkezo]');
    var osszeg = root.querySelector('[data-cal-osszeg]');
    var hiba = root.querySelector('[data-cal-hiba]');
    var torol = root.querySelector('[data-cal-torol]');
    var frissult = root.querySelector('[data-cal-frissult]');
    var fokusz = null;

    if (frissult) {
      if (adat.forras === 'ical' && adat.frissitve) {
        var f = new Date(adat.frissitve);
        frissult.textContent = 'Frissítve: ' + szep(adat.frissitve.slice(0, 10)) + ' ' + ('0' + f.getHours()).slice(-2) + ':' + ('0' + f.getMinutes()).slice(-2);
        frissult.hidden = false;
      } else frissult.hidden = true;
    }

    function honapNap(ev, ho) { return new Date(Date.UTC(ev, ho + 1, 0)).getUTCDate(); }
    function szabadE(a, b) { // a..b-1 éjszakák
      for (var t = toUTC(a); t < toUTC(b); t += NAP) if (adat.foglalt[iso(t)]) return false;
      return true;
    }
    function allapotSzoveg(s) {
      if (s < ma) return 'elmúlt nap';
      var parts = [];
      if (s === erk) parts.push('érkezés, kijelölve');
      if (s === tav) parts.push('távozás, kijelölve');
      if (erk && tav && s > erk && s < tav) parts.push('kijelölt éjszaka');
      parts.push(adat.forras === 'hiba' ? 'foglaltság most nem ismert' : adat.foglalt[s] ? 'foglalt éjszaka' : 'szabad éjszaka');
      return parts.join(', ');
    }
    function rajzol() {
      var html = '';
      for (var m = 0; m < 3; m++) {
        var ev = +mp[0], ho = +mp[1] - 1 + eltolas + m;
        ev += Math.floor(ho / 12); ho = ((ho % 12) + 12) % 12;
        var elso = new Date(Date.UTC(ev, ho, 1)).getUTCDay();
        var ures = (elso + 6) % 7; // hétfő az első oszlop
        html += '<section class="honap" aria-label="' + ev + '. ' + HONAP[ho] + '"><h3>' + HONAP[ho].charAt(0).toUpperCase() + HONAP[ho].slice(1) + ' <span class="sr-only">' + ev + '</span></h3>' +
          '<div class="honap__fej" aria-hidden="true"><span>H</span><span>K</span><span>Sze</span><span>Cs</span><span>P</span><span>Szo</span><span>V</span></div><div class="honap__napok">';
        for (var u = 0; u < ures; u++) html += '<span class="cal-ures" aria-hidden="true"></span>';
        var n = honapNap(ev, ho);
        for (var nap = 1; nap <= n; nap++) {
          var s = ev + '-' + ('0' + (ho + 1)).slice(-2) + '-' + ('0' + nap).slice(-2);
          var cls = 'cal-nap';
          var mult = s < ma;
          if (mult) cls += ' is-mult';
          else if (adat.foglalt[s]) cls += ' is-foglalt';
          if (s === ma) cls += ' is-ma';
          if (s === erk) cls += ' is-erk';
          if (s === tav) cls += ' is-tav';
          if (erk && tav && s > erk && s < tav) cls += ' is-kozte';
          html += '<button type="button" class="' + cls + '" data-nap="' + s + '"' + (mult ? ' disabled' : '') +
            ' aria-label="' + szep(s, true) + ', ' + NAPNEV[hn(s)] + ': ' + allapotSzoveg(s) + '"><span aria-hidden="true">' + nap + '</span></button>';
        }
        html += '</div></section>';
      }
      doboz.innerHTML = html;
      if (elozo) elozo.disabled = eltolas <= 0;
      if (kov) kov.disabled = eltolas >= MAXELTOLAS;
      if (fokusz) {
        var b = doboz.querySelector('[data-nap="' + fokusz + '"]');
        if (b && !b.disabled) b.focus();
        fokusz = null;
      }
      frissitOsszeg();
    }
    function frissitOsszeg() {
      if (!osszeg) return;
      if (erk && tav) {
        var ej = Math.round((toUTC(tav) - toUTC(erk)) / NAP);
        osszeg.textContent = 'Érkezés: ' + szep(erk) + ', ' + NAPNEV[hn(erk)] + '. Távozás: ' + szep(tav) + ', ' + NAPNEV[hn(tav)] + '. ' + ej + ' éjszaka.';
      } else if (erk) {
        osszeg.textContent = 'Érkezés: ' + szep(erk) + ', ' + NAPNEV[hn(erk)] + '. Most válaszd ki a távozás napját.';
      } else {
        osszeg.textContent = 'Kattints az érkezés, majd a távozás napjára. A kijelölés nem foglalás, csak az érdeklődő űrlapot tölti ki.';
      }
      if (torol) torol.hidden = !erk;
    }
    function uzen(t) { if (hiba) { hiba.textContent = t || ''; hiba.hidden = !t; } }
    function valaszt(s) {
      uzen('');
      if (s < ma) return;
      if (!erk || tav || s <= erk) {
        if (adat.foglalt[s]) { uzen('Ez az éjszaka foglalt, erre a napra nem lehet érkezni.'); return; }
        erk = s; tav = null;
      } else {
        if (!szabadE(erk, s)) { uzen('A kijelölt időszakban van foglalt éjszaka. Válassz korábbi távozást vagy másik érkezést.'); return; }
        tav = s;
      }
      fokusz = s;
      rajzol();
      root.dispatchEvent(new CustomEvent('hn:kijeloles', { detail: { erkezes: erk, tavozas: tav } }));
    }
    doboz.addEventListener('click', function (e) {
      var b = e.target.closest('[data-nap]');
      if (b && !b.disabled) valaszt(b.getAttribute('data-nap'));
    });
    // nyilak: nap és hét léptetése a látható napok között
    doboz.addEventListener('keydown', function (e) {
      var b = e.target.closest('[data-nap]');
      if (!b) return;
      var lep = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
      if (!lep) return;
      var cel = iso(toUTC(b.getAttribute('data-nap')) + lep * NAP);
      var c = doboz.querySelector('[data-nap="' + cel + '"]');
      if (c && !c.disabled) { e.preventDefault(); c.focus(); }
    });
    if (elozo) elozo.addEventListener('click', function () { if (eltolas > 0) { eltolas--; rajzol(); } });
    if (kov) kov.addEventListener('click', function () { if (eltolas < MAXELTOLAS) { eltolas++; rajzol(); } });
    if (torol) torol.addEventListener('click', function () { erk = tav = null; uzen(''); rajzol(); root.dispatchEvent(new CustomEvent('hn:kijeloles', { detail: { erkezes: null, tavozas: null } })); });
    rajzol();
    root.hnKijeloles = function () { return { erkezes: erk, tavozas: tav }; };
  }

  function indit() {
    var minik = d.querySelectorAll('[data-hn-mini]');
    var nagyok = d.querySelectorAll('[data-hn-naptar]');
    if (!minik.length && !nagyok.length) return;
    betolt().then(function (adat) {
      mintaJel(adat);
      minik.forEach(function (el) { mini(el, adat); });
      nagyok.forEach(function (el) { naptar(el, adat); });
      d.documentElement.setAttribute('data-hn-forras', adat.forras);
    });
  }
  window.HNFoglaltsag = { betolt: betolt, ma: maBudapest };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', indit); else indit();
})();
