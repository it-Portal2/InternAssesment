import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, ShieldAlert, Wifi, VideoOff, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProctoringMonitorProps {
  violationCount: number;
  maxViolations: number;
  onCameraViolation?: (reason: string) => void;
  onAudioViolation?: (reason: string) => void;
  isActive?: boolean;
}

export default function ProctoringMonitor({
  violationCount,
  maxViolations,
  onCameraViolation,
  onAudioViolation,
  isActive = true,
}: ProctoringMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const hasCameraViolation = useRef(false);
  const hasAudioViolation = useRef(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Report camera violation only once per incident
  const reportCameraViolation = useCallback(
    (reason: string) => {
      if (!hasCameraViolation.current && onCameraViolation && isActive) {
        hasCameraViolation.current = true;
        console.warn("[Proctoring] Camera violation:", reason);
        toast.error("Camera Violation", {
          description: reason,
          duration: 10000,
        });
        onCameraViolation(reason);
      }
    },
    [onCameraViolation, isActive],
  );

  // Report audio violation only once per incident
  const reportAudioViolation = useCallback(
    (reason: string) => {
      if (!hasAudioViolation.current && onAudioViolation && isActive) {
        hasAudioViolation.current = true;
        console.warn("[Proctoring] Audio violation:", reason);
        toast.error("Microphone Violation", {
          description: reason,
          duration: 10000,
        });
        onAudioViolation(reason);
      } else if (!onAudioViolation && onCameraViolation && isActive) {
        // Fallback to camera violation callback if no audio callback
        if (!hasAudioViolation.current) {
          hasAudioViolation.current = true;
          console.warn(
            "[Proctoring] Audio violation (via camera callback):",
            reason,
          );
          toast.error("Microphone Violation", {
            description: reason,
            duration: 10000,
          });
          onCameraViolation(reason);
        }
      }
    },
    [onAudioViolation, onCameraViolation, isActive],
  );

  // Start webcam with monitoring
  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      videoStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setCameraBlocked(false);
        hasCameraViolation.current = false;
      }

      // Monitor video track for changes
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        console.log("[Proctoring] Camera started, monitoring track...");

        videoTrack.onended = () => {
          console.warn("[Proctoring] Video track ended!");
          setCameraActive(false);
          setCameraBlocked(true);
          reportCameraViolation(
            "Camera was turned off or blocked. This is a violation.",
          );
        };

        videoTrack.onmute = () => {
          console.warn("[Proctoring] Video track muted!");
          setCameraActive(false);
          setCameraBlocked(true);
          reportCameraViolation(
            "Camera was muted or covered. This is a violation.",
          );
        };

        videoTrack.onunmute = () => {
          console.log("[Proctoring] Video track unmuted");
          setCameraActive(true);
          setCameraBlocked(false);
          hasCameraViolation.current = false;
        };
      }
    } catch (err) {
      console.error("[Proctoring] Webcam access denied:", err);
      setCameraActive(false);
      setCameraBlocked(true);
      reportCameraViolation(
        "Camera access denied or blocked. Please enable camera.",
      );
    }
  }, [reportCameraViolation]);

  // Start audio monitoring
  const startAudioMonitoring = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });

      audioStreamRef.current = stream;
      setAudioBlocked(false);
      hasAudioViolation.current = false;

      // Monitor audio track for changes
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        console.log("[Proctoring] Audio monitoring started...");

        audioTrack.onended = () => {
          console.warn("[Proctoring] Audio track ended!");
          setAudioBlocked(true);
          reportAudioViolation(
            "Microphone was turned off or blocked. This is a violation.",
          );
        };

        audioTrack.onmute = () => {
          console.warn("[Proctoring] Audio track muted!");
          setAudioBlocked(true);
          reportAudioViolation("Microphone was muted. This is a violation.");
        };

        audioTrack.onunmute = () => {
          console.log("[Proctoring] Audio track unmuted");
          setAudioBlocked(false);
          hasAudioViolation.current = false;
        };
      }
    } catch (err) {
      console.error("[Proctoring] Microphone access denied:", err);
      setAudioBlocked(true);
      reportAudioViolation(
        "Microphone access denied or blocked. Please enable microphone.",
      );
    }
  }, [reportAudioViolation]);

  // Restart all devices
  const restartDevices = useCallback(async () => {
    // Stop existing streams
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    await new Promise((r) => setTimeout(r, 1000));
    await startWebcam();
    await startAudioMonitoring();
  }, [startWebcam, startAudioMonitoring]);

  // Check if video feed is actually working
  const checkVideoFeed = useCallback(() => {
    if (!videoRef.current || !cameraActive) return;

    const video = videoRef.current;
    if (
      video.readyState < 2 ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      console.warn("[Proctoring] Video feed appears stalled");
      if (!cameraBlocked) {
        setCameraBlocked(true);
        reportCameraViolation("Camera feed lost. Resume camera immediately.");
      }
    }
  }, [cameraActive, cameraBlocked, reportCameraViolation]);

  // Initialize camera and audio monitoring - ONLY ONCE
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Clean up streams when becoming inactive (prevents memory leak)
    if (!isActive) {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
        videoStreamRef.current = null;
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      setCameraActive(false);
      hasInitialized.current = false;
      return;
    }

    // Prevent re-initialization (fixes camera flicker)
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    startWebcam();
    startAudioMonitoring();

    checkIntervalRef.current = setInterval(checkVideoFeed, 3000);

    return () => {
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
        videoStreamRef.current = null;
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      hasInitialized.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const anyBlocked = cameraBlocked || audioBlocked;

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col items-end space-y-2 pointer-events-none">
      {/* Video Feed Monitor */}
      <div
        className={cn(
          "relative w-72 h-56 bg-black rounded-lg overflow-hidden border-2 shadow-lg transition-colors duration-300",
          anyBlocked
            ? "border-red-500 animate-pulse"
            : violationCount > 0
              ? "border-red-500"
              : "border-green-500/50",
        )}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform scale-x-[-1]"
        />

        {/* REC + MIC Indicators */}
        <div className="absolute top-2 left-2 flex items-center space-x-2">
          {/* Camera Indicator */}
          <div className="flex items-center space-x-1.5 bg-black/60 px-2 py-1 rounded text-xs font-mono text-white">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                cameraBlocked ? "bg-red-500" : "bg-red-500 animate-pulse",
              )}
            />
            <span>{cameraBlocked ? "CAM OFF" : "REC"}</span>
          </div>

          {/* Microphone Indicator */}
          <div
            className={cn(
              "flex items-center space-x-1 bg-black/60 px-2 py-1 rounded text-xs font-mono",
              audioBlocked ? "text-red-400" : "text-green-400",
            )}
          >
            {audioBlocked ? (
              <MicOff className="w-3 h-3" />
            ) : (
              <Mic className="w-3 h-3" />
            )}
            <span>{audioBlocked ? "MIC OFF" : "MIC"}</span>
          </div>
        </div>

        {/* Camera/Audio Blocked Overlay */}
        {anyBlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90 text-white">
            {cameraBlocked && (
              <VideoOff className="w-8 h-8 mb-1 text-red-400" />
            )}
            {audioBlocked && !cameraBlocked && (
              <MicOff className="w-8 h-8 mb-1 text-red-400" />
            )}
            <p className="text-sm font-bold text-center px-4">
              {cameraBlocked && audioBlocked
                ? "Camera & Mic Blocked!"
                : cameraBlocked
                  ? "Camera Blocked!"
                  : "Microphone Blocked!"}
            </p>
            <p className="text-xs text-red-300 text-center px-4 mt-1">
              This is a violation. Enable devices now!
            </p>
            <button
              onClick={restartDevices}
              className="mt-3 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-bold rounded pointer-events-auto"
            >
              Retry Devices
            </button>
          </div>
        )}

        {/* Initial loading message */}
        {!cameraActive && !cameraBlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-gray-500 text-xs text-center p-2">
            <Camera className="w-6 h-6 mb-1 opacity-50 block mx-auto" />
            <span>Starting Camera...</span>
          </div>
        )}
      </div>

      {/* Security Status Badge */}
      <div
        className={cn(
          "flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm backdrop-blur-sm transition-all duration-300",
          anyBlocked
            ? "bg-red-100/90 text-red-700 border border-red-200 animate-pulse"
            : violationCount === 0
              ? "bg-green-100/90 text-green-700 border border-green-200"
              : "bg-red-100/90 text-red-700 border border-red-200 animate-pulse",
        )}
      >
        {anyBlocked ? (
          <>
            {cameraBlocked ? (
              <VideoOff className="w-4 h-4" />
            ) : (
              <MicOff className="w-4 h-4" />
            )}
            <span>{cameraBlocked ? "Camera" : "Mic"} Blocked - VIOLATION</span>
          </>
        ) : violationCount === 0 ? (
          <>
            <Wifi className="w-3 h-3" />
            <span>Secure Connection Active</span>
          </>
        ) : (
          <>
            <ShieldAlert className="w-4 h-4" />
            <span>
              Security Violation ({violationCount}/{maxViolations})
            </span>
          </>
        )}
      </div>
    </div>
  );
}
