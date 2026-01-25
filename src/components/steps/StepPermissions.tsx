import { useState, useRef } from "react";
import {
  ShieldCheck,
  Camera,
  Mic,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApplicationStore } from "@/store/useApplicationStore";

interface StepPermissionsProps {
  onAllPermissionsGranted: () => void;
}

type PermissionStep = "camera" | "audio";
type StepStatus = "pending" | "requesting" | "granted" | "denied";

interface StepState {
  camera: StepStatus;
  audio: StepStatus;
}

export default function StepPermissions({
  onAllPermissionsGranted,
}: StepPermissionsProps) {
  const { isAllPermissionsApproved, setIsAllPermissionsApproved } =
    useApplicationStore();

  const [stepState, setStepState] = useState<StepState>({
    camera: isAllPermissionsApproved ? "granted" : "pending",
    audio: isAllPermissionsApproved ? "granted" : "pending",
  });
  const [currentStep, setCurrentStep] = useState<PermissionStep>(
    isAllPermissionsApproved ? "audio" : "camera",
  );
  const [error, setError] = useState<string | null>(null);

  const cameraStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const updateStepStatus = (step: PermissionStep, status: StepStatus) => {
    setStepState((prev) => ({ ...prev, [step]: status }));
  };

  const requestCamera = async () => {
    setError(null);
    updateStepStatus("camera", "requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraStreamRef.current = stream;
      updateStepStatus("camera", "granted");
      setCurrentStep("audio");
    } catch {
      updateStepStatus("camera", "denied");
      setError(
        "Camera access is required. Please allow camera permission and try again.",
      );
    }
  };

  const requestAudio = async () => {
    setError(null);
    updateStepStatus("audio", "requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      updateStepStatus("audio", "granted");
      setIsAllPermissionsApproved(true);
      onAllPermissionsGranted();
    } catch {
      updateStepStatus("audio", "denied");
      setError(
        "Microphone access is required. Please allow microphone permission and try again.",
      );
    }
  };

  const getStepIcon = (step: PermissionStep) => {
    switch (step) {
      case "camera":
        return Camera;
      case "audio":
        return Mic;
    }
  };

  const getStepLabel = (step: PermissionStep) => {
    switch (step) {
      case "camera":
        return "Camera";
      case "audio":
        return "Microphone";
    }
  };

  const getStepDescription = (step: PermissionStep) => {
    switch (step) {
      case "camera":
        return "We need to verify your identity and monitor your activity during the assessment.";
      case "audio":
        return "We need to record audio to detect any unauthorized assistance or communication.";
    }
  };

  const getButtonAction = () => {
    switch (currentStep) {
      case "camera":
        return requestCamera;
      case "audio":
        return requestAudio;
    }
  };

  const isRequesting = stepState[currentStep] === "requesting";
  const allGranted =
    stepState.camera === "granted" && stepState.audio === "granted";
  const StepIcon = getStepIcon(currentStep);

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Security Permissions
        </h2>
        <p className="text-gray-400">
          Grant required permissions before proceeding to the assessment
        </p>
      </div>

      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-8 border border-white/10 shadow-xl shadow-yellow-500/5">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Security Verification Required
            </h3>
            <p className="text-gray-400 text-sm">
              Camera and microphone access are mandatory
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-2 mb-8">
          {(["camera", "audio"] as PermissionStep[]).map((step, index) => {
            const Icon = getStepIcon(step);
            const status = stepState[step];

            return (
              <div key={step} className="flex items-center">
                <div
                  className={`
                    w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${status === "granted" ? "bg-yellow-500 border-yellow-400" : ""}
                    ${status === "denied" ? "bg-red-600 border-red-500" : ""}
                    ${status === "pending" && currentStep === step ? "border-yellow-500 bg-yellow-600/20" : ""}
                    ${status === "pending" && currentStep !== step ? "border-gray-600 bg-gray-800" : ""}
                    ${status === "requesting" ? "border-yellow-500 bg-yellow-600/20" : ""}
                  `}
                >
                  {status === "granted" ? (
                    <CheckCircle className="w-6 h-6 text-black" />
                  ) : status === "requesting" ? (
                    <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
                  ) : (
                    <Icon
                      className={`w-6 h-6 ${status === "denied" ? "text-white" : "text-gray-400"}`}
                    />
                  )}
                </div>
                {index < 1 && (
                  <div
                    className={`w-12 h-1 mx-1 rounded ${stepState[step] === "granted" ? "bg-yellow-500" : "bg-gray-600"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {allGranted ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-yellow-400" />
            </div>
            <h4 className="text-xl font-semibold text-yellow-400 mb-2">
              Permissions Granted
            </h4>
            <p className="text-gray-400">
              Click Next to proceed. Screen recording will start when you begin
              the assessment.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center space-y-3 mb-6">
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
                <StepIcon className="w-8 h-8 text-yellow-400" />
              </div>
              <h4 className="text-xl font-semibold text-white">
                {getStepLabel(currentStep)} Permission
              </h4>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                {getStepDescription(currentStep)}
              </p>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 flex items-start space-x-3 mb-6">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                getButtonAction()();
              }}
              disabled={isRequesting}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 text-lg rounded-lg shadow-lg shadow-yellow-500/20"
            >
              {isRequesting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Requesting Permission...
                </>
              ) : stepState[currentStep] === "denied" ? (
                `Retry ${getStepLabel(currentStep)} Permission`
              ) : (
                `Allow ${getStepLabel(currentStep)} Access`
              )}
            </Button>
          </>
        )}

        <p className="text-center text-xs text-gray-500 mt-6">
          🔒 Screen recording permission will be requested when the assessment
          begins.
        </p>
      </div>
    </div>
  );
}
