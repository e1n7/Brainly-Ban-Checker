import React from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ResultsDisplay({ result }) {
  if (!result) return null;

  const found = Array.isArray(result.found) ? result.found : [];
  const isClean = found.length === 0;
  const matchCount = result.matchCount ?? found.length;
  const occurrenceCount = found.reduce((total, item) => total + (item.count || 0), 0);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isClean ? "clean" : "detected"}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3 }}
      >
        <div className={`rounded-2xl p-3 sm:p-5 flex items-start gap-2 sm:gap-3 mb-4 sm:mb-5 border ${isClean ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60" : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60"}`}>
          {isClean ? <ShieldCheck className="w-5 sm:w-6 h-5 sm:h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" /> : <ShieldAlert className="w-5 sm:w-6 h-5 sm:h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-sm sm:text-base ${isClean ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300"}`}>
              {isClean ? "All Clear!" : `${matchCount} Flagged Pattern${matchCount > 1 ? "s" : ""} Detected`}
            </h3>
            <p className={`text-xs sm:text-sm mt-1 sm:mt-0.5 ${isClean ? "text-emerald-700/80 dark:text-emerald-400/80" : "text-red-700/80 dark:text-red-400/80"}`}>
              {isClean ? "Your content doesn't contain any known banned words." : "The following words were found in your content:"}
            </p>
            {!isClean && <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">{found.map((word, i) => <span key={`${word.word}-${i}`} className="inline-flex break-all rounded-lg border border-red-200 bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:border-red-800/60 dark:bg-red-900/50 dark:text-red-300 sm:px-3 sm:py-1 sm:text-sm">{word.word} ×{word.count}</span>)}</div>}
          </div>
        </div>

        {!isClean && (
          <div className="mb-2 sm:mb-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-slate-400 mb-2">Preview</label>
            <div
              className="p-3 sm:p-5 bg-card dark:bg-slate-800/50 border-2 border-border dark:border-slate-700 rounded-2xl min-h-[80px] sm:min-h-[100px] text-xs sm:text-[0.95rem] leading-relaxed whitespace-pre-wrap break-words overflow-x-auto font-inter"
              dangerouslySetInnerHTML={{ __html: result.highlightedHTML || "" }}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
