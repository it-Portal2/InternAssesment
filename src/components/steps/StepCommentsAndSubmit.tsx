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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: InsertApplicationForm) => {
    setIsSubmitting(true);

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
        applicationStatus: "Pending",
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, "applications"),
        applicationData
      );

      toast.success("Application submitted successfully!", {
        description: `Application ID: ${docRef.id}. We'll review your application and get back to you soon.`,
        duration: 6000,
      });

      reset();
      form.reset();

      onSubmitSuccess();
    } catch (error) {
      console.error("Error submitting application:", error);
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
    // Check if resume is processed
    if (!resumeAnalysis) return true;

    // Check if AI questions exist and have answers
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
    updateStep4Data({
      additionalComments: additionalComments || "",
    });
  }, [form.watch("additionalComments")]);

  
  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Additional Comments & Submit
        </h2>
        <p className="text-muted-foreground">
          Almost done! Any final thoughts?
        </p>
      </div>

      <FormField
        control={form.control}
        name="additionalComments"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-foreground">
              Additional Comments or Questions
            </FormLabel>
            <FormControl>
              <Textarea
                rows={4}
                placeholder="Anything else you'd like us to know..."
                {...field}
                value={field.value || ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="pt-6 border-t border-border">
        <Button
          type="button"
          onClick={form.handleSubmit(handleSubmit)}
          disabled={isSubmitting || isSubmitDisabled()}
          className="w-full h-12 text-lg font-semibold"
          size="lg"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
              <span>Submitting...</span>
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
