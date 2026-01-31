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

export function Stepper({
  steps,
  currentStep,
  completedSteps = [],
}: StepperProps) {
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
    <div className="mb-8 w-full max-w-6xl mx-auto px-4">
      <div className="flex items-start justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const isLast = index === steps.length - 1;

          return (
            <div
              key={step.id}
              className={`flex flex-col ${isLast ? "flex-none" : "flex-1"}`}
            >
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 shrink-0 transition-colors ${
                    status === "completed"
                      ? "bg-yellow-500 border-yellow-500 text-black"
                      : status === "in-progress"
                        ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                        : "bg-white/5 backdrop-blur-md border-white/20 text-gray-500"
                  }`}
                >
                  {status === "completed" ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  ) : status === "in-progress" ? (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 rounded-full bg-yellow-500" />
                  ) : (
                    <span className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6" />
                  )}
                </div>

                {!isLast && (
                  <div className="flex-1 mx-1 sm:mx-2">
                    <div className="h-1 flex">
                      {(() => {
                        // Simplified line coloring logic
                        const nextStatus = getStepStatus(steps[index + 1]?.id);
                        const isCompleted = status === "completed";
                        const lineColor = isCompleted
                          ? "bg-yellow-500"
                          : "bg-white/5";
                        // Second half lights up if current is completed AND next is in-progress or completed
                        const secondHalfColor =
                          isCompleted &&
                          (nextStatus === "in-progress" ||
                            nextStatus === "completed")
                            ? "bg-yellow-500"
                            : "bg-white/5";
                        return (
                          <>
                            <div className={`flex-1 ${lineColor}`} />
                            <div className={`flex-1 ${secondHalfColor}`} />
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-2 sm:mt-3 pr-2">
                <div className="font-medium text-white line-clamp-2 text-[2vw] sm:text-sm uppercase">
                  {step.title}
                </div>
                <div
                  className={`text-[1.6vw] sm:text-xs ${
                    status === "completed"
                      ? "text-yellow-400"
                      : status === "in-progress"
                        ? "text-yellow-500"
                        : "text-white/50"
                  }`}
                >
                  {status === "completed"
                    ? "Completed"
                    : status === "in-progress"
                      ? "In Progress"
                      : "Pending"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
