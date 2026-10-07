/* ==========================================================================
   App: screen router, device scaling, dev bar
   --------------------------------------------------------------------------
   Public API (window.App):
     App.go('screen-id')   navigate to a screen (pushes onto internal stack)
     App.back()            pop to the previous screen
     App.current()         id of the active screen
   Markup hooks:
     <section class="screen" data-screen="id">   a screen
     <button data-go="id">                       navigate on tap
     <button data-go="back">                     go back
   ========================================================================== */

(function () {
  'use strict';

  const SCREEN_W = 600;
  const SCREEN_H = 1024;
  // ?embed — a frame in compare.html or a handoff page (vN/HANDOFF.html): fit the frame edge
  // to edge, no dev bar, and ignore the saved zoom and 빠른 레시피 선택, so every frame shows
  // the variant it asks for.
  const EMBED = new URLSearchParams(location.search).has('embed');
  const STAGE_PAD = EMBED ? 0 : 24;

  const device = document.getElementById('device');
  const devbar = document.getElementById('devbar');
  // in a frame smaller than 600 × 1024 (a handoff page) the stage's grid track must not grow to the device
  if (EMBED) device.parentElement.style.gridTemplate = 'minmax(0, 1fr) / minmax(0, 1fr)';
  const screens = Array.from(device.querySelectorAll('.screen'));
  const stack = [];

  // -- persisted dev prefs (safe if storage is blocked) ---------------------
  const prefs = {
    get(key, fallback) {
      try { const v = localStorage.getItem('proto:' + key); return v === null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('proto:' + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    }
  };

  // -- 빠른 레시피 선택 (settings) ----------------------------------------------
  // Off = the app as it ships, which is v0. A quick variant with the setting off shows v0
  // and remembers where it came from (?from=v10); turning it back on returns there.
  const pageDir = location.pathname.replace(/[^/]*$/, '');       // /v10/index.html → /v10/
  const pageVariant = pageDir.split('/').filter(Boolean).pop();  // → 'v10'
  const rootDir = pageDir.replace(/[^/]+\/$/, '');                // → /
  const isVariant = /^v\d+$/.test(pageVariant || '');

  function variantUrl(id, extra) {
    const q = new URLSearchParams(location.search);
    q.delete('from');
    Object.entries(extra || {}).forEach(([k, v]) => q.set(k, v));
    const qs = q.toString();
    return rootDir + id + '/' + (qs ? '?' + qs : '') + location.hash;
  }

  // Returns true when it navigated away.
  function applyQuickSelect(opts) {
    if (!isVariant || EMBED) return false;   // embedded frames show the variant they ask for
    const on = prefs.get('quickSelect', true);
    const from = new URLSearchParams(location.search).get('from');
    let target = null;
    if (!on && pageVariant !== 'v0') target = variantUrl('v0', { from: pageVariant });
    else if (on && pageVariant === 'v0' && from) target = variantUrl(from);
    if (!target) return false;
    if (opts && opts.reopenSetting) { try { sessionStorage.setItem('proto:reopenSetting', '1'); } catch (e) { /* ignore */ } }
    location.replace(target);
    return true;
  }
  if (applyQuickSelect()) return;
  // v0 shown in place of a quick variant (setting off) knows which one, so it can carry
  // that variant's header tweaks: <html data-from="v13">.
  { const from = new URLSearchParams(location.search).get('from'); if (from) document.documentElement.dataset.from = from; }

  // -- router ---------------------------------------------------------------
  function screenById(id) {
    return screens.find(s => s.dataset.screen === id) || null;
  }

  function show(id) {
    const next = screenById(id);
    if (!next) { console.warn('[App] no screen named "' + id + '"'); return false; }
    screens.forEach(s => s.classList.toggle('is-active', s === next));
    history.replaceState(null, '', '#' + id);
    const sel = devbar?.querySelector('[data-dev="screen"]');
    if (sel) sel.value = id;
    device.dispatchEvent(new CustomEvent('screenchange', { detail: { id } }));
    return true;
  }

  function go(id) {
    if (id === current()) return;
    if (show(id)) stack.push(id);
  }

  function back() {
    if (stack.length > 1) { stack.pop(); show(stack[stack.length - 1]); }
  }

  function current() {
    return stack[stack.length - 1] || null;
  }

  // Tap delegation for data-go
  device.addEventListener('click', e => {
    const el = e.target.closest('[data-go]');
    if (!el || el.disabled) return;
    const target = el.dataset.go;
    target === 'back' ? back() : go(target);
  });

  // Deep link: #screen-id, else first screen
  const initial = location.hash.slice(1);
  go(screenById(initial) ? initial : screens[0]?.dataset.screen);

  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (id && id !== current()) go(id);
  });

  // -- scaling --------------------------------------------------------------
  // Fit = follow the window; otherwise a fixed zoom (1 = 1:1). − / + step the zoom by 10 %
  // from whatever is on screen, so zooming out from Fit starts at the fitted size.
  const ZOOM_MIN = 0.2, ZOOM_MAX = 2, ZOOM_STEP = 0.1;
  let fitMode = EMBED ? true : prefs.get('fit', true);
  let zoom = EMBED ? 1 : prefs.get('zoom', 1);
  let currentScale = 1;

  function fitScale() {
    const sx = (window.innerWidth - STAGE_PAD * 2) / SCREEN_W;
    const sy = (window.innerHeight - STAGE_PAD * 2) / SCREEN_H;
    return Math.min(sx, sy);
  }

  function applyScale() {
    const scale = fitMode ? fitScale() : zoom;
    currentScale = scale;
    device.style.setProperty('--scale', scale.toFixed(4));
    const btn = devbar?.querySelector('[data-dev="fit"]');
    if (btn) {
      btn.classList.toggle('is-on', fitMode);
      btn.textContent = fitMode ? 'Fit ' + Math.round(scale * 100) + '%' : (zoom === 1 ? '1:1' : Math.round(zoom * 100) + '%');
    }
  }

  function stepZoom(dir) {
    // snap to the 10 % grid, then step
    const snapped = Math.round(currentScale / ZOOM_STEP) * ZOOM_STEP;
    let next = snapped + dir * ZOOM_STEP;
    if (dir < 0 && snapped < currentScale - 0.001) next = snapped;          // Fit 73% → 70%
    if (dir > 0 && snapped > currentScale + 0.001) next = snapped;          // Fit 67% → 70%
    zoom = Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next)) * 100) / 100;
    fitMode = false;
    prefs.set('fit', false);
    prefs.set('zoom', zoom);
    applyScale();
  }

  window.addEventListener('resize', applyScale);
  applyScale();

  // Prototype variants, newest first. Add a folder here and a card in the launcher's
  // index.html to start another one.
  const VARIANTS = [
    { id: 'v14', label: 'v14 · 바텀 시트' },
    { id: 'v13', label: 'v13 · 왼쪽 정렬 + 전환' },
    { id: 'v0', label: 'v0 · 원본 (퀵 버튼 없음)' },
  ];

  // -- dev bar --------------------------------------------------------------
  // an embedded frame (?embed — compare.html, HANDOFF.html) shows the screen only, no dev bar
  if (devbar && EMBED) devbar.classList.add('is-hidden');
  if (devbar && !EMBED) {
    // variant switcher: keeps the query string, so the scenario and quick mode carry over
    const variantSel = devbar.querySelector('[data-dev="variant"]');
    if (variantSel) {
      const here = pageVariant;
      // on v0 because 빠른 레시피 선택 is off: the select keeps showing the variant being viewed
      const from = new URLSearchParams(location.search).get('from');
      if (VARIANTS.some(v => v.id === here)) {
        VARIANTS.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v.id;
          opt.textContent = v.label;
          variantSel.appendChild(opt);
        });
        variantSel.value = (here === 'v0' && VARIANTS.some(v => v.id === from)) ? from : here;
        variantSel.addEventListener('change', () => {
          // with the setting off, a quick variant bounces straight back to v0 (from=…)
          location.href = variantUrl(variantSel.value);
        });
      } else {
        variantSel.remove();
      }
    }

    const sel = devbar.querySelector('[data-dev="screen"]');
    screens.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.dataset.screen;
      opt.textContent = s.dataset.screen;
      sel.appendChild(opt);
    });
    sel.value = current();
    sel.addEventListener('change', () => go(sel.value));

    const fitBtn = devbar.querySelector('[data-dev="fit"]');
    fitBtn.addEventListener('click', () => {
      // Fit → 1:1; any fixed zoom → Fit
      if (fitMode) { fitMode = false; zoom = 1; } else { fitMode = true; }
      prefs.set('fit', fitMode);
      prefs.set('zoom', zoom);
      applyScale();
    });
    // zoom − / + , added here so every variant gets them without touching its markup
    [['-1', '−', 'Zoom out (-)'], ['1', '+', 'Zoom in (+)']].forEach(([dir, label, title], i) => {
      const b = document.createElement('button');
      b.dataset.dev = 'zoom';
      b.dataset.dir = dir;
      b.title = title;
      b.textContent = label;
      b.addEventListener('click', () => stepZoom(Number(dir)));
      if (i === 0) fitBtn.before(b); else fitBtn.after(b);
    });

    const gridBtn = devbar.querySelector('[data-dev="grid"]');
    const setGrid = on => { device.classList.toggle('show-grid', on); gridBtn.classList.toggle('is-on', on); prefs.set('grid', on); };
    gridBtn.addEventListener('click', () => setGrid(!device.classList.contains('show-grid')));
    setGrid(prefs.get('grid', false));

    devbar.querySelector('[data-dev="back"]').addEventListener('click', back);

    if (new URLSearchParams(location.search).has('bare') || EMBED) devbar.classList.add('is-hidden');

    // 비교: open compare.html with this variant next to the one before it (v13 → v12, v13).
    const compareBtn = document.createElement('button');
    compareBtn.dataset.dev = 'compare';
    compareBtn.title = 'Compare variants side by side';
    compareBtn.textContent = '비교';
    compareBtn.addEventListener('click', () => {
      const ids = VARIANTS.map(v => v.id);
      const here = pageVariant;
      const i = ids.indexOf(here);
      const pair = i >= 0 && i + 1 < ids.length ? [ids[i + 1], here] : [here];
      const q = new URLSearchParams(location.search);
      q.delete('from');
      q.set('v', pair.join(','));
      location.href = rootDir + 'compare.html?' + q;
    });
    devbar.querySelector('[data-dev="grid"]').after(compareBtn);

    document.addEventListener('keydown', e => {
      if (e.target.matches('input, textarea, select')) return;
      if (e.key === 'h') devbar.classList.toggle('is-hidden');
      if (e.key === '-' || e.key === '_') stepZoom(-1);
      if (e.key === '=' || e.key === '+') stepZoom(1);
      if (e.key === '0') { fitMode = true; prefs.set('fit', true); applyScale(); }
      if (e.key === 'Escape') back();
    });
  }

  window.App = { go, back, current, applyQuickSelect, VARIANTS };

  // The app's menu overlay and settings page (shared/js/menu.js), loaded next to this file
  // so every variant gets them without touching its own markup. Deferred to the next task,
  // after the variant's cook.js has run and window.Cook (for the language) exists.
  const menuScript = document.createElement('script');
  menuScript.src = new URL('menu.js', document.currentScript.src).href;
  setTimeout(() => document.body.appendChild(menuScript));
})();
