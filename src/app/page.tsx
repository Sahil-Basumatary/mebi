"use client";

import { Bell, Lightbulb, Search, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Panel } from "@/components/ui/panel";
import { Window } from "@/components/ui/window";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-12 px-6 py-16">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-5xl font-semibold tracking-tight">mebi</h1>
          <p className="text-muted mt-2">Design system preview</p>
        </div>
        <ThemeToggle />
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-muted text-xs font-semibold tracking-wider uppercase">Buttons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-muted text-xs font-semibold tracking-wider uppercase">Icon buttons</h2>
        <div className="flex items-center gap-1">
          <IconButton label="Search">
            <Search size={18} strokeWidth={1.75} />
          </IconButton>
          <IconButton label="Settings">
            <Settings size={18} strokeWidth={1.75} />
          </IconButton>
          <IconButton label="Notifications">
            <Bell size={18} strokeWidth={1.75} />
          </IconButton>
          <IconButton label="AI suggestions">
            <Lightbulb size={18} strokeWidth={1.75} />
          </IconButton>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-muted text-xs font-semibold tracking-wider uppercase">Panels</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Panel title="Builder">
            <p className="text-foreground text-sm">Browse partners and build your portfolio.</p>
          </Panel>
          <Panel title="Specialist" selected>
            <p className="text-foreground text-sm">Apply your expertise to the right projects.</p>
          </Panel>
          <Panel title="Learner">
            <p className="text-foreground text-sm">Join beginner-friendly projects with support.</p>
          </Panel>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-muted text-xs font-semibold tracking-wider uppercase">Window</h2>
        <Window title="Settings" trigger={<Button variant="outline">Open window</Button>}>
          <p className="text-muted text-sm">
            A window built on Radix Dialog. Press Escape or click the X to close.
          </p>
        </Window>
      </section>
    </main>
  );
}
