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

interface StepUploadAndAIProps {
  form: UseFormReturn<InsertApplicationForm>;
}

export default function StepUploadAndAI({ form }: StepUploadAndAIProps) {
  const {
    uploadedFile,
    aiQuestions,
    isProcessingResume,
    resumeAnalysis,
    setUploadedFile,
    setResumeAnalysis,
    setAiQuestions,
    setIsProcessingResume,
    updateStep3Response,
  } = useApplicationStore();

  const handleFileSelect = (file: File | null) => {
    if (file) {
      setUploadedFile(file);
      setIsProcessingResume(true);
      // FileUpload component will handle the processing
    } else {
      // Only clear data if no successful analysis exists
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
      // Handle error case - don't store failed attempts
      setIsProcessingResume(false);
      setUploadedFile(null); // Allow re-upload on failure

      // Error handling is now done in FileUpload component
      // This fallback should rarely be reached
      toast.error("Processing failed", {
        description: "Please try uploading your resume again.",
        duration: 4000,
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

      <FileUpload
        file={uploadedFile}
        onFileSelect={handleFileSelect}
        onAnalysisComplete={handleAnalysisComplete}
        isProcessing={isProcessingResume}
      />

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
                className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm w-full max-w-full"
              >
                <FormField
                  control={form.control}
                  name={`responses.ai_${question.id}`}
                  render={({ field }) => (
                    <FormItem className="w-full max-w-full">
                      <FormLabel className="text-base font-semibold text-foreground flex items-start space-x-3 mb-1">
                        <span className="flex-1">{question.question}</span>
                      </FormLabel>
                      <FormControl>
                        <div className="w-full max-w-full overflow-hidden">
                          <VoiceTextarea
                            value={field.value || ""}
                            onChange={(value) => {
                              field.onChange(value);
                              // Also update Zustand store
                              updateStep3Response(question.id, value);
                            }}
                            placeholder="Type or speak your answer... Be specific and use examples from your experience."
                            rows={4}
                            language="en-US"
                            silenceTimeout={10000}
                            className="w-full max-w-full"
                          />
                        </div>
                      </FormControl>

                      <div className="text-xs text-muted-foreground">
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
