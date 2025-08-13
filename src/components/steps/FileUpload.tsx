import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatSize } from "@/utils/formatSize";

interface FileUploadProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  isProcessing?: boolean;
  className?: string;
}

export default function FileUpload({
  file,
  onFileSelect,
  isProcessing = false,
  className,
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors.some((e: any) => e.code === "file-too-large")) {
          return; // Error handled by form validation
        }
        if (rejection.errors.some((e: any) => e.code === "file-invalid-type")) {
          return; // Error handled by form validation
        }
      }

      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
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

  const removeFile = () => {
    onFileSelect(null);
  };

  if (file && !isProcessing) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-green-900">{file.name}</p>
                <p className="text-sm text-green-700">
                  {formatSize(file.size)}
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

  if (isProcessing) {
    return (
      <div className="flex justify-center">
        <img src="/resume-scan.gif" alt="Loading..." className="w-32" />
      </div>
    );
  }

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
          {/* Modern icon design */}
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

            {/* Modern requirements design */}
            <div className=" rounded-xl p-4">
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
