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
const MAX_RECORDING_DURATION_MS = 25 * 60 * 1000; // 25 minutes
const DB_NAME = "InterviewRecordingDB";
const STORE_NAME = "recordings";

interface RecordingContextType {
  isRecording: boolean; // UI state - stays true even after silent stop
  recordingUrl: string | null;
  error: string | null;
  startRecording: (onScreenShareStop?: () => void) => Promise<boolean>;
  stopRecording: () => Promise<Blob | null>;
  stopAndUpload: () => Promise<string | null>;
  cleanup: () => void;
  getRecordingBlob: () => Promise<Blob | null>;
}

const RecordingContext = createContext<RecordingContextType | null>(null);

// IndexedDB helpers
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function saveToIndexedDB(blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(blob, "currentRecording");
    tx.oncomplete = () => {
      console.log("[Recording] Saved to IndexedDB:", blob.size, "bytes");
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

async function loadFromIndexedDB(): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get("currentRecording");
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

async function clearIndexedDB(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete("currentRecording");
  } catch (e) {
    console.log("[Recording] Failed to clear IndexedDB:", e);
  }
}

export function RecordingProvider({ children }: { children: ReactNode }) {
  const [isRecording, setIsRecording] = useState(false); // UI state
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const savedBlobRef = useRef<Blob | null>(null); // Saved blob after 20 min
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isActuallyRecordingRef = useRef(false); // Actual recording state

  // Silent stop - stops MediaRecorder but keeps streams active
  const silentStop = useCallback(async (): Promise<Blob | null> => {
    console.log("[Recording] Silent stop at 20 min...");

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;

      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        resolve(null);
        return;
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        console.log("[Recording] Silent stop complete, blob size:", blob.size);

        // Save to IndexedDB as backup
        await saveToIndexedDB(blob);
        savedBlobRef.current = blob;
        isActuallyRecordingRef.current = false;

        // DO NOT set isRecording = false (UI stays showing "Recording")
        // DO NOT cleanup streams (camera/screen stay active)

        chunksRef.current = [];
        mediaRecorderRef.current = null;
        resolve(blob);
      };

      mediaRecorder.stop();
    });
  }, []);

  const cleanup = useCallback(() => {
    console.log("[Recording] Cleanup called");

    // Clear timer
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

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
    savedBlobRef.current = null;
    isActuallyRecordingRef.current = false;
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(
    async (onScreenShareStop?: () => void): Promise<boolean> => {
      console.log("[Recording] Starting recording...");
      setError(null);
      chunksRef.current = [];
      savedBlobRef.current = null;

      // Clear any previous IndexedDB data
      await clearIndexedDB();

      try {
        // Get audio stream
        console.log("[Recording] Requesting audio...");
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioStreamRef.current = audioStream;
        console.log("[Recording] Audio obtained");

        // Get screen stream with reduced frame rate
        console.log("[Recording] Requesting screen...");
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "monitor",
            frameRate: { ideal: 10, max: 15 }, // Reduced for smaller file
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

        // Create recorder with REDUCED bitrate for 20 min @ 100MB
        const mediaRecorder = new MediaRecorder(combinedStream, {
          mimeType,
          videoBitsPerSecond: 600000, // 600 kbps (was 1500000)
          audioBitsPerSecond: 64000, // 64 kbps (was 128000)
        });

        mediaRecorderRef.current = mediaRecorder;
        isActuallyRecordingRef.current = true;

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
          isActuallyRecordingRef.current = false;
          setIsRecording(false);
          if (onScreenShareStop) {
            onScreenShareStop();
          }
        };

        // Set 20-minute timer for silent stop
        recordingTimerRef.current = setTimeout(() => {
          console.log("[Recording] 20 min reached, triggering silent stop");
          silentStop();
        }, MAX_RECORDING_DURATION_MS);

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
    [cleanup, silentStop],
  );

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    console.log("[Recording] Stopping recording...");

    // Clear timer if still running
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

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

  // Get recording blob - returns saved blob if exists, or stops current recording
  const getRecordingBlob = useCallback(async (): Promise<Blob | null> => {
    // First check if we have a saved blob (from 20-min silent stop)
    if (savedBlobRef.current && savedBlobRef.current.size > 0) {
      console.log("[Recording] Using saved blob from 20-min stop");
      return savedBlobRef.current;
    }

    // Check IndexedDB backup
    const indexedDBBlob = await loadFromIndexedDB();
    if (indexedDBBlob && indexedDBBlob.size > 0) {
      console.log("[Recording] Using blob from IndexedDB");
      return indexedDBBlob;
    }

    // Otherwise stop current recording
    if (isActuallyRecordingRef.current) {
      return await stopRecording();
    }

    return null;
  }, [stopRecording]);

  const uploadToCloudinary = async (blob: Blob): Promise<string | null> => {
    console.log("[Recording] Uploading to Cloudinary...");
    const MAX_RETRIES = 5;

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

        // Clear IndexedDB after successful upload
        await clearIndexedDB();

        return data.secure_url;
      } catch (err) {
        console.error(`[Recording] Upload attempt ${attempt} failed:`, err);
        if (attempt < MAX_RETRIES) {
          // Exponential backoff
          await new Promise((r) => setTimeout(r, 2000 * attempt));
        }
      }
    }

    setError("Failed to upload recording after 5 attempts");
    return null;
  };

  const stopAndUpload = useCallback(async (): Promise<string | null> => {
    console.log("[Recording] Stop and upload...");

    const blob = await getRecordingBlob();

    if (!blob || blob.size === 0) {
      console.log("[Recording] No blob to upload");
      cleanup();
      return null;
    }

    // Cleanup streams now that we have the blob
    cleanup();

    return uploadToCloudinary(blob);
  }, [getRecordingBlob, cleanup]);

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
        getRecordingBlob,
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
