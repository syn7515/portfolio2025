/* ==========================================================================
   menu.js — 메뉴 오버레이 + 설정 화면 (shared by every variant)
   --------------------------------------------------------------------------
   Ported from fw-app-tauri-AlphaGrill (main @ b9ebd24):
     components/layout/menu.tsx        (Menu, MenuItem, footer)
     contexts/menu-context.tsx         (open/close; closes on navigation)
     app/routes/setting.tsx            (SettingPage, SettingSwitchRow, FoodDetectionRow)
     components/layout/header.tsx      (Header)
     components/ui/switch.tsx          (Switch variant="sm" color="gray")
     components/ui/toggle-switch.tsx   (ToggleSwitch)
     components/ui/button-with-icon.tsx
     locales/{ko,en}.json              (setting.*, recipe.Recipes, engineer.manageDevice)

   Both layers are `fixed` portals in the app; here they are `absolute` inside #device
   so they stay in the scaled 600×1024 canvas. The settings page is a route in the app
   (/setting, back → /cook); here it is a full-screen layer over the cook screen.

   Out of scope (tapping logs to the console, like the app's other stubs here):
     레시피 (/recipe), 장비 관리 (/manage-device, behind the engineer PIN).
   Mocked: network / product / version footer, 조리물 감지 (outputting model).
   Prototype-only: 빠른 레시피 선택 — off shows v0 (the app as it ships), see app.js.
   Language drives the variant's own Cook.setLang; units and food detection are kept
   in localStorage only (nothing on the cook screen reads them yet).
   ========================================================================== */

(function () {
  'use strict';

  const device = document.getElementById('device');
  const MENU_SRC = document.currentScript ? document.currentScript.src : location.href;
  if (!device) return;

  const STR = {
    ko: {
      recipes: '레시피', settings: '설정', manageDevice: '장비 관리',
      unitAndLanguage: '단위 및 언어', temperature: '온도', length: '길이', language: '언어',
      otherFeatures: '기타 기능', foodDetection: '조리물 감지',
      foodDetectionDesc: '그리들 위 조리물 위치에 맞춰 배출합니다',
      quickSelect: '빠른 레시피 선택', quickSelectDesc: '조리 화면에서 레시피를 바로 고릅니다',
      close: '닫기', back: '뒤로',
      // recipe page (app/routes/recipe/*, features/recipe/*; locales/ko.json recipe.*)
      reorder: '순서 변경', create: '레시피 추가', noSavedRecipes: '저장된 레시피가 없습니다.',
      saveGrillSettingsDescription: '그릴 온도와 조리 시간 등을 레시피로 저장해\n손쉽게 조리를 시작할 수 있습니다.',
      createRecipe: '레시피 생성', cookOptionCount: (n) => '조리 설정 ' + n, m: '분', s: '초',
      griddlePreheatTemp: '그리들 예열 온도', upperGrill: '상판 그리들', lowerGrill: '하판 그리들',
      pressCookingSetup: '압착 조리 설정', pressThickness: '압착 두께', cookingTime: '조리 시간',
      cheeseMeltOption: '치즈 가열 옵션', heatingTime: '가열 시간', disabled: '사용하지 않음',
      autoUnloadSetting: '배출 기본 설정', autoUnloadStateOn: '배출 켬', autoUnloadStateOff: '배출 끔',
      recipeOptions: '레시피 옵션', editRecipeAction: '레시피 수정', deleteRecipeAction: '레시피 삭제',
      // create / reorder (locales/ko.json recipe.*, common.*)
      done: '변경 완료', reOrder2: '순서 변경하기', orderUpdated: '순서를 변경했습니다',
      unsavedChangesWarning: '변경 사항이 저장되지 않았습니다.\n이 화면을 나가면 변경 내용이 사라집니다.',
      keepEditing: '계속 수정하기', discardChanges: '나가기',
      newRecipe: '레시피 추가하기', RecipeName: '레시피 이름', cookOptionDefaultName: (n) => '조리 설정 ' + n,
      upperTemp: '상판', lowerTemp: '하판', pressCooking: '압착 조리', thickness: '압착 두께', pressCookingTime: '조리 시간',
      cheeseAddHeating: '치즈 추가 가열', cheeseAddHeatingDesc: '조리 후 치즈를 얹고 추가 가열 진행',
      autoUnloadTitle: '조리 후 배출', autoUnloadDesc: '이 레시피의 기본값입니다. 조리 시작 전까지 바꿀 수 있습니다.',
      autoUnloadOn: '켜기', autoUnloadOnDesc: '그리들 옆 트레이로 조리물 배출', autoUnloadOff: '끄기', autoUnloadOffDesc: '배출하지 않고 그대로 둠',
      addCookOption: '조리 설정 추가',
      addCookOptionHelp: '한 레시피 아래에 온도, 시간 등 조리 설정을 옵션별로 따로 저장할 수 있습니다.\n(예: 스테이크 — 레어, 미디엄, 웰던 등)',
      createButton: '레시피 추가', cookOption: '조리 설정', cookOptionName: '조리 설정 이름', editCookOption: '조리 설정 수정',
      delete: '삭제', saveCookOption: '수정 완료', deleteCookOptionConfirm: '조리 설정을 삭제하시겠습니까?',
      keepCookOption: '취소', deleteCookOptionAction: '조리 설정 삭제', recipeCreatedSuccessfully: '레시피를 생성했습니다',
      duplicateName: '동일한 이름의 레시피가 이미 존재합니다', min: '분', sec: '초', cancel: '취소',
      thicknessRequiredError: '값을 입력해 주세요',
      thicknessRangeError: (min, unit) => `최소 ${min}${unit} 이상이어야 합니다`,
      thicknessMaxError: (max, unit) => `최대 ${max}${unit} 이하여야 합니다`,
      upperTempMinError: (d) => `최소 ${d}부터 설정할 수 있습니다`, lowerTempMinError: (d) => `최소 ${d}부터 설정할 수 있습니다`,
      upperTempMaxError: (d) => `최대 ${d}까지 설정할 수 있습니다`, lowerTempMaxError: (d) => `최대 ${d}까지 설정할 수 있습니다`,
      heatingTimeRequiredError: '가열 시간을 입력해 주세요', cookOptionNameRequired: '조리 설정 이름을 입력해 주세요',
      cookOptionNameDuplicate: '동일한 이름의 조리 설정이 이미 존재합니다',
      // engineer PIN (locales/ko.json engineer.*)
      pinClose: '닫기', enterPasscode: '비밀번호를 입력하세요', pinError: '잘못된 비밀번호입니다',
    },
    en: {
      recipes: 'Recipes', settings: 'Settings', manageDevice: 'Manage device',
      unitAndLanguage: 'Unit & Languages', temperature: 'Temperature', length: 'Length', language: 'Language',
      otherFeatures: 'Other features', foodDetection: 'Food detection',
      foodDetectionDesc: 'Unload based on food placement',
      quickSelect: 'Quick recipe select', quickSelectDesc: 'Pick recipes on the cook screen',
      close: 'Close', back: 'Back',
      reorder: 'Reorder', create: 'Create', noSavedRecipes: 'No saved recipes',
      saveGrillSettingsDescription: 'Save grill settings as a recipe\nto start cooking right away.',
      createRecipe: 'Create recipe', cookOptionCount: (n) => n + ' setups', m: 'm', s: 's',
      griddlePreheatTemp: 'Temperature setting', upperGrill: 'Upper griddle', lowerGrill: 'Lower griddle',
      pressCookingSetup: 'Press cooking', pressThickness: 'Thickness', cookingTime: 'Cooking time',
      cheeseMeltOption: 'Cheese melting', heatingTime: 'Heating time', disabled: 'Disabled',
      autoUnloadSetting: 'Unload setting', autoUnloadStateOn: 'On', autoUnloadStateOff: 'Off',
      recipeOptions: 'Recipe options', editRecipeAction: 'Edit recipe', deleteRecipeAction: 'Delete recipe',
      done: 'Done', reOrder2: 'Reorder', orderUpdated: 'Order updated',
      unsavedChangesWarning: 'You have unsaved changes.\nLeaving this page will discard them.',
      keepEditing: 'Keep editing', discardChanges: 'Discard',
      newRecipe: 'New recipe', RecipeName: 'Recipe name', cookOptionDefaultName: (n) => 'Setup ' + n,
      upperTemp: 'Upper griddle', lowerTemp: 'Lower griddle', pressCooking: 'Press cooking', thickness: 'Thickness', pressCookingTime: 'Cooking time',
      cheeseAddHeating: 'Cheese melting', cheeseAddHeatingDesc: 'Additional heating after cooking',
      autoUnloadTitle: 'Unload after cooking', autoUnloadDesc: 'Sets the default for this recipe. You can change it before cooking starts',
      autoUnloadOn: 'On', autoUnloadOnDesc: "Moves the food to the side tray when it's done", autoUnloadOff: 'Off', autoUnloadOffDesc: 'Leaves the food on the griddle',
      addCookOption: 'Add another setup',
      addCookOptionHelp: 'Save multiple cooking setups under one recipe\n— perfect for different doneness levels like rare, medium, or well-done.',
      createButton: 'Create recipe', cookOption: 'Cooking setups', cookOptionName: 'Setup name', editCookOption: 'Edit setup',
      delete: 'Delete', saveCookOption: 'Save setup', deleteCookOptionConfirm: 'Delete this setup?',
      keepCookOption: 'Keep setup', deleteCookOptionAction: 'Delete setup', recipeCreatedSuccessfully: 'Created recipe.',
      duplicateName: 'A recipe with this name already exists', min: 'min', sec: 'sec', cancel: 'Cancel',
      thicknessRequiredError: 'Enter a value',
      thicknessRangeError: (min, unit) => `Thickness must be ${min}${unit} or greater`,
      thicknessMaxError: (max, unit) => `Thickness must be ${max}${unit} or less`,
      upperTempMinError: (d) => `Temperature must be ${d} or higher`, lowerTempMinError: (d) => `Temperature must be ${d} or higher`,
      upperTempMaxError: (d) => `Temperature must be ${d} or lower`, lowerTempMaxError: (d) => `Temperature must be ${d} or lower`,
      heatingTimeRequiredError: 'Please enter a heating time', cookOptionNameRequired: 'Enter a setup name',
      cookOptionNameDuplicate: 'A setup with this name already exists',
      pinClose: 'Close', enterPasscode: 'Enter passcode', pinError: 'Incorrect passcode',
    },
  };
  const LOCALE_LABELS = { ko: '한글', en: 'EN' };
  // mocked footer (getPcStats / getProductName / getVersionInfo)
  const FOOTER = { ipv4: '192.168.0.42', product: 'AlphaGrill', hmi: '1.8.0', fwName: 'alphagrill-stm', fwVersion: '2.4.1' };

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem('proto:' + key); return v === null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('proto:' + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    },
  };
  const settings = {
    temperatureUnit: store.get('temperatureUnit', '°C'),
    lengthUnit: store.get('lengthUnit', 'mm'),
    foodDetection: store.get('foodDetection', false),
    // prototype-only: off = the app as it ships (v0); the redirect itself lives in app.js
    quickSelect: store.get('quickSelect', true),
  };

  const lang = () => (window.Cook && window.Cook.state && STR[window.Cook.state.lang]) ? window.Cook.state.lang : (STR[document.documentElement.lang] ? document.documentElement.lang : 'ko');
  const t = (key) => STR[lang()][key];

  // Icons: lucide X / ChevronLeft / ChevronRight, phosphor FilmScript + GearSix (fill).
  const ICON = {
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    // v14: close as "←|" (arrow into a vertical line), pointing back where the menu folds away
    arrowLeftToLine: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19V5"/><path d="m13 6-6 6 6 6"/><path d="M7 12h14"/></svg>',
    chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    // lucide ArrowUpDown / Plus / Ellipsis / Pencil / Trash2 (recipe page)
    arrowUpDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    ellipsis: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
    pencil: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>',
    trash2: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
    menuLines: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16"/><path d="M4 18h16"/><path d="M4 6h16"/></svg>',
    // components/ui/icons.tsx circleAlertInverted / checkCircle / errorCircle
    circleAlert: '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="16.25" fill="#E44242"/><path d="M20 13.3333V20.8333" stroke="white" stroke-width="2.5" stroke-linecap="round"/><path d="M20 26.6667H20.0167" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>',
    checkCircle: '<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="16.25" fill="#46CB89"/><path d="M13.75 21.25 17.5 25 26.25 16.25" stroke="#222" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    errorCircle: '<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="16.25" fill="#FF5C5C"/><path d="M14 14L26 26M26 14L14 26" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>',
    filmScript: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M200,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V40A16,16,0,0,0,200,24ZM76,188a12,12,0,1,1,12-12A12,12,0,0,1,76,188Zm0-48a12,12,0,1,1,12-12A12,12,0,0,1,76,140Zm0-48A12,12,0,1,1,88,80,12,12,0,0,1,76,92Z"/></svg>',
    gearSix: '<svg viewBox="0 0 256 256" fill="currentColor"><path d="M237.94,107.21a8,8,0,0,0-3.89-5.4l-29.83-17-.12-33.62a8,8,0,0,0-2.83-6.08,111.91,111.91,0,0,0-36.72-20.67,8,8,0,0,0-6.46.59L128,41.85,97.88,25a8,8,0,0,0-6.47-.6A111.92,111.92,0,0,0,54.73,45.15a8,8,0,0,0-2.83,6.07l-.15,33.65-29.83,17a8,8,0,0,0-3.89,5.4,106.47,106.47,0,0,0,0,41.56,8,8,0,0,0,3.89,5.4l29.83,17,.12,33.63a8,8,0,0,0,2.83,6.08,111.91,111.91,0,0,0,36.72,20.67,8,8,0,0,0,6.46-.59L128,214.15,158.12,231a7.91,7.91,0,0,0,3.9,1,8.09,8.09,0,0,0,2.57-.42,112.1,112.1,0,0,0,36.68-20.73,8,8,0,0,0,2.83-6.07l.15-33.65,29.83-17a8,8,0,0,0,3.89-5.4A106.47,106.47,0,0,0,237.94,107.21ZM128,168a40,40,0,1,1,40-40A40,40,0,0,1,128,168Z"/></svg>',
  };

  // -- layers ---------------------------------------------------------------
  // Menu: Backdrop (bg-black/70) + Popup (backdrop-blur-sm), both fading 150/200ms.
  const menu = document.createElement('div');
  menu.id = 'app-menu';
  menu.className = 'proto-layer';
  menu.hidden = true;
  device.appendChild(menu);

  // Settings: the /setting route, full screen on black.
  const setting = document.createElement('div');
  setting.id = 'app-setting';
  setting.className = 'proto-layer';
  setting.hidden = true;
  device.appendChild(setting);

  // Recipes: the /recipe route (list) and /recipe/:id (detail), full screen on black.
  // Create / edit / delete / reorder are out of scope: their buttons are there but only log.
  const recipePage = document.createElement('div');
  recipePage.id = 'app-recipe';
  recipePage.className = 'proto-layer';
  recipePage.hidden = true;
  device.appendChild(recipePage);
  // the page above, the on-screen keyboard docked under it (KeyboardAwareLayout)
  recipePage.innerHTML = '<div class="rp-body"></div><div class="rp-kb"></div>';
  const rpBody = recipePage.firstElementChild, kbHost = recipePage.lastElementChild;
  // hangul-js (vendored from the app's dependency) composes the 한글 keyboard's jamo
  if (!window.Hangul) { const h = document.createElement('script'); h.src = new URL('../vendor/hangul.min.js', MENU_SRC).href; document.head.appendChild(h); }
  const recipeView = { id: null, optionId: null, popover: false, mode: null };   // mode: null | 'create' | 'reorder'

  const style = document.createElement('style');
  style.textContent = `
    .proto-layer { position: absolute; inset: 0; z-index: 60; }
    .proto-layer[hidden] { display: none; }
    #app-menu .menu-backdrop { transition: opacity 150ms; }
    #app-menu .menu-popup { transition: opacity 200ms; }
    #app-menu.is-closed .menu-backdrop, #app-menu.is-closed .menu-popup { opacity: 0; }
    .proto-icon-10 svg { width: 40px; height: 40px; }
    .proto-icon-8 svg { width: 32px; height: 32px; }
    #app-recipe .rd-tabs::-webkit-scrollbar { display: none; }
    /* Input (components/ui/input.tsx): 92 tall, 2px border white/30 → /70 focused, red on error;
       the label rests inside (28px) and rises onto the border as a chip (24px) */
    .pi { position: relative; isolation: isolate; display: block; width: 100%; text-align: left; cursor: pointer; }
    .pi-box { position: relative; display: flex; height: 92px; align-items: center; padding: 0 32px; border: 2px solid rgb(255 255 255 / 30%); border-radius: 24px; transition: border-color .15s; }
    .pi.is-focused .pi-box { border-color: rgb(255 255 255 / 70%); }
    .pi.is-error .pi-box { border-color: #e44242; }
    .pi.is-disabled { opacity: .5; pointer-events: none; }
    .pi-label { position: absolute; left: 24px; top: 23px; z-index: 10; padding: 0 8px; white-space: nowrap; pointer-events: none;
      font-family: Pretendard, system-ui, sans-serif; font-weight: 500; font-size: 28px; line-height: 150%; color: rgb(255 255 255 / 70%);
      background-color: transparent; transition: top .2s, font-size .2s, line-height .2s, background-color .2s; transition-timing-function: cubic-bezier(.25,.1,.25,1); }
    .pi.is-error .pi-label { color: #e44242; }
    .pi.has-value .pi-label, .pi.is-focused .pi-label { top: -12px; font-size: 24px; line-height: 100%; background-color: var(--lbl-bg); }
    .pi-value { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #fff; }
    /* InputCursor: a 1 × 28 white bar that pulses */
    .pi-cursor { width: 1px; height: 28px; flex-shrink: 0; background: #fff; animation: pi-blink 1s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
    @keyframes pi-blink { 50% { opacity: .5; } }
    .pi-tail { display: flex; flex-shrink: 0; align-items: center; gap: 18px; }
    .pi-clear { display: flex; height: 60px; width: 60px; margin-right: -14px; align-items: center; justify-content: center; }
    .pi-clear > span { display: flex; border-radius: 999px; background: rgb(255 255 255 / 40%); padding: 4px; color: #000; }
    .pi-clear svg { width: 24px; height: 24px; }
    .pi-sep { height: 32px; width: 2px; flex-shrink: 0; background: rgb(255 255 255 / 30%); }
    .pi:not(.has-value) :is(.pi-clear, .pi-sep) { display: none; }
    /* KeyboardAwareLayout: the page shrinks above the docked keyboard */
    #app-recipe:not([hidden]) { display: flex; flex-direction: column; }
    #app-recipe .rp-body { position: relative; min-height: 0; flex: 1; overflow: hidden; }
    #app-recipe .rp-kb { flex-shrink: 0; }
    #app-recipe .rp-body > div { height: 100%; }
    /* VirtualKeyboard (virtual-keyboard.css; simple-keyboard's markup classes) */
    .virtual-keyboard-wrapper { width: 100%; max-width: 600px; margin: 0 auto; padding: 20px 0; background: #444; }
    .virtual-keyboard-numeric { padding: 28px 20px; }
    .hg-theme-default { width: 100%; max-width: 600px; margin: 0 auto; padding: 0; background: transparent; user-select: none; }
    .hg-theme-default .hg-row { display: flex; justify-content: center; }
    .hg-theme-default .hg-button span { pointer-events: none; }
    .hg-theme-default .hg-button { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 0 0 auto; width: 50px; height: 67px; margin: 0; padding: 0;
      background: rgb(255 255 255 / 30%); border-radius: 8px; color: #fff; font-family: Pretendard, system-ui, sans-serif; font-size: 36px; font-weight: 400; line-height: normal; cursor: pointer; touch-action: manipulation; }
    .hg-theme-default .hg-button:active { background: rgb(255 255 255 / 40%); }
    .virtual-keyboard-qwerty .hg-row { gap: 10px; }
    .virtual-keyboard-qwerty .hg-row:not(:last-child) { margin-bottom: 12px; }
    .virtual-keyboard-qwerty .hg-row:nth-last-child(2) { margin-bottom: 20px; }
    .virtual-keyboard-qwerty .hg-button-shift { margin-right: 10px; }
    .virtual-keyboard-qwerty .hg-button-bksp { margin-left: 10px; }
    .hg-theme-default :is(.hg-button-shift, .hg-button-bksp, .hg-button-numbers, .hg-button-abc) { width: 70px; background: rgb(255 255 255 / 20%); font-size: 24px; }
    .hg-theme-default :is(.hg-button-shift, .hg-button-bksp, .hg-button-numbers, .hg-button-abc):active { background: rgb(255 255 255 / 30%); }
    .hg-theme-default .hg-button-space { width: 280px; font-size: 24px; }
    .hg-theme-default .hg-button-enter { width: 140px; background: rgb(255 255 255 / 20%); font-size: 24px; }
    .hg-theme-default .hg-button-enter:active { background: rgb(255 255 255 / 30%); }
    .virtual-keyboard-qwerty .hg-button-globe { width: 70px; background: rgb(255 255 255 / 20%); font-size: 24px; }
    .virtual-keyboard-qwerty .hg-button-globe:active { background: rgb(255 255 255 / 30%); }
    .virtual-keyboard-symbol .hg-row:nth-child(3) .hg-button:not(.hg-button-shift):not(.hg-button-bksp) { width: 68px; }
    .virtual-keyboard-symbol .hg-button-shift { margin-right: 25px; }
    .virtual-keyboard-symbol .hg-button-bksp { margin-left: 25px; }
    .virtual-keyboard-numeric .hg-row { gap: 12px; width: 100%; }
    .virtual-keyboard-numeric .hg-row:not(:last-child) { margin-bottom: 8px; }
    .virtual-keyboard-numeric .hg-row:last-child { justify-content: flex-end; }
    .virtual-keyboard-numeric .hg-button { width: 178.67px; height: 88px; background: transparent; border-radius: 12px; font-size: 48px; }
    .virtual-keyboard-numeric .hg-button:active { background: rgb(0 0 0 / 20%); }
    :is(.hg-button-shift, .hg-button-bksp, .hg-button-enter, .hg-button-numbers, .hg-button-abc, .hg-button-globe)::before {
      content: ""; display: block; width: 52px; height: 52px; background-repeat: no-repeat; background-position: center; background-size: contain; }
    .virtual-keyboard-numeric .hg-button-bksp::before { width: 48px; height: 48px; }
    .hg-button-shift::before { background-image: url("${new URL('../assets/icon/shift.svg', MENU_SRC).href}"); }
    .virtual-keyboard-qwerty.virtual-keyboard-shift .hg-button-shift::before { background-image: url("${new URL('../assets/icon/shift-filled.svg', MENU_SRC).href}"); }
    .virtual-keyboard-qwerty.virtual-keyboard-shift .hg-button-shift:active::before { background-image: url("${new URL('../assets/icon/shift.svg', MENU_SRC).href}"); }
    .hg-button-bksp::before { background-image: url("${new URL('../assets/icon/delete.svg', MENU_SRC).href}"); }
    .hg-button-enter::before { background-image: url("${new URL('../assets/icon/enter.svg', MENU_SRC).href}"); }
    .hg-button-numbers::before { background-image: url("${new URL('../assets/icon/numbers.svg', MENU_SRC).href}"); }
    .virtual-keyboard-symbol.virtual-keyboard-english .hg-button-abc::before { background-image: url("${new URL('../assets/icon/english.svg', MENU_SRC).href}"); }
    .virtual-keyboard-symbol.virtual-keyboard-korean .hg-button-abc::before { background-image: url("${new URL('../assets/icon/korean.svg', MENU_SRC).href}"); }
    .hg-button-globe::before { background-image: url("${new URL('../assets/icon/globe.svg', MENU_SRC).href}"); }
    .virtual-keyboard-symbol:not(.virtual-keyboard-symbol-shift) .hg-button-shift::before { background-image: url("${new URL('../assets/icon/moresymbol.svg', MENU_SRC).href}"); }
    .virtual-keyboard-symbol-shift .hg-button-shift::before { background-image: url("${new URL('../assets/icon/numbers.svg', MENU_SRC).href}"); }
    /* TimePicker wheels */
    .tp-col { width: 200px; overflow-y: auto; scroll-snap-type: y mandatory; scrollbar-width: none; overscroll-behavior: contain; cursor: grab; }
    .tp-col::-webkit-scrollbar { display: none; }
    .tp-item { display: flex; align-items: center; padding-right: 20px; scroll-snap-align: center; }
    .proto-stroke-15 svg { stroke-width: 1.5; }
    /* engineer PIN: backdrop fades 150ms, the popup 200ms; its number pad is the transparent
       variant (no fill, white/15 when pressed) */
    #app-pin { z-index: 70; }
    .device.no-motion *, .device.no-motion *::before, .device.no-motion *::after { transition: none !important; }
    #app-pin .pin-backdrop { transition: opacity 150ms; }
    #app-pin .pin-popup { transition: opacity 200ms; }
    #app-pin.is-closed :is(.pin-backdrop, .pin-popup) { opacity: 0; }
    .virtual-keyboard-numeric-transparent, .virtual-keyboard-numeric-transparent .hg-button { background: transparent; }
    .virtual-keyboard-numeric-transparent .hg-button:active { background: rgb(255 255 255 / 15%); }
    /* dragged row (SortableRecipeItem): #333 with white/20 hairlines and a soft shadow */
    #app-recipe [data-drag-row].is-dragging { z-index: 1; background: #333; box-shadow: inset 0 2px 0 0 rgb(255 255 255 / 20%), inset 0 -2px 0 0 rgb(255 255 255 / 20%), 0 0 80px 0 rgb(0 0 0 / 40%); }
    #app-recipe [data-drag-list="options"] [data-drag-row].is-dragging { background: #111; box-shadow: none; }
    .proto-toast { position: absolute; top: 112px; left: 50%; z-index: 80; width: 560px; margin-left: -280px; border-radius: 8px; background: #444; padding: 24px 28px;
      box-shadow: 0 0 20px 0 rgb(0 0 0 / 50%); transform: translateY(-150%); opacity: 0; pointer-events: none; transition: transform .5s cubic-bezier(0.22,1,0.36,1), opacity .5s; }
    .proto-toast.is-shown { transform: none; opacity: 1; }
    .proto-toast svg { width: 40px; height: 40px; }
  `;
  document.head.appendChild(style);

  function renderMenu() {
    const item = (action, icon, label) => `
      <button type="button" data-menu="${action}" class="flex h-30 w-full items-center py-5 pr-8 pl-3 active:bg-white/18">
        <div class="proto-icon-8 flex h-full w-20 shrink-0 items-center justify-center text-white/60">${icon}</div>
        <p class="type-body2 min-w-0 flex-1 truncate text-left text-white">${label}</p>
        <span class="proto-icon-10 shrink-0 text-white/70">${ICON.chevronRight}</span>
      </button>`;
    menu.innerHTML = `
      <div class="menu-backdrop absolute inset-0 bg-black/70" data-menu="close"></div>
      <div class="menu-popup absolute inset-0 flex flex-col backdrop-blur-sm">
        <header class="relative flex h-[100px] min-w-0 shrink-0 items-center justify-end bg-[#7070704D] py-3 pl-2">
          <button type="button" data-menu="close" aria-label="${t('close')}" class="group flex items-center justify-end py-[18px] pr-5 pl-25">
            <div class="proto-icon-10 flex size-16 items-center justify-center rounded-lg text-white group-active:bg-white/10">${closeIcon()}</div>
          </button>
        </header>
        <div class="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
          <section class="w-full flex-1 overflow-auto">
            ${item('recipe', ICON.filmScript, t('recipes'))}
            ${item('setting', ICON.gearSix, t('settings'))}
          </section>
          <footer class="flex w-full shrink-0 flex-col gap-6 px-10 pt-5 pb-10">
            <div class="text-[22px] leading-[130%] font-medium text-white/70">
              <p class="mb-3">Network: ${FOOTER.ipv4}</p>
              <p class="mb-0.5">${FOOTER.product}</p>
              <p class="mb-0.5">HMI: ${FOOTER.hmi}</p>
              <p>MCU: ${FOOTER.fwName} @ ${FOOTER.fwVersion}</p>
            </div>
            <button type="button" data-menu="manage-device" class="type-body3 h-16 w-fit rounded-lg bg-[#434343] px-8 py-2.5 text-white active:bg-[#7A7A7A]">${t('manageDevice')}</button>
          </footer>
        </div>
      </div>`;
  }

  // Switch variant="sm" color="gray" — the same markup as the header's 그릴/마감 청소 switch.
  function segSwitch(key, left, right, value, render) {
    const checked = value === right;
    return `
      <div class="-my-5 inline-flex cursor-pointer py-5" data-setting="${key}" data-left="${left}" data-right="${right}">
        <button type="button" role="switch" aria-checked="${checked}" data-slot="switch" data-variant="sm" data-color="gray" ${checked ? 'data-checked=""' : 'data-unchecked=""'}
          class="peer group/switch relative inline-flex h-15 w-[276px] shrink-0 overflow-hidden rounded-[12px] border-transparent bg-white/18 p-1.5 outline-none transition-colors duration-200 ease-out after:absolute after:-inset-y-4.5">
          <span class="absolute top-1.5 bottom-1.5 left-1.5 z-0 w-[calc(50%-6px)] rounded-[8px] bg-white/20 shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] transition-transform duration-200 ease-out ${checked ? 'translate-x-full' : 'translate-x-0'}" aria-hidden="true"></span>
          <span class="relative z-0 flex min-h-0 flex-1 cursor-pointer items-center justify-center rounded-xl type-body2 text-white transition-all duration-200 ease-out ${checked ? 'opacity-70' : ''}" aria-hidden="true">${render(left)}</span>
          <span class="relative z-0 flex min-h-0 flex-1 cursor-pointer items-center justify-center rounded-xl type-body2 text-white transition-all duration-200 ease-out ${checked ? '' : 'opacity-70'}" aria-hidden="true">${render(right)}</span>
        </button>
      </div>`;
  }

  function renderSetting() {
    const row = (label, control) => `
      <div class="flex items-center justify-between py-5 pr-7 pl-10">
        <p class="type-body2 text-white">${label}</p>
        ${control}
      </div>`;
    const same = (v) => v;
    // FoodDetectionRow: the whole row is the button; the ToggleSwitch is display-only.
    const toggleRow = (key, labelKey, descKey) => {
      const on = settings[key];
      return `
              <button type="button" data-setting-toggle="${key}" aria-pressed="${on}" class="flex h-30 w-full items-center py-5 pr-7 pl-10 text-left active:bg-white/18">
                <div class="flex min-w-0 flex-1 flex-col gap-1 pr-5">
                  <p class="type-body2 truncate text-white">${t(labelKey)}</p>
                  <p class="type-body3 text-white/70">${t(descKey)}</p>
                </div>
                <div class="relative flex h-[54px] w-24 shrink-0 items-center rounded-full px-[3px] transition-colors duration-200 ${on ? 'bg-[#38B6FF]' : 'bg-white/20'}" aria-hidden="true">
                  <div class="size-12 rounded-full bg-white transition-transform duration-200 ${on ? 'translate-x-[42px]' : ''}"></div>
                </div>
              </button>`;
    };
    setting.innerHTML = `
      <div class="h-full bg-black">
        <div class="flex h-full flex-col overflow-hidden overflow-y-auto">
          <header class="relative flex h-[100px] min-w-0 shrink-0 items-center justify-between bg-white/20 py-3 pl-2">
            <button type="button" data-setting-back class="inline-flex h-16 min-w-0 cursor-pointer items-center justify-center gap-0 overflow-hidden rounded-lg px-3 text-white transition-all active:bg-black/20">
              <div class="proto-icon-10 flex size-10 min-w-0 shrink-0 items-center justify-center text-white">${ICON.chevronLeft}</div>
              <span class="type-body1 min-w-0 truncate px-3 text-white">${t('settings')}</span>
            </button>
          </header>
          <main class="flex flex-col gap-12 pt-12">
            <section>
              <h2 class="type-body3 pl-10 text-white/70">${t('unitAndLanguage')}</h2>
              ${row(t('temperature'), segSwitch('temperatureUnit', '°C', '°F', settings.temperatureUnit, same))}
              ${row(t('length'), segSwitch('lengthUnit', 'mm', 'inch', settings.lengthUnit, same))}
              ${row(t('language'), segSwitch('locale', 'ko', 'en', lang(), (l) => LOCALE_LABELS[l]))}
            </section>
            <section>
              <h2 class="type-body3 pl-10 text-white/70">${t('otherFeatures')}</h2>
              ${toggleRow('foodDetection', 'foodDetection', 'foodDetectionDesc')}
              ${toggleRow('quickSelect', 'quickSelect', 'quickSelectDesc')}
            </section>
          </main>
        </div>
      </div>`;
  }

  // v14 (and v0 reached from it) closes with ←| instead of ✕
  function closeIcon() {
    const h = document.documentElement;
    return h.dataset.variant === 'v14' || h.dataset.from === 'v14' ? ICON.arrowLeftToLine : ICON.x;
  }

  // -- recipe page -----------------------------------------------------------
  const recipes = () => (window.Cook && window.Cook.RECIPES) || [];
  const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const roundTo = (v, d) => Math.round(v * 10 ** d) / 10 ** d;
  // lib/format-unit.ts: °C/°F, mm or inch as whole + sixteenths (7' 3/16'')
  function inchFraction(v) {
    let whole = Math.floor(v), six = Math.round((v - whole) * 16);
    if (six === 16) { whole += 1; six = 0; }
    if (whole > 7 || (whole === 7 && six >= 15)) return "7'";
    if (six === 0) return whole + "'";
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const g = gcd(six, 16);
    const frac = six / g + '/' + 16 / g;
    return whole > 0 ? whole + "' " + frac + "''" : frac + "''";
  }
  function fmtUnit(v, unit, includeUnit = true) {
    if (unit === 'mm') return roundTo(v, 2) + (includeUnit ? 'mm' : '');
    if (unit === 'inch') { const f = inchFraction(v / 25.4); return includeUnit ? f : f.replace(/'+$/, ''); }
    if (unit === '°F') return roundTo((v * 9) / 5 + 32, 1) + (includeUnit ? '°F' : '');
    return roundTo(v, 1) + (includeUnit ? '°C' : '');
  }
  // lib/format-time.ts formatTime: "4m" / "2m 30s" / "45s" (분 / 초 in Korean)
  function fmtTime(sec) {
    const m = Math.floor(sec / 60), r = sec % 60;
    if (m > 0 && r > 0) return m + t('m') + ' ' + r + t('s');
    return m > 0 ? m + t('m') : r + t('s');
  }
  const pageHeader = (backAttr, label, right = '') => `
          <header class="relative flex h-[100px] min-w-0 shrink-0 items-center justify-between bg-white/20 py-3 pl-2">
            <!-- Prototype: ‹ is tappable to the left edge over the full header height; the pressed
                 fill stays on the icon + label box (as 순서 변경 and ⋯) -->
            <button type="button" ${backAttr} class="group -my-3 -ml-2 flex min-w-0 cursor-pointer items-center self-stretch pr-3 pl-2 text-white">
              <span class="inline-flex h-16 min-w-0 items-center justify-center gap-0 overflow-hidden rounded-lg px-3 transition-all group-active:bg-black/20">
                <span class="proto-icon-10 flex size-10 min-w-0 shrink-0 items-center justify-center text-white">${ICON.chevronLeft}</span>
                <span class="type-body1 min-w-0 truncate px-3 text-white">${esc(label)}</span>
              </span>
            </button>
            ${right}
          </header>`;
  const vbar = '<div class="h-3.75 w-0 shrink-0 border-l border-white/70"></div>';

  // RecipeItem (features/recipe/recipe-item.tsx)
  function recipeItem(r, i) {
    const opt = r.cookOptions[0];
    const multi = r.cookOptions.length > 1;
    const sub = multi
      ? `<div class="flex w-full items-center gap-4">
           <p class="type-body3 shrink-0 whitespace-nowrap text-white/70">${t('cookOptionCount')(r.cookOptions.length)}</p>${vbar}
           <p class="type-body3 min-w-0 flex-1 truncate text-left text-white/70">${r.cookOptions.map((o) => esc(o.name)).join(' · ')}</p>
         </div>`
      : `<div class="flex items-center gap-4">
           <p class="type-body3 text-white/70">${fmtUnit(opt.top, settings.temperatureUnit, false)}·${fmtUnit(opt.bot, settings.temperatureUnit)}</p>${vbar}
           <p class="type-body3 text-white/70">${fmtUnit(opt.thickness, settings.lengthUnit)}·${fmtTime(opt.cookingSec)}</p>
           ${opt.meltingSec > 0 ? vbar + `<p class="type-body3 text-white/70">${fmtTime(opt.meltingSec)}</p>` : ''}
         </div>`;
    return `
            <button type="button" data-recipe-open="${r.id}" class="flex h-30 w-full items-center py-5 pr-8 pl-3 transition-colors focus:outline-none active:bg-white/18">
              <div class="flex h-full w-20 shrink-0 items-center justify-center"><p class="type-body3 text-center text-white/70">${i + 1}</p></div>
              <div class="flex min-w-0 flex-1 flex-col items-start gap-1 overflow-hidden pr-5">
                <p class="type-body2 w-full truncate text-left text-white">${esc(r.name)}</p>
                ${sub}
              </div>
              <div class="proto-icon-10 flex size-10 shrink-0 items-center text-white">${ICON.chevronRight}</div>
            </button>`;
  }

  // RecipeDetail (features/recipe/recipe-detail.tsx) + RecipeDetailMenu's popover
  function recipeDetail(r) {
    const opt = r.cookOptions.find((o) => o.id === recipeView.optionId) || r.cookOptions[0];
    const row = (label, value) => `<div class="flex items-center justify-between"><span class="type-body2 text-white/70">${label}</span><span class="type-body2 text-white">${value}</span></div>`;
    const section = (title, body) => `<section class="flex flex-col gap-6"><h2 class="type-body3 text-white/60">${title}</h2><div class="flex flex-col gap-6">${body}</div></section>`;
    const divider = '<div class="h-px w-full shrink-0 bg-white/20"></div>';
    const tabs = r.cookOptions.length > 1 ? `
          <div class="sticky top-0 z-10 bg-black">
            <div class="rd-tabs relative z-10 flex items-center overflow-x-auto pl-8" style="scrollbar-width:none">
              ${r.cookOptions.map((o) => `
              <button type="button" data-recipe-option="${o.id}" class="flex h-[100px] shrink-0 flex-col items-center justify-center py-2.5 transition-colors active:bg-white/18 ${o.id === opt.id ? 'border-b-[3px] border-white' : ''}">
                <span class="type-body2 flex min-w-[120px] items-center justify-center px-6 py-4 text-center whitespace-nowrap ${o.id === opt.id ? 'text-white' : 'text-white/70'}">${esc(o.name)}</span>
              </button>`).join('')}
            </div>
            <div aria-hidden="true" class="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-0.5 bg-white/20"></div>
          </div>` : '';
    const kebab = `
            <!-- Prototype: ⋯ sits 12 further in (right 8 → 20) and is tappable to the right edge over
                 the full header height; the pressed fill stays on the 64 box -->
            <button type="button" data-recipe-kebab aria-label="${t('recipeOptions')}" class="group -my-3 flex shrink-0 items-center justify-center self-stretch pr-5 pl-16 outline-none">
              <span class="proto-icon-10 flex size-16 items-center justify-center rounded-lg text-white group-active:bg-white/10">${ICON.ellipsis}</span>
            </button>`;
    const popover = recipeView.popover ? `
          <div data-recipe-popover-close class="absolute inset-0 z-40 bg-black/60"></div>
          <div class="absolute top-[108px] right-5 z-50 flex w-75 flex-col rounded-2xl border border-white/10 bg-[#222] py-1.5">
            <button type="button" data-recipe-action="edit" class="proto-icon-8 flex w-full items-center gap-3 px-10 py-6 active:bg-white/5"><span class="text-white">${ICON.pencil}</span><span class="type-body2 whitespace-nowrap text-white">${t('editRecipeAction')}</span></button>
            <button type="button" data-recipe-action="delete" class="proto-icon-8 flex w-full items-center gap-3 px-10 py-6 active:bg-white/5"><span class="text-[#ff2222]">${ICON.trash2}</span><span class="type-body2 whitespace-nowrap text-[#ff2222]">${t('deleteRecipeAction')}</span></button>
          </div>` : '';
    return `
      <div class="relative h-full bg-black">
        <div class="flex h-full flex-col overflow-hidden">
          ${pageHeader('data-recipe-back', r.name, kebab)}
          <div class="min-h-0 flex-1 overflow-auto">
            ${tabs}
            <div class="flex flex-col gap-12 p-12">
              ${section(t('griddlePreheatTemp'), row(t('upperGrill'), fmtUnit(opt.top, settings.temperatureUnit)) + row(t('lowerGrill'), fmtUnit(opt.bot, settings.temperatureUnit)))}
              ${divider}
              ${section(t('pressCookingSetup'), row(t('pressThickness'), fmtUnit(opt.thickness, settings.lengthUnit)) + row(t('cookingTime'), fmtTime(opt.cookingSec)))}
              ${divider}
              ${section(t('cheeseMeltOption'), opt.meltingSec > 0 ? row(t('heatingTime'), fmtTime(opt.meltingSec)) : `<span class="type-body2 text-white">${t('disabled')}</span>`)}
              ${divider}
              ${section(t('autoUnloadSetting'), `<span class="type-body2 text-white">${opt.withoutArm ? t('autoUnloadStateOff') : t('autoUnloadStateOn')}</span>`)}
            </div>
          </div>
        </div>
        ${popover}
      </div>`;
  }

  function renderRecipe() {
    if (recipeView.mode === 'create') {
      const scrolls = [...rpBody.querySelectorAll('.overflow-auto')].map((el) => el.scrollTop);
      rpBody.innerHTML = renderCreate() + renderConfirm();
      [...rpBody.querySelectorAll('.overflow-auto')].forEach((el, i) => { if (scrolls[i] != null) el.scrollTop = scrolls[i]; });
      renderKeyboard();
      return;
    }
    kb = null; renderKeyboard();
    if (recipeView.mode === 'reorder') { rpBody.innerHTML = renderReorder() + renderConfirm(); return; }
    const list = recipes();
    const detail = recipeView.id != null && list.find((r) => r.id === recipeView.id);
    if (detail) { rpBody.innerHTML = recipeDetail(detail); return; }
    recipeView.id = null;
    // Prototype: the rows' content, 순서 변경's content and the 레시피 추가 FAB sit 12 further in
    // from the sides than the app, while the rows and 순서 변경 still reach the screen edge as
    // tap bands (row pl 0 → 12, pr 20 → 32; FAB right 20 → 32). 순서 변경's tap area runs to the
    // right edge and the full header height, while its pressed fill stays on the icon + label.
    // 순서 변경's icon in a solid grey (#c2c2c2 = white/70 over the white/20 header on black),
    // so the strokes don't show darker where they overlap the way a translucent colour does.
    const reorderBtn = list.length > 1 ? `
            <button type="button" data-recipe-action="reorder" class="group -my-3 flex min-w-0 cursor-pointer items-center self-stretch pr-3 pl-3 text-white">
              <span class="inline-flex h-16 min-w-0 items-center justify-center gap-0 overflow-hidden rounded-lg px-3 transition-all group-active:bg-black/20">
                <span class="proto-icon-10 flex size-10 min-w-0 shrink-0 items-center justify-center text-[#c2c2c2]">${ICON.arrowUpDown}</span>
                <span class="type-body1 min-w-0 truncate px-3 text-white">${t('reorder')}</span>
              </span>
            </button>` : '';
    rpBody.innerHTML = `
      <div class="relative h-full bg-black">
        <div class="flex h-full flex-col overflow-hidden">
          ${pageHeader('data-recipe-back', t('recipes'), reorderBtn)}
          <main class="flex h-full flex-col overflow-y-auto py-7">
            ${list.length ? `<div class="flex flex-col">${list.map(recipeItem).join('')}</div>` : `
            <div class="flex h-full flex-col items-center justify-center">
              <h3 class="type-body1 mb-5 text-center text-white">${t('noSavedRecipes')}</h3>
              <p class="type-body3 mb-16 text-center leading-[150%] whitespace-pre-line text-white/70">${t('saveGrillSettingsDescription')}</p>
              <button type="button" data-recipe-action="create" class="type-body2 h-20 w-[400px] rounded-full bg-white text-black active:bg-[#aaa]">${t('createRecipe')}</button>
            </div>`}
          </main>
        </div>
        ${list.length ? `
        <button type="button" data-recipe-action="create" class="type-body2 proto-icon-10 absolute right-8 bottom-7 inline-flex h-20 shrink-0 items-center justify-end rounded-full bg-white px-6 text-black shadow-[0_0_20px_0_rgba(0,0,0,0.50)] active:bg-[#aaa]">
          <span class="shrink-0 text-black">${ICON.plus}</span><span class="px-3 whitespace-nowrap">${t('create')}</span>
        </button>` : ''}
      </div>`;
  }

  // -- recipe create (app/routes/recipe/recipe-create.tsx, features/recipe/recipe-form.tsx,
  //    cook-option-fields.tsx, cook-option-list.tsx, cook-option-edit-sheet.tsx) and reorder
  //    (recipe.tsx reorder mode, use-recipe-reorder.ts, reorder-footer.tsx) ------------------
  // Prototype: inputs take the computer keyboard (the app's on-screen keyboard and time picker
  // are not ported); times are typed as m:ss. "Saving" changes Cook.RECIPES for this page load.
  const TEMP_MAX_C = 300;          // stm common recipe_top/bot_temperature_max_limit fallback
  const THICK_MIN_MM = 5, THICK_MAX_MM = 200;
  const toF = (c) => (c * 9) / 5 + 32;
  const toC = (f) => ((f - 32) * 5) / 9;
  const tempShown = (c) => Math.round(settings.temperatureUnit === '°F' ? toF(c) : c);
  const thickShown = (mm) => Math.round((settings.lengthUnit === 'inch' ? mm / 25.4 : mm) * 100) / 100;
  const thickUnit = () => (settings.lengthUnit === 'inch' ? 'inch' : 'mm');
  // lib/format-time.ts formatTimeWithUnit: "1분 30초" / "1 min 30 sec"
  function fmtTimeUnit(sec) {
    const m = Math.floor(sec / 60), r = sec % 60, min = t('min'), s = t('sec');
    const sep = /[a-z]/i.test(min) ? ' ' : '';
    const parts = [];
    if (m > 0) parts.push(m + sep + min);
    if (r > 0 || m === 0) parts.push(r + sep + s);
    return parts.join(' ');
  }


  const newOption = (n) => ({ name: t('cookOptionDefaultName')(n), top: '', bot: '', thickness: '', cookingSec: 0, cheese: false, meltingSec: 0, withoutArm: false });
  let form = null;      // create form state while recipeView.mode === 'create'
  let reorder = null;   // { order: [ids], original: [ids] } while recipeView.mode === 'reorder'
  let confirmBox = null; // { kind } — the centred ConfirmModal

  // buildRecipeFormSchema: one cook option's errors (message strings; '' = invalid, no text)
  function optionErrors(o, i, all) {
    const e = {};
    if (!o.name.trim()) e.name = t('cookOptionNameRequired');
    else if (all.filter((x) => x.name.trim() === o.name.trim()).length > 1) e.name = t('cookOptionNameDuplicate');
    const deg = (c) => tempShown(c) + settings.temperatureUnit;
    for (const [k, minKey, maxKey] of [['top', 'upperTempMinError', 'upperTempMaxError'], ['bot', 'lowerTempMinError', 'lowerTempMaxError']]) {
      if (o[k] === '' || isNaN(parseFloat(o[k]))) continue;
      const shown = tempShown(parseFloat(o[k]));
      if (shown < tempShown(0)) e[k] = t(minKey)(deg(0));
      else if (shown > tempShown(TEMP_MAX_C)) e[k] = t(maxKey)(deg(TEMP_MAX_C));
    }
    if (o.thickness === '' || isNaN(parseFloat(o.thickness))) e.thickness = t('thicknessRequiredError');
    else {
      const shown = thickShown(parseFloat(o.thickness));
      if (shown < thickShown(THICK_MIN_MM)) e.thickness = t('thicknessRangeError')(thickShown(THICK_MIN_MM), thickUnit());
      else if (shown > thickShown(THICK_MAX_MM)) e.thickness = t('thicknessMaxError')(thickShown(THICK_MAX_MM), thickUnit());
    }
    if (o.cookingSec < 1) e.cookingSec = '';
    if (o.cheese && o.meltingSec <= 0) e.meltingSec = t('heatingTimeRequiredError');
    return e;
  }
  const allErrors = () => form.options.map((o, i, all) => optionErrors(o, i, all));
  const formValid = () => form.name.trim() !== '' && allErrors().every((e) => Object.keys(e).length === 0);

  // components/ui/input.tsx: outlined field with a floating label that rises onto the border
  // as a chip (labelBackground) once it has a value or focus; unit suffix after a divider and
  // a round clear (×) while it has a value. Tapping it opens the on-screen keyboard; while it
  // is focused the border brightens and a cursor blinks after the value.
  function field({ key, label, value, unit = '', error = null, disabled = false, bg = '#000', mode = 'text' }) {
    const type = mode === 'time' ? 'time' : mode === 'text' ? 'qwerty' : 'numeric';
    const focused = kb && kb.key === key;
    if (focused) value = type === 'time' ? (timeToSec(kb.value) ? fmtTimeUnit(timeToSec(kb.value)) : '') : kb.value;
    const has = value !== '' && value != null;
    return `
            <div>
              <div role="button" data-kb-field="${key}" data-kb-type="${type}" data-kb-mode="${mode}" class="pi ${has ? 'has-value' : ''} ${focused ? 'is-focused' : ''} ${error != null ? 'is-error' : ''} ${disabled ? 'is-disabled' : ''}" style="--lbl-bg:${bg}">
                <span class="pi-box">
                  <span class="pi-label">${esc(label)}</span>
                  <span class="flex min-w-0 flex-1 items-center"><span class="pi-value type-body1">${esc(value)}</span>${focused ? '<span class="pi-cursor"></span>' : ''}</span>
                  <span class="pi-tail">
                    <span role="button" data-clear="${key}" class="pi-clear" aria-label="${esc(label)} 지우기"><span>${ICON.x}</span></span>
                    ${unit ? `<span class="pi-sep"></span><span class="type-body1 shrink-0 text-white/70">${unit}</span>` : ''}
                  </span>
                </span>
              </div>
              ${error ? `<p class="type-body3 mt-3 pr-2 text-right text-[#e44242]">${esc(error)}</p>` : ''}
            </div>`;
  }

  // CookOptionFields: 그리들 예열 온도 · 압착 조리 · 치즈 추가 가열 · 조리 후 배출
  function optionFields(i, bg, showAll) {
    const o = form.options[i];
    const errs = optionErrors(o, i, form.options);
    const err = (k) => ((showAll || form.touched.has(i + '.' + k)) && k in errs ? errs[k] : null);
    const tempVal = (c) => (c === '' ? '' : String(tempShown(parseFloat(c))));
    const thickVal = o.thickness === '' ? '' : String(thickShown(parseFloat(o.thickness)));
    const radio = (on, title, desc) => `
              <button type="button" data-unload="${on ? 'on' : 'off'}" class="flex w-full items-start gap-7 px-10 py-5 text-left">
                <span class="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border-2 ${(!o.withoutArm) === on ? 'border-white/80' : 'border-white/40'}">${(!o.withoutArm) === on ? '<span class="size-2.5 rounded-full bg-white"></span>' : ''}</span>
                <span class="flex flex-1 flex-col gap-1"><span class="type-body3 text-white">${title}</span><span class="type-body3 text-white/70">${desc}</span></span>
              </button>`;
    return `
          <section class="flex flex-col gap-7 px-8">
            <h4 class="type-body3 pl-2 text-white/70">${t('griddlePreheatTemp')}</h4>
            <div class="flex flex-col gap-5">
              ${field({ key: i + '.top', label: t('upperTemp'), value: tempVal(o.top), unit: settings.temperatureUnit, error: err('top'), bg, mode: 'int' })}
              ${field({ key: i + '.bot', label: t('lowerTemp'), value: tempVal(o.bot), unit: settings.temperatureUnit, error: err('bot'), bg, mode: 'int' })}
            </div>
          </section>
          <section class="flex flex-col gap-7 px-8">
            <h4 class="type-body3 pl-2 text-white/70">${t('pressCooking')}</h4>
            <div class="flex flex-col gap-5">
              ${field({ key: i + '.thickness', label: t('thickness'), value: thickVal, unit: thickUnit(), error: err('thickness'), bg, mode: 'decimal' })}
              ${field({ key: i + '.cookingSec', label: t('pressCookingTime'), value: o.cookingSec ? fmtTimeUnit(o.cookingSec) : '', error: err('cookingSec') != null ? '' : null, bg, mode: 'time' })}
            </div>
          </section>
          <section class="flex flex-col gap-3">
            <div class="flex h-30 items-center px-10 py-5">
              <div class="flex min-w-0 flex-1 flex-col items-start gap-1 pr-5">
                <p class="type-body2 text-white">${t('cheeseAddHeating')}</p>
                <p class="type-body3 text-white/70">${t('cheeseAddHeatingDesc')}</p>
              </div>
              <button type="button" role="switch" aria-checked="${o.cheese}" data-cheese="${i}" class="relative inline-flex h-[54px] w-[96px] shrink-0 items-center rounded-full p-[3px] transition-colors duration-200 ease-out ${o.cheese ? 'bg-[#38B6FF]' : 'bg-white/20'}">
                <span class="size-12 rounded-full bg-white transition-transform duration-200 ease-out ${o.cheese ? 'translate-x-[42px]' : ''}"></span>
              </button>
            </div>
            <div class="px-8">
              ${field({ key: i + '.meltingSec', label: t('heatingTime'), value: o.meltingSec ? fmtTimeUnit(o.meltingSec) : '', error: form.touched.has(i + '.meltingSec') || (showAll && !form.meltSuppressed.has(i)) ? ('meltingSec' in errs ? errs.meltingSec : null) : null, disabled: !o.cheese, bg, mode: 'time' })}
            </div>
          </section>
          <section class="flex flex-col gap-3" data-unload-group="${i}">
            <div class="flex flex-col gap-3 px-10 py-5">
              <p class="type-body2 text-white">${t('autoUnloadTitle')}</p>
              <p class="type-body3 whitespace-pre-line text-white/70">${t('autoUnloadDesc')}</p>
            </div>
            <div class="flex flex-col">
              ${radio(true, t('autoUnloadOn'), t('autoUnloadOnDesc'))}
              ${radio(false, t('autoUnloadOff'), t('autoUnloadOffDesc'))}
            </div>
          </section>`;
  }

  // SortableCookOptionItem: [≡ | name (+ alert) / summary | ›]; error rows on a red gradient
  function cookOptionRow(o, i, hasError) {
    const top = parseFloat(o.top) || 0, bot = parseFloat(o.bot) || 0, mm = parseFloat(o.thickness) || 0;
    const vline = '<div class="h-3.75 w-px bg-white/70"></div>';
    return `
            <div data-drag-row="${i}" data-edit-option="${i}" class="flex h-30 cursor-pointer items-center select-none ${hasError ? 'bg-linear-to-r from-[#f13939]/20 to-[#f13939]/6' : 'active:bg-[#111]'}" style="touch-action:none">
              <div class="proto-icon-8 flex h-full w-28 shrink-0 items-center justify-center text-white/70">${ICON.menuLines}</div>
              <div class="flex h-full min-w-0 flex-1 items-center pr-8">
                <div class="flex min-w-0 flex-1 flex-col items-start gap-1 overflow-hidden">
                  <div class="flex w-full min-w-0 items-center gap-2">
                    <p class="type-body2 truncate text-left ${hasError ? 'text-[#e44242]' : 'text-white'}">${esc(o.name)}</p>
                    ${hasError ? `<span class="proto-icon-8 shrink-0">${ICON.circleAlert}</span>` : ''}
                  </div>
                  <div class="flex items-center gap-4">
                    <p class="type-body3 text-white/70">${fmtUnit(top, settings.temperatureUnit, false)}·${fmtUnit(bot, settings.temperatureUnit)}</p>${vline}
                    <p class="type-body3 text-white/70">${fmtUnit(mm, settings.lengthUnit)}·${fmtTime(o.cookingSec)}</p>
                    ${o.cheese && o.meltingSec > 0 ? vline + `<p class="type-body3 text-white/70">${fmtTime(o.meltingSec)}</p>` : ''}
                  </div>
                </div>
                <div class="proto-icon-10 flex size-10 shrink-0 items-center text-white">${ICON.chevronRight}</div>
              </div>
            </div>`;
  }

  function renderCreate() {
    const multi = form.options.length > 1;
    const errs = allErrors();
    const valid = formValid();
    const canSubmit = valid && form.dirty;
    const nameErr = form.touched.has('name') && !form.name.trim();
    const body = multi ? `
          <section class="flex flex-col">
            <div class="flex items-center justify-between">
              <h4 class="type-body3 py-5 pl-10 text-white/70">${t('cookOption')}</h4>
              <button type="button" data-add-option aria-label="${t('addCookOption')}" class="proto-icon-10 flex h-21 w-30 items-center justify-center text-white transition-colors active:bg-white/18">${ICON.plus}</button>
            </div>
            <div class="flex flex-col" data-drag-list="options">
              ${form.options.map((o, i) => cookOptionRow(o, i, Object.keys(errs[i]).length > 0)).join('')}
            </div>
          </section>` : `
          <div class="h-3 w-full bg-white/10"></div>
          ${optionFields(0, '#000', false)}
          <div class="h-3 w-full bg-white/10"></div>
          <section class="flex flex-col gap-7 px-8">
            <button type="button" data-add-option class="proto-icon-8 flex items-center gap-1.5 self-start rounded-full border-2 border-dashed border-white py-5 pr-9 pl-6 text-white transition-colors active:bg-white/18">
              ${ICON.plus}<span class="type-body1 text-white">${t('addCookOption')}</span>
            </button>
            <p class="type-body3 whitespace-pre-line text-white/70">${t('addCookOptionHelp')}</p>
          </section>`;
    const sheet = form.editing != null ? renderOptionSheet() : '';
    return `
      <div class="relative h-full bg-black">
        <div class="relative flex h-full flex-col overflow-hidden">
          <header class="relative flex h-[100px] min-w-0 shrink-0 items-center justify-between bg-white/20 py-3 pl-2">
            <button type="button" data-recipe-back aria-label="${t('back')}" class="group -my-3 -ml-2 shrink-0 self-stretch pr-16 pl-2">
              <span class="proto-icon-10 flex size-16 items-center justify-center rounded-lg text-white group-active:bg-white/20">${ICON.chevronLeft}</span>
            </button>
            <h3 class="type-body2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white">${t('newRecipe')}</h3>
          </header>
          <div class="min-h-0 flex-1 overflow-auto" data-form-scroll>
            <div class="flex min-h-full w-full flex-col pt-12">
              <div class="flex flex-1 flex-col gap-12 pb-10">
                <section class="px-8">${field({ key: 'name', label: t('RecipeName'), value: form.name, error: nameErr ? '' : null })}</section>
                ${body}
              </div>
              ${form.editing == null && !kb ? `
              <div class="mt-auto flex shrink-0 flex-col ${canSubmit ? 'sticky right-0 bottom-0 left-0' : ''}" data-submit-wrap>
                <div aria-hidden="true" class="h-10 w-full bg-linear-to-t from-black to-transparent"></div>
                <div class="bg-black px-5 pb-10">
                  <button type="button" data-submit ${canSubmit ? '' : 'disabled'} class="type-body2 flex h-20 w-full items-center justify-center rounded-full px-6 font-medium transition-colors ${canSubmit ? 'bg-white text-black active:bg-[#aaa]' : 'pointer-events-none bg-[#666] text-black/40'}">${t('createButton')}</button>
                </div>
              </div>` : ''}
            </div>
          </div>
          ${sheet}
        </div>
      </div>`;
  }

  // CookOptionEditSheet: dim + blur over the page header, then a #222 sheet with the option's
  // name and fields; 삭제 (red outline) and 수정 완료 (enabled once valid and changed).
  function renderOptionSheet() {
    const i = form.editing;
    const o = form.options[i];
    const errs = optionErrors(o, i, form.options);
    const changed = JSON.stringify(o) !== JSON.stringify(form.snapshot);
    const canConfirm = Object.keys(errs).length === 0 && changed;
    return `
          <div class="absolute inset-0 z-20 flex flex-col">
            <button type="button" data-sheet-cancel aria-label="${t('cancel')}" class="h-25 shrink-0 cursor-default bg-black/70 backdrop-blur-[5px]"></button>
            <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[20px] bg-[#222]">
              <div class="relative flex h-25 shrink-0 items-center justify-center">
                <p class="type-body2 truncate px-30 text-center text-white" data-sheet-title>${esc(o.name.trim() || t('editCookOption'))}</p>
                <button type="button" data-sheet-cancel aria-label="${t('cancel')}" class="proto-icon-10 proto-stroke-15 absolute top-0 right-0 flex h-25 w-30 items-center justify-center p-2.5 text-white transition-colors active:bg-white/18">${ICON.x}</button>
              </div>
              <div class="min-h-0 flex-1 overflow-auto">
                <div class="flex flex-col gap-12 pt-6 pb-10">
                  <section class="px-8">${field({ key: i + '.name', label: t('cookOptionName'), value: o.name, error: 'name' in errs ? errs.name : null, bg: '#222' })}</section>
                  ${optionFields(i, '#222', true)}
                </div>
              </div>
              ${kb ? '' : `<div class="flex shrink-0 items-start gap-5 bg-[#222] px-[30px] pt-5 pb-10">
                <button type="button" data-sheet-delete class="proto-icon-8 proto-stroke-15 flex h-20 w-[190px] shrink-0 items-center justify-center gap-3 rounded-full border-2 border-[#be4c4c] text-[#fa5656] transition-colors active:bg-[#be4c4c]/20">${ICON.trash2}<span class="type-body2 text-[#fa5656]">${t('delete')}</span></button>
                <button type="button" data-sheet-confirm ${canConfirm ? '' : 'disabled'} class="type-body2 flex h-20 flex-1 items-center justify-center rounded-full px-6 font-medium transition-colors ${canConfirm ? 'bg-white text-black active:bg-[#aaa]' : 'pointer-events-none bg-[#666] text-black/40'}">${t('saveCookOption')}</button>
              </div>`}
            </div>
          </div>`;
  }

  // Reorder mode: ‹ (no label) + "순서 변경하기", rows with ≡ and no summary, dragged by a long
  // press; 변경 완료 at the bottom, enabled once the order differs.
  function renderReorder() {
    const byId = new Map(recipes().map((r) => [r.id, r]));
    const changed = reorder.order.join() !== reorder.original.join();
    return `
      <div class="relative h-full bg-black">
        <div class="flex h-full flex-col overflow-hidden">
          <header class="relative flex h-[100px] min-w-0 shrink-0 items-center justify-between bg-white/20 py-3 pl-2">
            <button type="button" data-recipe-back aria-label="${t('back')}" class="group -my-3 -ml-2 flex shrink-0 items-center self-stretch pr-3 pl-2">
              <span class="proto-icon-10 inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-lg px-3 text-white group-active:bg-black/20">${ICON.chevronLeft}</span>
            </button>
            <h3 class="type-body2 absolute top-1/2 left-1/2 max-w-[calc(100%-8rem)] -translate-x-1/2 -translate-y-1/2 truncate text-center text-white">${t('reOrder2')}</h3>
          </header>
          <main class="flex h-full flex-col overflow-y-auto py-7">
            <div class="flex h-191 flex-col gap-2.5 overflow-y-auto" data-drag-list="recipes">
              ${reorder.order.map((id, i) => {
                const r = byId.get(id);
                return `
              <div data-drag-row="${i}" class="relative flex h-30 w-full items-center py-5 pr-8 pl-3 select-none" style="touch-action:none">
                <div class="flex h-full w-20 shrink-0 items-center justify-center"><p class="type-body3 text-center text-white/70">${i + 1}</p></div>
                <div class="flex min-w-0 flex-1 flex-col items-start gap-1 overflow-hidden pr-5"><p class="type-body2 w-full truncate text-left text-white">${esc(r.name)}</p></div>
                <div class="proto-icon-10 flex size-10 shrink-0 items-center text-white/70">${ICON.menuLines}</div>
              </div>`;
              }).join('')}
            </div>
          </main>
        </div>
        <div class="absolute right-0 bottom-0 left-0 flex w-full gap-4 bg-linear-to-t from-black from-80% to-black/10 px-5 py-10">
          <button type="button" data-reorder-done ${changed ? '' : 'disabled'} class="type-body2 flex h-20 flex-1 items-center justify-center rounded-lg px-6 font-medium transition-colors ${changed ? 'bg-white text-black active:bg-[#aaa]' : 'pointer-events-none bg-[#666] text-black/40'}">${t('done')}</button>
        </div>
      </div>`;
  }

  // ConfirmModal (components/ui/confirm-modal.tsx): neutral = leave without saving; critical =
  // delete a cook option.
  function renderConfirm() {
    if (!confirmBox) return '';
    const leave = confirmBox.kind !== 'deleteOption';
    const [title, cancel, ok] = leave
      ? [t('unsavedChangesWarning'), t('keepEditing'), t('discardChanges')]
      : [t('deleteCookOptionConfirm'), t('keepCookOption'), t('deleteCookOptionAction')];
    return `
      <div class="absolute inset-0 z-50">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" data-confirm-cancel></div>
        <div class="absolute top-1/2 left-1/2 flex w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-[20px] bg-[#222] pt-25 pb-10 ring-1 ring-white/10 ring-inset">
          <p class="type-body2 w-full px-8 text-center whitespace-pre-wrap text-white">${title}</p>
          <div class="mt-30 flex w-full gap-5 px-[30px]">
            <button type="button" data-confirm-cancel class="flex h-20 flex-1 items-center justify-center rounded-full px-6 transition-colors active:bg-white/18 ${leave ? 'border-2 border-white' : 'border border-white'}"><span class="type-body2 text-white">${cancel}</span></button>
            <button type="button" data-confirm-ok class="flex h-20 flex-1 items-center justify-center rounded-full px-6 transition-colors ${leave ? 'border-2 border-white active:bg-white/18' : 'border-2 border-[#be4c4c] active:bg-[#be4c4c]/20'}"><span class="type-body2 ${leave ? 'text-white' : 'text-[#fa5656]'}">${ok}</span></button>
          </div>
        </div>
      </div>`;
  }

  // Toast (components/ui/toast.tsx): #444 card at top 112, slides down, closes after 3.5s.
  const toastEl = document.createElement('div');
  toastEl.className = 'proto-toast';
  device.appendChild(toastEl);
  let toastTimer = 0;
  function showToast(text, variant = 'success') {
    toastEl.innerHTML = `
      <div class="flex w-full items-center gap-4 pr-12">
        <span class="flex size-10 shrink-0 items-center justify-center">${variant === 'error' ? ICON.errorCircle : ICON.checkCircle}</span>
        <p class="type-body2 min-w-0 flex-1 truncate text-white">${esc(text)}</p>
      </div>`;
    toastEl.classList.remove('is-shown');
    void toastEl.offsetWidth;
    toastEl.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-shown'), 3500);
  }

  // Long-press drag to reorder (dnd-kit PointerSensor delay 150 / tolerance 5, vertical only):
  // the row follows the finger; the others slide out of its way; dropping commits the order.
  let drag = null, suppressClick = false;
  recipePage.addEventListener('pointerdown', (e) => {
    const row = e.target.closest('[data-drag-row]');
    if (!row || e.button > 0) return;
    const list = row.parentElement;
    const rows = [...list.children];
    const from = rows.indexOf(row);
    const pitch = rows.length > 1 ? rows[1].getBoundingClientRect().top - rows[0].getBoundingClientRect().top : row.getBoundingClientRect().height;
    const scale = row.getBoundingClientRect().height / row.offsetHeight || 1;
    drag = { row, rows, list, from, to: from, y0: e.clientY, x0: e.clientX, pitch: pitch / scale, scale, active: false };
    drag.timer = setTimeout(() => {
      if (!drag) return;
      drag.active = true;
      row.classList.add('is-dragging');
      rows.forEach((r) => { if (r !== row) r.style.transition = 'transform 200ms ease'; });
    }, 150);
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dy = (e.clientY - drag.y0) / drag.scale;
    if (!drag.active) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 5) { clearTimeout(drag.timer); drag = null; }
      return;
    }
    e.preventDefault();
    drag.row.style.transform = `translateY(${dy}px)`;
    drag.to = Math.max(0, Math.min(drag.rows.length - 1, drag.from + Math.round(dy / drag.pitch)));
    drag.rows.forEach((r, i) => {
      if (r === drag.row) return;
      const shift = drag.from < drag.to && i > drag.from && i <= drag.to ? -1 : drag.from > drag.to && i < drag.from && i >= drag.to ? 1 : 0;
      r.style.transform = shift ? `translateY(${shift * drag.pitch}px)` : '';
    });
  }, { passive: false });
  window.addEventListener('pointerup', () => {
    if (!drag) return;
    clearTimeout(drag.timer);
    const d = drag;
    drag = null;
    if (!d.active) return;
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    if (d.to === d.from) { renderRecipe(); return; }
    const move = (arr) => { const [x] = arr.splice(d.from, 1); arr.splice(d.to, 0, x); };
    if (d.list.dataset.dragList === 'recipes') move(reorder.order);
    else { move(form.options); form.dirty = true; }
    renderRecipe();
  });

  function openCreate() {
    kb = null;
    form = { name: '', options: [newOption(1)], editing: null, snapshot: null, touched: new Set(), meltSuppressed: new Set(), dirty: false };
    recipeView.mode = 'create';
    renderRecipe();
  }
  function openReorder() {
    const ids = recipes().map((r) => r.id);
    reorder = { order: ids.slice(), original: ids };
    recipeView.mode = 'reorder';
    renderRecipe();
  }
  function leaveMode() { recipeView.mode = null; form = null; reorder = null; confirmBox = null; kb = null; renderRecipe(); }
  function addOption() {
    const used = new Set(form.options.map((o) => o.name));
    let n = 1;
    while (used.has(t('cookOptionDefaultName')(n))) n++;
    form.options.push({ ...form.options[form.options.length - 1], name: t('cookOptionDefaultName')(n) });
    form.dirty = true;
    renderRecipe();
  }
  function submitCreate() {
    if (!formValid() || !form.dirty) return;
    const list = recipes();
    if (list.some((r) => r.name === form.name.trim())) { showToast(t('duplicateName'), 'error'); return; }
    const id = Math.max(0, ...list.map((r) => r.id)) + 1;
    list.push({
      id,
      name: form.name.trim(),
      cookOptions: form.options.map((o, i) => ({
        id: id * 100 + i + 1, name: o.name, top: parseFloat(o.top) || 0, bot: parseFloat(o.bot) || 0,
        cookingSec: o.cookingSec, meltingSec: o.cheese ? o.meltingSec : 0, thickness: parseFloat(o.thickness), withoutArm: o.withoutArm,
      })),
    });
    showToast(t('recipeCreatedSuccessfully'));
    leaveMode();
  }

  // A keyboard value → form state (°F / inch converted back to °C / mm, times in seconds).
  function setFromInput(key, raw, mode) {
    if (key === 'name') { form.name = raw; return; }
    const [i, k] = key.split('.');
    const o = form.options[Number(i)];
    if (k === 'name') o.name = raw;
    else if (k === 'top' || k === 'bot') {
      const n = parseInt(raw, 10);
      o[k] = raw.trim() === '' || isNaN(n) ? '' : String(settings.temperatureUnit === '°F' ? Math.round(toC(n) * 100) / 100 : n);
    } else if (k === 'thickness') {
      const n = parseFloat(raw);
      o[k] = raw.trim() === '' || isNaN(n) ? '' : String(Math.round((settings.lengthUnit === 'inch' ? n * 25.4 : n) * 100) / 100);
    } else if (mode === 'seconds') o[k] = Math.min(3600, parseInt(raw, 10) || 0);
  }
  // -- on-screen keyboard (components/layout/keyboard-aware-layout.tsx, components/ui/
  //    virutal-keyboard/virtual-keyboard.tsx + .css, time-picker/time-picker.tsx) ---------------
  // Tapping a field docks the keyboard under the page (the page shrinks above it): qwerty with
  // 한글 / English / symbols, a numeric pad, or the m:ss wheel picker for times. Typing goes
  // through the keyboard only, as on the device. Hangul is composed with hangul-js (vendored).
  const KB_LAYOUTS = {
    numeric: {
      int: ['1 2 3', '4 5 6', '7 8 9', '0 {bksp}'],
      decimal: ['1 2 3', '4 5 6', '7 8 9', '. 0 {bksp}'],
    },
    symbol: {
      default: ['1 2 3 4 5 6 7 8 9 0', '- / : ; ( ) $ & @ "', "{shift} . , ? ! ' {bksp}", '{abc} {globe} {space} {enter}'],
      shift: ['[ ] { } # % ^ * + =', '_ \\ | ~ < > € £ ¥ ·', "{shift} . , ? ! ' {bksp}", '{abc} {globe} {space} {enter}'],
    },
    korean: {
      default: ['ㅂ ㅈ ㄷ ㄱ ㅅ ㅛ ㅕ ㅑ ㅐ ㅔ', 'ㅁ ㄴ ㅇ ㄹ ㅎ ㅗ ㅓ ㅏ ㅣ', '{shift} ㅋ ㅌ ㅊ ㅍ ㅠ ㅜ ㅡ {bksp}', '{numbers} {globe} {space} {enter}'],
      shift: ['ㅃ ㅉ ㄸ ㄲ ㅆ ㅛ ㅕ ㅑ ㅒ ㅖ', 'ㅁ ㄴ ㅇ ㄹ ㅎ ㅗ ㅓ ㅏ ㅣ', '{shift} ㅋ ㅌ ㅊ ㅍ ㅠ ㅜ ㅡ {bksp}', '{numbers} {globe} {space} {enter}'],
    },
    english: {
      default: ['q w e r t y u i o p', 'a s d f g h j k l', '{shift} z x c v b n m {bksp}', '{numbers} {globe} {space} {enter}'],
      shift: ['Q W E R T Y U I O P', 'A S D F G H J K L', '{shift} Z X C V B N M {bksp}', '{numbers} {globe} {space} {enter}'],
    },
  };
  // the keys the app draws as icons (virtual-keyboard.css section 9)
  const KB_ICON_KEYS = ['{shift}', '{bksp}', '{enter}', '{numbers}', '{abc}', '{globe}'];
  let kb = null;   // { key, type: 'qwerty' | 'numeric' | 'time', mode, raw, value, layoutName, isSymbol, isKorean }

  function kbLayout() {
    if (kb.type === 'numeric') return { default: KB_LAYOUTS.numeric[kb.mode] };
    if (kb.isSymbol) return KB_LAYOUTS.symbol;
    return kb.isKorean ? KB_LAYOUTS.korean : KB_LAYOUTS.english;
  }
  function renderKeyboard() {
    if (!kb) { kbHost.innerHTML = ''; return; }
    if (kb.type === 'time') { kbHost.innerHTML = `<div class="flex shrink-0 flex-col border-t-2 border-white/20 bg-[#444444]">${timePicker()}</div>`; initTimePicker(); return; }
    const layout = kbLayout();
    const name = layout[kb.layoutName] ? kb.layoutName : 'default';
    const wrap = kb.type === 'numeric'
      ? 'virtual-keyboard-wrapper virtual-keyboard-numeric'
      : ['virtual-keyboard-wrapper virtual-keyboard-qwerty',
          !kb.isSymbol && name === 'shift' ? 'virtual-keyboard-shift' : '',
          kb.isSymbol ? 'virtual-keyboard-symbol ' + (kb.isKorean ? 'virtual-keyboard-korean' : 'virtual-keyboard-english') : '',
          kb.isSymbol && name === 'shift' ? 'virtual-keyboard-symbol-shift' : ''].join(' ');
    const label = (k) => ({ '{space}': kb.isSymbol && kb.isKorean ? '스페이스' : 'space' }[k] || k);
    const rows = layout[name].map((row) => `
            <div class="hg-row">${row.split(' ').map((k) => {
              const fn = k.length > 1 && k.startsWith('{');
              const cls = fn ? 'hg-functionBtn hg-button-' + k.slice(1, -1) : 'hg-standardBtn';
              return `<div class="hg-button ${cls}" data-skbtn="${esc(k)}"><span>${KB_ICON_KEYS.includes(k) ? '' : esc(label(k))}</span></div>`;
            }).join('')}</div>`).join('');
    kbHost.innerHTML = `
      <div class="flex shrink-0 flex-col border-t-2 border-white/20 bg-[#444444]">
        <section class="flex justify-center border-t-2 border-white/15">
          <div class="${wrap}"><div class="simple-keyboard hg-theme-default">${rows}</div></div>
        </section>
      </div>`;
  }

  // TimePicker: two wheels (00–59 minutes, 00–59 seconds), 54-tall rows in a 431 window, a
  // black/20 band with 분 / 초 across the middle, fading into #444 at the top and bottom.
  const TP_ROW = 54, TP_H = 431;
  const two = (n) => String(n).padStart(2, '0');
  function timePicker() {
    const col = (name) => `
            <div class="tp-col" data-tp-col="${name}" style="height:${TP_H}px">
              <div style="height:${(TP_H - TP_ROW) / 2}px"></div>
              ${Array.from({ length: 60 }, (_, i) => `<div class="tp-item" style="height:${TP_ROW}px"><span class="text-[40px] leading-[1.3] font-light text-white">${two(i)}</span></div>`).join('')}
              <div style="height:${(TP_H - TP_ROW) / 2}px"></div>
            </div>`;
    return `
          <div class="relative mx-auto h-107.75 w-103">
            <div class="flex gap-4">${col('minute')}${col('second')}</div>
            <div class="pointer-events-none absolute top-1/2 left-1/2 h-13.5 w-123.5 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-black/20">
              <span class="type-body1 absolute top-1/2 left-43.5 -translate-y-1/2 text-white/60">${t('min')}</span>
              <span class="type-body1 absolute top-1/2 left-97 -translate-y-1/2 text-white/60">${t('sec')}</span>
            </div>
            <div class="pointer-events-none absolute top-0 left-1/2 z-10 h-35 w-150 -translate-x-1/2 bg-linear-to-b from-[#444] from-10% to-transparent"></div>
            <div class="pointer-events-none absolute bottom-0 left-1/2 z-10 h-35 w-150 -translate-x-1/2 bg-linear-to-b from-transparent to-[#444]"></div>
          </div>`;
  }
  function initTimePicker() {
    const [m, s] = (kb.value || '00:00').split(':').map((x) => parseInt(x, 10) || 0);
    const owner = kb;   // a settle that lands after this field closed (or moved on) is dropped
    kbHost.querySelectorAll('[data-tp-col]').forEach((col) => {
      col.scrollTop = (col.dataset.tpCol === 'minute' ? m : s) * TP_ROW;
      let settle = 0;
      col.addEventListener('scroll', () => {
        clearTimeout(settle);
        settle = setTimeout(() => {
          if (kb !== owner || !col.isConnected) return;
          const i = Math.max(0, Math.min(59, Math.round(col.scrollTop / TP_ROW)));
          const [mm, ss] = kb.value.split(':');
          kb.value = col.dataset.tpCol === 'minute' ? two(i) + ':' + ss : mm + ':' + two(i);
          kbChanged(kb.value);
        }, 90);
      });
      // drag the wheel with a mouse as well as a finger
      col.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse') return;
        const y0 = e.clientY, top0 = col.scrollTop, k = col.getBoundingClientRect().height / col.offsetHeight || 1;
        col.style.scrollSnapType = 'none';
        const move = (ev) => { col.scrollTop = top0 - (ev.clientY - y0) / k; };
        const up = () => {
          window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
          col.style.scrollSnapType = '';
          col.scrollTo({ top: Math.round(col.scrollTop / TP_ROW) * TP_ROW, behavior: 'smooth' });
        };
        window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
      });
    });
  }

  // normalizeNumericInput: digits, plus one "." in decimal mode
  function normalizeNumeric(v, mode) {
    let out = '', dot = false;
    for (const c of v) {
      if (c >= '0' && c <= '9') out += c;
      else if (mode === 'decimal' && c === '.' && !dot) { dot = true; out += '.'; }
    }
    return out;
  }
  function kbPress(k) {
    switch (k) {
      case '{enter}': closeKeyboard(); return;
      case '{shift}': kb.layoutName = kb.layoutName === 'default' ? 'shift' : 'default'; renderKeyboard(); return;
      case '{numbers}': kb.isSymbol = true; kb.layoutName = 'default'; renderKeyboard(); return;
      case '{abc}': kb.isSymbol = false; kb.layoutName = 'default'; renderKeyboard(); return;
      case '{globe}': kb.isKorean = !kb.isKorean; kb.isSymbol = false; kb.layoutName = 'default'; renderKeyboard(); return;
      case '{bksp}': kb.raw = kb.raw.slice(0, -1); break;
      case '{space}': kb.raw += ' '; break;
      default: kb.raw += k;
    }
    if (kb.type === 'numeric') kb.raw = normalizeNumeric(kb.raw, kb.mode);
    kb.value = kb.type === 'numeric' || !window.Hangul ? kb.raw : window.Hangul.assemble(window.Hangul.disassemble(kb.raw));
    kbChanged(kb.value);
  }
  kbHost.addEventListener('click', (e) => {
    const b = e.target.closest('[data-skbtn]');
    if (b && kb) kbPress(b.dataset.skbtn);
  });

  // A field's value changes as keys are pressed: the state updates and only that field's text
  // is redrawn (the page re-renders when the keyboard closes or moves to another field).
  function kbChanged(value) {
    const el = recipePage.querySelector(`[data-kb-field="${kb.key}"]`);
    setFromInput(kb.key, kb.type === 'time' ? String(timeToSec(value)) : value, kb.type === 'time' ? 'seconds' : kb.mode);
    form.dirty = true;
    if (!el) return;
    const shown = kb.type === 'time' ? (timeToSec(value) ? fmtTimeUnit(timeToSec(value)) : '') : value;
    el.querySelector('.pi-value').textContent = shown;
    el.classList.toggle('has-value', shown !== '');
    if (kb.key.endsWith('.name') && form.editing != null) {
      const title = recipePage.querySelector('[data-sheet-title]');
      if (title) title.textContent = form.options[form.editing].name.trim() || t('editCookOption');
    }
  }
  const timeToSec = (str) => { const [m = '0', s = '0'] = str.split(':'); return (parseInt(m, 10) || 0) * 60 + (parseInt(s, 10) || 0); };

  function fieldValueForKeyboard(key, type) {
    if (key === 'name') return form.name;
    const [i, k] = key.split('.');
    const o = form.options[Number(i)];
    if (type === 'time') { const sec = o[k]; return two(Math.floor(sec / 60)) + ':' + two(sec % 60); }
    if (k === 'name') return o.name;
    if (k === 'top' || k === 'bot') return o[k] === '' ? '' : String(tempShown(parseFloat(o[k])));
    if (k === 'thickness') return o[k] === '' ? '' : String(thickShown(parseFloat(o[k])));
    return '';
  }
  function openKeyboard(key, type, mode, value) {
    if (kb && kb.key !== key) form.touched.add(kb.key);
    const v = value != null ? value : fieldValueForKeyboard(key, type);
    kb = { key, type, mode, raw: v, value: v, layoutName: 'default', isSymbol: false, isKorean: kb ? kb.isKorean : lang() === 'ko' };
    renderRecipe();
    requestAnimationFrame(() => {
      const el = recipePage.querySelector(`[data-kb-field="${key}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
  function closeKeyboard() {
    if (!kb) return;
    form.touched.add(kb.key);
    if (kb.key.endsWith('.meltingSec')) form.meltSuppressed.delete(Number(kb.key.split('.')[0]));
    kb = null;
    renderRecipe();
  }
  // Tapping anywhere outside the keyboard and the fields closes it (after the tap is handled).
  document.addEventListener('click', (e) => {
    if (!kb || recipePage.hidden) return;
    if (e.composedPath().includes(kbHost)) return;
    if (e.target.closest && e.target.closest('[data-kb-field]')) return;
    closeKeyboard();
  });

  // Returns true when it handled the click.
  function handleFormClick(e) {
    if (suppressClick) return true;
    const clear = e.target.closest('[data-clear]');
    if (clear) {
      // Clear (×): empty the value and open the keyboard on it
      const f = clear.closest('[data-kb-field]');
      setFromInput(f.dataset.kbField, f.dataset.kbType === 'time' ? '0' : '', f.dataset.kbType === 'time' ? 'seconds' : f.dataset.kbMode);
      form.dirty = true;
      openKeyboard(f.dataset.kbField, f.dataset.kbType, f.dataset.kbMode === 'text' ? null : f.dataset.kbMode, f.dataset.kbType === 'time' ? '00:00' : '');
      return true;
    }
    const fieldEl = e.target.closest('[data-kb-field]');
    if (fieldEl) {
      if (!(kb && kb.key === fieldEl.dataset.kbField)) openKeyboard(fieldEl.dataset.kbField, fieldEl.dataset.kbType, fieldEl.dataset.kbMode === 'text' ? null : fieldEl.dataset.kbMode);
      return true;
    }
    const cheese = e.target.closest('[data-cheese]');
    if (cheese) {
      const i = Number(cheese.dataset.cheese), o = form.options[i];
      o.cheese = !o.cheese;
      if (o.cheese) form.meltSuppressed.add(i); else { o.meltingSec = 0; form.touched.delete(i + '.meltingSec'); form.meltSuppressed.delete(i); }
      form.dirty = true; renderRecipe(); return true;
    }
    const unload = e.target.closest('[data-unload]');
    if (unload) {
      const i = Number(unload.closest('[data-unload-group]').dataset.unloadGroup);
      form.options[i].withoutArm = unload.dataset.unload === 'off';
      form.dirty = true; renderRecipe(); return true;
    }
    if (e.target.closest('[data-add-option]')) { addOption(); return true; }
    const edit = e.target.closest('[data-edit-option]');
    if (edit) { form.editing = Number(edit.dataset.editOption); form.snapshot = { ...form.options[form.editing] }; renderRecipe(); return true; }
    if (e.target.closest('[data-sheet-cancel]')) { form.options[form.editing] = form.snapshot; form.editing = null; renderRecipe(); return true; }
    if (e.target.closest('[data-sheet-confirm]')) { form.editing = null; renderRecipe(); return true; }
    if (e.target.closest('[data-sheet-delete]')) { confirmBox = { kind: 'deleteOption' }; renderRecipe(); return true; }
    if (e.target.closest('[data-submit]')) { submitCreate(); return true; }
    return false;
  }
  function handleConfirmClick(e) {
    if (e.target.closest('[data-confirm-cancel]')) { confirmBox = null; renderRecipe(); return true; }
    if (e.target.closest('[data-confirm-ok]')) {
      const kind = confirmBox.kind;
      confirmBox = null;
      if (kind === 'deleteOption') { form.options.splice(form.editing, 1); form.editing = null; form.dirty = true; renderRecipe(); }
      else leaveMode();
      return true;
    }
    return false;
  }
  function handleModeBack() {
    if (recipeView.mode === 'create') {
      if (form.dirty) { confirmBox = { kind: 'leave' }; renderRecipe(); } else leaveMode();
    } else if (recipeView.mode === 'reorder') {
      if (reorder.order.join() !== reorder.original.join()) { confirmBox = { kind: 'leave' }; renderRecipe(); } else leaveMode();
    }
  }
  function submitReorder() {
    const list = recipes();
    const byId = new Map(list.map((r) => [r.id, r]));
    const next = reorder.order.map((id) => byId.get(id));
    list.splice(0, list.length, ...next);
    showToast(t('orderUpdated'));
    leaveMode();
  }

  // Language changes (dev bar ko/en, or 언어 in settings) re-render whatever is open, so the
  // menu's 레시피 / 설정 / 장비 관리 follow the cook screen's language.
  // cook.js re-sets lang on every render (each 200ms tick), so only an actual change counts —
  // re-rendering on every tick replaced the buttons mid-tap and swallowed clicks.
  let shownLang = document.documentElement.lang;
  new MutationObserver(() => {
    const now = document.documentElement.lang;
    if (now === shownLang) return;
    shownLang = now;
    if (!menu.hidden) renderMenu();
    if (!setting.hidden) renderSetting();
    if (!recipePage.hidden) renderRecipe();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  // -- open / close ---------------------------------------------------------
  let closeTimer = null;
  function openMenu() {
    clearTimeout(closeTimer);
    renderMenu();
    menu.classList.add('is-closed');
    menu.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.remove('is-closed')));
  }
  function closeMenu() {
    menu.classList.add('is-closed');
    // a variant can lengthen the close (e.g. v14's slide) with --menu-close-ms on #app-menu
    const ms = parseFloat(getComputedStyle(menu).getPropertyValue('--menu-close-ms')) || 200;
    closeTimer = setTimeout(() => { menu.hidden = true; }, ms);
  }
  // The app navigates first and lets the menu fade out over the new page.
  function openSetting() {
    renderSetting();
    setting.hidden = false;
    closeMenu();
  }
  function closeSetting() { setting.hidden = true; }
  function openRecipe() {
    Object.assign(recipeView, { id: null, optionId: null, popover: false, mode: null });
    renderRecipe();
    recipePage.hidden = false;
    closeMenu();
  }
  function closeRecipe() { recipePage.hidden = true; }

  // -- engineer PIN (components/ui/engineer-pin-modal.tsx, menu.tsx handleEngineerEntry) ------
  // 장비 관리 closes the menu and asks for the 4-digit engineer PIN over a black/70 blurred
  // backdrop: ‹ to cancel, "비밀번호를 입력하세요", four dots, and the transparent number pad.
  // The 4th digit checks it at once: right → it closes and the app would open 장비 관리 (not
  // ported; it logs) and stays unlocked for this page load; wrong → the dots turn red with
  // "잘못된 비밀번호입니다", and the next digit starts over (⌫ clears). PIN: 1234 (the app's
  // VITE_ENGINEER_PIN default).
  const ENGINEER_PIN = '1234';
  const pinLayer = document.createElement('div');
  pinLayer.id = 'app-pin';
  pinLayer.className = 'proto-layer';
  pinLayer.hidden = true;
  device.appendChild(pinLayer);
  let pin = '', pinError = false, unlocked = false;
  function renderPin() {
    const dots = Array.from({ length: 4 }, (_, i) => `
              <div class="flex h-[120px] w-[80px] shrink-0 flex-col items-center justify-center rounded-[20px]">
                <div class="size-4 shrink-0 rounded-full ${pinError ? 'bg-[#e44242]' : pin.length > i ? 'bg-white' : 'bg-white/30'}"></div>
              </div>`).join('');
    const keys = ['1 2 3', '4 5 6', '7 8 9', '0 {bksp}'].map((row) => `
            <div class="hg-row">${row.split(' ').map((k) => `<div class="hg-button ${k === '{bksp}' ? 'hg-functionBtn hg-button-bksp' : 'hg-standardBtn'}" data-pin-key="${k}"><span>${k === '{bksp}' ? '' : k}</span></div>`).join('')}</div>`).join('');
    pinLayer.innerHTML = `
      <div class="pin-backdrop absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      <div class="pin-popup absolute inset-0 flex flex-col overflow-hidden">
        <header class="flex h-[100px] w-full shrink-0 items-center overflow-clip py-2">
          <!-- Prototype: ‹ sits where the header's ☰ does (64 box at x32, pl 8 → 32), with the same
               160 × 100 tap area; the pressed fill stays on the 64 box -->
          <button type="button" data-pin-close aria-label="${t('pinClose')}" class="group -my-2 flex cursor-pointer items-center justify-center self-stretch pr-16 pl-8">
            <span class="flex size-[64px] items-center justify-center rounded-lg text-white group-active:bg-white/10 [&_svg]:size-12">${ICON.chevronLeft}</span>
          </button>
        </header>
        <div class="flex min-h-0 w-full flex-1 flex-col items-center pt-[120px]">
          <div class="flex shrink-0 flex-col items-center">
            <p class="type-body2 w-[400px] text-center text-white">${t('enterPasscode')}</p>
            <div class="mt-12 flex shrink-0 items-start rounded-[20px]">${dots}</div>
            ${pinError ? `<p class="type-body3 text-center leading-[130%] text-[#e44242]">${t('pinError')}</p>` : ''}
          </div>
        </div>
        <div class="shrink-0">
          <section class="flex justify-center">
            <div class="virtual-keyboard-wrapper virtual-keyboard-numeric virtual-keyboard-numeric-transparent"><div class="simple-keyboard hg-theme-default">${keys}</div></div>
          </section>
        </div>
      </div>`;
  }
  // Prototype: the PIN opens over the menu as it is (the app closes the menu first, which here
  // would slide the cook screen back in behind the PIN). ‹ returns to the menu; the right PIN
  // drops the menu at once, without the slide, as the PIN fades.
  function openPin() {
    if (unlocked) { closeMenu(); console.info('[Menu] manage-device (out of scope; already unlocked)'); return; }
    pin = ''; pinError = false;
    renderPin();
    pinLayer.classList.add('is-closed');
    pinLayer.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => pinLayer.classList.remove('is-closed')));
  }
  function closeMenuInstantly() {
    device.classList.add('no-motion');
    clearTimeout(closeTimer);
    menu.classList.add('is-closed');
    menu.hidden = true;
    requestAnimationFrame(() => requestAnimationFrame(() => device.classList.remove('no-motion')));
  }
  function closePin() {
    pinLayer.classList.add('is-closed');
    setTimeout(() => { pinLayer.hidden = true; }, 200);
  }
  pinLayer.addEventListener('click', (e) => {
    if (e.target.closest('[data-pin-close]')) { closePin(); return; }
    const key = e.target.closest('[data-pin-key]');
    if (!key) return;
    const k = key.dataset.pinKey;
    if (pinError) {   // after a wrong PIN: a digit starts over, ⌫ clears
      pinError = false;
      pin = k === '{bksp}' ? '' : k;
    } else if (k === '{bksp}') pin = pin.slice(0, -1);
    else if (pin.length < 4) pin += k;
    if (pin.length === 4) {
      if (pin === ENGINEER_PIN) {
        unlocked = true;
        renderPin();
        closeMenuInstantly();
        console.info('[Menu] manage-device (out of scope)');
        setTimeout(closePin, 120);
        return;
      }
      pinError = true;
    }
    renderPin();
  });

  // Capture phase, so the variants' own menu-button stub never needs editing.
  document.addEventListener('click', (e) => {
    if (e.target.closest('#menu-btn')) { e.stopPropagation(); openMenu(); }
  }, true);

  menu.addEventListener('click', (e) => {
    const el = e.target.closest('[data-menu]');
    if (!el) return;
    const action = el.dataset.menu;
    if (action === 'close') closeMenu();
    else if (action === 'setting') openSetting();
    else if (action === 'recipe') openRecipe();
    else if (action === 'manage-device') openPin();
    else console.info('[Menu] ' + action + ' (out of scope)');
  });

  setting.addEventListener('click', (e) => {
    if (e.target.closest('[data-setting-back]')) { closeSetting(); return; }
    const toggle = e.target.closest('[data-setting-toggle]');
    if (toggle) {
      const key = toggle.dataset.settingToggle;
      settings[key] = !settings[key];
      store.set(key, settings[key]);
      renderSetting();
      // 빠른 레시피 선택 swaps the whole screen (variant ↔ v0); land back on this page.
      if (key === 'quickSelect' && window.App && window.App.applyQuickSelect) {
        setTimeout(() => window.App.applyQuickSelect({ reopenSetting: true }), 220);
      }
      return;
    }
    const sw = e.target.closest('[data-setting]');
    if (!sw) return;
    const key = sw.dataset.setting;
    const current = key === 'locale' ? lang() : settings[key];
    const next = current === sw.dataset.right ? sw.dataset.left : sw.dataset.right;
    if (key === 'locale') {
      if (window.Cook && window.Cook.setLang) window.Cook.setLang(next);
    } else {
      settings[key] = next;
      store.set(key, next);
    }
    renderSetting();
  });

  recipePage.addEventListener('click', (e) => {
    if (confirmBox && handleConfirmClick(e)) return;
    if (e.target.closest('[data-recipe-back]') && recipeView.mode) { handleModeBack(); return; }
    if (recipeView.mode === 'create' && handleFormClick(e)) return;
    if (recipeView.mode === 'reorder') { if (e.target.closest('[data-reorder-done]')) submitReorder(); return; }
    const open = e.target.closest('[data-recipe-open]');
    if (open) { Object.assign(recipeView, { id: Number(open.dataset.recipeOpen), optionId: null, popover: false }); renderRecipe(); recipePage.scrollTop = 0; return; }
    const tab = e.target.closest('[data-recipe-option]');
    if (tab) { recipeView.optionId = Number(tab.dataset.recipeOption); renderRecipe(); return; }
    if (e.target.closest('[data-recipe-kebab]')) { recipeView.popover = true; renderRecipe(); return; }
    if (e.target.closest('[data-recipe-popover-close]')) { recipeView.popover = false; renderRecipe(); return; }
    const action = e.target.closest('[data-recipe-action]');
    if (action && action.dataset.recipeAction === 'create') { openCreate(); return; }
    if (action && action.dataset.recipeAction === 'reorder') { openReorder(); return; }
    if (action) {
      console.info('[Recipe] ' + action.dataset.recipeAction + ' (out of scope)');
      if (recipeView.popover) { recipeView.popover = false; renderRecipe(); }
      return;
    }
    if (e.target.closest('[data-recipe-back]')) {
      // detail → list (navigate(-1)); list → the cook screen (navigate('/cook'))
      if (recipeView.id != null) { Object.assign(recipeView, { id: null, optionId: null, popover: false }); renderRecipe(); }
      else closeRecipe();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!pinLayer.hidden) closePin();
    else if (!menu.hidden) closeMenu();
    else if (!recipePage.hidden && kb) closeKeyboard();
    else if (!recipePage.hidden) recipePage.querySelector('[data-confirm-cancel], [data-sheet-cancel], [data-recipe-popover-close], [data-recipe-back]').click();
    else if (!setting.hidden) closeSetting();
  });

  try {
    if (sessionStorage.getItem('proto:reopenSetting')) {
      sessionStorage.removeItem('proto:reopenSetting');
      renderSetting();
      setting.hidden = false;
    }
  } catch (e) { /* ignore */ }

  window.AppMenu = { open: openMenu, close: closeMenu, openSetting, closeSetting, openRecipe, closeRecipe, openPin, settings };
})();
