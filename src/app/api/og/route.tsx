import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { fetchGameDetails } from "@/lib/fetchGameDetails";
import { GameRequirements } from "@/types";
import {
  OG,
  Constellation,
  Logo,
  Eyebrow,
  IconCPU,
  IconGPU,
  IconRAM,
  IconDisk,
  IconArrowRight,
  getOgFonts,
} from "@/lib/og";

const ICON_FOR: Record<
  string,
  (p: { size?: number; color?: string }) => JSX.Element
> = {
  CPU: IconCPU,
  GPU: IconGPU,
  RAM: IconRAM,
  Disk: IconDisk,
};

function shortenSpec(s: string | null | undefined, max = 32) {
  if (!s) return "Not listed";
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

function rowsFor(reqs: GameRequirements | null) {
  return [
    { label: "CPU", value: shortenSpec(reqs?.cpu) },
    { label: "GPU", value: shortenSpec(reqs?.gpu) },
    { label: "RAM", value: shortenSpec(reqs?.ram, 22) },
    { label: "Disk", value: shortenSpec(reqs?.storage, 22) },
  ];
}

function RequirementsColumn({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: OG.card,
        border: `1px solid ${OG.border}`,
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          padding: "14px 22px",
          fontSize: 19,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          borderBottom: `1px solid ${OG.divider}`,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "0 22px" }}>
        {rows.map((r, i) => {
          const Icon = ICON_FOR[r.label];
          return (
            <div
              key={r.label}
              style={{
                // Rows share the column height so short cards don't leave a gap at the bottom
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderTop: i === 0 ? "none" : `1px solid ${OG.divider}`,
              }}
            >
              <Icon size={18} color={OG.faint} />
              <div style={{ display: "flex", fontSize: 15, color: OG.muted, fontWeight: 600, width: 46 }}>
                {r.label}
              </div>
              <div style={{ display: "flex", fontSize: 17, color: OG.text, fontWeight: 600, flex: 1 }}>
                {r.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export async function GET(request: NextRequest) {
  const appid = request.nextUrl.searchParams.get("appid");
  if (!appid) return new Response("Missing appid", { status: 400 });

  const game = await fetchGameDetails(appid);
  if (!game) return new Response("Game not found", { status: 404 });

  const minRows = rowsFor(game.requirements.minimum);
  const recRows = rowsFor(game.requirements.recommended);
  const gameLabel =
    game.name.length > 32 ? game.name.slice(0, 30) + "…" : game.name;
  const fonts = await getOgFonts();

  return new ImageResponse(
    (
      <div
        style={{
          background: OG.bg,
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          fontFamily: "Geist, sans-serif",
          color: OG.text,
        }}
      >
        <Constellation />

        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            padding: "44px 60px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 26,
            }}
          >
            <Logo />
            <div style={{ display: "flex", fontFamily: "Geist Mono, monospace" }}>
              <Eyebrow size={14} color={OG.muted}>System requirements</Eyebrow>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 26 }}>
            {game.headerImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={game.headerImage}
                alt=""
                width={184}
                height={86}
                style={{
                  width: 184,
                  height: 86,
                  borderRadius: 4,
                  objectFit: "cover",
                  border: `1px solid ${OG.border}`,
                }}
              />
            )}
            <div
              style={{
                display: "flex",
                flex: 1,
                fontSize: 52,
                fontWeight: 800,
                letterSpacing: "-0.035em",
                lineHeight: 1.05,
              }}
            >
              Can your PC run {gameLabel}?
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "stretch", gap: 20 }}>
            <RequirementsColumn title="Minimum" rows={minRows} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  borderRadius: 4,
                  background: OG.bg,
                  border: `1px solid ${OG.border}`,
                  fontFamily: "Geist Mono, monospace",
                  fontSize: 14,
                  fontWeight: 500,
                  color: OG.muted,
                }}
              >
                VS
              </div>
            </div>

            <RequirementsColumn title="Recommended" rows={recRows} />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: OG.ink,
                color: OG.inkContent,
                fontWeight: 700,
                fontSize: 18,
                padding: "12px 20px",
                borderRadius: 4,
              }}
            >
              <div style={{ display: "flex" }}>See if your PC can run it</div>
              <IconArrowRight size={18} color={OG.inkContent} strokeWidth={2.5} />
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "Geist Mono, monospace",
                fontSize: 16,
                color: OG.faint,
              }}
            >
              doineedtoupgrade.com
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fonts.length > 0 ? fonts : undefined,
    }
  );
}
