"use client";

import { useEffect, useState, type CSSProperties } from "react";

/* Live recreation of the "ds-2" Figma frame: the button with and without an icon, each beside a
   copy that paints its padding in red. Everything is sized in em off a font-size tied to the card
   height (cqh), so the composition scales with the card like the image it replaces did, and comes
   out a third larger on the 4:3 phone card. Figma's text is 64 units in a ~1724-unit frame, hence
   64/1724 ≈ 3.71% of the 16:9 card's width, 16/9 of that in cqh; the em values below are the Figma
   numbers divided by 64.

   The card plays the frame as one button at its centre, taking the four in turn counter-clockwise
   from the bottom left: it shows its padding, makes room for an icon, puts the padding away, then
   lets the icon go and is the plain button again. With reduced motion the still frame shows
   instead. */

const vars = {
  "--ds-btn-bg": "#ffffff",
  "--ds-btn-border": "#e7e5e4", // stone-200
  "--ds-btn-text": "#57534e", // stone-600
  // The annotated copies' label, icon and outline: a pale grey, leaving the rose to the padding.
  "--ds-btn-ghost-text": "#d6d3d1", // stone-300
  "--ds-caption-text": "#a8a29e", // stone-400
  "--ds-pad-outer": "rgb(244 63 94 / 0.3)",
  "--ds-pad-inner": "rgb(244 63 94 / 0.15)",
  "--ds-pad-stripe": "rgb(225 29 72 / 0.35)",
  "--ds-pad-stripe-light": "rgb(225 29 72 / 0.18)",
} as CSSProperties;

// Lucide's plus drawn as one path: lucide-react draws it as two, so with a translucent stroke the
// centre where they cross was painted twice and showed darker. A single path's stroke paints once.
function Plus({ style, strokeWidth = 2 }: { style?: CSSProperties; strokeWidth?: number; "aria-hidden"?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" style={style} aria-hidden>
      <path d="M5 12h14M12 5v14" />
    </svg>
  );
}

const frame = "inline-flex items-center justify-center overflow-hidden border-solid";
const frameStyle: CSSProperties = {
  borderWidth: "0.0714em",
  borderRadius: "0.4286em",
  minWidth: "4.5714em",
  paddingBlock: "0.32em",
};
// Diagonal hatch laid over a translucent scrim. It tiles a fixed square (sized in em, so it scales
// with the card) rather than stretching across each box, so two touching padded areas can line their
// stripes up: the inner one shifts its tiles back by its distance from the outer box's left edge.
// A square tile's diagonal holds two stripes, so the pitch is HATCH_TILE/√2 ≈ 0.16em.
const HATCH_TILE = "0.2263em";
const HATCH_LINE = "0.5px";
const hatch = (fill: string, offsetX = "0em", stripe = "var(--ds-pad-stripe)") => ({
  backgroundImage: `linear-gradient(-45deg, ${stripe} 0 ${HATCH_LINE}, transparent ${HATCH_LINE} 50%, ${stripe} 50% calc(50% + ${HATCH_LINE}), transparent calc(50% + ${HATCH_LINE}))`,
  backgroundSize: `${HATCH_TILE} ${HATCH_TILE}`,
  backgroundPosition: `calc(-1 * ${offsetX}) 0`,
  backgroundColor: fill,
});
// Shows a layer only on its padding, its content box cut out, so the hatch marks the padding with
// nothing opaque laid on top to hide the rest of it, and the button's fill can go.
const paddingOnly = (padding: string): CSSProperties => ({
  paddingInline: padding,
  maskImage: "linear-gradient(#000 0 0), linear-gradient(#000 0 0)",
  maskClip: "padding-box, content-box",
  maskComposite: "exclude",
});
const label = "whitespace-nowrap font-medium";
const labelStyle: CSSProperties = { lineHeight: 1.4286 };

// The frame's buttons in the order the button takes them, counter-clockwise from the bottom left:
// the right column shows the padding, the top row has the icon, so each step changes one thing.
// Captioned with the button's name, or with its side paddings while they show, in px at the design
// system's 14px text: 12 either side without the icon (8 outside, 4 round the label), and 8 before
// one, whose glyph sits inset in its box and makes up the rest.
const STEPS = [
  { padding: false, icon: false, caption: "button" },
  { padding: true, icon: false, caption: "padding 12 · 12" },
  { padding: true, icon: true, caption: "padding 8 · 12" },
  { padding: false, icon: true, caption: "button with icon" },
];
const MORPH_MS = 700;
const STEP_MS = 2100;
const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";

// Which step the button is on, on the wall clock, so the lightbox's copy of the card is on the same
// one. It eases only from the step before: on the first tick, or after a background tab let some
// pass unseen, it's set there.
function useStep() {
  const [clock, setClock] = useState({ step: 0, animate: false });
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let first = true;
    const tick = () => {
      const now = Date.now();
      const step = Math.floor(now / STEP_MS) % STEPS.length;
      const placed = first;
      first = false;
      setClock((prev) =>
        step === prev.step && !placed
          ? prev
          : { step, animate: !placed && step === (prev.step + 1) % STEPS.length },
      );
      timer = setTimeout(tick, STEP_MS - (now % STEP_MS));
    };
    tick();
    return () => clearTimeout(timer);
  }, []);
  return clock;
}

const ease = (props: string[], duration = MORPH_MS, delay = 0) =>
  props.map((p) => `${p} ${duration}ms ${EASE} ${delay}ms`).join(", ");

// The frame's button, with or without its icon, plain or with its padding shown, and able to go
// from one to the next: the padding's hatching sits on layers that fade, and the icon in a slot that
// opens. The text wrap sits after the outer padding and the slot; its label's line-height makes it
// as tall as the outer box, so its hatch's tiles only shift in x, with the slot (same timing), to
// stay lined up with the outer one's.
function Button({ icon = false, padding = false, animate = false }: { icon?: boolean; padding?: boolean; animate?: boolean }) {
  const t = (value: string) => (animate ? value : "none");
  const fade = t(ease(["opacity"]));
  const ink = padding ? "var(--ds-btn-ghost-text)" : "var(--ds-btn-text)";
  // Opening, the slot widens first and the icon comes in once there's room; closing, the icon goes
  // first and the slot shuts behind it.
  const slot: [number, number] = icon ? [MORPH_MS, 0] : [MORPH_MS * 0.75, MORPH_MS * 0.25];
  const glyph: [number, number] = icon ? [MORPH_MS * 0.6, MORPH_MS * 0.4] : [MORPH_MS * 0.5, 0];
  const wrapOffset = icon ? "calc(0.5714em + 1.1429em)" : "0.5714em";
  return (
    <span
      className={frame}
      style={{
        ...frameStyle,
        // With its padding shown, the button is an outline: its fill goes with the rest of its ink.
        backgroundColor: padding ? "transparent" : "var(--ds-btn-bg)",
        borderColor: padding ? ink : "var(--ds-btn-border)",
        transition: t(ease(["background-color", "border-color"])),
      }}
    >
      <span className="relative flex items-center" style={{ paddingInline: "0.5714em" }}>
        <span
          className="absolute inset-0"
          style={{ ...hatch("var(--ds-pad-outer)"), ...paddingOnly("0.5714em"), opacity: padding ? 1 : 0, transition: fade }}
        />
        <span className="relative flex items-center">
          <span
            className="flex justify-center overflow-hidden"
            style={{ width: icon ? "1.1429em" : 0, transition: t(ease(["width"], ...slot)) }}
          >
            <Plus
              style={{
                width: "1.1429em",
                height: "1.1429em",
                flexShrink: 0,
                color: ink,
                opacity: icon ? 1 : 0,
                scale: icon ? 1 : 0.6,
                transition: t(`${ease(["opacity", "scale"], ...glyph)}, ${ease(["color"])}`),
              }}
              strokeWidth={1.5}
              aria-hidden
            />
          </span>
          <span className="relative flex" style={{ paddingInline: "0.2857em" }}>
            <span
              className="absolute inset-0"
              style={{
                ...hatch("var(--ds-pad-inner)", wrapOffset, "var(--ds-pad-stripe-light)"),
                ...paddingOnly("0.2857em"),
                opacity: padding ? 1 : 0,
                transition: t(`${ease(["opacity"])}, ${ease(["background-position"], ...slot)}`),
              }}
            />
            <span className={`${label} relative`} style={{ ...labelStyle, color: ink, transition: t(ease(["color"])) }}>
              Button
            </span>
          </span>
        </span>
      </span>
    </span>
  );
}

export default function DsButtonPadding() {
  const { step, animate } = useStep();
  const { padding, icon } = STEPS[step];
  return (
    <div className="ds-button-padding w-full h-full [container-type:size]" style={vars} aria-hidden>
      <div className="w-full h-full grid place-items-center" style={{ fontSize: `${(3.71 * 16) / 9}cqh` }}>
        <div
          className="[grid-area:1/1] grid justify-items-center items-center motion-safe:hidden"
          style={{ gridTemplateColumns: "auto auto", columnGap: "1.4em", rowGap: "0.65em" }}
        >
          <Button icon />
          <Button icon padding />
          <Button />
          <Button padding />
        </div>
        {/* Centred in the card, so it opens and shuts about its middle; the caption hangs below. Its
            texts share one cell so one can fade out before the next fades in, quickly and in
            opacity alone, leaving the motion to the button. */}
        <div className="[grid-area:1/1] relative flex motion-reduce:hidden">
          <Button padding={padding} icon={icon} animate={animate} />
          <span
            className="absolute left-1/2 top-full -translate-x-1/2 grid font-mono whitespace-nowrap"
            style={{ fontSize: "0.5em", marginTop: "1.25em", color: "var(--ds-caption-text)" }}
          >
            {STEPS.map(({ caption }, i) => (
              <span
                key={caption}
                className="[grid-area:1/1] text-center"
                style={{
                  opacity: i === step ? 1 : 0,
                  transition: !animate ? "none" : i === step ? ease(["opacity"], 200, 150) : ease(["opacity"], 150),
                }}
              >
                {caption}
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
