import { AlertTriangle, XCircle, Video } from "lucide-react";
import { useApplicationStore } from "@/store/useApplicationStore";
import { cn } from "@/lib/utils";

export default function StepProctoringRules() {
  const { rulesAccepted, setRulesAccepted } = useApplicationStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-yellow-400">
          Proctoring Rules & Guidelines
        </h2>
        <p className="text-white/60 text-sm mt-1">
          Please read and agree to the following rules before starting your
          assessment
        </p>
      </div>

      {/* Rules Content */}
      <div className="space-y-6">
        {/* Critical Rules */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="h-5 w-5 text-red-400" />
            <h3 className="text-red-400 font-semibold text-base">
              Instant Termination
            </h3>
          </div>
          <ul className="space-y-2 ml-1">
            <li className="flex items-start gap-3 text-white/80 text-sm">
              <span className="text-red-400 mt-0.5">•</span>
              <span>
                Do NOT stop screen sharing. Your exam will end immediately if
                you stop sharing your screen.
              </span>
            </li>
          </ul>
        </div>

        {/* Warning Rules */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <h3 className="text-yellow-400 font-semibold text-base">
              Warning Actions{" "}
              <span className="text-white/50 font-normal text-sm">
                (3 warnings = termination)
              </span>
            </h3>
          </div>
          <ul className="space-y-2.5 ml-1">
            <li className="flex items-start gap-3 text-white/80 text-sm">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span>
                Keep your camera ON. Do not block, cover, or turn off your
                camera.
              </span>
            </li>
            <li className="flex items-start gap-3 text-white/80 text-sm">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span>
                Keep your microphone ON. Do not mute or block your microphone.
              </span>
            </li>
            <li className="flex items-start gap-3 text-white/80 text-sm">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span>
                No third person visible. Only you should be visible in the
                camera frame.
              </span>
            </li>
            <li className="flex items-start gap-3 text-white/80 text-sm">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span>
                Stay focused on the screen. Do not look away from the screen for
                extended periods.
              </span>
            </li>
            <li className="flex items-start gap-3 text-white/80 text-sm">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span>
                No secondary devices. Do not use phones, tablets, or other
                devices during the exam.
              </span>
            </li>
            <li className="flex items-start gap-3 text-white/80 text-sm">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span>Do not repeat questions.</span>{" "}
            </li>
            <li className="flex items-start gap-3 text-white/80 text-sm">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span>
                Stay on this tab. Do not switch to other tabs or applications.
              </span>
            </li>
            <li className="flex items-start gap-3 text-white/80 text-sm">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span>
                Stay in fullscreen mode. Do not exit fullscreen during the
                assessment.
              </span>
            </li>
            <li className="flex items-start gap-3 text-white/80 text-sm">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span>
                Use a single monitor only. Disconnect any additional monitors
                before starting.
              </span>
            </li>
            <li className="flex items-start gap-3 text-white/80 text-sm">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span>
                Do not open developer tools (F12) or use inspect element.
              </span>
            </li>
          </ul>
        </div>

        {/* What's Being Recorded */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Video className="h-5 w-5 text-blue-400" />
            <h3 className="text-blue-400 font-semibold text-base">
              What We're Recording
            </h3>
          </div>
          <ul className="space-y-2 ml-1">
            <li className="flex items-start gap-3 text-white/80 text-sm">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>
                Your screen activity will be recorded throughout the assessment.
              </span>
            </li>
            <li className="flex items-start gap-3 text-white/80 text-sm">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>
                Your camera feed is monitored and suspicious activity may lead
                to disqualification.
              </span>
            </li>
            <li className="flex items-start gap-3 text-white/80 text-sm">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>
                Your microphone audio is being recorded for review purposes.
              </span>
            </li>
          </ul>
        </div>

        {/* Agreement Checkbox */}
        <label
          className={cn(
            "flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200",
            rulesAccepted
              ? "bg-green-500/10 border-2 border-green-500/50"
              : "bg-white/5 border-2 border-white/10 hover:border-white/20",
          )}
        >
          <input
            type="checkbox"
            checked={rulesAccepted}
            onChange={(e) => setRulesAccepted(e.target.checked)}
            className="sr-only"
          />
          <div
            className={cn(
              "w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
              rulesAccepted
                ? "bg-green-500 border-green-500"
                : "border-white/30 bg-transparent",
            )}
          >
            {rulesAccepted && (
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <span className="text-white/80 text-sm leading-relaxed">
            I have read and understood the proctoring rules. I agree to follow
            these guidelines and understand that violations may result in
            termination of my assessment.
          </span>
        </label>
      </div>
    </div>
  );
}
