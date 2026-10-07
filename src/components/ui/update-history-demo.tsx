import LivePrototype from "./live-prototype";

/* The update manager's release history (public/prototypes/update-history.html), live in place of
   the "manager-6" image. It sits where that image was drawn: 95% of the card's height, centred, 10%
   from the top, cropped at the bottom. The page draws Figma's own outline, so the frame is bare. */
export default function UpdateHistoryDemo() {
  return (
    <LivePrototype
      src="/prototypes/update-history.html?embed"
      scene="history"
      title="Update history prototype"
      frame={{ top: "10%", left: "50%", transform: "translateX(-50%)", height: "95cqh", width: `${(95 * 1057) / 661}cqh` }}
      bare
    />
  );
}
