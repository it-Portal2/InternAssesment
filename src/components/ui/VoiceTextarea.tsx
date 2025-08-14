import React, { useState, useEffect, useRef } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  language?: string;
  silenceTimeout?: number;
  className?: string;
}

export const VoiceTextarea: React.FC<VoiceTextareaProps> = ({
  value,
  onChange,
  placeholder = "Type or speak your answer...",
  rows = 4,
  language = "en-US",
  silenceTimeout = 10000,
  className = "",
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isListeningRef = useRef<boolean>(false);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Auto-resize textarea height based on content
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const maxHeight = 200; // Maximum height in pixels
      const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

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

        if (transcript) {
          const finalContent = value + (value ? " " : "") + transcript;
          onChange(finalContent);
          setTranscript("");
        }
      }
    }, silenceTimeout);
  };

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
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
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript + interimTranscript);

      if (finalTranscript || interimTranscript) {
        startSilenceTimer();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted") {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      isListeningRef.current = false;
      clearSilenceTimer();

      if (transcript) {
        const finalContent = value + (value ? " " : "") + transcript;
        onChange(finalContent);
        setTranscript("");
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

  // Adjust height when content changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [value, transcript]);

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;

    setTranscript("");
    setError(null);

    try {
      recognitionRef.current.start();
    } catch (err) {
      setError(`Failed to start speech recognition: ${err}`);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current || !isListening) return;

    clearSilenceTimer();
    setIsListening(false);
    isListeningRef.current = false;
    recognitionRef.current.stop();

    if (transcript) {
      const finalContent = value + (value ? " " : "") + transcript;
      onChange(finalContent);
      setTranscript("");
    }
  };

  const displayValue =
    value + (isListening && transcript ? (value ? " " : "") + transcript : "");

  if (!isSupported) {
    return (
      <div className="w-full">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={cn(
            "w-full p-3 border border-gray-300 rounded-md resize-none",
            "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "overflow-hidden break-words whitespace-pre-wrap",
            className
          )}
          style={{
            wordWrap: "break-word",
            overflowWrap: "break-word",
            whiteSpace: "pre-wrap",
            lineHeight: "1.5",
            minHeight: `${rows * 1.5}rem`,
            maxHeight: "200px",
            overflowY: "auto",
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <div className="relative w-full">
        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={(e) => {
            if (!isListening) {
              onChange(e.target.value);
            }
          }}
          placeholder={placeholder}
          rows={rows}
          readOnly={isListening}
          className={cn(
            // Base styles
            "w-full p-3 pr-12 border rounded-md resize-none",
            "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            // Text wrapping styles - CRITICAL
            "break-words whitespace-pre-wrap overflow-hidden",
            // State-based styling
            error
              ? "border-red-300 bg-red-50"
              : isListening
              ? "border-blue-300 bg-blue-50"
              : "border-gray-300",
            className
          )}
          style={{
            // FORCE text wrapping with inline styles
            wordWrap: "break-word",
            overflowWrap: "break-word",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            lineHeight: "1.5",
            minHeight: `${rows * 1.5}rem`,
            maxHeight: "200px",
            overflowY: "auto",
            overflowX: "hidden", // Prevent horizontal scrolling
            width: "100%",
            boxSizing: "border-box",
          }}
        />

        <div className="absolute bottom-3 right-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={isListening ? stopListening : startListening}
            className="h-8 w-8 p-0 shadow-sm bg-white/90 backdrop-blur-sm hover:bg-white"
          >
            {isListening ? (
              <Square className="h-4 w-4 text-blue-600" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Status messages */}

      {isListening && (
        <div className="flex items-center space-x-1 text-blue-600 text-xs">
          <div className="animate-pulse">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
          <span>Listening...</span>
        </div>
      )}

      {error && <div className="text-red-500 text-xs">{error}</div>}
    </div>
  );
};
