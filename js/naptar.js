/* HappyNest v4 · foglaltság: közös betöltés (egy ígéret oldalanként) és a főoldali 21 napos sáv.
   Szerződés: weboldal-4/functions/SZERZODES.md (3. és 4. rész). Csak data-attribútumokra épül. */
(function () {
  'use strict';
  var TEL = '+36 20 372 6984', TEL_HREF = 'tel:+36203726984';
  var HIBA_SZOVEG = 'A foglaltság most nem tölthető be. Kérdezz rá az űrlapon vagy telefonon: ';
  var HONAPOK = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
  var NAPNEV = ['vasárnap', 'hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat'];
  var NAPROVID = ['V', 'H', 'K', 'Sze', 'Cs', 'P', 'Szo'];

  function ma() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function datum(iso) { var p = iso.split('-').map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])); }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function plusz(s, n) { var d = datum(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
  function hetnap(s) { return datum(s).getUTCDay(); }
  function cimke(s) { var d = datum(s); return d.getUTCFullYear() + '. ' + HONAPOK[d.getUTCMonth()] + ' ' + d.getUTCDate() + '., ' + NAPNEV[d.getUTCDay()]; }

  function tisztit(lista) {
    var k = {};
    (Array.isArray(lista) ? lista : []).forEach(function (x) { if (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)) k[x] = 1; });
    return k;
  }
  function minta() {
    var m = window.HN_FOGLALTSAG || { foglalt: [] };
    return { forras: 'minta', foglalt: tisztit(m.foglalt), frissitve: m.frissitve || null };
  }

  /* egy ígéret oldalanként; file:// alatt nincs hívás */
  var igeret = null;
  function betolt() {
    if (igeret) return igeret;
    igeret = new Promise(function (kesz) {
      var volt = false;
      var vissza = function (x) { if (volt) return; volt = true; document.documentElement.setAttribute('data-hn-forras', x.forras); kesz(x); };
      if (location.protocol === 'file:' || typeof fetch !== 'function') { vissza(minta()); return; }
      var ac = typeof AbortController === 'function' ? new AbortController() : null;
      var ido = setTimeout(function () { if (ac) ac.abort(); vissza(minta()); }, 10000);
      fetch('/api/foglaltsag', { headers: { Accept: 'application/json' }, cache: 'no-store', signal: ac ? ac.signal : undefined })
        .then(function (v) { if (!v.ok) throw new Error('HTTP ' + v.status); return v.json(); })
        .then(function (j) {
          clearTimeout(ido);
          if (j && j.hiba === true && j.forras !== 'ical') { vissza({ forras: 'hiba', foglalt: {}, frissitve: null }); return; }
          if (j && j.forras === 'ical' && Array.isArray(j.foglalt)) { vissza({ forras: 'ical', foglalt: tisztit(j.foglalt), frissitve: j.frissitve || null }); return; }
          vissza(minta());
        })
        .catch(function () { clearTimeout(ido); vissza(minta()); });
    });
    return igeret;
  }

  function allapot(adat, s, t) {
    if (s < t) return 'mult';
    if (adat.forras === 'hiba') return 'ismeretlen';
    return adat.foglalt[s] ? 'foglalt' : 'szabad';
  }
  var ALLAPOT_SZO = { szabad: 'szabad éjszaka', foglalt: 'foglalt éjszaka', ismeretlen: 'foglaltság most nem ismert', mult: 'elmúlt nap' };

  /* a jelölés a minta vagy a hiba helyén; ical forrásnál rejtett */
  function jeloles(gyoker, adat) {
    var jel = gyoker.querySelector('[data-minta-jel]');
    if (!jel) return;
    if (adat.forras === 'ical') { jel.hidden = true; return; }
    jel.hidden = false;
    jel.setAttribute('data-allapot', adat.forras === 'hiba' ? 'hiba' : 'minta');
    if (adat.forras === 'hiba') {
      jel.textContent = HIBA_SZOVEG;
      var a = document.createElement('a'); a.href = TEL_HREF; a.textContent = TEL;
      jel.appendChild(a); jel.appendChild(document.createTextNode('.'));
    } else {
      jel.textContent = 'Mintaadat, a valódi foglaltság hamarosan';
    }
  }

  function sav(gyoker, adat) {
    var lista = gyoker.querySelector('[data-hn-mini]') || gyoker.querySelector('ol,ul');
    if (!lista) return;
    var n = parseInt(lista.getAttribute('data-hn-mini'), 10) || 21, t = ma();
    lista.textContent = '';
    for (var i = 0; i < n; i++) {
      var s = plusz(t, i), all = allapot(adat, s, t), d = datum(s);
      var li = document.createElement('li');
      li.className = 'sav__nap';
      li.setAttribute('data-napsav-nap', s);
      li.setAttribute('data-allapot', all);
      li.setAttribute('aria-label', cimke(s) + ': ' + ALLAPOT_SZO[all]);
      var hn = document.createElement('span'); hn.className = 'sav__hn'; hn.setAttribute('aria-hidden', 'true');
      hn.textContent = NAPROVID[hetnap(s)];
      var sz = document.createElement('span'); sz.className = 'sav__sz'; sz.setAttribute('aria-hidden', 'true'); sz.textContent = d.getUTCDate();
      li.appendChild(hn); li.appendChild(sz);
      if (i === 0 || d.getUTCDate() === 1) {
        var ho = document.createElement('span'); ho.className = 'sav__ho'; ho.setAttribute('aria-hidden', 'true');
        ho.textContent = HONAPOK[d.getUTCMonth()].slice(0, 3) + '.'; li.appendChild(ho);
      }
      lista.appendChild(li);
    }
    jeloles(gyoker, adat);
  }

  window.HNFoglaltsag = { ma: ma, betolt: betolt, plusz: plusz, datum: datum, cimke: cimke, allapot: allapot, jeloles: jeloles, ALLAPOT_SZO: ALLAPOT_SZO, HONAPOK: HONAPOK };

  function indit() {
    var savok = document.querySelectorAll('[data-hn-sav]');
    if (!savok.length && !document.querySelector('[data-hn-naptar]')) return;
    betolt().then(function (adat) { for (var i = 0; i < savok.length; i++) sav(savok[i], adat); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', indit); else indit();
})();
