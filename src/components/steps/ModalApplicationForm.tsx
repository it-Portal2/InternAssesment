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
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

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
  const [stepValidationErrors, setStepValidationErrors] = useState<string[]>([]);

  const form = useForm<InsertApplicationForm>({
    resolver: zodResolver(insertApplicationSchema),
    mode: "onChange",
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

  // Watch specific fields instead of all values
  const fullName = form.watch("fullName");
  const email = form.watch("email");
  const phone = form.watch("phone");
  const linkedin = form.watch("linkedin");
  const startDate = form.watch("startDate");
  const weeklyCommitment = form.watch("weeklyCommitment");
  const trialAccepted = form.watch("trialAccepted");
  const stipendExpectation = form.watch("stipendExpectation");
  const responses = form.watch("responses");

  // Get form errors once
  const { errors: formErrors } = form.formState;

  // Memoize validation functions
  const validateStep1 = useCallback((): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!fullName?.trim()) errors.push("Full name is required");
    if (!email?.trim()) errors.push("Email address is required");
    if (!phone?.trim()) errors.push("Phone number is required");

    if (formErrors.fullName) errors.push(formErrors.fullName.message || "Invalid full name");
    if (formErrors.email) errors.push(formErrors.email.message || "Invalid email format");
    if (formErrors.phone) errors.push(formErrors.phone.message || "Invalid phone number");
    if (formErrors.linkedin) errors.push(formErrors.linkedin.message || "Invalid LinkedIn URL");

    return { valid: errors.length === 0, errors };
  }, [fullName, email, phone, formErrors.fullName, formErrors.email, formErrors.phone, formErrors.linkedin]);

  const validateStep2 = useCallback((): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!startDate?.trim()) errors.push("Start date preference is required");
    if (!weeklyCommitment?.trim()) errors.push("Weekly commitment is required");
    if (!trialAccepted?.trim()) errors.push("Trial period response is required");
    if (!stipendExpectation?.trim()) errors.push("Stipend expectation is required");

    if (formErrors.startDate) errors.push(formErrors.startDate.message || "Invalid start date");
    if (formErrors.weeklyCommitment) errors.push(formErrors.weeklyCommitment.message || "Invalid weekly commitment");
    if (formErrors.trialAccepted) errors.push(formErrors.trialAccepted.message || "Invalid trial response");
    if (formErrors.stipendExpectation) errors.push(formErrors.stipendExpectation.message || "Invalid stipend expectation");

    return { valid: errors.length === 0, errors };
  }, [startDate, weeklyCommitment, trialAccepted, stipendExpectation, formErrors.startDate, formErrors.weeklyCommitment, formErrors.trialAccepted, formErrors.stipendExpectation]);

  const validateStep3 = useCallback((): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!resumeAnalysis) {
      errors.push("Please upload and analyze your resume");
      return { valid: false, errors };
    }

    if (aiQuestions.length > 0) {
      const unansweredQuestions = aiQuestions.filter((q) => {
        const answer = responses?.[`ai_${q.id}`];
        return !answer || answer.trim() === "";
      });

      if (unansweredQuestions.length > 0) {
        errors.push(`${unansweredQuestions.length} AI questions still need answers`);
      }

      // Check for answers that are too short
      const shortAnswers = aiQuestions.filter((q) => {
        const answer = responses?.[`ai_${q.id}`];
        return answer && answer.trim().length > 0 && answer.trim().length < 50;
      });

      if (shortAnswers.length > 0) {
        errors.push(`${shortAnswers.length} answers could be more detailed (aim for 50+ characters)`);
      }
    }

    return { valid: errors.length === 0, errors };
  }, [resumeAnalysis, aiQuestions, responses]);

  // Memoize step validation check
  const checkStepValidation = useCallback(() => {
    let errors: string[] = [];
    let isValid = false;

    switch (currentStep) {
      case 1: {
        const validation = validateStep1();
        isValid = validation.valid;
        errors = validation.errors;
        break;
      }
      case 2: {
        const validation = validateStep2();
        isValid = validation.valid;
        errors = validation.errors;
        break;
      }
      case 3: {
        const validation = validateStep3();
        isValid = validation.valid;
        errors = validation.errors;
        break;
      }
      default: {
        isValid = true;
        errors = [];
        break;
      }
    }

    setIsNextDisabled(!isValid);
    setStepValidationErrors(errors);
  }, [currentStep, validateStep1, validateStep2, validateStep3]);

  // Enhanced step validation with optimized dependencies
  useEffect(() => {
    checkStepValidation();
  }, [checkStepValidation]);

  // Enhanced next button handler without loading toast
  const handleNext = async () => {
    try {
      let triggerResult = true;
      let validationResult: { valid: boolean; errors: string[] } = { valid: true, errors: [] };

      switch (currentStep) {
        case 1: {
          triggerResult = await form.trigger(["fullName", "email", "phone", "linkedin"]);
          validationResult = validateStep1();
          break;
        }
        case 2: {
          triggerResult = await form.trigger([
            "startDate",
            "weeklyCommitment", 
            "trialAccepted",
            "stipendExpectation"
          ]);
          validationResult = validateStep2();
          break;
        }
        case 3: {
          validationResult = validateStep3();
          break;
        }
      }

      if (triggerResult && validationResult.valid) {
        toast.success("Step completed successfully!", {
          description: "Moving to the next step",
          duration: 2000
        });
        next();
      } else {
        const primaryError = validationResult.errors[0] || "Please complete all required fields";
        const additionalErrors = validationResult.errors.slice(1, 3); // Show max 3 more errors
        
        toast.error(`Step ${currentStep} incomplete`, {
          description: primaryError + (additionalErrors.length > 0 ? ` and ${additionalErrors.length} more issue${additionalErrors.length > 1 ? 's' : ''}` : ''),
          duration: 5000,
          action: {
            label: "View Details",
            onClick: () => {
              toast.info("Validation Details", {
                description: validationResult.errors.join(" • "),
                duration: 8000
              });
            }
          }
        });
      }
    } catch (error) {
      console.log("Error validating step:", error);
      toast.error("Validation failed", {
        description: "An error occurred while validating. Please try again.",
        duration: 4000
      });
    }
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
    const hasFormData = [fullName, email, phone, linkedin, startDate, weeklyCommitment, trialAccepted, stipendExpectation].some(value => value?.trim());
    
    if (currentStep > 1 || hasFormData) {
      toast.info("Form closed", {
        description: "Your progress has been saved. You can continue where you left off.",
        duration: 3000
      });
    }
    
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
                
                {/* Step validation feedback */}
                {stepValidationErrors.length > 0 && currentStep < 4 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 font-medium mb-1">
                      Complete the following to continue:
                    </p>
                    <ul className="text-xs text-amber-700 space-y-1">
                      {stepValidationErrors.slice(0, 3).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                      {stepValidationErrors.length > 3 && (
                        <li>• ... and {stepValidationErrors.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
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
                  onClick={() => {
                    prev();
                    toast.info("Returned to previous step", {
                      duration: 2000
                    });
                  }}
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
