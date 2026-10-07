import LivePrototype from "./live-prototype";

/* The design-system component sheet (public/prototypes/design-system.html), live in place of the
   "ds-1" image. That image covered the whole 16:9 card, and so does this 1600×900 page; the card
   draws its own outline, so the frame is bare. */
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
