import Link from "next/link";
import { Search } from "lucide-react";
import { KineticLine } from "@/components/home/kinetic-line";

const navItems = [
  { label: "The Network", href: "#network" },
  { label: "How It Works", href: "#operating-system" },
  { label: "Proof Layer", href: "#proof-layer" },
  { label: "For Builders", href: "#builders" },
  { label: "Request Access", href: "/sign-up?redirect_url=/onboarding" },
];

export function HomeHero() {
  return (
    <section className="relative border-b border-[#262626] bg-[#000000]">
      <div className="mx-auto flex w-full max-w-[88rem] items-center justify-between gap-8 px-6 pt-16 pb-6 lg:px-20">
        <Link
          href="/"
          className="flex h-[4.5rem] items-center border border-[#ffffff] px-5 font-[family-name:var(--font-newsreader)] text-[2.5rem] leading-none font-light tracking-[-0.04em] text-[#ffffff] transition-colors hover:bg-[#ffffff] hover:text-[#000000]"
        >
          mebi
        </Link>
        <div className="flex items-center gap-10 xl:gap-12">
          <nav className="hidden items-center gap-7 text-[15px] font-medium tracking-[-0.01em] text-[#ffffff] sm:flex lg:text-[16px] xl:gap-9">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group relative py-2 transition-colors hover:text-[#ffffff]"
              >
                <span>{item.label}</span>
                <span className="absolute bottom-0 left-1/2 h-px w-0 -translate-x-1/2 bg-[#ffffff] transition-all duration-300 ease-out group-hover:w-full" />
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-up?redirect_url=/onboarding"
              className="text-[14px] font-medium text-[#ffffff] sm:hidden"
            >
              Request access
            </Link>
            <button
              type="button"
              aria-label="Search"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-transparent text-[#ffffff] transition-colors hover:border-[#ffffff]"
            >
              <Search size={22} strokeWidth={1.7} />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[88rem] gap-8 px-6 pt-20 pb-20 lg:grid-cols-[1.6fr_1fr] lg:items-end lg:px-20 lg:pt-28 lg:pb-28">
        <KineticLine
          as="h1"
          variant="headline"
          className="font-[family-name:var(--font-newsreader)] text-[clamp(3rem,7vw,6rem)] leading-[0.98] font-light tracking-[-0.02em] text-[#ffffff]"
        >
          <span className="block text-[0.82em]">
            <span className="font-semibold">Build</span> <span className="font-normal">with</span>
          </span>
          <span className="block font-light ml-[0.8em]">Hackollab</span>
        </KineticLine>
        <KineticLine delay={120} as="p" className="max-w-sm text-[18px] leading-8 text-[#f2f2f2] lg:pb-4">
          mebi is the <span className="text-[#ffffff]">#1</span> place to build an exceptional portfolio
          for UK university students.
        </KineticLine>
      </div>
      <div className="mx-auto w-full max-w-[88rem] px-6 lg:px-20">
        <KineticLine className="relative aspect-[16/7] w-full overflow-hidden bg-[#0d0d0d]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-builders.png"
            alt="KCL students building hardware together"
            className="h-full w-full object-cover"
          />
        </KineticLine>
      </div>

      <div className="mx-auto grid w-full max-w-[88rem] gap-10 px-6 pt-10 pb-20 lg:grid-cols-[1.6fr_1fr] lg:px-20">
        <KineticLine
          as="h2"
          variant="headline"
          className="max-w-xl font-[family-name:var(--font-newsreader)] text-[clamp(1.7rem,3vw,2.5rem)] leading-[1.1] font-light text-[#ffffff]"
        >
          Built in a single weekend
        </KineticLine>
        <div>
          <KineticLine delay={80} as="p" className="max-w-sm text-[15px] leading-7 text-[#bdbdbd]">
            KCL students team up at a hardware hackathon: soldering, prototyping, and pitching a
            working build to companies & judges.
          </KineticLine>
          <KineticLine delay={140} className="mt-8 flex flex-wrap items-center gap-6">
            <Link
              href="/sign-up?redirect_url=/onboarding"
              className="group inline-flex items-center gap-4 text-[17px] font-medium text-[#ffffff]"
            >
              <span>Request early access</span>
              <span className="flex h-13 w-13 items-center justify-center rounded-full border border-[#ffffff] text-xl leading-none transition-colors group-hover:bg-[#ffffff] group-hover:text-[#000000]">
                &rarr;
              </span>
            </Link>
          </KineticLine>
        </div>
      </div>
    </section>
  );
}
