import { useState, useRef, useEffect } from "react";
import {
  Camera,
  Mic,
  AlertCircle,
  Loader2,
  CheckCircle,
  Monitor,
  Globe,
  Chrome,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApplicationStore } from "@/store/useApplicationStore";
import { checkMultipleScreens } from "@/utils/screenDetection";
import {
  checkBrowserSupport,
  getRecommendedBrowsers,
} from "@/utils/browserSupport";

interface StepPermissionsProps {
  onAllPermissionsGranted: () => void;
}

type PermissionStep = "browser" | "screen" | "camera" | "audio";
type StepStatus = "pending" | "requesting" | "granted" | "denied";

interface StepState {
  browser: StepStatus;
  screen: StepStatus;
  camera: StepStatus;
  audio: StepStatus;
}

export default function StepPermissions({
  onAllPermissionsGranted,
}: StepPermissionsProps) {
  const { isAllPermissionsApproved, setIsAllPermissionsApproved } =
    useApplicationStore();

  const [stepState, setStepState] = useState<StepState>({
    browser: isAllPermissionsApproved ? "granted" : "pending", // Start as pending
    screen: isAllPermissionsApproved ? "granted" : "pending",
    camera: isAllPermissionsApproved ? "granted" : "pending",
    audio: isAllPermissionsApproved ? "granted" : "pending",
  });

  const [currentStep, setCurrentStep] = useState<PermissionStep>(
    isAllPermissionsApproved ? "audio" : "browser", // Start on browser step
  );

  const [error, setError] = useState<string | null>(null);

  const cameraStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // If we are mounting and permissions aren't approved, calculate the correct starting step
  useEffect(() => {
    if (!isAllPermissionsApproved) {
      if (stepState.browser !== "granted") setCurrentStep("browser");
      else if (stepState.screen !== "granted") setCurrentStep("screen");
      else if (stepState.camera !== "granted") setCurrentStep("camera");
      else if (stepState.audio !== "granted") setCurrentStep("audio");
    }
  }, []);

  const updateStepStatus = (step: PermissionStep, status: StepStatus) => {
    setStepState((prev) => ({ ...prev, [step]: status }));
  };

  const checkBrowser = () => {
    setError(null);
    updateStepStatus("browser", "requesting");

    const result = checkBrowserSupport();
    if (result.supported) {
      updateStepStatus("browser", "granted");
      setCurrentStep("screen");
    } else {
      updateStepStatus("browser", "denied");
      setError(result.reason || "Browser not supported for screen recording");
    }
  };

  const requestScreenCheck = async () => {
    setError(null);
    updateStepStatus("screen", "requesting");

    try {
      const hasMultiple = await checkMultipleScreens();
      if (hasMultiple) {
        updateStepStatus("screen", "denied");
        setError(
          "Multiple screens detected. Please disconnect external monitors to proceed.",
        );
      } else {
        updateStepStatus("screen", "granted");
        setCurrentStep("camera");
      }
    } catch (e) {
      console.error(e);
      // If check fails, we might warn or block. Let's assume block for safety.
      updateStepStatus("screen", "denied");
      setError("Unable to verify screen configuration. Please try again.");
    }
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
      case "browser":
        return Globe;
      case "screen":
        return Monitor;
      case "camera":
        return Camera;
      case "audio":
        return Mic;
    }
  };

  const getStepLabel = (step: PermissionStep) => {
    switch (step) {
      case "browser":
        return "Browser";
      case "screen":
        return "Screen Check";
      case "camera":
        return "Camera";
      case "audio":
        return "Microphone";
    }
  };

  const getStepDescription = (step: PermissionStep) => {
    switch (step) {
      case "browser":
        return "Your browser must support screen recording for this assessment.";
      case "screen":
        return "We need to ensure you are using a single monitor for a fair assessment.";
      case "camera":
        return "We need to verify your identity and monitor your activity during the assessment.";
      case "audio":
        return "We need to record audio to detect any unauthorized assistance or communication.";
    }
  };

  const getButtonAction = () => {
    switch (currentStep) {
      case "browser":
        return checkBrowser;
      case "screen":
        return requestScreenCheck;
      case "camera":
        return requestCamera;
      case "audio":
        return requestAudio;
    }
  };

  const isRequesting = stepState[currentStep] === "requesting";
  const allGranted =
    stepState.browser === "granted" &&
    stepState.screen === "granted" &&
    stepState.camera === "granted" &&
    stepState.audio === "granted";
  const isBrowserBlocked = stepState.browser === "denied";
  const StepIcon = getStepIcon(currentStep);
  const recommendedBrowsers = getRecommendedBrowsers();

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-yellow-400">
          Security Permissions
        </h2>
        <p className="text-white/50 text-sm">
          Grant required permissions before proceeding to the assessment
        </p>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-center space-x-2 mb-8">
          {(["browser", "screen", "camera", "audio"] as PermissionStep[]).map(
            (step, index) => {
              const Icon = getStepIcon(step);
              const status = stepState[step];

              return (
                <div key={step} className="flex items-center">
                  <div
                    className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${status === "granted" ? "bg-yellow-500 border-yellow-400" : ""}
                    ${status === "denied" ? "bg-red-600 border-red-500" : ""}
                    ${status === "pending" && currentStep === step ? "border-yellow-500 bg-yellow-600/20" : ""}
                    ${status === "pending" && currentStep !== step ? "border-white/20 bg-white/5" : ""}
                    ${status === "requesting" ? "border-yellow-500 bg-yellow-600/20" : ""}
                  `}
                  >
                    {status === "granted" ? (
                      <CheckCircle className="w-5 h-5 text-black" />
                    ) : status === "requesting" ? (
                      <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
                    ) : (
                      <Icon
                        className={`w-5 h-5 ${status === "denied" ? "text-white" : "text-gray-400"}`}
                      />
                    )}
                  </div>
                  {index < 3 && (
                    <div
                      className={`w-8 h-1 mx-1 rounded ${stepState[step] === "granted" ? "bg-yellow-500" : "bg-white/5"}`}
                    />
                  )}
                </div>
              );
            },
          )}
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
        ) : isBrowserBlocked ? (
          // Special UI for unsupported browser
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h4 className="text-xl font-semibold text-red-400">
              Browser Not Supported
            </h4>
            <p className="text-white/60 text-sm max-w-md mx-auto">{error}</p>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4 max-w-md mx-auto mt-4">
              <p className="text-white/60 text-sm mb-3 flex items-center justify-center gap-2">
                <Chrome className="w-4 h-4" />
                Please use one of these browsers:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {recommendedBrowsers.map((browser) => (
                  <div
                    key={browser}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
                  >
                    <span className="text-yellow-400 text-sm">{browser}</span>
                  </div>
                ))}
              </div>
            </div>

            <a
              href="https://www.google.com/chrome/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
            >
              <Chrome className="w-5 h-5" />
              Download Google Chrome
            </a>
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
              <p className="text-white/50 text-sm max-w-md mx-auto">
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
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 text-lg rounded-md shadow-lg shadow-yellow-500/20 mx-auto flex justify-center"
            >
              {isRequesting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  checking...
                </>
              ) : stepState[currentStep] === "denied" ? (
                `Retry ${getStepLabel(currentStep)}`
              ) : (
                `Check ${getStepLabel(currentStep)}`
              )}
            </Button>
          </>
        )}

        <p className="text-center text-xs text-white/50 mt-6">
          Screen recording permission will be requested when the assessment
          begins.
        </p>
      </div>
    </div>
  );
}
