import type { UseFormReturn } from "react-hook-form";
import { AlertTriangle, Bot } from "lucide-react";
import { toast } from "sonner";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert} from "@/components/ui/alert";
import FileUpload from "./FileUpload";
import { useApplicationStore } from "@/store/useApplicationStore";
import type { InsertApplicationForm } from "@/lib/validation";
import { VoiceTextarea } from "@/components/ui/VoiceTextarea";
import type { AnalysisResult } from "@/types/application";

interface StepUploadAndAIProps {
  form: UseFormReturn<InsertApplicationForm>;
}

export default function StepUploadAndAI({ form }: StepUploadAndAIProps) {
  const {
    uploadedFile,
    aiQuestions,
    isProcessingResume,
    setUploadedFile,
    setResumeAnalysis,
    setAiQuestions,
    setIsProcessingResume,
  } = useApplicationStore();

  // ✅ REMOVED: processResume mutation - FileUpload handles this directly now

  const handleFileSelect = (file: File | null) => {
    if (file) {
      setUploadedFile(file);
      setIsProcessingResume(true);
      // FileUpload component will handle the processing
    } else {
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
      setIsProcessingResume(false);
    }
  };

  // ✅ NEW: Handle analysis completion from FileUpload
  const handleAnalysisComplete = (result: AnalysisResult) => {
    if (result.success) {
      // Update store with real API data
      setResumeAnalysis(result.resumeAnalysis);
      setAiQuestions(result.questions);

      // Update form with real API data
      form.setValue("resumeAnalysis", result.resumeAnalysis);
      form.setValue("aiQuestions", result.questions);

      setIsProcessingResume(false);

      toast.success("Resume processed successfully!", {
        description: `Generated ${result.questions.length} personalized questions based on your resume.`,
        duration: 5000,
      });
    } else {
      // Handle error case
      setIsProcessingResume(false);
      toast.error("Processing failed", {
        description: "Failed to process your resume. Please try again.",
        duration: 6000,
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Resume Upload & Answer Questions
        </h2>
        <p className="text-muted-foreground">
          Upload your resume to get personalized questions powered by AI
        </p>
      </div>

      {/* Important Notice */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <p className="text-amber-800">
          Upload your resume (PDF only, <strong>&lt; 5 MB</strong>). After
          upload, we will analyze your background and generate{" "}
          <strong>personalized interview questions</strong>. Please answer{" "}
          <strong>by yourself</strong>— <strong>no AI or external help</strong>.{" "}
          <strong>Malpractice leads to rejection.</strong>
        </p>
      </Alert>

      {/* ✅ UPDATED: FileUpload with proper integration */}
      <FileUpload
        file={uploadedFile}
        onFileSelect={handleFileSelect}
        onAnalysisComplete={handleAnalysisComplete}
        isProcessing={isProcessingResume}
      />

      {/* AI Generated Questions with Voice Input */}
      {aiQuestions.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Bot className="h-5 w-5 text-blue-600" />
            <h3 className="text-xl font-bold text-foreground">
              Personalized Interview Questions
            </h3>
            <span className="text-sm text-muted-foreground bg-blue-100 px-2 py-1 rounded-full">
              {aiQuestions.length} questions
            </span>
          </div>

          <div className="space-y-6">
            {aiQuestions.map((question) => (
              <div
                key={question.id}
                className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm"
              >
                <FormField
                  control={form.control}
                  name={`responses.ai_${question.id}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-foreground flex items-start space-x-3">
                        <span className="flex-1">{question.question}</span>
                      </FormLabel>
                      <FormControl>
                        <VoiceTextarea
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Type or speak your answer... Be specific and use examples from your experience."
                          rows={4}
                          language="en-US"
                          silenceTimeout={10000}
                          className="mt-3" // ✅ Optional additional styling
                        />
                      </FormControl>
                      <FormMessage />

                      {/* Character count and guidance */}
                      <div className="text-xs text-muted-foreground mt-1">
                        {field.value?.length || 0} characters
                        {(field.value?.length || 0) < 100 && (
                          <span className="text-amber-600 ml-2">
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
        </div>
      )}
    </div>
  );
}
