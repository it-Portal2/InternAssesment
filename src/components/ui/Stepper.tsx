import { Check } from "lucide-react";

interface Step {
  id: number;
  title: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps?: number[];
}

export function Stepper({ steps, currentStep, completedSteps = [] }: StepperProps) {
  const getStepStatus = (stepId: number) => {
    if (completedSteps.includes(stepId)) {
      return "completed";
    }
    if (stepId === currentStep) {
      return "in-progress";
    }
    return "pending";
  };

  return (
    <div className="mb-8 ml-8 xs:ml-12 md:ml-16 lg:ml-24 w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 shrink-0 transition-colors ${
                  status === "completed"
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : status === "in-progress"
                    ? "bg-white border-blue-500 text-blue-500"
                    : "bg-sky-200 border-sky-200 text-white"
                }`}
              >
                {status === "completed" ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                ) : status === "in-progress" ? (
                  <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 rounded-full bg-blue-500" />
                ) : (
                  <span className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6" />
                )}
              </div>

              {index < steps.length - 1 && (
                <div className="flex-1 mx-1 sm:mx-2">
                  <div className="h-1 flex">
                    <div
                      className={`flex-1 ${
                        status === "completed" ? "bg-emerald-500" : "bg-sky-100"
                      }`}
                    />
                    <div
                      className={`flex-1 ${
                        status === "completed" &&
                        getStepStatus(steps[index + 1]?.id) === "in-progress"
                          ? "bg-blue-500"
                          : status === "completed" &&
                            getStepStatus(steps[index + 1]?.id) === "completed"
                          ? "bg-emerald-500"
                          : "bg-sky-100"
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-2 sm:mt-3 text-sm">
        {steps.map((step) => {
          const status = getStepStatus(step.id);

          return (
            <div key={`label-${step.id}`} className="w-full px-1">
              <div className="font-medium text-gray-800 line-clamp-2 text-[2vw] sm:text-sm uppercase">
                {step.title}
              </div>
              <div
                className={`text-[1.6vw] sm:text-xs ${
                  status === "completed"
                    ? "text-emerald-500"
                    : status === "in-progress"
                    ? "text-blue-500"
                    : "text-gray-400"
                }`}
              >
                {status === "completed"
                  ? "Completed"
                  : status === "in-progress"
                  ? "In Progress"
                  : "Pending"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
