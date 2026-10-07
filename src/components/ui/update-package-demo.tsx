import LivePrototype from "./live-prototype";

/* The update manager's package picker on desktop and phone (public/prototypes/update-package.html),
   live in place of the "manager-5" image. It sits where that image was drawn: 108% of the card's
   height, centred, 9% from the top, cropped at the bottom. The page draws its own frames, so the
   frame is bare. */
export default function UpdatePackageDemo() {
  return (
    <LivePrototype
      src="/prototypes/update-package.html?embed"
      scene="package"
      title="Update package prototype"
      frame={{ top: "9%", left: "50%", transform: "translateX(-50%)", height: "108cqh", width: `${(108 * 1042) / 918}cqh` }}
      bare
    />
  );
}
