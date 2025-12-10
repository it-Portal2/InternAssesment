import { AlertTriangle, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WarningModalProps {
  open: boolean;
  onClose: () => void;
  reason: string;
  isTermination?: boolean;
}

export default function WarningModal({
  open,
  onClose,
  reason,
  isTermination = false,
}: WarningModalProps) {
  if (!open) return null;

  if (isTermination) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-gray-900 p-6 flex flex-col items-center justify-center space-y-2">
            <Skull className="h-12 w-12 text-red-500" />
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">
              Assessment Terminated
            </h2>
          </div>

          <div className="p-6 text-center space-y-4">
            <div className="bg-red-100 border border-red-300 rounded-md p-3 text-red-900 font-semibold text-sm">
              REASON: {reason}
            </div>

            <p className="text-gray-700 text-sm">
              Your session has been terminated due to multiple violations of our
              assessment integrity policies. This action is final.
            </p>

            <p className="text-gray-500 text-xs">
              All progress has been revoked. This incident has been logged.
            </p>

            <Button
              onClick={onClose}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold"
            >
              Exit Assessment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-red-600 p-4 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-white" />
        </div>

        <div className="p-6 text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Proctoring Alert</h2>

          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 font-medium text-sm">
            Detected Activity: {reason}
          </div>

          <p className="text-gray-600 text-sm">
            Our AI-powered proctoring system has detected suspicious activity.
            You are required to remain focused on this assessment window at all
            times.
          </p>

          <p className="text-red-700 text-sm font-semibold">
            Further violations may result in immediate termination of your
            assessment.
          </p>

          <Button
            onClick={onClose}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            I Understand, Resume Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}
