import type { UseFormReturn } from "react-hook-form";
import { useEffect, useState, useCallback } from "react";
import { Send, RefreshCw, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { InsertApplicationForm } from "@/lib/validation";
import { useApplicationStore } from "@/store/useApplicationStore";
import { useRecording } from "@/context/RecordingContext";
import { useGlobalProctoring } from "@/context/ProctoringContext";
import { db } from "@/Firebase";

interface StepCommentsAndSubmitProps {
  form: UseFormReturn<InsertApplicationForm>;
  onSubmitSuccess: () => void;
}

export default function StepCommentsAndSubmit({
  form,
  onSubmitSuccess,
}: StepCommentsAndSubmitProps) {
  const { aiQuestions, resumeAnalysis, updateStep4Data, reset } =
    useApplicationStore();
  const {
    stopAndUpload,
    isRecording,
    cleanup,
    uploadProgress,
    isUploading,
    retryUpload,
    downloadRecordingLocally,
    error: recordingError,
    recordingUrl: existingRecordingUrl,
  } = useRecording();
  const { suppressProctoring, resumeProctoring } = useGlobalProctoring();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [uploadRetryCount, setUploadRetryCount] = useState(0);
  const [submittedWithoutVideo, setSubmittedWithoutVideo] = useState(false);
  const [firestoreFailed, setFirestoreFailed] = useState(false);
  const [firestoreRetryCount, setFirestoreRetryCount] = useState(0);
  const [pendingData, setPendingData] = useState<InsertApplicationForm | null>(
    null,
  );
  const [savedRecordingUrl, setSavedRecordingUrl] = useState<string | null>(
    null,
  );

  // Note: Recording URL is persisted to localStorage and recovered via savedRecordingUrl state

  useEffect(() => {
    // Try to recover recording URL from localStorage on mount
    const savedUrl = localStorage.getItem("pendingRecordingUrl");
    if (savedUrl) {
      setSavedRecordingUrl(savedUrl);
    }
  }, []);

  const handleSubmit = async (data: InsertApplicationForm) => {
    setIsSubmitting(true);
    setUploadFailed(false);
    setFirestoreFailed(false);
    setPendingData(data);
    console.log("[Submit] Starting submission...");

    try {
      // Check if we already have a recording URL (from previous failed Firestore attempt)
      let recordingUrl = savedRecordingUrl || existingRecordingUrl;

      if (!recordingUrl) {
        // Recording is MANDATORY - upload if not already done
        console.log("[Submit] Stopping and uploading recording...");
        toast.info("Uploading your interview recording...", {
          duration: 10000,
        });

        recordingUrl = await stopAndUpload();
        console.log("[Submit] Recording URL:", recordingUrl);

        // BLOCK submission if no recording
        if (!recordingUrl) {
          toast.error("Recording upload failed", {
            description: "Please click 'Retry Upload' to try again.",
            duration: 10000,
          });
          setUploadFailed(true);
          setUploadRetryCount(1); // Initial upload counts as attempt 1
          setIsSubmitting(false);
          return;
        }

        // Save recording URL to localStorage for recovery
        localStorage.setItem("pendingRecordingUrl", recordingUrl);
        setSavedRecordingUrl(recordingUrl);
      } else {
        console.log("[Submit] Using existing recording URL:", recordingUrl);
        toast.info("Recording already uploaded, submitting to server...", {
          duration: 3000,
        });
      }

      await submitToFirestore(data, recordingUrl);
    } catch (error) {
      console.error("[Submit] Error:", error);
      toast.error("Submission failed", {
        description: "Please try again.",
        duration: 8000,
      });
      setIsSubmitting(false);
    }
  };

  const handleRetryUpload = async () => {
    if (!pendingData) {
      toast.error("No pending data", {
        description: "Please fill out the form again.",
      });
      return;
    }

    const newRetryCount = uploadRetryCount + 1;
    setUploadRetryCount(newRetryCount);

    // After 3 retries, offer fallback
    if (newRetryCount >= 3) {
      toast.warning("Upload failed after 3 attempts", {
        description: "You can now download the video and submit without it.",
        duration: 8000,
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setUploadFailed(false);
    toast.info(`Retrying upload... (attempt ${newRetryCount}/3)`, {
      duration: 5000,
    });

    const recordingUrl = await retryUpload();

    if (!recordingUrl) {
      toast.error(`Retry ${newRetryCount}/3 failed`, {
        description:
          newRetryCount >= 2
            ? "One more retry before fallback option becomes available."
            : "Please check your internet connection and try again.",
        duration: 8000,
      });
      setUploadFailed(true);
      setIsSubmitting(false);
      return;
    }

    // Save recording URL to localStorage for recovery
    localStorage.setItem("pendingRecordingUrl", recordingUrl);
    setSavedRecordingUrl(recordingUrl);

    await submitToFirestore(pendingData, recordingUrl);
  };

  // Fallback: download video locally + submit answers without video
  const handleSubmitWithoutVideo = useCallback(async () => {
    if (!pendingData) {
      toast.error("No pending data", {
        description: "Please fill out the form again.",
      });
      return;
    }

    setIsSubmitting(true);

    // Suppress proctoring during download (file save dialog triggers window.blur)
    suppressProctoring();

    // Step 1: Download video to user's device
    toast.info("Downloading your recording to your device...", {
      duration: 5000,
    });

    const downloaded = await downloadRecordingLocally();

    // Resume proctoring after download (with delay for dialog dismissal)
    resumeProctoring();
    if (!downloaded) {
      toast.warning("Could not download video", {
        description:
          "No recording found, but your answers will still be submitted.",
        duration: 6000,
      });
    } else {
      toast.success("Video downloaded successfully!", {
        description: "Check your Downloads folder.",
        duration: 5000,
      });
    }

    // Step 2: Submit answers without video
    await submitToFirestore(pendingData, "UPLOAD_FAILED");
    setSubmittedWithoutVideo(true);
  }, [
    pendingData,
    downloadRecordingLocally,
    suppressProctoring,
    resumeProctoring,
  ]);

  const handleRetryFirestore = async () => {
    if (!pendingData || !savedRecordingUrl) {
      toast.error("Missing data", {
        description: "Recording URL or form data is missing.",
      });
      return;
    }

    setIsSubmitting(true);
    setFirestoreFailed(false);
    toast.info("Retrying submission to server...", { duration: 5000 });

    await submitToFirestore(pendingData, savedRecordingUrl);
  };

  const submitToFirestore = async (
    data: InsertApplicationForm,
    recordingUrl: string,
  ) => {
    const MAX_FIRESTORE_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_FIRESTORE_RETRIES; attempt++) {
      try {
        const aiQuestionsWithAnswers = aiQuestions.map((q) => ({
          id: q.id,
          question: q.question,
          answer: form.getValues(`responses.ai_${q.id}`) || "",
        }));

        const applicationData = {
          linkedin: data.linkedin || "",
          additionalComments: data.additionalComments || "",
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          stipendExpectation: data.stipendExpectation || "",
          startDate: data.startDate || "",
          weeklyCommitment: data.weeklyCommitment || "",
          trialAccepted: data.trialAccepted || false,
          aiQuestions: aiQuestionsWithAnswers,
          resumeAnalysis: resumeAnalysis
            ? {
                skills: resumeAnalysis.skills || [],
                experience: resumeAnalysis.experience || "Not specified",
                education: resumeAnalysis.education || "Not specified",
                summary: resumeAnalysis.summary || "Not specified",
              }
            : {
                skills: [],
                experience: "Not specified",
                education: "Not specified",
                summary: "No resume analysis available",
              },
          recordingUrl: recordingUrl,
          applicationStatus: "Pending",
          createdAt: serverTimestamp(),
        };

        console.log(
          `[Submit] Firestore attempt ${attempt}/${MAX_FIRESTORE_RETRIES}...`,
        );
        const docRef = await addDoc(
          collection(db, "applications"),
          applicationData,
        );

        console.log("[Submit] Success! Doc ID:", docRef.id);
        toast.success("Application submitted successfully!", {
          description: `Application ID: ${docRef.id}. We'll review your application and get back to you soon.`,
          duration: 6000,
        });

        toast.success("Recording saved!", {
          description: "Your proctoring video has been uploaded.",
          duration: 3000,
        });

        // Clear saved recording URL from localStorage
        localStorage.removeItem("pendingRecordingUrl");
        setSavedRecordingUrl(null);

        // Mark as submitted in store FIRST (deactivates proctoring immediately)
        useApplicationStore.getState().setIsSubmitted(true);

        // Cleanup and reset
        cleanup();
        reset();
        form.reset();
        setPendingData(null);
        setFirestoreRetryCount(0);
        onSubmitSuccess();
        return; // Exit on success
      } catch (error) {
        console.error(`[Submit] Firestore attempt ${attempt} failed:`, error);

        if (attempt < MAX_FIRESTORE_RETRIES) {
          // Wait before retrying (2s, 4s)
          const delay = 2000 * attempt;
          console.log(`[Submit] Retrying Firestore in ${delay}ms...`);
          toast.warning(
            `Server error, retrying... (${attempt}/${MAX_FIRESTORE_RETRIES})`,
            { duration: 2000 },
          );
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    // All retries failed
    console.error("[Submit] All Firestore retries failed");
    setFirestoreFailed(true);
    setFirestoreRetryCount((prev) => prev + 1);
    setIsSubmitting(false);

    toast.error("Server submission failed", {
      description:
        "Your recording is saved. Click 'Retry Submit' to try again.",
      duration: 10000,
    });
  };

  const isSubmitDisabled = () => {
    if (!resumeAnalysis) return true;
    if (aiQuestions.length > 0) {
      return aiQuestions.some((q) => {
        const answer = form.getValues(`responses.ai_${q.id}`);
        return !answer || answer.trim() === "";
      });
    }
    return false;
  };

  useEffect(() => {
    // Use subscription pattern for form.watch to avoid dependency issues
    const subscription = form.watch((value) => {
      if (value.additionalComments !== undefined) {
        updateStep4Data({ additionalComments: value.additionalComments || "" });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, updateStep4Data]);

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-yellow-400">
          Your Feedback & Submit
        </h2>
        <p className="text-white/50 text-sm">
          Almost done! Share your experience with this assessment.
        </p>
        {isRecording && (
          <p className="text-xs text-red-400 mt-2 flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1" />
            Recording active - will stop and save on submit
          </p>
        )}
        {savedRecordingUrl && !firestoreFailed && (
          <p className="text-xs text-green-400 mt-2 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-1" />
            Recording already uploaded ✓
          </p>
        )}
      </div>

      <FormField
        control={form.control}
        name="additionalComments"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-yellow-400/90">
              Assessment Feedback (Optional)
            </FormLabel>
            <FormControl>
              <Textarea
                rows={4}
                placeholder="How was your experience with this assessment? Any suggestions for improvement? Your feedback helps us enhance the process..."
                {...field}
                value={field.value || ""}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderColor: "rgba(75, 75, 75, 0.8)",
                }}
                className="text-white placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500/20"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Upload Progress Indicator */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Uploading recording...</span>
            <span className="text-yellow-400 font-medium">
              {uploadProgress}%
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-white/40">
            Please don't close this page. Large recordings may take a few
            minutes.
          </p>
        </div>
      )}

      {/* Upload Error & Retry */}
      {uploadFailed && !isUploading && uploadRetryCount < 3 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-3">
          <p className="text-red-400 text-sm">
            Recording upload failed (attempt {uploadRetryCount}/3). Please try
            again.
          </p>
          <Button
            type="button"
            onClick={handleRetryUpload}
            disabled={isSubmitting}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Upload ({uploadRetryCount}/3)
          </Button>
        </div>
      )}

      {/* After 3 retry failures: Fallback option */}
      {uploadRetryCount >= 3 && !submittedWithoutVideo && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-5 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-semibold text-base">
                Video Upload Failed After 3 Attempts
              </p>
              <p className="text-white/60 text-sm mt-2">
                Due to technical difficulties, we couldn't upload your interview
                recording. You can still submit your answers — your video will
                be downloaded to your device.
              </p>
              <p className="text-white/50 text-xs mt-2">
                After submitting, you{" "}
                <strong className="text-yellow-400">must</strong> send the
                downloaded video to{" "}
                <strong className="text-yellow-400">
                  internship@cehpoint.co.in
                </strong>{" "}
                or WhatsApp at{" "}
                <strong className="text-yellow-400">+91 90911 56095</strong>{" "}
                with your full name, email, date & time of interview, and the
                issue you faced. Without the video, your application will not be
                considered.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleSubmitWithoutVideo}
            disabled={isSubmitting}
            className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
          >
            <Download className="h-4 w-4 mr-2" />
            {isSubmitting
              ? "Downloading & Submitting..."
              : "Download Video & Submit Without Upload"}
          </Button>
        </div>
      )}

      {/* Post-submission message when video was not uploaded */}
      {submittedWithoutVideo && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-5 space-y-3">
          <p className="text-green-400 font-semibold">
            ✅ Your answers have been submitted successfully!
          </p>
          <div className="text-white/70 text-sm space-y-2">
            <p>
              However, your interview video could not be uploaded. It has been
              <strong className="text-green-400">
                {" "}
                downloaded to your device
              </strong>
              .
            </p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 mt-3">
              <p className="text-yellow-400 font-medium text-sm mb-2">
                ⚠️ Action Required: Send your video
              </p>
              <p className="text-white/60 text-xs">
                Please send the downloaded interview recording to{" "}
                <strong className="text-yellow-400">
                  internship@cehpoint.co.in
                </strong>{" "}
                or WhatsApp at{" "}
                <strong className="text-yellow-400">+91 90911 56095</strong>{" "}
                with the following details:
              </p>
              <ul className="text-white/50 text-xs mt-2 space-y-1 list-disc list-inside">
                <li>Your full name</li>
                <li>Email address used in the application</li>
                <li>Date & time of interview</li>
                <li>Brief description of the issue you faced</li>
              </ul>
              <p className="text-red-400/80 text-xs mt-2 font-medium">
                If you do not send the video, your application will not be
                considered.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Firestore Error & Retry */}
      {firestoreFailed && !isSubmitting && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-orange-400 font-medium">
                Server submission failed
              </p>
              <p className="text-white/60 text-sm mt-1">
                Your recording has been uploaded and saved. Only the final
                submission to our server failed.
                {firestoreRetryCount > 0 &&
                  ` (Attempted ${firestoreRetryCount} time${firestoreRetryCount > 1 ? "s" : ""})`}
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleRetryFirestore}
            disabled={isSubmitting}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Submit
          </Button>
        </div>
      )}

      {/* Only show main Submit button when upload hasn't failed */}
      {!uploadFailed && !submittedWithoutVideo && uploadRetryCount < 3 && (
        <div className="pt-6 border-t border-white/10">
          <Button
            type="button"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isSubmitting || isSubmitDisabled() || isUploading}
            className="w-full h-12 text-lg font-semibold bg-yellow-500 hover:bg-yellow-600 text-black disabled:bg-gray-700 disabled:text-gray-500 shadow-lg shadow-yellow-500/20"
            size="lg"
          >
            {isSubmitting || isUploading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                <span>
                  {isUploading
                    ? `Uploading... ${uploadProgress}%`
                    : "Submitting..."}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Send className="h-5 w-5" />
                <span>Submit Application</span>
              </div>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
