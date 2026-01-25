import type {
  AIQuestion,
  ResumeAnalysis,
  InsertApplication,
} from "@/types/application";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ApplicationState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  uploadedFile: File | null;
  extractedFileData: {
    fileName: string;
    fileType: string;
    base64Data: string;
    extractedText: string;
  } | null;
  resumeAnalysis: ResumeAnalysis | null;
  aiQuestions: AIQuestion[];
  isProcessingResume: boolean;
  isSubmitted: boolean;
  isCameraApproved: boolean; // Persists camera permission state
  isAllPermissionsApproved: boolean; // All 3 permissions (camera, audio, screen)

  applicationData: {
    fullName: string;
    email: string;
    phone: string;
    linkedin: string;
    stipendExpectation: string;
    startDate: string;
    weeklyCommitment: string;
    trialAccepted: string;
    responses: Record<string, string>;
    additionalComments: string;
  };

  // Actions
  setStep: (step: 1 | 2 | 3 | 4) => void;
  next: () => void;
  prev: () => void;
  setUploadedFile: (file: File | null) => void;
  setExtractedFileData: (
    data: {
      fileName: string;
      fileType: string;
      base64Data: string;
      extractedText: string;
    } | null,
  ) => void;
  setResumeAnalysis: (analysis: ResumeAnalysis | null) => void;
  setAiQuestions: (questions: AIQuestion[]) => void;
  setIsProcessingResume: (processing: boolean) => void;
  setIsSubmitted: (submitted: boolean) => void;
  setIsCameraApproved: (approved: boolean) => void;
  setIsAllPermissionsApproved: (approved: boolean) => void;

  updateStep1Data: (data: {
    fullName?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
  }) => void;

  updateStep2Data: (data: {
    stipendExpectation?: string;
    startDate?: string;
    weeklyCommitment?: string;
    trialAccepted?: string;
  }) => void;

  updateStep3Response: (questionId: string, answer: string) => void;
  updateStep4Data: (data: { additionalComments?: string }) => void;
  getCompleteApplication: () => InsertApplication | null;
  reset: () => void;
}

export const useApplicationStore = create<ApplicationState>()(
  persist(
    (set, get) => ({
      currentStep: 1,
      uploadedFile: null,
      extractedFileData: null,
      resumeAnalysis: null,
      aiQuestions: [],
      isProcessingResume: false,
      isSubmitted: false,
      isCameraApproved: false,
      isAllPermissionsApproved: false,
      applicationData: {
        fullName: "",
        email: "",
        phone: "",
        linkedin: "",
        stipendExpectation: "",
        startDate: "",
        weeklyCommitment: "",
        trialAccepted: "",
        responses: {},
        additionalComments: "",
      },

      setStep: (step) => set({ currentStep: step }),

      next: () => {
        const currentStep = get().currentStep;
        if (currentStep < 5) {
          set({ currentStep: (currentStep + 1) as 1 | 2 | 3 | 4 | 5 });
        }
      },

      prev: () => {
        const currentStep = get().currentStep;
        if (currentStep > 1) {
          set({ currentStep: (currentStep - 1) as 1 | 2 | 3 | 4 | 5 });
        }
      },

      setUploadedFile: (file) => {
        // Only store file if it's not null or if we have successful analysis
        const currentState = get();
        if (file || !currentState.resumeAnalysis) {
          set({ uploadedFile: file });

          // Store file metadata for display purposes across refreshes
          // But only if we have successful analysis or if we're clearing the file
          if (file && currentState.resumeAnalysis) {
            const fileInfo = {
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: file.lastModified,
            };
            localStorage.setItem("uploadedFileInfo", JSON.stringify(fileInfo));
          } else if (!file) {
            // Clear file info when removing file
            localStorage.removeItem("uploadedFileInfo");
          }
        }
      },
      setExtractedFileData: (data) => set({ extractedFileData: data }),
      setResumeAnalysis: (analysis) => {
        const currentState = get();
        set({ resumeAnalysis: analysis });

        // If analysis is successful and we have a file, store the file info
        if (analysis && currentState.uploadedFile) {
          const fileInfo = {
            name: currentState.uploadedFile.name,
            size: currentState.uploadedFile.size,
            type: currentState.uploadedFile.type,
            lastModified: currentState.uploadedFile.lastModified,
          };
          localStorage.setItem("uploadedFileInfo", JSON.stringify(fileInfo));
        } else if (!analysis) {
          // Clear file and file info if analysis failed
          set({ uploadedFile: null });
          localStorage.removeItem("uploadedFileInfo");
        }
      },

      setAiQuestions: (questions) => set({ aiQuestions: questions }),
      setIsProcessingResume: (processing) =>
        set({ isProcessingResume: processing }),
      setIsSubmitted: (submitted) => set({ isSubmitted: submitted }),
      setIsCameraApproved: (approved) => set({ isCameraApproved: approved }),
      setIsAllPermissionsApproved: (approved) =>
        set({ isAllPermissionsApproved: approved }),

      updateStep1Data: (data) =>
        set((state) => ({
          applicationData: {
            ...state.applicationData,
            ...data,
          },
        })),

      updateStep2Data: (data) =>
        set((state) => ({
          applicationData: {
            ...state.applicationData,
            ...data,
          },
        })),

      updateStep3Response: (questionId, answer) =>
        set((state) => ({
          applicationData: {
            ...state.applicationData,
            responses: {
              ...state.applicationData.responses,
              [questionId]: answer,
            },
          },
        })),

      updateStep4Data: (data) =>
        set((state) => ({
          applicationData: {
            ...state.applicationData,
            ...data,
          },
        })),

      getCompleteApplication: () => {
        const state = get();
        if (!state.resumeAnalysis || !state.aiQuestions.length) {
          return null;
        }

        return {
          fullName: state.applicationData.fullName,
          email: state.applicationData.email,
          phone: state.applicationData.phone,
          linkedin: state.applicationData.linkedin,
          stipendExpectation: state.applicationData.stipendExpectation,
          startDate: state.applicationData.startDate,
          weeklyCommitment: state.applicationData.weeklyCommitment,
          trialAccepted: state.applicationData.trialAccepted,
          additionalComments: state.applicationData.additionalComments,
          resumeAnalysis: state.resumeAnalysis,
          responses: state.applicationData.responses,
          aiQuestions: state.aiQuestions,
        };
      },

      reset: () =>
        set({
          currentStep: 1,
          uploadedFile: null,
          extractedFileData: null,
          resumeAnalysis: null,
          aiQuestions: [],
          isProcessingResume: false,
          isSubmitted: false,
          isCameraApproved: false,
          isAllPermissionsApproved: false,
          applicationData: {
            fullName: "",
            email: "",
            phone: "",
            linkedin: "",
            stipendExpectation: "",
            startDate: "",
            weeklyCommitment: "",
            trialAccepted: "",
            responses: {},
            additionalComments: "",
          },
        }),
    }),
    {
      name: "application-store",
      partialize: (state) => ({
        ...state,
        // Don't persist the actual File object, just store successful states
        uploadedFile: state.resumeAnalysis ? true : null, // Store boolean flag instead of file
      }),
      onRehydrateStorage: () => (state, error) => {
        if (!error && state) {
          // Only restore file info if we have successful analysis
          if (state.resumeAnalysis && state.uploadedFile) {
            const fileInfoStr = localStorage.getItem("uploadedFileInfo");
            if (fileInfoStr) {
              try {
                const fileInfo = JSON.parse(fileInfoStr);
                // Create a mock file object with the stored info for display purposes
                const mockFile = {
                  name: fileInfo.name,
                  size: fileInfo.size,
                  type: fileInfo.type,
                  lastModified: fileInfo.lastModified,
                } as File;
                state.uploadedFile = mockFile;
              } catch (e) {
                console.error("Error restoring file info:", e);
                localStorage.removeItem("uploadedFileInfo");
                state.uploadedFile = null;
              }
            } else {
              // No file info available, clear the flag
              state.uploadedFile = null;
            }
          } else {
            // No successful analysis, ensure file is cleared
            state.uploadedFile = null;
            localStorage.removeItem("uploadedFileInfo");
          }
        }
      },
    },
  ),
);
