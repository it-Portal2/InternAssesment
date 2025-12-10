import { useEffect, useRef, useState } from "react";
import { Camera, ShieldAlert, Wifi } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming you have this utility, otherwise classnames works

interface ProctoringMonitorProps {
  violationCount: number;
  maxViolations: number;
}

export default function ProctoringMonitor({
  violationCount,
  maxViolations,
}: ProctoringMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamActive, setStreamActive] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreamActive(true);
        }
      } catch (err) {
        console.error("Webcam access denied:", err);
        setStreamActive(false);
      }
    };

    startWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end space-y-2 pointer-events-none">
      {/* Video Feed Monitor */}
      <div
        className={cn(
          "relative w-48 h-32 bg-black rounded-lg overflow-hidden border-2 shadow-lg transition-colors duration-300",
          violationCount > 0 ? "border-red-500" : "border-green-500/50"
        )}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
        />

        {/* Overlays */}
        <div className="absolute top-2 left-2 flex items-center space-x-1.5 bg-black/60 px-2 py-1 rounded text-xs font-mono text-white">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span>REC</span>
        </div>

        <div className="absolute bottom-2 right-2 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded font-mono">
          ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
        </div>

        {!streamActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-500 text-xs text-center p-2">
            <Camera className="w-6 h-6 mb-1 opacity-50 block mx-auto" />
            Camera Access Required for Proctoring
          </div>
        )}
      </div>

      {/* Security Status Badge */}
      <div
        className={cn(
          "flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm backdrop-blur-sm transition-all duration-300",
          violationCount === 0
            ? "bg-green-100/90 text-green-700 border border-green-200"
            : "bg-red-100/90 text-red-700 border border-red-200 animate-pulse"
        )}
      >
        {violationCount === 0 ? (
          <>
            <Wifi className="w-3 h-3" />
            <span>Secure Connection Active</span>
          </>
        ) : (
          <>
            <ShieldAlert className="w-4 h-4" />
            <span>
              Security Violation Detected ({violationCount}/{maxViolations})
            </span>
          </>
        )}
      </div>
    </div>
  );
}
