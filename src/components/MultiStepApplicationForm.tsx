import { PersonalInfoStep } from "@/components/steps/personal-info-step";
import { PredefinedQuestionsStep } from "@/components/steps/predefined-questions-step";
import { ResumeUploadStep } from "@/components/steps/resume-upload-step";
import { FinalStep } from "@/components/steps/final-step";
import { useApplicationStore } from "@/store/useApplicationStore";
import { StepIndicator } from "./ui/Stepper";

const steps = ["Personal Info", "Questions", "Resume Upload", "Submit"];

interface MultiStepApplicationFormProps {
  onSubmitted?: (applicationId: string) => void;
}

export function MultiStepApplicationForm({
  onSubmitted,
}: MultiStepApplicationFormProps) {
  const { currentStep, completedSteps, setCurrentStep } = useApplicationStore();

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // TODO: Handle successful submission
    // onSubmitted?.('application-id-123');
    console.log("Application submitted successfully!");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep onNext={handleNext} />;
      case 2:
        return (
          <PredefinedQuestionsStep
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <ResumeUploadStep onNext={handleNext} onPrevious={handlePrevious} />
        );
      case 4:
        return (
          <FinalStep onPrevious={handlePrevious} onSubmit={handleSubmit} />
        );
      default:
        return <PersonalInfoStep onNext={handleNext} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Internship Application
          </h1>
          <p className="text-xl text-gray-600">
            Join our innovative team and shape the future
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
        />

        {/* Step Content */}
        <div className="mt-8">{renderStep()}</div>
      </div>
    </div>
  );
}
