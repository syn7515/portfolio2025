import LivePrototype from "./live-prototype";

/* The design-system component sheet (public/prototypes/design-system.html), live in place of the
   "ds-1" image. That image covered the whole 16:9 card, and so does this 1600×900 page, in a 16:9
   frame the card's height tall. The 4:3 phone card crops its sides, so the sheet comes out a third
   larger there rather than letterboxed. The card draws its own outline, so the frame is bare. */
export default function DesignSystemDemo() {
  return (
    <LivePrototype
      src="/prototypes/design-system.html?embed"
      scene="ds"
      title="Design system prototype"
      frame={{ top: 0, left: "50%", transform: "translateX(-50%)", height: "100cqh", width: `${(100 * 16) / 9}cqh` }}
      bare
    />
  );
}
