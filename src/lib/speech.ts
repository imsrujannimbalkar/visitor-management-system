
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
      EN: 'Welcome! Please select Check In, Pre-Registered, Scan Out, or Check Out to get started.',
      HI: 'नमस्ते! शुरू करने के लिए कृपया चेक इन, प्री-रजिस्टर्ड, स्कैन आउट या चेक आउट चुनें।'
    },
    'CHECK_IN_START': {
      EN: 'Starting check-in. Please fill in your details.',
      HI: 'चेक-इन शुरू हो रहा है। कृपया अपना विवरण भरें।'
    },
    'PREREG_START': {
      EN: 'Please enter your phone number or pre-registration code.',
      HI: 'कृपया अपना फोन नंबर या पूर्व-पंजीकरण कोड दर्ज करें।'
    },
    'CHECK_OUT_START': {
      EN: 'Please enter your phone number to check out.',
      HI: 'चेक आउट करने के लिए कृपया अपना फ़ोन नंबर दर्ज करें।'
    },
    'SCAN_OUT_START': {
      EN: 'Please scan your Q R pass.',
      HI: 'कृपया अपना क्यू आर पास स्कैन करें।'
    },
    'CHECK_IN_SUCCESS': {
      EN: 'Check-in successful. Have a great visit!',
      HI: 'चेक-इन सफल रहा। आपकी यात्रा सुखद हो!'
    },
    'CHECK_OUT_SUCCESS': {
      EN: 'Checked out successfully. Thank you for visiting!',
      HI: 'चेक आउट सफल रहा। आने के लिए धन्यवाद!'
    },
    'CALL_STAFF': {
      EN: 'Staff notified. Please wait a moment.',
      HI: 'कर्मचारियों को सूचित कर दिया गया है। कृपया प्रतीक्षा करें।'
    },
    'INVALID_QR': {
      EN: 'Invalid Q R code. Please try again.',
      HI: 'अमान्य क्यू आर कोड। कृपया पुनः प्रयास करें।'
    },
    'NOT_FOUND': {
      EN: 'Record not found. Please try again.',
      HI: 'रिकॉर्ड नहीं मिला। कृपया पुनः प्रयास करें।'
    },
    'FORM_CLOSED': {
      EN: 'Form closed. Returning to home screen.',
      HI: 'फॉर्म बंद कर दिया गया है। होम स्क्रीन पर वापस जा रहे हैं।'
    },
    'EXIT_KIOSK': {
      EN: 'Exiting Kiosk Mode.',
      HI: 'कियोस्क मोड से बाहर निकल रहे हैं।'
    }
  };

  const phrase = phrases[phraseId];
  if (phrase) {
    speak(phrase[lang], lang, enabled);
  }
};
