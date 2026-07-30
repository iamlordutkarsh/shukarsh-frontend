import { ImageResponse } from "next/og";

export const alt = "Shukarsh — small-batch kitchen finds, soft clothing and press-on nails";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The card that shows when the shop is shared.
 *
 * Without one, a WhatsApp forward or an Instagram bio link is a bare grey link
 * with no picture, which for a shop nobody has heard of is a click lost before
 * the page ever loads.
 *
 * Drawn in code rather than exported from a design tool, so it cannot drift out of
 * date and there is no binary to keep in the repository. It uses the palette from
 * globals.css by hand: ImageResponse has no access to Tailwind, and hardcoding the
 * six colours the card actually uses is honest about that rather than pretending
 * the two stay in sync.
 *
 * The default typeface is deliberate. Matching Fraunces would mean either fetching
 * a font over the network at build time, which can fail a deploy for a picture, or
 * committing a binary. Neither is worth it for one image.
 *
 * Nothing here states a price or a delivery promise. This file is generated once
 * at build and cached by every platform that scrapes it, so anything written on it
 * has to stay true for a long time.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          backgroundColor: "#fbf8ff",
          // Linear only. Satori renders an elliptical radial-gradient as a grey
          // smudge, which on a pastel card looks like a broken image rather than a
          // soft wash, so the depth comes from plain circles below instead.
          backgroundImage: "linear-gradient(155deg, #f7f3ff 0%, #fffbf4 54%, #ffeade 100%)",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -300,
            left: -240,
            width: 560,
            height: 560,
            borderRadius: "50%",
            backgroundColor: "#ede5ff",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -320,
            right: -250,
            width: 600,
            height: 600,
            borderRadius: "50%",
            backgroundColor: "#ffeade",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 96,
            right: 132,
            width: 132,
            height: 132,
            borderRadius: "50%",
            backgroundColor: "#ffe7f0",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 118,
            left: 128,
            width: 76,
            height: 76,
            borderRadius: "50%",
            backgroundColor: "#dccdff",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "10px 26px",
            borderRadius: 999,
            backgroundColor: "#ffffff",
            color: "#5b3ad0",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#ff6fa3" }} />
          Made small batch
        </div>

        <div
          style={{
            marginTop: 34,
            fontSize: 148,
            fontWeight: 800,
            letterSpacing: -6,
            color: "#241c3b",
          }}
        >
          Shukarsh
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 42,
            color: "#3b3159",
            textAlign: "center",
            maxWidth: 880,
          }}
        >
          Kitchen, clothing &amp; press-on nails
        </div>

        <div
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 26,
            color: "#6b6188",
          }}
        >
          <div>Pastel finds</div>
          <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#a88dff" }} />
          <div>Tracked delivery across India</div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: 12,
            backgroundImage: "linear-gradient(90deg, #8b6bff 0%, #ff93b8 52%, #ff9f74 100%)",
          }}
        />
      </div>
    ),
    size
  );
}
