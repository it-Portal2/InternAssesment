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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
    resumeAnalysis,
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
        duration: 5000
      });
    } else {
      // Handle error case
      setIsProcessingResume(false);
      toast.error("Processing failed", {
        description: "Failed to process your resume. Please try again.",
        duration: 6000
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
        <AlertDescription className="text-amber-800">
          Upload your resume (PDF only, <strong>&lt; 5 MB</strong>). After
          upload, we will analyze your background and generate{" "}
          <strong>personalized interview questions</strong>. Please answer{" "}
          <strong>by yourself</strong>—{" "}
          <strong>no AI or external help</strong>.{" "}
          <strong>Malpractice leads to rejection.</strong>
        </AlertDescription>
      </Alert>

      {/* ✅ UPDATED: FileUpload with proper integration */}
      <FileUpload
        file={uploadedFile}
        onFileSelect={handleFileSelect}
        onAnalysisComplete={handleAnalysisComplete} 
        isProcessing={isProcessingResume}
      />

      {/* Success notification with dynamic data */}
      {resumeAnalysis && !isProcessingResume && (
        <Alert className="border-green-200 bg-green-50">
          <Bot className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Resume processed successfully! Generated <strong>{aiQuestions.length} personalized questions</strong> based on your{" "}
            <strong>{resumeAnalysis.experience}</strong> experience in{" "}
            <strong>{resumeAnalysis.skills.slice(0, 3).join(", ")}</strong>
            {resumeAnalysis.skills.length > 3 && " and more"}.
          </AlertDescription>
        </Alert>
      )}

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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <strong>📝 Instructions:</strong> These questions are tailored to your resume content including your{" "}
              <strong>{resumeAnalysis?.skills.join(", ")}</strong> skills and{" "}
              <strong>{resumeAnalysis?.experience}</strong>. Answer each question thoroughly using your own experience.
            </p>
          </div>

          <div className="space-y-6">
            {aiQuestions.map((question, index) => (
              <div key={question.id} className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                <FormField
                  control={form.control}
                  name={`responses.ai_${question.id}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold text-foreground flex items-start space-x-3">
                        <span className="bg-blue-600 text-white text-sm px-2 py-1 rounded-full min-w-[24px] text-center">
                          {index + 1}
                        </span>
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
                        />
                      </FormControl>
                      <FormMessage />
                      
                      {/* Character count and guidance */}
                      <div className="text-xs text-muted-foreground mt-2">
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

          {/* Summary of analysis */}
          {resumeAnalysis && (
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold text-gray-800 mb-2">📊 Resume Analysis Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Experience Level:</strong> {resumeAnalysis.experience}
                </div>
                <div>
                  <strong>Education:</strong> {resumeAnalysis.education}
                </div>
                <div className="md:col-span-2">
                  <strong>Key Skills:</strong> {resumeAnalysis.skills.join(", ")}
                </div>
                <div className="md:col-span-2">
                  <strong>Summary:</strong> {resumeAnalysis.summary}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
