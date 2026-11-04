import LivePrototype from "./live-prototype";

/* The design-system component sheet (public/prototypes/design-system.html), live in place of the
   "ds-1" image. That image covered the whole 16:9 card, and so does this page, its frame filling
   the card on every card: on the 16:9 one its 1600×900 sheet, and on the 4:3 and square ones a
   layout of its own for that shape, the components moved in rather than cut down from the 16:9
   one. The card draws its own outline, so the frame is bare. */
export default function DesignSystemDemo() {
  return (
    <LivePrototype
      src="/prototypes/design-system.html?embed"
      scene="ds"
      title="Design system prototype"
      frame={{ inset: 0 }}
      bare
    />
  );
}
