import LivePrototype from "./live-prototype";

/* The Partner PayOnline billing portal (public/prototypes/athena-portal.html), live in place of the
   "athena-1" (home) and "athena-2" (messages) images. Each covered the whole 16:9 card, sky-blue
   backdrop and all, and so does this 1600×900 page, in a frame filling the card. On the 4:3 phone
   card the page crops its backdrop's sides instead, so the portal comes out a fifth larger, 92% of
   the card's width. The card draws its own outline, so the frame is bare. */
export default function AthenaPortalDemo({ scene = "home" }: { scene?: "home" | "messages" }) {
  return (
    <LivePrototype
      src={`/prototypes/athena-portal.html?embed&scene=${scene}`}
      scene={scene}
      title="Billing portal prototype"
      frame={{ inset: 0 }}
      bare
    />
  );
}
