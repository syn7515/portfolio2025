import LivePrototype from "./live-prototype";

/* The update manager's release screen (public/prototypes/update-manager.html), live in place of the
   "manager-4" image, narrower than Figma's 1189 and cropped at the bottom. The page draws Figma's
   own 1px frame outline, so the frame is bare. On the 16:9 card, laid out 1060×742, it keeps a
   7.185% left margin and grows until the table's right edge, 20px short of 994 of its 1060, meets
   the card's, so the empty right of the screen goes past it (98.978% of the card's width), 6% from
   the top so the last group stays in. On the 4:3 card, where the page lays it out 994×742 (its
   .compact), it runs to the card's right edge from 12% in, 13% from the top, so it still runs past
   the foot. Each side takes the line through both aspects, a·cqh + b·cqw, which lands on each at
   its aspect.
   The page plays on a loop, picking versions in the "This release" column on the right. On the
   square phone card the frame takes the whole card and the page frames the screen itself, so it can
   move in on what the pointer's doing and back out (its place()). */

export default function UpdateManagerDemo() {
  return (
    <LivePrototype
      src="/prototypes/update-manager.html?embed"
      scene="manager"
      title="Update manager prototype"
      frame={{ top: "calc(34.000cqh - 15.750cqw)", left: "calc(25.680cqh - 7.260cqw)", width: "calc(-58.548cqh + 131.911cqw)", height: "calc(-19.170cqh + 80.067cqw)" }}
      squareFrame={{ top: 0, left: 0, width: "100%", height: "100%" }}
      bare
    />
  );
}
