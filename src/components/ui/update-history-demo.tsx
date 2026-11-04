import LivePrototype from "./live-prototype";

/* The update manager's release history (public/prototypes/update-history.html), live in place of
   the "manager-6" image, cropped at the bottom. The page draws Figma's own outline, so the frame is
   bare. On the 16:9 card it sits where that image was drawn: 95% of the card's height, centred, 10%
   from the top. On the 4:3 card, where the page lays it out 940px across with narrower release
   columns (its .compact), its top-left corner sits 12% in from the card's top and left, as the
   firmware editor's does, at 105% of the card's height, running past its right edge and foot. Each
   side takes the line through both aspects, a·cqh + b·cqw, which lands on each at its aspect.
   On the square phone card the frame takes the whole card and the page frames the screen itself,
   so it can move in on what the pointer's doing and back out (its place()). */
export default function UpdateHistoryDemo() {
  return (
    <LivePrototype
      src="/prototypes/update-history.html?embed"
      scene="history"
      title="Update history prototype"
      frame={{ top: "calc(18.000cqh - 4.500cqw)", left: "calc(25.205cqh - 6.904cqw)", width: "calc(66.790cqh + 47.883cqw)", height: "calc(135.000cqh - 22.500cqw)" }}
      squareFrame={{ top: 0, left: 0, width: "100%", height: "100%" }}
      bare
    />
  );
}
