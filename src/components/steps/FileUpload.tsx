import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import type { FileRejection } from "react-dropzone";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatSize } from "@/utils/formatSize";
import { toast } from "sonner";
import type { AnalysisResult } from "@/types/application";

interface FileUploadProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  onAnalysisComplete: (result: AnalysisResult) => void;
  isProcessing?: boolean;
  className?: string;
}

export default function FileUpload({
  file,
  onFileSelect,
  onAnalysisComplete,
  isProcessing = false,
  className,
}: FileUploadProps) {
  const [processingStep, setProcessingStep] = useState<string>("");

  // Error message mapping
  const getErrorMessage = (errorType: string) => {
    const contactInfo = "careers@cehpoint.co.in or call +91 33690 29331";

    switch (errorType) {
      case "rate_limit_error":
        return {
          title: "High Volume of Applications",
          description:
            "We're experiencing high volume right now. Please try again after 10 minutes. Thanks for your understanding!",
          contact: `If issue persists, contact ${contactInfo}`,
          duration: 8000,
          showRetry: false,
        };

      case "api_auth_error":
      case "ai_processing_error":
        return {
          title: "AI Service Temporarily Unavailable",
          description:
            "Our resume analysis service is temporarily unavailable. Please try again in a few minutes.",
          contact: `If issue persists, contact ${contactInfo}`,
          duration: 6000,
          showRetry: true,
        };

      case "network_error":
        return {
          title: "Connection Issue",
          description: "Please check your internet connection and try again.",
          contact: `If issue persists, contact ${contactInfo}`,
          duration: 5000,
          showRetry: true,
        };

      case "file_processing_error":
        return {
          title: "Unable to Process Resume",
          description:
            "Please ensure your file is a valid PDF under 5MB and try again.",
          contact: `Need help? Contact ${contactInfo}`,
          duration: 6000,
          showRetry: true,
        };

      default:
        return {
          title: "Processing Failed",
          description:
            "Something went wrong while processing your resume. Please try again after 10 minutes. Thanks for your understanding!",
          contact: `If issue persists, contact ${contactInfo}`,
          duration: 6000,
          showRetry: true,
        };
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Call Vercel API
  const processResume = async (selectedFile: File) => {
    try {
      toast.success("File uploaded successfully!", {
        description: `Processing ${selectedFile.name}...`,
      });

      setProcessingStep("Converting PDF to base64...");
      const base64Data = await fileToBase64(selectedFile);

      setProcessingStep("Analyzing resume with AI...");
    //  console.log("environment", import.meta.env.VITE_ENV);

      // Use absolute URL for development, relative for production
      const apiUrl =
        import.meta.env.VITE_ENV === "development"
          ? "http://localhost:3000/api/analyzeResume" // Vercel dev server
          : "/api/analyzeResume"; // Production relative URL

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileData: base64Data,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorType = result.errorType || "general_error";
        const errorMessage = getErrorMessage(errorType);

        throw new Error(
          JSON.stringify({
            type: errorType,
            message: errorMessage,
            originalError: result.error,
          })
        );
      }

      setProcessingStep("");

      toast.success("Resume analysis completed!", {
        description: `Generated ${
          result.questions?.length || 0
        } interview questions based on your experience.`,
        duration: 5000,
      });

      onAnalysisComplete(result as AnalysisResult);
    } catch (error) {
      console.error("Error processing resume:", error);

      setProcessingStep("");

      // Don't store failed uploads - let user try again
      onFileSelect(null);

      let errorInfo;
      try {
        // Fix TypeScript error by properly typing the error
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        errorInfo = JSON.parse(errorMessage);
      } catch {
        // Handle case where error.message doesn't exist or isn't JSON
        errorInfo = {
          type: "general_error",
          message: getErrorMessage("general_error"),
        };
      }

      toast.error(errorInfo.message.title, {
        description: errorInfo.message.description,
        duration: errorInfo.message.duration,
        action: errorInfo.message.showRetry
          ? {
              label: "Try Again",
              onClick: () => {
                // Reset and allow re-upload
                onFileSelect(null);
              },
            }
          : undefined,
      });

      // Show contact info in a separate toast for persistent issues
      setTimeout(() => {
        toast.info("Need Help?", {
          description: errorInfo.message.contact,
          duration: 10000,
        });
      }, 1000);
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];

        if (rejection.errors.some((e) => e.code === "file-too-large")) {
          toast.error("File too large", {
            description:
              "Maximum file size is 5MB. Please choose a smaller file.",
            duration: 4000,
          });
          return;
        }

        if (rejection.errors.some((e) => e.code === "file-invalid-type")) {
          toast.error("Invalid file type", {
            description:
              "Only PDF files are supported. Please select a PDF resume.",
            duration: 4000,
          });
          return;
        }

        toast.error("File upload failed", {
          description:
            rejection.errors[0]?.message ||
            "Please check your file and try again.",
          duration: 4000,
        });
        return;
      }

      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        onFileSelect(selectedFile);
        await processResume(selectedFile);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: isProcessing,
  });

  // Modified removeFile function to prevent removal for exam authenticity
  const removeFile = () => {
    toast.error("Cannot Remove File", {
      description: (
        <div>
          <p>
            You cannot remove the file due to exam authenticity. If you have
            uploaded wrong resume or wrong file:
          </p>
          <br />
          <p>
            <strong>Option 1:</strong> Close the browser and reopen browser and
            visit link
          </p>
          <br />
          <p>
            <strong>Option 2:</strong> Stay in our link → Right-click Inspect →
            Application tab → Storage → Clear Storage → Refresh page
          </p>
        </div>
      ),
      duration: 12000,
      action: {
        label: "Got it",
        onClick: () => {
          // Just dismiss the toast
        },
      },
    });
  };

  if (isProcessing && processingStep) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <img src="/resume-scan.gif" alt="Processing..." className="w-32" />
        <p className="text-lg font-medium text-blue-600">{processingStep}</p>
        <div className="text-sm text-gray-500">
          This may take a few moments...
        </div>
      </div>
    );
  }

  if (file && !processingStep && !isProcessing) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-green-900">{file.name}</p>
                <p className="text-sm text-green-700">
                  {/* Fix for NaN GB issue - check if file and size exist */}
                  {file && typeof file.size === "number"
                    ? formatSize(file.size)
                    : "Unknown size"}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-green-700 hover:text-green-900 hover:bg-green-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show upload dropzone
  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "relative border rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer bg-white shadow-sm hover:shadow-lg",
          {
            "border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-xl scale-[1.01]":
              isDragActive,
            "border-gray-200 hover:border-blue-300": !isDragActive,
          }
        )}
      >
        <input {...getInputProps()} />

        <div className="space-y-6">
          <div className="relative mx-auto w-fit">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl rotate-3 hover:rotate-0 transition-transform duration-300">
              <Upload className="h-12 w-12 text-white" />
            </div>
            {isDragActive && (
              <div className="absolute inset-0 bg-blue-400 rounded-2xl animate-ping opacity-20" />
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                Upload Your Resume
              </h3>
              <p className="text-gray-600 text-lg">
                {isDragActive
                  ? "Perfect! Drop it right here 🎯"
                  : "Ready to get started? Upload or Drag your resume below"}
              </p>
            </div>

            <div className="rounded-xl p-4">
              <div className="flex items-center justify-center space-x-8 text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                    </svg>
                  </div>
                  <span className="font-medium">PDF Format</span>
                </div>
                <div className="w-px h-6 bg-gray-300"></div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">Max 5 MB</span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ring-4 ring-blue-100"
            >
              <Upload className="h-5 w-5 mr-3" />
              Browse Files
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
