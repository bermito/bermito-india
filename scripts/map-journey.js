/* ==================================================================
   BERMITO — MAP JOURNEY
   A scroll-linked camera flight over accurate vector geography:
   WORLD → INDIA → KERALA → KOZHIKODE.

   Geometry: Natural Earth 1:110m land, 1:50m countries, 1:10m
   countries and admin-1 boundaries. Public domain. No Google Earth
   or Google Maps imagery is used, recorded or reproduced.

   Projection: Web-Mercator-style, computed at build time into a
   single coordinate space so the camera is a pure transform.
   ================================================================== */

window.BermitoMap = (function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var VIEW = 1000;                       // internal viewport units

  function mercY(lat) {
    lat = Math.max(-83, Math.min(83, lat));
    return -(180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));
  }

  function el(name, attrs) {
    var n = document.createElementNS(SVG_NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ramp(x, a, b) → 0 below a, 1 above b, smooth between */
  function ramp(x, a, b) {
    var t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function hexToRgb(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  function mixHex(a, b, t) {
    var A = hexToRgb(a), B = hexToRgb(b);
    return 'rgb(' + Math.round(lerp(A[0], B[0], t)) + ',' +
      Math.round(lerp(A[1], B[1], t)) + ',' + Math.round(lerp(A[2], B[2], t)) + ')';
  }

  /* --- camera --------------------------------------------------- */
  function cameraFor(bounds) {
    var x0 = bounds[0], x1 = bounds[2];
    var y0 = mercY(bounds[3]), y1 = mercY(bounds[1]);
    var w = x1 - x0, h = y1 - y0;
    // cover: the aperture is circular, so fill the shorter axis
    var scale = Math.max(VIEW / w, VIEW / h);
    return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, scale: scale };
  }

  function build(root, content, geo) {
    var svg = el('svg', {
      viewBox: '0 0 ' + VIEW + ' ' + VIEW,
      preserveAspectRatio: 'xMidYMid slice',
      focusable: 'false'
    });
    svg.setAttribute('aria-hidden', 'true');

    var camera = el('g', { id: 'mapCamera' });
    svg.appendChild(camera);

    var layers = {};
    function layer(id, d, cls) {
      var g = el('g', { class: cls, opacity: '0' });
      g.appendChild(el('path', { d: d }));
      camera.appendChild(g);
      layers[id] = g;
      return g;
    }

    layer('world', geo.world, 'lyr lyr--land');
    layer('neighbours', geo.neighbours, 'lyr lyr--neighbour');
    layer('india', geo.india, 'lyr lyr--land');
    layer('states', geo.indiaStates, 'lyr lyr--line');
    layer('near', geo.nearStates, 'lyr lyr--neighbour');
    layer('keralaMid', geo.keralaMid, 'lyr lyr--kerala');
    layer('keralaHi', geo.keralaHi, 'lyr lyr--kerala');

    root.appendChild(svg);

    /* marker: Bermito's stacked tasting mark, as an HTML control so it
       is keyboard reachable and screen-reader labelled. */
    var mk = content.marker;
    var marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'map-marker';
    marker.setAttribute('aria-label', 'Bermito, Kozhikode — open the story');
    marker.innerHTML =
      '<span class="map-marker__stack" aria-hidden="true">' +
      '<i style="height:10px"></i><i style="height:8px"></i>' +
      '<i style="height:5px"></i><i style="height:2px"></i></span>' +
      '<span class="map-marker__text">' + mk.label +
      '<em>' + mk.sub + '</em></span>';
    root.appendChild(marker);

    return { svg: svg, camera: camera, layers: layers, marker: marker };
  }

  function create(opts) {
    var geo = window.BERMITO_GEO;
    var content = window.BERMITO_CONTENT;
    if (!geo || !opts.root) return null;

    var parts = build(opts.root, content, geo);
    var stops = content.journey.map(function (s) { return cameraFor(s.bounds); });
    var mk = content.facts.roasteryCoords || content.marker;
    var mkX = mk.lon, mkY = mercY(mk.lat);

    var api = {
      stopCount: stops.length,
      marker: parts.marker,

      /* p ranges 0 … stops.length-1 */
      render: function (p) {
        p = clamp(p, 0, stops.length - 1);
        var i = Math.min(Math.floor(p), stops.length - 2);
        var t = p - i;
        t = t * t * (3 - 2 * t);                       // ease within a leg
        var a = stops[i], b = stops[i + 1];

        var scale = Math.exp(lerp(Math.log(a.scale), Math.log(b.scale), t));
        var cx = lerp(a.cx, b.cx, t);
        var cy = lerp(a.cy, b.cy, t);

        parts.camera.setAttribute('transform',
          'translate(' + (VIEW / 2) + ' ' + (VIEW / 2) + ') scale(' +
          scale.toFixed(6) + ') translate(' + (-cx).toFixed(6) + ' ' + (-cy).toFixed(6) + ')');

        var L = parts.layers;
        L.world.setAttribute('opacity', (1 - ramp(p, 0.55, 1.15)).toFixed(3));
        L.neighbours.setAttribute('opacity', (ramp(p, 0.35, 1) * (1 - ramp(p, 2.15, 2.7))).toFixed(3));
        L.india.setAttribute('opacity', (ramp(p, 0.4, 1) * (1 - ramp(p, 2.0, 2.5))).toFixed(3));
        L.states.setAttribute('opacity', (ramp(p, 1.1, 1.6) * (1 - ramp(p, 2.0, 2.4))).toFixed(3));
        L.keralaMid.setAttribute('opacity', (ramp(p, 1.35, 1.9) * (1 - ramp(p, 2.55, 2.9))).toFixed(3));
        L.keralaHi.setAttribute('opacity', ramp(p, 2.4, 2.85).toFixed(3));
        L.near.setAttribute('opacity', ramp(p, 2.2, 2.7).toFixed(3));

        /* terrain → brand colour transition */
        var st = opts.stage.style;
        var k = p / (stops.length - 1);
        var ocean = k < .5 ? mixHex('#2C313C', '#3B3B3E', k / .5) : mixHex('#3B3B3E', '#51453D', (k - .5) / .5);
        var land = k < .5 ? mixHex('#9BAFAB', '#D5D8B8', k / .5) : mixHex('#D5D8B8', '#FFE212', (k - .5) / .5);
        st.setProperty('--ocean', ocean);
        st.setProperty('--land', land);

        /* aperture: holds a circle through the journey, then opens */
        var base = lerp(60, 82, ramp(p, 0, 2.5));
        var open = ramp(p, 2.76, 3) * 62;
        opts.stage.style.setProperty('--ap', (base + open).toFixed(2) + 'vmin');

        /* marker position, projected through the live camera */
        var mvis = ramp(p, 1.9, 2.45);
        if (mvis > 0.01) {
          var sx = (VIEW / 2 + (mkX - cx) * scale) / VIEW * 100;
          var sy = (VIEW / 2 + (mkY - cy) * scale) / VIEW * 100;
          parts.marker.style.left = sx.toFixed(3) + '%';
          parts.marker.style.top = sy.toFixed(3) + '%';
          parts.marker.style.opacity = mvis.toFixed(3);
          parts.marker.hidden = false;
        } else {
          parts.marker.style.opacity = '0';
          parts.marker.hidden = true;
        }
      }
    };

    return api;
  }

  return { create: create, mercY: mercY };
})();
