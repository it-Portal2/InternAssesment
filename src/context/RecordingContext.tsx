import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";

const CLOUDINARY_CLOUD_NAME = "duusiq4ws";
const CLOUDINARY_UPLOAD_PRESET = "InternAssesment";

interface RecordingContextType {
  isRecording: boolean;
  recordingUrl: string | null;
  error: string | null;
  startRecording: (onScreenShareStop?: () => void) => Promise<boolean>;
  stopRecording: () => Promise<Blob | null>;
  stopAndUpload: () => Promise<string | null>;
  cleanup: () => void;
}

const RecordingContext = createContext<RecordingContextType | null>(null);

export function RecordingProvider({ children }: { children: ReactNode }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    console.log("[Recording] Cleanup called");

    // Stop all tracks
    screenStreamRef.current?.getTracks().forEach((track) => {
      console.log("[Recording] Stopping track:", track.kind);
      track.stop();
    });
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());

    // Reset recorder
    if (mediaRecorderRef.current?.state !== "inactive") {
      try {
        mediaRecorderRef.current?.stop();
      } catch (e) {
        console.log("[Recording] Recorder already stopped");
      }
    }

    screenStreamRef.current = null;
    audioStreamRef.current = null;
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(
    async (onScreenShareStop?: () => void): Promise<boolean> => {
      console.log("[Recording] Starting recording...");
      setError(null);
      chunksRef.current = [];

      try {
        // Get audio stream
        console.log("[Recording] Requesting audio...");
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioStreamRef.current = audioStream;
        console.log("[Recording] Audio obtained");

        // Get screen stream
        console.log("[Recording] Requesting screen...");
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "monitor",
            frameRate: { ideal: 15, max: 30 },
          },
          audio: true,
        });
        screenStreamRef.current = screenStream;
        console.log("[Recording] Screen obtained");

        // Combine streams
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

        // Select codec
        const mimeType = [
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
        ].find((type) => MediaRecorder.isTypeSupported(type));

        console.log("[Recording] Using codec:", mimeType);

        // Create recorder
        const mediaRecorder = new MediaRecorder(combinedStream, {
          mimeType,
          videoBitsPerSecond: 1500000,
          audioBitsPerSecond: 128000,
        });

        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
            console.log(
              "[Recording] Chunk received:",
              event.data.size,
              "bytes",
            );
          }
        };

        mediaRecorder.onerror = (event) => {
          console.error("[Recording] Error:", event);
          setError("Recording error occurred");
        };

        // Handle user stopping screen share - VIOLATION
        screenStream.getVideoTracks()[0].onended = () => {
          console.log("[Recording] Screen share ended by user - VIOLATION");
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
          }
          setIsRecording(false);
          // Notify via callback if provided
          if (onScreenShareStop) {
            onScreenShareStop();
          }
        };

        // Start with chunks every 5 seconds
        mediaRecorder.start(5000);
        setIsRecording(true);
        console.log("[Recording] Started successfully");

        return true;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to start recording";
        console.error("[Recording] Start failed:", msg);
        setError(msg);
        cleanup();
        return false;
      }
    },
    [cleanup],
  );

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    console.log("[Recording] Stopping recording...");

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;

      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        console.log("[Recording] No active recorder");
        cleanup();
        resolve(null);
        return;
      }

      mediaRecorder.onstop = () => {
        console.log("[Recording] Stopped, chunks:", chunksRef.current.length);
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        console.log("[Recording] Blob size:", blob.size, "bytes");
        cleanup();
        resolve(blob);
      };

      mediaRecorder.stop();
    });
  }, [cleanup]);

  const uploadToCloudinary = async (blob: Blob): Promise<string | null> => {
    console.log("[Recording] Uploading to Cloudinary...");
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const formData = new FormData();
        formData.append("file", blob);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formData.append("resource_type", "video");

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
          { method: "POST", body: formData },
        );

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }

        const data = await response.json();
        console.log("[Recording] Upload success:", data.secure_url);
        setRecordingUrl(data.secure_url);
        return data.secure_url;
      } catch (err) {
        console.error(`[Recording] Upload attempt ${attempt} failed:`, err);
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }

    setError("Failed to upload recording");
    return null;
  };

  const stopAndUpload = useCallback(async (): Promise<string | null> => {
    console.log("[Recording] Stop and upload...");
    const blob = await stopRecording();
    if (!blob || blob.size === 0) {
      console.log("[Recording] No blob to upload");
      return null;
    }
    return uploadToCloudinary(blob);
  }, [stopRecording]);

  return (
    <RecordingContext.Provider
      value={{
        isRecording,
        recordingUrl,
        error,
        startRecording,
        stopRecording,
        stopAndUpload,
        cleanup,
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
}

export function useRecording() {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error("useRecording must be used within RecordingProvider");
  }
  return context;
}
