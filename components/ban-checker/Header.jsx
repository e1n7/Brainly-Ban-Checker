import React from "react";
import Image from "next/image";
import { Shield } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Header({ isDark, onToggleTheme }) {
  return (
    <header className="mb-4 flex items-center justify-between gap-2 overflow-visible px-0 sm:mb-6 sm:gap-4 sm:px-1">
      <div className="flex min-w-0 items-center gap-2 sm:gap-5">
        <Image
          src="/icon.svg"
          alt=""
          width={40}
          height={40}
          priority
          className="h-8 w-8 shrink-0 object-contain sm:h-10 sm:w-10"
        />
        <div className="min-w-0 border-l border-border pl-2 sm:pl-5">
          <h1 className="whitespace-nowrap text-[15px] font-extrabold tracking-tight text-primary sm:text-2xl">
            Content Checker
          </h1>
          <p className="mt-0.5 block max-w-[220px] text-[8px] leading-[1.35] text-muted-foreground sm:mt-1 sm:max-w-xl sm:text-xs sm:leading-5">
            Paste your text below and we&apos;ll check it against the selected list. Results are informational only.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <div className="flex items-center gap-1 text-[8px] leading-[1.35] text-muted-foreground sm:gap-2 sm:text-xs sm:leading-normal">
          <Shield className="h-5 w-5 shrink-0 text-primary sm:h-8 sm:w-8" strokeWidth={2.2} />
          <span className="whitespace-nowrap">Independent Tool<br />Not Official Advice</span>
        </div>
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}
