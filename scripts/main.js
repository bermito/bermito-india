/* ==================================================================
   BERMITO.IN — SITE BEHAVIOUR
   No third-party runtime dependencies. One rAF loop drives every
   scroll-linked value; everything else is IntersectionObserver.
   ================================================================== */
(function () {
  'use strict';

  var C = window.BERMITO_CONTENT || {};
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* ================================================================
     1. CONTENT WIRING — links and facts awaiting approval
     Anything unsupplied is removed rather than shown as a placeholder.
     ================================================================ */
  function wireContent() {
    var links = C.links || {};
    $$('[data-link]').forEach(function (a) {
      var url = links[a.getAttribute('data-link')];
      if (url) {
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener';
      } else if (a.hasAttribute('data-optional')) {
        var li = a.closest('li');
        (li || a).remove();
      }
    });

    var year = (C.facts || {}).foundingYear;
    $$('[data-founded]').forEach(function (n) {
      n.textContent = year ? 'EST. ' + year : '';
    });
    $$('[data-founded-line]').forEach(function (n) {
      if (year) n.innerHTML = '<br>' + year;
    });

    var addr = (C.facts || {}).roasteryAddress;
    $$('[data-address]').forEach(function (n) {
      if (addr) { n.textContent = addr; } else { n.remove(); }
    });
  }

  /* ================================================================
     2. LOADER — driven by real asset progress, never longer than 7s
     ================================================================ */
  function runLoader(done) {
    var loader = $('#loader');
    var pct = $('#loaderPct');
    var stageName = $('#loaderStage');
    var stageIdx = $('#loaderIndex');
    var discs = $$('.loader__disc');
    var stages = (C.journey || []).map(function (s) { return { label: s.label, index: s.index }; });
    if (!stages.length) stages = [{ label: 'WORLD', index: '01' }];

    var returning = false;
    try { returning = sessionStorage.getItem('bermito.seen') === '1'; } catch (e) {}
    var minTime = returning ? 700 : 2100;
    var maxTime = returning ? 1600 : 6500;

    if (!loader) { done(); return; }
    if (reduced.matches) { finish(false); return; }

    /* real signals */
    var jobs = [];
    jobs.push(new Promise(function (r) {
      if (document.fonts && document.fonts.ready) { document.fonts.ready.then(r, r); } else { r(); }
    }));
    jobs.push(new Promise(function (r) {
      if (window.BERMITO_GEO) return r();
      var t = setInterval(function () { if (window.BERMITO_GEO) { clearInterval(t); r(); } }, 60);
      setTimeout(function () { clearInterval(t); r(); }, 5000);
    }));
    $$('.loader__word, .hero__word, .site-header__logo img').forEach(function (img) {
      jobs.push(new Promise(function (r) {
        if (img.complete) return r();
        img.addEventListener('load', r, { once: true });
        img.addEventListener('error', r, { once: true });
      }));
    });

    var total = jobs.length, loaded = 0, real = 0;
    jobs.forEach(function (p) { p.then(function () { loaded++; real = loaded / total; }); });

    var start = performance.now(), shown = 0, ended = false;

    (function tick(now) {
      var elapsed = (now || performance.now()) - start;
      var floor = clamp(elapsed / minTime, 0, .92);          // never looks stalled
      var target = Math.max(real, floor);
      shown += (target - shown) * .09;
      if (elapsed > maxTime) shown = 1;
      var v = clamp(shown, 0, 1);

      if (pct) pct.textContent = Math.round(v * 100);
      var si = Math.min(stages.length - 1, Math.floor(v * stages.length));
      if (stageName) stageName.textContent = stages[si].label;
      if (stageIdx) stageIdx.textContent = '/ ' + stages[si].index;
      discs.forEach(function (d, i) {
        d.classList.toggle('is-on', v * discs.length > i);
      });

      if (v >= .999 && real >= 1 && elapsed >= minTime) return finish();
      if (elapsed > maxTime + 400) return finish();
      requestAnimationFrame(tick);
    })();

    var skip = $('#skipJourney');
    if (skip) skip.addEventListener('click', function () { finish(true); });

    function finish(skipped) {
      if (ended) return;
      ended = true;
      try { sessionStorage.setItem('bermito.seen', '1'); } catch (e) {}
      loader.classList.add('is-done');
      document.body.classList.remove('is-loading');
      setTimeout(function () { loader.remove(); }, 800);
      if (skipped) {
        var hero = $('#hero');
        if (hero) hero.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
      done();
    }
  }

  /* ================================================================
     3. STORY — build the sticky media frame + chapter dots
     ================================================================ */
  var story = { chapters: [], frameImgs: [], dots: [], active: -1 };

  function buildStory() {
    var chapters = $$('.chapter');
    var frame = $('#storyFrame');
    var dotList = $('#storyDots');
    if (!chapters.length) return;
    story.chapters = chapters;

    if (frame) {
      chapters.forEach(function (ch, i) {
        var img = document.createElement('img');
        img.src = ch.getAttribute('data-image');
        img.alt = '';
        img.width = 1200; img.height = 1200;
        img.loading = i === 0 ? 'eager' : 'lazy';
        img.decoding = 'async';
        frame.appendChild(img);
        story.frameImgs.push(img);
      });
    }

    if (dotList) {
      chapters.forEach(function (ch, i) {
        var li = document.createElement('li');
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Chapter ' + (i + 1) + ': ' + (ch.getAttribute('data-title') || ''));
        b.addEventListener('click', function () {
          ch.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
        });
        li.appendChild(b);
        dotList.appendChild(li);
        story.dots.push(b);
      });
    }
    setChapter(0);
  }

  function setChapter(i) {
    if (i === story.active || i < 0) return;
    story.active = i;
    story.frameImgs.forEach(function (img, n) { img.classList.toggle('is-on', n === i); });
    story.dots.forEach(function (b, n) {
      if (n === i) { b.setAttribute('aria-current', 'true'); }
      else { b.removeAttribute('aria-current'); }
    });
    var accent = story.chapters[i] && story.chapters[i].getAttribute('data-accent');
    var frame = $('#storyFrame');
    if (frame && accent) frame.style.setProperty('--chapter-accent', 'var(--' + accent + ')');
  }

  /* ================================================================
     4. SCROLL ENGINE — one rAF loop
     ================================================================ */
  function startScroll(map) {
    var journey = $('#map');
    var stage = $('.journey__stage');
    var legend = $$('#journeyLegend li');
    var coord = $('#journeyCoord');
    var hint = $('#journeyHint');
    var enter = $('#enterStory');
    var header = $('#siteHeader');
    var dots = $('.story__dots');
    var finale = $('.finale');
    var stopsN = C.journey ? C.journey.length : 4;
    var ticking = false, lastP = -1;

    function frame() {
      ticking = false;
      var vh = window.innerHeight;

      /* --- map camera --- */
      if (journey && map) {
        var r = journey.getBoundingClientRect();
        var travel = journey.offsetHeight - vh;
        var p = clamp(-r.top / travel, 0, 1) * (stopsN - 1);
        if (Math.abs(p - lastP) > 0.0005) {
          map.render(p);
          lastP = p;

          var idx = clamp(Math.round(p), 0, stopsN - 1);
          legend.forEach(function (li, i) { li.classList.toggle('is-on', i === idx); });
          if (coord) coord.textContent = (C.journey[idx] && C.journey[idx].coord) || '';
          if (hint) hint.classList.toggle('is-hidden', p > .12);
          if (enter) enter.hidden = p < (stopsN - 1) - .04;
        }
      }

      /* --- header --- */
      if (header) {
        var past = window.scrollY > (journey ? journey.offsetHeight - vh * 0.18 : 0);
        header.classList.toggle('is-visible', past);
        header.classList.toggle('is-solid', window.scrollY > (journey ? journey.offsetHeight : 0) + vh * .2);
      }

      /* --- story chapter tracking --- */
      if (story.chapters.length) {
        var mid = vh * .5, best = -1, bestD = Infinity;
        story.chapters.forEach(function (ch, i) {
          var b = ch.getBoundingClientRect();
          var d = Math.abs((b.top + b.height / 2) - mid);
          if (d < bestD) { bestD = d; best = i; }
        });
        var first = story.chapters[0].getBoundingClientRect();
        var last = story.chapters[story.chapters.length - 1].getBoundingClientRect();
        var inStory = first.top < vh * .6 && last.bottom > vh * .4;
        if (dots) dots.classList.toggle('is-visible', inStory);
        if (inStory) setChapter(best);
      }

      /* --- finale resolve --- */
      if (finale) {
        var fb = finale.getBoundingClientRect();
        finale.classList.toggle('is-resolved', fb.top < vh * .35 && fb.bottom > 0);
      }
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('orientationchange', onScroll);
    frame();

    if (enter) {
      enter.addEventListener('click', function () {
        var hero = $('#hero');
        if (hero) hero.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth' });
      });
    }
    if (map && map.marker) {
      map.marker.addEventListener('click', function () {
        var hero = $('#hero');
        if (hero) hero.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth' });
      });
    }
    legend.forEach(function (li, i) {
      li.tabIndex = 0;
      li.setAttribute('role', 'button');
      var go = function () {
        if (!journey) return;
        var travel = journey.offsetHeight - window.innerHeight;
        var y = journey.offsetTop + (i / (stopsN - 1)) * travel;
        window.scrollTo({ top: y, behavior: reduced.matches ? 'auto' : 'smooth' });
      };
      li.addEventListener('click', go);
      li.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      });
    });
  }

  /* ================================================================
     5. REVEALS + TASTING RITUAL
     ================================================================ */
  function observers() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal').forEach(function (n) { n.classList.add('is-in'); });
      $$('.tasting__step').forEach(function (n) { n.classList.add('is-on'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    $$('.reveal').forEach(function (n) { io.observe(n); });

    var steps = $$('.tasting__step');
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = steps.indexOf(e.target);
        setTimeout(function () { e.target.classList.add('is-on'); }, reduced.matches ? 0 : i * 140);
        io2.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -18% 0px' });
    steps.forEach(function (n) { io2.observe(n); });
  }

  /* ================================================================
     6. NAVIGATION
     ================================================================ */
  function nav() {
    var toggle = $('#menuToggle');
    var menu = $('#siteNav');
    var header = $('#siteHeader');
    if (!toggle || !menu) return;

    function close() {
      menu.classList.remove('is-open');
      header.classList.remove('menu-is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    }
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      header.classList.toggle('menu-is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* ================================================================
     BOOT
     ================================================================ */
  function boot() {
    wireContent();
    buildStory();
    observers();
    nav();

    var map = null;
    var root = $('#mapCanvas');
    var stage = $('.journey__stage');

    if (root && window.BermitoMap && window.BERMITO_GEO) {
      map = window.BermitoMap.create({ root: root, stage: stage });
    }
    if (!map) {
      document.body.classList.add('no-map');
    } else if (reduced.matches) {
      /* reduced motion: no camera flight — arrive already in Kozhikode */
      map.render(map.stopCount - 1);
      var j = $('#map');
      if (j) j.style.height = '100svh';
      var hint = $('#journeyHint');
      if (hint) hint.remove();
      var enter = $('#enterStory');
      if (enter) enter.hidden = false;
      $$('#journeyLegend li').forEach(function (li, i) {
        li.classList.toggle('is-on', i === map.stopCount - 1);
      });
      var coord = $('#journeyCoord');
      if (coord && C.journey) coord.textContent = C.journey[C.journey.length - 1].coord || '';
    }

    startScroll(map);

    /* deep links: honour #hash after the loader clears */
    if (location.hash && location.hash.length > 1) {
      var t = document.querySelector(location.hash);
      if (t) setTimeout(function () { t.scrollIntoView({ behavior: 'auto' }); }, 60);
    }
  }

  runLoader(boot);
})();
