import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useApplicationStore } from "@/store/useApplicationStore";
import {
  insertApplicationSchema,
  type InsertApplicationForm,
} from "@/lib/validation";
import SuccessScreen from "./SuccessScreen";
import StepPersonalInfo from "./StepPersonalInfo";
import StepPredefinedQuestions from "./StepPredefinedQuestions";
import StepUploadAndAI from "./StepUploadAndAI";
import StepCommentsAndSubmit from "./StepCommentsAndSubmit";
import { Stepper } from "../ui/Stepper";
import { useEffect, useState } from "react";
import { toast } from "sonner"; // Import toast

interface ModalApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  { id: 1, title: "Personal Info" },
  { id: 2, title: "Questions" },
  { id: 3, title: "Resume" },
  { id: 4, title: "Submit" },
];

export default function ModalApplicationForm({
  open,
  onOpenChange,
}: ModalApplicationFormProps) {
  const {
    currentStep,
    isSubmitted,
    resumeAnalysis,
    aiQuestions,
    next,
    prev,
    setIsSubmitted,
    reset,
  } = useApplicationStore();

  const [isNextDisabled, setIsNextDisabled] = useState(true);

  const form = useForm<InsertApplicationForm>({
    resolver: zodResolver(insertApplicationSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      linkedin: "",
      stipendExpectation: "",
      startDate: "",
      weeklyCommitment: "10-15",
      trialAccepted: "yes",
      additionalComments: "",
      resumeAnalysis: {
        skills: [],
        experience: "",
        education: "",
        summary: "",
      },
      responses: {},
      aiQuestions: [],
    },
  });

  // Watch form values for real-time validation
  const watchedValues = form.watch();
  const formErrors = form.formState.errors;

  // Update Next button state based on current step validation
  useEffect(() => {
    const checkStepValidation = () => {
      switch (currentStep) {
        case 1: {
          const step1Valid = validateStep1();
          setIsNextDisabled(!step1Valid);
          break;
        }
        case 2: {
          const step2Valid = validateStep2();
          setIsNextDisabled(!step2Valid);
          break;
        }
        case 3: {
          const step3Valid = validateStep3();
          setIsNextDisabled(!step3Valid);
          break;
        }
        default: {
          setIsNextDisabled(false);
          break;
        }
      }
    };

    checkStepValidation();
  }, [watchedValues, currentStep, resumeAnalysis, aiQuestions, formErrors]);

  // Step 1 validation
  const validateStep1 = () => {
    const { fullName, email, phone } = watchedValues;

    // Check if required fields are filled
    if (!fullName?.trim() || !email?.trim() || !phone?.trim()) {
      return false;
    }

    // Check for validation errors
    if (formErrors.fullName || formErrors.email || formErrors.phone) {
      return false;
    }

    return true;
  };

  // Step 2 validation
  const validateStep2 = () => {
    const { startDate, weeklyCommitment, trialAccepted, stipendExpectation } =
      watchedValues;

    if (
      !startDate?.trim() ||
      !weeklyCommitment?.trim() ||
      !trialAccepted?.trim() ||
      !stipendExpectation?.trim()
    ) {
      return false;
    }

    if (
      formErrors.startDate ||
      formErrors.weeklyCommitment ||
      formErrors.trialAccepted ||
      formErrors.stipendExpectation
    ) {
      return false;
    }

    return true;
  };

  // Step 3 validation
  const validateStep3 = () => {
    // Check if resume analysis exists
    if (!resumeAnalysis) {
      return false;
    }

    // If there are AI questions, check if all are answered
    if (aiQuestions.length > 0) {
      return aiQuestions.every((q) => {
        const answer = watchedValues.responses?.[`ai_${q.id}`];
        return answer && answer.trim() !== "";
      });
    }

    return true;
  };

  // Handle next button with validation and toast messages
  // Handle next button with validation and toast messages
  const handleNext = async () => {
    let isValid = false;
    let errorMessage = "";

    switch (currentStep) {
      case 1: {
        // Wrap the case content in curly braces
        const step1Result = await form.trigger([
          "fullName",
          "email",
          "phone",
          "linkedin",
        ]);
        if (step1Result && validateStep1()) {
          isValid = true;
        } else {
          errorMessage = getStep1ErrorMessage();
        }
        break;
      }

      case 2: {
        const step2Result = await form.trigger([
          "startDate",
          "weeklyCommitment",
          "trialAccepted",
          "stipendExpectation",
        ]);
        if (step2Result && validateStep2()) {
          isValid = true;
        } else {
          errorMessage = getStep2ErrorMessage();
        }
        break;
      }

      case 3: {
        if (validateStep3()) {
          isValid = true;
        } else {
          errorMessage = getStep3ErrorMessage();
        }
        break;
      }

      default: {
        isValid = true;
        break;
      }
    }

    if (isValid) {
      next();
    } else {
      toast.error(errorMessage);
    }
  };

  // Error message helpers
  const getStep1ErrorMessage = () => {
    if (formErrors.fullName)
      return formErrors.fullName.message || "Full name is required";
    if (formErrors.email)
      return formErrors.email.message || "Valid email is required";
    if (formErrors.phone)
      return formErrors.phone.message || "Valid phone number is required";
    if (formErrors.linkedin)
      return formErrors.linkedin.message || "Valid LinkedIn URL is required";

    const { fullName, email, phone } = watchedValues;
    if (!fullName?.trim()) return "Full name is required";
    if (!email?.trim()) return "Email is required";
    if (!phone?.trim()) return "Phone number is required";

    return "Please fill in all required fields correctly";
  };

  const getStep2ErrorMessage = () => {
    const { startDate, weeklyCommitment, trialAccepted, stipendExpectation } =
      watchedValues;

    if (!stipendExpectation?.trim()) return "Stipend expectation is required";
    if (!startDate?.trim()) return "Start date is required";
    if (!weeklyCommitment?.trim()) return "Weekly commitment is required";
    if (!trialAccepted?.trim())
      return "Please indicate if you accept the trial period";

    return "Please fill in all required fields";
  };

  const getStep3ErrorMessage = () => {
    if (!resumeAnalysis) return "Please upload and analyze your resume first";

    if (aiQuestions.length > 0) {
      const unansweredQuestions = aiQuestions.filter((q) => {
        const answer = watchedValues.responses?.[`ai_${q.id}`];
        return !answer || answer.trim() === "";
      });

      if (unansweredQuestions.length > 0) {
        return "Please answer all AI-generated questions";
      }
    }

    return "Please complete all requirements for this step";
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      reset();
      form.reset();
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSubmitSuccess = () => {
    setIsSubmitted(true);
  };

  const getCompletedSteps = () => {
    const completed = [];

    if (currentStep > 1) completed.push(1);
    if (currentStep > 2) completed.push(2);
    if (currentStep > 3) completed.push(3);
    if (isSubmitted) completed.push(4);

    return completed;
  };

  const renderStepContent = () => {
    if (isSubmitted) {
      return <SuccessScreen onClose={handleClose} />;
    }

    switch (currentStep) {
      case 1:
        return <StepPersonalInfo form={form} />;
      case 2:
        return <StepPredefinedQuestions form={form} />;
      case 3:
        return <StepUploadAndAI form={form} />;
      case 4:
        return (
          <StepCommentsAndSubmit
            form={form}
            onSubmitSuccess={handleSubmitSuccess}
          />
        );
      default:
        return <StepPersonalInfo form={form} />;
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 md:p-8"
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-7xl max-h-full bg-background rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute right-2 sm:right-4 top-2 sm:top-4 text-black border h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Content */}
        <div className="flex flex-col overflow-y-auto min-h-0">
          <div className="p-4 sm:p-6 md:p-8">
            {!isSubmitted && (
              <div className="mb-6 sm:mb-8">
                <Stepper
                  steps={steps}
                  currentStep={currentStep}
                  completedSteps={getCompletedSteps()}
                />
              </div>
            )}

            <Form {...form}>
              <form className="space-y-6 sm:space-y-8">
                {renderStepContent()}
              </form>
            </Form>

            {!isSubmitted && (
              <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 sm:pt-8 border-t border-border mt-6 sm:mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prev}
                  disabled={currentStep === 1}
                  className="flex items-center justify-center space-x-2 w-full sm:w-auto order-2 sm:order-1 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent transition-colors duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>

                {currentStep < 4 && (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isNextDisabled}
                    className="flex items-center justify-center space-x-2 w-full sm:w-auto order-1 sm:order-2 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:hover:bg-gray-300 disabled:text-gray-500 transition-colors duration-200"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
