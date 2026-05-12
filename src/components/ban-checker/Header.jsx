import React from "react";
import ThemeToggle from "./ThemeToggle";

export default function Header({ isDark, onToggleTheme }) {
  return (
    <div className="flex items-center justify-center mb-6 sm:mb-8 relative">
      <div className="text-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
          Ban Checker
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground dark:text-slate-400 mt-1 sm:mt-2">
          Scan your content for banned words before posting
        </p>
      </div>
      <div className="absolute right-0">
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
      </div>
    </div>
  );
}