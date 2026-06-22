function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function analyzeContent(text, bannedWords) {
    if (!text.trim()) {
        return { found: [], highlightedHTML: "" };
    }

    const lowerText = text.toLowerCase();
    const foundWords = [];

    bannedWords.forEach(word => {
        const lowerWord = word.toLowerCase();
        if (lowerText.includes(lowerWord)) {
            foundWords.push(word);
        }
    });

    // Build highlighted preview (same logic as original)
    let highlightedHTML = text;
    if (foundWords.length > 0) {
        // Sort by length descending so longer phrases are highlighted first
        const sorted = [...foundWords].sort((a, b) => b.length - a.length);
        sorted.forEach(word => {
            const regex = new RegExp(escapeRegExp(word), "gi");
            highlightedHTML = highlightedHTML.replace(
                regex,
                `<mark class="highlight">$&</mark>`
            );
        });
    }

    return { found: foundWords, highlightedHTML };
}

