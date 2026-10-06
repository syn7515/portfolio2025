import type { CSSProperties, ReactNode } from "react";

/* Live recreation of the "ds-2" Figma frame: the button with and without an icon, each beside a
   copy that paints its padding in red. Everything is sized in em off a font-size tied to the card
   width (cqw), so the composition scales with the card like the image it replaces did. Figma's
   text is 64 units in a ~1724-unit frame, hence 64/1724 ≈ 3.71cqw; the em values below are the
   Figma numbers divided by 64. */

const vars = {
  "--ds-btn-bg": "#ffffff",
  "--ds-btn-border": "#e7e5e4", // stone-200
  // The annotated copies sit back a step, so their outline is lighter than the real buttons'.
  "--ds-pad-border": "rgb(253 164 175 / 0.45)", // rose-300
  "--ds-btn-text": "#57534e", // stone-600
  "--ds-btn-ghost-text": "rgb(244 63 94 / 0.3)", // rose-500
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
  background: "var(--ds-btn-bg)",
};
// Diagonal hatch laid over the solid scrim. It tiles a fixed square (sized in em, so it scales with
// the card) rather than stretching across each box, so two touching padded areas can line their
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
const label = "whitespace-nowrap font-medium";
const labelStyle: CSSProperties = { lineHeight: 1.4286 };

function Button({ icon }: { icon?: boolean }) {
  return (
    <span
      className={frame}
      style={{ ...frameStyle, paddingInline: "0.5714em", borderColor: "var(--ds-btn-border)", color: "var(--ds-btn-text)" }}
    >
      {icon && <Plus style={{ width: "1.1429em", height: "1.1429em" }} strokeWidth={1.5} aria-hidden />}
      <span className={label} style={{ ...labelStyle, paddingInline: "0.2857em" }}>Button</span>
    </span>
  );
}

function AnnotatedButton({ icon }: { icon?: boolean }) {
  // The text wrap sits after the outer padding (and the icon, when there is one). The label's
  // line-height makes it as tall as the outer box, so only x needs offsetting.
  const wrapOffset = icon ? "calc(0.5714em + 1.1429em)" : "0.5714em";
  const text: ReactNode = (
    <span className="flex" style={{ paddingInline: "0.2857em", ...hatch("var(--ds-pad-inner)", wrapOffset, "var(--ds-pad-stripe-light)") }}>
      <span className={label} style={{ ...labelStyle, background: "var(--ds-btn-bg)", color: "var(--ds-btn-ghost-text)" }}>
        Button
      </span>
    </span>
  );
  return (
    <span className={frame} style={{ ...frameStyle, borderColor: "var(--ds-pad-border)" }}>
      <span className="flex items-center" style={{ paddingInline: "0.5714em", ...hatch("var(--ds-pad-outer)") }}>
        <span className="flex items-center" style={{ background: "var(--ds-btn-bg)" }}>
          {icon && (
            <Plus
              style={{ width: "1.1429em", height: "1.1429em", color: "var(--ds-btn-ghost-text)" }}
              strokeWidth={1.5}
              aria-hidden
            />
          )}
          {text}
        </span>
      </span>
    </span>
  );
}

export default function DsButtonPadding() {
  return (
    <div className="ds-button-padding w-full h-full [container-type:size]" style={vars} aria-hidden>
      <div
        className="w-full h-full grid place-content-center justify-items-center items-center"
        style={{ fontSize: "3.71cqw", gridTemplateColumns: "auto auto", columnGap: "1.4em", rowGap: "0.65em" }}
      >
        <Button icon />
        <AnnotatedButton icon />
        <Button />
        <AnnotatedButton />
      </div>
    </div>
  );
}
