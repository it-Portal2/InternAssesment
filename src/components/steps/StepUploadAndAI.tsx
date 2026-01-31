import type { UseFormReturn } from "react-hook-form";
import { AlertTriangle, Bot } from "lucide-react";
import { toast } from "sonner";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Alert } from "@/components/ui/alert";
import FileUpload from "./FileUpload";
import { useApplicationStore } from "@/store/useApplicationStore";
import type { InsertApplicationForm } from "@/lib/validation";
import { VoiceTextarea } from "@/components/ui/VoiceTextarea";
import type { AnalysisResult } from "@/types/application";
import ProctoringMonitor from "../ProctoringMonitor";
import { ScreenCheckModal } from "@/components/ScreenCheckModal";
import WarningModal from "../WarningModal";
import { useProctoring } from "@/hooks/useProctoring";
import { useRecording } from "@/context/RecordingContext";
import { useCallback, useState, useEffect, useRef } from "react";

interface StepUploadAndAIProps {
  form: UseFormReturn<InsertApplicationForm>;
}

export default function StepUploadAndAI({ form }: StepUploadAndAIProps) {
  const {
    uploadedFile,
    aiQuestions,
    isProcessingResume,
    resumeAnalysis,
    rulesAccepted,
    setUploadedFile,
    setResumeAnalysis,
    setAiQuestions,
    setIsProcessingResume,
    updateStep3Response,
    reset,
  } = useApplicationStore();

  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningReason, setWarningReason] = useState("");
  const [isTerminated, setIsTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState("");
  const [recordingFailed, setRecordingFailed] = useState(false);
  const [screenShareStopped, setScreenShareStopped] = useState(false);

  const { startRecording, cleanup, isRecording } = useRecording();
  const hasStartedRecording = useRef(false);

  // Use ref to always access latest cleanup function (prevents stale closure)
  const cleanupRef = useRef(cleanup);
  cleanupRef.current = cleanup;

  // Handle screen share being stopped - IMMEDIATE TERMINATION
  const handleScreenShareStopped = useCallback(() => {
    console.log("[StepUploadAndAI] Screen share stopped - TERMINATING EXAM");
    setScreenShareStopped(true);
    cleanupRef.current(); // Use ref to get latest cleanup

    // Clear all local storage to force restart
    localStorage.removeItem("application-store");
    localStorage.removeItem("pendingRecordingUrl");
    localStorage.removeItem("uploadedFileInfo");

    toast.error("Exam Terminated!", {
      description:
        "You stopped screen sharing. This is a critical violation. The exam has been terminated.",
      duration: 15000,
    });
  }, []); // No dependencies needed - uses ref

  const initRecording = useCallback(async () => {
    console.log("[StepUploadAndAI] Starting recording...");
    setRecordingFailed(false);
    setScreenShareStopped(false);

    const success = await startRecording(() => {
      // CRITICAL: Screen share stopped = IMMEDIATE TERMINATION
      handleScreenShareStopped();
    });

    if (success) {
      toast.success("Recording started", {
        description: "Your session is being recorded for proctoring.",
        duration: 3000,
      });
      setRecordingFailed(false);
    } else {
      toast.error("Recording failed to start", {
        description:
          "Screen recording is required. Please click 'Retry Recording' below.",
        duration: 10000,
      });
      setRecordingFailed(true);
    }
  }, [startRecording, handleScreenShareStopped]);

  // Start recording ONLY after resume is analyzed and AI questions are ready
  // This ensures screen share/recording only starts for the actual interview
  // Added delay to ensure UI has fully rendered before screen share picker appears
  useEffect(() => {
    // If already recording, don't restart logic
    if (isRecording) {
      hasStartedRecording.current = true;
      return;
    }

    if (aiQuestions.length > 0 && !hasStartedRecording.current) {
      hasStartedRecording.current = true;
      // Delay to ensure questions are visible before screen share prompt
      const timer = setTimeout(() => {
        initRecording();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [aiQuestions.length, initRecording]);

  const handleFinalExit = useCallback(async () => {
    cleanup();
    reset();
    form.reset();
    window.location.reload();
  }, [reset, form, cleanup]);

  const handleWarning = useCallback((reason: string, _count: number) => {
    setWarningReason(reason);
    setWarningModalOpen(true);
  }, []);

  const handleTerminate = useCallback(
    async (reason: string) => {
      cleanup();
      setTerminationReason(reason);
      setIsTerminated(true);
    },
    [cleanup],
  );

  const { violationCount, hasMultipleScreens, checkScreenCount } =
    useProctoring({
      isActive: aiQuestions.length > 0,
      onWarning: handleWarning,
      onTerminate: handleTerminate,
      maxViolations: 3,
    });

  const handleFileSelect = (file: File | null) => {
    if (file) {
      setUploadedFile(file);
      setIsProcessingResume(true);
    } else {
      if (!resumeAnalysis) {
        setUploadedFile(null);
        setResumeAnalysis(null);
        setAiQuestions([]);
        form.setValue("resumeAnalysis", {
          skills: [],
          experience: "",
          education: "",
          summary: "",
        });
        form.setValue("aiQuestions", []);
      }
      setIsProcessingResume(false);
    }
  };

  const handleAnalysisComplete = (result: AnalysisResult) => {
    if (result.success) {
      setResumeAnalysis(result.resumeAnalysis);
      setAiQuestions(result.questions);
      form.setValue("resumeAnalysis", result.resumeAnalysis);
      form.setValue("aiQuestions", result.questions);
      setIsProcessingResume(false);

      toast.success("Resume processed successfully!", {
        description: `Generated ${result.questions.length} personalized questions based on your resume.`,
        duration: 5000,
      });
    } else {
      setIsProcessingResume(false);
      setUploadedFile(null);
      toast.error("Processing failed", {
        description: "Please try uploading your resume again.",
        duration: 4000,
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Proctoring Monitor - Key prevents remount on question changes */}
      {aiQuestions.length > 0 && (
        <ProctoringMonitor
          key="proctoring-monitor"
          violationCount={violationCount}
          maxViolations={3}
          isActive={
            aiQuestions.length > 0 &&
            rulesAccepted &&
            !isTerminated &&
            !screenShareStopped
          }
          onCameraViolation={(reason) => {
            handleWarning(reason, violationCount + 1);
          }}
          onAudioViolation={(reason) => {
            handleWarning(reason, violationCount + 1);
          }}
        />
      )}

      <ScreenCheckModal
        isOpen={hasMultipleScreens}
        onCheckAgain={checkScreenCount}
      />

      <WarningModal
        open={warningModalOpen && !isTerminated && !screenShareStopped}
        onClose={() => setWarningModalOpen(false)}
        reason={warningReason}
      />

      {/* Screen Share Stopped - IMMEDIATE TERMINATION */}
      <WarningModal
        open={screenShareStopped}
        onClose={handleFinalExit}
        reason="You stopped screen sharing. This is a critical violation that cannot be recovered."
        isTermination={true}
      />

      {/* Regular Termination (3 violations) */}
      <WarningModal
        open={isTerminated && !screenShareStopped}
        onClose={handleFinalExit}
        reason={terminationReason}
        isTermination={true}
      />

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-yellow-400">
          Resume Upload & Answer Questions
        </h2>
        <p className="text-white/50 text-sm">
          Upload your resume to get personalized questions powered by AI
        </p>
      </div>

      {aiQuestions.length === 0 && (
        <Alert className="border-yellow-500/30 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 !text-yellow-500" />
          <p className="text-white">
            Upload your resume (PDF only, <strong>&lt; 5 MB</strong>). After
            upload, we will analyze your background and generate{" "}
            <strong>personalized interview questions</strong>. Please answer{" "}
            <strong>by yourself</strong>—{" "}
            <strong>no AI or external help</strong>.{" "}
            <strong>Malpractice leads to rejection.</strong>
          </p>
        </Alert>
      )}

      <FileUpload
        file={uploadedFile}
        onFileSelect={handleFileSelect}
        onAnalysisComplete={handleAnalysisComplete}
        isProcessing={isProcessingResume}
      />

      {aiQuestions.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Bot className="h-5 w-5 text-yellow-400" />
            <h3 className="text-xl font-bold text-white">
              Personalized Interview Questions
            </h3>
            <span className="text-sm text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded-full">
              {aiQuestions.length} questions
            </span>
            {isRecording && (
              <span className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded-full flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1" />
                Recording
              </span>
            )}
          </div>

          {/* Recording Failed Blocking Overlay */}
          {recordingFailed && (
            <div className="relative rounded-xl border-2 border-red-500/50 bg-red-500/10 p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">
                Screen Recording Required
              </h4>
              <p className="text-white/60 mb-6 max-w-md mx-auto">
                You must allow screen recording to proceed with the interview.
                This is mandatory for proctoring purposes.
              </p>
              <button
                onClick={() => {
                  hasStartedRecording.current = false;
                  initRecording();
                }}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
              >
                Retry Recording
              </button>
            </div>
          )}

          {/* Only show questions when recording is active */}
          {!recordingFailed && (
            <div className="space-y-6">
              {aiQuestions.map((question) => (
                <div
                  key={question.id}
                  className="border rounded-xl p-6 backdrop-blur-sm shadow-lg w-full max-w-full"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    borderColor: "rgba(75, 75, 75, 0.8)",
                  }}
                >
                  <FormField
                    control={form.control}
                    name={`responses.ai_${question.id}`}
                    render={({ field }) => (
                      <FormItem className="w-full max-w-full">
                        <FormLabel className="text-base font-semibold text-white flex items-start space-x-3 mb-1">
                          <span className="flex-1">{question.question}</span>
                        </FormLabel>
                        <FormControl>
                          <div className="w-full max-w-full overflow-hidden">
                            <VoiceTextarea
                              value={field.value || ""}
                              onChange={(value) => {
                                field.onChange(value);
                                updateStep3Response(question.id, value);
                              }}
                              placeholder="Type or speak your answer... Be specific and use examples from your experience."
                              rows={4}
                              language="en-US"
                              silenceTimeout={10000}
                              className="w-full max-w-full bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500"
                            />
                          </div>
                        </FormControl>

                        <div className="text-xs text-gray-400">
                          {field.value?.length || 0} characters
                          {(field.value?.length || 0) < 100 && (
                            <span className="text-yellow-400 ml-2">
                              💡 Aim for detailed answers (100+ characters)
                            </span>
                          )}
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
