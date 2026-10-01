import React from "react";
import { Shield } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Header({ isDark, onToggleTheme }) {
  return (
    <header className="mb-4 flex items-center justify-between gap-2 overflow-visible px-0 sm:mb-6 sm:gap-4 sm:px-1">
      <div className="flex min-w-0 items-center gap-2 sm:gap-5">
        <img
          id="logo"
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Brainly_logo.svg/1920px-Brainly_logo.svg.png"
          alt="Brainly Logo"
          className="block h-6 w-14 shrink-0 object-contain object-left select-none pointer-events-none sm:h-10 sm:w-[128px]"
        />
        <div className="min-w-0 border-l border-border pl-2 sm:pl-5">
          <h1 className="whitespace-nowrap text-[15px] font-extrabold tracking-tight text-primary sm:text-2xl">Ban Word Checker</h1>
          <p className="mt-0.5 block max-w-[112px] text-[8px] leading-[1.35] text-muted-foreground sm:mt-1 sm:max-w-xl sm:text-xs sm:leading-5">Paste your text below and we&apos;ll check for banned words<br /> before you post. Stay safe and follow the rules!</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <div className="flex items-center gap-1 text-[8px] leading-[1.35] text-muted-foreground sm:gap-2 sm:text-xs sm:leading-normal"><Shield className="h-5 w-5 shrink-0 text-primary sm:h-8 sm:w-8" strokeWidth={2.2} /><span className="whitespace-nowrap">Safer Questions<br />Stronger Community</span></div>
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}
