"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Search, RotateCcw, HelpCircle, FileText, Shield, Info, CheckCircle2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { parseBrainlyAnswer, isHTML } from "@/lib/brainlyParser";
import { ANALYZE_CONTENT_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabasePublic";
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
      return window.localStorage.getItem("brainly-ban-checker-theme") === "dark";
    }
    return false;
  });
  const [symbolPanelOpen, setSymbolPanelOpen] = useState(false);
  const [symbolSearchResetKey, setSymbolSearchResetKey] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const textareaRef = useRef(null);

  const showToast = useCallback((message) => { setToastMessage(message); setToastVisible(true); }, []);

  useEffect(() => {
    if (!toastVisible) return;
    const timeout = window.setTimeout(() => setToastVisible(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [toastVisible]);

  const handleToggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("brainly-ban-checker-theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const handleAnalyze = useCallback(async () => {
    if (!text.trim()) { showToast("Please enter content first."); return; }
    setIsAnalyzing(true);
    try {
      let contentToAnalyze = text;
      if (isHTML(text)) {
        const parsed = parseBrainlyAnswer(text);
        if (parsed.isValid) contentToAnalyze = parsed.text;
        else console.warn("HTML detected but parsing failed:", parsed.error);
      }
      const response = await fetch(ANALYZE_CONTENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ text: contentToAnalyze, countryCode: selectedCountry }),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Unable to analyze content.");
      setResult(res);
    } catch (error) {
      showToast(error.message || "Unable to analyze content.");
    } finally { setIsAnalyzing(false); }
  }, [text, selectedCountry, showToast]);

  const handleReset = useCallback(() => {
    setText(""); setResult(null); setSymbolSearchResetKey((prev) => prev + 1);
    if (textareaRef.current) textareaRef.current.focus();
  }, []);

  const handlePaste = useCallback(() => {}, []);
  const handleSetSymbolPanelOpen = useCallback((open) => setSymbolPanelOpen(open), []);
  const handleInsertSymbol = useCallback((char) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart; const end = ta.selectionEnd;
    setText((current) => current.slice(0, start) + char + current.slice(end));
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + char.length; }, 0);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-background text-foreground px-4 py-5 sm:px-6 lg:px-8">
      <div className="ambient-orb ambient-orb-left" />
      <div className="ambient-orb ambient-orb-right" />
      <div className="relative z-10 mx-auto max-w-[1500px]">
        <Header isDark={isDark} onToggleTheme={handleToggleTheme} />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_345px] xl:gap-6">
          <motion.main initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="rounded-2xl border border-border/80 bg-card/90 p-4 shadow-soft backdrop-blur-xl sm:p-6">
            <div className="mb-3 flex items-center gap-2 text-primary">
              <FileText className="h-5 w-5" />
              <label htmlFor="inputText" className="text-base font-bold">Your Text</label>
            </div>
            <div className="relative">
              <textarea ref={textareaRef} id="inputText" value={text} onChange={(e) => setText(e.target.value)} onPaste={handlePaste} maxLength={20000} placeholder="Paste your content here to scan for banned words..." className="min-h-[190px] w-full resize-y rounded-2xl border border-border bg-input/60 p-4 pb-9 text-sm leading-6 text-foreground shadow-inner outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 sm:min-h-[225px] sm:text-base" />
              <span className="absolute bottom-3 right-4 text-xs text-muted-foreground">{text.length}/20000</span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[220px_minmax(0,1fr)] md:items-center">
              <CountrySelector selectedCountry={selectedCountry} onCountryChange={setSelectedCountry} />
              <div className="flex w-full justify-end gap-3">
                <button onClick={handleReset} className="flex h-12 w-[130px] items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-muted-foreground transition hover:border-primary hover:bg-secondary hover:text-foreground">
                  <RotateCcw className="h-4 w-4" /> Clear
                </button>
                <button onClick={handleAnalyze} disabled={isAnalyzing || !text.trim()} className="flex h-12 w-[230px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50">
                  {isAnalyzing ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Search className="h-4 w-4" />}
                  {isAnalyzing ? "Scanning..." : "Scan for Banned Words"}
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/[0.035] p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-2 text-primary"><Shield className="h-5 w-5" /><span className="font-bold">Scan Result</span></div>
              {result ? <ResultsDisplay result={result} /> : <div className="empty-result"><Search strokeWidth={3.2} className="h-14 w-14 text-primary/75" /><p className="font-bold text-foreground">No scan yet</p><p>Enter your text above and click the scan button<br className="hidden sm:block" /> to check for banned words.</p></div>}
            </div>

            <button onClick={() => setInfoOpen(true)} className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-accent"><HelpCircle className="h-4 w-4" /> Need help?</button>
          </motion.main>

          <aside className="space-y-4">
            <InfoCard icon={<Info className="h-5 w-5" />} title="About" tone="blue"><p>The Ban Word Checker helps you find banned or restricted words in your text. It&apos;s quick, easy and keeps your posts safe for the community.</p></InfoCard>
            <InfoCard icon={<CheckCircle2 className="h-5 w-5" />} title="What We Check" tone="green"><ul><li>Banned and restricted words</li><li>Inappropriate language</li><li>Hate speech</li><li>Spam and harmful content</li></ul></InfoCard>
            <InfoCard icon={<HelpCircle className="h-5 w-5" />} title="FAQ" tone="purple"><div className="faq-list"><FaqItem id="banned" openFaq={openFaq} setOpenFaq={setOpenFaq} question="Why are certain words banned on Brainly?">The platform uses automated filters to keep the community safe, educational, and family-friendly.</FaqItem><FaqItem id="safe" openFaq={openFaq} setOpenFaq={setOpenFaq} question="Is my text data safe here?">Your text is sent for analysis and is not saved in the database. The private ban-word list stays on the server.</FaqItem><FaqItem id="flagged" openFaq={openFaq} setOpenFaq={setOpenFaq} question="What should I do if content is flagged?">Use the Symbol Finder to explore alternate characters.</FaqItem></div></InfoCard>
          </aside>
        </div>
      </div>

      <AnimatePresence>{infoOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setInfoOpen(false)} className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" /><motion.div initial={{ opacity: 0, scale: .95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .95, y: 10 }} className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between border-b border-border pb-3"><h2 className="flex items-center gap-2 font-bold"><HelpCircle className="h-5 w-5 text-primary" /> App Information</h2><button onClick={() => setInfoOpen(false)} className="rounded-lg bg-secondary px-3 py-1 text-xs font-semibold">Close</button></div><h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">- How to Use the Ban Checker?</h3><ol className="mb-6 list-decimal space-y-2 pl-5 text-sm text-muted-foreground"><li>Select the platform version you want to post your content (<strong className="text-foreground">Brainly.ph</strong> or <strong className="text-foreground">Brainly.com</strong>).</li><li>Paste your text, question, or answer inside the input box.</li><li>Click the <strong className="text-foreground">Analyze Content</strong> button.</li><li>The system highlights flagged or sensitive words that might trigger an account ban.</li></ol></motion.div></div>}</AnimatePresence>
      {toastVisible && <div className="fixed bottom-6 left-1/2 z-50 w-[min(90vw,28rem)] -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-950/95 px-4 py-3 text-center text-sm text-white shadow-2xl">{toastMessage}</div>}
      <SymbolPanel isOpen={symbolPanelOpen} onClose={handleSetSymbolPanelOpen} clearSearchKey={symbolSearchResetKey} onInsertSymbol={handleInsertSymbol} onShowToast={showToast} />
    </div>
  );
}

function InfoCard({ icon, title, tone, children }) {
  return <section className={`info-card info-card-${tone}`}><div className="mb-2 flex items-center gap-3 font-bold"><span className="info-card-icon">{icon}</span><h2>{title}</h2></div><div className="text-sm leading-6 text-muted-foreground">{children}</div></section>;
}

function FaqItem({ id, openFaq, setOpenFaq, question, children }) {
  const isOpen = openFaq === id;
  return <div><button type="button" aria-expanded={isOpen} onClick={() => setOpenFaq(isOpen ? null : id)}>{question} <ChevronDown className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} /></button>{isOpen && <p className="faq-answer">{children}</p>}</div>;
}
