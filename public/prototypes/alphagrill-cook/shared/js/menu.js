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
  if (!device) return;

  const STR = {
    ko: {
      recipes: '레시피', settings: '설정', manageDevice: '장비 관리',
      unitAndLanguage: '단위 및 언어', temperature: '온도', length: '길이', language: '언어',
      otherFeatures: '기타 기능', foodDetection: '조리물 감지',
      foodDetectionDesc: '그리들 위 조리물 위치에 맞춰 배출합니다',
      quickSelect: '빠른 레시피 선택', quickSelectDesc: '조리 화면에서 레시피를 바로 고릅니다',
      close: '닫기', back: '뒤로',
    },
    en: {
      recipes: 'Recipes', settings: 'Settings', manageDevice: 'Manage device',
      unitAndLanguage: 'Unit & Languages', temperature: 'Temperature', length: 'Length', language: 'Language',
      otherFeatures: 'Other features', foodDetection: 'Food detection',
      foodDetectionDesc: 'Unload based on food placement',
      quickSelect: 'Quick recipe select', quickSelectDesc: 'Pick recipes on the cook screen',
      close: 'Close', back: 'Back',
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
    chevronLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
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

  const style = document.createElement('style');
  style.textContent = `
    .proto-layer { position: absolute; inset: 0; z-index: 60; }
    .proto-layer[hidden] { display: none; }
    #app-menu .menu-backdrop { transition: opacity 150ms; }
    #app-menu .menu-popup { transition: opacity 200ms; }
    #app-menu.is-closed .menu-backdrop, #app-menu.is-closed .menu-popup { opacity: 0; }
    .proto-icon-10 svg { width: 40px; height: 40px; }
    .proto-icon-8 svg { width: 32px; height: 32px; }
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
      <div class="menu-backdrop absolute inset-0 bg-black/70"></div>
      <div class="menu-popup absolute inset-0 flex flex-col backdrop-blur-sm">
        <header class="relative flex h-[100px] min-w-0 shrink-0 items-center justify-end bg-[#7070704D] py-3 pl-2">
          <button type="button" data-menu="close" aria-label="${t('close')}" class="group flex items-center justify-end py-[18px] pr-5 pl-25">
            <div class="proto-icon-10 flex size-16 items-center justify-center rounded-lg text-white group-active:bg-white/10">${ICON.x}</div>
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
    closeTimer = setTimeout(() => { menu.hidden = true; }, 200);
  }
  // The app navigates first and lets the menu fade out over the new page.
  function openSetting() {
    renderSetting();
    setting.hidden = false;
    closeMenu();
  }
  function closeSetting() { setting.hidden = true; }

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

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!menu.hidden) closeMenu();
    else if (!setting.hidden) closeSetting();
  });

  try {
    if (sessionStorage.getItem('proto:reopenSetting')) {
      sessionStorage.removeItem('proto:reopenSetting');
      renderSetting();
      setting.hidden = false;
    }
  } catch (e) { /* ignore */ }

  window.AppMenu = { open: openMenu, close: closeMenu, openSetting, closeSetting, settings };
})();
