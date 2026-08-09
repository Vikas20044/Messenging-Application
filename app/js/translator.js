// AI Multi-Language Message Translation Engine (Grok AI Cloud Powered)

async function translateMessageText(messageId, arg2, arg3, arg4) {
    const displayTextBox = document.getElementById(`text-span-${messageId}`);
    if (!displayTextBox) return;

    // Close any active message menus
    document.querySelectorAll('.msg-dropdown').forEach(d => d.classList.add('hidden'));

    let rawText = '';
    let langCode = 'en';
    let langName = 'English';

    if (arg4 !== undefined) {
        rawText = arg2;
        langCode = arg3;
        langName = arg4;
    } else {
        langCode = arg2;
        langName = arg3;
        const msg = typeof messageStore !== 'undefined' ? messageStore.get(String(messageId)) : null;
        rawText = (msg && msg.text) ? msg.text : (displayTextBox.dataset.originalText || displayTextBox.innerText);
    }

    if (!rawText || !rawText.trim()) return;

    // Cache original raw text on element dataset
    if (!displayTextBox.dataset.originalText) {
        displayTextBox.dataset.originalText = rawText;
    }

    // Direct restore to original text if requested
    if (langCode === 'en' || langCode === 'original') {
        const originalText = displayTextBox.dataset.originalText || rawText;
        displayTextBox.innerHTML = escapeHTML(originalText);
        return;
    }

    const previousHTML = displayTextBox.innerHTML;
    displayTextBox.innerText = "Translating...";

    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: rawText,
                targetLang: langCode,
                targetLangName: langName
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Translation request failed');
        }

        const data = await response.json();
        if (data.success && data.translatedText) {
            const safeTranslated = escapeHTML(data.translatedText);
            displayTextBox.innerHTML = `${safeTranslated} <span class="translated-label">(Translated to ${escapeHTML(langName)})</span>`;
        } else {
            throw new Error('Invalid translation payload');
        }
    } catch (err) {
        console.error('Translation error:', err);
        displayTextBox.innerHTML = previousHTML;
        if (typeof showToast === 'function') {
            showToast("Translation service currently unavailable.", "error");
        } else {
            alert("Translation service currently unavailable.");
        }
    }
}

