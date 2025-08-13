import type { AIQuestion, ResumeAnalysis } from '@/types/application';
import { create } from 'zustand';


interface ApplicationState {
  currentStep: 1 | 2 | 3 | 4;
  uploadedFile: File | null;
  resumeAnalysis: ResumeAnalysis | null;
  aiQuestions: AIQuestion[];
  isProcessingResume: boolean;
  isSubmitted: boolean;
  
  // Actions
  setStep: (step: 1 | 2 | 3 | 4) => void;
  next: () => void;
  prev: () => void;
  setUploadedFile: (file: File | null) => void;
  setResumeAnalysis: (analysis: ResumeAnalysis | null) => void;
  setAiQuestions: (questions: AIQuestion[]) => void;
  setIsProcessingResume: (processing: boolean) => void;
  setIsSubmitted: (submitted: boolean) => void;
  reset: () => void;
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  currentStep: 1,
  uploadedFile: null,
  resumeAnalysis: null,
  aiQuestions: [],
  isProcessingResume: false,
  isSubmitted: false,

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
  setResumeAnalysis: (analysis) => set({ resumeAnalysis: analysis }),
  setAiQuestions: (questions) => set({ aiQuestions: questions }),
  setIsProcessingResume: (processing) => set({ isProcessingResume: processing }),
  setIsSubmitted: (submitted) => set({ isSubmitted: submitted }),
  
  reset: () => set({
    currentStep: 1,
    uploadedFile: null,
    resumeAnalysis: null,
    aiQuestions: [],
    isProcessingResume: false,
    isSubmitted: false,
  }),
}));