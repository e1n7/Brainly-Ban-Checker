import bannedWordsData from './src/lib/bannedWords.json' assert { type: 'json' };

const bannedWords = [
    ...bannedWordsData.bannedWordsPH,
    ...bannedWordsData.bannedWordsUS,
];

function escapeRegex(word) {
    return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const toastMessage = document.getElementById('toastMessage');
    if (!toastMessage) return;

    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

function checkBanWords() {
    const inputText = document.getElementById('inputText')?.value || '';
    const checkBtn = document.getElementById('checkBtn');

    if (!inputText.trim()) {
        showToast('Please enter some text to analyze');
        return;
    }

    if (checkBtn) {
        checkBtn.disabled = true;
        checkBtn.innerHTML = `
            <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <span>Analyzing...</span>
        `;
    }

    setTimeout(() => {
        const textLower = inputText.toLowerCase();
        const foundWords = [];
        let highlightedText = inputText;

        bannedWords.forEach(word => {
            const wordLower = word.toLowerCase();
            if (textLower.includes(wordLower)) {
                if (!foundWords.includes(word)) {
                    foundWords.push(word);
                }
                const escapedWord = escapeRegex(word);
                const regex = new RegExp(`(?!<[^>]*?)(${escapedWord})(?![^<]*?>)`, 'gi');
                highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>');
            }
        });

        const resultsContainer = document.getElementById('resultsContainer');
        const previewSection = document.getElementById('previewSection');
        const highlightedTextDiv = document.getElementById('highlightedText');

        if (resultsContainer) {
            if (foundWords.length > 0) {
                resultsContainer.innerHTML = `
                    <div class="results-box danger">
                        <div class="results-content">
                            <h3>Found ${foundWords.length} banned word${foundWords.length > 1 ? 's' : ''}</h3>
                            <div class="detected-words">
                                ${foundWords.map(word => `<span class="word-badge">${word}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                `;
            } else {
                resultsContainer.innerHTML = `
                    <div class="results-box success">
                        <div class="results-content">
                            <h3>No banned words detected</h3>
                        </div>
                    </div>
                `;
            }
        }

        if (previewSection) {
            previewSection.style.display = 'block';
        }
        if (highlightedTextDiv) {
            highlightedTextDiv.innerHTML = highlightedText;
        }

        if (checkBtn) {
            checkBtn.disabled = false;
            checkBtn.innerHTML = `
                <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.3-4.3"/>
                </svg>
                <span>Analyze Content</span>
            `;
        }
    }, 500);
}

function resetFields() {
    const input = document.getElementById('inputText');
    const resultsContainer = document.getElementById('resultsContainer');
    const previewSection = document.getElementById('previewSection');
    const highlightedTextDiv = document.getElementById('highlightedText');

    if (input) input.value = '';
    if (resultsContainer) resultsContainer.innerHTML = '';
    if (previewSection) previewSection.style.display = 'none';
    if (highlightedTextDiv) highlightedTextDiv.innerHTML = '';
}

window.checkBanWords = checkBanWords;
window.resetFields = resetFields;

