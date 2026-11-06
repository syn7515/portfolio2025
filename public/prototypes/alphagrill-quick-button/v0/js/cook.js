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
      targetLabel: '목표',   // v15: the temperature panel's middle column (was the recipe's name)
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
      changeRecipe: 'Recipe',   // portfolio, as v0-2 ~ v0-4: shorter label (app: 'Change recipe')
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
      targetLabel: 'Target',
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
  const RECIPES = [
    { id: 1,  name: '불고기 패티',     cookOptions: [{ id: 1, name: 'default', top: 250, bot: 230, cookingSec: 240, meltingSec: 0,  thickness: 30 }] },
    { id: 2,  name: 'Beef burger',     cookOptions: [{ id: 2, name: 'default', top: 250, bot: 230, cookingSec: 150, meltingSec: 10, thickness: 22 }] },
    { id: 3,  name: 'Salmon fillet',   cookOptions: [{ id: 3, name: 'default', top: 200, bot: 200, cookingSec: 120, meltingSec: 5,  thickness: 18, withoutArm: true }] },
    { id: 10, name: 'Ribeye steak',    cookOptions: [
      { id: 101, name: '레어', top: 270, bot: 240, cookingSec: 120, meltingSec: 0, thickness: 30 },
      { id: 102, name: '웰던', top: 250, bot: 230, cookingSec: 300, meltingSec: 0, thickness: 30 },
    ] },
    { id: 11, name: 'Tenderloin steak', cookOptions: [
      { id: 111, name: '레어',       top: 270, bot: 230, cookingSec: 150, meltingSec: 8,  thickness: 13, withoutArm: true },
      { id: 112, name: '미디엄 레어', top: 260, bot: 220, cookingSec: 180, meltingSec: 0,  thickness: 14 },
      { id: 113, name: '미디엄',     top: 250, bot: 210, cookingSec: 210, meltingSec: 10, thickness: 15 },
      { id: 114, name: '미디엄웰던', top: 240, bot: 200, cookingSec: 240, meltingSec: 0,  thickness: 16 },
      { id: 115, name: '웰던',       top: 230, bot: 190, cookingSec: 300, meltingSec: 12, thickness: 18 },
    ] },
    { id: 4,  name: '10oz ribeye',     cookOptions: [{ id: 4, name: 'default', top: 260, bot: 240, cookingSec: 300, meltingSec: 15, thickness: 35 }] },
    { id: 5,  name: 'Chicken breast',  cookOptions: [{ id: 5, name: 'default', top: 200, bot: 200, cookingSec: 180, meltingSec: 0,  thickness: 20 }] },
    { id: 6,  name: 'Lamb chop',       cookOptions: [{ id: 6, name: 'default', top: 240, bot: 220, cookingSec: 200, meltingSec: 12, thickness: 25 }] },
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
    // 조리 시작 이후 (cooking). Jumping here starts the cook at that step; Beef burger has cheese (meltingSec 10).
    cook:               { label: 'Cooking · 조리 중',      state: 'ready',   temp: { 0: 220, 1: 220, 4: 220, 5: 220 }, t0: { 0: 220, 1: 220, 4: 220, 5: 220 }, heat: { 0: 220, 1: 220 }, cook: 'cook' },
    cookWaitMelt:       { label: 'Cooking · 치즈 대기',    state: 'ready',   temp: { 0: 220, 1: 220, 4: 220, 5: 220 }, t0: { 0: 220, 1: 220, 4: 220, 5: 220 }, heat: { 0: 220, 1: 220 }, cook: 'waitMelt', recipeId: 2 },
    cookMelt:           { label: 'Cooking · 치즈 조리 중', state: 'ready',   temp: { 0: 220, 1: 220, 4: 220, 5: 220 }, t0: { 0: 220, 1: 220, 4: 220, 5: 220 }, heat: { 0: 220, 1: 220 }, cook: 'melt', recipeId: 2 },
    cookOutput:         { label: 'Cooking · 배출 및 정리', state: 'ready',   temp: { 0: 220, 1: 220, 4: 220, 5: 220 }, t0: { 0: 220, 1: 220, 4: 220, 5: 220 }, heat: { 0: 220, 1: 220 }, cook: 'output' },
    noSelect:           { label: 'No recipe (standby)',    state: 'standby', temp: { 0: 200, 1: 200, 4: 200, 5: 200 }, t0: { 0: 200, 1: 200, 4: 200, 5: 200 }, heat: { 0: 0, 1: 0 }, noRecipe: true },
  };

  const SHEET_ITEMS_PER_PAGE = 6;  // features/recipe/recipe-bottom-sheet/model/constants.ts
  // ── State ────────────────────────────────────────────────────────────────
  const params = new URLSearchParams(location.search);
  const state = {
    scenario: SCENARIOS[params.get('scenario')] ? params.get('scenario') : 'preheatCold',
    lang: STRINGS[params.get('lang')] ? params.get('lang') : 'ko',
    recipeId: 1,
    cookOptionId: 1,
    withoutArm: false,           // false = 배출(auto-unload) ON
    sheet: { open: false, page: 1, depthRecipeId: null, optionPage: 1 },
    tempModalOpen: false,
    blink: true,
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

  function stepSim() {
    if (!sim) return;
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
  const RING = { COUNT: 150, VIEW: 625, OUTER_R: 312.5, INNER_R: 272.5, WIDTH: 3, ALWAYS_FILLED_END: 44, PROGRESS_ZONE_END: 106 };
  const TICK_COLOR = { filled: '#E74646', empty: 'rgba(255, 255, 255, 0.40)', base: '#F2FFF880', boundary: '#FFB3B3' };
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

  function paintRing(d) {
    const progressFilled = Math.round((d.temps.preheatPercent / 100) * (RING.PROGRESS_ZONE_END - RING.ALWAYS_FILLED_END));
    const filledCount = RING.ALWAYS_FILLED_END + progressFilled;
    ticks.forEach((t, i) => {
      const s = tickStyle(i, filledCount, d.isPreheat, state.blink, !!d.recipe);
      t.setAttribute('fill', s.fill);
      t.setAttribute('fill-opacity', s.opacity);
    });
  }

  const escapeHTML = (text) => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ── Cooking (조리 시작 이후) ───────────────────────────────────────────────
  // Ported from fw-app-tauri-AlphaGrill main @ 96c89ba: features/cook/model/constants.ts
  // (STEPS_BY_MODE, STATUS_PHASE_LABEL, STATE_TO_BACKGROUND), components/cook-active-view.tsx,
  // cook-action-bar.tsx, cook-timer.tsx. The STM sequence is simulated here (proto-only):
  //   COOK (cookingSec) → [cheese] WAIT_MELT → 치즈 조리 시작 → MELT (meltingSec)
  //   → [배출 ON] OUTPUT → CLEAN → back to READY.   중지 → ABORT → CLEAN → READY.
  // TODO(미정): OUTPUT / CLEAN / ABORT durations and what follows a no-arm cook are guesses, not STM values.
  const COOK_STR = {
    ko: { pressGrilling: '조리 중', grillingFinished: '조리 완료', meltingCheese: '치즈 조리', meltingCheese2: '치즈 조리 중',
          unloadAndCleanUp: '배출 및 그리들 정리', stopCooking: '중지', stopScrape: '중지', startCheeseCooking: '치즈 조리 시작',
          placeCheese: '치즈를 조리물 위에 올리고\n추가 가열을 시작하세요.' },
    en: { pressGrilling: 'PRESSING & GRILLING', grillingFinished: 'GRILLING FINISHED', meltingCheese: 'MELTING CHEESE', meltingCheese2: 'MELTING CHEESE',
          unloadAndCleanUp: 'UNLOAD & CLEAN UP', stopCooking: 'Stop', stopScrape: 'Stop scraping', startCheeseCooking: 'Start melting',
          placeCheese: 'Place cheese on top of food and start melting.' },
  };
  // phase → STATUS_PHASE_LABEL / STATUS_STEP_KEY
  const PHASE_LABEL = { cook: 'pressGrilling', waitMelt: 'grillingFinished', melt: 'meltingCheese2', output: 'unloadAndCleanUp', clean: 'unloadAndCleanUp' };
  const PHASE_STEP  = { cook: 'pressGrilling', waitMelt: 'grillingFinished', melt: 'meltingCheese', output: 'unloadAndCleanUp', clean: 'unloadAndCleanUp' };
  const STEP_ID = (key) => (key === 'meltingCheese2' ? 'meltingCheese' : key);   // stepIdentity()
  const OUTPUT_SEC = 3, CLEAN_SEC = 4, ABORT_SEC = 2;

  function stepsForMode(withoutArm, cheese) {
    if (!withoutArm && cheese) return ['pressGrilling', 'grillingFinished', 'meltingCheese', 'unloadAndCleanUp'];
    if (!withoutArm) return ['pressGrilling', 'unloadAndCleanUp'];
    if (cheese) return ['pressGrilling', 'grillingFinished', 'meltingCheese'];
    return ['pressGrilling'];
  }

  /** null = not cooking. phase: cook | waitMelt | melt | output | clean; abort keeps the phase it stopped from. */
  let cook = null;
  const cookSpeed = { value: Math.max(1, Number(params.get('speed')) || 1) };

  function startCook(phase) {
    const d = derive();
    if (!d.option) return;
    const cheese = (d.option.meltingSec || 0) > 0;
    cook = { phase: phase || 'cook', cheese, withoutArm: state.withoutArm, remaining: 0, abort: 0, after: 0 };
    enterPhase(cook.phase);
    state.sheet.open = false;
    render();
  }
  function enterPhase(phase) {
    const d = derive();
    cook.phase = phase;
    cook.remaining = phase === 'cook' ? d.option.cookingSec : (phase === 'waitMelt' || phase === 'melt') ? d.option.meltingSec : 0;
    cook.after = phase === 'output' ? OUTPUT_SEC : phase === 'clean' ? CLEAN_SEC : 0;
  }
  function endCook() { cook = null; render(); }
  function afterMain() {   // main countdown of COOK / MELT reached 0
    if (cook.phase === 'cook' && cook.cheese) return enterPhase('waitMelt');
    if (cook.withoutArm) return endCook();
    enterPhase('output');
  }
  function tickCook() {
    if (!cook) return;
    if (cook.abort > 0) {
      if (--cook.abort <= 0) { cook.abortDone = true; enterPhase('clean'); cook.stopped = true; }
    } else if (cook.phase === 'cook' || cook.phase === 'melt') {
      if (--cook.remaining <= 0) { cook.remaining = 0; afterMain(); }
    } else if (cook.phase === 'output' || cook.phase === 'clean') {
      if (--cook.after <= 0) {
        if (cook.phase === 'output') enterPhase('clean');
        else return endCook();
      }
    }
    if (cook) render();
  }
  let cookTimer = null;
  function restartCookTimer() {
    clearInterval(cookTimer);
    cookTimer = setInterval(tickCook, 1000 / cookSpeed.value);
  }
  restartCookTimer();

  function stopCook() {   // send("abort")
    if (!cook || cook.abort > 0) return;
    cook.abort = ABORT_SEC;
    render();
  }

  // Shared-layout FLIP for the timeline: the step promoted from upcoming slides from its old
  // spot into the middle, the rest slide left, the leaving phase fades (stand-in for motion's layoutId).
  function flipTimeline(apply) {
    const before = new Map();
    document.querySelectorAll('#cooking-view [data-step]').forEach((el) => before.set(el.dataset.step, el.getBoundingClientRect()));
    const oldPhase = document.querySelector('#cv-phase-slot [data-step]');
    const oldPhaseRect = oldPhase && oldPhase.getBoundingClientRect();
    const oldPhaseId = oldPhase && oldPhase.dataset.step;
    apply();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const scale = document.getElementById('device').getBoundingClientRect().width / 600 || 1;
    document.querySelectorAll('#cooking-view [data-step]').forEach((el) => {
      const prev = before.get(el.dataset.step);
      if (!prev) return;
      const now = el.getBoundingClientRect();
      const dx = (prev.left - now.left) / scale, dy = (prev.top - now.top) / scale;
      if (!dx && !dy) return;
      el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.2, .9, .25, 1)' });
    });
    const newPhase = document.querySelector('#cv-phase-slot [data-step]');
    if (oldPhase && oldPhaseId !== (newPhase && newPhase.dataset.step)) {
      const ghost = oldPhase.cloneNode(true);
      const slot = $('cv-phase-slot').getBoundingClientRect();
      ghost.style.cssText = `position:absolute;left:${(oldPhaseRect.left - slot.left) / scale}px;top:0;pointer-events:none`;
      $('cv-phase-slot').appendChild(ghost);
      ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-out' }).finished.then(() => ghost.remove());
    }
  }

  let lastTimelineKey = '';
  function renderCooking(d) {
    const view = $('cooking-view');
    document.documentElement.classList.toggle('is-cooking', !!cook);
    view.hidden = !cook;
    if (!cook) { lastTimelineKey = ''; return; }
    const s = COOK_STR[state.lang];
    view.classList.toggle('is-multi', d.multi);
    $('cv-name').textContent = d.recipe ? d.recipe.name : '-';
    $('cv-option').hidden = !d.multi;
    $('cv-option-text').textContent = d.multi && d.option ? d.option.name : '';

    // timeline
    const steps = stepsForMode(cook.withoutArm, cook.cheese);
    const idx = steps.indexOf(PHASE_STEP[cook.phase]);
    const upcoming = (idx >= 0 ? steps.slice(idx + 1) : []).filter((k) => k !== 'grillingFinished');
    const phaseKey = PHASE_LABEL[cook.phase];
    const key = state.lang + '|' + phaseKey + '|' + upcoming.join(',');
    if (key !== lastTimelineKey) {
      const apply = () => {
        $('cv-phase-slot').innerHTML = `<div class="cv-step" data-step="${STEP_ID(phaseKey)}"><p class="cv-label cv-phase">${escapeHTML(s[phaseKey])}</p></div>`;
        $('cv-upcoming').innerHTML = upcoming.map((k) => `<div class="cv-step" data-step="${k}"><p class="cv-label">${escapeHTML(s[k])}</p></div>`).join('');
      };
      if (lastTimelineKey && lastTimelineKey.split('|')[0] === state.lang) flipTimeline(apply); else apply();
      lastTimelineKey = key;
    }

    // timer: WAIT_MELT or 0 dims it
    const isWaitMelt = cook.phase === 'waitMelt' && cook.cheese;
    const rem = Math.max(0, cook.remaining);
    const min = Math.floor(rem / 60), sec = rem % 60;
    $('cv-timer').classList.toggle('is-dimmed', isWaitMelt || rem <= 0);
    $('cv-min').textContent = min; $('cv-sec').textContent = String(sec).padStart(2, '0');
    $('cv-min').classList.toggle('is-wide', min >= 10); $('cv-sec').classList.toggle('is-wide', min >= 10);

    $('cv-guide').hidden = !isWaitMelt;
    $('cv-guide-text').textContent = s.placeCheese;

    // action bar
    const aborting = cook.abort > 0;
    const stopLabel = cook.phase === 'clean' ? s.stopScrape : s.stopCooking;
    const stopBtn = (cls) => `<button type="button" class="cv-btn-wrap ${cls}" data-cook="stop" aria-disabled="${aborting}"><span class="cv-btn is-stop"><svg aria-hidden="true"><use href="#i-stop-fill"/></svg><span class="type-body2">${escapeHTML(stopLabel)}</span></span></button>`;
    $('cv-bar').innerHTML = isWaitMelt
      ? stopBtn('is-stop-pair') + `<button type="button" class="cv-btn-wrap is-cheese" data-cook="melt" aria-disabled="${aborting}"><span class="cv-btn is-primary"><svg aria-hidden="true"><use href="#i-play-fill"/></svg><span class="type-body2">${escapeHTML(s.startCheeseCooking)}</span></span></button>`
      : stopBtn('is-stop-only');
  }

  // ── Render ───────────────────────────────────────────────────────────────
  function renderHeader(d) {
    const sw = $('clean-switch');
    const slide = $('switch-slide');
    // headerCleanSwitchColor(): no recipe / standby → black, READY → green, else red.
    const color = !d.recipe || d.phase === 'standby' ? 'black' : cook ? (cook.phase === 'waitMelt' ? 'green' : 'red') : d.isReady ? 'green' : 'red';
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
    $('switch-left').textContent = d.str.grill;
    $('switch-right').textContent = d.str.clean;
    $('temp-btn').setAttribute('aria-label', d.str.temperatureTitle);
  }

  function renderStatus(d) {
    const container = $('cook-container');
    container.classList.remove('bg-cook-preparing', 'bg-cook-ready-to-cook', 'bg-black');
    // cooking: STATE_TO_BACKGROUND — red, WAIT_MELT green
    const cookBg = cook ? (cook.phase === 'waitMelt' ? 'bg-cook-ready-to-cook' : 'bg-cook-preparing') : null;
    container.classList.add(!d.recipe ? 'bg-black' : cookBg || (d.isReady ? 'bg-cook-ready-to-cook' : 'bg-cook-preparing'));

    // From v14 (?from=v14): the cook option leads the phase line, as the quick button's status
    // does ("웰던 · 준비 중"), instead of riding in a pill under the name.
    const optionInPhase = document.documentElement.dataset.from === 'v14';
    const pill = d.multi && !optionInPhase;

    // cook-preheat-screen / cook-ready-screen wrapper (the multi-option spacing only makes room
    // for the pill, so without one every recipe sits the same)
    const wrap = $('status-wrap');
    wrap.className = pill ? 'mt-[270px] flex flex-col gap-8' : 'mt-[290px] flex flex-col gap-13.5';
    if (!d.isPreheat) wrap.classList.add('items-center');
    wrap.classList.toggle('hidden', !d.recipe);

    // RecipeInfo
    $('recipe-info').className = 'flex flex-col items-center ' + (pill ? 'gap-8' : 'gap-13.5');
    $('phase-group').className = 'flex flex-col items-center ' + (pill ? 'gap-5' : 'gap-2');
    const phase = $('phase-label');
    phase.textContent = (optionInPhase && d.multi && d.option ? d.option.name + ' · ' : '') + (d.isPreheat ? d.str.preparing : d.str.ready);
    phase.className = 'text-center text-[28px] leading-[130%] font-medium tracking-[0.56px] ' + (d.isPreheat ? 'text-[#C39D9D]' : 'text-white/60');
    $('recipe-name').textContent = d.recipe ? d.recipe.name : '-';
    const badge = $('cook-option-badge');
    badge.classList.toggle('hidden', !pill);
    badge.classList.toggle('flex', pill);
    $('cook-option-name').textContent = d.multi && d.option ? d.option.name : '';

    // temperatureHint (preheat only): max(remaining, overshoot)
    const hint = $('temp-hint');
    hint.classList.toggle('hidden', !d.isPreheat);
    hint.classList.toggle('flex', d.isPreheat);
    $('temp-hint-state').textContent = (d.temps.isOvershoot ? d.str.coolingDown : d.str.heatingUp) + ' ·';
    setReadout($('temp-hint-value'), fmtTempDelta(Math.max(d.temps.remainingDeltaTemp, d.temps.overshootDeltaTemp)),
      (d.isPreheat ? 'preheat' : 'none') + ':' + (d.option ? d.option.id : '') + ':' + tempUnitF());
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

  // v15 (and v0 reached from it): a temperature readout changes at most once a second, so it can be
  // read; a change of kind (shown ↔ hidden, other recipe) goes through at once.
  // v15 (and v0 reached from it): temperatures follow 설정 → 온도 (°C / °F). The sim is in °C.
  function tempUnitF() {
    const h = document.documentElement;
    if (!(h.dataset.variant === 'v15' || h.dataset.fromVariant === 'v15')) return false;
    // the settings page (menu.js) mirrors its unit here once it loads; until then, the saved one —
    // except in an embedded frame (?embed: handoff screens), which starts from the default °C
    if (h.dataset.tempUnit) return h.dataset.tempUnit === '°F';
    if (new URLSearchParams(location.search).has('embed')) return false;
    try { return JSON.parse(localStorage.getItem('proto:temperatureUnit')) === '°F'; } catch (e) { return false; }
  }
  // a temperature *difference* ("163°C 남음"): °F is × 9/5, no + 32
  function fmtTempDelta(c) { return tempUnitF() ? Math.round((c * 9) / 5) + '°F' : Math.round(c) + '°C'; }
  function setReadout(el, text, kind) {
    const h = document.documentElement;
    if (!(h.dataset.variant === 'v15' || h.dataset.fromVariant === 'v15')) { el.textContent = text; return; }
    const now = performance.now();
    if (el.dataset.kind !== kind || now - (Number(el.dataset.at) || 0) >= 1000) {
      if (el.textContent !== text) el.dataset.at = now;
      el.dataset.kind = kind;
      el.textContent = text;
    }
  }

  function renderActions(d) {
    // the app's select-recipe screen has no action panel
    $('action-panel').classList.toggle('hidden', !d.recipe);
    $('qa-recipe-label').textContent = d.str.changeRecipe;
    $('qa-unload-label').textContent = d.str.unload;
    $('qa-scrape-label').textContent = d.str.quickClean;
    const autoUnloadOn = !state.withoutArm;
    $('qa-unload-state').textContent = autoUnloadOn ? 'ON' : 'OFF';
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

  // Reached from v14 with 빠른 레시피 선택 off (?from=v14): v14's sheet — the slide in and
  // out, and v0-4's layout and scrims — so the sheet is the same with the setting on or off.
  const SHEET_V14 = document.documentElement.dataset.from === 'v14';
  const SHEET_CLOSE_MS = 220;  // matches --sheet-close-dur in proto.css
  let sheetHideTimer = 0;
  function renderSheet(d) {
    { // v15's smaller ✕ in the sheet header too, when reached from v15
      const u = document.querySelector('#recipe-sheet [data-action="sheet-header-close"] use');
      if (u && document.documentElement.dataset.fromVariant === 'v15' && u.getAttribute('href') === '#i-x') u.setAttribute('href', '#i-x-small');
    }
    const wrap = $('recipe-sheet');
    if (!SHEET_V14) {
      wrap.classList.toggle('hidden', !state.sheet.open);
      if (!state.sheet.open) return;
    } else if (!state.sheet.open) {
      if (wrap.classList.contains('is-open')) {
        wrap.classList.remove('is-open');
        clearTimeout(sheetHideTimer);
        sheetHideTimer = setTimeout(() => wrap.classList.add('hidden'), SHEET_CLOSE_MS);
      }
      return;
    } else {
      clearTimeout(sheetHideTimer);
      if (!wrap.classList.contains('is-open')) {
        wrap.classList.remove('hidden');
        void wrap.offsetHeight;  // start from the closed position
        wrap.classList.add('is-open');
      }
    }

    const list = $('sheet-list');
    const depth = state.sheet.depthRecipeId != null ? RECIPES.find((r) => r.id === state.sheet.depthRecipeId) : null;
    $('sheet-title').textContent = depth ? depth.name : d.str.recipe;
    // the cook-option level titles with the recipe's own name: no caps / tracking there
    $('sheet-title').classList.toggle('is-recipe-name', !!depth);
    $('recipe-sheet').querySelector('[data-action="sheet-back"]').hidden = !(SHEET_V14 && depth);

    const itemClass = (selected) =>
      'flex h-25 w-full shrink-0 items-center gap-0.5 rounded-sm py-4 pr-7 pl-1.5 transition focus:outline-none focus-visible:outline-none ' +
      (SHEET_V14 ? (selected ? 'sheet-row-on' : '')
        : selected ? 'bg-white/30 shadow-[inset_0_0_0_2px_white] active:opacity-70' : 'active:bg-black/40');

    const check = (selected) => SHEET_V14 && selected ? '<svg class="sheet-check" aria-hidden="true"><use href="#i-check"/></svg>' : '';
    const nameCell = (name, selected) => SHEET_V14
      ? `<span class="type-body2 flex min-w-0 flex-1 items-center gap-3 text-left text-white"><span class="min-w-0 truncate">${name}</span>${check(selected)}</span>`
      : `<span class="type-body2 min-w-0 flex-1 truncate text-left text-white">${name}</span>`;
    const countCell = (n) => SHEET_V14
      ? `<span class="type-body2 sheet-count shrink-0 text-white/70">${n}<svg aria-hidden="true"><use href="#i-chevron-right"/></svg></span>`
      : `<span class="type-body2 shrink-0 text-center text-white/70">${d.str.cookOptionCount(n)}</span>`;

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
                 ${countCell(r.cookOptions.length)}
               </div>`
            : nameCell(r.name, r.id === state.recipeId)}
        </button>`).join('');
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
    // v15 (and v0 reached from it): fade out for 120ms before hiding (.is-closing in proto.css)
    const h = document.documentElement;
    const fades = h.dataset.variant === 'v15' || h.dataset.fromVariant === 'v15';
    if (!state.tempModalOpen) {
      if (wrap.classList.contains('hidden') || wrap.classList.contains('is-closing')) return;
      if (!fades || matchMedia('(prefers-reduced-motion: reduce)').matches) { wrap.classList.add('hidden'); return; }
      wrap.classList.add('is-closing');
      setTimeout(() => { wrap.classList.remove('is-closing'); if (!state.tempModalOpen) wrap.classList.add('hidden'); }, 120);
      return;
    }
    wrap.classList.remove('is-closing');
    const opening = wrap.classList.contains('hidden');
    if (fades) { const u = wrap.querySelector('[data-action="temp-close"] use'); if (u && u.getAttribute('href') === '#i-x') u.setAttribute('href', '#i-x-small'); }   // v15's smaller ✕
    wrap.classList.remove('hidden');
    // v15: the readings refresh once a second (readable; the sim underneath still runs every 200ms),
    // with no motion on change. Shown at once on open.
    if (fades) {
      const now = performance.now();
      if (!opening && now - (renderTempModal.lastRead || 0) < 1000) return;
      renderTempModal.lastRead = now;
    }
    $('tm-title').textContent = d.str.temperatureTitle;
    $('tm-griddle').textContent = fades ? '' : d.str.griddleLabel;   // v15: no 그리들 over 상판 / 하판
    // v15: the columns say what they are — 목표 / 현재 + the unit — instead of the recipe's name over the
    // targets, and the panel follows 설정 → 온도 (°C / °F): its numbers convert, the headers name the unit
    const unitF = tempUnitF();
    const unit = unitF ? '°F' : '°C';
    const conv = (c) => (unitF ? (c * 9) / 5 + 32 : c);
    $('tm-current').textContent = fades ? d.str.currentLabel + ' ' + unit : d.str.currentLabel;
    $('tm-top-label').textContent = d.str.topPlate;
    $('tm-bot-label').textContent = d.str.bottomPlate;
    $('tm-recipe').textContent = fades ? d.str.targetLabel + ' ' + unit : (d.recipe ? d.recipe.name : '-');
    $('tm-top-target').textContent = Math.round(conv(d.temps.top.target));
    $('tm-bot-target').textContent = Math.round(conv(d.temps.bottom.target));
    const line = (id, value, heating) => {
      const el = $(id);
      const text = conv(value).toFixed(1);
      el.textContent = text;
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
    renderCooking(d);
    const speedBtn = document.querySelector('[data-dev="speed"]');
    if (speedBtn) speedBtn.textContent = '×' + cookSpeed.value;
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
  function closeSheet() {
    state.sheet.open = false;
    state.sheet.depthRecipeId = null;
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
  $('qa-unload').addEventListener('click', () => {
    // From v14 the icon's colour fades with the background (600ms); an ON / OFF tap changes it
    // at once instead (.no-fade turns the transition off for this one change).
    const icon = $('qa-unload-icon');
    icon.classList.add('no-fade');
    state.withoutArm = !state.withoutArm;
    render();
    getComputedStyle(icon).color;  // apply the new colour before the transition comes back (svg has no offsetWidth)
    icon.classList.remove('no-fade');
  });
  $('qa-scrape').addEventListener('click', () => console.info('[Cook] send("clean") — 간이 청소 (out of scope)'));
  $('primary-btn').addEventListener('click', () => {
    if ($('primary-btn').getAttribute('aria-disabled') === 'true') return;
    startCook('cook');   // send("cook")
  });
  $('menu-btn').addEventListener('click', () => console.info('[Cook] openMenu (out of scope)'));
  $('clean-switch').addEventListener('click', () => console.info('[Cook] clean mode toggle (out of scope)'));
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
      // from v14: ✕ always closes the sheet, and ‹ goes back; the app's ✕ goes back first
      if (!SHEET_V14 && state.sheet.depthRecipeId != null) { state.sheet.depthRecipeId = null; render(); }
      else closeSheet();
    }
    if (action === 'sheet-back') { state.sheet.depthRecipeId = null; render(); }
    if (action === 'sheet-prev' || action === 'sheet-next') {
      const delta = action === 'sheet-prev' ? -1 : 1;
      if (state.sheet.depthRecipeId != null) state.sheet.optionPage = Math.max(1, state.sheet.optionPage + delta);
      else state.sheet.page = Math.max(1, state.sheet.page + delta);
      render();
    }
  });

  $('cv-bar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cook]');
    if (!b || b.getAttribute('aria-disabled') === 'true' || !cook) return;
    if (b.dataset.cook === 'stop') stopCook();
    if (b.dataset.cook === 'melt' && cook.phase === 'waitMelt') { enterPhase('melt'); render(); }   // send("cook")
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
  setInterval(() => {
    state.blink = !state.blink;
    if (derive().isPreheat) paintRing(derive());
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
  // proto-only: cooking clock speed ×1 → ×5 → ×20
  const speedBtn = document.querySelector('[data-dev="speed"]');
  if (speedBtn) speedBtn.addEventListener('click', () => {
    cookSpeed.value = cookSpeed.value === 1 ? 5 : cookSpeed.value === 5 ? 20 : 1;
    restartCookTimer(); render();
  });

  function setScenario(key) {
    if (!SCENARIOS[key]) { console.warn('[Cook] unknown scenario', key); return; }
    sim = null;
    cook = null;
    state.scenario = key;
    if (SCENARIOS[key].noRecipe) state.recipeId = null;
    else if (SCENARIOS[key].recipeId) {
      const r = RECIPES.find((x) => x.id === SCENARIOS[key].recipeId) || RECIPES[0];
      state.recipeId = r.id; state.cookOptionId = r.cookOptions[0].id; state.withoutArm = !!r.cookOptions[0].withoutArm;
    }
    else if (state.recipeId == null) {
      state.recipeId = 1;
      state.cookOptionId = 1;
      state.withoutArm = !!RECIPES[0].cookOptions[0].withoutArm;
    }
    if (SCENARIOS[key].cook) { startCook(SCENARIOS[key].cook); return; }
    render();
  }
  function setLang(lang) {
    if (!STRINGS[lang]) return;
    state.lang = lang;
    render();
  }
  // ── Init ─────────────────────────────────────────────────────────────────
  buildRing($('tick-ring'));
  if (SCENARIOS[state.scenario].cook) setScenario(state.scenario); else render();

  window.Cook = { state, SCENARIOS, RECIPES, setScenario, setLang, render, startCook, stopCook, get sim() { return sim; }, get cook() { return cook; } };
})();
