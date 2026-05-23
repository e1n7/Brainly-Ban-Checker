import React, { useState, useRef, useCallback, useEffect } from "react";
import { Search, RotateCcw, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import bannedWordsData from "@/lib/bannedWords.json";
import { analyzeContent } from "@/lib/banChecker";
import Header from "@/components/ban-checker/Header";
import CountrySelector from "@/components/ban-checker/CountrySelector";
import ResultsDisplay from "@/components/ban-checker/ResultsDisplay";
import SymbolPanel from "@/components/ban-checker/SymbolPanel";

export default function BanChecker() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("PH");
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });
  const [symbolPanelOpen, setSymbolPanelOpen] = useState(false);
  const [symbolSearchResetKey, setSymbolSearchResetKey] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const textareaRef = useRef(null);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  useEffect(() => {
    if (!toastVisible) return;
    const timeout = window.setTimeout(() => {
      setToastVisible(false);
    }, 2200);
    return () => window.clearTimeout(timeout);
  }, [toastVisible]);

  // Toggle dark mode by adding/removing the .dark class
  const handleToggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  }, []);

  // Get the active word list for the selected country
  const getActiveWordList = useCallback(() => {
    if (selectedCountry === "PH") {
      return bannedWordsData.bannedWordsPH;
    } else if (selectedCountry === "US") {
      return bannedWordsData.bannedWordsUS;
    }
    return bannedWordsData.bannedWordsPH; // Default to PH
  }, [selectedCountry]);

  // Analyze content (preserves original logic)
  const handleAnalyze = useCallback(() => {
    if (!text.trim()) {
      showToast("Please enter content first.");
      return;
    }

    setIsAnalyzing(true);

    // Small delay for UX polish
    setTimeout(() => {
      const wordList = getActiveWordList();
      const res = analyzeContent(text, wordList);
      setResult(res);
      setIsAnalyzing(false);
    }, 400);
  }, [text, getActiveWordList, showToast]);

  // Reset all fields
  const handleReset = useCallback(() => {
    setText("");
    setResult(null);
    setSymbolSearchResetKey((prev) => prev + 1);
    if (textareaRef.current) textareaRef.current.focus();
  }, []);

  const handleSetSymbolPanelOpen = useCallback((open) => {
    setSymbolPanelOpen(open);
  }, []);

  // Insert symbol into textarea at cursor
  const handleInsertSymbol = useCallback((char) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = text.slice(0, start);
    const after = text.slice(end);
    const newText = before + char + after;
    setText(newText);
    // Move cursor after inserted character
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + char.length;
    }, 0);
  }, [text]);

return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950 flex justify-center items-start pt-2 pb-6 px-3 sm:px-4 relative">
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-2xl mt-2"
      >
        {/* Main card - Added 'relative' class here */}
        <div className="relative bg-card/85 dark:bg-slate-900/90 backdrop-blur-lg border border-border/60 dark:border-slate-700/60 rounded-3xl shadow-xl p-4 sm:p-6 md:p-8">
          
          {/* Question Mark Icon Button - Positioned at the upper left side */}
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => setInfoOpen(true)}
              className="p-1 text-muted-foreground hover:text-foreground transition-all duration-200"
              title="How to use & FAQ"
            >
              <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <Header isDark={isDark} onToggleTheme={handleToggleTheme} />

          {/* Input section */} 
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="inputText"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Your Text
              </label>
              <CountrySelector
                selectedCountry={selectedCountry}
                onCountryChange={setSelectedCountry}
              />
            </div>
            <textarea
              ref={textareaRef}
              id="inputText"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your content here to scan for banned words..."
              className="w-full min-h-[140px] sm:min-h-[180px] p-3 sm:p-4 rounded-2xl border-2 border-border dark:border-slate-600 bg-secondary/20 dark:bg-slate-800/50 text-foreground dark:text-slate-100 text-sm sm:text-base resize-y transition-all duration-300 focus:outline-none focus:border-primary focus:bg-card dark:focus:bg-slate-800 focus:shadow-[0_0_0_4px_hsl(var(--primary)/0.1)] placeholder:text-muted-foreground/60 font-inter"
            />
          </div>

          {/* Button row */}
          <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-2 sm:gap-3 mb-6">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !text.trim()}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl font-semibold text-sm sm:text-base bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md active:translate-y-0 sm:active:translate-y-0"
            >
              {isAnalyzing ? (
                <svg
                  className="animate-spin w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>{isAnalyzing ? "Scanning..." : "Analyze Content"}</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-4 sm:px-4 py-3 sm:py-3.5 rounded-2xl font-semibold text-sm sm:text-base border-2 border-border dark:border-slate-600 text-muted-foreground dark:text-slate-400 hover:bg-secondary dark:hover:bg-slate-700 hover:text-foreground dark:hover:text-slate-200 transition-all duration-200 active:translate-y-0"
            >
              <RotateCcw className="w-4.5 h-4.5" />
              <span>Clear</span>
            </button>
          </div>

          {/* Results */}
          <ResultsDisplay result={result} />

          {/* Footer */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-border dark:border-slate-700 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground dark:text-slate-400">
              A simple banned-word checker. No sign-in, no data collection, no account required.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              <a
                href="https://github.com/e1n7/Brainly-Ban-Checker"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Source on GitHub
              </a>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Info Modal Backdrop and Content */}
      <AnimatePresence>
        {infoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInfoOpen(false)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-card dark:bg-slate-900 border border-border dark:border-slate-700 rounded-3xl shadow-2xl p-5 sm:p-7 z-10 text-left font-inter"
            >
              <div className="flex justify-between items-center mb-5 border-b border-border dark:border-slate-800 pb-3">
                <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" /> App Information
                </h2>
                <button
                  onClick={() => setInfoOpen(false)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
                >
                  Close
                </button>
              </div>

              {/* How to Use */}
              <section className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">- How to Use the Ban Checker?</h3>
                <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-muted-foreground dark:text-slate-400">
                  <li>Select the platform version you want to post your content (<span className="font-semibold text-foreground">Brainly.ph</span> or <span className="font-semibold text-foreground">Brainly.com</span>).</li>
                  <li>Paste your text, question, or answer inside the input box.</li>
                  <li>Click the <span className="font-semibold text-foreground">Analyze Content</span> button.</li>
                  <li>The system highlights flagged or sensitive words that might trigger an account ban.</li>
                </ol>
              </section>

              {/* FAQ */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">- Frequently Asked Questions (FAQ)</h3>
                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <h4 className="font-semibold text-foreground">Q - Why are certain words banned on Brainly?</h4>
                    <p className="text-muted-foreground dark:text-slate-400 mt-1">The platform uses automated filters to keep the community safe, educational, and family-friendly. Sometimes, innocent phrases get flagged accidentally due to overlapping letters between words.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Q - Is my text data safe here?</h4>
                    <p className="text-muted-foreground dark:text-slate-400 mt-1">Yes, completely. This application processes everything locally within your browser. There is no database, no registration required, and absolutely no data collection on our backend.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Q - What should I do if the tool finds a flagged word?</h4>
                    <p className="text-muted-foreground dark:text-slate-400 mt-1">You can use our built-in <span className="font-semibold text-foreground">Symbol Finder</span> tool (the lightbulb icon button at the bottom right) to switch regular letters with special characters (like changing <span className="font-semibold text-foreground">a</span> to <span className="font-semibold text-foreground">à</span>) to bypass the automated filters.</p>
                  </div>
                </div>
              </section>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {toastVisible && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[min(90vw,28rem)] -translate-x-1/2 rounded-2xl bg-slate-950/95 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-md border border-white/10 text-center">
          {toastMessage}
        </div>
      )}

      {/* Symbol Finder FAB + Panel */}
      <SymbolPanel
        isOpen={symbolPanelOpen}
        onClose={handleSetSymbolPanelOpen}
        clearSearchKey={symbolSearchResetKey}
        onInsertSymbol={handleInsertSymbol}
        onShowToast={showToast}
      />
    </div>
  );
}