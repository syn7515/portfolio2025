"use client";

import { useEffect, useState } from 'react';
import ProjectListItem from '@/components/ui/project-list-item';
import Dinkus from '@/components/ui/dinkus';
import InlineLinkPreview from '@/components/ui/inline-link-preview';
import { DescriptionBackdrop } from '@/components/ui/description-backdrop';
import PaperGridBackground from '@/components/ui/paper-grid-background';
import PaperExitSheet from '@/components/ui/paper-exit-sheet';
import RevealFooter, { RevealBand, RevealFooterText, revealPaperClassName } from '@/components/ui/reveal-footer';
import styles from './page.module.css';
import { trackOutboundClick } from '@/lib/analytics';
import {
  isPaperBackNav,
  clearPaperBackNav,
  isPageReload,
  clearPageReload,
} from '@/lib/paper-exit-transition';

// Persists across client-side navigation (back button) but resets on full page load
let hasVisitedHome = false;

// The paper entrance (sheet settles onto the desk about its right edge with a blur-in, content rises
// into place behind it on a stagger) lives in page.module.css. It has no dynamic inputs, so CSS can run it on
// the first painted frame rather than waiting for the bundle to download and hydrate — which is
// what used to gate this page's First Contentful Paint. See the comment at the top of that file.
//
// This also retires the old rAF-throttling fallback: CSS animations advance on the document
// timeline, so a tab opened in the background arrives already settled instead of stuck hidden.

// Stagger, in ms, applied per element on top of the base offset. The sequence now starts while the
// sheet is still approaching rest, giving the first text block 320ms of overlap with the 500ms settle.
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
  endMark: 600,
  footer: 640,
} as const;

// When the last-delayed block has finished its 500ms rise, the whole entrance is over. From then on
// the .contentRise/.paperEntrance classes are inert *unless* a media query flips their computed
// animation-name from `none` back to a real name — which is what crossing the 640px breakpoint does,
// since the phone block below that width suppresses both. That replayed the entire intro on every
// resize past 640px, so once this timer fires the page pins itself into the settled state.
const CONTENT_RISE_DURATION_MS = 500;
const ENTRANCE_TOTAL_MS = CONTENT_BASE_DELAY_MS + DELAY.footer + CONTENT_RISE_DURATION_MS;

// Socials and copyright, the page's footer row. Rendered twice: on the sheet from 1024px, and in the
// reveal footer under the full-bleed paper below that. Only one copy is ever displayed, so the
// hidden one is out of the tab order and the accessibility tree.
//
// One baseline row at every width: socials left, copyright right. They sit in DOM order, which also
// reads correctly — the footer's navigation before its legal line.
//
// The two links carry `px-2 py-3` cancelled by an equal negative margin. Padding grows the hit
// area, the negative margin takes the growth back out of the layout, so the margin boxes — and
// therefore the text, the 8px flex gaps and the row's own height — are exactly where they were.
// Only what responds to a tap changes.
//
// "X" is a one-character link: it was 9.6 x 21px, well under the 24x24 WCAG 2.2 asks for and a
// genuinely hard thing to hit on a phone. This takes both links to 45px tall and "X" to 25.6px wide.
//
// 8px a side is the most the horizontal padding can be. The links sit 8px from the "·" between
// them, so at 8px each hit area reaches exactly that separator's edge and stops: one more pixel and
// the two links would start overlapping each other, with whichever paints on top quietly swallowing
// taps meant for the other.
//
// `tabIndex` is for the reveal footer's on-screen copy (RevealFooterText), which comes before the
// article in the document and so keeps its links out of the tab order; the copy after it is the one
// the keyboard reaches.
//
// `onGrid` is the reveal footer's copy, which sits on the drafting grid rather than the paper: each
// side carries DescriptionBackdrop there, as the case studies' Previous/Next pair does, to wash the
// lines out from under the text. The wrappers stay on the sheet's copy too, so the two lay out alike.
// The socials get an outer one rather than the backdrop going inside, where `.socialLinks > *` would
// reach it and its children would need lifting over it one by one.
function HomeFooterLinks({ onGrid = false, tabIndex }: { onGrid?: boolean; tabIndex?: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <div className="relative isolate">
        {onGrid && <DescriptionBackdrop />}
        {/* Each link's hit area runs 16px out on its open side and 10px toward the dot: the two
            meet halfway across the 20px between them (gap, dot, gap) and never overlap. */}
        <div className={`${styles.socialLinks} intro-text relative z-10 flex gap-2 w-fit`}>
          <a
            href="https://x.com/sue_park__"
            target="_blank"
            rel="noopener noreferrer"
            data-social-link-trigger
            tabIndex={tabIndex}
            onClick={() => trackOutboundClick("https://x.com/sue_park__", "X")}
            className="sm:text-[calc(14*var(--text-px))] pl-4 pr-2.5 -ml-4 -mr-2.5 py-3 -my-3 !text-stone-500 dark:!text-zinc-400 hover:!text-rose-700 active:!text-rose-700 dark:hover:!text-rose-400 dark:active:!text-rose-400 motion-safe:active:scale-[0.97]"
            style={{
              transition: 'scale 150ms cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          >
            X
          </a>
          <span className="sm:text-[calc(14*var(--text-px))] !text-stone-400 dark:!text-zinc-600">·</span>
          <a
            href="https://www.linkedin.com/in/sooyeonp/"
            target="_blank"
            rel="noopener noreferrer"
            data-social-link-trigger
            tabIndex={tabIndex}
            onClick={() => trackOutboundClick("https://www.linkedin.com/in/sooyeonp/", "LinkedIn")}
            className="sm:text-[calc(14*var(--text-px))] pl-2.5 pr-4 -ml-2.5 -mr-4 py-3 -my-3 !text-stone-500 dark:!text-zinc-400 hover:!text-rose-700 active:!text-rose-700 dark:hover:!text-rose-400 dark:active:!text-rose-400 motion-safe:active:scale-[0.97]"
            style={{
              transition: 'scale 150ms cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          >
            LinkedIn
          </a>
        </div>
      </div>
      <div
        className="relative isolate text-right text-[calc(14*var(--text-px))] text-stone-400 dark:text-zinc-500 font-normal font-sans [text-wrap:nowrap]"
      >
        {onGrid && <DescriptionBackdrop />}
        <span className="relative z-10">© Sue Park {new Date().getFullYear()}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const shouldAnimate = !hasVisitedHome;
  // Backwards navigation (sidebar "Home" link on a blog post): instead of the normal staggered
  // entrance, the sheet on top lifts away about its right edge, revealing this page's content
  // already sitting on the paper underneath — a page turned back. The CSS half reads the <html>
  // attribute on the first frame; this state only decides whether to mount the departing sheet,
  // which is post-hydration by nature. Shared with blog-post-layout.tsx's identical mechanism via
  // src/lib/paper-exit-transition.ts.
  const [exitEntrance, setExitEntrance] = useState(false);
  const [exitDone, setExitDone] = useState(false);
  // Starts false on both the server and the first client render (shouldAnimate is only ever false
  // after a client-side visit, which can't happen before hydration), so there's no mismatch.
  const [entranceSettled, setEntranceSettled] = useState(false);
  // Refresh: the reader is put back where they were, so the entrance sits the load out. A plain
  // boolean is enough here — unlike the case-study layout, this component unmounts on every
  // navigation away, so it can't carry the flag into another route.
  const [reloadSuppressed, setReloadSuppressed] = useState(false);

  useEffect(() => {
    // Latched once after hydration on purpose: the server can't see these signals, and the <html>
    // attributes behind them are cleared right after (below), so they can't be read during render.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (isPaperBackNav()) setExitEntrance(true);
    if (isPageReload()) setReloadSuppressed(true);
    /* eslint-enable react-hooks/set-state-in-effect */
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

  // Same handoff for the reload attribute. Nothing else clears it — the inline script that sets it
  // only runs on a full document load — so a case study opened from here would inherit it.
  useEffect(() => {
    if (reloadSuppressed) clearPageReload();
  }, [reloadSuppressed]);

  // shouldAnimate is only ever false on a client-only SPA return to home, where the entrance has
  // already played once and would otherwise replay on remount.
  const paperClass = shouldAnimate ? ` ${styles.paperEntrance}` : '';
  const riseClass = shouldAnimate ? ` ${styles.contentRise}` : '';
  const riseDelay = (delayMs: number) =>
    shouldAnimate ? { animationDelay: `${CONTENT_BASE_DELAY_MS + delayMs}ms` } : undefined;

  return (


    <div className={`font-sans w-full min-h-[100dvh] min-[640px]:min-h-screen overflow-x-clip flex flex-col${exitEntrance || reloadSuppressed || entranceSettled ? ` ${styles.noEntrance}` : ''}`}>
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
        {/* The strip of desk across the foot of the screen below 1024px. Up here rather than with
            RevealFooter so it is in the first of the HTML to arrive. See ui/reveal-footer. */}
        <RevealBand />
        {/* The reveal footer as it is seen, below 1024px: fixed to the foot of the screen, here
            before the paper so the paper slides off it rather than taking it along. Its place in
            the reading order is RevealFooter, after the paper. See ui/reveal-footer. */}
        <RevealFooterText
          className={riseClass.trim() || undefined}
          style={riseDelay(DELAY.footer)}
        >
          <HomeFooterLinks onGrid tabIndex={-1} />
        </RevealFooterText>
        {/* paper-grid-bottom: below 1024px the paper is full-bleed, so PaperGridBackground has
            nothing left to peek out of. The grid that would be composited into this element's own
            background there (globals.css) is on the reveal footer after it instead, which
            revealPaperClassName makes room for; the class stays as the hook other components find
            the paper by. */}
        <div
          className={`paper-grid-bottom ${revealPaperClassName} relative z-10 w-full flex-1 flex flex-col sheet:mt-[100px] overflow-x-clip${paperClass}`}
          style={{ backgroundColor: 'var(--paper-bg)', boxShadow: 'var(--paper-box-shadow)', marginLeft: 'var(--paper-left)', maxWidth: 'var(--paper-max-w)' }}
        >
        {/* From 1024px, the length of paper an overscroll past the end uncovers, so the sheet
            seems to run on rather than stop. See page.module.css. */}
        <div aria-hidden className={styles.paperRunout} />
        {/* Top padding on the paper: a ramp from 100px at 1200 to 140px by 1500px where --sidebar-w
            settles (40px over 300px = 13.333vw; intercept 100px - 160px = -3.75rem). It runs from the
            paper breakpoint up; across the sheet band it holds its 1200px value, 100px. Kept
            identical to the case-study paper in
            blog-post-layout.tsx so the two sheets hand off at the same height. */}
        {/* Below the paper breakpoint this is also the centring context: the column below sizes to
            its content (no `flex-1`) and `justify-center` puts the leftover viewport height half
            above it and half below. The paddings on this element stop being the content's offset
            from the top and become the *minimum* margins — once the content is taller than the
            space between them there is no leftover to share, the column pins to the top padding
            and the page scrolls as before. That is also why the whole chain up to the root stays
            min-height rather than height: nothing here can ever centre content out of reach above
            the scroll origin.

            Below 1024px the bottom minimum runs larger than the top one: 80/112px on a phone,
            120/144px from 640px. It is the paper under the dinkus before the edge the reveal footer
            comes out from, and at 64/96px it brought the footer up too close under the list; the
            extra 48px lengthens the paper and holds the footer further off without touching the
            space over the name. Where the content overruns the screen the name stays at the top
            minimum and the paper simply runs on; where it fits and is centred, the larger bottom
            minimum comes out of the leftover instead, lifting the column by half of it (24px).
            Above the breakpoint the old `pb-10` stands, since nothing is being centred there.

            At 1024px and up the sheet arrives and the layout goes back to what it was: content
            hanging from the paper's top edge with the footer pushed to the bottom. The centred
            reading works because below that width the paper is the viewport; on the floating sheet
            the top edge is the thing content should align to. */}
        <div className="flex-1 flex flex-col justify-center sheet:justify-start pt-20 min-[640px]:pt-30 sheet:pt-[100px] paper:pt-[clamp(6.25rem,calc(13.333vw_-_3.75rem),8.75rem)] pb-28 min-[640px]:pb-36 sheet:pb-10">
        {/* Centred on the viewport, measured from the paper's edge. It rides --paper-center-offset
            like the case-study column in blog-post-layout.tsx, so Home's text starts at the same x
            as a post's: there is no carousel here to centre on, but the two pages hand off to each
            other and should read as one sheet. */}
        <div className="flex flex-col sheet:flex-1 px-6 sheet:px-0 sheet:ml-[calc(50vw_-_var(--content-w)_/_2_-_var(--paper-left)_+_var(--paper-center-offset))] sheet:w-[var(--content-w)]">
        <div className="max-w-[var(--content-w)] mx-auto" data-inline-link-preview-boundary>
          {/* Left column: name */}
          {/* Below the sheet breakpoint the name tracks the viewport: the 28px phone size up to
              640px, rising to 36px by 1024px. Slope is 8px over 384px = 2.0833vw; the intercept is
              28px - 640px * 0.020833 = 14.67px. With no sheet around it the name runs larger than
              on the sheet, so where the sheet comes in at 1024px it steps down to 32px. From 1280px
              that 32px rises with the column, to ~34px by 1680px where the column stops widening
              (--text-px in globals.css). Crimson
              Pro carries a far larger x-height than the Biro Script it replaced, so it runs ~0.8x
              the old 32-40px ramp to hold the same optical size. */}
          <div>
            <h1
              className={`!mt-0 !text-[clamp(28px,calc(2.0833vw_+_14.67px),36px)] sheet:!text-[calc(32*var(--text-px))] !text-stone-700 dark:!text-zinc-200 !mb-0 md:!mb-0${riseClass}`}
              style={{
                fontFamily: 'var(--font-crimson-pro), serif',
                lineHeight: '120%',
                letterSpacing: '-0.75px',
                fontWeight: 360,
                textWrap: 'balance',
                ...riseDelay(DELAY.name),
              }}
            >
              Sue Park
            </h1>
          </div>
          {/* Right column: bio + social links */}
          {/* Steps at 640 and 1024 with the rest of the column's spacing. It used to step at 768
              instead, which left one extra narrowing of the gap partway between the phone and
              the sheet. */}
          <div className="mt-14 flex flex-col gap-5 sm:mt-16 lg:mt-18">
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

        <div className="max-w-[var(--content-w)] mx-auto w-full mt-10 sm:mt-12 lg:mt-14">
          <div className="flex flex-col gap-0.5">
            <ProjectListItem
              title="Robot Interface for Collaboration in Kitchen"
              dates="2026"
              href="/alphagrill"
              className={riseClass.trim() || undefined}
              style={riseDelay(DELAY.projectFirst)}
            />
            <ProjectListItem
              title="Building the Tools Behind Smarter Robots"
              dates="2025"
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

          {/* Chapter break: a short rule on the left margin, marking "new section" without adding a
              heading level to a page that has none. It holds at every width — this is the cue that
              carries the work/personal distinction, and dropping it on phones would leave the two
              lists running together.

              A 1px rule has almost no height of its own, so the whole break is the margins — and
              because there is no glyph to fill it, the space reads looser here than the same
              measure did around the dinkus this replaced.

              The two widths need different numbers because the rows around the rule change size.
              On desktop each row is one 40px line and rows sit 2px apart, so 16px a side (a 33px
              block) is the smallest gap that still separates. On a phone the rows are tighter, 36px
              with the year leading the title, and 12px a side (25px) keeps the break in
              proportion to them.

              The space before the interpolation is load-bearing: Tailwind's scanner reads the
              source text, and a utility glued directly to `${'${'}` is not extracted. Written as
              `sm:my-4${'${'}riseClass}` the class silently never reaches the stylesheet. */}
          <div
            aria-hidden
            className={`h-px w-4 bg-stone-400/50 dark:bg-zinc-600/50 my-3 sm:my-4 ${riseClass.trim()}`}
            style={riseDelay(DELAY.chapterBreak)}
          />

          {/* Personal work, set apart from the case studies above. The page has no headings of its
              own, so rather than introducing a section layer for a single row, three cues carry the
              distinction: the chapter break, the right-hand column naming the category alongside the
              year — which also explains why the date sequence breaks here — and the row being a
              named product rather than a descriptive project title. Worth revisiting as labelled
              "Work"/"Personal" groups once there are two or three personal projects to name.

              The two wordings are deliberate. On desktop that column is right-aligned at the end of
              a dotted rule, where "Personal, 2026" puts the word that marks the break nearest the
              title; on phones it comes before the title, in the same place every case study shows
              its year, and there it is the year alone, so the title starts where the others do.

              Carries the same `gap-0.5` as the case-study list above even though it holds a single
              row today, so a second personal project would get the same spacing as every other pair:
              titles 14px apart on phones and 18px from 640px, the gap and the rows' own padding
              (project-list-item.tsx). */}
          <div className="flex flex-col gap-0.5">
            <ProjectListItem
              title="Been There — Every Place, Stitched"
              dates="Personal, 2026"
              datesMobile="2026"
              href="https://been-there.suepark.xyz"
              className={riseClass.trim() || undefined}
              style={riseDelay(DELAY.projectPersonal)}
            />
          </div>
        </div>

        {/* End-of-content mark closing the project list, without which the column just stops. The
            mark and its optical centring live in ui/dinkus; only the slot is set here.

            Shown at every width now, like a case study's. Phones used to go without it because the
            footer followed the list closely enough to close it on its own; below 1024px the footer
            has since moved off the paper into the reveal footer, so the list would otherwise run
            straight into the paper's edge.

            No margin on the mark itself: this wrapper carries the offset from the list. On the
            sheet the footer's own top padding provides the space below; below 1024px it is the
            centring column's bottom padding, the least the paper leaves under the mark.

            On the sheet the two are set so the mark sits optically midway, measured ink to ink:
            from the last row's baseline down to the asterisks, and from the asterisks down to the
            footer's cap height. Above, the gap is this margin plus 19.6px (the asterisk's ink hangs
            well below the top of its line box); below, it is the footer's padding plus 10.4px (the
            air over its capitals). So the padding is this margin plus 9px, 48/57px, which leaves
            67.6/67.4px either side. */}
        <div className="max-w-[var(--content-w)] mx-auto w-full mt-8 lg:mt-12">
          <Dinkus className={riseClass.trim()} style={riseDelay(DELAY.endMark)} />
        </div>

        {/* The footer on the sheet. Below 1024px it moves off the paper into the reveal footer
            after it, below. */}
        <div
          className={`hidden sheet:block w-full max-w-[var(--content-w)] mx-auto mt-auto pt-[57px] ${riseClass.trim()}`}
          style={riseDelay(DELAY.footer)}
        >
          <HomeFooterLinks />
        </div>
        </div>
        </div>
        </div>

        {/* Reveal footer, below 1024px: the desk under the paper, holding the drafting grid and the
            footer row, uncovered as the paper scrolls up off it — the same footer a case study
            ends on. See ui/reveal-footer.
            It keeps the footer's own spacing, the case studies' too, so the paper comes to rest
            the same height above the screen's foot on every page and the row under it sits in the
            same place, the same distance under the edge. */}
        <RevealFooter
          className={riseClass.trim() || undefined}
          style={riseDelay(DELAY.footer)}
        >
          <HomeFooterLinks onGrid />
        </RevealFooter>

        {/* Departing sheet (backwards navigation from a blog post's sidebar "Home" link): the page
            that was open, leaving. Content is already settled underneath (page.module.css
            suppresses the entrance entirely when the back-nav attribute is present). See
            ui/paper-exit-sheet. */}
        {exitEntrance && !exitDone && <PaperExitSheet onDone={() => setExitDone(true)} />}
      </main>

    </div>
  );
}
