/* =========================================================================
   HappyNest · MINTAADAT a foglaltság-naptárhoz
   NEM valódi foglalás. Akkor látszik, ha nincs élő iCal-adat (file:// alatt
   mindig, http(s) alatt akkor, ha a /api/foglaltsag nem ad "ical" forrást).
   A tartomány a mai naphoz (Europe/Budapest) igazodik, így nem avul el;
   a minta egy adott naptári napra mindig ugyanaz (a dátumból számolt álvéletlen).
   Alak: { forras, frissitve, tol, ig, foglalt: ["YYYY-MM-DD", ...] }
   foglalt = foglalt ÉJSZAKÁK (érkezés napjától a távozás előtti napig).
   ========================================================================= */
(function () {
  'use strict';
  function maBudapest() {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    } catch (e) {
      var d = new Date();
      return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    }
  }
  function toUTC(s) { var p = s.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }
  var NAP = 864e5;
  // determinisztikus álvéletlen a dátum-szövegből (FNV-1a)
  function rnd(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ((h >>> 0) % 10000) / 10000;
  }
  var tol = maBudapest();
  var t0 = toUTC(tol);
  var p = tol.split('-');
  var igT = Date.UTC(+p[0], +p[1] - 1 + 6, +p[2]);
  var foglalt = {};
  // 14 nappal korábbról indul, hogy a hónap eleje se legyen üres
  for (var t = t0 - 14 * NAP; t < igT; t += NAP) {
    var s = iso(t);
    if (foglalt[s]) continue;
    var hn = new Date(t).getUTCDay(); // 0 vasárnap ... 5 péntek, 6 szombat
    var md = s.slice(5);
    var esely = hn === 5 ? 0.58 : hn === 6 ? 0.36 : hn === 4 ? 0.14 : 0.07;
    if (md === '12-30' || md === '12-31' || md === '12-24' || md === '12-25') esely = 0.92;
    var r = rnd('hn-' + s);
    if (r >= esely) continue;
    var hossz = hn === 5 ? 2 : hn === 6 ? 1 : 2 + Math.floor(rnd('h-' + s) * 3);
    if (md === '12-30') hossz = 3;
    for (var k = 0; k < hossz; k++) foglalt[iso(t + k * NAP)] = 1;
  }
  var lista = Object.keys(foglalt).filter(function (d) { var x = toUTC(d); return x >= t0 && x < igT; }).sort();
  window.HN_FOGLALTSAG = {
    forras: 'minta',
    frissitve: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    tol: tol,
    ig: iso(igT),
    foglalt: lista
  };
})();
