import Link from "next/link";
import { Search } from "lucide-react";
import { KineticLine } from "@/components/home/kinetic-line";
import { LongStemArrow } from "@/components/ui/long-stem-arrow";

const navItems = [
  { label: "The Network", href: "#network" },
  { label: "How It Works", href: "#operating-system" },
  { label: "Proof Layer", href: "#proof-layer" },
  { label: "For Builders", href: "#builders" },
  { label: "Request Access", href: "/sign-up?redirect_url=/onboarding" },
];

export function HomeHero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden border-b border-[#262626] bg-[#000000]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero-builders.png"
        alt="KCL students building hardware together"
        className="absolute inset-0 h-full w-full object-cover"
      />
    
      <div className="pointer-events-none absolute inset-0 bg-[#000000]/40" />


      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#000000]/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#000000]/92 via-[#000000]/45 to-transparent" />
    
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(125%_125%_at_50%_42%,transparent_56%,rgba(0,0,0,0.45)_100%)]" />

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-[88rem] items-center justify-between gap-8 px-6 pt-16 pb-6 lg:px-20">
          <Link
            href="/"
            className="flex h-[4.5rem] items-center border border-[#ffffff] px-5 font-[family-name:var(--font-newsreader)] text-[2.5rem] leading-none font-light tracking-[-0.04em] text-[#ffffff] transition-colors hover:bg-[#ffffff] hover:text-[#000000]"
          >
            Hackollab
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

        <div className="mx-auto grid w-full max-w-[88rem] flex-1 gap-8 px-6 pt-20 pb-28 lg:grid-cols-[1.6fr_1fr] lg:items-end lg:px-20 lg:pt-28 lg:pb-36">
          <KineticLine
            as="h1"
            variant="headline"
            className="font-[family-name:var(--font-newsreader)] text-[clamp(3rem,7vw,6rem)] leading-[0.98] font-light tracking-[-0.02em] text-[#ffffff] [text-shadow:0_2px_28px_rgba(0,0,0,0.55)]"
          >
            <span className="block text-[0.82em]">
              <span className="font-semibold">Build</span> <span className="font-normal">with</span>
            </span>
            <span className="block font-light ml-[0.8em]">Hackollab</span>
          </KineticLine>
          <div className="lg:-mb-12">
            <KineticLine
              delay={120}
              as="p"
              className="max-w-sm text-[18px] leading-8 text-[#f2f2f2] [text-shadow:0_1px_16px_rgba(0,0,0,0.65)]"
            >
              Hackollab is the <span className="text-[#ffffff]">#1</span> place to build an exceptional portfolio
              for UK university students.
            </KineticLine>
            <KineticLine delay={180} className="mt-6 flex flex-wrap items-center gap-6">
              <Link
                href="/sign-up?redirect_url=/onboarding"
                className="group inline-flex items-center gap-4 text-[17px] font-medium text-[#ffffff]"
              >
                <span>Request early access</span>
                <span className="flex h-13 w-13 items-center justify-center rounded-full border border-[#ffffff] text-xl leading-none transition-colors group-hover:bg-[#ffffff] group-hover:text-[#000000]">
                  <LongStemArrow />
                </span>
              </Link>
            </KineticLine>
          </div>
        </div>
      </div>
    </section>
  );
}
