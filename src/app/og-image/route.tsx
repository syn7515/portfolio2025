import { readFile } from "node:fs/promises";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

// Satori cannot read the woff2 that next/font/google caches for Crimson Pro — it rejects the file
// outright ("Unsupported OpenType signature wOF2") — so the social card carries its own copy.
//
// It has to be a *static* instance. The variable CrimsonPro[wght].ttf parses far enough to be
// accepted and then dies mid-render ("Cannot read properties of undefined (reading '256')"), so
// this is the weight-400 static cut. The site sets 360, which no static instance can express; 400
// is the nearest one and the difference is invisible at this size.
const crimsonPro = readFile(
  new URL("../../../public/fonts/CrimsonPro-Regular.ttf", import.meta.url),
).then(
  (font) =>
    font.buffer.slice(
      font.byteOffset,
      font.byteOffset + font.byteLength,
    ) as ArrayBuffer,
);

export async function GET() {
  const crimsonProData = await crimsonPro;

  return new ImageResponse(
    (
      // The card is the site's own paper sheet, tilted, on the same grid the pages sit on. The
      // geometry below is measured off the shipped og-image-cd63c326.png rather than invented, so
      // the generated card lands on the existing composition instead of a new one: the sheet's top
      // edge rises 15px per 200px across, putting its top-left corner at (176, 97) and its
      // top-right at (1079, 165) — 906px wide along its own axis, running off the bottom. That
      // slope works out to 4.289deg; 4.44deg is what was left in because it is what measured
      // closest once rendered, and the two differ by about 2px across the whole sheet. The padding
      // is likewise set so the name's ink starts exactly where the old card's did (x=259, centred
      // on y=253) rather than at a round number. Crimson Pro sets narrower than the Biro Script it
      // replaced, so the name is shorter than before — only its start is held.
      <div
        style={{
          backgroundColor: "#fdfdfc",
          backgroundImage:
            "linear-gradient(to right, rgba(51, 51, 51, 0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(51, 51, 51, 0.09) 1px, transparent 1px)",
          backgroundSize: "31.5px 31.5px",
          color: "#3f3f3f",
          display: "flex",
          height: "100%",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            backgroundColor: "#ffffff",
            boxShadow: "0 20px 60px rgba(41, 37, 36, 0.10)",
            display: "flex",
            height: 620,
            left: 176,
            paddingLeft: 91,
            paddingTop: 94,
            position: "absolute",
            top: 97,
            transform: "rotate(4.44deg)",
            transformOrigin: "top left",
            width: 906,
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "Crimson Pro",
              fontSize: 80,
              // -2px is -0.025em at this size, the same -2.5% the name and the case-study titles
              // use. Stated in px because Satori resolves em letter-spacing inconsistently.
              letterSpacing: -2,
              lineHeight: 1,
            }}
          >
            Sue Park
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Crimson Pro",
          data: crimsonProData,
          style: "normal",
          weight: 400,
        },
      ],
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=31536000, immutable",
      },
    },
  );
}
