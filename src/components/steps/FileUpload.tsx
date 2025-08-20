import { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import type { FileRejection } from "react-dropzone";
import {
  Upload,
  File,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { cn } from "@/lib/utils";
import { formatSize } from "@/utils/formatSize";
import { toast } from "sonner";
import type { AnalysisResult } from "@/types/application";
import { Progress } from "../ui/progress";

interface FileUploadProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  onAnalysisComplete: (result: AnalysisResult) => void;
  isProcessing?: boolean;
  className?: string;
}

interface ProcessingState {
  step:
    | "uploading"
    | "converting"
    | "analyzing"
    | "generating"
    | "complete"
    | "error";
  progress: number;
  message: string;
  details?: string;
}

export default function FileUpload({
  file,
  onFileSelect,
  onAnalysisComplete,
  isProcessing = false,
  className,
}: FileUploadProps) {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    step: "uploading" as const,
    progress: 0,
    message: "",
  });
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
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

  // Enhanced process resume with detailed progress tracking
  const processResume = async (selectedFile: File, isRetry = false) => {
    try {
      setLastError(null);

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      if (!isRetry) {
        setRetryCount(0);
        toast.success("File uploaded successfully!", {
          description: `Processing ${selectedFile.name}...`,
          duration: 3000,
        });
      } else {
        toast.loading("Retrying analysis...", {
          description: `Attempt ${retryCount + 1}`,
          duration: 2000,
        });
      }

      // Step 1: Converting to base64
      setProcessingState({
        step: "converting",
        progress: 10,
        message: "Converting PDF to base64...",
        details: "Preparing your resume for AI analysis",
      });

      const base64Data = await fileToBase64(selectedFile);

      // Step 2: Starting AI analysis
      setProcessingState({
        step: "analyzing",
        progress: 30,
        message: "Analyzing resume with AI...",
        details: "Our AI is reading your resume and extracting key information",
      });

      // Enhanced fetch with timeout and abort signal
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 55000); // 55 second timeout

      const response = await fetch("/api/analyzeResume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileData: base64Data,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          retryAttempt: retryCount,
        }),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      // Step 3: Processing response
      setProcessingState({
        step: "generating",
        progress: 70,
        message: "Generating interview questions...",
        details: "Creating personalized questions based on your experience",
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            error: `HTTP ${response.status}`,
            message: response.statusText,
          };
        }

        throw new Error(
          errorData.message ||
            errorData.error ||
            `Server returned ${response.status}`
        );
      }

      const result = await response.json();

      // Step 4: Finalizing
      setProcessingState({
        step: "complete",
        progress: 100,
        message: "Analysis completed successfully!",
        details: `Generated ${
          result.questions?.length || 0
        } personalized questions`,
      });

      setIsAnalysisComplete(true); // Add this line
      // Success feedback
      toast.success("🎉 Resume analysis completed!", {
        description: `Generated ${
          result.questions?.length || 0
        } interview questions based on your experience.`,
        duration: 5000,
        action: {
          label: "View Details",
          onClick: () => {
            toast.info("Analysis Summary", {
              description: `Skills: ${
                result.resumeAnalysis?.skills?.length || 0
              }, Experience: ${
                result.resumeAnalysis?.experience || "Not specified"
              }`,
              duration: 4000,
            });
          },
        },
      });

      onAnalysisComplete(result as AnalysisResult);
    } catch (error) {
      console.error("Error processing resume:", error);

      // Type guard to ensure error is an Error object
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      const errorName = error instanceof Error ? error.name : "";

      setLastError(errorMessage);

      setProcessingState({
        step: "error",
        progress: 0,
        message: "Processing failed",
        details: errorMessage,
      });

      // Enhanced error handling with specific user guidance
      let toastTitle = "Failed to process resume";
      let toastDescription = errorMessage;
      let showRetryOption = true;

      if (errorName === "AbortError") {
        toastTitle = "Request timed out";
        toastDescription =
          "The analysis took too long. Your resume might be complex or our servers are busy.";
      } else if (errorMessage.includes("network")) {
        toastTitle = "Network connection error";
        toastDescription =
          "Please check your internet connection and try again.";
      } else if (errorMessage.includes("timeout")) {
        toastTitle = "Processing timeout";
        toastDescription =
          "The analysis took longer than expected. This can happen with complex resumes.";
      } else if (
        errorMessage.includes("quota") ||
        errorMessage.includes("rate limit")
      ) {
        toastTitle = "Service temporarily busy";
        toastDescription =
          "Our AI service is experiencing high demand. Please try again in a few moments.";
      } else if (
        errorMessage.includes("API key") ||
        errorMessage.includes("401")
      ) {
        toastTitle = "Service configuration issue";
        toastDescription =
          "There's a temporary service configuration problem. Please contact support.";
        showRetryOption = false;
      } else if (
        errorMessage.includes("invalid") &&
        errorMessage.includes("JSON")
      ) {
        toastTitle = "AI response error";
        toastDescription =
          "The AI gave an unexpected response. This usually resolves with a retry.";
      }

      const canRetry = retryCount < 3 && showRetryOption;

      toast.error(toastTitle, {
        description: toastDescription,
        duration: 8000,
        action: canRetry
          ? {
              label: `Retry (${3 - retryCount} left)`,
              onClick: () => {
                setRetryCount((prev) => prev + 1);
                processResume(selectedFile, true);
              },
            }
          : {
              label: "Remove File",
              onClick: () => removeFile(),
            },
      });
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];

        if (rejection.errors.some((e) => e.code === "file-too-large")) {
          toast.error("File too large", {
            description:
              "Maximum file size is 5MB. Please compress your PDF or choose a smaller file.",
            duration: 6000,
            action: {
              label: "How to compress?",
              onClick: () => {
                toast.info("PDF Compression Tips", {
                  description:
                    "Try online tools like SmallPDF, ILovePDF, or save your PDF with lower quality settings.",
                  duration: 8000,
                });
              },
            },
          });
          return;
        }

        if (rejection.errors.some((e) => e.code === "file-invalid-type")) {
          toast.error("Invalid file type", {
            description:
              "Only PDF files are supported. Please convert your resume to PDF format.",
            duration: 6000,
            action: {
              label: "Convert to PDF",
              onClick: () => {
                toast.info("Convert to PDF", {
                  description:
                    "Use Google Docs, Microsoft Word, or online converters like PDF24 to convert your resume to PDF.",
                  duration: 8000,
                });
              },
            },
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
    [onFileSelect, retryCount]
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

  const removeFile = () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    onFileSelect(null);
    setProcessingState({
      step: "uploading",
      progress: 0,
      message: "",
    });
    setRetryCount(0);
    setLastError(null);

    toast.info("File removed", {
      description: "You can upload a new resume to analyze.",
      duration: 3000,
    });
  };

  const retryAnalysis = () => {
    if (file && retryCount < 3) {
      setRetryCount((prev) => prev + 1);
      processResume(file, true);
    }
  };

  // Show processing state
  if (isProcessing || processingState.step !== "uploading") {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex flex-col items-center justify-center space-y-6 p-8 border rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
          {processingState.step === "error" ? (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-red-700">
                  {processingState.message}
                </p>
                {processingState.details && (
                  <p className="text-sm text-red-600 max-w-md">
                    {processingState.details}
                  </p>
                )}
              </div>
              <div className="flex space-x-3">
                {retryCount < 3 && (
                  <Button
                    onClick={retryAnalysis}
                    className="flex items-center space-x-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Retry Analysis ({3 - retryCount} left)</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={removeFile}
                  className="flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Remove File</span>
                </Button>
              </div>
            </>
          ) : processingState.step === "complete" ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-green-700">
                  {processingState.message}
                </p>
                <p className="text-sm text-green-600">
                  {processingState.details}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <img
                  src="/resume-scan.gif"
                  alt="Processing..."
                  className="w-24 h-24"
                />
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="text-center space-y-3 max-w-md">
                <p className="text-lg font-semibold text-blue-700">
                  {processingState.message}
                </p>
                {processingState.details && (
                  <p className="text-sm text-blue-600">
                    {processingState.details}
                  </p>
                )}
                <div className="space-y-2">
                  <Progress value={processingState.progress} className="w-64" />
                  <p className="text-xs text-gray-500">
                    {processingState.progress}% complete • Step{" "}
                    {processingState.step === "converting"
                      ? "1"
                      : processingState.step === "analyzing"
                      ? "2"
                      : processingState.step === "generating"
                      ? "3"
                      : "4"}{" "}
                    of 4
                  </p>
                </div>
              </div>
              {retryCount > 0 && (
                <p className="text-xs text-amber-600">
                  Retry attempt {retryCount} of 3
                </p>
              )}
            </>
          )}
        </div>

        {/* Processing steps indicator */}
        {processingState.step !== "error" &&
          processingState.step !== "complete" && (
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[
                { key: "converting", label: "Convert", step: 1 },
                { key: "analyzing", label: "Analyze", step: 2 },
                { key: "generating", label: "Generate", step: 3 },
                { key: "complete", label: "Complete", step: 4 },
              ].map((item) => (
                <div
                  key={item.key}
                  className={cn(
                    "p-2 rounded text-center transition-all duration-300",
                    processingState.step === item.key
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : processingState.progress >= item.step * 25
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {item.label}
                </div>
              ))}
            </div>
          )}
      </div>
    );
  }

  // Show successfully uploaded file
  if (file && isAnalysisComplete && !isProcessing) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-green-900">{file.name}</p>
                <p className="text-sm text-green-700">
                  {formatSize(file.size)} • Successfully analyzed
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
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

            {lastError && (
              <Alert className="border-amber-200 bg-amber-50 mt-4">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  Previous upload failed: {lastError}. Please try uploading
                  again.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>

      {/* Help section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
          <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-3 h-3 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <span>AI analyzes your skills & experience</span>
        </div>
        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
          <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-3 h-3 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span>Generates personalized questions</span>
        </div>
        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
          <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-3 h-3 text-purple-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
          </div>
          <span>Takes 30-60 seconds to process</span>
        </div>
      </div>
    </div>
  );
}
