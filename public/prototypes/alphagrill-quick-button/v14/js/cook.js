/* ==========================================================================
   cook.js — 조리 탭 준비 중(PREHEAT) / 준비 완료(READY) 화면 동작
   --------------------------------------------------------------------------
   Ported from fw-app-tauri-AlphaGrill (main @ b9ebd24):
     features/cook/components/screens/cook-preheat-screen.tsx, cook-ready-screen.tsx,
       cook-select-recipe-screen.tsx
     features/cook/lib/utils.ts            (computeCookStatusTemps)
     features/recipe/recipe-bottom-sheet/* (list, cook-option list, pagination)
     api/recipe/recipe.mock.ts             (recipes)
     e2e/mocks/stm.ts                      (scenario temps / heat presets)

   v8: fixed 2 × 3 recipe grid, tap pagination, inline option grid, compact
   readiness, and fixed bottom controls. Recipes retain their positions.
   Temperature simulation and temperature modal match the other variants.
   Cook.setScenario('ready'), Cook.setLang('en'), Cook.state, Cook.render().
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
      preparing: 'Preparing',
      ready: 'Ready to cook',
      placeFood: 'Place food on the grill and start',
      selectRecipe: 'Select a recipe',
      openRecipePicker: 'Select recipe',
      heatingUp: 'Heating',
      coolingDown: 'Cooling down',
      remaining: 'remaining',
      changeRecipe: 'Change recipe',
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
  // NOTE: ids 4–6 are extra (from e2e/mocks/recipe.ts presets) so the quick
  //       grid has more than one page to demonstrate paging.
  const RECIPE_POOL = [
    { id: 1,  name: '불고기 패티',     cookOptions: [{ id: 1, name: 'default', top: 250, bot: 230, cookingSec: 240, meltingSec: 0,  thickness: 30 }] },
    { id: 2,  name: 'Beef Burger',     cookOptions: [{ id: 2, name: 'default', top: 250, bot: 230, cookingSec: 150, meltingSec: 10, thickness: 22 }] },
    { id: 3,  name: 'Salmon Fillet',   cookOptions: [{ id: 3, name: 'default', top: 200, bot: 200, cookingSec: 120, meltingSec: 5,  thickness: 18, withoutArm: true }] },
    { id: 10, name: 'Ribeye Steak',    cookOptions: [
      { id: 101, name: '레어', top: 270, bot: 240, cookingSec: 120, meltingSec: 0, thickness: 30 },
      { id: 102, name: '웰던', top: 250, bot: 230, cookingSec: 300, meltingSec: 0, thickness: 30 },
    ] },
    { id: 11, name: 'Tenderloin Steak', cookOptions: [
      { id: 111, name: '레어',       top: 270, bot: 230, cookingSec: 150, meltingSec: 8,  thickness: 13, withoutArm: true },
      { id: 112, name: '미디엄 레어', top: 260, bot: 220, cookingSec: 180, meltingSec: 0,  thickness: 14 },
      { id: 113, name: '미디엄',     top: 250, bot: 210, cookingSec: 210, meltingSec: 10, thickness: 15 },
      { id: 114, name: '미디엄웰던', top: 240, bot: 200, cookingSec: 240, meltingSec: 0,  thickness: 16 },
      { id: 115, name: '웰던',       top: 230, bot: 190, cookingSec: 300, meltingSec: 12, thickness: 18 },
    ] },
    { id: 4,  name: '10oz Ribeye',     cookOptions: [{ id: 4, name: 'default', top: 260, bot: 240, cookingSec: 300, meltingSec: 15, thickness: 35 }] },
    { id: 5,  name: 'Chicken Breast',  cookOptions: [{ id: 5, name: 'default', top: 200, bot: 200, cookingSec: 180, meltingSec: 0,  thickness: 20 }] },
    { id: 6,  name: 'Lamb Chop',       cookOptions: [{ id: 6, name: 'default', top: 240, bot: 220, cookingSec: 200, meltingSec: 12, thickness: 25 }] },
  ];

  // Dev bar "레시피 N개": the list the screen sees. Counts past the pool are filled with
  // single-option clones ("레시피 9", …) so paging can be tried with any number.
  const RECIPES = [];
  const RECIPE_COUNT_MAX = 20;
  function setRecipeList(count) {
    const n = Math.max(1, Math.min(RECIPE_COUNT_MAX, count | 0));
    RECIPES.length = 0;
    for (let i = 0; i < n; i++) {
      if (i < RECIPE_POOL.length) { RECIPES.push(RECIPE_POOL[i]); continue; }
      const base = RECIPE_POOL[i % 3];
      RECIPES.push({ id: 1000 + i, name: '레시피 ' + (i + 1), cookOptions: [{ ...base.cookOptions[0], id: 1000 + i }] });
    }
    return n;
  }

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
  const QUICK_PAGE = 6;
  const QUICK_PAGE_STANDBY = 10;   // 2 × 5: with no recipe the bottom buttons are hidden, so the grid takes their room

  // ── State ────────────────────────────────────────────────────────────────
  const params = new URLSearchParams(location.search);
  const state = {
    scenario: SCENARIOS[params.get('scenario')] ? params.get('scenario') : 'preheatCold',
    lang: STRINGS[params.get('lang')] ? params.get('lang') : 'ko',
    recipeId: 1,
    cookOptionId: 1,
    withoutArm: false,           // false = 배출(auto-unload) ON
    sheet: { open: false, page: 1, depthRecipeId: null, optionPage: 1 },
    quickList: { page: 1, depthRecipeId: null, optionPage: 1 },
    tempModalOpen: false,
  };
  if (SCENARIOS[state.scenario].noRecipe) state.recipeId = null;
  state.recipeCount = setRecipeList(Number(params.get('recipes')) || RECIPE_POOL.length);

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
    $('switch-left').textContent = d.str.grill;
    $('switch-right').textContent = d.str.clean;
    $('temp-btn').setAttribute('aria-label', d.str.temperatureTitle);
  }

  function renderStatus(d) {
    const container = $('cook-container');
    container.classList.remove('bg-cook-preparing', 'bg-cook-ready-to-cook', 'bg-black');
    container.classList.add(!d.recipe ? 'bg-black' : d.isReady ? 'bg-cook-ready-to-cook' : 'bg-cook-preparing');
    $('grid-status').dataset.phase = !d.recipe ? 'standby' : d.isReady ? 'ready' : 'preheat';
    $('grid-phase').textContent = !d.recipe ? d.str.selectRecipe : d.isReady ? d.str.ready : d.str.preparing;
    // the cook option rides in a pill beside the name, the way the app's hero shows it
    $('grid-current').innerHTML =
      `<span class="grid-current-name">${escapeHTML(d.recipe ? d.recipe.name : d.str.selectRecipe)}</span>`;
    // the cook option leads the status line instead of a pill: "웰던 · 준비 완료" / "웰던 · 163°C 남음"
    $('grid-option').textContent = d.recipe && d.multi && d.option ? d.option.name : '';
    // the temperature alone; the phase word ("가열 중 ·") is dropped
    $('grid-hint').textContent = d.isPreheat
      ? Math.round(Math.max(d.temps.remainingDeltaTemp, d.temps.overshootDeltaTemp)) + '°C ' + d.str.remaining
      : '';
  }

  function renderActions(d) {
    // 배출 stays in place with no recipe and greys out, the way 조리 시작 does
    const unload = $('quick-unload');
    unload.disabled = !d.recipe;
    unload.setAttribute('aria-checked', !state.withoutArm && !!d.recipe);
    $('quick-unload-label').textContent = d.str.unload;
    $('quick-unload-state').textContent = state.withoutArm || !d.recipe ? 'Off' : 'On';   // sentence case, like the phase labels
    $('quick-scrape-label').textContent = d.str.quickClean;
    $('primary-label').textContent = d.str.startCooking;
    $('primary-btn').disabled = !d.isReady;
    $('primary-btn').setAttribute('aria-disabled', !d.isReady);
  }

  const escapeHTML = (text) => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function gridButton(attribute, id, name, meta, selected, hasOptions) {
    // v13: each card carries a view-transition-name, so a card that is on screen before and
    // after a transition morphs to its new place/size instead of being redrawn.
    const vtName = (attribute === 'data-quick-option' ? 'vt-option-' : 'vt-recipe-') + id;
    return `<button type="button" ${attribute}="${id}" class="recipe-key${selected ? ' is-selected' : ''}" aria-pressed="${selected}" style="view-transition-name: ${vtName}">
      <span class="recipe-key-name"><span class="recipe-key-text">${escapeHTML(name)}</span>${selected ? '<span class="recipe-key-check" aria-hidden="true">✓</span>' : ''}</span>
      <span class="recipe-key-meta">${escapeHTML(meta)}${hasOptions ? '<svg aria-hidden="true"><use href="#i-chevron-right-thin"/></svg>' : ''}</span>
    </button>`;
  }

  function renderQuick(d) {
    const g = state.quickList;
    const depth = RECIPES.find(r => r.id === g.depthRecipeId);
    const items = depth ? depth.cookOptions : RECIPES;
    const size = !depth && !d.recipe ? QUICK_PAGE_STANDBY : QUICK_PAGE;
    // When the page size changes (a recipe gets picked), keep the first recipe that was on screen.
    if (!depth && g.pageSize && g.pageSize !== size) {
      // v13: land on the page that holds the selected recipe (8th of 6-a-page → page 2);
      // with nothing selected, keep the first recipe that was on screen.
      const idx = d.recipe ? RECIPES.findIndex((r) => r.id === d.recipe.id) : -1;
      g.page = idx >= 0 ? Math.floor(idx / size) + 1 : Math.floor(((g.page - 1) * g.pageSize) / size) + 1;
    }
    // First render: open on the page that holds the selected recipe, as after a first selection.
    if (!depth && !g.pageSize && d.recipe) {
      const idx = RECIPES.findIndex((r) => r.id === d.recipe.id);
      if (idx >= 0) g.page = Math.floor(idx / size) + 1;
    }
    if (!depth) g.pageSize = size;
    const totalPages = Math.max(1, Math.ceil(items.length / size));
    const pageNo = Math.max(1, Math.min(depth ? g.optionPage : g.page, totalPages));
    if (depth) g.optionPage = pageNo; else g.page = pageNo;
    const start = (pageNo - 1) * size;
    $('quick-back').hidden = !depth;
    // the heading band is always there; on the recipe screen it is simply blank
    $('grid-option-heading').classList.toggle('is-blank', !depth);
    $('grid-back-label').textContent = d.str.recipe;
    $('grid-title').textContent = depth ? depth.name : '';
    const cells = items.slice(start, start + size).map((item, index) => {
      const selected = depth ? state.recipeId === depth.id && state.cookOptionId === item.id : state.recipeId === item.id;
      const multi = !depth && item.cookOptions.length > 1;
      // no "선택됨" label: the fill, the border and the check already say it
      const meta = multi ? (selected && d.option ? d.option.name : String(item.cookOptions.length)) : '';  // "N ›", as in v4
      return gridButton(depth ? 'data-quick-option' : 'data-quick-recipe', item.id, item.name, meta, selected, multi);
    });
    // Empty slots reserve the same positions on short pages; no reordering or swiping.
    while (cells.length < size) cells.push('<div class="recipe-key-empty" aria-hidden="true"></div>');
    // No lines at all: spacing and the selected scrim are the only separation.
    const markup = cells.join('');
    // Temperature updates run every 200ms. Preserve the buttons and keyboard focus.
    // Compare with the last markup written, not innerHTML: the browser's serialisation never
    // matches the template string, so the cards were rebuilt on every render (and the selected
    // card's colour change could not animate).
    if (renderQuick.last !== markup) { $('quick-list').innerHTML = markup; renderQuick.last = markup; }
    $('quick-page-cur').textContent = pageNo;
    $('quick-page-total').textContent = '/ ' + totalPages;
    const pager = $('quick-pager');
    pager.style.visibility = totalPages > 1 ? 'visible' : 'hidden';
    // one page: no pager, so the cards take a little of its room (see proto.css)
    $('quick-panel').classList.toggle('is-single-page', totalPages <= 1);
    pager.setAttribute('aria-label', state.lang === 'ko' ? '레시피 페이지' : 'Recipe pages');
    const prev = pager.querySelector('[data-quick-nav="-1"]');
    const next = pager.querySelector('[data-quick-nav="1"]');
    prev.setAttribute('aria-label', d.str.prev);
    next.setAttribute('aria-label', d.str.next);
    setPaginationDisabled(prev, pageNo <= 1);
    setPaginationDisabled(next, pageNo >= totalPages);
  }

  let sheetHideTimer = 0;
  const SHEET_CLOSE_MS = 220;  // matches --sheet-close-dur in proto.css
  function renderSheet(d) {
    const wrap = $('recipe-sheet');
    // v14: the sheet slides up and down. It stays in the DOM while it closes and is only
    // hidden once the slide ends; content keeps what it showed so nothing swaps mid-exit.
    if (!state.sheet.open) {
      if (wrap.classList.contains('is-open')) {
        wrap.classList.remove('is-open');
        clearTimeout(sheetHideTimer);
        sheetHideTimer = setTimeout(() => wrap.classList.add('hidden'), SHEET_CLOSE_MS);
      }
      return;
    }
    clearTimeout(sheetHideTimer);
    if (!wrap.classList.contains('is-open')) {
      wrap.classList.remove('hidden');
      void wrap.offsetHeight;  // start from the closed position
      wrap.classList.add('is-open');
    }

    const list = $('sheet-list');
    const depth = state.sheet.depthRecipeId != null ? RECIPES.find((r) => r.id === state.sheet.depthRecipeId) : null;
    $('sheet-title').textContent = depth ? depth.name : d.str.recipe;
    // the cook-option level titles with the recipe's own name: no caps / tracking there
    $('sheet-title').classList.toggle('is-recipe-name', !!depth);
    $('recipe-sheet').querySelector('[data-action="sheet-back"]').hidden = !depth;

    const itemClass = (selected) =>
      'flex h-25 w-full shrink-0 items-center gap-0.5 rounded-sm py-4 pr-7 pl-1.5 transition focus:outline-none focus-visible:outline-none ' +
      (selected ? 'sheet-row-on' : '');   // v14 (from v0-4): dark band scrim + check instead of white fill + outline

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
    $('tm-top-target').textContent = Math.round(d.temps.top.target);
    $('tm-bot-target').textContent = Math.round(d.temps.bottom.target);
    const line = (id, value, heating) => {
      const el = $(id);
      el.textContent = value.toFixed(1);
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
    renderQuick(d);
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
    state.quickList.depthRecipeId = null;
    closeSheet();
  }

  $('primary-btn').addEventListener('click', () => {
    if ($('primary-btn').getAttribute('aria-disabled') === 'true') return;
    console.info('[Cook] send("cook") — 조리 시작 (out of scope)');
  });
  $('menu-btn').addEventListener('click', () => console.info('[Cook] openMenu (out of scope)'));
  $('clean-switch').addEventListener('click', () => console.info('[Cook] clean mode toggle (out of scope)'));
  $('temp-btn').addEventListener('click', () => { state.tempModalOpen = true; render(); });

  // v14: tapping the status block (recipe name / 레시피를 선택하세요) opens the recipe sheet.
  // TODO(미정): 시트를 여는 자리 — 지금은 상태 블록 탭.
  $('grid-status').addEventListener('click', openSheet);

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
    // v14: ✕ always closes the sheet; ‹ (cook-option level only) goes back to the recipe list
    if (action === 'sheet-header-close') closeSheet();
    if (action === 'sheet-back') { state.sheet.depthRecipeId = null; render(); }
    if (action === 'sheet-prev' || action === 'sheet-next') {
      const delta = action === 'sheet-prev' ? -1 : 1;
      if (state.sheet.depthRecipeId != null) state.sheet.optionPage = Math.max(1, state.sheet.optionPage + delta);
      else state.sheet.page = Math.max(1, state.sheet.page + delta);
      render();
    }
  });

  // Quick mode: selection row + grid (tap only)
  $('quick-unload').addEventListener('click', () => { state.withoutArm = !state.withoutArm; render(); });
  $('quick-scrape').addEventListener('click', () => console.info('[Cook] send("clean") — 간이 청소 (out of scope)'));

  // v13: the first selection (no recipe → recipe) turns the 2 × 5 grid into 2 × 3 with the
  // pager and bottom buttons. Run it as a View Transition: the tapped card fills at once,
  // then cards on both sides morph to their new place/size, leaving ones fade out, arriving
  // ones and the bottom buttons fade/slide in (timings in proto.css).
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function selectWithTransition(btn, apply) {
    if (state.recipeId != null || !document.startViewTransition || reduceMotion.matches) { apply(); return; }
    btn.classList.add('is-selected');   // immediate feedback, captured in the "old" snapshot
    document.startViewTransition(apply);
  }

  // Recipe level ↔ cook-option level: the grid slides sideways (in from the right going in,
  // back from the left coming out); html.vt-drill-in / vt-drill-out picks the direction in proto.css.
  function drillWithTransition(dir, apply) {
    if (!document.startViewTransition || reduceMotion.matches) { apply(); return; }
    const root = document.documentElement;
    root.classList.add('vt-drill-' + dir);
    const t = document.startViewTransition(apply);
    t.finished.finally(() => root.classList.remove('vt-drill-' + dir));
  }

  $('quick-panel').addEventListener('click', (e) => {
    const g = state.quickList;
    const recipeBtn = e.target.closest('[data-quick-recipe]');
    if (recipeBtn) {
      const recipe = RECIPES.find((r) => r.id === Number(recipeBtn.dataset.quickRecipe));
      if (!recipe) return;
      if (recipe.cookOptions.length > 1) {
        drillWithTransition('in', () => { g.depthRecipeId = recipe.id; g.optionPage = 1; render(); });
      } else {
        selectWithTransition(recipeBtn, () => selectRecipe(recipe.id, recipe.cookOptions[0].id));
      }
      return;
    }
    const optionBtn = e.target.closest('[data-quick-option]');
    if (optionBtn) { selectWithTransition(optionBtn, () => selectRecipe(g.depthRecipeId, Number(optionBtn.dataset.quickOption))); return; }
    // the recipe title next to it goes back too, so the target runs from ‹ to the end of the name
    // the whole heading band (‹ 레시피 + recipe name, edge to edge) goes back to the recipes
    if (e.target.closest('#quick-back, #grid-title, #grid-option-heading:not(.is-blank)')) { drillWithTransition('out', () => { g.depthRecipeId = null; render(); }); return; }
    const nav = e.target.closest('[data-quick-nav]');
    if (nav) {
      const delta = Number(nav.dataset.quickNav);
      if (g.depthRecipeId != null) g.optionPage = Math.max(1, g.optionPage + delta);
      else g.page = Math.max(1, g.page + delta);
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
    else if (state.quickList.depthRecipeId != null) { state.quickList.depthRecipeId = null; render(); }
  });

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
  const countSel = document.querySelector('[data-dev="recipes"]');
  if (countSel) {
    for (let n = 1; n <= RECIPE_COUNT_MAX; n++) {
      const opt = document.createElement('option');
      opt.value = n;
      opt.textContent = '레시피 ' + n + '개';
      countSel.appendChild(opt);
    }
    countSel.value = state.recipeCount;
    countSel.addEventListener('change', () => setRecipeCount(Number(countSel.value)));
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
    state.quickList = { page: 1, depthRecipeId: null, optionPage: 1 };
    render();
  }
  function setRecipeCount(n) {
    state.recipeCount = setRecipeList(n);
    // the selected recipe may have dropped off the list: fall back to the first one
    if (state.recipeId != null && !RECIPES.some((r) => r.id === state.recipeId)) {
      state.recipeId = RECIPES[0].id;
      state.cookOptionId = RECIPES[0].cookOptions[0].id;
    }
    state.quickList = { page: 1, depthRecipeId: null, optionPage: 1 };
    const q = new URLSearchParams(location.search);
    q.set('recipes', state.recipeCount);
    history.replaceState(null, '', '?' + q + location.hash);
    render();
  }
  function setLang(lang) {
    if (!STRINGS[lang]) return;
    state.lang = lang;
    render();
  }
  // ── Init ─────────────────────────────────────────────────────────────────
  render();

  window.Cook = { state, SCENARIOS, RECIPES, setScenario, setRecipeCount, setLang, render, get sim() { return sim; } };
})();
