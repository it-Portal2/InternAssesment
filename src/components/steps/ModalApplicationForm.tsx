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
import StepPermissions from "./StepPermissions";
import StepUploadAndAI from "./StepUploadAndAI";
import StepCommentsAndSubmit from "./StepCommentsAndSubmit";
import { Stepper } from "../ui/Stepper";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ModalApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  { id: 1, title: "Personal Info" },
  { id: 2, title: "Questions" },
  { id: 3, title: "Permissions" },
  { id: 4, title: "Resume" },
  { id: 5, title: "Submit" },
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
  } = useApplicationStore();

  const [isNextDisabled, setIsNextDisabled] = useState(true);

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

  const watchedValues = form.watch();
  const formErrors = form.formState.errors;

  useEffect(() => {
    const checkStepValidation = () => {
      switch (currentStep) {
        case 1:
          setIsNextDisabled(!validateStep1());
          break;
        case 2:
          setIsNextDisabled(!validateStep2());
          break;
        case 3:
          setIsNextDisabled(!validateStep3());
          break;
        case 4:
          setIsNextDisabled(!validateStep4());
          break;
        default:
          setIsNextDisabled(false);
          break;
      }
    };
    checkStepValidation();
  }, [watchedValues, currentStep, resumeAnalysis, aiQuestions, formErrors]);

  const validateStep1 = () => {
    const { fullName, email, phone } = watchedValues;
    if (!fullName?.trim() || !email?.trim() || !phone?.trim()) return false;
    if (formErrors.fullName || formErrors.email || formErrors.phone)
      return false;
    return true;
  };

  const validateStep2 = () => {
    const { startDate, weeklyCommitment, trialAccepted, stipendExpectation } =
      watchedValues;
    if (
      !startDate?.trim() ||
      !weeklyCommitment?.trim() ||
      !trialAccepted?.trim() ||
      !stipendExpectation?.trim()
    )
      return false;
    if (
      formErrors.startDate ||
      formErrors.weeklyCommitment ||
      formErrors.trialAccepted ||
      formErrors.stipendExpectation
    )
      return false;
    return true;
  };

  const validateStep3 = () => {
    const { isAllPermissionsApproved } = useApplicationStore.getState();
    return isAllPermissionsApproved;
  };

  const validateStep4 = () => {
    if (!resumeAnalysis) return false;
    if (aiQuestions.length > 0) {
      return aiQuestions.every((q) => {
        const answer = watchedValues.responses?.[`ai_${q.id}`];
        return answer && answer.trim() !== "";
      });
    }
    return true;
  };

  const handleNext = async () => {
    let isValid = false;
    let errorMessage = "";

    switch (currentStep) {
      case 1: {
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
          errorMessage = "Please grant all required permissions";
        }
        break;
      }
      case 4: {
        if (validateStep4()) {
          isValid = true;
        } else {
          errorMessage = getStep4ErrorMessage();
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

  const getStep4ErrorMessage = () => {
    if (!resumeAnalysis) return "Please upload and analyze your resume first";
    if (aiQuestions.length > 0) {
      const unansweredQuestions = aiQuestions.filter((q) => {
        const answer = watchedValues.responses?.[`ai_${q.id}`];
        return !answer || answer.trim() === "";
      });
      if (unansweredQuestions.length > 0)
        return "Please answer all AI-generated questions";
    }
    return "Please complete all requirements for this step";
  };

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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) handleClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const handleSubmitSuccess = () => {
    setIsSubmitted(true);
  };

  const getCompletedSteps = () => {
    const completed = [];
    if (currentStep > 1) completed.push(1);
    if (currentStep > 2) completed.push(2);
    if (currentStep > 3) completed.push(3);
    if (currentStep > 4) completed.push(4);
    if (isSubmitted) completed.push(5);
    return completed;
  };

  const renderStepContent = () => {
    if (isSubmitted) return <SuccessScreen onClose={handleClose} />;
    switch (currentStep) {
      case 1:
        return <StepPersonalInfo form={form} />;
      case 2:
        return <StepPredefinedQuestions form={form} />;
      case 3:
        return <StepPermissions onAllPermissionsGranted={() => next()} />;
      case 4:
        return <StepUploadAndAI form={form} />;
      case 5:
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

  useEffect(() => {
    const { applicationData } = useApplicationStore.getState();
    if (applicationData) {
      form.reset({
        fullName: applicationData.fullName || "",
        email: applicationData.email || "",
        phone: applicationData.phone || "",
        linkedin: applicationData.linkedin || "",
        stipendExpectation: applicationData.stipendExpectation || "",
        startDate: applicationData.startDate || "",
        weeklyCommitment: applicationData.weeklyCommitment || "10-15",
        trialAccepted: applicationData.trialAccepted || "yes",
        additionalComments: applicationData.additionalComments || "",
        responses: applicationData.responses || {},
        resumeAnalysis: resumeAnalysis || {
          skills: [],
          experience: "",
          education: "",
          summary: "",
        },
        aiQuestions: aiQuestions || [],
      });
    }
  }, [form, resumeAnalysis, aiQuestions]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 md:p-8"
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-7xl max-h-full bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl shadow-yellow-500/20 flex flex-col overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(20,20,20,0.95) 50%, rgba(0,0,0,0.9) 100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute right-3 sm:right-4 top-3 sm:top-4 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10 h-8 w-8 z-10"
        >
          <X className="h-4 w-4" />
        </Button>

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
              <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 sm:pt-8 border-t border-white/10 mt-6 sm:mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prev}
                  disabled={currentStep === 1}
                  className="flex items-center justify-center space-x-2 w-full sm:w-auto order-2 sm:order-1 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500 disabled:border-gray-700 disabled:text-gray-600 disabled:hover:bg-transparent transition-colors duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>

                {currentStep < 5 && (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isNextDisabled}
                    className="flex items-center justify-center space-x-2 w-full sm:w-auto order-1 sm:order-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold disabled:bg-gray-700 disabled:text-gray-500 disabled:hover:bg-gray-700 transition-colors duration-200 shadow-lg shadow-yellow-500/20"
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
