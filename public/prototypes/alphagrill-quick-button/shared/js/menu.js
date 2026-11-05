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
      foodDetectionDescV15: '카메라로 조리물을 찾아 배출합니다',   // the camera: one line (≈ 329 of 360)   // v15: without 그리들 위
      quickSelect: '빠른 레시피 선택', quickSelectDesc: '조리 화면에서 레시피를 바로 고릅니다',
      quickSelectDescV15: '대기 화면에서 레시피를 바로 고릅니다',   // v15: 조리 → 대기 화면
      standbyScreen: '대기 화면', quickSelectOn: '레시피 버튼', quickSelectOff: '게이지',   // v15: 빠른 레시피 선택 as its own section, a name per mode
      close: '닫기', back: '뒤로',
      // recipe page (app/routes/recipe/*, features/recipe/*; locales/ko.json recipe.*)
      reorder: '순서 변경', create: '레시피 추가', noSavedRecipes: '저장된 레시피가 없습니다.',
      saveGrillSettingsDescription: '그릴 온도와 조리 시간 등을 레시피로 저장해\n손쉽게 조리를 시작할 수 있습니다.',
      createRecipe: '레시피 생성', cookOptionCount: (n) => '조리 설정 ' + n, m: '분', s: '초',
      griddlePreheatTemp: '그리들 예열 온도', upperGrill: '상판 그리들', lowerGrill: '하판 그리들',
      pressCookingSetup: '압착 조리 설정', pressThickness: '압착 두께', cookingTime: '조리 시간',
      cheeseMeltOption: '치즈 가열 옵션', heatingTime: '가열 시간', disabled: '사용하지 않음',
      autoUnloadSetting: '배출 기본 설정', autoUnloadStateOn: '배출 켬', autoUnloadStateOff: '배출 끔',
      // v15 recipe detail: short row labels under their section's title
      rdSetup: '조리 설정', rdCookTime: '조리 시간', rdStagePreheat: '예열', rdStagePress: '압착 조리', rdStageFinish: '마무리', rdTime: '시간', rdCheeseShort: '치즈', rdUpper: '상판', rdLower: '하판', rdThickness: '두께', rdFinish: '마무리', rdCheese: '치즈 가열', rdUnload: '배출', rdOn: '켬', rdOff: '끔', rdNone: '없음',
      recipeOptions: '레시피 옵션', editRecipeAction: '레시피 수정', deleteRecipeAction: '레시피 삭제',
      // create / reorder (locales/ko.json recipe.*, common.*)
      done: '변경 완료', reOrder2: '순서 변경하기', reorderEdit: '순서 편집', orderUpdated: '순서를 변경했습니다',
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
      foodDetectionDescV15: 'Camera finds food to unload',   // one line in the card (309 of 360)
      quickSelect: 'Quick recipe select', quickSelectDesc: 'Pick recipes on the cook screen',
      quickSelectDescV15: 'Pick recipes on standby',   // one line in the card
      standbyScreen: 'Standby screen', quickSelectOn: 'Recipe buttons', quickSelectOff: 'Gauge',
      close: 'Close', back: 'Back',
      reorder: 'Reorder', create: 'Create', noSavedRecipes: 'No saved recipes',
      saveGrillSettingsDescription: 'Save grill settings as a recipe\nto start cooking right away.',
      createRecipe: 'Create recipe', cookOptionCount: (n) => n + ' setups', m: 'm', s: 's',
      griddlePreheatTemp: 'Temperature setting', upperGrill: 'Upper griddle', lowerGrill: 'Lower griddle',
      pressCookingSetup: 'Press cooking', pressThickness: 'Thickness', cookingTime: 'Cooking time',
      cheeseMeltOption: 'Cheese melting', heatingTime: 'Heating time', disabled: 'Disabled',
      autoUnloadSetting: 'Unload setting', autoUnloadStateOn: 'On', autoUnloadStateOff: 'Off',
      rdSetup: 'Cooking setup', rdCookTime: 'Cook time', rdStagePreheat: 'Preheat', rdStagePress: 'Press', rdStageFinish: 'Finish', rdTime: 'Time', rdCheeseShort: 'Cheese', rdUpper: 'Upper', rdLower: 'Lower', rdThickness: 'Thickness', rdFinish: 'Finishing', rdCheese: 'Cheese melt', rdUnload: 'Unload', rdOn: 'On', rdOff: 'Off', rdNone: 'None',
      recipeOptions: 'Recipe options', editRecipeAction: 'Edit recipe', deleteRecipeAction: 'Delete recipe',
      done: 'Done', reOrder2: 'Reorder', reorderEdit: 'Edit order', orderUpdated: 'Order updated',
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
    x: '<svg data-icon="x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    // v14: close as "←|" (arrow into a vertical line), pointing back where the menu folds away
    arrowLeftToLine: '<svg data-icon="arrowLeftToLine" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19V5"/><path d="m13 6-6 6 6 6"/><path d="M7 12h14"/></svg>',
    chevronLeft: '<svg data-icon="chevronLeft" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    chevronDown: '<svg data-icon="chevronDown" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    check: '<svg data-icon="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    chevronRight: '<svg data-icon="chevronRight" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
    // lucide ArrowUpDown / Plus / Ellipsis / Pencil / Trash2 (recipe page)
    arrowUpDown: '<svg data-icon="arrowUpDown" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    ellipsis: '<svg data-icon="ellipsis" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
    pencil: '<svg data-icon="pencil" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>',
    trash2: '<svg data-icon="trash2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>',
    menuLines: '<svg data-icon="menuLines" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16"/><path d="M4 18h16"/><path d="M4 6h16"/></svg>',
    // components/ui/icons.tsx circleAlertInverted / checkCircle / errorCircle
    circleAlert: '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="16.25" fill="#E44242"/><path d="M20 13.3333V20.8333" stroke="white" stroke-width="2.5" stroke-linecap="round"/><path d="M20 26.6667H20.0167" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>',
    checkCircle: '<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="16.25" fill="#46CB89"/><path d="M13.75 21.25 17.5 25 26.25 16.25" stroke="#222" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    errorCircle: '<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="16.25" fill="#FF5C5C"/><path d="M14 14L26 26M26 14L14 26" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>',
    // v15's ⋯ menu: drawn for this prototype on the 24 grid (filled). Pencil — eraser cap apart from
    // the body, tip tapering to a rounded point, at 45°. Trash — lid with a handle, body narrowing
    // a little with rounded foot corners, two slots cut out (evenodd).
    pencilFill: '<svg data-icon="pencilFill" viewBox="0 0 24 24" fill="currentColor"><g transform="rotate(45 12 12)"><rect x="9.25" y="1.6" width="5.5" height="3.3" rx="1.35"/><path d="M9.25 6.35h5.5v9.2l-2.06 5.08a.75.75 0 0 1-1.38 0L9.25 15.55Z"/></g></svg>',
    trashFill: '<svg data-icon="trashFill" viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd"><path d="M9.1 4.6V3.95c0-.8.65-1.45 1.45-1.45h2.9c.8 0 1.45.65 1.45 1.45v.65h4.35a1.15 1.15 0 0 1 0 2.3H4.75a1.15 1.15 0 0 1 0-2.3Zm1.9 0h2v-.3h-2Z"/><path d="M5.55 8.55h12.9l-.9 11.05a2.5 2.5 0 0 1-2.49 2.3H8.94a2.5 2.5 0 0 1-2.49-2.3ZM9.6 11.5a.8.8 0 0 0-.8.8v5.6a.8.8 0 0 0 1.6 0v-5.6a.8.8 0 0 0-.8-.8Zm4.8 0a.8.8 0 0 0-.8.8v5.6a.8.8 0 0 0 1.6 0v-5.6a.8.8 0 0 0-.8-.8Z"/></svg>',
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

  // The standby tick ring in the 빠른 레시피 선택 miniature, in the screen's own units (viewBox
  // 600 × 1024): 625 across, centred at (300, 492.5), 40-long ticks (cook-tick-ring.tsx) — every
  // other one of the 150, drawn thicker so they read at 0.17. It fades by angle as the real one
  // (v0 ?from=v14 #tick-ring-box): gone within 60° of 6 o'clock, whole from 150°. Red from 6
  // o'clock round to the left and up (a preheat under way), the rest the empty ticks' white.
  let qsRingSvg = null;
  function quickSelectRing() {
    if (qsRingSvg) return qsRingSvg;
    const N = 75, cx = 300, cy = 492.5, R = 312.5, LEN = 40, W = 8;
    let ticks = '';
    for (let i = 0; i < N; i++) {
      const deg = (360 * i) / N;   // 0 = 6 o'clock, clockwise
      const d = Math.min(deg, 360 - deg);
      const a = Math.max(0, Math.min(1, (d - 60) / 90));
      if (!a) continue;
      const red = deg < 120;
      ticks += `<rect x="${cx - W / 2}" y="${cy - R}" width="${W}" height="${LEN}" rx="${W / 2}" fill="${red ? '#e74646' : '#fff'}" fill-opacity="${+(a * (red ? 1 : 0.4)).toFixed(3)}" transform="rotate(${180 + deg} ${cx} ${cy})"/>`;
    }
    qsRingSvg = `<svg class="qs-svg" viewBox="0 0 600 1024" preserveAspectRatio="none" aria-hidden="true">${ticks}</svg>`;
    return qsRingSvg;
  }

  function renderSetting() { withMorph(setting, renderSettingNow); }
  // v15: the page is rebuilt on every change (innerHTML), which put its scroll box back at the top —
  // a toggle or card near the bottom jumped the page up. The scroll position carries over.
  const settingScroller = () => setting.querySelector('.overflow-y-auto');
  function renderSettingNow() {
    const keep = animatesFields() ? (settingScroller()?.scrollTop || 0) : 0;
    renderSettingBody();
    if (keep) { const sc = settingScroller(); if (sc) sc.scrollTop = keep; }
  }
  function renderSettingBody() {
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
    // v15: 빠른 레시피 선택 as its own section, 대기 화면, with two radio cards — 게이지 · 레시피 버튼 (as
    // iOS's 화면 모드 → 라이트 / 다크): thumbnail and name; the picked card is highlighted by a scrim
    // (.qs-bg, the settings switch's #3a3a3a) that slides across when the other is picked; no radio.
    // Each draws the standby screen it
    // gives in miniature, from the real screens' coordinates (600 × 1024 → 104 wide) — 끔: the recipe
    // name inside the tick ring with the three actions under it; 켬: the name up top and the recipe
    // grid. Only what differs is drawn bright; ☰ · 그릴 | 마감 청소 · 온도 · 조리 시작 stay faint.
    const quickSelectRow = () => {
      const S = 104 / 600;
      const u = (v) => +(v * S).toFixed(2) + 'px';
      const box = (cls, x, y, w, h, r = 0) => `<i class="${cls}" style="left:${u(x)};top:${u(y)};width:${u(w)};height:${u(h)};border-radius:${u(r)}"></i>`;
      const text = (cls, x, y, w, h) => box(cls, x, y + h * 0.24, w, h * 0.52, h);   // a line of text → a bar half its line tall
      const chrome = box('qs-faint', 40, 46, 40, 28, 4) + box('qs-faint', 160, 26, 280, 64, 16) + box('qs-faint', 520, 46, 40, 28, 4) +
        box('qs-faint', 28, 892, 544, 80, 40);
      const ring = quickSelectRing();
      const off = ring + chrome + text('qs-dim', 259, 390, 82, 36) + text('qs-bright', 177, 434, 247, 65) + text('qs-dim', 182, 553, 236, 36) +
        [67, 268, 469].map((x) => box('qs-icon', x + 8, 736, 48, 48, 12)).join('') +
        [[44, 110], [254, 91], [457, 89]].map(([x, w]) => text('qs-dim', x, 804, w, 31)).join('');
      const keys = [[40, 324], [306, 324], [40, 436], [306, 436], [40, 548], [306, 548]];
      const grid = box('qs-faint', 40, 812, 520, 160, 28) + chrome + text('qs-bright', 63, 172, 183, 48) + text('qs-dim', 63, 228, 119, 32) +
        keys.map(([x, y], i) => box(i === 0 ? 'qs-key is-sel' : 'qs-key', x, y, 254, 100, 20)).join('') + text('qs-dim', 275, 680, 51, 33);
      const opt = (value, labelKey, thumb) => {
        const sel = settings.quickSelect === value;
        return `
                <button type="button" role="radio" aria-checked="${sel}" data-quick-select="${value ? 'on' : 'off'}" class="qs-option${sel ? ' is-on' : ''}">
                  ${sel ? '<span class="qs-bg" aria-hidden="true"></span>' : ''}
                  <span class="qs-thumb" aria-hidden="true">${thumb}</span>
                  <span class="qs-label type-body2 transition-opacity">${t(labelKey)}</span>
                </button>`;
      };
      return `
              <div data-quick-select-row class="qs-options" role="radiogroup" aria-label="${t('standbyScreen')}">
                ${opt(false, 'quickSelectOff', off)}
                ${opt(true, 'quickSelectOn', grid)}
              </div>`;
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
            ${animatesFields() ? `<section>
              <h2 class="type-body3 pl-10 text-white/70">${t('standbyScreen')}</h2>
              ${quickSelectRow()}
            </section>` : ''}
            <section>
              <h2 class="type-body3 pl-10 text-white/70">${t('otherFeatures')}</h2>
              ${toggleRow('foodDetection', 'foodDetection', animatesFields() ? 'foodDetectionDescV15' : 'foodDetectionDesc')}
              ${animatesFields() ? '' : toggleRow('quickSelect', 'quickSelect', 'quickSelectDesc')}
            </section>
          </main>
        </div>
      </div>`;
  }

  // v14 (and v0 reached from it) closes with ←| instead of ✕
  function closeIcon() {
    const h = document.documentElement;
    return (h.dataset.variant === 'v14' || h.dataset.variant === 'v15') || h.dataset.from === 'v14' ? ICON.arrowLeftToLine : ICON.x;
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
            <button type="button" data-recipe-action="edit" class="proto-icon-8 flex w-full items-center gap-3 px-10 py-6 active:bg-white/5"><span class="text-white">${animatesFields() ? ICON.pencilFill : ICON.pencil}</span><span class="type-body2 whitespace-nowrap text-white">${t('editRecipeAction')}</span></button>
            <button type="button" data-recipe-action="delete" class="proto-icon-8 flex w-full items-center gap-3 px-10 py-6 active:bg-white/5"><span class="text-[#ff2222]">${animatesFields() ? ICON.trashFill : ICON.trash2}</span><span class="type-body2 whitespace-nowrap text-[#ff2222]">${t('deleteRecipeAction')}</span></button>
          </div>` : '';
    // v15: the settings page's grammar — a title over a white/8 box per section, label | value rows
    // split by inset hairlines — in three sections (치즈 and 배출 share 마무리), with short labels the
    // section title already explains (상판 · 하판, 두께 · 조리 시간). Several cook options: chips that
    // scroll sideways (the next one shows half) instead of underline tabs.
    if (animatesFields()) {
      const vrow = (label, value) => `<div class="rd-row"><span class="type-body2 text-white/70">${label}</span><span class="type-body2 text-white">${value}</span></div>`;
      const vsection = (title, rows) => `<section><h2 class="type-body3 text-white/70">${title}</h2><div class="rd-box">${rows}</div></section>`;
      const multi = r.cookOptions.length > 1;
      // (dev bar "옵션: 카드", the default) one block of text per cook setup, every setup shown — no
      // picking, no box, no lines: whitespace alone. One setup: the lines without a name; several: named
      // and stacked. One line per
      // stage in the order the grill runs it — 예열 → 압착 조리 → 마무리 — so it reads top to bottom:
      // the stage on the left (white/45), its values to the right (white, each after a white/45 word),
      // all 24 — one size; the order, colour and the lines carry the weight. Only the name is 28. The stage, first and second
      // value each keep a column (subgrid), the same on every card, so the stack also compares down.
      if (optionPicker() === 'cards') {
        const v = (label, value) => `<span class="rd-v type-body3">${label ? `<span class="rd-k">${label}</span>` : ''}${value}</span>`;
        const line = (stage, a, b) => `<div class="rd-line"><span class="rd-stage type-body3">${stage}</span>${a}${b}</div>`;
        // each setup is anchored by its number in the list's 80 gutter: the recipe's list number, then
        // the setup's — 5-1, 5-2 … (a lone setup too: 2-1)
        const recipeNo = recipes().indexOf(r) + 1;
        const card = (o, i) => `
              <section class="rd-card">
                <span class="rd-num type-body3" aria-hidden="true">${recipeNo}-${i + 1}</span>
                ${multi ? `<h2 class="rd-card-name type-body2">${esc(o.name)}</h2>` : ''}
                <div class="rd-lines">
                  ${line(t('rdStagePreheat'), v(t('rdUpper'), fmtUnit(o.top, settings.temperatureUnit)), v(t('rdLower'), fmtUnit(o.bot, settings.temperatureUnit)))}
                  ${line(t('rdStagePress'), v('', fmtTime(o.cookingSec)), v(t('rdThickness'), fmtUnit(o.thickness, settings.lengthUnit)))}   <!-- 2분 30초 reads as time on its own: no word -->
                  ${line(t('rdStageFinish'), v(t('rdCheeseShort'), o.meltingSec > 0 ? fmtTime(o.meltingSec) : t('rdNone')), v(t('rdUnload'), o.withoutArm ? t('rdOff') : t('rdOn')))}
                </div>
              </section>`;
        return `
      <div class="relative h-full bg-black">
        <div class="flex h-full flex-col overflow-hidden">
          ${pageHeader('data-recipe-back', r.name, kebab)}
          <main class="rd-main min-h-0 flex-1 overflow-auto">
            <div class="rd-cards">${r.cookOptions.map(card).join('')}</div>
          </main>
        </div>
        ${popover}
      </div>`;
      }
      // the row scrolls under two black gradients that show where chips are hidden (updateChipFades)
      // or (dev bar "옵션: 드롭다운") a dropdown field — 조리 설정 | 레어 ⌄ — whose list opens over it
      const dropdown = multi && optionPicker() === 'dropdown' ? `
            <div class="rd-pick">
              <button type="button" data-recipe-option-open class="rd-select" aria-haspopup="listbox" aria-expanded="${!!recipeView.optionMenu}">
                <span class="type-body2 text-white/70">${t('rdSetup')}</span>
                <span class="rd-select-value"><span class="type-body2 text-white">${esc(opt.name)}</span>${ICON.chevronDown}</span>
              </button>
              ${recipeView.optionMenu ? `
              <div class="rd-opt-menu" role="listbox" aria-label="${t('rdSetup')}">
                ${r.cookOptions.map((o) => `<button type="button" role="option" aria-selected="${o.id === opt.id}" data-recipe-option="${o.id}" class="rd-opt-item${o.id === opt.id ? ' is-on' : ''}"><span class="type-body2">${esc(o.name)}</span>${o.id === opt.id ? ICON.check : ''}</button>`).join('')}
              </div>` : ''}
            </div>` : '';
      const chips = multi && optionPicker() === 'chips' ? `
            <div class="rd-chips-wrap">
              <div class="rd-chips" data-keep-scroll-x="chips" role="tablist">
                ${r.cookOptions.map((o) => `<button type="button" role="tab" aria-selected="${o.id === opt.id}" data-recipe-option="${o.id}" class="rd-chip type-body2${o.id === opt.id ? ' is-on' : ''}">${o.id === opt.id ? '<span class="rd-chip-bg" aria-hidden="true"></span>' : ''}<span class="rd-chip-label transition-opacity">${esc(o.name)}</span></button>`).join('')}
              </div>
              <i class="rd-fade is-left" aria-hidden="true"></i><i class="rd-fade is-right" aria-hidden="true"></i>
            </div>` : '';
      return `
      <div class="relative h-full bg-black">
        <div class="flex h-full flex-col overflow-hidden">
          ${pageHeader('data-recipe-back', r.name, kebab)}
          <main class="rd-main min-h-0 flex-1 overflow-auto">
            ${chips}${dropdown}
            <div class="rd-sections">
              ${vsection(t('griddlePreheatTemp'), vrow(t('rdUpper'), fmtUnit(opt.top, settings.temperatureUnit)) + vrow(t('rdLower'), fmtUnit(opt.bot, settings.temperatureUnit)))}
              ${vsection(t('pressCooking'), vrow(t('rdThickness'), fmtUnit(opt.thickness, settings.lengthUnit)) + vrow(t('cookingTime'), fmtTime(opt.cookingSec)))}
              ${vsection(t('rdFinish'), vrow(t('rdCheese'), opt.meltingSec > 0 ? fmtTime(opt.meltingSec) : t('disabled')) + vrow(t('rdUnload'), opt.withoutArm ? t('rdOff') : t('rdOn')))}
            </div>
          </main>
        </div>
        ${recipeView.optionMenu && dropdown ? '<div class="rd-opt-dim" data-recipe-option-close></div>' : ''}
        ${popover}
      </div>`;
    }
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

  // The form is re-rendered as a whole (innerHTML) on every focus / keystroke, so a field's label
  // would jump to its new place. In v15 (the app's motion: top · size · chip, 200ms) each field that
  // changed state starts one frame in its old state and then transitions. Other variants: as before.
  const animatesFields = () => {
    const h = document.documentElement;
    return h.dataset.variant === 'v15' || h.dataset.fromVariant === 'v15';
  };
  // Pages re-render with innerHTML, so the app's CSS transitions (switch thumb / track, the
  // segmented switch's slide and labels: 200ms) never play. In v15: snapshot the elements that
  // carry a transition-* class before a render and, after it, animate the ones whose look changed
  // from the old value to the new one. Matched by order, only when the structure is the same.
  const MORPH_PROPS = ['translate', 'transform', 'backgroundColor', 'opacity'];   // Tailwind v4 moves with `translate`
  const morphEls = (root) => [...root.querySelectorAll('[class*="transition-"]')];
  function morphSnapshot(root) {
    return morphEls(root).map((el) => { const cs = getComputedStyle(el); return Object.fromEntries(MORPH_PROPS.map((k) => [k, cs[k]])); });
  }
  function morphPlay(root, before) {
    const els = morphEls(root);
    if (els.length !== before.length) return;
    els.forEach((el, i) => {
      const cs = getComputedStyle(el), from = {}, to = {};
      MORPH_PROPS.forEach((k) => { if (cs[k] !== before[i][k]) { from[k] = before[i][k]; to[k] = cs[k]; } });
      if (Object.keys(from).length) el.animate([from, to], { duration: 200, easing: 'ease-out' });
    });
  }
  let skipMorph = false;   // a render that must not animate (e.g. right after a drop)
  function withMorph(root, render) {
    if (!animatesFields() || skipMorph) { render(); return; }
    const before = morphSnapshot(root);
    render();
    morphPlay(root, before);
  }

  // Last known state per field and, for fields that just changed, when and from what. A field
  // re-rendered mid-transition (one tap can render twice) resumes it with a negative delay.
  const FIELD_MS = 200;
  const fieldLast = new Map();   // key → { raised, focused }
  const fieldAnim = new Map();   // key → { start, raisedFrom?, focusedFrom? }
  function readField(el) {
    return { raised: el.classList.contains('has-value') || el.classList.contains('is-focused'), focused: el.classList.contains('is-focused') };
  }
  function animateFields() {
    const now = performance.now();
    const seen = new Set();
    rpBody.querySelectorAll('.pi[data-kb-field]').forEach((el) => {
      const key = el.dataset.kbField;
      seen.add(key);
      const cur = readField(el);
      const was = fieldLast.get(key);
      fieldLast.set(key, cur);
      let a = fieldAnim.get(key);
      if (a && now - a.start >= FIELD_MS) { fieldAnim.delete(key); a = null; }
      if (was && (was.raised !== cur.raised || was.focused !== cur.focused)) {
        a = { start: now,
              raisedFrom: was.raised !== cur.raised ? was.raised : undefined,
              focusedFrom: was.focused !== cur.focused ? was.focused : undefined };
        fieldAnim.set(key, a);
      }
      if (!a) return;
      // Web Animations from the old look to the new one (the app's motion: 200ms, ease .25,.1,.25,1).
      // A negative delay resumes a transition the previous render started.
      const opts = { duration: FIELD_MS, delay: -(now - a.start), easing: 'cubic-bezier(.25,.1,.25,1)', fill: 'backwards' };
      if (a.raisedFrom !== undefined && a.raisedFrom !== cur.raised) {
        const chip = el.style.getPropertyValue('--lbl-bg') || '#000';
        const RAISED = { top: '-12px', fontSize: '24px', lineHeight: '100%', backgroundColor: chip };
        const REST = { top: '23px', fontSize: '28px', lineHeight: '150%', backgroundColor: 'rgba(0,0,0,0)' };
        el.querySelector('.pi-label').animate(a.raisedFrom ? [RAISED, REST] : [REST, RAISED], opts);
      }
      if (a.focusedFrom !== undefined && a.focusedFrom !== cur.focused && !el.classList.contains('is-error')) {
        const ON = { borderColor: 'rgb(255 255 255 / 70%)' }, OFF = { borderColor: 'rgb(255 255 255 / 30%)' };
        el.querySelector('.pi-box').animate(a.focusedFrom ? [ON, OFF] : [OFF, ON], { ...opts, duration: 150 });
      }
    });
    for (const k of [...fieldLast.keys()]) if (!seen.has(k)) { fieldLast.delete(k); fieldAnim.delete(k); }
  }
  // v15: list ↔ detail. The page's black stays and ‹ stays put. What moves:
  //  · the title beside ‹ — the old one fades out where it was, the new one slides in 8 (from the
  //    right going in, from the left coming back) while fading in;
  //  · the body under the header — slides in 8 the same way;
  //  · the header's right side — going in, 순서 변경's label fades and its ↑↓ slides over to ⋯ while
  //    shrinking (0.6) and fading; ⋯ then grows in (0.6 → 1). Coming back is the reverse.
  // The header is re-rendered, so the old pieces are cloned as ghosts over the new header.
  // Other variants: no motion, as before.
  const NAV_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
  function headerParts() {
    const header = rpBody.querySelector('header');
    if (!header) return null;
    return {
      header,
      title: [header.querySelector('[data-recipe-back] .type-body1')].find((el) => el && el.offsetWidth) || null,   // a hidden title (v15 list) has nothing to animate
      right: header.querySelector(':scope > button:not([data-recipe-back])'),
    };
  }
  function navRecipe(dir, mutate) {
    const motion = animatesFields() && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const old = motion ? headerParts() : null;
    const scale = document.getElementById('device').getBoundingClientRect().width / 600 || 1;
    const snap = (el) => el && { el: el.cloneNode(true), rect: el.getBoundingClientRect() };
    // the body under the header too, with its scroll offsets, so the outgoing copy looks as it was
    const snapBody = (el) => {
      const s = snap(el);
      s.scrolls = [el, ...el.querySelectorAll('*')].map((n) => n.scrollTop);
      return s;
    };
    const before = old && {
      title: snap(old.title), rightBox: snap(old.right && old.right.firstElementChild),
      body: [...old.header.parentElement.children].filter((el) => el !== old.header).map(snapBody),
    };
    mutate();
    renderRecipe();
    if (!before) return;
    const now = headerParts();
    if (!now) return;
    const hr = now.header.getBoundingClientRect();
    const place = (s) => {
      const g = s.el;
      g.style.cssText += `;position:absolute;margin:0;pointer-events:none;left:${(s.rect.left - hr.left) / scale}px;top:${(s.rect.top - hr.top) / scale}px;width:${s.rect.width / scale}px;height:${s.rect.height / scale}px`;
      now.header.appendChild(g);
      return g;
    };
    const sx = dir === 'in' ? 8 : -8;
    // title: old fades out in place, new slides in
    // the title copy: no padding / clipping of its own, so it never shows … while it fades
    if (before.title) { const g = place(before.title); g.style.padding = '0'; g.style.overflow = 'visible'; g.style.textOverflow = 'clip'; g.style.width = 'max-content'; g.style.maxWidth = 'none'; g.style.whiteSpace = 'nowrap'; }
    if (before.title) before.title.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'ease-out', fill: 'forwards' }).finished.then(() => before.title.el.remove());
    if (now.title) now.title.animate([{ opacity: 0, transform: `translateX(${sx}px)` }, { opacity: 1, transform: 'none' }], { duration: 220, easing: NAV_EASE, fill: 'backwards' });
    // body under the header: the old one drifts 8 the other way and fades (160ms), over the new
    const box = now.header.parentElement;
    if (getComputedStyle(box).position === 'static') box.style.position = 'relative';
    const br = box.getBoundingClientRect();
    before.body.forEach((s) => {
      const g = s.el;
      g.style.cssText += `;position:absolute;margin:0;pointer-events:none;z-index:1;left:${(s.rect.left - br.left) / scale}px;top:${(s.rect.top - br.top) / scale}px;width:${s.rect.width / scale}px;height:${s.rect.height / scale}px`;
      box.appendChild(g);
      [g, ...g.querySelectorAll('*')].forEach((n, i) => { if (s.scrolls[i]) n.scrollTop = s.scrolls[i]; });
      g.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-sx}px)` }], { duration: 160, easing: 'ease-out', fill: 'forwards' })
        .finished.then(() => g.remove());
    });
    [...now.header.parentElement.children].filter((el) => !before.body.some((s) => s.el === el)).filter((el) => el !== now.header).forEach((el) =>
      el.animate([{ opacity: 0, transform: `translateX(${sx}px)` }, { opacity: 1, transform: 'none' }], { duration: 220, easing: NAV_EASE, fill: 'backwards' }));
    // right side: 순서 변경 (icon + label) ↔ ⋯
    const newBox = now.right && now.right.firstElementChild;
    if (!before.rightBox || !newBox) return;
    // 순서 변경 ↔ ⋯, kept simple: the outgoing one (icon + label together) shrinks a little and fades,
    // the incoming one grows from 0.85 while fading in. `scale` (not transform) keeps the boxes'
    // translate offset intact.
    const OUT = { duration: 120, easing: 'ease-out', fill: 'forwards' };
    // coming back (⋯ → 순서 변경) runs quicker: 순서 변경 is the wider of the two, so the same timing read as slow
    const IN = dir === 'in' ? { duration: 160, delay: 60, easing: NAV_EASE, fill: 'backwards' } : { duration: 120, delay: 20, easing: NAV_EASE, fill: 'backwards' };
    const ghost = place(before.rightBox);
    ghost.style.background = 'transparent';
    ghost.animate([{ opacity: 1, scale: 1 }, { opacity: 0, scale: 0.85 }], OUT).finished.then(() => ghost.remove());
    newBox.animate([{ opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1 }], IN);
  }
  // ⋯ popover close. v15 lets it fade out first (.is-closing on the dim and panel, 120ms in CSS);
  // other variants remove it at once, as before.
  let popoverClosing = false;
  function closePopover() {
    if (!recipeView.popover || popoverClosing) return;
    const done = () => { popoverClosing = false; recipeView.popover = false; renderRecipe(); };
    const dim = rpBody.querySelector('[data-recipe-popover-close]');
    if (!animatesFields() || !dim) { done(); return; }
    popoverClosing = true;
    dim.classList.add('is-closing');
    dim.nextElementSibling && dim.nextElementSibling.classList.add('is-closing');
    setTimeout(done, 120);
  }
  // v15 recipe detail dropdown: the list fades out (120ms), then the picked option (if any) shows
  let optionMenuClosing = false;
  function closeOptionMenu(pick) {
    if (!recipeView.optionMenu || optionMenuClosing) return;
    const done = () => { optionMenuClosing = false; recipeView.optionMenu = false; if (pick != null) recipeView.optionId = pick; renderRecipe(); };
    const parts = rpBody.querySelectorAll('.rd-opt-dim, .rd-opt-menu');
    if (!parts.length || matchMedia('(prefers-reduced-motion: reduce)').matches) { done(); return; }
    optionMenuClosing = true;
    parts.forEach((el) => el.classList.add('is-closing'));
    setTimeout(done, 120);
  }
  // proto-only: how the detail shows its cook setups — 'cards' (default: every setup as a card),
  // 'dropdown' or 'chips' (pick one) — switched from the dev bar
  const OPTION_PICKERS = ['cards', 'dropdown', 'chips'];
  function optionPicker() {
    try { const v = localStorage.getItem('proto:optionPicker'); return OPTION_PICKERS.includes(v) ? v : 'cards'; } catch (e) { return 'cards'; }
  }
  function renderRecipe() {
    withMorph(rpBody, renderRecipeNow);
    if (animatesFields()) animateFields();
  }
  // v15: each render rebuilds the page's scrolling <main>, which used to land back at the top — a
  // drop in 순서 편집 jumped the list up. The same list (list ↔ 순서 편집) or the same recipe keeps
  // its scroll; another page (list → detail, back, a fresh open) starts at the top as before.
  let lastScrollKey = null;
  const CHIP_FADE = 96;   // the chip row's edge gradients (proto.css .rd-fade)
  const CHIP_BG_OUT = 3;   // v15 recipe detail: the picked chip's background reaches 3 past the chip each side (proto.css .rd-chip-bg)
  function renderRecipeNow() {
    if (!animatesFields() || recipeView.mode === 'create') { lastScrollKey = null; renderRecipeBody(); return; }
    const key = recipeView.id != null && recipeView.mode !== 'reorder' ? 'detail:' + recipeView.id : 'list';
    const main = rpBody.querySelector('main');
    const same = key === lastScrollKey;
    const keep = same && main ? main.scrollTop : 0;
    const keepX = same ? [...rpBody.querySelectorAll('[data-keep-scroll-x]')].map((el) => [el.dataset.keepScrollX, el.scrollLeft]) : [];
    const wasOn = same && rpBody.querySelector('.rd-chip.is-on');
    const oldBg = wasOn ? [wasOn.offsetLeft - CHIP_BG_OUT, wasOn.offsetWidth + 2 * CHIP_BG_OUT] : null;   // in the row's own px
    renderRecipeBody();
    lastScrollKey = key;
    const next = keep && rpBody.querySelector('main');
    if (next) next.scrollTop = keep;
    keepX.forEach(([name, x]) => { const el = rpBody.querySelector(`[data-keep-scroll-x="${name}"]`); if (el) el.scrollLeft = x; });
    // the picked cook-option chip slides into view if it was cut off or under a gradient
    const row = rpBody.querySelector('.rd-chips'), on = row && row.querySelector('.is-on');
    if (row) updateChipFades(row, true);
    // the picked chip's background slides (and resizes) from the chip it was on
    if (on && oldBg && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const nx = on.offsetLeft, nw = on.offsetWidth;
      const l0 = oldBg[0] - nx, r0 = nw - (oldBg[0] + oldBg[1] - nx);
      if (Math.abs(l0 + CHIP_BG_OUT) > 0.5 || Math.abs(r0 + CHIP_BG_OUT) > 0.5) {
        on.querySelector('.rd-chip-bg').animate(
          [{ left: l0 + 'px', right: r0 + 'px' }, { left: -CHIP_BG_OUT + 'px', right: -CHIP_BG_OUT + 'px' }],
          { duration: 260, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
      }
    }
    // ... and the row slides on until that background is clear of the edge gradient (96) — at either
    // end of the row the gradient is gone, so the first / last chip just goes to the end
    if (on) {
      const edge = CHIP_FADE + CHIP_BG_OUT, max = row.scrollWidth - row.clientWidth;
      const left = Math.max(0, on.offsetLeft - edge), right = Math.min(max, on.offsetLeft + on.offsetWidth + edge - row.clientWidth);
      if (row.scrollLeft > left) row.scrollTo({ left, behavior: 'smooth' });
      else if (row.scrollLeft < right) row.scrollTo({ left: right, behavior: 'smooth' });
    }
  }
  // v15 recipe detail: a black gradient over each end of the chip row while chips are hidden past it
  // (right: more to come; left: scrolled past some). Set at once on a render, faded (160ms) on scroll.
  function updateChipFades(row, instant) {
    const wrap = row.parentElement, max = row.scrollWidth - row.clientWidth;
    if (instant) wrap.classList.add('no-fade-anim');
    wrap.classList.toggle('fade-left', row.scrollLeft > 1);
    wrap.classList.toggle('fade-right', row.scrollLeft < max - 1);
    if (instant) { void wrap.offsetWidth; wrap.classList.remove('no-fade-anim'); }
  }
  rpBody.addEventListener('scroll', (e) => {
    if (e.target.classList && e.target.classList.contains('rd-chips')) updateChipFades(e.target);
  }, true);   // scroll doesn't bubble: listen in the capture phase
  // Prototype: a mouse drags the chip row sideways as a finger does on the device (touch, a trackpad
  // and Shift + wheel already scroll it). Past 5px it's a drag, and the click that ends it doesn't pick a chip.
  let chipDrag = null, chipDragged = false;
  rpBody.addEventListener('pointerdown', (e) => {
    const row = e.target.closest('.rd-chips');
    if (!row || e.pointerType !== 'mouse' || e.button !== 0) return;
    chipDrag = { row, x0: e.clientX, left0: row.scrollLeft, k: row.getBoundingClientRect().width / row.offsetWidth || 1, moved: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!chipDrag) return;
    const dx = e.clientX - chipDrag.x0;
    if (!chipDrag.moved && Math.abs(dx) < 5) return;
    chipDrag.moved = true;
    e.preventDefault();
    chipDrag.row.scrollLeft = chipDrag.left0 - dx / chipDrag.k;   // the device is drawn scaled: screen px → row px
  });
  window.addEventListener('pointerup', () => {
    if (!chipDrag) return;
    chipDragged = chipDrag.moved;
    chipDrag = null;
    setTimeout(() => { chipDragged = false; }, 0);
  });
  rpBody.addEventListener('click', (e) => {
    if (chipDragged && e.target.closest('.rd-chips')) { e.stopPropagation(); e.preventDefault(); chipDragged = false; }
  }, true);
  function renderRecipeBody() {
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
  // v15: reordering happens in place on the list — same header (‹ stays, "순서 편집" in the centre),
  // the same rows with a drag handle where › was, no 레시피 추가 and no 변경 완료: ‹ saves.
  function renderReorderInline() {
    const byId = new Map(recipes().map((r) => [r.id, r]));
    const rows = reorder.order.map((id, i) => recipeItem(byId.get(id), i)
      .replace(/<button type="button" data-recipe-open="[^"]*" class="/, `<div data-drag-row="${i}" style="touch-action:none" class="select-none `)
      .replace(/<\/button>\s*$/, '</div>')
      .replace(`<div class="proto-icon-10 flex size-10 shrink-0 items-center text-white">${ICON.chevronRight}</div>`,
               `<div class="proto-icon-10 flex size-10 shrink-0 items-center text-white/70">${ICON.menuLines}</div>`)).join('');
    const header = pageHeader('data-recipe-back', '', '').replace(/<\/header>\s*$/,
      `  <h3 data-reorder-title class="type-body2 absolute top-1/2 left-1/2 max-w-[calc(100%-8rem)] -translate-x-1/2 -translate-y-1/2 truncate text-center text-white">${t('reorderEdit')}</h3>\n          </header>`);
    return `
      <div class="relative h-full bg-black">
        <div class="flex h-full flex-col overflow-hidden">
          ${header}
          <main class="flex h-full flex-col overflow-y-auto py-7">
            <div class="flex flex-col" data-drag-list="recipes">${rows}</div>
          </main>
        </div>
      </div>`;
  }
  function renderReorder() {
    if (animatesFields()) return renderReorderInline();
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
    let dy = (e.clientY - drag.y0) / drag.scale;
    if (!drag.active) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 5) { clearTimeout(drag.timer); drag = null; }
      return;
    }
    e.preventDefault();
    // v15: the dragged row can't leave the list — no higher than the first slot, no lower than the last
    if (animatesFields()) dy = Math.max(-drag.from * drag.pitch, Math.min((drag.rows.length - 1 - drag.from) * drag.pitch, dy));
    drag.row.style.transform = `translateY(${dy}px)`;
    // v15: a neighbour gives way once the dragged row's leading edge overlaps it by a quarter of a row
    // (edges meeting), not when the centre line passes the gap (half a row)
    const steps = animatesFields() ? Math.sign(dy) * Math.floor(Math.abs(dy) / drag.pitch + 0.75) : Math.round(dy / drag.pitch);
    drag.to = Math.max(0, Math.min(drag.rows.length - 1, drag.from + steps));
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
    const move = (arr) => { const [x] = arr.splice(d.from, 1); arr.splice(d.to, 0, x); };
    const commit = () => {
      if (d.to !== d.from) {
        if (d.list.dataset.dragList === 'recipes') move(reorder.order);
        else { move(form.options); form.dirty = true; }
      }
      renderRecipe();
    };
    if (animatesFields()) {
      // v15: the dropped row settles into its slot from where it was let go (120ms), the others are
      // already in place; the re-render after that is instant — no second, replayed reorder motion
      const from = d.row.style.transform || 'none';
      const toY = (d.to - d.from) * d.pitch;
      d.row.style.transform = `translateY(${toY}px)`;
      d.row.animate([{ transform: from }, { transform: `translateY(${toY}px)` }], { duration: 120, easing: 'cubic-bezier(0.2, 0, 0, 1)' })
        .finished.then(() => { skipMorph = true; commit(); skipMorph = false; });
      return;
    }
    commit();
  });

  function openCreate() {
    kb = null;
    form = { name: '', options: [newOption(1)], editing: null, snapshot: null, touched: new Set(), meltSuppressed: new Set(), dirty: false };
    recipeView.mode = 'create';
    renderRecipe();
  }
  function openReorder() {
    const start = () => {
      const ids = recipes().map((r) => r.id);
      reorder = { order: ids.slice(), original: ids };
      recipeView.mode = 'reorder';
    };
    if (animatesFields()) { morphReorder('in', start); return; }
    start();
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
      if (animatesFields()) {
        // v15: ‹ keeps the new order (no 변경 완료 step) and morphs back to the list
        const changed = reorder.order.join() !== reorder.original.join();
        morphReorder('out', () => { if (changed) applyReorder(); recipeView.mode = null; reorder = null; confirmBox = null; });
        return;   // no toast: the list itself shows the new order
      }
      if (reorder.order.join() !== reorder.original.join()) { confirmBox = { kind: 'leave' }; renderRecipe(); } else leaveMode();
    }
  }
  function applyReorder() {
    const list = recipes();
    const byId = new Map(list.map((r) => [r.id, r]));
    const next = reorder.order.map((id) => byId.get(id));
    list.splice(0, list.length, ...next);
  }
  function submitReorder() {
    applyReorder();
    showToast(t('orderUpdated'));
    leaveMode();
  }

  // v15: list ↔ 순서 편집 in place. The page and the rows stay; what changes moves:
  //  · each row's › and the drag handle cross (out: shrink + fade 140ms; in: grow 0.6 → 1, 80ms later);
  //  · 레시피 추가 slides down out of the screen (and back up on return);
  //  · 순서 변경's label travels to the header's centre while it turns into "순서 편집" (crossfade, 260ms),
  //    its ↑↓ shrinking away; coming back, the title travels back and the ↑↓ grows in.
  function morphReorder(dir, mutate) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { mutate(); renderRecipe(); return; }
    const scale = document.getElementById('device').getBoundingClientRect().width / 600 || 1;
    const q = (s) => rpBody.querySelector(s);
    const trails = () => [...rpBody.querySelectorAll('main :is([data-recipe-open], [data-drag-row]) > div:last-child')];
    const snap = (el) => el && { el: el.cloneNode(true), rect: el.getBoundingClientRect() };
    const old = {
      trails: trails().map(snap),
      fab: snap(q(':scope > div > button[data-recipe-action="create"]')),
      label: snap(q('[data-recipe-action="reorder"] .type-body1') || q('header [data-reorder-title]')),
      icon: snap(q('[data-recipe-action="reorder"] .proto-icon-10')),
    };
    mutate();
    renderRecipe();
    const root = rpBody.firstElementChild;
    if (!root) return;
    const rr = root.getBoundingClientRect();
    const place = (s) => {
      const g = s.el;
      g.style.cssText += `;position:absolute;margin:0;pointer-events:none;z-index:5;left:${(s.rect.left - rr.left) / scale}px;top:${(s.rect.top - rr.top) / scale}px;width:${s.rect.width / scale}px;height:${s.rect.height / scale}px;translate:none`;
      root.appendChild(g);
      return g;
    };
    const gone = (g) => () => g.remove();
    // › ↔ handle
    old.trails.forEach((s) => { const g = place(s); g.animate([{ opacity: 1, scale: 1 }, { opacity: 0, scale: 0.6 }], { duration: 140, easing: 'ease-out', fill: 'forwards' }).finished.then(gone(g)); });
    trails().forEach((el) => el.animate([{ opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1 }], { duration: 200, delay: 80, easing: NAV_EASE, fill: 'backwards' }));
    // 레시피 추가
    if (dir === 'in' && old.fab) {
      const g = place(old.fab);
      g.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(160px)' }], { duration: 240, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' }).finished.then(gone(g));
    }
    const fab = q(':scope > div > button[data-recipe-action="create"]');
    if (dir === 'out' && fab) fab.animate([{ opacity: 0, transform: 'translateY(160px)' }, { opacity: 1, transform: 'none' }], { duration: 280, delay: 60, easing: NAV_EASE, fill: 'backwards' });
    // the label ↔ the centred title
    const label = q('[data-recipe-action="reorder"] .type-body1') || q('header [data-reorder-title]');
    if (old.label && label) {
      const nr = label.getBoundingClientRect();
      const dx = ((old.label.rect.left + old.label.rect.width / 2) - (nr.left + nr.width / 2)) / scale;
      const dy = ((old.label.rect.top + old.label.rect.height / 2) - (nr.top + nr.height / 2)) / scale;
      const g = place(old.label);
      g.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translate(${-dx}px, ${-dy}px)` }], { duration: 260, easing: NAV_EASE, fill: 'forwards' }).finished.then(gone(g));
      label.animate([{ opacity: 0, transform: `translate(${dx}px, ${dy}px)` }, { opacity: 1, transform: 'none' }], { duration: 260, easing: NAV_EASE, fill: 'backwards' });
    }
    // 순서 변경's ↑↓
    if (dir === 'in' && old.icon) {
      const g = place(old.icon);
      g.animate([{ opacity: 1, scale: 1 }, { opacity: 0, scale: 0.6 }], { duration: 140, easing: 'ease-out', fill: 'forwards' }).finished.then(gone(g));
    }
    const icon = q('[data-recipe-action="reorder"] .proto-icon-10');
    if (dir === 'out' && icon) icon.animate([{ opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1 }], { duration: 200, delay: 120, easing: NAV_EASE, fill: 'backwards' });
  }

  // Language changes (dev bar ko/en, or 언어 in settings) re-render whatever is open, so the
  // menu's 레시피 / 설정 / 장비 관리 follow the cook screen's language.
  // cook.js re-sets lang on every render (each 200ms tick), so only an actual change counts —
  // re-rendering on every tick replaced the buttons mid-tap and swallowed clicks.
  // v15: on a language change, each text that changed slides in sideways while fading (8px, 220ms) —
  // from the right going to English (EN sits right on the switch), from the left going to Korean — instead of
  // switching at once. Only leaf text elements are matched (by order, same structure), so the
  // language switch's own slide keeps its motion and nothing else moves.
  function swapTexts(root, render) {
    if (!animatesFields() || matchMedia('(prefers-reduced-motion: reduce)').matches) { render(); return; }
    const leaves = () => [...root.querySelectorAll('*')].filter((el) => !el.children.length && el.textContent.trim() && !el.closest('svg'));
    // the old texts as they look now, so they can fade out where they are (a crossfade, not a cut)
    const before = leaves().map((el) => {
      const cs = getComputedStyle(el);
      const range = document.createRange();
      range.selectNodeContents(el);   // the text itself, not the box: titles carry padding (section titles 68)
      return { text: el.textContent, rect: range.getBoundingClientRect(),
        style: `color:${cs.color};font:${cs.font};letter-spacing:${cs.letterSpacing};text-transform:${cs.textTransform}` };
    });
    render();
    const after = leaves();
    if (after.length !== before.length) return;
    const scale = document.getElementById('device').getBoundingClientRect().width / 600 || 1;
    const host = root.firstElementChild || root;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    const hr = host.getBoundingClientRect();
    const sx = document.documentElement.lang === 'en' ? 6 : -6;
    const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
    after.forEach((el, i) => {
      const b = before[i];
      if (el.textContent === b.text) return;
      const g = document.createElement('span');
      g.textContent = b.text;
      g.style.cssText = `${b.style};position:absolute;margin:0;white-space:nowrap;pointer-events:none;z-index:6;left:${(b.rect.left - hr.left) / scale}px;top:${(b.rect.top - hr.top) / scale}px`;
      host.appendChild(g);
      // a soft crossfade: the old text drifts 4 back and blurs away, the new one slides 6 in and sharpens
      g.animate([{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: `translateX(${-sx * 0.66}px)`, filter: 'blur(2px)' }],
        { duration: 220, easing: 'cubic-bezier(0.4, 0, 0.6, 1)', fill: 'forwards' }).finished.then(() => g.remove());
      el.animate([{ opacity: 0, transform: `translateX(${sx}px)`, filter: 'blur(2px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }],
        { duration: 380, delay: 40, easing: EASE, fill: 'backwards' });   // transform, not translate (centred titles use translate)
    });
  }
  let shownLang = document.documentElement.lang;
  new MutationObserver(() => {
    const now = document.documentElement.lang;
    if (now === shownLang) return;
    shownLang = now;
    if (!menu.hidden) swapTexts(menu, renderMenu);
    if (!setting.hidden) swapTexts(setting, renderSetting);
    if (!recipePage.hidden) swapTexts(rpBody, renderRecipe);
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
  // A variant can animate a page's close: it sets --page-close-ms on the page and styles
  // .is-closing; the page stays shown that long, then hides. Unset → instant, as before.
  const pageCloseTimers = new WeakMap();
  // Likewise --page-open-ms: the page carries .is-opening that long after it is shown, so a variant
  // can animate the page's content on open without replaying it when the page re-renders.
  const pageOpenTimers = new WeakMap();
  function showPage(page) {
    clearTimeout(pageCloseTimers.get(page));
    clearTimeout(pageOpenTimers.get(page));
    page.classList.remove('is-closing');
    page.hidden = false;
    const ms = parseFloat(getComputedStyle(page).getPropertyValue('--page-open-ms')) || 0;
    if (!ms) return;
    page.classList.add('is-opening');
    pageOpenTimers.set(page, setTimeout(() => page.classList.remove('is-opening'), ms));
  }
  function hidePage(page) {
    if (page.hidden || page.classList.contains('is-closing')) return;
    const ms = parseFloat(getComputedStyle(page).getPropertyValue('--page-close-ms')) || 0;
    if (!ms) { page.hidden = true; return; }
    page.classList.add('is-closing');
    pageCloseTimers.set(page, setTimeout(() => { page.classList.remove('is-closing'); page.hidden = true; }, ms));
  }
  // A variant can keep the menu under a page while it opens (--page-over-menu: 1): the page fades
  // in over the menu, not over the cook screen sliding back. Once the page covers the screen
  // (--page-open-ms) the menu goes at once, so closing the page shows the cook screen.
  const keepsMenu = (page) => getComputedStyle(page).getPropertyValue('--page-over-menu').trim() === '1';
  function closeMenuUnder(page) {
    if (!keepsMenu(page)) { closeMenu(); return; }
    const ms = parseFloat(getComputedStyle(page).getPropertyValue('--page-open-ms')) || 0;
    setTimeout(() => { if (!page.hidden) closeMenuInstantly(); }, ms);
  }
  function openSetting() {
    renderSetting();
    showPage(setting);
    closeMenuUnder(setting);
  }
  function closeSetting() { hidePage(setting); }
  function openRecipe() {
    Object.assign(recipeView, { id: null, optionId: null, popover: false, mode: null });
    lastScrollKey = null;   // a fresh open starts at the top
    renderRecipe();
    showPage(recipePage);
    closeMenuUnder(recipePage);
  }
  function closeRecipe() { hidePage(recipePage); }

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
    // v15: a wrong PIN shows its message in place of "비밀번호를 입력하세요" (same size, nothing below
    // the dots), and the error red is the softer #ff5c5c on the message and the dots alike
    const v15 = animatesFields();
    const red = v15 ? 'bg-[#ff5c5c]' : 'bg-[#e44242]';
    const title = v15 && pinError
      ? `<p class="type-body2 w-[400px] text-center text-[#ff5c5c]">${t('pinError')}</p>`
      : `<p class="type-body2 w-[400px] text-center text-white">${t('enterPasscode')}</p>`;
    const dots = Array.from({ length: 4 }, (_, i) => `
              <div data-slot="${pinError ? 'error' : pin.length > i ? 'filled' : pin.length === i ? 'focus' : 'empty'}" class="flex h-[120px] w-[80px] shrink-0 flex-col items-center justify-center rounded-[20px]">
                <div class="size-4 shrink-0 rounded-full ${pinError ? red : pin.length > i ? 'bg-white' : 'bg-white/30'}"></div>
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
            ${title}
            <div class="mt-12 flex shrink-0 items-start rounded-[20px]" ${pinError ? "data-shake" : ""}>${dots}</div>
            ${pinError && !v15 ? `<p class="type-body3 text-center leading-[130%] text-[#e44242]">${t('pinError')}</p>` : ''}
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
    // v15: 빠른 레시피 선택's radio cards — picking the other one swaps the screen as the toggle did
    const qsPick = e.target.closest('[data-quick-select]');
    if (qsPick) {
      const next = qsPick.dataset.quickSelect === 'on';
      if (next === settings.quickSelect) return;
      const was = setting.querySelector('.qs-option.is-on');
      const from = was ? was.offsetLeft : null;
      settings.quickSelect = next;
      store.set('quickSelect', next);
      renderSetting();
      // the scrim slides over from the card it was on (260ms, as the recipe detail's chips)
      const now = setting.querySelector('.qs-option.is-on'), bg = now && now.querySelector('.qs-bg');
      if (bg && from != null && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        bg.animate([{ transform: `translateX(${from - now.offsetLeft}px)` }, { transform: 'none' }], { duration: 260, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
        // the picked card's miniature takes on its colour as the scrim arrives; the other's drains to grey
        setting.querySelectorAll('.qs-option').forEach((o) => {
          const on = o === now;
          o.querySelector('.qs-thumb').animate([{ filter: `grayscale(${on ? 1 : 0})` }, { filter: `grayscale(${on ? 0 : 1})` }], { duration: 260, easing: 'ease-out' });
        });
      }
      if (window.App && window.App.applyQuickSelect) setTimeout(() => {
        // the swap loads the other page and reopens settings there: at the same scroll, not the top
        try { sessionStorage.setItem('proto:settingScroll', String(settingScroller()?.scrollTop || 0)); } catch (err) { /* ignore */ }
        window.App.applyQuickSelect({ reopenSetting: true });
      }, 260);
      return;
    }
    if (e.target.closest('[data-quick-select-row]')) return;   // the card around them isn't a control
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
    // v15: the whole row is the segmented switch's tap target (as 조리물 감지's row is for its toggle)
    const sw = e.target.closest('[data-setting]') ||
      (animatesFields() ? e.target.closest('main > section > div')?.querySelector('[data-setting]') : null);
    if (!sw) return;
    const key = sw.dataset.setting;
    const current = key === 'locale' ? lang() : settings[key];
    const next = current === sw.dataset.right ? sw.dataset.left : sw.dataset.right;
    if (key === 'locale') {
      if (window.Cook && window.Cook.setLang) window.Cook.setLang(next);
    } else {
      settings[key] = next;
      store.set(key, next);
      // v15: the cook screen's temperatures follow °C / °F — redraw it under the page now
      if (key === 'temperatureUnit' && animatesFields() && window.Cook && window.Cook.render) window.Cook.render();
    }
    // 언어: this render is the one that swaps the texts (the lang observer then finds nothing new)
    if (key === 'locale') {
      swapTexts(setting, renderSetting);
      // the lang observer would re-render the page once more and cut the swap short; this page is done
      if (!menu.hidden) swapTexts(menu, renderMenu);
      if (!recipePage.hidden) swapTexts(rpBody, renderRecipe);
      shownLang = document.documentElement.lang;
    } else renderSetting();
  });

  recipePage.addEventListener('click', (e) => {
    if (confirmBox && handleConfirmClick(e)) return;
    if (e.target.closest('[data-recipe-back]') && recipeView.mode) { handleModeBack(); return; }
    if (recipeView.mode === 'create' && handleFormClick(e)) return;
    if (recipeView.mode === 'reorder') { if (e.target.closest('[data-reorder-done]')) submitReorder(); return; }
    const open = e.target.closest('[data-recipe-open]');
    if (open) { navRecipe('in', () => Object.assign(recipeView, { id: Number(open.dataset.recipeOpen), optionId: null, popover: false, optionMenu: false })); recipePage.scrollTop = 0; return; }
    if (e.target.closest('[data-recipe-option-open]')) { recipeView.optionMenu = true; renderRecipe(); return; }
    if (e.target.closest('[data-recipe-option-close]')) { closeOptionMenu(); return; }
    const tab = e.target.closest('[data-recipe-option]');
    if (tab && recipeView.optionMenu) { closeOptionMenu(Number(tab.dataset.recipeOption)); return; }
    if (tab) { recipeView.optionId = Number(tab.dataset.recipeOption); renderRecipe(); return; }
    if (e.target.closest('[data-recipe-kebab]')) { recipeView.popover = true; renderRecipe(); return; }
    if (e.target.closest('[data-recipe-popover-close]')) { closePopover(); return; }
    const action = e.target.closest('[data-recipe-action]');
    if (action && action.dataset.recipeAction === 'create') { openCreate(); return; }
    if (action && action.dataset.recipeAction === 'reorder') { openReorder(); return; }
    if (action) {
      console.info('[Recipe] ' + action.dataset.recipeAction + ' (out of scope)');
      if (recipeView.popover) closePopover();
      return;
    }
    if (e.target.closest('[data-recipe-back]')) {
      // detail → list (navigate(-1)); list → the cook screen (navigate('/cook'))
      if (recipeView.id != null) navRecipe('back', () => Object.assign(recipeView, { id: null, optionId: null, popover: false }));
      else closeRecipe();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!pinLayer.hidden) closePin();
    else if (!menu.hidden) closeMenu();
    else if (!recipePage.hidden && kb) closeKeyboard();
    // innermost first: a selector list would match in page order, so ‹ (earlier in the page) won over the open ⋯ popover
    else if (!recipePage.hidden) ['[data-confirm-cancel]', '[data-sheet-cancel]', '[data-recipe-popover-close]', '[data-recipe-option-close]', '[data-recipe-back]']
      .map((s) => recipePage.querySelector(s)).find(Boolean)?.click();
    else if (!setting.hidden) closeSetting();
  });

  try {
    if (sessionStorage.getItem('proto:reopenSetting')) {
      sessionStorage.removeItem('proto:reopenSetting');
      renderSetting();
      setting.hidden = false;
      const y = Number(sessionStorage.getItem('proto:settingScroll')) || 0;
      sessionStorage.removeItem('proto:settingScroll');
      if (y) { const sc = settingScroller(); if (sc) sc.scrollTop = y; }
    }
  } catch (e) { /* ignore */ }

  // proto-only dev bar switch (v15): the recipe detail picks a cook option from a dropdown or chips
  { const devbar = document.getElementById('devbar');
    if (devbar && animatesFields()) {
      const b = document.createElement('button');
      b.dataset.dev = 'option-picker';
      b.title = '레시피 상세: 조리 설정 보여주는 방식 — 카드 / 드롭다운 / 칩 (proto-only)';
      const NAMES = { cards: '옵션: 카드', dropdown: '옵션: 드롭다운', chips: '옵션: 칩' };
      const label = () => { b.textContent = NAMES[optionPicker()]; };
      label();
      b.addEventListener('click', () => {   // 카드 → 드롭다운 → 칩 → 카드
        const next = OPTION_PICKERS[(OPTION_PICKERS.indexOf(optionPicker()) + 1) % OPTION_PICKERS.length];
        try { localStorage.setItem('proto:optionPicker', next); } catch (e) { /* ignore */ }
        label();
        recipeView.optionMenu = false;
        if (!recipePage.hidden) renderRecipe();
      });
      (devbar.querySelector('[data-dev="grid"]') || devbar.lastElementChild).after(b);
    } }

  window.AppMenu = { open: openMenu, close: closeMenu, openSetting, closeSetting, openRecipe, closeRecipe, openPin, settings };
})();
