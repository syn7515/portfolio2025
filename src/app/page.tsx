"use client";

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import ProjectListItem from '@/components/ui/project-list-item';
import InlineLinkPreview from '@/components/ui/inline-link-preview';
import {
  PAPER_EXIT_REST,
  PAPER_EXIT_OFFSCREEN,
  PAPER_EXIT_TRANSITION,
  PAPER_EXIT_TRANSITION_REDUCED,
  PAPER_BACK_NAV_FLAG,
  PAPER_BACK_NAV_VALUE,
} from '@/lib/paper-exit-transition';

// Persists across client-side navigation (back button) but resets on full page load
let hasVisitedHome = false;

// Paper entrance animation: paper slides in from the top-right corner with a blur-in, then content fades in on top of it
const ENTRANCE_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];
const PAPER_SLIDE_DURATION = 0.45;
const PAPER_OFFSET_X = 40;
const PAPER_OFFSET_Y = -32;
const PAPER_INITIAL_ROTATE_DEG = 2;
const PAPER_BLUR_PX = 10;
const CONTENT_DELAY_RATIO = 0.6;

// Wall-clock floor for revealing content. The entrance is driven by Framer's requestAnimationFrame
// loop, which browsers throttle to a near-stop while a tab is backgrounded (and under some
// battery-saver / heavy-CPU conditions) — leaving the intro stuck at its hidden initial state. This
// timeout forces the whole sequence to its visible end state regardless of animation progress.
// It's comfortably longer than the full staggered sequence (~1.3s), so once everything has animated
// in normally, flipping it is a no-op rather than a snap.
const ENTRANCE_FALLBACK_MS = 2200;

export default function Home() {
  const shouldAnimate = !hasVisitedHome;
  const [animationReady, setAnimationReady] = useState(false);
  // Set either by the fallback timer below, or immediately on a backwards-navigation exit (see
  // exitEntrance): collapses every entrance transition to an instant jump so content appears fully
  // settled rather than animating in — because either nothing is animating it in normally (the rAF
  // fallback case) or the departing sheet below is what plays the actual visible motion instead.
  const [instantReveal, setInstantReveal] = useState(false);
  // Backwards navigation (sidebar "Home" link on a blog post): instead of the normal staggered
  // entrance, a sheet slides OUT to the top-right, revealing this page's content already sitting on
  // the paper underneath — the reverse of a fresh paper landing. Signaled across the route change via
  // sessionStorage (set in the departing link's onClick in blog-post-layout.tsx), and read only
  // post-mount so SSR output never branches on client-only state. Shared with blog-post-layout.tsx's
  // identical mechanism via src/lib/paper-exit-transition.ts.
  const [exitEntrance, setExitEntrance] = useState(false);
  const [exitDone, setExitDone] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(PAPER_BACK_NAV_FLAG) === PAPER_BACK_NAV_VALUE) {
      sessionStorage.removeItem(PAPER_BACK_NAV_FLAG);
      setExitEntrance(true);
      setInstantReveal(true);
    }
    hasVisitedHome = true;
    setAnimationReady(true);
  }, []);

  useEffect(() => {
    if (!shouldAnimate) return;
    const timer = setTimeout(() => setInstantReveal(true), ENTRANCE_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [shouldAnimate]);

  const shouldReduceMotion = useReducedMotion();

  // Pre-mount paper state never branches on shouldReduceMotion (see blog-post-layout.tsx for why:
  // that hook can resolve differently between server and first client render, which would cause a
  // hydration mismatch). shouldAnimate is safe to use immediately — it's already proven so by the
  // rest of this page's animations, since it's only ever false on a client-only SPA return-to-home.
  // The animate target is the same either way once ready (no more mid-flight keyframe), so only
  // the transition timing needs to branch on shouldReduceMotion.
  const paperOffscreen = { x: PAPER_OFFSET_X, y: PAPER_OFFSET_Y, rotate: PAPER_INITIAL_ROTATE_DEG, filter: `blur(${PAPER_BLUR_PX}px)` };
  const paperRest = { x: 0, y: 0, rotate: 0, filter: 'blur(0px)' };
  const paperInitial = shouldAnimate ? paperOffscreen : false;
  const getPaperAnimate = () => (shouldAnimate && !animationReady ? paperOffscreen : paperRest);
  const paperTransition = (shouldReduceMotion || instantReveal)
    ? { duration: 0 }
    : { duration: PAPER_SLIDE_DURATION, ease: ENTRANCE_EASE };
  const exitTransition = shouldReduceMotion ? PAPER_EXIT_TRANSITION_REDUCED : PAPER_EXIT_TRANSITION;
  // Existing per-element stagger delays below are all offset by this so the whole sequence starts
  // once the paper has slid in, instead of racing it.
  const contentBaseDelay = shouldReduceMotion ? 0 : PAPER_SLIDE_DURATION * CONTENT_DELAY_RATIO;

  const animateVisible = { opacity: 1, y: 0, filter: "blur(0px)" };
  const animateHidden = { opacity: 0, y: 20, filter: "blur(1.5px)" };
  const getAnimate = () => (!shouldAnimate || animationReady ? animateVisible : animateHidden);
  // Per-element entrance transition, collapsed to an instant jump once the fallback fires.
  const contentTransition = (extraDelay: number) =>
    instantReveal
      ? { duration: 0, ease: ENTRANCE_EASE, delay: 0 }
      : { duration: 0.5, ease: ENTRANCE_EASE, delay: contentBaseDelay + extraDelay };

  return (


    <div className="font-sans w-full min-h-screen overflow-x-clip flex flex-col">
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
        <motion.div
          className="w-full flex-1 flex flex-col min-[1280px]:mt-[100px] overflow-x-clip"
          style={{ backgroundColor: 'var(--paper-bg)', boxShadow: 'var(--paper-box-shadow)', marginLeft: 'var(--sidebar-w)' }}
          initial={paperInitial}
          animate={getPaperAnimate()}
          transition={paperTransition}
        >
        <div className="flex-1 flex flex-col pt-20 min-[640px]:pt-24 min-[1024px]:pt-[7.5rem] min-[1280px]:pt-[8.75rem] pb-5 min-[640px]:pb-8 min-[1280px]:pb-10">
        <div className="flex-1 flex flex-col px-6 min-[1280px]:px-0 min-[1280px]:ml-[calc(50vw_-_280px_-_var(--sidebar-w))] min-[1280px]:w-[560px]">
        <div className="intro-container max-w-[560px] mx-auto">
          {/* Left column: name */}
          <div>
            <motion.h1
              className="intro-text !mt-0 !text-stone-700 dark:!text-zinc-200 !mb-0 md:!mb-0"
              initial={shouldAnimate ? { opacity: 0, y: 20, filter: "blur(1.5px)" } : false}
              animate={getAnimate()}
              transition={contentTransition(0)}
              style={{
                fontFamily: 'var(--font-crimson-pro), serif',
                fontSize: '40px',
                lineHeight: '120%',
                letterSpacing: '-0.03em',
                fontWeight: 360,
                textWrap: 'balance',
              }}
            >
              Sue Park
            </motion.h1>
          </div>
          {/* Right column: bio + social links */}
          <div>
            <motion.p
              className="intro-text !text-stone-500 dark:!text-zinc-400 !font-[460] mt-12 md:mt-14 lg:mt-16 !mb-5"
              initial={shouldAnimate ? { opacity: 0, y: 20, filter: "blur(1.5px)" } : false}
              animate={getAnimate()}
              transition={contentTransition(0.08)}
            >
              Product designer with engineering mindset, obsessed with <span className="italic">why</span> behind everything — from systems to pixels.
            </motion.p>
            <motion.p
              className="!text-stone-500 dark:!text-zinc-400 !font-[460] !mb-5"
              initial={shouldAnimate ? { opacity: 0, y: 20, filter: "blur(1.5px)" } : false}
              animate={getAnimate()}
              transition={contentTransition(0.16)}
            >
              <span className="intro-text">Currently leading design at </span><InlineLinkPreview href="https://www.aniai.ai/" imageUrl='https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/aniai.webp' explanation="A robotics startup specialized in kitchen automation">Aniai</InlineLinkPreview><span className="intro-text">, designing robots and tools behind them.</span>
            </motion.p>
            <motion.p
              className="!text-stone-500 dark:!text-zinc-400 !font-[460] mb-0"
              initial={shouldAnimate ? { opacity: 0, y: 20, filter: "blur(1.5px)" } : false}
              animate={getAnimate()}
              transition={contentTransition(0.24)}
            >
              <span className="intro-text">Previously, reimagined public benefits at </span><InlineLinkPreview href="https://goinvo.com/" variant="intro-link-light" imageUrl='https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/goinvo.jpg' explanation="A Boston design studio crafting healthcare software for 20+ years">Goinvo</InlineLinkPreview><span className="intro-text"> and advanced healthcare accessibility at </span><InlineLinkPreview href="https://www.athenahealth.com/" variant="intro-link-light" imageUrl="https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/athenahealth.jpeg" explanation='A healthtech company serving 170K+ clinicians across the US'>AthenaHealth</InlineLinkPreview><span className="intro-text">.</span>
            </motion.p>
          </div>
        </div>

        <div className="max-w-[560px] mx-auto w-full mt-8 sm:mt-12 lg:mt-14">
          <div className="flex flex-col gap-3 sm:gap-1 lg:gap-1 [&:has([data-project-list-item]:hover)_[data-project-list-item]:not(:hover)]:!opacity-40">
            <ProjectListItem
              title="Robot Interface for Collaboration in Kitchen"
              dates="2026 - Ongoing"
              href="/alphagrill"
              initial={shouldAnimate ? { opacity: 0, y: 20, filter: "blur(1.5px)" } : false}
              animate={getAnimate()}
              transition={contentTransition(0.4)}
            />
            <ProjectListItem
              title="Building the Tools Behind Smarter Robots"
              dates="2024 - 2025"
              href="/aniai"
              initial={shouldAnimate ? { opacity: 0, y: 20, filter: "blur(1.5px)" } : false}
              animate={getAnimate()}
              transition={contentTransition(0.44)}
            />
            <ProjectListItem
              title="Encouraging Prompt Bill Payment"
              dates="2023"
              href="/athenahealth"
              initial={shouldAnimate ? { opacity: 0, y: 20, filter: "blur(1.5px)" } : false}
              animate={getAnimate()}
              transition={contentTransition(0.48)}
            />
          </div>
        </div>

        <div className="max-w-[560px] mx-auto w-full mt-8 sm:mt-12 lg:mt-14 flex flex-col gap-6">
          <motion.div
            className="h-px w-4 bg-stone-400/50 dark:bg-zinc-600/50"
            initial={shouldAnimate ? { opacity: 0, y: 20, filter: "blur(1.5px)" } : false}
            animate={getAnimate()}
            transition={contentTransition(0.52)}
          />
          <motion.div
            className="intro-text flex gap-2 w-fit"
            initial={shouldAnimate ? { opacity: 0, y: 20, filter: "blur(1.5px)" } : false}
            animate={getAnimate()}
            transition={contentTransition(0.54)}
          >
            <a
              href="https://x.com/sue_park__"
              target="_blank"
              rel="noopener noreferrer"
              data-social-link-trigger
              className="!text-stone-500 dark:!text-zinc-400 hover:!text-orange-700 dark:hover:!text-lime-200"
              style={{ fontSize: '14px' }}
            >
              X
            </a>
            <span className="!text-stone-400 dark:!text-zinc-600" style={{ fontSize: '14px' }}>·</span>
            <a
              href="https://www.linkedin.com/in/sooyeonp/"
              target="_blank"
              rel="noopener noreferrer"
              data-social-link-trigger
              className="!text-stone-500 dark:!text-zinc-400 hover:!text-orange-700 dark:hover:!text-lime-200"
              style={{ fontSize: '14px' }}
            >
              LinkedIn
            </a>
          </motion.div>
        </div>

        <motion.div
          className="max-w-[480px] mx-auto mt-auto pt-24 sm:pt-32 lg:pt-36 text-center"
          initial={shouldAnimate ? { opacity: 0, y: 20, filter: "blur(1.5px)" } : false}
          animate={getAnimate()}
          transition={contentTransition(0.56)}
        >
          <div
            className="text-[14px] text-stone-400 dark:text-zinc-500 font-normal font-sans"
          >
            © {new Date().getFullYear()} Sue Park. — Built with millions of tokens of love.
          </div>
        </motion.div>
        </div>
        </div>
        </motion.div>

        {/* Departing-sheet overlay (backwards navigation from a blog post's sidebar "Home" link):
            the reverse of the entrance above. Content is already revealed underneath (instantReveal
            snaps the paper and every staggered element straight to their settled state — see the
            mount effect), and this sheet starts at the paper's rest position and slides out to the
            top-right. z-[55] matches blog-post-layout.tsx's departing sheet for consistency, even
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
