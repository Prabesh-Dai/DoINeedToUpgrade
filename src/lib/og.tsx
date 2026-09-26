import { readFileSync } from "fs";
import path from "path";

const W = 1200;
const H = 630;

// Colors from the dark theme in tailwind.config.js
export const OG = {
  bg: "#0E0E10",
  card: "#161618",
  border: "rgba(237,237,239,0.10)",
  divider: "rgba(237,237,239,0.07)",
  text: "#EDEDEF",
  muted: "#A1A1AA",
  faint: "#71717A",
  ink: "#F4F4F5",
  inkContent: "#0E0E10",
  success: "#30A46C",
  successContent: "#06140D",
  warning: "#F5A524",
  error: "#E5484D",
};

// Monochrome logo (public/logo.svg), recolored for the dark background.
// Only the tile is filled; the glyph is a mask cut-out, so it shows the card/page behind it.
const logoSvg = readFileSync(path.join(process.cwd(), "public", "logo.svg"), "utf8")
  .replace('<path fill="#000" mask=', `<path fill="${OG.text}" mask=`);
const LOGO_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(logoSvg).toString("base64")}`;

type LoadedFont = {
  name: string;
  data: ArrayBuffer;
  weight: 500 | 600 | 700 | 800;
  style: "normal";
};

const FONT_FAMILIES: { name: string; query: string }[] = [
  { name: "Geist", query: "Geist:wght@500;600;700;800" },
  { name: "Geist Mono", query: "Geist+Mono:wght@500" },
];

async function fetchOgFonts(): Promise<LoadedFont[]> {
  // Without a modern browser UA, Google Fonts serves truetype (TTF), which
  // Satori decodes natively. A Chrome/Safari UA would return woff2, which the
  // bundled Satori in this Next.js version can't decode.
  const css = await fetch(
    `https://fonts.googleapis.com/css2?${FONT_FAMILIES.map((f) => `family=${f.query}`).join("&")}`
  ).then((r) => r.text());

  const out: LoadedFont[] = [];
  for (const block of css.split("@font-face").slice(1)) {
    const family = block.match(/font-family:\s*'([^']+)'/)?.[1];
    const weight = parseInt(block.match(/font-weight:\s*(\d+)/)?.[1] ?? "", 10);
    const url = block.match(
      /src:\s*url\((https:\/\/[^)]+)\)\s*format\('(?:truetype|opentype)'\)/
    )?.[1];
    if (!family || !url || ![500, 600, 700, 800].includes(weight)) continue;
    const data = await fetch(url).then((r) => r.arrayBuffer());
    out.push({ name: family, data, weight: weight as LoadedFont["weight"], style: "normal" });
  }
  return out;
}

let _ogFontsCache: Promise<LoadedFont[]> | null = null;
export function getOgFonts(): Promise<LoadedFont[]> {
  if (!_ogFontsCache) {
    _ogFontsCache = fetchOgFonts().catch((err) => {
      console.error("[og] font load failed:", err);
      _ogFontsCache = null;
      return [] as LoadedFont[];
    });
  }
  return _ogFontsCache;
}

type Point = { x: number; y: number };
type Line = { x1: number; y1: number; x2: number; y2: number; a: number };

function buildNetwork(w: number, h: number, density: number, connect: number) {
  const count = Math.floor((w * h) / density);
  let seed = 13;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const pts: Point[] = [];
  for (let i = 0; i < count; i++) {
    pts.push({ x: rnd() * w, y: rnd() * h });
  }
  const lines: Line[] = [];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x;
      const dy = pts[i].y - pts[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < connect) {
        lines.push({
          x1: pts[i].x,
          y1: pts[i].y,
          x2: pts[j].x,
          y2: pts[j].y,
          a: 1 - d / connect,
        });
      }
    }
  }
  return { pts, lines };
}

const NETWORK = buildNetwork(W, H, 11000, 150);

// Same particle network as the site background
export function Constellation({
  lineAlpha = 0.1,
  particleAlpha = 0.3,
}: {
  lineAlpha?: number;
  particleAlpha?: number;
}) {
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ position: "absolute", top: 0, left: 0, display: "flex" }}
    >
      {NETWORK.lines.map((l, i) => (
        <line
          key={`l${i}`}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={`rgba(161,161,170,${(l.a * lineAlpha).toFixed(3)})`}
          strokeWidth={0.7}
        />
      ))}
      {NETWORK.pts.map((p, i) => (
        <circle
          key={`p${i}`}
          cx={p.x}
          cy={p.y}
          r={1.6}
          fill={`rgba(161,161,170,${particleAlpha})`}
        />
      ))}
    </svg>
  );
}

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_DATA_URL} alt="" width={size} height={size} style={{ width: size, height: size }} />
      <div
        style={{
          display: "flex",
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "-0.015em",
        }}
      >
        <span style={{ color: OG.muted, fontWeight: 600 }}>Do I Need To&nbsp;</span>
        <span style={{ color: OG.text }}>Upgrade?</span>
      </div>
    </div>
  );
}

// Small uppercase label, like `.eyebrow` in globals.css
export function Eyebrow({ children, color = OG.faint, size = 13 }: { children: React.ReactNode; color?: string; size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: size,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color,
      }}
    >
      {children}
    </div>
  );
}

// --- Icons: Lucide shapes (same set as the site), drawn at a bold stroke ---

type IconNode = { tag: "rect" | "path" | "line"; attr: Record<string, string> };

const LUCIDE: Record<string, IconNode[]> = {
  cpu: [
    { tag: "rect", attr: { width: "16", height: "16", x: "4", y: "4", rx: "2" } },
    { tag: "rect", attr: { width: "6", height: "6", x: "9", y: "9", rx: "1" } },
    ...["M15 2v2", "M15 20v2", "M2 15h2", "M2 9h2", "M20 15h2", "M20 9h2", "M9 2v2", "M9 20v2"].map(
      (d) => ({ tag: "path" as const, attr: { d } })
    ),
  ],
  monitor: [
    { tag: "rect", attr: { width: "20", height: "14", x: "2", y: "3", rx: "2" } },
    { tag: "line", attr: { x1: "8", x2: "16", y1: "21", y2: "21" } },
    { tag: "line", attr: { x1: "12", x2: "12", y1: "17", y2: "21" } },
  ],
  memory: [
    ...["M6 19v-3", "M10 19v-3", "M14 19v-3", "M18 19v-3", "M8 11V9", "M16 11V9", "M12 11V9", "M2 15h20"].map(
      (d) => ({ tag: "path" as const, attr: { d } })
    ),
    { tag: "path", attr: { d: "M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1.1a2 2 0 0 0 0 3.837V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5.1a2 2 0 0 0 0-3.837Z" } },
  ],
  disk: [
    { tag: "line", attr: { x1: "22", x2: "2", y1: "12", y2: "12" } },
    { tag: "path", attr: { d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" } },
    { tag: "line", attr: { x1: "6", x2: "6.01", y1: "16", y2: "16" } },
    { tag: "line", attr: { x1: "10", x2: "10.01", y1: "16", y2: "16" } },
  ],
  check: [{ tag: "path", attr: { d: "M20 6 9 17l-5-5" } }],
  arrowRight: [
    { tag: "path", attr: { d: "M5 12h14" } },
    { tag: "path", attr: { d: "m12 5 7 7-7 7" } },
  ],
};

type IconProps = { size?: number; color?: string; strokeWidth?: number };

function LucideIcon({ nodes, size = 22, color = OG.muted, strokeWidth = 2.25 }: IconProps & { nodes: IconNode[] }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {nodes.map(({ tag: Tag, attr }, i) => (
        <Tag key={i} {...attr} />
      ))}
    </svg>
  );
}

export const IconCPU = (p: IconProps) => <LucideIcon nodes={LUCIDE.cpu} {...p} />;
export const IconGPU = (p: IconProps) => <LucideIcon nodes={LUCIDE.monitor} {...p} />;
export const IconRAM = (p: IconProps) => <LucideIcon nodes={LUCIDE.memory} {...p} />;
export const IconDisk = (p: IconProps) => <LucideIcon nodes={LUCIDE.disk} {...p} />;
export const IconCheck = (p: IconProps) => <LucideIcon nodes={LUCIDE.check} {...p} />;
export const IconArrowRight = (p: IconProps) => <LucideIcon nodes={LUCIDE.arrowRight} {...p} />;

// Solid square check, like the "Meets" mark in the component breakdown
export function StatusCheck({ size = 20 }: { size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: 3,
        background: OG.success,
      }}
    >
      <IconCheck size={Math.round(size * 0.7)} color={OG.successContent} strokeWidth={3.5} />
    </div>
  );
}
