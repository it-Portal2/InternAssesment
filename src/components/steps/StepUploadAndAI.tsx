import type { UseFormReturn } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
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

  const processResume = useMutation({
    mutationFn: async (file: File) => {
      // Simulate API processing
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // TODO: replace with real API
      // const formData = new FormData();
      // formData.append("resume", file);
      // const response = await fetch("/api/process-resume", { method: "POST", body: formData });
      // const data = await response.json();

      // MOCK RESPONSE:
      return {
        resumeAnalysis: {
          skills: ["React", "TypeScript", "Node.js", "Python", "JavaScript"],
          experience:
            "6 months internship experience with frontend development",
          education: "B.Tech Computer Science Engineering",
          summary:
            "Passionate frontend developer with experience in modern web technologies",
        },
        aiQuestions: [
          {
            id: "q1",
            question: "Describe a project where you used React effectively.",
          },
          { id: "q2", question: "How do you ensure code quality in a team?" },
          {
            id: "q3",
            question: "What experience do you have with TypeScript?",
          },
        ],
        cloudinary: { url: "https://example.com/mock.pdf" },
      };
    },
    onSuccess: (data) => {
      setResumeAnalysis(data.resumeAnalysis);
      setAiQuestions(data.aiQuestions);
      form.setValue("resumeAnalysis", data.resumeAnalysis);
      form.setValue("aiQuestions", data.aiQuestions);
      setIsProcessingResume(false);

      toast.success("Resume processed successfully!", {
        description:
          "Personalized questions have been generated based on your resume.",
      });
    },
    onError: (error) => {
      setIsProcessingResume(false);
      toast.error("Processing failed", {
        description: "Failed to process your resume. Please try again.",
      });
    },
  });

  const handleFileSelect = (file: File | null) => {
    if (file) {
      setUploadedFile(file);
      setIsProcessingResume(true);
      processResume.mutate(file);
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
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Resume Upload & Answer Questions
        </h2>
        <p className="text-muted-foreground">
          Upload your resume to get personalized questions
        </p>
      </div>

      {/* Important Notice */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <p className="text-amber-800">
          Upload your resume (PDF only, <strong>&lt; 5 MB</strong>). After
          upload, we will show <strong>personalized questions</strong>. Please
          answer <strong>by yourself</strong>—{" "}
          <strong>no AI or external help</strong>.{" "}
          <strong>Malpractice leads to rejection.</strong>
        </p>
      </Alert>

      {/* File Upload */}
      <FileUpload
        file={uploadedFile}
        onFileSelect={handleFileSelect}
        isProcessing={isProcessingResume}
      />

      {/* Success notification */}
      {resumeAnalysis && !isProcessingResume && (
        <Alert className="border-green-200 bg-green-50">
          <Bot className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Resume processed successfully! Personalized questions have been
            generated based on your background.
          </AlertDescription>
        </Alert>
      )}

      {/* AI Generated Questions with Voice Input */}
      {aiQuestions.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-bold text-foreground">
              Personalized Questions
            </h3>
          </div>

          <div className="space-y-6">
            {aiQuestions.map((question, index) => (
              <FormField
                key={question.id}
                control={form.control}
                name={`responses.ai_${question.id}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-foreground">
                      {index + 1}. {question.question}
                    </FormLabel>
                    <FormControl>
                      <VoiceTextarea
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Type or speak your answer..."
                        rows={4}
                        language="en-US"
                        silenceTimeout={10000}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
