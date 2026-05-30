
/**
 * Speech synthesis utility for voice-guided navigation
 */
export const speak = (text: string, lang: 'EN' | 'HI' = 'EN', enabled: boolean = true) => {
  if (!enabled || typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Trigger loading voices if empty (common on some devices/browsers)
  const voices = window.speechSynthesis.getVoices();
  
  if (lang === 'HI') {
    utterance.lang = 'hi-IN';
    // Try to find a Hindi voice (broadened search pattern)
    const hindiVoice = voices.find(v => 
      v.lang.toLowerCase().includes('hi') || 
      v.name.toLowerCase().includes('hindi') ||
      v.name.includes('Lekha') // Apple's Hindi voice
    );
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }
  } else {
    utterance.lang = 'en-US';
    // Try to find a good English voice (prefer Google/Premium voices if available)
    const englishVoice = voices.find(v => (v.lang.includes('en-US') || v.lang.includes('en-GB')) && v.name.includes('Google')) 
      || voices.find(v => v.lang.includes('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
  }

  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Fallback pattern if voices are loaded asynchronously
  if (voices.length === 0) {
    const onVoicesChanged = () => {
      const updatedVoices = window.speechSynthesis.getVoices();
      if (lang === 'HI') {
        const hindiVoice = updatedVoices.find(v => 
          v.lang.toLowerCase().includes('hi') || 
          v.name.toLowerCase().includes('hindi')
        );
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        const englishVoice = updatedVoices.find(v => (v.lang.includes('en-US') || v.lang.includes('en-GB')) && v.name.includes('Google')) 
          || updatedVoices.find(v => v.lang.includes('en'));
        if (englishVoice) utterance.voice = englishVoice;
      }
      window.speechSynthesis.speak(utterance);
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
    };
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    // Timeout to try anyway if event doesn't fire
    setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        window.speechSynthesis.speak(utterance);
    }, 500);
  } else {
    window.speechSynthesis.speak(utterance);
  }
};

// Hook-like helper for kiosk specific phrases
export const kioskSpeak = (phraseId: string, lang: 'EN' | 'HI' = 'EN', enabled: boolean = true) => {
  const phrases: Record<string, { EN: string; HI: string }> = {
    'WELCOME': {
      EN: 'Welcome. Please select Check In, Pre Registered, Scan Out, or Check Out on the screen to get started.',
      HI: 'नमस्कार। कृपया आगे बढ़ने के लिए स्क्रीन पर दिए गए विकल्पों में से चेक इन, प्री-रजिस्टर्ड, स्कैन आउट या चेक आउट का चयन करें।'
    },
    'CHECK_IN_START': {
      EN: 'Starting check-in. Please provide your details.',
      HI: 'चेक-इन प्रक्रिया शुरू हो रही है। कृपया अपनी जानकारी दर्ज करें।'
    },
    'PREREG_START': {
      EN: 'Please enter your phone number or pre-registration code.',
      HI: 'कृपया अपना फोन नंबर या प्री-रजिस्ट्रेशन कोड दर्ज करें।'
    },
    'CHECK_OUT_START': {
      EN: 'Please enter your phone number to check out.',
      HI: 'चेक-आउट करने के लिए कृपया अपना फ़ोन नंबर दर्ज करें।'
    },
    'SCAN_OUT_START': {
      EN: 'Please scan your Q R pass.',
      HI: 'कृपया अपना क्यू-आर पास स्कैनर पर दिखाएं।'
    },
    'CHECK_IN_SUCCESS': {
      EN: 'Check-in successful. Have a great day!',
      HI: 'चेक-इन सफलतापूर्वक पूरा हो गया है। आपका दिन शुभ हो।'
    },
    'CHECK_OUT_SUCCESS': {
      EN: 'Check-out successful. Thank you for visiting!',
      HI: 'चेक-आउट सफलतापूर्वक पूरा हो गया है। पधारने के लिए धन्यवाद।'
    },
    'CALL_STAFF': {
      EN: 'Staff have been notified. Please wait a moment.',
      HI: 'स्टाफ को सूचित कर दिया गया है। कृपया सहयोग करें और प्रतीक्षा करें।'
    },
    'INVALID_QR': {
      EN: 'Invalid Q R code. Please try scanning again.',
      HI: 'यह क्यू-आर कोड अमान्य है। कृपया दोबारा स्कैन करें।'
    },
    'NOT_FOUND': {
      EN: 'Information not found. Please try again.',
      HI: 'कोई जानकारी नहीं मिली। कृपया दोबारा चेक करें।'
    },
    'FORM_CLOSED': {
      EN: 'Operation cancelled. Returning to home screen.',
      HI: 'प्रक्रिया रद्द कर दी गई है। मुख्य स्क्रीन पर लौट रहे हैं।'
    },
    'EXIT_KIOSK': {
      EN: 'Exiting kiosk mode.',
      HI: 'कियोस्क मोड बंद किया जा रहा है।'
    },
    'EXIT_PIN_REQUIRED': {
      EN: 'Please enter your authorization PIN to exit kiosk mode.',
      HI: 'कियोस्क मोड से बाहर निकलने के लिए कृपया अपना पिन दर्ज करें।'
    },
    'ENTER_PIN_REQUIRED': {
      EN: 'Please enter your authorization PIN to start kiosk mode.',
      HI: 'कियोस्क मोड शुरू करने के लिए कृपया अपना पिन दर्ज करें।'
    }
  };

  const phrase = phrases[phraseId];
  if (phrase) {
    speak(phrase[lang], lang, enabled);
  }
};
