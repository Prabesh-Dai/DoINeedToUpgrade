import type { Metadata } from "next";
import Link from "next/link";
import HomeWizard from "@/components/HomeWizard";
import { StructuredData } from "@/components/StructuredData";
import { uniquePopularGames } from "@/lib/popularGames";
import { gamePath } from "@/lib/slugify";
import { SITE_NAME } from "@/lib/site";

const title = `${SITE_NAME}? Check If Your PC Can Run Any Game`;

export const metadata: Metadata = {
  // The brand alone says nothing to searchers, so the home page spells out what the tool does
  title: { absolute: title },
  alternates: { canonical: "/" },
  openGraph: { title, url: "/" },
  twitter: { title },
};

const faqs = [
  {
    q: "How do I know if my PC can run a game?",
    a: "Search for the game, confirm your specs, and we compare your CPU, GPU, RAM and storage with its minimum and recommended requirements. You get a result for each part, an overall verdict and a rough FPS estimate.",
  },
  {
    q: "How do you find out what hardware I have?",
    a: "Your browser reveals some of it, like your graphics card and operating system, so we start from that. For exact numbers, run the free scanner for Windows, macOS or Linux. It reads your hardware locally and opens this site with your specs filled in. You can also type them in yourself.",
  },
  {
    q: "What should I upgrade first?",
    a: "The results show which part falls short. When we know both your CPU and GPU, we also estimate how many frames each upgrade would add, so you can spend money where it actually helps.",
  },
  {
    q: "Is it free, and are my specs stored anywhere?",
    a: "It's free with no sign-up. Your specs are saved in your own browser so you don't have to enter them again, and you can clear them at any time.",
  },
];

export default function Page() {
  const featured = uniquePopularGames.slice(0, 18);

  return (
    <>
      <StructuredData />

      <div className="min-h-screen pb-24">
        <HomeWizard />
      </div>

      <section className="mx-auto mb-10 mt-8 w-full max-w-3xl border-t border-base-content/10 pt-8 leading-relaxed text-base-content/60">
        <h2 className="text-base font-semibold text-base-content/80">
          Can I run it? Check any Steam game against your PC.
        </h2>
        <p className="mt-2 text-sm">
          Do I Need To Upgrade compares your CPU, GPU, RAM and storage with the official minimum
          and recommended requirements for any game on Steam. Pick a game, confirm your specs, and
          you&apos;ll know right away if your PC can handle it. If it can&apos;t, we&apos;ll show you
          what to upgrade. Hardware is matched against a benchmark list, so older or oddly named
          parts still get a fair comparison. Works on Windows, macOS and Linux.
        </p>

        <h3 className="mt-6 text-base font-semibold text-base-content/80">Popular games to check</h3>
        <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2 md:grid-cols-3">
          {featured.map((g) => (
            <li key={g.appid} className="min-w-0">
              <Link
                href={gamePath(g.appid, g.name)}
                className="block truncate text-base-content/60 underline-offset-4 hover:text-base-content hover:underline"
                title={`Can I run ${g.name}?`}
              >
                Can I run {g.name}?
              </Link>
            </li>
          ))}
        </ul>

        <h3 className="mt-6 text-base font-semibold text-base-content/80">Questions</h3>
        <dl className="mt-2 flex flex-col gap-4 text-sm">
          {faqs.map(({ q, a }) => (
            <div key={q}>
              <dt className="font-medium text-base-content/75">{q}</dt>
              <dd className="mt-1">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
