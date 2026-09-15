"use client";

import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import ProjectListItem from '@/components/ui/project-list-item';
import InlineLinkPreview from '@/components/ui/inline-link-preview';
import PaperGridBackground from '@/components/ui/paper-grid-background';
import styles from './page.module.css';
import {
  PAPER_EXIT_REST,
  PAPER_EXIT_OFFSCREEN,
  PAPER_EXIT_TRANSITION,
  PAPER_EXIT_TRANSITION_REDUCED,
  PAPER_EXIT_TRANSFORM_ORIGIN,
  isPaperBackNav,
  clearPaperBackNav,
} from '@/lib/paper-exit-transition';

// Persists across client-side navigation (back button) but resets on full page load
let hasVisitedHome = false;

// The paper entrance (sheet slides in from the top-right with a blur-in, content rises into place
// behind it on a stagger) lives in page.module.css. It has no dynamic inputs, so CSS can run it on
// the first painted frame rather than waiting for the bundle to download and hydrate — which is
// what used to gate this page's First Contentful Paint. See the comment at the top of that file.
//
// This also retires the old rAF-throttling fallback: CSS animations advance on the document
// timeline, so a tab opened in the background arrives already settled instead of stuck hidden.

// Stagger, in ms, applied per element on top of the base offset. The sequence now starts while the
// sheet is still approaching rest, giving the first text block 270ms of overlap with the 450ms slide.
const CONTENT_BASE_DELAY_MS = 180;
const DELAY = {
  name: 0,
  bioFirst: 80,
  bioSecond: 160,
  bioThird: 240,
  projectFirst: 400,
  projectSecond: 440,
  projectThird: 480,
  chapterBreak: 520,
  projectPersonal: 560,
  divider: 600,
  footer: 640,
} as const;

// When the last-delayed block has finished its 500ms rise, the whole entrance is over. From then on
// the .contentRise/.paperEntrance classes are inert *unless* a media query flips their computed
// animation-name from `none` back to a real name — which is what crossing the 640px breakpoint does,
// since the phone block below that width suppresses both. That replayed the entire intro on every
// resize past 640px, so once this timer fires the page pins itself into the settled state.
const CONTENT_RISE_DURATION_MS = 500;
const ENTRANCE_TOTAL_MS = CONTENT_BASE_DELAY_MS + DELAY.footer + CONTENT_RISE_DURATION_MS;

// Chapter-break dinkus. Set in the title serif at the size of the metadata column, so it reads as a
// typographic mark in the page's own voice rather than a widget.
const DINKUS_FONT_SIZE_PX = 16;
// Traditional dinkus spacing is roughly an em between marks. Crimson Pro's asterisk advances
// ~0.43em, so an 8px flex gap puts glyph centres just under an em apart at this size.
// This is deliberately the container's gap rather than letter-spacing on the glyphs: each span
// holds a single character, so letter-spacing would only pad its right-hand side, adding a trailing
// space that pushes the group off centre without separating anything.
// The asterisk's ink hangs high in the em box. Measured on the rendered glyph in Crimson Pro: the
// ink spans 0.342em to 0.682em above the baseline, putting its centre 0.512em up while the line
// box's own centre (at line-height 1) sits lower. Translating down by the difference lands the ink
// on the block's optical centre, so the symmetric margins above and below read as symmetric.
// Re-measure if the display face ever changes.
const DINKUS_INK_OFFSET_EM = 0.178;
const DINKUS_STYLE: CSSProperties = {
  fontFamily: 'var(--font-crimson-pro), serif',
  fontSize: `${DINKUS_FONT_SIZE_PX}px`,
  lineHeight: 1,
  transform: `translateY(${DINKUS_INK_OFFSET_EM}em)`,
};

export default function Home() {
  const shouldAnimate = !hasVisitedHome;
  // Backwards navigation (sidebar "Home" link on a blog post): instead of the normal staggered
  // entrance, a sheet slides OUT to the top-right, revealing this page's content already sitting on
  // the paper underneath — the reverse of a fresh paper landing. The CSS half reads the <html>
  // attribute on the first frame; this state only decides whether to mount the departing sheet,
  // which is post-hydration by nature. Shared with blog-post-layout.tsx's identical mechanism via
  // src/lib/paper-exit-transition.ts.
  const [exitEntrance, setExitEntrance] = useState(false);
  const [exitDone, setExitDone] = useState(false);
  // Starts false on both the server and the first client render (shouldAnimate is only ever false
  // after a client-side visit, which can't happen before hydration), so there's no mismatch.
  const [entranceSettled, setEntranceSettled] = useState(false);

  useEffect(() => {
    if (isPaperBackNav()) setExitEntrance(true);
    hasVisitedHome = true;
  }, []);

  // See ENTRANCE_TOTAL_MS: retire the entrance classes once they've played, so a later viewport
  // change across 640px can't re-arm them. A timer rather than an animationend listener because the
  // phone and reduced-motion cases never fire one — there the entrance is `none` from the start and
  // this just settles immediately after the same delay.
  useEffect(() => {
    const id = window.setTimeout(() => setEntranceSettled(true), ENTRANCE_TOTAL_MS);
    return () => window.clearTimeout(id);
  }, []);

  // Release the <html> attribute once the suppression class has committed. Clearing it while it was
  // the only thing suppressing the entrance restarted every animation (CSS starts an animation when
  // its computed name goes from `none` to a real name), which replayed the whole intro right after
  // the departing sheet had left. See page.module.css.
  useEffect(() => {
    if (exitEntrance) clearPaperBackNav();
  }, [exitEntrance]);

  const shouldReduceMotion = useReducedMotion();
  const exitTransition = shouldReduceMotion ? PAPER_EXIT_TRANSITION_REDUCED : PAPER_EXIT_TRANSITION;

  // shouldAnimate is only ever false on a client-only SPA return to home, where the entrance has
  // already played once and would otherwise replay on remount.
  const paperClass = shouldAnimate ? ` ${styles.paperEntrance}` : '';
  const riseClass = shouldAnimate ? ` ${styles.contentRise}` : '';
  const riseDelay = (delayMs: number) =>
    shouldAnimate ? { animationDelay: `${CONTENT_BASE_DELAY_MS + delayMs}ms` } : undefined;

  return (


    <div className={`font-sans w-full min-h-[100dvh] min-[640px]:min-h-screen overflow-x-clip flex flex-col${exitEntrance || entranceSettled ? ` ${styles.noEntrance}` : ''}`}>
      {/* Top-edge fade overlay */}
      <div
        aria-hidden
        className="fixed top-0 left-0 right-0 z-40 pointer-events-none"
        style={{
          height: '80px',
          background: 'linear-gradient(to bottom, var(--top-fade-from) 0%, transparent 100%)',
        }}
      />

      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-white focus:text-stone-800 focus:rounded focus:shadow">Skip to content</a>
      <main id="main" className="w-full flex-1 flex flex-col relative">
        <PaperGridBackground />
        {/* paper-grid-bottom: below 1280px the paper is full-bleed, so PaperGridBackground has
            nothing left to peek out of — the same grid is composited into this element's own
            background instead, under a diagonal fade. See globals.css. */}
        <div
          className={`paper-grid-bottom relative z-10 w-full flex-1 flex flex-col min-[1280px]:mt-[100px] overflow-x-clip${paperClass}`}
          style={{ backgroundColor: 'var(--paper-bg)', boxShadow: 'var(--paper-box-shadow)', marginLeft: 'var(--sidebar-w)' }}
        >
        <div className="flex-1 flex flex-col pt-16 min-[640px]:pt-24 min-[1024px]:pt-[7.5rem] min-[1280px]:pt-[clamp(6.25rem,calc(18.182vw_-_8.295rem),8.75rem)] pb-5 min-[640px]:pb-8 min-[1280px]:pb-10">
        <div className="flex-1 flex flex-col px-6 min-[1280px]:px-0 min-[1280px]:ml-[calc(50vw_-_280px_-_var(--sidebar-w))] min-[1280px]:w-[560px]">
        <div className="max-w-[560px] mx-auto" data-inline-link-preview-boundary>
          {/* Left column: name */}
          <div>
            <h1
              className={`!mt-0 !text-[32px] sm:!text-[40px] !text-stone-700 dark:!text-zinc-200 !mb-0 md:!mb-0${riseClass}`}
              style={{
                fontFamily: 'var(--font-biro-script), "Segoe Print", "Bradley Hand", cursive',
                lineHeight: '120%',
                letterSpacing: '-0.03em',
                fontWeight: 360,
                textWrap: 'balance',
                ...riseDelay(DELAY.name),
              }}
            >
              Sue Park
            </h1>
          </div>
          {/* Right column: bio + social links */}
          <div className="mt-12 flex flex-col gap-5 md:mt-14 lg:mt-16">
            <p
              className={`${styles.introParagraph} !text-stone-500 dark:!text-zinc-400 !mb-0${riseClass}`}
              style={riseDelay(DELAY.bioFirst)}
            >
              Product designer with engineering mindset, obsessed with <span className="italic">why</span> behind everything — from systems to pixels.
            </p>
            <p
              className={`${styles.introParagraph} !text-stone-500 dark:!text-zinc-400 !mb-0${riseClass}`}
              style={riseDelay(DELAY.bioSecond)}
            >
              <span>Currently leading design at </span><InlineLinkPreview href="https://www.aniai.ai/" explanation="A robotics startup specialized in kitchen automation">Aniai</InlineLinkPreview><span>, designing robots and tools behind them.</span>
            </p>
            <p
              className={`${styles.introParagraph} !text-stone-500 dark:!text-zinc-400 !mb-0${riseClass}`}
              style={riseDelay(DELAY.bioThird)}
            >
              <span>Previously, reimagined public benefits at </span><InlineLinkPreview href="https://goinvo.com/" explanation="A Boston design studio crafting healthcare software over twenty years">Goinvo</InlineLinkPreview><span> and advanced healthcare accessibility at </span><InlineLinkPreview href="https://www.athenahealth.com/" explanation='A healthtech company serving 170K+ clinicians across the US'>AthenaHealth</InlineLinkPreview><span>.</span>
            </p>
          </div>
        </div>

        <div className="max-w-[560px] mx-auto w-full mt-12 sm:mt-14 lg:mt-16">
          <div className="flex flex-col gap-2 sm:gap-1">
            <ProjectListItem
              title="Robot Interface for Collaboration in Kitchen"
              dates="2026 – Ongoing"
              href="/alphagrill"
              className={riseClass.trim() || undefined}
              style={riseDelay(DELAY.projectFirst)}
            />
            <ProjectListItem
              title="Building the Tools Behind Smarter Robots"
              dates="2024 – 2025"
              href="/aniai"
              className={riseClass.trim() || undefined}
              style={riseDelay(DELAY.projectSecond)}
            />
            <ProjectListItem
              title="Encouraging Prompt Bill Payment"
              dates="2023"
              href="/athenahealth"
              className={riseClass.trim() || undefined}
              style={riseDelay(DELAY.projectThird)}
            />
          </div>

          {/* Chapter break, in the sense a book uses one: a centred dinkus rather than a rule, so it
              reads as "new section" without introducing a heading level to a page that has none. Set
              in the title serif, since a dinkus is a typographic mark and not a piece of UI chrome.

              An asterisk's ink sits high in its em box — it hangs off the cap line rather than
              straddling the baseline — so `items-center` centres the line box while the glyphs
              themselves ride visibly above centre, which would eat into the space above and leave a
              gap below. DINKUS_INK_OFFSET_EM pushes them back down onto the block's optical centre;
              see the constant for how it is derived. */}
          {/* The space before the interpolation is load-bearing: Tailwind's scanner reads the source
              text, and a utility glued directly to `${'${'}` is not extracted. Written as
              `sm:mb-5${'${'}riseClass}` the class silently never reached the stylesheet, and `mb-6`
              won at 24px against a 20px top margin. */}
          <div
            aria-hidden
            className={`flex items-center justify-center gap-[8px] my-5 ${riseClass.trim()}`}
            style={riseDelay(DELAY.chapterBreak)}
          >
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="text-stone-400 dark:text-zinc-600 select-none"
                style={DINKUS_STYLE}
              >
                *
              </span>
            ))}
          </div>

          {/* Personal work, set apart from the case studies above. The page has no headings of its
              own, so rather than introducing a section layer for a single row, three cues carry the
              distinction: the chapter break, the right-hand column naming the category instead of a
              year — which also explains why the date sequence breaks here — and the row being a
              named product rather than a descriptive project title. Worth revisiting as labelled
              "Work"/"Personal" groups once there are two or three personal projects to name.

              Carries the same `gap-2 sm:gap-1` as the case-study list above even though it holds a
              single row today: without it a second personal project would sit 16px from the first
              (the two rows' own py-2 and nothing else) against the 24px every other pair uses. */}
          <div className="flex flex-col gap-2 sm:gap-1">
            <ProjectListItem
              title="Been There — Every Place, Stitched"
              dates="Personal, 2026"
              href="https://been-there.suepark.xyz"
              className={riseClass.trim() || undefined}
              style={riseDelay(DELAY.projectPersonal)}
            />
          </div>
        </div>

        {/* End-of-content mark closing the project list. It used to sit above the social links,
            which have since moved into the footer; the rule stays because without it the column
            just stops. Desktop only — on phones the footer follows close enough to do the job. */}
        <div className="hidden max-w-[560px] mx-auto w-full mt-8 sm:mt-12 lg:mt-14 sm:block">
          <div
            className={`h-px w-4 bg-stone-400/50 dark:bg-zinc-600/50 ${riseClass.trim()}`}
            style={riseDelay(DELAY.divider)}
          />
        </div>

        {/* On mobile, absorb spare viewport height while preserving at least 96px between the
            project list and footer when the content needs to scroll. On a 375x812 phone the list
            already overflows the viewport, so flex-1 gets nothing to distribute and this minimum
            is what actually renders — it is the gap, not a floor that rarely applies. */}
        <div className="min-h-24 flex-1 sm:hidden" aria-hidden />

        <div
          className={`w-full max-w-[560px] mx-auto sm:mt-auto sm:pt-20 lg:pt-24 ${riseClass.trim()}`}
          style={riseDelay(DELAY.footer)}
        >
          {/* One baseline row at every width: socials left, copyright right. They sit in DOM order,
              which also reads correctly — the footer's navigation before its legal line. */}
          <div className="flex items-baseline justify-between gap-4">
            <div className={`${styles.socialLinks} intro-text flex gap-2 w-fit`}>
              <a
                href="https://x.com/sue_park__"
                target="_blank"
                rel="noopener noreferrer"
                data-social-link-trigger
                className="sm:text-[14px] !text-stone-500 dark:!text-zinc-400 hover:!text-orange-700 active:!text-orange-700 dark:hover:!text-orange-400 dark:active:!text-orange-400 motion-safe:active:scale-[0.97]"
                style={{
                  transition: 'scale 150ms cubic-bezier(0.23, 1, 0.32, 1)',
                }}
              >
                X
              </a>
              <span className="sm:text-[14px] !text-stone-400 dark:!text-zinc-600">·</span>
              <a
                href="https://www.linkedin.com/in/sooyeonp/"
                target="_blank"
                rel="noopener noreferrer"
                data-social-link-trigger
                className="sm:text-[14px] !text-stone-500 dark:!text-zinc-400 hover:!text-orange-700 active:!text-orange-700 dark:hover:!text-orange-400 dark:active:!text-orange-400 motion-safe:active:scale-[0.97]"
                style={{
                  transition: 'scale 150ms cubic-bezier(0.23, 1, 0.32, 1)',
                }}
              >
                LinkedIn
              </a>
            </div>
            <div
              className="text-right text-[14px] text-stone-400 dark:text-zinc-500 font-normal font-sans [text-wrap:nowrap]"
            >
              © Sue Park {new Date().getFullYear()}
            </div>
          </div>
        </div>
        </div>
        </div>
        </div>

        {/* Departing-sheet overlay (backwards navigation from a blog post's sidebar "Home" link):
            the reverse of the entrance above. Content is already settled underneath (page.module.css
            suppresses the entrance entirely when the back-nav attribute is present), and this sheet
            starts at the paper's rest position and slides out to the top-right. z-[55] matches blog-post-layout.tsx's departing sheet for consistency, even
            though this page has no z-[50] descendant of its own to clear. */}
        {exitEntrance && !exitDone && (
          <motion.div
            aria-hidden
            className="absolute inset-0 min-[1280px]:top-[100px] overflow-x-clip pointer-events-none z-[55]"
            style={{ backgroundColor: 'var(--paper-bg)', boxShadow: 'var(--paper-box-shadow)', marginLeft: 'var(--sidebar-w)', transformOrigin: PAPER_EXIT_TRANSFORM_ORIGIN }}
            initial={PAPER_EXIT_REST}
            animate={PAPER_EXIT_OFFSCREEN}
            transition={exitTransition}
            onAnimationComplete={() => setExitDone(true)}
          />
        )}
      </main>

    </div>
  );
}
