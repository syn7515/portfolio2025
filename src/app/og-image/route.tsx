import { readFile } from "node:fs/promises";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

const biroScript = readFile(
  new URL("../../../public/fonts/BiroScript.ttf", import.meta.url),
).then(
  (font) =>
    font.buffer.slice(
      font.byteOffset,
      font.byteOffset + font.byteLength,
    ) as ArrayBuffer,
);

export async function GET() {
  const biroScriptData = await biroScript;

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          backgroundColor: "#fdfdfc",
          backgroundImage:
            "linear-gradient(to right, rgba(51, 51, 51, 0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(51, 51, 51, 0.09) 1px, transparent 1px)",
          backgroundSize: "31.5px 31.5px",
          color: "#3f3f3f",
          display: "flex",
          height: "100%",
          padding: "0 140px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Biro Script",
            fontSize: 100,
            lineHeight: 1,
            marginTop: 145,
          }}
        >
          Sue Park
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Biro Script",
          data: biroScriptData,
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
