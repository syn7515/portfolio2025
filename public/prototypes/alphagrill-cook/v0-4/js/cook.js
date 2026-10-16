/* ==========================================================================
   cook.js — 조리 탭 준비 중(PREHEAT) / 준비 완료(READY) 화면 동작
   --------------------------------------------------------------------------
   Ported from fw-app-tauri-AlphaGrill (main @ b9ebd24):
     features/cook/components/screens/cook-preheat-screen.tsx, cook-ready-screen.tsx,
       cook-select-recipe-screen.tsx
     features/cook/components/cook-tick-ring.tsx + lib/tick-ring-geometry.ts
     features/cook/lib/utils.ts            (computeCookStatusTemps)
     features/recipe/recipe-bottom-sheet/* (list, cook-option list, pagination)
     api/recipe/recipe.mock.ts             (recipes)
     e2e/mocks/stm.ts                      (scenario temps / heat presets)

   Prototype addition (not in the app):
     - Temperature simulation: changing the recipe re-snapshots t0 and drifts
       the sensors toward the new targets, so READY → PREHEAT → READY plays out
       the way the firmware would drive it.

   Public API (window.Cook):
     Cook.setScenario('ready')      switch mock state (see SCENARIOS)
     Cook.setLang('en')             ko | en
     Cook.state, Cook.render()
   URL: ?scenario=ready&lang=en
   ========================================================================== */

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  // ── Strings (src/locales/ko.json, en.json) ───────────────────────────────
  const STRINGS = {
    ko: {
      preparing: '준비 중',
      ready: '준비 완료',
      placeFood: '음식을 올리고 조리를 시작하세요',
      selectRecipe: '레시피를 선택하세요',
      openRecipePicker: '레시피 선택',
      heatingUp: '가열 중',
      coolingDown: '온도 최적화 중',
      remaining: '남음',
      changeRecipe: '레시피 변경',
      unload: '배출',
      quickClean: '간이 청소',
      startCooking: '조리 시작',
      grill: '그릴',
      clean: '마감 청소',
      recipe: '레시피',
      prev: '이전',
      next: '다음',
      cookOptionCount: (n) => `조리 설정 ${n}`,
      temperatureTitle: '온도',
      griddleLabel: '그리들',
      currentLabel: '현재',
      topPlate: '상판',
      bottomPlate: '하판',
    },
    en: {
      preparing: 'PREPARING',
      ready: 'READY TO COOK',
      placeFood: 'Place food on the grill and start',
      selectRecipe: 'Select a recipe',
      openRecipePicker: 'Select recipe',
      heatingUp: 'Heating',
      coolingDown: 'Cooling down',
      remaining: 'remaining',
      changeRecipe: 'Recipe',   // v0-2: shorter label (app: 'Change recipe')
      unload: 'Unload',
      quickClean: 'Scrape',
      startCooking: 'Start cooking',
      grill: 'Grill',
      clean: 'Clean',
      recipe: 'Recipe',
      prev: 'Prev',
      next: 'Next',
      cookOptionCount: (n) => `${n} setups`,
      temperatureTitle: 'Temperature',
      griddleLabel: 'Griddle',
      currentLabel: 'Current',
      topPlate: 'Upper',
      bottomPlate: 'Lower',
    },
  };

  // ── Recipes (src/api/recipe/recipe.mock.ts) ──────────────────────────────
  // cookOptions: { id, name, top, bot, cookingSec, meltingSec, thickness, withoutArm }
  // withoutArm = 배출(auto-unload) default for that option; selecting it sets the
  // toggle, the user can override. The app mock has false everywhere; Salmon and
  // Tenderloin 레어 are true here so the default-OFF case is visible.
  // NOTE: 불고기 패티 is top 25 / bot 230 in the app mock (looks like a typo);
  //       250 here so the default preheat scenario reads "heating up".
  // NOTE: ids 4–6 are extra (from e2e/mocks/recipe.ts presets) so the recipe
  //       grid has more than one page to demonstrate paging.
  // v0-2: the recipe list from the reference video (grill-2.mov): five single-setup recipes
  // on one page. Plate targets are mock values (°C internally).
  const RECIPES = [
    { id: 1, name: '6oz Pork',  cookOptions: [{ id: 1, name: 'default', top: 250, bot: 230, cookingSec: 240, meltingSec: 0, thickness: 25 }] },
    { id: 2, name: '8oz Pork',  cookOptions: [{ id: 2, name: 'default', top: 250, bot: 230, cookingSec: 300, meltingSec: 0, thickness: 32 }] },
    { id: 3, name: '6oz Beef',  cookOptions: [{ id: 3, name: 'default', top: 260, bot: 240, cookingSec: 180, meltingSec: 0, thickness: 22 }] },
    { id: 4, name: '8oz Beef',  cookOptions: [{ id: 4, name: 'default', top: 260, bot: 240, cookingSec: 220, meltingSec: 0, thickness: 28 }] },
    { id: 5, name: 'Chicken',   cookOptions: [{ id: 5, name: 'default', top: 230, bot: 210, cookingSec: 360, meltingSec: 0, thickness: 20 }] },
  ];

  // ── Scenarios (e2e/mocks/stm.ts presets) ─────────────────────────────────
  // temp / t0 keyed by STM temp instance: 0,4 = bottom zone 1,2 · 1,5 = top zone 1,2
  // t0 = sensor snapshot at PREHEAT entry (usePreheatT0) — drives ring progress.
  // heat = heat.current_level keyed by temp_sensor_id (0 = bottom z1, 1 = top z1).
  const READY_MARGIN = { lower: 5, upper: 5 }; // stm mock ready_lower/upper_margin
  const COLD = { 0: 80, 1: 85, 4: 78, 5: 82 };
  const SCENARIOS = {
    preheatCold:        { label: 'Preheat · cold',         state: 'preheat', temp: COLD,                          t0: COLD,                          heat: { 0: 80,  1: 85 } },
    preheatMid:         { label: 'Preheat · ~50%',         state: 'preheat', temp: { 0: 148, 1: 152, 4: 146, 5: 150 }, t0: COLD,                     heat: { 0: 148, 1: 152 } },
    preheatAlmost:      { label: 'Preheat · almost',       state: 'preheat', temp: { 0: 215, 1: 218, 4: 212, 5: 216 }, t0: COLD,                     heat: { 0: 215, 1: 218 } },
    preheatCoolingdown: { label: 'Preheat · cooling down', state: 'preheat', temp: { 0: 260, 1: 265, 4: 258, 5: 262 }, t0: { 0: 260, 1: 265, 4: 258, 5: 262 }, heat: { 0: 260, 1: 265 } },
    ready:              { label: 'Ready',                  state: 'ready',   temp: { 0: 220, 1: 220, 4: 220, 5: 220 }, t0: { 0: 220, 1: 220, 4: 220, 5: 220 }, heat: { 0: 220, 1: 220 } },
    noSelect:           { label: 'No recipe (standby)',    state: 'standby', temp: { 0: 200, 1: 200, 4: 200, 5: 200 }, t0: { 0: 200, 1: 200, 4: 200, 5: 200 }, heat: { 0: 0, 1: 0 }, noRecipe: true },
  };

  const SHEET_ITEMS_PER_PAGE = 6;  // features/recipe/recipe-bottom-sheet/model/constants.ts
  // ── State ────────────────────────────────────────────────────────────────
  const params = new URLSearchParams(location.search);
  const state = {
    scenario: SCENARIOS[params.get('scenario')] ? params.get('scenario') : 'preheatCold',
    lang: STRINGS[params.get('lang')] ? params.get('lang') : 'en',   // v0-2 is tuned for the English UI: English by default (?lang=ko for Korean)
    recipeId: 1,
    cookOptionId: 1,
    withoutArm: false,           // false = 배출(auto-unload) ON
    sheet: { open: false, page: 1, depthRecipeId: null, optionPage: 1 },
    tempModalOpen: false,
    blink: true,
    // v0-3: Clean mode is the default (this version recreates clean-1.mov); ?mode=grill for the grill screen.
    mode: params.get('mode') === 'grill' ? 'grill' : 'clean',
    clean: { tempF: 318, targetF: 300 },
    // v0-4: the grill is cool, so the position controller shows (?stage=hot for the v0-3 guard).
    cleanStage: params.get('stage') === 'hot' ? 'hot' : 'controller',
    cc: { current: 'grills', selected: 'grills', positioning: false, pressed: false },
  };
  if (SCENARIOS[state.scenario].noRecipe) state.recipeId = null;

  /** Live temperature simulation, started whenever the recipe changes. null = static scenario. */
  let sim = null;

  // ── Temperature math (features/cook/lib/utils.ts) ────────────────────────
  function sensorReadings(temp) {
    const s1 = temp[1], s2 = temp[5], s3 = temp[0], s4 = temp[4];
    return { s1, s2, s3, s4, currentTopTemp: Math.max(s1, s2), currentBotTemp: Math.max(s3, s4) };
  }

  function computeCookStatusTemps(sensor, targetTop, targetBot, t0, isPreheat) {
    const topLowerBound = targetTop - READY_MARGIN.lower;
    const topUpperBound = targetTop + READY_MARGIN.upper;
    const botLowerBound = targetBot - READY_MARGIN.lower;
    const botUpperBound = targetBot + READY_MARGIN.upper;
    const tTop = Math.max(0, topLowerBound);
    const tBot = Math.max(0, botLowerBound);

    const remainingDeltaTemp = Math.max(0, tTop - sensor.s1, tTop - sensor.s2, tBot - sensor.s3, tBot - sensor.s4);
    const overshootDeltaTemp = Math.max(0, sensor.s1 - topUpperBound, sensor.s2 - topUpperBound, sensor.s3 - botUpperBound, sensor.s4 - botUpperBound);
    const isOvershoot = isPreheat && overshootDeltaTemp > 0 && overshootDeltaTemp >= remainingDeltaTemp;

    const sensors = [
      { TT: tTop, TC: sensor.s1, T0: t0.s1 },
      { TT: tTop, TC: sensor.s2, T0: t0.s2 },
      { TT: tBot, TC: sensor.s3, T0: t0.s3 },
      { TT: tBot, TC: sensor.s4, T0: t0.s4 },
    ];
    const percents = sensors.map(({ TT, TC, T0 }) => {
      const denom = TT - T0;
      if (denom <= 0) return 0;
      return Math.min(100, Math.max(0, ((TT - TC) / denom) * 100));
    });
    const maxRemainingPercent = Math.max(...percents);
    const preheatPercent = Math.max(0, Math.min(100, 100 - maxRemainingPercent));

    return {
      preheatPercent,
      remainingDeltaTemp,
      overshootDeltaTemp,
      isOvershoot,
      top: { target: targetTop, zone1: sensor.s1, zone2: sensor.s2 },
      bottom: { target: targetBot, zone1: sensor.s3, zone2: sensor.s4 },
    };
  }

  /** What the "STM" currently reports: the live sim if one is running, else the static scenario. */
  function source() {
    if (sim) return { temp: sim.temp, t0: sim.t0, phase: sim.phase, heat: sim.heat };
    const sc = SCENARIOS[state.scenario];
    return { temp: sc.temp, t0: sc.t0, phase: sc.state, heat: sc.heat };
  }

  function derive() {
    const src = source();
    const recipe = RECIPES.find((r) => r.id === state.recipeId) || null;
    const option = recipe ? (recipe.cookOptions.find((o) => o.id === state.cookOptionId) || recipe.cookOptions[0]) : null;
    const phase = recipe ? src.phase : 'standby';
    const isPreheat = phase === 'preheat';
    const isReady = phase === 'ready';
    const temps = computeCookStatusTemps(
      sensorReadings(src.temp),
      option ? option.top : 0,
      option ? option.bot : 0,
      sensorReadings(src.t0),
      isPreheat
    );
    return {
      recipe, option, phase, isPreheat, isReady, temps,
      str: STRINGS[state.lang],
      multi: recipe ? recipe.cookOptions.length > 1 : false,
      // heat.current_level per zone (use-cook-page-data.ts getCurrentLevelFromHeat):
      // top zone1 ← sensor 1, bottom zone1 ← sensor 0; zone2 sensors (5, 4) are absent in the presets → 0
      heating: { topZ1: (src.heat[1] || 0) > 0, topZ2: (src.heat[5] || 0) > 0, botZ1: (src.heat[0] || 0) > 0, botZ2: (src.heat[4] || 0) > 0 },
    };
  }

  // ── Temperature simulation (prototype) ───────────────────────────────────
  // usePreheatT0 re-snapshots t0 when the recipe changes; the firmware then
  // heats/cools toward the new targets and flips to READY inside the margin.
  function startSim(fromTemp) {
    sim = { temp: { ...fromTemp }, t0: { ...fromTemp }, phase: 'preheat', heat: {} };
  }

  // ── Video demo (v0-2) ──────────────────────────────────────────────────
  // Replays the reference video (grill-1.mov, 14.6s): 6oz Pork preheating with 4 → 3 → 2 → 1 °F
  // remaining, then READY at 10.8s. Start from the dev bar ("▶ 영상") or ?demo=video (starts
  // after 1s). The remaining °F are fed back as °C so the display rounds to exactly those.
  // The temperature rises continuously (5.3 → 0.5 °F remaining over 10.8s), so the rounded
  // readout steps 5 → 4 → 3 → 2 → 1 at about 1.8 / 4.1 / 6.4 / 8.7s while the ring fills smoothly with it.
  const DEMO = { fromF: 5.3, toF: 0.5, readyAt: 10.8 };   // video: 5°F at 1s, 4 at 2s, 3 at 5s, 1 at 9–10s
  let demo = null;
  let demoPressedId = null;
  function startDemo() {
    state.mode = 'grill';   // v0-3
    const r = RECIPES[0];
    state.scenario = 'preheatAlmost';
    state.recipeId = r.id;
    state.cookOptionId = r.cookOptions[0].id;
    state.withoutArm = false;
    state.sheet.open = false;
    demo = { start: performance.now() };
    const o = r.cookOptions[0];
    // t0 sits 5.5°C below the ready threshold, so the ring visibly grows with the temperature:
    // about 55 % at the start (4.5°F to go) to about 95 % at the switch to READY.
    const base = (target) => target - READY_MARGIN.lower - 5.5;
    sim = { temp: {}, t0: { 0: base(o.bot), 1: base(o.top), 4: base(o.bot), 5: base(o.top) }, phase: 'preheat', heat: { 0: 1, 1: 1 } };
    demoTick(o);
  }
  function demoTick(o) {
    if (!demo) return;
    const t = (performance.now() - demo.start) / 1000;
    if (t >= DEMO.readyAt) {
      sim.temp = { 0: o.bot, 1: o.top, 4: o.bot, 5: o.top };
      sim.phase = 'ready';
      sim.heat = {};
      demo = null;
      render();
      return;
    }
    const f = DEMO.fromF - (DEMO.fromF - DEMO.toF) * (t / DEMO.readyAt);
    // "remaining" is measured to the ready threshold (target − READY_MARGIN.lower), not the target
    const c = f * 5 / 9 + READY_MARGIN.lower;
    sim.temp = { 0: o.bot - c, 1: o.top - c, 4: o.bot - c, 5: o.top - c };
    render();
    setTimeout(() => demoTick(o), 100);   // a timer, not rAF: keeps time even when the tab is hidden
  }

  // ── Video demo 2 (grill-2.mov, 15.9s) ─────────────────────────────────
  // 6oz Pork preheating with 9°F (5°C) left, held steady → open the recipe sheet (3.8s) →
  // tap 8oz Beef (4.9s) → sheet slides away → open again (11.6s) → tap 6oz Pork (12.9s).
  // Unlike the video the plate keeps heating throughout: 9.4 → 2 °F remaining over the 15.9s,
  // and the ring fills with it (about 60 % → 92 %), across both recipe changes.
  function startDemo2() {
    state.mode = 'grill';   // v0-3
    const r = RECIPES[0];
    state.scenario = 'preheatAlmost';
    state.recipeId = r.id;
    state.cookOptionId = r.cookOptions[0].id;
    state.withoutArm = false;
    state.sheet.open = false;
    $('recipe-sheet').classList.remove('is-closing');
    demo = { kind: 'hold', start: performance.now() };
    const hold = () => {
      if (!demo || demo.kind !== 'hold') return;
      const o = derive().option;
      const t = Math.min(1, (performance.now() - demo.start) / 15900);
      const f = 9.4 - (9.4 - 2) * t;                    // °F still to go
      const c = f * 5 / 9 + READY_MARGIN.lower;         // as °C below target
      const base = (target) => target - READY_MARGIN.lower - 13;   // ~60 % at 9°F, ~92 % at 2°F
      sim = { temp: { 0: o.bot - c, 1: o.top - c, 4: o.bot - c, 5: o.top - c },
              t0: { 0: base(o.bot), 1: base(o.top), 4: base(o.bot), 5: base(o.top) },
              phase: 'preheat', heat: { 0: 1, 1: 1 } };
      render();
      setTimeout(hold, 100);
    };
    hold();
    const tapRow = (index, at) => {
      setTimeout(() => { demoPressedId = RECIPES[index].id; render(); }, at * 1000);
      setTimeout(() => { selectRecipe(RECIPES[index].id, RECIPES[index].cookOptions[0].id); }, (at + 0.3) * 1000);
      setTimeout(() => { demoPressedId = null; }, (at + 0.3) * 1000 + 300);
    };
    setTimeout(openSheet, 3800);
    tapRow(3, 4.9);
    setTimeout(openSheet, 11600);
    tapRow(0, 12.9);
  }

  function stepSim() {
    if (!sim || demo) return;
    const d = derive();
    if (!d.option) { sim = null; return; }
    const targets = { 1: d.option.top, 5: d.option.top, 0: d.option.bot, 4: d.option.bot };
    let allInBand = true;
    for (const k of [0, 1, 4, 5]) {
      const diff = targets[k] - sim.temp[k];
      const step = Math.min(Math.abs(diff), Math.max(1.5, Math.abs(diff) * 0.12));
      sim.temp[k] += Math.sign(diff) * step;
      sim.heat[k] = diff > 0 ? 1 : 0;
      if (sim.temp[k] < targets[k] - READY_MARGIN.lower || sim.temp[k] > targets[k] + READY_MARGIN.upper) allInBand = false;
    }
    if (allInBand) sim.phase = 'ready';
    render();
  }
  setInterval(stepSim, 200); // STM polling cadence in the app

  // ── Tick ring (cook-tick-ring.tsx + tick-ring-geometry.ts) ───────────────
  // v0-2: tick width 3 → 2.5 (thinner ring); outer radius 312.5 → 300, tick length kept at 40
  const RING = { COUNT: 150, VIEW: 625, OUTER_R: 300, INNER_R: 260, WIDTH: 2.5, ALWAYS_FILLED_END: 44, PROGRESS_ZONE_END: 106 };
  const TICK_COLOR = { filled: '#E74646', empty: 'hsl(0 100% 86% / 0.65)'   /* v0-2: light red instead of white, a little stronger (app: rgba(255,255,255,.4)) */, base: '#F2FFF880', boundary: '#FFB3B3' };
  const ticks = [];

  function buildRing(svg) {
    const ns = 'http://www.w3.org/2000/svg';
    const cx = RING.VIEW / 2;
    const len = RING.OUTER_R - RING.INNER_R;
    const rx = RING.WIDTH / 2;
    for (let i = 0; i < RING.COUNT; i++) {
      const r = document.createElementNS(ns, 'rect');
      r.setAttribute('x', cx - RING.WIDTH / 2);
      r.setAttribute('y', cx - RING.OUTER_R);
      r.setAttribute('width', RING.WIDTH);
      r.setAttribute('height', len);
      r.setAttribute('rx', rx);
      r.setAttribute('ry', rx);
      // index 0 at 6 o'clock, clockwise
      r.setAttribute('transform', `rotate(${180 + (360 * i) / RING.COUNT} ${cx} ${cx})`);
      r.style.transition = 'fill 0.25s ease, fill-opacity 0.25s ease';
      svg.appendChild(r);
      ticks.push(r);
    }
  }

  function tickStyle(index, filledCount, isPreheat, blink, hasRecipe) {
    if (!hasRecipe || !isPreheat) return { fill: TICK_COLOR.base, opacity: 1 };
    // Zone 3: fill on complete (2:30 → 6, indices 106–149)
    if (index >= RING.PROGRESS_ZONE_END) {
      const done = filledCount >= RING.PROGRESS_ZONE_END;
      return { fill: done ? TICK_COLOR.filled : TICK_COLOR.empty, opacity: done ? 1 : 0.4 };
    }
    // Zone 1: always filled (6 → 9:30, indices 0–43)
    if (index < RING.ALWAYS_FILLED_END) return { fill: TICK_COLOR.filled, opacity: 1 };
    // Zone 2: progress (9:30 → 2:30, indices 44–105)
    const isFilled = index < filledCount;
    const isBoundary = index === filledCount - 1 && filledCount > RING.ALWAYS_FILLED_END;
    if (isBoundary && filledCount < RING.PROGRESS_ZONE_END) {
      return { fill: blink ? TICK_COLOR.boundary : TICK_COLOR.empty, opacity: blink ? 1 : 0.4 };
    }
    return { fill: isFilled ? TICK_COLOR.filled : TICK_COLOR.empty, opacity: isFilled ? 1 : 0.4 };
  }

  // v0-3: Clean ring, as the app's CleanTickRing: its own geometry (outer 312.5, 40 long,
  // 3 wide), white ticks at /20; a 115px gradient marker + "300" label at 12 o'clock
  // (index 75); everything left of it at /60, and a right-hand fill from 12 toward 4 o'clock
  // (index 125) that shrinks as the grill cools from T0 to the marker, its tip blinking.
  const CLEAN = { OUTER_R: 312.5, LEN: 40, WIDTH: 3, MARKER: 75, END: 125, MARKER_LEN: 115, LABEL_OFFSET: 101 };
  let cleanMarks = null, cleanT0 = null, ringGeom = null;
  function setRingGeometry(kind) {
    if (ringGeom === kind) return;
    ringGeom = kind;
    const cx = RING.VIEW / 2;
    const g = kind === 'clean' ? { R: CLEAN.OUTER_R, L: CLEAN.LEN, W: CLEAN.WIDTH } : { R: RING.OUTER_R, L: RING.OUTER_R - RING.INNER_R, W: RING.WIDTH };
    ticks.forEach((t) => {
      t.setAttribute('x', cx - g.W / 2); t.setAttribute('y', cx - g.R);
      t.setAttribute('width', g.W); t.setAttribute('height', g.L);
      t.setAttribute('rx', g.W / 2); t.setAttribute('ry', g.W / 2);
    });
  }
  function paintCleanRing() {
    // v0-4: controller stage = CleanTickRing with showMarker false: plain white/20 ticks only
    if (state.cleanStage === 'controller') {
      if (cleanMarks) { cleanMarks.style.display = 'none'; cleanMarks.label.style.display = 'none'; }
      ticks.forEach((t) => { t.setAttribute('fill', '#FFFFFF'); t.setAttribute('fill-opacity', 0.2); });
      return;
    }
    const svg = $('tick-ring');
    const cx = RING.VIEW / 2;
    if (!cleanMarks) {
      const ns = 'http://www.w3.org/2000/svg';
      const mk = (tag, attrs) => { const e = document.createElementNS(ns, tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
      cleanMarks = mk('g', {});
      const defs = mk('defs', {});
      const grad = mk('linearGradient', { id: 'clean-marker-gradient', x1: 0, y1: 0, x2: 0, y2: 1 });
      [[0, 0.1], [0.341346, 0.6], [1, 0.1]].forEach(([o, a]) => grad.appendChild(mk('stop', { offset: o, 'stop-color': '#FFFFFF', 'stop-opacity': a })));
      defs.appendChild(grad);
      const top = cx - CLEAN.OUTER_R;
      const marker = mk('rect', { x: cx - CLEAN.WIDTH / 2, y: top, width: CLEAN.WIDTH, height: CLEAN.MARKER_LEN, rx: CLEAN.WIDTH / 2, ry: CLEAN.WIDTH / 2, fill: 'url(#clean-marker-gradient)' });
      const label = mk('text', { id: 'clean-marker-label', x: cx, y: top + CLEAN.LABEL_OFFSET, 'text-anchor': 'middle', 'dominant-baseline': 'hanging', fill: 'rgba(255, 255, 255, 0.6)', 'font-size': 28, 'font-weight': 400, 'letter-spacing': 0.56 });
      cleanMarks.append(defs, marker);
      svg.insertBefore(cleanMarks, svg.firstChild);   // marker under the ticks, as in the app
      svg.appendChild(label);
      cleanMarks.label = label;
    }
    cleanMarks.label.textContent = state.clean.targetF;
    const { tempF, targetF } = state.clean;
    if (cleanT0 === null) cleanT0 = tempF;   // T0 = temperature when the guard appeared
    const pct = cleanT0 <= targetF ? 0 : Math.max(0, Math.min(100, (tempF - targetF) / (cleanT0 - targetF) * 100));
    const right = Math.min(CLEAN.END, CLEAN.MARKER + Math.round(pct / 100 * (CLEAN.END - CLEAN.MARKER)));
    ticks.forEach((t, i) => {
      const o = i < CLEAN.MARKER ? 0.6 : i === right ? (state.blink ? 1 : 0.2) : i < right ? 0.6 : 0.2;
      t.setAttribute('fill', '#FFFFFF');
      t.setAttribute('fill-opacity', o);
    });
  }

  function paintRing(d) {
    const clean = state.mode === 'clean';
    if (cleanMarks) { cleanMarks.style.display = clean ? '' : 'none'; cleanMarks.label.style.display = clean ? '' : 'none'; }
    setRingGeometry(clean ? 'clean' : 'grill');
    if (clean) return paintCleanRing();
    cleanT0 = null;
    const progressFilled = Math.round((d.temps.preheatPercent / 100) * (RING.PROGRESS_ZONE_END - RING.ALWAYS_FILLED_END));
    const filledCount = RING.ALWAYS_FILLED_END + progressFilled;
    ticks.forEach((t, i) => {
      const s = tickStyle(i, filledCount, d.isPreheat, state.blink, !!d.recipe);
      t.setAttribute('fill', s.fill);
      t.setAttribute('fill-opacity', s.opacity);
    });
  }

  // v0-2: temperatures shown in Fahrenheit (the reference video's unit). The simulation stays
  // in °C; readings convert on display — absolute values +32, differences ×9/5 only.
  const toF = (c) => c * 9 / 5 + 32;
  const toFDelta = (c) => c * 9 / 5;

  // ── Render ───────────────────────────────────────────────────────────────
  function renderHeader(d) {
    const sw = $('clean-switch');
    const slide = $('switch-slide');
    // headerCleanSwitchColor(): no recipe / standby → black, READY → green, else red.
    const color = !d.recipe || d.phase === 'standby' ? 'black' : d.isReady ? 'green' : 'red';
    sw.dataset.color = color;
    sw.classList.remove('bg-black/50', 'shadow-switch-red', 'bg-black/20', 'bg-white/18!');
    slide.classList.remove('bg-[rgb(245,96,96)]/50', 'bg-[#46CB89]/40', 'shadow-[0px_0px_12px_0px_rgba(0,0,0,0.25)]', 'bg-white/20!');
    if (color === 'red') {
      sw.classList.add('bg-black/50', 'shadow-switch-red');
      slide.classList.add('bg-[rgb(245,96,96)]/50');
    } else if (color === 'green') {
      sw.classList.add('bg-black/20');
      slide.classList.add('bg-[#46CB89]/40', 'shadow-[0px_0px_12px_0px_rgba(0,0,0,0.25)]');
    } else {
      sw.classList.add('bg-white/18!');
      slide.classList.add('bg-white/20!');
    }
    // v0-3: the switch shows CLEAN while clean mode is on
    const on = state.mode === 'clean';
    sw.setAttribute('aria-checked', String(on));
    sw.toggleAttribute('data-checked', on);
    sw.toggleAttribute('data-unchecked', !on);
    $('switch-left').textContent = d.str.grill;
    $('switch-right').textContent = d.str.clean;
    $('temp-btn').setAttribute('aria-label', d.str.temperatureTitle);
  }

  // v0-4: CleanController — markers, knob, CTA (ready / getReady / positioning).
  const CC_POS = [{ id: 'side', label: 'Side' }, { id: 'grills', label: 'Grill' }, { id: 'bottom', label: 'Bottom' }];
  const CC_CENTER = (i) => 80 + i * 220;   // slider 460 centred on 600, 10 edge inset, 220 step
  let ccDragging = false;
  function renderCleanController() {
    const cc = state.cc;
    document.querySelectorAll('.cc-marker').forEach((m) => {
      m.classList.toggle('is-active', m.dataset.pos === cc.selected);
      m.disabled = cc.positioning;
    });
    const knob = $('cc-knob');
    if (!ccDragging) knob.style.transform = `translateX(${CC_CENTER(CC_POS.findIndex((p) => p.id === cc.selected)) - 40}px)`;
    knob.classList.toggle('is-disabled', cc.positioning);
    const cta = $('cc-cta');
    const st = cc.positioning ? 'positioning' : cc.selected === cc.current ? 'ready' : 'getReady';
    const area = CC_POS.find((p) => p.id === cc.selected).label;
    cta.classList.toggle('is-go', st === 'getReady');
    cta.classList.toggle('is-positioning', st === 'positioning');
    cta.classList.toggle('is-pressed', cc.pressed);
    cta.disabled = st !== 'getReady';
    $('cc-spinner').toggleAttribute('hidden', st !== 'positioning');
    $('cc-cta-label').textContent = st === 'positioning' ? 'Repositioning' : st === 'ready' ? `Ready to clean the ${area}` : `Get ready to clean the ${area}`;
  }
  let ccTimer = null;
  function ccSelect(id) { if (state.cc.positioning) return; state.cc.selected = id; render(); }
  function ccConfirm(ms = 6000) {
    const cc = state.cc;
    if (cc.positioning || cc.selected === cc.current) return;
    cc.positioning = true; render();
    clearTimeout(ccTimer);
    ccTimer = setTimeout(() => { cc.positioning = false; cc.current = cc.selected; render(); }, ms);
  }
  /** Demo drag: the knob follows a finger to the target marker, then snaps (selected changes). */
  function ccDrag(id, ms) {
    const knob = $('cc-knob');
    ccDragging = true;
    knob.style.transition = `transform ${ms}ms cubic-bezier(.45,0,.35,1)`;
    knob.style.transform = `translateX(${CC_CENTER(CC_POS.findIndex((p) => p.id === id)) - 40}px)`;
    setTimeout(() => { ccDragging = false; knob.style.transition = ''; ccSelect(id); }, ms);
  }

  function renderStatus(d) {
    const container = $('cook-container');
    container.classList.remove('bg-cook-preparing', 'bg-cook-ready-to-cook', 'bg-black');
    // v0-3: no grill state class in clean mode, so none of its red / green tints apply
    if (state.mode !== 'clean') container.classList.add(!d.recipe ? 'bg-black' : d.isReady ? 'bg-cook-ready-to-cook' : 'bg-cook-preparing');
    container.classList.toggle('is-clean', state.mode === 'clean');
    $('clean-view').classList.toggle('hidden', state.mode !== 'clean');
    $('clean-view').dataset.stage = state.cleanStage;
    container.classList.toggle('is-positioning', state.mode === 'clean' && state.cc.positioning);
    renderCleanController();
    $('clean-temp-value').textContent = Math.round(state.clean.tempF);

    // cook-preheat-screen / cook-ready-screen wrapper
    const wrap = $('status-wrap');
    wrap.className = d.multi ? 'mt-[270px] flex flex-col gap-8' : 'mt-[290px] flex flex-col gap-13.5';
    if (!d.isPreheat) wrap.classList.add('items-center');
    wrap.classList.toggle('hidden', !d.recipe);

    // RecipeInfo
    $('recipe-info').className = 'flex flex-col items-center ' + (d.multi ? 'gap-8' : 'gap-13.5');
    $('phase-group').className = 'flex flex-col items-center ' + (d.multi ? 'gap-5' : 'gap-2');
    const phase = $('phase-label');
    phase.textContent = d.isPreheat ? d.str.preparing : d.str.ready;
    phase.className = 'text-center text-[28px] leading-[130%] font-medium tracking-[0.56px] ' + (d.isPreheat ? 'text-[#C39D9D]' : 'text-white/60');
    $('recipe-name').textContent = d.recipe ? d.recipe.name : '-';
    const badge = $('cook-option-badge');
    badge.classList.toggle('hidden', !d.multi);
    badge.classList.toggle('flex', d.multi);
    $('cook-option-name').textContent = d.multi && d.option ? d.option.name : '';

    // temperatureHint (preheat only): max(remaining, overshoot)
    const hint = $('temp-hint');
    hint.classList.toggle('hidden', !d.isPreheat);
    hint.classList.toggle('flex', d.isPreheat);
    $('temp-hint-state').textContent = (d.temps.isOvershoot ? d.str.coolingDown : d.str.heatingUp) + ' ·';
    $('temp-hint-value').textContent = Math.round(toFDelta(Math.max(d.temps.remainingDeltaTemp, d.temps.overshootDeltaTemp))) + '°F';
    $('temp-hint-remaining').textContent = d.str.remaining;

    // ready guidance (ready only)
    const guide = $('ready-guidance');
    guide.classList.toggle('hidden', !d.isReady);
    guide.textContent = d.str.placeFood;

    // no recipe: CookSelectRecipeScreen guidance + trigger
    const sel = $('select-guidance');
    const showSel = !d.recipe;
    sel.classList.toggle('hidden', !showSel);
    sel.classList.toggle('flex', showSel);
    $('select-guidance-text').textContent = d.str.selectRecipe;
    $('select-trigger-label').textContent = d.str.openRecipePicker;
  }

  function renderActions(d) {
    // the app's select-recipe screen has no action panel
    $('action-panel').classList.toggle('hidden', !d.recipe);
    $('qa-recipe-label').textContent = d.str.changeRecipe;
    $('qa-unload-label').textContent = d.str.unload;
    $('qa-scrape-label').textContent = d.str.quickClean;
    const autoUnloadOn = !state.withoutArm;
    $('qa-unload-state').textContent = autoUnloadOn ? 'On' : 'Off';   // v0-2: sentence case
    const icon = $('qa-unload-icon');
    icon.classList.remove('text-white/20', 'text-[#FF5C5C]', 'text-[#56FAA8]', 'text-white');
    // autoUnloadIconColor(): off → white/20, PREHEAT → #FF5C5C, READY → #56FAA8, else white
    icon.classList.add(!autoUnloadOn ? 'text-white/20' : d.isPreheat ? 'text-[#FF5C5C]' : d.isReady ? 'text-[#56FAA8]' : 'text-white');

    // primary CTA: active only in READY
    const btn = $('primary-btn');
    const disabled = !d.isReady;
    if (disabled) btn.setAttribute('aria-disabled', 'true'); else btn.removeAttribute('aria-disabled');
    btn.setAttribute('tabindex', disabled ? '-1' : '0');
    btn.classList.toggle('pointer-events-none', disabled);
    $('primary-label').textContent = d.str.startCooking;
  }

  function renderSheet(d) {
    const wrap = $('recipe-sheet');
    wrap.classList.toggle('hidden', !state.sheet.open);
    if (!state.sheet.open) return;

    const list = $('sheet-list');
    const depth = state.sheet.depthRecipeId != null ? RECIPES.find((r) => r.id === state.sheet.depthRecipeId) : null;
    $('sheet-title').textContent = depth ? depth.name : d.str.recipe;

    const itemClass = (selected) =>
      'flex h-25 w-full shrink-0 items-center gap-0.5 rounded-sm py-4 pr-7 pl-1.5 transition focus:outline-none focus-visible:outline-none ' +
      (selected ? 'sheet-row-on active:opacity-70' : 'active:bg-black/40');   // v0-2: dark scrim + check instead of white fill + outline

    // v0-2: the selected row carries a check after its name
    const check = (selected) => selected ? '<svg class="sheet-check" aria-hidden="true"><use href="#i-check"/></svg>' : '';
    const nameCell = (name, selected) =>
      `<span class="type-body2 flex min-w-0 flex-1 items-center gap-3 text-left text-white"><span class="min-w-0 truncate">${name}</span>${check(selected)}</span>`;

    let page, totalPages;
    if (depth) {
      // RecipeBottomSheetCookOptionList
      const options = depth.cookOptions;
      totalPages = Math.max(1, Math.ceil(options.length / SHEET_ITEMS_PER_PAGE));
      page = Math.min(state.sheet.optionPage, totalPages);
      const start = (page - 1) * SHEET_ITEMS_PER_PAGE;
      const recipeNumber = RECIPES.indexOf(depth) + 1;
      const selectedOptionId = state.recipeId === depth.id ? state.cookOptionId : null;
      list.innerHTML = options.slice(start, start + SHEET_ITEMS_PER_PAGE).map((o, i) => `
        <button type="button" data-select-option="${o.id}" class="${itemClass(o.id === selectedOptionId)}">
          <div class="flex h-16 w-15 shrink-0 flex-col items-center justify-center">
            <span class="type-body3 text-white/70">${recipeNumber}-${start + i + 1}</span>
          </div>
          ${nameCell(o.name, o.id === selectedOptionId)}
        </button>`).join('');
    } else {
      // RecipeBottomSheetList
      totalPages = Math.max(1, Math.ceil(RECIPES.length / SHEET_ITEMS_PER_PAGE));
      page = Math.min(state.sheet.page, totalPages);
      const start = (page - 1) * SHEET_ITEMS_PER_PAGE;
      list.innerHTML = RECIPES.slice(start, start + SHEET_ITEMS_PER_PAGE).map((r, i) => `
        <button type="button" data-select-recipe="${r.id}" class="${itemClass(r.id === state.recipeId)}">
          <div class="flex h-16 w-10 shrink-0 flex-col items-center justify-center">
            <span class="type-body3 text-white/70">${start + i + 1}</span>
          </div>
          ${r.cookOptions.length > 1
            ? `<div class="flex min-w-0 flex-1 items-center gap-3">
                 ${nameCell(r.name, r.id === state.recipeId)}
                 <span class="type-body2 sheet-count shrink-0 text-white/70">${r.cookOptions.length}<svg aria-hidden="true"><use href="#i-chevron-right"/></svg></span>
               </div>`
            : nameCell(r.name, r.id === state.recipeId)}
        </button>`).join('');
      // demo 2's scripted tap: keep the pressed band through re-renders
      if (demoPressedId != null) list.querySelector(`[data-select-recipe="${demoPressedId}"]`)?.classList.add('is-pressed');
    }

    // RecipeTablePagination
    $('sheet-page-cur').textContent = page;
    $('sheet-page-total').textContent = '/ ' + totalPages;
    setPaginationDisabled($('sheet-prev'), page <= 1);
    setPaginationDisabled($('sheet-next'), page >= totalPages);
  }

  function setPaginationDisabled(btn, disabled) {
    btn.disabled = disabled;
    btn.setAttribute('aria-disabled', disabled);
    ['opacity-50', 'cursor-not-allowed', 'active:bg-transparent'].forEach((c) => btn.classList.toggle(c, disabled));
  }

  function renderTempModal(d) {
    const wrap = $('temp-modal');
    wrap.classList.toggle('hidden', !state.tempModalOpen);
    if (!state.tempModalOpen) return;
    $('tm-title').textContent = d.str.temperatureTitle;
    $('tm-griddle').textContent = d.str.griddleLabel;
    $('tm-current').textContent = d.str.currentLabel;
    $('tm-top-label').textContent = d.str.topPlate;
    $('tm-bot-label').textContent = d.str.bottomPlate;
    $('tm-recipe').textContent = d.recipe ? d.recipe.name : '-';
    $('tm-top-target').textContent = Math.round(toF(d.temps.top.target));
    $('tm-bot-target').textContent = Math.round(toF(d.temps.bottom.target));
    const line = (id, value, heating) => {
      const el = $(id);
      el.textContent = toF(value).toFixed(1);
      el.classList.toggle('text-[#FF5454]', heating);
      el.classList.toggle('text-white', !heating);
      wrap.querySelector(`[data-zone="${id.replace('tm-', '')}"]`).setAttribute('fill', heating ? '#FF5454' : '#FFFFFF');
    };
    line('tm-top-z2', d.temps.top.zone2, d.heating.topZ2);
    line('tm-top-z1', d.temps.top.zone1, d.heating.topZ1);
    line('tm-bot-z2', d.temps.bottom.zone2, d.heating.botZ2);
    line('tm-bot-z1', d.temps.bottom.zone1, d.heating.botZ1);
  }

  function render() {
    const d = derive();
    renderHeader(d);
    renderStatus(d);
    renderActions(d);
    paintRing(d);
    renderSheet(d);
    renderTempModal(d);
    document.documentElement.lang = state.lang;
    const sel = document.querySelector('[data-dev="scenario"]');
    if (sel) sel.value = state.scenario;
    const langBtn = document.querySelector('[data-dev="lang"]');
    if (langBtn) langBtn.textContent = state.lang;
  }

  // ── Interactions ─────────────────────────────────────────────────────────
  function openSheet() {
    const idx = RECIPES.findIndex((r) => r.id === state.recipeId);
    state.sheet = { open: true, page: idx >= 0 ? Math.floor(idx / SHEET_ITEMS_PER_PAGE) + 1 : 1, depthRecipeId: null, optionPage: 1 };
    render();
  }
  // v0-2: the sheet slides back down (as in grill-2.mov) instead of vanishing; the screen
  // behind already reflects the new recipe while it goes.
  let closingTimer = null;
  function closeSheet() {
    const wrap = $('recipe-sheet');
    if (!state.sheet.open || wrap.classList.contains('hidden')) {
      state.sheet.open = false; state.sheet.depthRecipeId = null; render(); return;
    }
    wrap.classList.add('is-closing');
    clearTimeout(closingTimer);
    closingTimer = setTimeout(() => {
      wrap.classList.remove('is-closing');
      state.sheet.open = false;
      state.sheet.depthRecipeId = null;
      render();
    }, 280);
    render();
  }

  /** Recipe / cook option change. A real change re-snapshots t0 and starts heating toward the new targets. */
  function selectRecipe(id, cookOptionId) {
    const changed = id !== state.recipeId || cookOptionId !== state.cookOptionId;
    const fromTemp = source().temp;
    state.recipeId = id;
    state.cookOptionId = cookOptionId;
    // 레시피 선택 시 withoutArm 은 선택된 옵션 값 (use-cook-page-data.ts setSelectedId)
    const option = RECIPES.find((r) => r.id === id)?.cookOptions.find((o) => o.id === cookOptionId);
    state.withoutArm = !!(option && option.withoutArm);
    if (changed) startSim(fromTemp);
    closeSheet();
  }

  $('qa-recipe').addEventListener('click', openSheet);
  $('select-trigger').addEventListener('click', openSheet);
  $('qa-unload').addEventListener('click', () => { state.withoutArm = !state.withoutArm; render(); });
  $('qa-scrape').addEventListener('click', () => console.info('[Cook] send("clean") — 간이 청소 (out of scope)'));
  $('primary-btn').addEventListener('click', () => {
    if ($('primary-btn').getAttribute('aria-disabled') === 'true') return;
    console.info('[Cook] send("cook") — 조리 시작 (out of scope)');
  });
  $('menu-btn').addEventListener('click', () => console.info('[Cook] openMenu (out of scope)'));
  $('clean-switch').addEventListener('click', () => { state.mode = state.mode === 'clean' ? 'grill' : 'clean'; render(); });
  $('clean-anyway').addEventListener('click', () => { state.cleanStage = 'controller'; render(); });
  document.querySelectorAll('.cc-marker').forEach((m) => m.addEventListener('click', () => ccSelect(m.dataset.pos)));
  $('cc-cta').addEventListener('click', () => ccConfirm());
  $('temp-btn').addEventListener('click', () => { state.tempModalOpen = true; render(); });

  // Bottom sheet
  $('recipe-sheet').addEventListener('click', (e) => {
    const recipeBtn = e.target.closest('[data-select-recipe]');
    if (recipeBtn) {
      const recipe = RECIPES.find((r) => r.id === Number(recipeBtn.dataset.selectRecipe));
      if (!recipe) return;
      if (recipe.cookOptions.length > 1) {
        state.sheet.depthRecipeId = recipe.id;
        state.sheet.optionPage = 1;
        render();
      } else {
        selectRecipe(recipe.id, recipe.cookOptions[0].id);
      }
      return;
    }
    const optionBtn = e.target.closest('[data-select-option]');
    if (optionBtn) {
      selectRecipe(state.sheet.depthRecipeId, Number(optionBtn.dataset.selectOption));
      return;
    }
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'sheet-close') closeSheet();
    if (action === 'sheet-header-close') {
      if (state.sheet.depthRecipeId != null) { state.sheet.depthRecipeId = null; render(); }
      else closeSheet();
    }
    if (action === 'sheet-prev' || action === 'sheet-next') {
      const delta = action === 'sheet-prev' ? -1 : 1;
      if (state.sheet.depthRecipeId != null) state.sheet.optionPage = Math.max(1, state.sheet.optionPage + delta);
      else state.sheet.page = Math.max(1, state.sheet.page + delta);
      render();
    }
  });

  $('temp-modal').addEventListener('click', (e) => {
    if (e.target.closest('[data-action="temp-close"]')) { state.tempModalOpen = false; render(); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (state.tempModalOpen) { state.tempModalOpen = false; render(); }
    else if (state.sheet.open) closeSheet();
  });

  // Boundary tick blink (useBoundaryBlink, 500ms)
  // portfolio: held (lit) while state.blinkHeld, set by an embedding page holding the screen still
  setInterval(() => {
    if (state.blinkHeld) return;
    state.blink = !state.blink;
    if (derive().isPreheat || state.mode === 'clean') paintRing(derive());
  }, 500);

  // ── Dev bar hooks ────────────────────────────────────────────────────────
  const scenarioSel = document.querySelector('[data-dev="scenario"]');
  if (scenarioSel) {
    Object.entries(SCENARIOS).forEach(([key, sc]) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = sc.label;
      scenarioSel.appendChild(opt);
    });
    scenarioSel.addEventListener('change', () => setScenario(scenarioSel.value));
  }
  const langBtn = document.querySelector('[data-dev="lang"]');
  if (langBtn) langBtn.addEventListener('click', () => setLang(state.lang === 'ko' ? 'en' : 'ko'));

  function setScenario(key) {
    if (!SCENARIOS[key]) { console.warn('[Cook] unknown scenario', key); return; }
    sim = null;
    state.scenario = key;
    if (SCENARIOS[key].noRecipe) state.recipeId = null;
    else if (state.recipeId == null) {
      state.recipeId = 1;
      state.cookOptionId = 1;
      state.withoutArm = !!RECIPES[0].cookOptions[0].withoutArm;
    }
    render();
  }
  function setLang(lang) {
    if (!STRINGS[lang]) return;
    state.lang = lang;
    render();
  }
  // v0-3: clean-1.mov — cooling from 318°F toward the 300°F cleaning limit over 14.9 s
  // (the video reads 318, 316, 313, 311, 309, 306, 303, 301: about 1.2°F a second).
  let cleanDemoTimer = null;
  function startDemoClean() {
    demo = null;
    state.mode = 'clean';
    state.sheet.open = false;
    state.tempModalOpen = false;
    state.cleanStage = 'hot';
    cleanT0 = null;
    const start = performance.now();
    clearTimeout(cleanDemoTimer);
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / 14900);
      state.clean.tempF = 318.4 - (318.4 - 300.6) * t;
      render();
      if (t < 1) cleanDemoTimer = setTimeout(tick, 100);
    };
    tick();
  }
  // v0-4: clean-2.mov (21.4 s) — Grills → Side, confirm, ~6 s repositioning; Side → Grills, same.
  function startDemoController() {
    demo = null;
    state.mode = 'clean';
    state.cleanStage = 'controller';
    state.sheet.open = false;
    state.tempModalOpen = false;
    clearTimeout(ccTimer);
    state.cc = { current: 'grills', selected: 'grills', positioning: false, pressed: false };
    render();
    const at = (s, fn) => setTimeout(fn, s * 1000);
    const press = (s) => { at(s, () => { state.cc.pressed = true; render(); }); at(s + 0.18, () => { state.cc.pressed = false; ccConfirm(5800); }); };
    at(1.0, () => ccDrag('side', 1100));
    press(3.4);
    at(10.4, () => ccDrag('grills', 1000));
    press(12.2);
  }
  // ── Init ─────────────────────────────────────────────────────────────────
  buildRing($('tick-ring'));

  const demoBtn = document.querySelector('[data-dev="demo"]');
  if (demoBtn) demoBtn.addEventListener('click', startDemo);
  const demo2Btn = document.querySelector('[data-dev="demo2"]');
  if (demo2Btn) demo2Btn.addEventListener('click', startDemo2);
  if (params.get('demo') === 'video') setTimeout(startDemo, 1000);
  if (params.get('demo') === 'video2') setTimeout(startDemo2, 1000);
  const demoCleanBtn = document.querySelector('[data-dev="demo-clean"]');
  if (demoCleanBtn) demoCleanBtn.addEventListener('click', startDemoClean);
  if (params.get('demo') === 'clean') setTimeout(startDemoClean, 1000);
  const demoCcBtn = document.querySelector('[data-dev="demo-clean2"]');
  if (demoCcBtn) demoCcBtn.addEventListener('click', startDemoController);
  if (params.get('demo') === 'clean2') setTimeout(startDemoController, 1000);

  // TEMP (v0-2) dev-bar select: quick-action icons as outline or filled glyphs.
  const qaIcons = document.querySelector('[data-dev="qa-icons"]');
  if (qaIcons) {
    const ICONS = {
      line: { 'qa-recipe': '#i-recipe-book', 'qa-scrape': '#i-scraper' },
      fill: { 'qa-recipe': '#i-recipe-book-fill', 'qa-scrape': '#i-scraper-fill' },
    };
    let v = 'line';
    try { v = localStorage.getItem('proto:v0-4-qa-icons') || 'fill'; } catch (e) { /* ignore */ }
    const apply = (val) => {
      Object.entries(ICONS[val]).forEach(([id, href]) => $(id).querySelector('use').setAttribute('href', href));
      $('action-panel').dataset.qaIcons = val;   // lets proto.css tone the filled glyphs down
    };
    qaIcons.value = v;
    apply(v);
    qaIcons.addEventListener('change', () => {
      apply(qaIcons.value);
      try { localStorage.setItem('proto:v0-4-qa-icons', qaIcons.value); } catch (e) { /* ignore */ }
    });
  }

  // ── portfolio: the video demos on someone else's clock ──────────────────
  // public/prototypes/alphagrill-cook.html plays the grill and clean demos as live carousel cards,
  // on a wall-clock loop that a second copy (the lightbox) can join mid-take. The demos run on
  // timers from their own start, so the page drives the screen through these instead.
  // Grill (startDemo / startDemo2):
  //   take.reset()           6oz Pork preheating with the sheet shut, as both demos begin
  //   take.hold(f, base)     the plate f °F short of ready, the ring's t0 `base` °C under the ready
  //                          threshold (demo 1: 5.5, demo 2: 13), for whichever recipe is on
  //   take.ready()           demo 1's switch to READY
  //   take.press(id)         a sheet row's pressed band, kept through re-renders (null: none)
  // While a take runs the sim never drifts on its own (stepSim skips while `demo` is set). The
  // sheet opens and rows are picked by the screen's own taps (#qa-recipe, [data-select-recipe]).
  // Clean (startDemoClean / startDemoController):
  //   take.cooling(f, t0)    the hot-grill guard at f °F, its ring measured from t0 °F
  //   take.controller()      the position controller on Grill, nothing moving
  //   take.drag(id, ms)      the knob slides to a marker as a finger drags it, over ms
  //   take.cc(patch)         the controller's state at once: the drag landing (selected), the CTA
  //                          pressed, the grill moving (positioning) and arriving (current)
  // ccDrag / ccConfirm set state from timers of their own; here each change is a step of the take.
  // The page sets the temperature every 100ms, but the readout and the ring only move a few times a
  // second, so hold / ready / cooling render only when what they show has changed (takeShown); the
  // other steps always render.
  let takeShown = null;
  const takeRender = (key = null) => { if (key !== null && key === takeShown) return; takeShown = key; render(); };
  const take = {
    reset() {
      const r = RECIPES[0];
      Object.assign(state, { mode: 'grill', scenario: 'preheatAlmost', recipeId: r.id, cookOptionId: r.cookOptions[0].id, withoutArm: false });
      clearTimeout(closingTimer);
      $('recipe-sheet').classList.remove('is-closing');
      state.sheet.open = false;
      state.sheet.depthRecipeId = null;
      demoPressedId = null;
      demo = { kind: 'take' };
      takeRender();
    },
    hold(f, base) {
      const o = derive().option;
      const c = f * 5 / 9 + READY_MARGIN.lower;   // °F to go → °C below target, as the demos do
      const t0 = (target) => target - READY_MARGIN.lower - base;
      sim = { temp: { 0: o.bot - c, 1: o.top - c, 4: o.bot - c, 5: o.top - c },
              t0: { 0: t0(o.bot), 1: t0(o.top), 4: t0(o.bot), 5: t0(o.top) },
              phase: 'preheat', heat: { 0: 1, 1: 1 } };
      const d = derive();
      const filled = Math.round((d.temps.preheatPercent / 100) * (RING.PROGRESS_ZONE_END - RING.ALWAYS_FILLED_END));
      takeRender(['hold', d.recipe.id, Math.round(toFDelta(Math.max(d.temps.remainingDeltaTemp, d.temps.overshootDeltaTemp))), filled].join());
    },
    ready() {
      const o = derive().option;
      const at = { 0: o.bot, 1: o.top, 4: o.bot, 5: o.top };
      sim = { temp: at, t0: sim ? sim.t0 : { ...at }, phase: 'ready', heat: {} };
      takeRender(['ready', state.recipeId].join());
    },
    press(id) { demoPressedId = id; takeRender(); },
    cooling(f, t0) {
      Object.assign(state, { mode: 'clean', cleanStage: 'hot', tempModalOpen: false });
      state.sheet.open = false;
      state.clean.tempF = f;
      cleanT0 = t0;
      demo = { kind: 'take' };
      // the readout, and the tick the ring's fill ends on (as paintCleanRing works it out)
      const { targetF } = state.clean;
      const pct = t0 <= targetF ? 0 : Math.max(0, Math.min(100, (f - targetF) / (t0 - targetF) * 100));
      takeRender(['cool', Math.round(f), Math.round(pct / 100 * (CLEAN.END - CLEAN.MARKER))].join());
    },
    controller() {
      Object.assign(state, { mode: 'clean', cleanStage: 'controller', tempModalOpen: false });
      state.sheet.open = false;
      clearTimeout(ccTimer);
      ccDragging = false;
      $('cc-knob').style.transition = '';
      state.cc = { current: 'grills', selected: 'grills', positioning: false, pressed: false };
      demo = { kind: 'take' };
      takeRender();
    },
    drag(id, ms) {
      const knob = $('cc-knob');
      ccDragging = true;
      knob.style.transition = `transform ${ms}ms cubic-bezier(.45,0,.35,1)`;
      knob.style.transform = `translateX(${CC_CENTER(CC_POS.findIndex((p) => p.id === id)) - 40}px)`;
    },
    cc(patch) {
      if ('selected' in patch) { ccDragging = false; $('cc-knob').style.transition = ''; }
      Object.assign(state.cc, patch);
      takeRender();
    },
  };

  render();

  window.Cook = { startDemo, startDemo2, startDemoClean, startDemoController, take, state, SCENARIOS, RECIPES, setScenario, setLang, render, get sim() { return sim; } };
})();
