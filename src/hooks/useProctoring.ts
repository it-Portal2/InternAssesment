import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

interface UseProctoringProps {
  isActive: boolean;
  onWarning: (reason: string, count: number) => void;
  onTerminate: (reason: string) => void;
  maxViolations?: number;
}

export const useProctoring = ({
  isActive,
  onWarning,
  onTerminate,
  maxViolations = 3,
}: UseProctoringProps) => {
  const [violationCount, setViolationCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastViolationTime = useRef<number>(0);
  const pendingViolation = useRef<string | null>(null);
  const DEBOUNCE_MS = 1000; // Prevent double-triggers within 1 second

  const processViolation = useCallback(
    (reason: string) => {
      setViolationCount((prev) => {
        const newCount = prev + 1;

        if (newCount >= maxViolations) {
          // Termination - show final modal
          onTerminate(reason);
        } else {
          // Warning - show warning modal
          onWarning(reason, newCount);
        }

        return newCount;
      });
    },
    [maxViolations, onWarning, onTerminate]
  );

  const incrementViolation = useCallback(
    (reason: string) => {
      if (!isActive) return;

      const now = Date.now();

      // If within debounce window, update pending reason but don't trigger yet
      if (now - lastViolationTime.current < DEBOUNCE_MS) {
        // Update reason to be more comprehensive if multiple events
        if (
          pendingViolation.current &&
          !pendingViolation.current.includes(reason)
        ) {
          pendingViolation.current = `${pendingViolation.current} and ${reason}`;
        }
        return;
      }

      // Outside debounce window - process immediately
      lastViolationTime.current = now;
      pendingViolation.current = reason;
      processViolation(reason);
    },
    [isActive, processViolation]
  );

  // Periodic AI Monitoring Messages (every 2 minutes)
  useEffect(() => {
    if (!isActive) return;

    const AI_MONITORING_MESSAGES = [
      {
        title: "Face Check",
        description: "We are continuously monitoring. Look only at the screen.",
      },
      {
        title: "Eye Tracking",
        description:
          "We are watching where you look. Keep your eyes on the test.",
      },
      {
        title: "Room Check",
        description: "We are checking your room for any notes or phones.",
      },
      {
        title: "Activity Check",
        description: "We are watching your activity. Stay focused.",
      },
      {
        title: "Identity Check",
        description: "We are verifying it is you. Please stay seated.",
      },
      {
        title: "Movement Check",
        description: "We noticed you moved. Please sit still.",
      },
      {
        title: "Sound Check",
        description: "We are listening for any talking or sounds.",
      },
      {
        title: "Screen Check",
        description: "We can see if you try to open other windows.",
      },
      {
        title: "Head Check",
        description: "We are tracking your head. Please face forward.",
      },
      {
        title: "Focus Check",
        description: "We are monitoring your attention level.",
      },
    ];

    let lastMessageIndex = -1;

    const showRandomMessage = () => {
      // Pick a random message different from the last one
      let index;
      do {
        index = Math.floor(Math.random() * AI_MONITORING_MESSAGES.length);
      } while (index === lastMessageIndex && AI_MONITORING_MESSAGES.length > 1);

      lastMessageIndex = index;
      const msg = AI_MONITORING_MESSAGES[index];

      toast.info(msg.title, {
        description: msg.description,
        duration: 10000,
      });
    };

    // Show first message after 30 seconds
    const initialTimeout = setTimeout(showRandomMessage, 30000);

    // Then show every 2 minutes
    const interval = setInterval(showRandomMessage, 120000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isActive]);

  const enterFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error("Error attempting to enable fullscreen:", err);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;

    // Force fullscreen on activation - with retries
    const attemptFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await enterFullscreen();
        }
      } catch (e) {
        console.error("Fullscreen attempt failed", e);
      }
    };

    // Initial attempt with delay
    const timer = setTimeout(attemptFullscreen, 300);

    // Retry every 2 seconds if still not fullscreen
    const interval = setInterval(() => {
      if (!document.fullscreenElement && isActive) {
        attemptFullscreen();
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isActive, enterFullscreen]);

  useEffect(() => {
    if (!isActive) return;

    let hasBeenFullscreen = false;

    // 1. Visibility Change (Tab Switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        incrementViolation("You left this tab");
      }
    };

    // 2. Window Blur (Switching to other applications)
    const handleWindowBlur = () => {
      // Only trigger if we've been fullscreen before (assessment started)
      if (hasBeenFullscreen || isFullscreen) {
        incrementViolation("You clicked outside the browser");
      }
    };

    // 3. Fullscreen Change
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        setIsFullscreen(true);
        hasBeenFullscreen = true;
      } else {
        setIsFullscreen(false);
        // Only count as violation if we were fullscreen before
        if (hasBeenFullscreen) {
          incrementViolation("You exited fullscreen");
        }
      }
    };

    // 4. Prevent Copy/Cut/Paste
    const handleClipboard = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.error("Action Blocked", {
        description: "Copy/Paste is disabled during the assessment.",
        duration: 2000,
      });
    };

    // Attach Listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("copy", handleClipboard);
    document.addEventListener("cut", handleClipboard);
    document.addEventListener("paste", handleClipboard);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", handleClipboard);
      document.removeEventListener("cut", handleClipboard);
      document.removeEventListener("paste", handleClipboard);
    };
  }, [isActive, incrementViolation, isFullscreen]);

  return {
    violationCount,
    isFullscreen,
    enterFullscreen,
  };
};
