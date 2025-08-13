// hooks/useIndustrySpeechToText.ts
import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  silenceTimeout?: number;
}

export const useIndustrySpeechToText = (config: SpeechConfig) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const isListeningRef = useRef<boolean>(false);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const silenceTimeout = config.silenceTimeout || 10000;

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimeoutRef.current = setTimeout(() => {
      if (recognitionRef.current && isListeningRef.current) {
        setError(`Stopped listening due to ${silenceTimeout / 1000} seconds of silence`);
        stopListening();
      }
    }, silenceTimeout);
  }, [silenceTimeout, clearSilenceTimer]);

  const resetSilenceTimer = useCallback(() => {
    lastSpeechTimeRef.current = Date.now();
    startSilenceTimer();
  }, [startSilenceTimer]);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    setIsListening(false);
    isListeningRef.current = false;
    recognitionRef.current?.stop();
  }, [clearSilenceTimer]);

  const handleSpeechError = (error: string): string => {
    switch (error) {
      case 'network':
        return 'Network error. Check your connection.';
      case 'not-allowed':
        return 'Microphone access denied. Please allow microphone access.';
      case 'no-speech':
        return 'No speech detected. Please try again.';
      case 'audio-capture':
        return 'Microphone not available.';
      case 'aborted':
        return '';
      default:
        return `Speech recognition error: ${error}`;
    }
  };

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      // Manual stop — instant
      stopListening();
    } else {
      // Manual start
      setError(null);
      setIsListening(true);
      isListeningRef.current = true;
      resetSilenceTimer();

      try {
        recognitionRef.current.start();
      } catch (err) {
        setError('Failed to start speech recognition');
        stopListening();
      }
    }
  }, [isListening, stopListening, resetSilenceTimer]);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionConstructor();

    recognition.continuous = config.continuous;
    recognition.interimResults = config.interimResults;
    recognition.lang = config.language;
    recognition.maxAlternatives = config.maxAlternatives;

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      setError(null);
      resetSilenceTimer();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let hasSpeech = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptPart = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcriptPart + ' ';
          hasSpeech = true;
        } else if (transcriptPart.trim().length > 0) {
          hasSpeech = true;
        }
      }

      if (hasSpeech) {
        resetSilenceTimer();
        if (error?.includes('silence')) {
          setError(null);
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
      }
    };

    recognition.onspeechstart = () => {
      resetSilenceTimer();
      if (error?.includes('silence')) {
        setError(null);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted') {
        setError(handleSpeechError(event.error));
      }
    };

    recognition.onend = () => {
      // Only restart if listening was NOT stopped manually
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (err) {
          console.error('Restart failed:', err);
        }
      } else {
        clearSilenceTimer();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      clearSilenceTimer();
    };
  }, [config, isSupported, resetSilenceTimer, clearSilenceTimer, error, stopListening]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  return {
    transcript,
    isListening,
    isSupported,
    toggleListening,
    resetTranscript: () => setTranscript(''),
    error,
    timeSinceLastSpeech: lastSpeechTimeRef.current
      ? Date.now() - lastSpeechTimeRef.current
      : 0
  };
};
