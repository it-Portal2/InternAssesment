import { useState } from "react";
import { Camera, CheckCircle2, XCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

interface CameraPermissionCheckProps {
  onPermissionGranted: () => void;
}

export default function CameraPermissionCheck({
  onPermissionGranted,
}: CameraPermissionCheckProps) {
  const [status, setStatus] = useState<"pending" | "granted" | "denied">(
    "pending"
  );

  const requestPermission = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately, we just wanted to check permission
      // The actual monitoring component will request it again
      stream.getTracks().forEach((track) => track.stop());

      setStatus("granted");
      setTimeout(() => {
        onPermissionGranted();
      }, 1000); // Small delay to show success state
    } catch (err) {
      console.error("Camera permission error:", err);
      setStatus("denied");
    }
  };

  if (status === "granted") {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-green-200 bg-green-50 rounded-lg text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="p-3 bg-green-100 rounded-full">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-green-800">
          Security Check Passed
        </h3>
        <p className="text-green-700">
          Camera access verified. You may proceed.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
      <div className="text-center space-y-2">
        <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto">
          <Camera className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">
          Security Check Required
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          To ensure the integrity of this assessment, we require camera access.
          Please click the button below and allow camera permissions to
          continue.
        </p>
      </div>

      {status === "denied" && (
        <Alert className="border-red-200 bg-red-50 flex items-start space-x-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <strong>Access Denied.</strong> Please enable camera permissions in
            your browser settings and try again.
            <Button
              variant="link"
              className="p-0 h-auto text-red-700 underline ml-1"
              onClick={requestPermission}
            >
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <div className="bg-red-50 p-4 rounded-md text-sm text-red-800 space-y-2 border border-red-100">
        <p className="font-bold flex items-center text-red-900">
          <ShieldAlert className="w-4 h-4 mr-2" />
          STRICT MONITORING ACTIVE
        </p>
        <ul className="list-disc pl-9 space-y-1">
          <li>
            <strong>AI Surveillance System</strong> will track your eye
            movements and behavior.
          </li>
          <li>
            <strong>Zero Tolerance Policy:</strong> Any attempt to cheat will be
            instantly detected.
          </li>
          <li>
            We need to eliminate cheating to ensure fair assessment for all
            candidates.
          </li>
        </ul>
      </div>

      <div className="flex justify-center pt-2">
        <Button
          type="button" // Explicitly prevent form submission
          onClick={requestPermission}
          size="lg"
          className="w-full sm:w-auto min-w-[200px] bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-200"
        >
          Enable Camera Monitoring
        </Button>
      </div>
    </div>
  );
}
