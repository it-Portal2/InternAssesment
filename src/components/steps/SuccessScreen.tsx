import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stepper } from "../ui/Stepper";

interface SuccessScreenProps {
  onClose: () => void;
}

const steps = [
  { id: 1, title: "Personal Info" },
  { id: 2, title: "Questions" },
  { id: 3, title: "Resume & AI" },
  { id: 4, title: "Submit" },
];

export default function SuccessScreen({ onClose }: SuccessScreenProps) {
  return (
    <div className="space-y-8">
      <div className="px-6">
        <Stepper steps={steps} currentStep={4} completedSteps={[1, 2, 3, 4]} />
      </div>

      <div className="text-center py-12">
        <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/20">
          <CheckCircle2 className="h-12 w-12 text-yellow-400" />
        </div>

        <h2 className="text-3xl font-bold text-white mb-4">
          We've received your application!
        </h2>

        <p className="text-lg text-gray-400 mb-8 max-w-md mx-auto">
          We will process it and reach out to you in a few days.
        </p>

        <Button
          onClick={onClose}
          size="lg"
          className="px-8 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold shadow-lg shadow-yellow-500/20"
        >
          Close
        </Button>
      </div>
    </div>
  );
}
