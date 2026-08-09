// AI Multi-Language Translation Engine Helper

async function translateMessageText(messageId, arg2, arg3, arg4) {
    const displayTextBox = document.getElementById(`text-span-${messageId}`);
    if (!displayTextBox) return;

    let rawText = '';
    let langCode = 'en';
    let langName = 'English';

    if (arg4 !== undefined) {
        // Called with (messageId, rawText, langCode, langName)
        rawText = arg2;
        langCode = arg3;
        langName = arg4;
    } else {
        // Called with (messageId, langCode, langName)
        langCode = arg2;
        langName = arg3;
        const msg = typeof messageStore !== 'undefined' ? messageStore.get(String(messageId)) : null;
        rawText = msg ? msg.text : displayTextBox.innerText;
    }

    if (!rawText) return;

    const originalContent = displayTextBox.innerHTML;
    try {
        if (langCode === 'en') {
            displayTextBox.innerText = "Restoring to original English...";
        } else {
            displayTextBox.innerText = `Translating to ${langName}...`;
        }
        
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(rawText)}`);
        if (!res.ok) throw new Error();
        
        const responseData = await res.json();
        let translatedOutput = "";
        if (responseData && responseData[0]) {
            responseData[0].forEach(item => { if (item[0]) translatedOutput += item[0]; });
        }

        const safeTranslated = escapeHTML(translatedOutput);

        if (langCode === 'en') {
            displayTextBox.innerHTML = safeTranslated;
        } else {
            displayTextBox.innerHTML = `${safeTranslated} <span class="translated-label">(Translated to ${escapeHTML(langName)})</span>`;
        }
    } catch (err) {
        displayTextBox.innerHTML = originalContent;
        if (typeof showToast === 'function') {
            showToast("Translation service currently unavailable.", "error");
        } else {
            alert("Translation service currently unavailable.");
        }
    }
}
