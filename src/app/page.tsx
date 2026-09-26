import Link from "next/link";
import HomeWizard from "@/components/HomeWizard";
import { uniquePopularGames } from "@/lib/popularGames";
import { slugify } from "@/lib/slugify";

export default function Page() {
  const featured = uniquePopularGames.slice(0, 18);

  return (
    <>
      <div className="min-h-screen pb-24">
        <HomeWizard />
      </div>

      <section className="mx-auto mb-10 mt-8 w-full max-w-3xl border-t border-base-content/10 pt-8 leading-relaxed text-base-content/60">
        <h2 className="text-sm font-semibold text-base-content/80">
          Can I run it? Check any Steam game against your PC.
        </h2>
        <p className="mt-2 text-sm">
          Do I Need To Upgrade compares your CPU, GPU, RAM and storage with the official minimum
          and recommended requirements for any game on Steam. Pick a game, confirm your specs, and
          you&apos;ll know right away if your PC can handle it. If it can&apos;t, we&apos;ll show you
          what to upgrade. Hardware is matched against a benchmark list, so older or oddly named
          parts still get a fair comparison. Works on Windows, macOS and Linux.
        </p>

        <h3 className="mt-6 text-sm font-semibold text-base-content/80">Popular games to check</h3>
        <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2 md:grid-cols-3">
          {featured.map((g) => (
            <li key={g.appid} className="min-w-0">
              <Link
                href={`/game/${g.appid}/${slugify(g.name)}`}
                className="block truncate text-base-content/60 underline-offset-4 hover:text-base-content hover:underline"
                title={`Can I run ${g.name}?`}
              >
                Can I run {g.name}?
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
