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

    // Build highlighted preview
    let highlightedHTML = text;
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
                `<mark class="highlight">${result.slice(replacement.start, replacement.end)}</mark>` +
                result.slice(replacement.end);
        }
        
        highlightedHTML = result;
    }

    return { found: foundWords, highlightedHTML };
}