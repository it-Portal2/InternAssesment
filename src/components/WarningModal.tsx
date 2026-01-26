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
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div
          className="backdrop-blur-xl border border-red-500/30 rounded-2xl shadow-2xl shadow-red-500/20 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
        >
          <div
            className="border-b border-red-500/30 p-6 flex flex-col items-center justify-center space-y-2"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.15)" }}
          >
            <Skull className="h-12 w-12 text-red-500" />
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">
              Assessment Terminated
            </h2>
          </div>

          <div className="p-6 text-center space-y-4">
            <div
              className="border border-red-500/30 rounded-lg p-3 text-red-400 font-semibold text-sm"
              style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
            >
              REASON: {reason}
            </div>

            <p className="text-white/70 text-sm">
              Your session has been terminated due to multiple violations of our
              assessment integrity policies. This action is final.
            </p>

            <p className="text-white/50 text-xs">
              All progress has been revoked. This incident has been logged.
            </p>

            <Button
              onClick={onClose}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold"
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
      <div
        className="backdrop-blur-xl border border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/20 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
      >
        <div
          className="border-b border-yellow-500/30 p-6 flex flex-col items-center justify-center space-y-2"
          style={{ backgroundColor: "rgba(234, 179, 8, 0.15)" }}
        >
          <AlertTriangle className="h-12 w-12 text-yellow-500" />
          <h2 className="text-2xl font-bold text-white">Proctoring Alert</h2>
        </div>

        <div className="p-6 text-center space-y-4">
          <div
            className="border border-yellow-500/30 rounded-lg p-3 text-yellow-400 font-medium text-sm"
            style={{ backgroundColor: "rgba(234, 179, 8, 0.1)" }}
          >
            Detected Activity: {reason}
          </div>

          <p className="text-white/70 text-sm">
            Our AI-powered proctoring system has detected suspicious activity.
            You are required to remain focused on this assessment window at all
            times.
          </p>

          <p className="text-red-400 text-sm font-semibold">
            Further violations may result in immediate termination of your
            assessment.
          </p>

          <Button
            onClick={onClose}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
          >
            I Understand, Resume Assessment
          </Button>
        </div>
      </div>
    </div>
  );
}
