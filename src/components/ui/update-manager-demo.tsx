import LivePrototype from "./live-prototype";

/* The update manager's release screen (public/prototypes/update-manager.html), live in place of the
   "manager-4" image. It sits where that image was drawn: 95% of the card's height, centred, 10% from
   the top, cropped at the bottom. The page draws Figma's own 1px frame outline, so the frame is bare.
   On the square phone card it's 91%, as small as it gets while the card's bottom still cuts it; any
   larger and the sides lose the title on the left or the open version list on the right. */
export default function UpdateManagerDemo() {
  return (
    <LivePrototype
      src="/prototypes/update-manager.html?embed"
      scene="manager"
      title="Update manager prototype"
      frame={{ top: "10%", left: "50%", transform: "translateX(-50%)", height: "95cqh", width: `${(95 * 1189) / 742}cqh` }}
      squareFrame={{ height: "91cqh", width: `${(91 * 1189) / 742}cqh` }}
      bare
    />
  );
}
