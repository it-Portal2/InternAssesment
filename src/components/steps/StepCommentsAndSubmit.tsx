import type { UseFormReturn } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { toast } from "sonner";
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



interface StepCommentsAndSubmitProps {
  form: UseFormReturn<InsertApplicationForm>;
  onSubmitSuccess: () => void;
}

export default function StepCommentsAndSubmit({ 
  form, 
  onSubmitSuccess 
}: StepCommentsAndSubmitProps) {
  const { aiQuestions, resumeAnalysis } = useApplicationStore();

  const submitApplication = useMutation({
    mutationFn: async (data: InsertApplicationForm) => {
      // Simulate API submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // TODO: replace with real API
      // const response = await fetch("/api/applications", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(data),
      // });
      // return response.json();
      
      // MOCK RESPONSE:
      return { id: "mock-app-123", status: "submitted" };
    },
    onSuccess: (application) => {
      toast.success("Application submitted successfully!", {
        description: "We'll review your application and get back to you soon."
      });
      onSubmitSuccess();
    },
    onError: (error) => {
      toast.error("Submission failed", {
        description: "There was an error submitting your application. Please try again."
      });
    },
  });

  const onSubmit = (data: InsertApplicationForm) => {
    // Collect AI question answers
    const aiQuestionsWithAnswers = aiQuestions.map((q) => ({
      ...q,
      answer: form.getValues(`responses.ai_${q.id}`) || "",
    }));

    const submissionData = {
      ...data,
      aiQuestions: aiQuestionsWithAnswers,
    };

      submitApplication.mutate(submissionData);   
      console.log("done");
      
  };

  const isSubmitDisabled = () => {
    // Check if resume is processed
    if (!resumeAnalysis) return true;
    
    // Check if AI questions exist and have answers
    if (aiQuestions.length > 0) {
      return aiQuestions.some(q => {
        const answer = form.getValues(`responses.ai_${q.id}`);
        return !answer || answer.trim() === "";
      });
    }
    
    return false;
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Additional Comments & Submit</h2>
        <p className="text-muted-foreground">Almost done! Any final thoughts?</p>
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
          onClick={form.handleSubmit(onSubmit)}
          disabled={submitApplication.isPending || isSubmitDisabled()}
          className="w-full h-12 text-lg font-semibold"
          size="lg"
        >
          {submitApplication.isPending ? (
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