import { readFileSync } from "fs";
import path from "path";
import { ImageResponse } from "next/og";
import { Wordmark, getOgFonts } from "@/lib/og";
import { SPLASH_SCREENS, SplashScheme } from "@/lib/splashScreens";

// Rendered once at build time for each entry in SPLASH_SCREENS; anything else 404s
export const dynamic = "force-static";
export const dynamicParams = false;

// The app icon itself (same art as public/icon-512.png), so launch shows what was tapped.
// It's dark in both schemes: bold on light, and its lighter gradient still separates it on dark.
const TILE = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "src", "app", "splash", "assets", "tile.png")).toString("base64")}`;

// base-200 / muted / base-content from the light and dark themes in tailwind.config.js
const COLORS: Record<SplashScheme, { bg: string; muted: string; text: string }> = {
  light: { bg: "#F4F4F5", muted: "#71717A", text: "#18181B" },
  dark: { bg: "#0E0E10", muted: "#A1A1AA", text: "#EDEDEF" },
};

export function generateStaticParams() {
  return SPLASH_SCREENS.map(({ file }) => ({ file }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const screen = SPLASH_SCREENS.find((s) => s.file === file);
  if (!screen) return new Response("Not found", { status: 404 });

  const { width, height, scheme } = screen;
  const colors = COLORS[scheme];
  // Scale everything off the short side so phones and iPads (either orientation) look the same
  const unit = Math.min(width, height);
  const tileSize = Math.round(unit * 0.26);
  const fonts = await getOgFonts();

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
          gap: Math.round(unit * 0.07),
          background: colors.bg,
          fontFamily: "Geist, sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={TILE} alt="" width={tileSize} height={tileSize} style={{ width: tileSize, height: tileSize }} />
        <Wordmark fontSize={Math.round(unit * 0.058)} muted={colors.muted} text={colors.text} />
      </div>
    ),
    {
      width,
      height,
      fonts: fonts.length > 0 ? fonts : undefined,
    }
  );
}
