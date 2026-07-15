/** Shared circular reference badge styles (span-based, not <sup>). */
export const SUP_BADGE_BASE_CLASS =
  'sup-badge inline-flex items-center justify-center rounded-full w-[13px] h-[13px] text-[10px] leading-none font-medium !text-white [font-feature-settings:normal] cursor-pointer select-none relative -top-[5px] ml-[2px] transition-opacity duration-150 hover:!opacity-100';

export const SUP_BADGE_DEFAULT_CLASS =
  'bg-stone-300 hover:bg-orange-700 dark:bg-zinc-300 dark:!text-zinc-900 dark:hover:bg-orange-400';

/** Muted variant for carousel captions, where the bright default background is too prominent. */
export const SUP_BADGE_CAROUSEL_CLASS =
  'bg-stone-300 hover:bg-orange-700 dark:bg-zinc-500 dark:!text-zinc-900 dark:hover:bg-orange-400';

export const SUP_BADGE_HIGHLIGHTED_CLASS =
  'bg-orange-700 dark:bg-orange-300 dark:!text-zinc-900';
