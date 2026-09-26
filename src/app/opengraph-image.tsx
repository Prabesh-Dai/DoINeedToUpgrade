import { ImageResponse } from "next/og";
import {
  OG,
  Constellation,
  Logo,
  Eyebrow,
  IconCheck,
  IconCPU,
  IconGPU,
  IconRAM,
  IconDisk,
  StatusCheck,
  getOgFonts,
} from "@/lib/og";

export const alt = "Do I Need To Upgrade. Check if your PC can run any Steam game.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SPEC_ROWS = [
  { Icon: IconCPU, label: "CPU", value: "i7-12700K" },
  { Icon: IconGPU, label: "GPU", value: "RTX 4070" },
  { Icon: IconRAM, label: "RAM", value: "32 GB" },
  { Icon: IconDisk, label: "Disk", value: "70 GB free" },
];

export default async function Image() {
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
            padding: "56px 64px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Logo />

          <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
            {/* Headline */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  color: OG.muted,
                  fontWeight: 500,
                  marginBottom: 14,
                }}
              >
                Before you buy that GPU…
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  fontSize: 84,
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                <div style={{ display: "flex", color: OG.muted }}>Do I Need To</div>
                <div style={{ display: "flex", color: OG.text }}>Upgrade?</div>
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  color: "#D4D4D8",
                  marginTop: 22,
                  lineHeight: 1.4,
                  maxWidth: 460,
                }}
              >
                Compare your PC against any Steam game&apos;s requirements, instantly.
              </div>
            </div>

            {/* Sample result, styled like the results screen */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: 500,
                background: OG.card,
                border: `1px solid ${OG.border}`,
                borderRadius: 6,
                overflow: "hidden",
                boxShadow: "0 30px 80px -24px rgba(0,0,0,0.7)",
              }}
            >
              {/* Game + FPS */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "18px 20px",
                  borderBottom: `1px solid ${OG.divider}`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1091500/header.jpg"
                  alt=""
                  width={120}
                  height={56}
                  style={{ width: 120, height: 56, borderRadius: 4, objectFit: "cover" }}
                />
                <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 4 }}>
                  <Eyebrow size={11}>Results for</Eyebrow>
                  <div style={{ display: "flex", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>
                    Cyberpunk 2077
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 2,
                    paddingLeft: 18,
                    borderLeft: `1px solid ${OG.border}`,
                  }}
                >
                  <Eyebrow size={11}>Est. FPS</Eyebrow>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>84</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: OG.faint }}>fps</span>
                  </div>
                </div>
              </div>

              {/* Verdict */}
              <div style={{ display: "flex", height: 3, background: OG.success }} />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 20px",
                  borderBottom: `1px solid ${OG.divider}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 40,
                    height: 40,
                    borderRadius: 4,
                    background: OG.success,
                  }}
                >
                  <IconCheck size={24} color={OG.successContent} strokeWidth={3} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Eyebrow size={11}>Ready to play</Eyebrow>
                  <div style={{ display: "flex", fontSize: 19, fontWeight: 700, letterSpacing: "-0.015em" }}>
                    You&apos;re good to go. No upgrade needed!
                  </div>
                </div>
              </div>

              {/* Components */}
              <div style={{ display: "flex", flexDirection: "column", padding: "8px 20px 12px" }}>
                {SPEC_ROWS.map(({ Icon, label, value }, i) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "9px 0",
                      borderTop: i === 0 ? "none" : `1px solid ${OG.divider}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, width: 86 }}>
                      <Icon size={18} color={OG.faint} />
                      <div style={{ display: "flex", fontSize: 15, fontWeight: 600, color: OG.muted }}>{label}</div>
                    </div>
                    <div style={{ display: "flex", flex: 1, fontSize: 16, fontWeight: 600 }}>{value}</div>
                    <StatusCheck size={20} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: "Geist Mono, monospace",
              fontSize: 18,
              color: OG.faint,
              letterSpacing: "0.02em",
            }}
          >
            doineedtoupgrade.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    }
  );
}
