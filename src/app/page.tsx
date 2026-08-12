"use client";

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

// Stagger, in ms, applied per element on top of the base offset. The base holds the sequence until
// the sheet is ~60% of the way in, so content rises onto a landing sheet rather than racing it.
const CONTENT_BASE_DELAY_MS = 270;
const DELAY = {
  name: 0,
  bioFirst: 80,
  bioSecond: 160,
  bioThird: 240,
  projectFirst: 400,
  projectSecond: 440,
  projectThird: 480,
  divider: 520,
  socials: 540,
  footer: 560,
} as const;

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

  useEffect(() => {
    if (isPaperBackNav()) setExitEntrance(true);
    hasVisitedHome = true;
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


    <div className={`font-sans w-full min-h-screen overflow-x-clip flex flex-col${exitEntrance ? ` ${styles.noEntrance}` : ''}`}>
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
        <div
          className={`relative z-10 w-full flex-1 flex flex-col min-[1280px]:mt-[100px] overflow-x-clip${paperClass}`}
          style={{ backgroundColor: 'var(--paper-bg)', boxShadow: 'var(--paper-box-shadow)', marginLeft: 'var(--sidebar-w)' }}
        >
        <div className="flex-1 flex flex-col pt-20 min-[640px]:pt-24 min-[1024px]:pt-[7.5rem] min-[1280px]:pt-[clamp(6.25rem,calc(18.182vw_-_8.295rem),8.75rem)] pb-5 min-[640px]:pb-8 min-[1280px]:pb-10">
        <div className="flex-1 flex flex-col px-6 min-[1280px]:px-0 min-[1280px]:ml-[calc(50vw_-_280px_-_var(--sidebar-w))] min-[1280px]:w-[560px]">
        <div className="max-w-[560px] mx-auto" data-inline-link-preview-boundary>
          {/* Left column: name */}
          <div>
            <h1
              className={`!mt-0 !text-stone-700 dark:!text-zinc-200 !mb-0 md:!mb-0${riseClass}`}
              style={{
                fontFamily: 'var(--font-biro-script), "Segoe Print", "Bradley Hand", cursive',
                fontSize: '48px',
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
          <div>
            <p
              className={`!text-stone-500 dark:!text-zinc-400 !font-[460] mt-12 md:mt-14 lg:mt-16 !mb-5${riseClass}`}
              style={riseDelay(DELAY.bioFirst)}
            >
              Product designer with engineering mindset, obsessed with <span className="italic">why</span> behind everything — from systems to pixels.
            </p>
            <p
              className={`!text-stone-500 dark:!text-zinc-400 !font-[460] !mb-5${riseClass}`}
              style={riseDelay(DELAY.bioSecond)}
            >
              <span>Currently leading design at </span><InlineLinkPreview href="https://www.aniai.ai/" explanation="A robotics startup specialized in kitchen automation">Aniai</InlineLinkPreview><span>, designing robots and tools behind them.</span>
            </p>
            <p
              className={`!text-stone-500 dark:!text-zinc-400 !font-[460] mb-0${riseClass}`}
              style={riseDelay(DELAY.bioThird)}
            >
              <span>Previously, reimagined public benefits at </span><InlineLinkPreview href="https://goinvo.com/" variant="intro-link-light" explanation="A Boston design studio crafting healthcare software over twenty years">Goinvo</InlineLinkPreview><span> and advanced healthcare accessibility at </span><InlineLinkPreview href="https://www.athenahealth.com/" variant="intro-link-light" explanation='A healthtech company serving 170K+ clinicians across the US'>AthenaHealth</InlineLinkPreview><span>.</span>
            </p>
          </div>
        </div>

        <div className="max-w-[560px] mx-auto w-full mt-8 sm:mt-12 lg:mt-14">
          <div className="flex flex-col gap-3 sm:gap-1 lg:gap-1 [&:has([data-project-list-item]:hover)_[data-project-list-item]:not(:hover)]:!opacity-40">
            <ProjectListItem
              title="Robot Interface for Collaboration in Kitchen"
              dates="2026 - Ongoing"
              href="/alphagrill"
              className={riseClass.trim() || undefined}
              style={riseDelay(DELAY.projectFirst)}
            />
            <ProjectListItem
              title="Building the Tools Behind Smarter Robots"
              dates="2024 - 2025"
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
        </div>

        <div className="max-w-[560px] mx-auto w-full mt-8 sm:mt-12 lg:mt-14 flex flex-col gap-6">
          <div
            className={`h-px w-4 bg-stone-400/50 dark:bg-zinc-600/50${riseClass}`}
            style={riseDelay(DELAY.divider)}
          />
          <div
            className={`intro-text flex gap-2 w-fit${riseClass}`}
            style={riseDelay(DELAY.socials)}
          >
            <a
              href="https://x.com/sue_park__"
              target="_blank"
              rel="noopener noreferrer"
              data-social-link-trigger
              className="!text-stone-500 dark:!text-zinc-400 hover:!text-orange-700 dark:hover:!text-orange-400 motion-safe:active:scale-[0.97]"
              style={{
                fontSize: '14px',
                transition: 'scale 150ms cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              X
            </a>
            <span className="!text-stone-400 dark:!text-zinc-600" style={{ fontSize: '14px' }}>·</span>
            <a
              href="https://www.linkedin.com/in/sooyeonp/"
              target="_blank"
              rel="noopener noreferrer"
              data-social-link-trigger
              className="!text-stone-500 dark:!text-zinc-400 hover:!text-orange-700 dark:hover:!text-orange-400 motion-safe:active:scale-[0.97]"
              style={{
                fontSize: '14px',
                transition: 'scale 150ms cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              LinkedIn
            </a>
          </div>
        </div>

        <div
          className={`max-w-[480px] mx-auto mt-auto pt-24 sm:pt-32 lg:pt-36 text-center${riseClass}`}
          style={riseDelay(DELAY.footer)}
        >
          <div
            className="text-[14px] text-stone-400 dark:text-zinc-500 font-normal font-sans text-balance"
          >
            © {new Date().getFullYear()} Sue Park. — Built with millions of tokens of love.
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
            style={{ backgroundColor: 'var(--paper-bg)', boxShadow: 'var(--paper-box-shadow)', marginLeft: 'var(--sidebar-w)' }}
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
