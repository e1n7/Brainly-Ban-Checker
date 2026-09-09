import React from "react";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-border dark:border-slate-600 bg-card dark:bg-slate-800 hover:bg-secondary dark:hover:bg-slate-700 transition-all duration-300 shadow-sm hover:shadow-md group min-h-[44px] min-w-[44px]"
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