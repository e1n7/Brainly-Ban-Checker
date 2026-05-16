import React, { useState, useCallback, useRef, useEffect } from "react";
import { X, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import bannedWordsData from "@/lib/bannedWords.json";

export default function SymbolPanel({ isOpen, onClose, onInsertSymbol, onShowToast, clearSearchKey }) {
  const [search, setSearch] = useState("");
  const clickTimeoutRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (clearSearchKey === undefined) return;
    setSearch("");
  }, [clearSearchKey]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const getFilteredSymbols = useCallback(() => {
    const query = search.toLowerCase().trim();
    if (!query) {
      // Return all symbols
      return Object.entries(bannedWordsData.symbolMap).flatMap(([base, chars]) =>
        chars.map((char) => ({ char, base }))
      );
    }
    // Filter by base letter
    const matchedEntries = Object.entries(bannedWordsData.symbolMap).filter(([base]) =>
      base.includes(query)
    );
    return matchedEntries.flatMap(([base, chars]) =>
      chars.map((char) => ({ char, base }))
    );
  }, [search]);

  const handleCopy = (char) => {
    if (clickTimeoutRef.current !== null) {
      window.clearTimeout(clickTimeoutRef.current);
    }

    clickTimeoutRef.current = window.setTimeout(async () => {
      clickTimeoutRef.current = null;
      try {
        await navigator.clipboard.writeText(char);
        if (onShowToast) onShowToast(`Copied "${char}"`);
      } catch {
        if (onShowToast) onShowToast("Unable to copy symbol.");
      }
    }, 240);
  };

  const handleDoubleClick = (char) => {
    if (clickTimeoutRef.current !== null) {
      window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    if (onInsertSymbol) {
      onInsertSymbol(char);
    }
  };

  const handleFabClick = useCallback(() => {
    if (!onClose) return;
    onClose(isOpen ? false : true);
  }, [isOpen, onClose]);

  const symbols = getFilteredSymbols();

  return (
    <>
      {/* FAB button */}
      <button
        onClick={handleFabClick}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center z-50 min-h-[44px] min-w-[44px]"
        aria-label="Toggle symbol finder"
        type="button"
      >
        {isOpen ? <X className="w-5 sm:w-6 h-5 sm:h-6" /> : <Lightbulb className="w-5 sm:w-6 h-5 sm:h-6" />}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 w-[calc(100vw-2rem)] sm:w-80 bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[60vh] sm:max-h-[70vh]"
          >
            {/* Header */}
            <div className="p-3 sm:p-4 bg-secondary/50 dark:bg-slate-800/60 border-b border-border dark:border-slate-700">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-xs sm:text-sm font-semibold text-foreground dark:text-slate-100">
                  Symbol Finder
                </h3>
                <button
                  onClick={() => onClose(false)}
                  className="p-1 rounded-md hover:bg-secondary dark:hover:bg-slate-700 text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-slate-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                placeholder="Type a letter (e.g., a, e, o)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-border dark:border-slate-600 bg-card dark:bg-slate-800 text-xs sm:text-sm text-foreground dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors placeholder:text-muted-foreground dark:placeholder:text-slate-500"
              />
            </div>

            {/* Symbol grid */}
            <div className="p-2 sm:p-3 grid grid-cols-[repeat(auto-fill,minmax(45px,1fr))] gap-1.5 sm:gap-2 overflow-y-auto flex-1"
              {symbols.length > 0 ? (
                symbols.map((s, i) => (
                  <button
                    key={`${s.base}-${i}`}
                    title={`Click to copy, double-click to insert (base: ${s.base})`}
                    onClick={() => handleCopy(s.char)}
                    onDoubleClick={() => handleDoubleClick(s.char)}
                    className="aspect-square flex items-center justify-center rounded-lg border border-border dark:border-slate-600 bg-secondary/30 dark:bg-slate-700/40 text-base sm:text-lg hover:bg-primary/10 dark:hover:bg-slate-600 hover:border-primary dark:hover:border-slate-500 hover:text-primary dark:hover:text-slate-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer select-none min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto"
                  >
                    {s.char}
                  </button>
                ))
              ) : (
                <div className="col-span-4 sm:col-span-5 text-center py-3 sm:py-5 text-xs sm:text-sm text-muted-foreground dark:text-slate-400">
                  No symbols found for "{search}"
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-2 sm:px-3 py-2 sm:py-2.5 bg-secondary/50 dark:bg-slate-800/60 border-t border-border dark:border-slate-700 text-center">
              <p className="text-xs text-muted-foreground dark:text-slate-400">
                Click to copy • Double-click to insert
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}