/* HappyNest v4 · helyi mintaadat a foglaltsághoz (file:// alatt és ha az API nem ad valódi adatot).
   Ugyanaz az alak, mint a /api/foglaltsag válasza. A mai naphoz igazodik, és determinisztikus:
   ugyanazon a napon mindig ugyanaz. A foglalt elemek éjszakák (a távozás napja szabad). */
(function () {
  function ma() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
    catch (e) { var d = new Date(); return d.toISOString().slice(0, 10); }
  }
  function plusz(iso, n) {
    var p = iso.split('-').map(Number), d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n));
    return d.toISOString().slice(0, 10);
  }
  var t = ma();
  /* foglalt sorozatok a mai naptól számolt eltolással; mindegyik előtt és után van szabad nap */
  var sorozatok = [[2, 3], [6, 7, 8], [13, 14], [19, 20, 21], [27, 28], [34, 35], [40, 41, 42], [48, 49], [55, 56, 57], [62, 63],
    [69, 70], [76, 77, 78], [83, 84], [90, 91, 92], [97, 98], [104, 105], [111, 112, 113], [118, 119], [125, 126, 127], [132, 133],
    [139, 140], [146, 147, 148], [153, 154], [160, 161, 162], [167, 168], [174, 175], [181, 182, 183]];
  var foglalt = [];
  sorozatok.forEach(function (s) { s.forEach(function (n) { foglalt.push(plusz(t, n)); }); });
  window.HN_FOGLALTSAG = { forras: 'minta', frissitve: t + 'T08:00:00+01:00', tol: t, ig: plusz(t, 190), foglalt: foglalt };
})();
