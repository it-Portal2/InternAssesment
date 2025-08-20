import type { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { collection, addDoc, serverTimestamp} from "firebase/firestore";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { InsertApplicationForm } from "@/lib/validation";
import { useApplicationStore } from "@/store/useApplicationStore";
import { db } from "@/Firebase";

interface StepCommentsAndSubmitProps {
  form: UseFormReturn<InsertApplicationForm>;
  onSubmitSuccess: () => void;
}

export default function StepCommentsAndSubmit({ 
  form, 
  onSubmitSuccess 
}: StepCommentsAndSubmitProps) {
  const { aiQuestions, resumeAnalysis } = useApplicationStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempts, setSubmitAttempts] = useState(0);

  // Comprehensive validation check
  const getValidationErrors = (): string[] => {
    const errors: string[] = [];
    const values = form.getValues();

    // Check required personal info
    if (!values.fullName?.trim()) {
      errors.push("Full name is required");
    }
    if (!values.email?.trim()) {
      errors.push("Email address is required");
    }
    if (!values.phone?.trim()) {
      errors.push("Phone number is required");
    }

    // Check required predefined questions
    if (!values.startDate?.trim()) {
      errors.push("Start date preference is required");
    }
    if (!values.weeklyCommitment?.trim()) {
      errors.push("Weekly commitment is required");
    }
    if (!values.trialAccepted?.trim()) {
      errors.push("Trial period acceptance is required");
    }
    if (!values.stipendExpectation?.trim()) {
      errors.push("Stipend expectation is required");
    }

    // Check resume analysis
    if (!resumeAnalysis) {
      errors.push("Resume analysis is required - please upload your resume");
    }

    // Check AI questions
    if (aiQuestions.length > 0) {
      const unansweredQuestions = aiQuestions.filter((q) => {
        const answer = values.responses?.[`ai_${q.id}`];
        return !answer || answer.trim() === "";
      });

      if (unansweredQuestions.length > 0) {
        errors.push(`${unansweredQuestions.length} AI questions need to be answered`);
      }
    }

    return errors;
  };

  const handleSubmit = async (data: InsertApplicationForm) => {
    setIsSubmitting(true);
    setSubmitAttempts(prev => prev + 1);
    
    try {
      // Pre-submission validation
      const validationErrors = getValidationErrors();
      
      if (validationErrors.length > 0) {
        toast.error("Please complete all required fields", {
          description: validationErrors.join(", "),
          duration: 6000,
          action: {
            label: "Review Form",
            onClick: () => {
              // Focus on the first error (you can implement navigation to specific steps)
              console.log("Validation errors:", validationErrors);
            }
          }
        });
        setIsSubmitting(false);
        return;
      }

      // Show progress toast
      const progressToast = toast.loading("Submitting your application...", {
        description: "Please wait while we process your information"
      });

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
        trialAccepted: data.trialAccepted === "yes",
        aiQuestions: aiQuestionsWithAnswers,
        resumeAnalysis: resumeAnalysis ? {
          skills: resumeAnalysis.skills || [],
          experience: resumeAnalysis.experience || "Not specified",
          education: resumeAnalysis.education || "Not specified", 
          summary: resumeAnalysis.summary || "Not specified"
        } : {
          skills: [],
          experience: "Not specified",
          education: "Not specified",
          summary: "No resume analysis available"
        },
        applicationStatus: "Pending",
        submittedAt: new Date().toISOString(),
        submitAttempts: submitAttempts,
        createdAt: serverTimestamp(),
      };

      console.log("Submitting application data:", {
        ...applicationData,
        aiQuestions: `${aiQuestionsWithAnswers.length} questions`,
        resumeAnalysis: resumeAnalysis ? "Available" : "Not available"
      });

      const docRef = await addDoc(collection(db, "applications"), applicationData);
      
      // Dismiss loading toast
      toast.dismiss(progressToast);
      
      console.log("Application saved with ID:", docRef.id);
      
      toast.success("🎉 Application submitted successfully!", {
        description: `Application ID: ${docRef.id.substring(0, 8)}... We'll review your application and get back to you within 2-3 business days.`,
        duration: 8000,
        action: {
          label: "Copy ID",
          onClick: () => {
            navigator.clipboard.writeText(docRef.id);
            toast.success("Application ID copied to clipboard!");
          }
        }
      });
      
      onSubmitSuccess();

    } catch (error) {
      console.error("Error submitting application:", error);
      
      let errorMessage = "An unexpected error occurred while submitting your application.";
      let errorDescription = "Please try again. If the problem persists, try refreshing the page.";
      
      if (error instanceof Error) {
        if (error.message.includes("network")) {
          errorMessage = "Network connection error";
          errorDescription = "Please check your internet connection and try again.";
        } else if (error.message.includes("permission")) {
          errorMessage = "Permission error";
          errorDescription = "There was an authorization issue. Please refresh the page and try again.";
        } else if (error.message.includes("quota")) {
          errorMessage = "Service temporarily unavailable";
          errorDescription = "Our servers are busy. Please wait a moment and try again.";
        }
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 8000,
        action: {
          label: submitAttempts < 3 ? "Try Again" : "Refresh Page",
          onClick: () => {
            if (submitAttempts < 3) {
              handleSubmit(data);
            } else {
              window.location.reload();
            }
          }
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Warning alerts for incomplete sections
  const validationErrors = getValidationErrors();
  const hasValidationErrors = validationErrors.length > 0;

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Additional Comments & Submit</h2>
        <p className="text-muted-foreground">Almost done! Any final thoughts?</p>
      </div>

      {/* Show validation warnings if any */}
      {hasValidationErrors && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="font-semibold mb-2">Please complete the following before submitting:</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

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
          disabled={isSubmitting}
          className="w-full h-12 text-lg font-semibold"
          size="lg"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
              <span>Submitting Application...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Send className="h-5 w-5" />
              <span>Submit Application</span>
            </div>
          )}
        </Button>
        
        {hasValidationErrors && (
          <p className="text-sm text-amber-600 mt-2 text-center">
            Complete all required fields above to submit your application
          </p>
        )}
        
        {submitAttempts > 0 && !isSubmitting && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Attempt {submitAttempts} • Having issues? Try refreshing the page
          </p>
        )}
      </div>
    </div>
  );
}