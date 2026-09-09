import React from "react";
import ThemeToggle from "./ThemeToggle";

export default function Header({ isDark, onToggleTheme }) {
  return (
    <div className="flex flex-col items-center justify-center mb-6 sm:mb-8 relative w-full">
      {/* Theme Switcher Container */}
      <div className="absolute right-0 top-0">
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
      </div>

      {/* Brand Logo and Titles Group */}
      <div className="text-center mt-6 sm:mt-4">
        {/* Brainly Logo Element */}
        <img
          id="logo"
          src="/icon.svg"
          alt="Brainly Ban Checker"
          className="h-14 w-14 sm:h-16 sm:w-16 mx-auto mb-3 object-contain select-none pointer-events-none"
        />

        <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
          Ban Checker
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground dark:text-slate-400 mt-1 sm:mt-2">
          Scan your content for banned words before posting
        </p>
      </div>
    </div>
  );
}
