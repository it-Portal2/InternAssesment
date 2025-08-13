
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface VoiceTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  language?: string;
  silenceTimeout?: number;
}

export const VoiceTextarea: React.FC<VoiceTextareaProps> = ({
  value,
  onChange,
  placeholder = "Type or speak your answer...",
  rows = 4,
  language = "en-US",
  silenceTimeout = 10000
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isListeningRef = useRef<boolean>(false);

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Clear silence timer
  const clearSilenceTimer = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  };

  // Start silence timer
  const startSilenceTimer = () => {
    clearSilenceTimer();
    silenceTimeoutRef.current = setTimeout(() => {
      if (recognitionRef.current && isListeningRef.current) {
        setIsListening(false);
        isListeningRef.current = false;
        recognitionRef.current.stop();
        
        // Finalize transcript
        if (transcript) {
          const finalContent = value + (value ? ' ' : '') + transcript;
          onChange(finalContent);
          setTranscript('');
        }
      }
    }, silenceTimeout);
  };

  // Initialize speech recognition for this specific textarea
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionConstructor();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      setError(null);
      startSilenceTimer();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Update transcript state for real-time display
      setTranscript(finalTranscript + interimTranscript);
      
      // Reset silence timer when speech is detected
      if (finalTranscript || interimTranscript) {
        startSilenceTimer();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      isListeningRef.current = false;
      clearSilenceTimer();
      
      // Finalize transcript when recognition ends
      if (transcript) {
        const finalContent = value + (value ? ' ' : '') + transcript;
        onChange(finalContent);
        setTranscript('');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognition) {
        recognition.abort();
      }
      clearSilenceTimer();
    };
  }, [isSupported, language, silenceTimeout]);

  // Update transcript in real-time
  useEffect(() => {
    if (transcript && isListening) {
      // Show real-time transcript but don't save to form yet
      // It will be saved when recognition stops
    }
  }, [transcript, isListening]);

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;
    
    setTranscript('');
    setError(null);
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      setError('Failed to start speech recognition');
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current || !isListening) return;
    
    clearSilenceTimer();
    setIsListening(false);
    isListeningRef.current = false;
    recognitionRef.current.stop();
    
    // Immediately finalize transcript
    if (transcript) {
      const finalContent = value + (value ? ' ' : '') + transcript;
      onChange(finalContent);
      setTranscript('');
    }
  };

  if (!isSupported) {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          value={value + (isListening && transcript ? (value ? ' ' : '') + transcript : '')}
          onChange={(e) => {
            // Only allow manual editing when not listening
            if (!isListening) {
              onChange(e.target.value);
            }
          }}
          placeholder={placeholder}
          rows={rows}
          className={
            error 
              ? "border-red-300 bg-red-50" 
              : isListening 
              ? "border-blue-300 bg-blue-50" 
              : ""
          }
          readOnly={isListening}
        />
        
        <div className="absolute bottom-4 right-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={isListening ? stopListening : startListening}
            className="h-8 w-8 p-0"
          >
            {isListening ? (
              <Square className="h-4 w-4 text-blue-600" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Status messages below textarea */}
      <div className="min-h-[20px]">
        {isListening && (
          <div className="flex items-center space-x-1 text-blue-600 text-xs">
            <div className="animate-pulse">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <span>Listening...</span>
          </div>
        )}
        
        {error && (
          <div className="text-red-500 text-xs">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
