import type { AIQuestion, ResumeAnalysis, InsertApplication } from '@/types/application';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ApplicationState {
  currentStep: 1 | 2 | 3 | 4;
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
  setExtractedFileData: (data: {
    fileName: string;
    fileType: string;
    base64Data: string;
    extractedText: string;
  } | null) => void;
  setResumeAnalysis: (analysis: ResumeAnalysis | null) => void;
  setAiQuestions: (questions: AIQuestion[]) => void;
  setIsProcessingResume: (processing: boolean) => void;
  setIsSubmitted: (submitted: boolean) => void;
  
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
      applicationData: {
        fullName: '',
        email: '',
        phone: '',
        linkedin: '',
        stipendExpectation: '',
        startDate: '',
        weeklyCommitment: '',
        trialAccepted: '',
        responses: {},
        additionalComments: '',
      },

      setStep: (step) => set({ currentStep: step }),
      
      next: () => {
        const currentStep = get().currentStep;
        if (currentStep < 4) {
          set({ currentStep: (currentStep + 1) as 1 | 2 | 3 | 4 });
        }
      },
      
      prev: () => {
        const currentStep = get().currentStep;
        if (currentStep > 1) {
          set({ currentStep: (currentStep - 1) as 1 | 2 | 3 | 4 });
        }
      },
      
      setUploadedFile: (file) => set({ uploadedFile: file }),
      setExtractedFileData: (data) => set({ extractedFileData: data }),
      setResumeAnalysis: (analysis) => set({ resumeAnalysis: analysis }),
      setAiQuestions: (questions) => set({ aiQuestions: questions }),
      setIsProcessingResume: (processing) => set({ isProcessingResume: processing }),
      setIsSubmitted: (submitted) => set({ isSubmitted: submitted }),
      
      updateStep1Data: (data) => set((state) => ({
        applicationData: {
          ...state.applicationData,
          ...data
        }
      })),
      
      updateStep2Data: (data) => set((state) => ({
        applicationData: {
          ...state.applicationData,
          ...data
        }
      })),
      
      updateStep3Response: (questionId, answer) => set((state) => ({
        applicationData: {
          ...state.applicationData,
          responses: {
            ...state.applicationData.responses,
            [questionId]: answer
          }
        }
      })),
      
      updateStep4Data: (data) => set((state) => ({
        applicationData: {
          ...state.applicationData,
          ...data
        }
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
      
      reset: () => set({
        currentStep: 1,
        uploadedFile: null,
        extractedFileData: null,
        resumeAnalysis: null,
        aiQuestions: [],
        isProcessingResume: false,
        isSubmitted: false,
        applicationData: {
          fullName: '',
          email: '',
          phone: '',
          linkedin: '',
          stipendExpectation: '',
          startDate: '',
          weeklyCommitment: '',
          trialAccepted: '',
          responses: {},
          additionalComments: '',
        },
      }),
    }),
    {
      name: 'application-store',
      // Remove the partialize for now to see if it's causing issues
      // onRehydrateStorage: () => (state) => {
      //   console.log('Rehydrated state:', state);
      // },
    }
  )
);
