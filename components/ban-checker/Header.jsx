import React from "react";
import { Shield } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Header({ isDark, onToggleTheme }) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4 px-1 sm:mb-8 sm:px-2">
      <div className="flex min-w-0 items-center gap-5 sm:gap-7">
        <img
          id="logo"
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Brainly_logo.svg/1920px-Brainly_logo.svg.png"
          alt="Brainly Logo"
          className="h-10 w-[128px] object-contain object-left select-none pointer-events-none sm:h-14 sm:w-[165px]"
        />
        <div className="border-l border-border pl-5 sm:pl-7">
          <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-4xl">Ban Word Checker</h1>
          <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground sm:text-sm">Paste your text below and we&apos;ll check for banned words<br className="hidden sm:block" /> before you post. Stay safe and follow the rules!</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><Shield className="h-6 w-6 text-primary" /><span>Safer Questions<br />Stronger Community</span></div>
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}
