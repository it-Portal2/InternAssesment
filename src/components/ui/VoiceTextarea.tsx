import React, { useState, useEffect, useRef } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isListeningRef = useRef<boolean>(false);
  // Track the base value when listening started - this is key for preserving text
  const baseValueRef = useRef<string>("");
  // Track all finalized transcripts during this listening session
  const finalizedTranscriptRef = useRef<string>("");

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const handleCopyPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    toast.error("Copy and paste are disabled for this field");
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const maxHeight = 200;
      const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  const clearSilenceTimer = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  };

  const commitTranscript = () => {
    // Combine base value + all finalized text from this session
    const finalText = finalizedTranscriptRef.current.trim();
    if (finalText) {
      const newValue =
        baseValueRef.current + (baseValueRef.current ? " " : "") + finalText;
      onChange(newValue);
    }
    setInterimTranscript("");
    finalizedTranscriptRef.current = "";
  };

  const startSilenceTimer = () => {
    clearSilenceTimer();
    silenceTimeoutRef.current = setTimeout(() => {
      if (recognitionRef.current && isListeningRef.current) {
        setIsListening(false);
        isListeningRef.current = false;
        recognitionRef.current.stop();
        commitTranscript();
      }
    }, silenceTimeout);
  };

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
      let sessionFinal = "";
      let sessionInterim = "";

      // Process ALL results from the beginning to build complete transcript
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          sessionFinal += result[0].transcript;
        } else {
          sessionInterim += result[0].transcript;
        }
      }

      // Store all finalized text
      finalizedTranscriptRef.current = sessionFinal;
      // Show interim text separately (this is what user is currently saying)
      setInterimTranscript(sessionInterim);

      // Reset silence timer on any speech activity
      if (sessionFinal || sessionInterim) {
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
      commitTranscript();
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognition) {
        recognition.abort();
      }
      clearSilenceTimer();
    };
  }, [isSupported, language, silenceTimeout]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [value, interimTranscript]);

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;

    // Store the current value as the base - this preserves existing text
    baseValueRef.current = value;
    finalizedTranscriptRef.current = "";
    setInterimTranscript("");
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
    commitTranscript();
  };

  // Build display value: base + finalized + interim (all accumulated properly)
  const displayValue = isListening
    ? baseValueRef.current +
      (baseValueRef.current &&
      (finalizedTranscriptRef.current || interimTranscript)
        ? " "
        : "") +
      finalizedTranscriptRef.current +
      (finalizedTranscriptRef.current && interimTranscript ? " " : "") +
      interimTranscript
    : value;

  if (!isSupported) {
    return (
      <div className="w-full">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          onCopy={handleCopyPaste}
          onPaste={handleCopyPaste}
          onCut={handleCopyPaste}
          className={cn(
            "w-full p-3 border bg-white/5 border-white/20 backdrop-blur-md text-white rounded-lg resize-none",
            "focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500",
            "placeholder:text-gray-500",
            "overflow-hidden break-words whitespace-pre-wrap",
            className,
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
          onCopy={handleCopyPaste}
          onPaste={handleCopyPaste}
          onCut={handleCopyPaste}
          className={cn(
            "w-full p-3 pr-12 rounded-lg resize-none text-white",
            "focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500",
            "placeholder:text-gray-500",
            "break-words whitespace-pre-wrap overflow-hidden",
            error
              ? "border-red-500/50"
              : isListening
                ? "border-yellow-500/50"
                : "",
            className,
          )}
          style={{
            backgroundColor: error
              ? "rgba(127, 29, 29, 0.2)"
              : isListening
                ? "rgba(234, 179, 8, 0.1)"
                : "rgba(255, 255, 255, 0.05)",
            borderColor: error
              ? "rgba(239, 68, 68, 0.5)"
              : isListening
                ? "rgba(234, 179, 8, 0.5)"
                : "rgba(75, 75, 75, 0.8)",
            borderWidth: "1px",
            borderStyle: "solid",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            lineHeight: "1.5",
            minHeight: `${rows * 1.5}rem`,
            maxHeight: "200px",
            overflowY: "auto",
            overflowX: "hidden",
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
            className="h-8 w-8 p-0 shadow-sm bg-white/5 border-white/20 backdrop-blur-md hover:bg-gray-700 hover:border-yellow-500"
          >
            {isListening ? (
              <Square className="h-4 w-4 text-yellow-400" />
            ) : (
              <Mic className="h-4 w-4 text-yellow-400" />
            )}
          </Button>
        </div>
      </div>

      {isListening && (
        <div className="flex items-center space-x-1 text-yellow-400 text-xs">
          <div className="animate-pulse">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          </div>
          <span>Listening...</span>
        </div>
      )}

      {error && <div className="text-red-400 text-xs">{error}</div>}
    </div>
  );
};
