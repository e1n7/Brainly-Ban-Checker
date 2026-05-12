import React from "react";
import bannedWordsData from "@/lib/bannedWords.json";
import { Globe } from "lucide-react";

export default function CountrySelector({ selectedCountry, onCountryChange }) {
  return (
    <div className="relative inline-flex items-center gap-1.5 sm:gap-2">
      <Globe className="w-4 h-4 text-muted-foreground dark:text-slate-400" />
      <select
        value={selectedCountry}
        onChange={(e) => onCountryChange(e.target.value)}
        className="appearance-none bg-secondary/60 dark:bg-slate-700/60 border border-border dark:border-slate-600 rounded-lg px-2 sm:px-3 py-1.5 pr-7 sm:pr-8 text-xs sm:text-sm font-medium text-foreground dark:text-slate-100 cursor-pointer hover:bg-secondary dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      >
        {bannedWordsData.COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-3 sm:w-3.5 h-3 sm:h-3.5 text-muted-foreground dark:text-slate-400 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}