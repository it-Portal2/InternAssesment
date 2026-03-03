import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useProctoring } from "@/hooks/useProctoring";
import { useApplicationStore } from "@/store/useApplicationStore";
import { ScreenCheckModal } from "@/components/ScreenCheckModal";
import WarningModal from "@/components/WarningModal";
import { useRecording } from "@/context/RecordingContext";
import { toast } from "sonner";

interface ProctoringContextType {
  violationCount: number;
  isFullscreen: boolean;
  enterFullscreen: () => Promise<void>;
  hasMultipleScreens: boolean;
  checkScreenCount: () => Promise<boolean>;
  isTerminated: boolean;
  terminationReason: string | null;
  suppressProctoring: () => void;
  resumeProctoring: () => void;
}

const ProctoringContext = createContext<ProctoringContextType | null>(null);

export function ProctoringProvider({ children }: { children: ReactNode }) {
  const {
    aiQuestions,
    rulesAccepted,
    isSubmitted,
    isTerminated,
    terminationReason,
    violationCount,
    setIsTerminated,
    incrementViolation,
  } = useApplicationStore();

  const { cleanup } = useRecording();

  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningReason, setWarningReason] = useState("");

  // Suppression ref - temporarily disables violation detection (e.g. during file download)
  const suppressRef = useRef(false);
  const suppressProctoring = useCallback(() => {
    suppressRef.current = true;
  }, []);
  const resumeProctoring = useCallback(() => {
    // Small delay to let browser regain focus after download dialog
    setTimeout(() => {
      suppressRef.current = false;
    }, 2000);
  }, []);

  // Determine if proctoring should be active GLOBALLY
  // Active when: exam started (aiQuestions exist), rules accepted, not terminated, not submitted
  const isActive =
    aiQuestions.length > 0 && rulesAccepted && !isTerminated && !isSubmitted;

  const maxViolations = 3;

  const handleWarning = useCallback(
    (reason: string, _count: number) => {
      // Increment violation in store (single source of truth)
      const newCount = incrementViolation();

      // Check if we should terminate
      if (newCount >= maxViolations) {
        console.log(
          `[GlobalProctoring] TERMINATING: ${reason} (Violation ${newCount}/${maxViolations})`,
        );
        setIsTerminated(true, reason);
        cleanup();
        toast.error("Exam Terminated", {
          description: reason,
          duration: 10000,
        });
      } else {
        setWarningReason(reason);
        setWarningModalOpen(true);
        console.log(
          `[GlobalProctoring] Warning: ${reason} (Violation ${newCount}/${maxViolations})`,
        );
      }
    },
    [incrementViolation, setIsTerminated, cleanup],
  );

  // handleTerminate is no longer called by useProctoring.
  // Termination is handled inside handleWarning above.

  const {
    isFullscreen,
    enterFullscreen,
    hasMultipleScreens,
    checkScreenCount,
  } = useProctoring({
    isActive,
    onWarning: handleWarning,
    suppressRef,
  });

  const handleCloseWarning = () => {
    setWarningModalOpen(false);
  };

  const handleCloseTermination = () => {
    // Force reload to reset everything
    localStorage.removeItem("application-store");
    localStorage.removeItem("uploadedFileInfo");
    window.location.reload();
  };

  return (
    <ProctoringContext.Provider
      value={{
        violationCount,
        isFullscreen,
        enterFullscreen,
        hasMultipleScreens,
        checkScreenCount,
        isTerminated,
        terminationReason,
        suppressProctoring,
        resumeProctoring,
      }}
    >
      {children}

      {/* GLOBAL MODALS - These render regardless of which component is mounted */}

      {/* 1. Multiple Screen Check Modal */}
      <ScreenCheckModal
        isOpen={hasMultipleScreens && isActive}
        onCheckAgain={checkScreenCount}
      />

      {/* 2. Violation Warning Modal (non-terminal) */}
      <WarningModal
        open={warningModalOpen && !isTerminated}
        onClose={handleCloseWarning}
        reason={warningReason}
      />

      {/* 3. Termination Modal */}
      <WarningModal
        open={isTerminated}
        onClose={handleCloseTermination}
        reason={terminationReason || "Exam terminated due to violations."}
        isTermination={true}
      />
    </ProctoringContext.Provider>
  );
}

export const useGlobalProctoring = () => {
  const context = useContext(ProctoringContext);
  if (!context) {
    throw new Error(
      "useGlobalProctoring must be used within a ProctoringProvider",
    );
  }
  return context;
};
