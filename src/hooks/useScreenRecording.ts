import { useState, useRef, useCallback } from "react";

const CLOUDINARY_CLOUD_NAME = "duusiq4ws";
const CLOUDINARY_UPLOAD_PRESET = "InternAssesment";

interface UseScreenRecordingReturn {
  isRecording: boolean;
  error: string | null;
  startRecording: (audioStream: MediaStream) => Promise<boolean>;
  stopRecording: () => Promise<Blob | null>;
  uploadToCloudinary: (blob: Blob) => Promise<string | null>;
}

export const useScreenRecording = (): UseScreenRecordingReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const combinedStreamRef = useRef<MediaStream | null>(null);

  // Check browser support
  const checkSupport = useCallback((): boolean => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError("Screen recording is not supported in this browser");
      return false;
    }

    // Check for VP9 support, fallback to VP8
    const mimeTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];

    const supported = mimeTypes.find((type) =>
      MediaRecorder.isTypeSupported(type),
    );

    if (!supported) {
      setError("No supported video format found");
      return false;
    }

    return true;
  }, []);

  // Start recording
  const startRecording = useCallback(
    async (audioStream: MediaStream): Promise<boolean> => {
      setError(null);
      chunksRef.current = [];

      if (!checkSupport()) {
        return false;
      }

      try {
        // Get screen stream
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "monitor",
            frameRate: { ideal: 15, max: 30 },
          },
          audio: true, // Try to capture system audio
        });

        screenStreamRef.current = screenStream;

        // Combine screen video with microphone audio
        const tracks: MediaStreamTrack[] = [
          ...screenStream.getVideoTracks(),
          ...audioStream.getAudioTracks(),
        ];

        // Add system audio if available
        const systemAudioTracks = screenStream.getAudioTracks();
        if (systemAudioTracks.length > 0) {
          tracks.push(...systemAudioTracks);
        }

        const combinedStream = new MediaStream(tracks);
        combinedStreamRef.current = combinedStream;

        // Select best available codec
        const mimeType = [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
        ].find((type) => MediaRecorder.isTypeSupported(type));

        // Create MediaRecorder with optimized settings
        const mediaRecorder = new MediaRecorder(combinedStream, {
          mimeType,
          videoBitsPerSecond: 1500000, // 1.5 Mbps
          audioBitsPerSecond: 128000, // 128 kbps
        });

        mediaRecorderRef.current = mediaRecorder;

        // Collect chunks with timeSlice for memory management
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onerror = (event) => {
          console.error("MediaRecorder error:", event);
          setError("Recording error occurred");
        };

        // Handle screen share stop (user clicks "Stop sharing")
        screenStream.getVideoTracks()[0].onended = () => {
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
          }
          setIsRecording(false);
        };

        // Start recording with 5 second chunks
        mediaRecorder.start(5000);
        setIsRecording(true);

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to start recording";
        setError(errorMessage);
        console.error("Recording start error:", err);
        return false;
      }
    },
    [checkSupport],
  );

  // Stop recording
  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;

      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        resolve(null);
        return;
      }

      mediaRecorder.onstop = () => {
        // Combine all chunks into final blob
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        chunksRef.current = [];

        // Cleanup streams
        screenStreamRef.current?.getTracks().forEach((track) => track.stop());
        combinedStreamRef.current?.getTracks().forEach((track) => track.stop());

        screenStreamRef.current = null;
        combinedStreamRef.current = null;
        mediaRecorderRef.current = null;

        setIsRecording(false);
        resolve(blob);
      };

      mediaRecorder.stop();
    });
  }, []);

  // Upload to Cloudinary with retry logic
  const uploadToCloudinary = useCallback(
    async (blob: Blob): Promise<string | null> => {
      const MAX_RETRIES = 3;
      const RETRY_DELAY = 2000; // 2 seconds

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const formData = new FormData();
          formData.append("file", blob);
          formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
          formData.append("resource_type", "video");

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
            {
              method: "POST",
              body: formData,
            },
          );

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
          }

          const data = await response.json();
          return data.secure_url;
        } catch (err) {
          console.error(`Upload attempt ${attempt} failed:`, err);

          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY));
          }
        }
      }

      setError("Failed to upload recording after 3 attempts");
      return null;
    },
    [],
  );

  return {
    isRecording,
    error,
    startRecording,
    stopRecording,
    uploadToCloudinary,
  };
};
