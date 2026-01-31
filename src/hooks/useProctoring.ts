import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { checkMultipleScreens } from "@/utils/screenDetection";

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
  const devToolsCheckInterval = useRef<number | null>(null);
  const DEBOUNCE_MS = 1000;

  // Grace period to prevent false violations during initialization
  const isInitializing = useRef<boolean>(true);
  const INIT_GRACE_PERIOD_MS = 5000; // 5 seconds grace period on start

  // Reference to track the current violation count for calculations
  // This avoids calling side effects inside setState
  const violationCountRef = useRef(0);

  const processViolation = useCallback(
    (reason: string) => {
      // Calculate new count from ref (not inside setter to avoid StrictMode double-invoke)
      const newCount = violationCountRef.current + 1;
      violationCountRef.current = newCount;
      setViolationCount(newCount);

      // Call callbacks OUTSIDE state setter to prevent double-invocation in StrictMode
      if (newCount >= maxViolations) {
        onTerminate(reason);
      } else {
        onWarning(reason, newCount);
      }
    },
    [maxViolations, onWarning, onTerminate],
  );

  const incrementViolation = useCallback(
    (reason: string) => {
      if (!isActive) return;

      // Skip violations during initialization grace period
      if (isInitializing.current) {
        console.log(
          "[Proctoring] Ignoring violation during grace period:",
          reason,
        );
        return;
      }

      const now = Date.now();

      if (now - lastViolationTime.current < DEBOUNCE_MS) {
        if (
          pendingViolation.current &&
          !pendingViolation.current.includes(reason)
        ) {
          pendingViolation.current = `${pendingViolation.current} and ${reason}`;
        }
        return;
      }

      lastViolationTime.current = now;
      pendingViolation.current = reason;
      processViolation(reason);
    },
    [isActive, processViolation],
  );

  // Set up grace period when proctoring becomes active
  useEffect(() => {
    if (isActive) {
      isInitializing.current = true;
      console.log("[Proctoring] Starting with 3-second grace period...");

      const timer = setTimeout(() => {
        isInitializing.current = false;
        console.log("[Proctoring] Grace period ended - violations now active");
        toast.info("Proctoring active", {
          description: "Your session is now being monitored.",
          duration: 2000,
        });
      }, INIT_GRACE_PERIOD_MS);

      return () => clearTimeout(timer);
    } else {
      isInitializing.current = true; // Reset when not active
    }
  }, [isActive]);

  // =====================================================
  // DEVTOOLS DETECTION
  // =====================================================
  useEffect(() => {
    if (!isActive) return;

    // Method 1: Window size mismatch (detects docked DevTools)
    const checkDevToolsBySize = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;

      if (widthThreshold || heightThreshold) {
        incrementViolation("Developer Tools detected - close them immediately");
      }
    };

    // Check periodically
    devToolsCheckInterval.current = window.setInterval(() => {
      checkDevToolsBySize();
    }, 1000);

    // Initial check
    checkDevToolsBySize();

    return () => {
      if (devToolsCheckInterval.current) {
        clearInterval(devToolsCheckInterval.current);
      }
    };
  }, [isActive, incrementViolation]);

  // =====================================================
  // KEYBOARD SHORTCUTS BLOCKING
  // =====================================================
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      // DevTools shortcuts
      if (key === "f12") {
        e.preventDefault();
        toast.error("Action Blocked", {
          description: "Developer tools are disabled during assessment.",
        });
        incrementViolation("Attempted to open Developer Tools");
        return;
      }

      // Ctrl+Shift+I/J/C (DevTools)
      if (ctrl && shift && ["i", "j", "c"].includes(key)) {
        e.preventDefault();
        toast.error("Action Blocked", {
          description: "Developer tools are disabled during assessment.",
        });
        incrementViolation("Attempted to open Developer Tools");
        return;
      }

      // Ctrl+U (View Source)
      if (ctrl && key === "u") {
        e.preventDefault();
        toast.error("Action Blocked", {
          description: "View source is disabled during assessment.",
        });
        return;
      }

      // Ctrl+S (Save)
      if (ctrl && key === "s") {
        e.preventDefault();
        toast.error("Action Blocked", {
          description: "Saving is disabled during assessment.",
        });
        return;
      }

      // Ctrl+P (Print)
      if (ctrl && key === "p") {
        e.preventDefault();
        toast.error("Action Blocked", {
          description: "Printing is disabled during assessment.",
        });
        return;
      }

      // PrintScreen (Windows)
      if (key === "printscreen") {
        e.preventDefault();
        toast.error("Action Blocked", {
          description: "Screenshots are disabled during assessment.",
        });
        incrementViolation("Attempted to take screenshot");
        return;
      }

      // Alt+Tab (app switching) - inform only, can't fully prevent
      if (alt && key === "tab") {
        toast.warning("Warning", {
          description: "Switching applications may trigger a violation.",
        });
        return;
      }

      // Escape key during fullscreen
      if (key === "escape") {
        toast.warning("Stay in Fullscreen", {
          description: "Exiting fullscreen will be recorded as a violation.",
        });
        return;
      }

      // Ctrl+W/Ctrl+F4 (Close tab)
      if ((ctrl && key === "w") || (ctrl && key === "f4")) {
        e.preventDefault();
        toast.error("Action Blocked", {
          description: "You cannot close this tab during assessment.",
        });
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isActive, incrementViolation]);

  // =====================================================
  // RIGHT-CLICK PREVENTION
  // =====================================================
  useEffect(() => {
    if (!isActive) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error("Action Blocked", {
        description: "Right-click is disabled during assessment.",
        duration: 2000,
      });
    };

    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [isActive]);

  // =====================================================
  // PRINT PREVENTION
  // =====================================================
  useEffect(() => {
    if (!isActive) return;

    const handleBeforePrint = () => {
      toast.error("Action Blocked", {
        description: "Printing is disabled during assessment.",
      });
      incrementViolation("Attempted to print");
    };

    const handleAfterPrint = () => {
      // Log the attempt even if they somehow got past beforeprint
      console.warn("[Proctoring] Print attempt detected");
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [isActive, incrementViolation]);

  // =====================================================
  // PAGE CLOSE PREVENTION (beforeunload)
  // =====================================================
  useEffect(() => {
    if (!isActive) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const message =
        "Your assessment is in progress. Leaving will be recorded as a violation.";
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isActive]);

  // =====================================================
  // MULTIPLE MONITOR DETECTION
  // =====================================================
  // =====================================================
  // MULTIPLE MONITOR DETECTION
  // =====================================================
  const [hasMultipleScreens, setHasMultipleScreens] = useState(false);

  const checkScreenCount = useCallback(async () => {
    try {
      const isMultiple = await checkMultipleScreens();
      setHasMultipleScreens(isMultiple);
      return isMultiple;
    } catch (e) {
      console.error("Screen check error:", e);
      setHasMultipleScreens(false);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;

    // Check on start
    checkScreenCount();

    // Listen for screen changes
    const handleScreenChange = () => {
      checkScreenCount();
    };

    if ("onchange" in window.screen) {
      (window.screen as any).onchange = handleScreenChange;
    }

    // Also try to listen to the newer API events if possible
    // This is complex so we rely mainly on periodic checks or the screen.onchange

    return () => {
      if ("onchange" in window.screen) {
        (window.screen as any).onchange = null;
      }
    };
  }, [isActive, checkScreenCount]);

  // =====================================================
  // VM DETECTION HINTS
  // =====================================================
  useEffect(() => {
    if (!isActive) return;

    const checkVMIndicators = () => {
      const warnings: string[] = [];

      // Low CPU cores (VMs often have 1-2)
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2) {
        warnings.push("Low CPU cores detected");
      }

      // Check for common VM user agents
      const userAgent = navigator.userAgent.toLowerCase();
      const vmIndicators = ["virtualbox", "vmware", "qemu", "parallels"];
      if (vmIndicators.some((vm) => userAgent.includes(vm))) {
        warnings.push("Virtual machine detected");
      }

      // Check WebGL renderer for VM signatures
      try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl");
        if (gl) {
          const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
          if (debugInfo) {
            const renderer = gl
              .getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
              .toLowerCase();
            if (
              renderer.includes("swiftshader") ||
              renderer.includes("llvmpipe") ||
              renderer.includes("virtualbox")
            ) {
              warnings.push("VM graphics detected");
            }
          }
        }
      } catch (e) {
        // Ignore WebGL detection errors
      }

      if (warnings.length > 0) {
        toast.warning("Environment Warning", {
          description:
            "Unusual system configuration detected. This session is being monitored.",
          duration: 15000,
        });
        console.warn("[Proctoring] VM indicators:", warnings);
      }
    };

    // Check once on activation
    checkVMIndicators();
  }, [isActive]);

  // =====================================================
  // AI MONITORING MESSAGES (Psychological deterrent)
  // =====================================================
  useEffect(() => {
    if (!isActive) return;

    const AI_MONITORING_MESSAGES = [
      {
        title: "Face Check",
        description: "Monitoring your face position and expressions.",
      },
      {
        title: "Eye Tracking",
        description: "Analyzing eye movement patterns.",
      },
      {
        title: "Room Scan",
        description: "Checking for unauthorized materials.",
      },
      {
        title: "Activity Monitor",
        description: "Recording all keyboard and mouse activity.",
      },
      {
        title: "Audio Analysis",
        description: "Listening for voice or unusual sounds.",
      },
      {
        title: "Screen Analysis",
        description: "Detecting any overlay applications.",
      },
      {
        title: "Network Check",
        description: "Monitoring for suspicious connections.",
      },
      {
        title: "Browser Check",
        description: "Scanning for prohibited extensions.",
      },
    ];

    let lastMessageIndex = -1;

    const showRandomMessage = () => {
      let index;
      do {
        index = Math.floor(Math.random() * AI_MONITORING_MESSAGES.length);
      } while (index === lastMessageIndex && AI_MONITORING_MESSAGES.length > 1);

      lastMessageIndex = index;
      const msg = AI_MONITORING_MESSAGES[index];

      toast.info(msg.title, {
        description: msg.description,
        duration: 8000,
      });
    };

    const initialTimeout = setTimeout(showRandomMessage, 30000);
    const interval = setInterval(showRandomMessage, 90000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isActive]);

  // =====================================================
  // FULLSCREEN ENFORCEMENT
  // =====================================================
  const enterFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const attemptFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await enterFullscreen();
        }
      } catch (e) {
        console.error("Fullscreen attempt failed", e);
      }
    };

    const timer = setTimeout(attemptFullscreen, 300);
    const interval = setInterval(() => {
      if (!document.fullscreenElement && isActive) {
        attemptFullscreen();
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isActive, enterFullscreen]);

  // =====================================================
  // CORE VIOLATION DETECTION
  // =====================================================
  useEffect(() => {
    if (!isActive) return;

    let hasBeenFullscreen = false;

    // Tab switching
    const handleVisibilityChange = () => {
      if (document.hidden) {
        incrementViolation("You left this tab");
      }
    };

    // Window blur
    const handleWindowBlur = () => {
      if (hasBeenFullscreen || isFullscreen) {
        incrementViolation("You clicked outside the browser");
      }
    };

    // Fullscreen exit
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        setIsFullscreen(true);
        hasBeenFullscreen = true;
      } else {
        setIsFullscreen(false);
        if (hasBeenFullscreen) {
          incrementViolation("You exited fullscreen");
        }
      }
    };

    // Clipboard blocking
    const handleClipboard = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.error("Action Blocked", {
        description: "Copy/Paste is disabled during assessment.",
        duration: 2000,
      });
    };

    // Text selection prevention
    const handleSelectStart = (e: Event) => {
      // Allow selection in input/textarea
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA"
      ) {
        return;
      }
      e.preventDefault();
    };

    // Drag prevention
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("copy", handleClipboard);
    document.addEventListener("cut", handleClipboard);
    document.addEventListener("paste", handleClipboard);
    document.addEventListener("selectstart", handleSelectStart);
    document.addEventListener("dragstart", handleDragStart);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", handleClipboard);
      document.removeEventListener("cut", handleClipboard);
      document.removeEventListener("paste", handleClipboard);
      document.removeEventListener("selectstart", handleSelectStart);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, [isActive, incrementViolation, isFullscreen]);

  return {
    violationCount,
    isFullscreen,
    enterFullscreen,
    hasMultipleScreens,
    checkScreenCount,
  };
};
