import { ImageResponse } from "next/og";
import { OG, LogoMark, Wordmark, getOgFonts } from "@/lib/og";
import { SPLASH_SCREENS } from "@/lib/splashScreens";

// Rendered once at build time for each size in SPLASH_SCREENS; anything else 404s
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return SPLASH_SCREENS.map(({ file }) => ({ file }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const screen = SPLASH_SCREENS.find((s) => s.file === file);
  if (!screen) return new Response("Not found", { status: 404 });

  const { width, height } = screen;
  // Scale everything off the short side so phones and iPads (either orientation) look the same
  const unit = Math.min(width, height);
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
          background: OG.bg,
          fontFamily: "Geist, sans-serif",
        }}
      >
        <LogoMark size={Math.round(unit * 0.24)} />
        <Wordmark fontSize={Math.round(unit * 0.058)} />
      </div>
    ),
    {
      width,
      height,
      fonts: fonts.length > 0 ? fonts : undefined,
    }
  );
}
