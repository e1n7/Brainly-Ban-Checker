import React from "react";
import { Shield } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Header({ isDark, onToggleTheme }) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4 overflow-visible px-1">
      <div className="flex min-w-0 items-center gap-5">
        <img
          id="logo"
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Brainly_logo.svg/1920px-Brainly_logo.svg.png"
          alt="Brainly Logo"
          className="hidden h-10 w-[128px] shrink-0 object-contain object-left select-none pointer-events-none sm:block"
        />
        <div className="min-w-0 border-l border-border pl-0 sm:pl-5">
          <h1 className="whitespace-nowrap text-2xl font-extrabold tracking-tight text-primary">Ban Word Checker</h1>
          <p className="mt-1 hidden max-w-xl text-xs leading-5 text-muted-foreground sm:block">Paste your text below and we&apos;ll check for banned words<br /> before you post. Stay safe and follow the rules!</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><Shield className="h-8 w-8 shrink-0 text-primary" strokeWidth={2.2} /><span className="whitespace-nowrap">Safer Questions<br />Stronger Community</span></div>
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}
