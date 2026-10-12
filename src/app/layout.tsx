import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavButtons from "@/components/NavButtons";
import SettingsDropdown from "@/components/SettingsDropdown";
import Logo from "@/components/Logo";
import GeometricBackground from "@/components/GeometricBackground";
import PerformanceHint from "@/components/PerformanceHint";
import { SPLASH_SCREENS } from "@/lib/splashScreens";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ["PC upgrade", "system requirements", "can I run it", "Steam games", "PC specs", "hardware check", "GPU comparison", "CPU benchmark"],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  // No canonical here: each page sets its own, so a page that forgets can't canonicalize to the home page
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: "Check if your PC can run any Steam game. Compare your hardware against game requirements instantly.",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "Check if your PC can run any Steam game. Compare your hardware against game requirements instantly.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    // Browsers that support SVG favicons pick icon.svg (adapts to light/dark UI); others use the .ico
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  // Next only emits `mobile-web-app-capable`; iOS still needs the Apple tag before it
  // will show apple-touch-startup-image launch screens
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
  appleWebApp: {
    capable: true,
    title: "Upgrade?",
    // iOS launch screens when opened from the home screen (see src/app/splash)
    startupImage: SPLASH_SCREENS.map(({ file, media }) => ({ url: `/splash/${file}`, media })),
  },
  verification: {
    google: "gqGgjLe8m4yTdxE4FxpwnwdTOSG4pvZhfAHhg7IVGJ4",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F4F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0E0E10" },
  ],
};

// Runs before first paint: saved choice wins, otherwise follow the system.
// Avoids a flash of the wrong theme (and matches the light/dark splash screens).
const themeScript = `try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" data-reduce-motion="false" className="h-full overflow-hidden" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} font-sans h-full w-full overflow-hidden flex flex-col bg-base-200 text-base-content`}>
        <GeometricBackground />
        <header className="relative z-20 flex-none border-b border-base-content/[0.06] bg-base-200/70 backdrop-blur-xl">
          <div className="mx-auto flex h-14 sm:h-16 w-full max-w-6xl items-center justify-between gap-2 px-4">
            <Logo />
            <nav className="flex items-center gap-0.5 sm:gap-1">
              <NavButtons />
              <SettingsDropdown />
            </nav>
          </div>
        </header>
        <main className="flex-1 w-full max-w-full overflow-y-auto overflow-x-hidden relative z-10 scrollbar-subtle" style={{ scrollbarGutter: "stable" }}>
          <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-10">
            {children}
          </div>
        </main>
        <PerformanceHint />
        <Analytics />
      </body>
    </html>
  );
}
