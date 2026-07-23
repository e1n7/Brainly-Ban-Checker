function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function analyzeContent(text, bannedWords) {
    if (!text || (typeof text === 'string' && !text.trim())) {
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

    // Build highlighted preview
    // We use a simple replacement for the text version.
    // If the input was HTML, we'll need to handle it differently in the future,
    // but for now, we'll convert the rich text to HTML with highlights.
    let highlightedHTML = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");

    if (foundWords.length > 0) {
        // Sort by length descending so longer phrases are highlighted first
        const sorted = [...foundWords].sort((a, b) => b.length - a.length);
        
        // Build a map of all occurrences from the original text
        const replacements = [];
        
        sorted.forEach(word => {
            const regex = new RegExp(escapeRegExp(word), "gi");
            let match;
            while ((match = regex.exec(text)) !== null) {
                replacements.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    word: match[0]
                });
            }
        });
        
        // Sort replacements by position, then by length (descending) for ties
        replacements.sort((a, b) => {
            if (a.start !== b.start) return a.start - b.start;
            return (b.end - b.start) - (a.end - a.start); // longer first
        });
        
        // Remove overlapping replacements (keep the longest one)
        const filtered = [];
        for (const replacement of replacements) {
            const overlappingIndex = filtered.findIndex(r => 
                (replacement.start < r.end && replacement.end > r.start)
            );
            if (overlappingIndex >= 0) {
                const overlapping = filtered[overlappingIndex];
                const replacementLen = replacement.end - replacement.start;
                const overlappingLen = overlapping.end - overlapping.start;
                if (replacementLen > overlappingLen) {
                    filtered[overlappingIndex] = replacement;
                }
            } else {
                filtered.push(replacement);  
            }
        }
        
        // Sort filtered by position descending to apply from end to start
        filtered.sort((a, b) => b.start - a.start);
        
        // Apply replacements from end to start (preserves indices)
        let result = text;
        for (const replacement of filtered) {
            result = 
                result.slice(0, replacement.start) +
                `___MARK_START___${result.slice(replacement.start, replacement.end)}___MARK_END___` +
                result.slice(replacement.end);
        }
        
        // Now escape and then replace the markers with real HTML
        highlightedHTML = result
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\n/g, "<br>")
            .replace(/___MARK_START___/g, '<mark class="highlight">')
            .replace(/___MARK_END___/g, '</mark>');
    }

    return { found: foundWords, highlightedHTML };
}