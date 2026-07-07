const { pipeline, env } = require('@xenova/transformers');
// Express 5/Node 18+ has global fetch

// Configure transformers to not look for local models
env.allowLocalModels = false;

let transcriber = null;

const initWhisper = async () => {
    if (!transcriber) {
        console.log('Initializing Whisper Tiny model on the server...');
        transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
        console.log('Whisper Tiny model loaded successfully.');
    }
    return transcriber;
};

// Auto-warmup the model on module load
initWhisper().catch(err => {
    console.error('Failed to initialize Whisper Tiny model:', err);
});

const transcribeAudio = async (audioSamples) => {
    try {
        const pipe = await initWhisper();
        // Convert input array to Float32Array if it's not already
        const float32Array = audioSamples instanceof Float32Array 
            ? audioSamples 
            : new Float32Array(audioSamples);

        const result = await pipe(float32Array);
        return result.text || '[No speech detected]';
    } catch (err) {
        console.error('Whisper transcription error:', err);
        throw err;
    }
};

const translateText = async (text, targetLang) => {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Translation API responded with status ${res.status}`);
        
        const data = await res.json();
        let translatedText = '';
        if (data && data[0]) {
            data[0].forEach(item => {
                if (item[0]) translatedText += item[0];
            });
        }
        return translatedText;
    } catch (err) {
        console.error('Translation service error:', err);
        throw err;
    }
};

module.exports = {
    transcribeAudio,
    translateText
};
