import type { UseFormReturn } from "react-hook-form";
import { useEffect, useState } from "react";
import { Send } from "lucide-react";
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
  const { stopAndUpload, isRecording, cleanup } = useRecording();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: InsertApplicationForm) => {
    setIsSubmitting(true);
    console.log("[Submit] Starting submission...");

    try {
      let recordingUrl: string | null = null;
      if (isRecording) {
        console.log("[Submit] Stopping and uploading recording...");
        toast.info("Uploading recording...", { duration: 3000 });
        recordingUrl = await stopAndUpload();
        console.log("[Submit] Recording URL:", recordingUrl);
      } else {
        cleanup();
      }

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
        recordingUrl: recordingUrl || null,
        applicationStatus: "Pending",
        createdAt: serverTimestamp(),
      };

      console.log("[Submit] Saving to Firestore...");
      const docRef = await addDoc(
        collection(db, "applications"),
        applicationData,
      );

      console.log("[Submit] Success! Doc ID:", docRef.id);
      toast.success("Application submitted successfully!", {
        description: `Application ID: ${docRef.id}. We'll review your application and get back to you soon.`,
        duration: 6000,
      });

      if (recordingUrl) {
        toast.success("Recording saved!", {
          description: "Your proctoring video has been uploaded.",
          duration: 3000,
        });
      }

      reset();
      form.reset();
      onSubmitSuccess();
    } catch (error) {
      console.error("[Submit] Error:", error);
      cleanup();
      toast.error("Submission failed", {
        description:
          "There was an error submitting your application. Please try again.",
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
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
    const additionalComments = form.watch("additionalComments");
    updateStep4Data({ additionalComments: additionalComments || "" });
  }, [form.watch("additionalComments")]);

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

      <div className="pt-6 border-t border-white/10">
        <Button
          type="button"
          onClick={form.handleSubmit(handleSubmit)}
          disabled={isSubmitting || isSubmitDisabled()}
          className="w-full h-12 text-lg font-semibold bg-yellow-500 hover:bg-yellow-600 text-black disabled:bg-gray-700 disabled:text-gray-500 shadow-lg shadow-yellow-500/20"
          size="lg"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
              <span>Submitting & Uploading Recording...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Send className="h-5 w-5" />
              <span>Submit Application</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
