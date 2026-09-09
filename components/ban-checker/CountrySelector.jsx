import React from "react";
import { Globe } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";

export default function CountrySelector({ selectedCountry, onCountryChange }) {
  return (
    <div className="relative flex w-full items-center gap-1.5 rounded-xl border border-border bg-card px-3 sm:gap-2">
      <Globe className="w-4 h-4 text-muted-foreground dark:text-slate-400" />
      <select
        value={selectedCountry}
        onChange={(e) => onCountryChange(e.target.value)}
        className="w-full appearance-none bg-transparent py-3 pr-7 text-xs font-semibold text-foreground outline-none transition-colors focus:ring-2 focus:ring-primary/20 sm:text-sm"
      >
        {COUNTRIES.map((c) => (
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
