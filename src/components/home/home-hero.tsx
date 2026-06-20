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
    <section className="relative border-b border-[#262626]">
      <div className="mx-auto grid w-full max-w-[88rem] grid-cols-[auto_1fr_auto] items-center gap-8 px-6 py-10 lg:px-12">
        <Link
          href="/"
          className="flex h-12 items-center border border-[#ffffff] px-3 font-[family-name:var(--font-newsreader)] text-2xl font-light tracking-[-0.04em] text-[#ffffff] transition-colors hover:bg-[#ffffff] hover:text-[#000000]"
        >
          mebi
        </Link>
        <nav className="hidden justify-center gap-5 text-[12px] font-medium tracking-[-0.01em] text-[#ffffff] sm:flex lg:text-[13px] xl:gap-10">
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
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/sign-up?redirect_url=/onboarding"
            className="text-[13px] font-medium text-[#ffffff] sm:hidden"
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
      <div className="mx-auto grid w-full max-w-[88rem] gap-20 px-6 pt-24 pb-32 lg:grid-cols-[1.3fr_1fr] lg:px-12 lg:pt-36 lg:pb-44">
        <div>
          <KineticLine className="text-[12px] font-semibold tracking-[0.32em] text-[#8f8f8f] uppercase">
            Build with mebi
          </KineticLine>
          <KineticLine
            as="p"
            delay={40}
            variant="headline"
            className="mt-10 max-w-4xl font-[family-name:var(--font-newsreader)] text-[clamp(2.9rem,5.4vw,5.1rem)] leading-[1.02] font-light tracking-[-0.02em] text-[#ffffff]"
          >
            Build serious projects with people who actually ship.
          </KineticLine>
          <KineticLine
            as="p"
            delay={110}
            className="mt-9 max-w-xl text-[17px] leading-8 text-[#d8d8d8]"
          >
            mebi is where KCL students turn ambitious ideas into structured teams, visible progress,
            and portfolio evidence worth talking about in interviews.
          </KineticLine>
          <KineticLine delay={170} className="mt-12 flex flex-wrap items-center gap-6">
            <Link
              href="/sign-up?redirect_url=/onboarding"
              className="group inline-flex items-center gap-4 text-[15px] font-medium text-[#ffffff]"
            >
              <span>Request early access</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[#ffffff] text-xl leading-none transition-colors group-hover:bg-[#ffffff] group-hover:text-[#000000]">
                &rarr;
              </span>
            </Link>
          </KineticLine>
        </div>
        <KineticLine delay={120} className="flex flex-col justify-end">
          <div className="border-t border-[#262626] pt-6">
            <p className="font-[family-name:var(--font-newsreader)] text-6xl font-light text-[#ffffff]">
              #1
            </p>
            <p className="mt-3 max-w-xs text-[14px] leading-6 text-[#d8d8d8]">
              The goal: become the first place a KCL student looks when they want to build something
              real, not the fifth abandoned group chat.
            </p>
          </div>
        </KineticLine>
      </div>
    </section>
  );
}
