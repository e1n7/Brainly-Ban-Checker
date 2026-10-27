import React from "react";
import { ShieldCheck } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Header({ isDark, onToggleTheme }) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3 px-0 sm:mb-6 sm:gap-5 sm:px-1">
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-12 sm:w-12">
          <ShieldCheck aria-hidden="true" className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2.1} />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-extrabold tracking-tight text-primary sm:text-2xl">
            Independent Content Checker
          </h1>
          <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
            Compare draft text with selected reference word lists.
          </p>
          <p className="mt-1 max-w-3xl text-[11px] leading-4 text-muted-foreground sm:text-xs">
            Independent project—not affiliated with or endorsed by Brainly. Results are estimates, not moderation decisions.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="hidden text-right text-xs leading-5 text-muted-foreground sm:inline">
          Informational checks only
        </span>
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}
