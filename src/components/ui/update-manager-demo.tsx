import LivePrototype from "./live-prototype";

/* The update manager's release screen (public/prototypes/update-manager.html), live in place of the
   "manager-4" image. It sits where that image was drawn: 95% of the card's height, centred, 10% from
   the top, cropped at the bottom. The page draws Figma's own 1px frame outline, so the frame is bare. */
export default function UpdateManagerDemo() {
  return (
    <LivePrototype
      src="/prototypes/update-manager.html?embed"
      scene="manager"
      title="Update manager prototype"
      frame={{ top: "10%", left: "50%", transform: "translateX(-50%)", height: "95cqh", width: `${(95 * 1189) / 742}cqh` }}
      bare
    />
  );
}
