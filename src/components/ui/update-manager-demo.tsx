import LivePrototype from "./live-prototype";

/* The update manager's release screen (public/prototypes/update-manager.html), live in place of the
   "manager-4" image, narrower than Figma's 1189 and cropped at the bottom. The page draws Figma's
   own 1px frame outline, so the frame is bare. On the 16:9 card, laid out 1060×742, it's 81% of the
   card's width, centred, 6% from the top, which shows it down to 692 of its 742: the version
   picker open under the second group, which ends at 676, whole. On the 4:3 card, where the page lays it out 994×742 (its
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
      frame={{ top: "calc(34.000cqh - 15.750cqw)", left: "calc(13.333cqh + 2.000cqw)", width: "calc(37.333cqh + 60.000cqw)", height: "calc(47.947cqh + 29.730cqw)" }}
      squareFrame={{ top: 0, left: 0, width: "100%", height: "100%" }}
      bare
    />
  );
}
