// AI Multi-Language Translation Engine Helper

async function translateMessageText(messageId, rawText, langCode, langName) {
    const displayTextBox = document.getElementById(`text-span-${messageId}`);
    if (!displayTextBox) return;

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
        if(responseData && responseData[0]) {
            responseData[0].forEach(item => { if(item[0]) translatedOutput += item[0]; });
        }

        if (langCode === 'en') {
            displayTextBox.innerHTML = translatedOutput;
        } else {
            displayTextBox.innerHTML = `${translatedOutput} <span class="translated-label">(Translated to ${langName})</span>`;
        }
    } catch (err) {
        displayTextBox.innerHTML = originalContent;
        alert("Translation endpoint network timeout.");
    }
}
