import React from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-lg border border-border bg-card shadow-sm transition-all duration-300 hover:bg-secondary hover:shadow-md group dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 sm:h-11 sm:w-11 sm:min-h-[44px] sm:min-w-[44px] sm:rounded-xl"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 180 : 0, scale: [0.8, 1] }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {isDark ? (
          <Sun className="w-4 sm:w-5 h-4 sm:h-5 text-amber-400" />
        ) : (
          <Moon className="w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground dark:text-slate-400 group-hover:text-foreground dark:group-hover:text-slate-200 transition-colors" />
        )}
      </motion.div>
    </button>
  );
}
