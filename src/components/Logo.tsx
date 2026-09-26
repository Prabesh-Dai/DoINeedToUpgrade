// Monochrome version of the app icon (public/icon-512.png): a squircle tile with the
// scan-frame and question mark cut out, so it inherits the text color and works in both themes.
const TILE = "M512.0 256.0L511.8 291.8L511.1 312.8L509.9 330.3L508.3 345.8L506.2 360.0L503.6 373.0L500.5 385.2L497.0 396.5L493.0 407.2L488.6 417.3L483.7 426.7L478.3 435.6L472.4 444.0L466.0 451.8L459.2 459.2L451.8 466.0L444.0 472.4L435.6 478.3L426.7 483.7L417.3 488.6L407.2 493.0L396.5 497.0L385.2 500.5L373.0 503.6L360.0 506.2L345.8 508.3L330.3 509.9L312.8 511.1L291.8 511.8L256.0 512.0L220.2 511.8L199.2 511.1L181.7 509.9L166.2 508.3L152.0 506.2L139.0 503.6L126.8 500.5L115.5 497.0L104.8 493.0L94.7 488.6L85.3 483.7L76.4 478.3L68.0 472.4L60.2 466.0L52.8 459.2L46.0 451.8L39.6 444.0L33.7 435.6L28.3 426.7L23.4 417.3L19.0 407.2L15.0 396.5L11.5 385.2L8.4 373.0L5.8 360.0L3.7 345.8L2.1 330.3L0.9 312.8L0.2 291.8L0.0 256.0L0.2 220.2L0.9 199.2L2.1 181.7L3.7 166.2L5.8 152.0L8.4 139.0L11.5 126.8L15.0 115.5L19.0 104.8L23.4 94.7L28.3 85.3L33.7 76.4L39.6 68.0L46.0 60.2L52.8 52.8L60.2 46.0L68.0 39.6L76.4 33.7L85.3 28.3L94.7 23.4L104.8 19.0L115.5 15.0L126.8 11.5L139.0 8.4L152.0 5.8L166.2 3.7L181.7 2.1L199.2 0.9L220.2 0.2L256.0 0.0L291.8 0.2L312.8 0.9L330.3 2.1L345.8 3.7L360.0 5.8L373.0 8.4L385.2 11.5L396.5 15.0L407.2 19.0L417.3 23.4L426.7 28.3L435.6 33.7L444.0 39.6L451.8 46.0L459.2 52.8L466.0 60.2L472.4 68.0L478.3 76.4L483.7 85.3L488.6 94.7L493.0 104.8L497.0 115.5L500.5 126.8L503.6 139.0L506.2 152.0L508.3 166.2L509.9 181.7L511.1 199.2L511.8 220.2Z";

const GLYPH = [
  "M101.5 178.5V127.5Q101.5 101.5 127.5 101.5H178.5",
  "M333.5 101.5H384.5Q410.5 101.5 410.5 127.5V178.5",
  "M410.5 333.5V384.5Q410.5 410.5 384.5 410.5H333.5",
  "M178.5 410.5H127.5Q101.5 410.5 101.5 384.5V333.5",
  "M214.5 181C216 167 234 159.5 258 159.5C284 159.5 302.5 177 302.5 199C302.5 221 288 233 276 243C265 252 257.5 259 257.5 271V277.5",
];

function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true">
      <defs>
        <mask id="dintu-logo-cutout">
          <rect width="512" height="512" fill="#fff" />
          <g fill="none" stroke="#000" strokeWidth={37} strokeLinecap="round" strokeLinejoin="round">
            {GLYPH.map((d) => <path key={d} d={d} />)}
          </g>
          <circle cx="255.5" cy="346.5" r="24" fill="#000" />
        </mask>
      </defs>
      <path d={TILE} fill="currentColor" mask="url(#dintu-logo-cutout)" />
    </svg>
  );
}

export default function Logo() {
  return (
    // Plain anchor on purpose: a full reload resets the wizard state
    <a
      href="/"
      className="group flex items-center gap-2.5 rounded font-bold tracking-tight"
      aria-label="Do I Need To Upgrade? Home"
    >
      <LogoMark className="h-8 w-8 shrink-0 text-base-content transition-transform group-hover:-translate-y-0.5" />
      <span className="text-[15px] sm:text-base leading-none">
        <span className="hidden sm:inline text-base-content/70 font-semibold">Do I Need To </span>
        <span>Upgrade?</span>
      </span>
    </a>
  );
}
