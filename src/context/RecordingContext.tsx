import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect, // Added useEffect
  type ReactNode,
} from "react";

const CLOUDINARY_CLOUD_NAME = "duusiq4ws";
const CLOUDINARY_UPLOAD_PRESET = "InternAssesment";
const MAX_RECORDING_DURATION_MS = 25 * 60 * 1000; // 25 minutes
const UPLOAD_TIMEOUT_MS = 2 * 60 * 1000; // 2 minute upload timeout
const MIN_BLOB_SIZE = 10000; // 10KB minimum
const DB_NAME = "InterviewRecordingDB";
const STORE_NAME = "recordings";

interface RecordingContextType {
  isRecording: boolean; // UI state - stays true even after silent stop
  recordingUrl: string | null;
  webcamUrl: string | null; // Dedicated face-only recording URL
  getWebcamUrl: () => string | null; // Always-current ref read (avoids stale closure)
  error: string | null;
  uploadProgress: number; // 0-100
  isUploading: boolean;
  startRecording: (onScreenShareStop?: () => void) => Promise<boolean>;
  stopRecording: () => Promise<Blob | null>;
  stopAndUpload: () => Promise<string | null>;
  cleanup: () => void;
  getRecordingBlob: () => Promise<Blob | null>;
  retryUpload: () => Promise<string | null>; // New: retry failed upload
  downloadRecordingLocally: () => Promise<boolean>; // Download video to user's device
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
  try {
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
  } catch (e) {
    console.error("[Recording] Failed to save to IndexedDB:", e);
    // Don't throw - savedBlobRef will still work as backup
  }
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
  const [webcamUrl, setWebcamUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const webcamRecorderRef = useRef<MediaRecorder | null>(null);
  const webcamChunksRef = useRef<Blob[]>([]);
  const webcamSavedBlobRef = useRef<Blob | null>(null);
  const webcamUrlRef = useRef<string | null>(null); // Ref for always-current access in closures
  const savedBlobRef = useRef<Blob | null>(null); // Saved blob after 25 min
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isActuallyRecordingRef = useRef(false); // Actual recording state
  const isUploadingRef = useRef(false); // Prevent race condition
  const lastBlobRef = useRef<Blob | null>(null); // For retry functionality

  // Silent stop - stops MediaRecorder but keeps streams active
  const silentStop = useCallback(async (): Promise<Blob | null> => {
    console.log("[Recording] Silent stop at 25 min...");

    // Also silently stop webcam recorder and save its blob
    if (webcamRecorderRef.current?.state === "recording") {
      webcamRecorderRef.current.onstop = () => {
        webcamSavedBlobRef.current = new Blob(webcamChunksRef.current, {
          type: "video/webm",
        });
        webcamChunksRef.current = [];
        webcamRecorderRef.current = null;
        console.log("[Recording] Webcam silent stop complete");
      };
      webcamRecorderRef.current.stop();
    }

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
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        console.log("[Recording] Stopping track:", track.kind);
        track.stop();
      });
      screenStreamRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }

    // Reset screen recorder
    if (mediaRecorderRef.current?.state !== "inactive") {
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        console.log("[Recording] Recorder already stopped");
      }
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];

    // Reset webcam recorder
    if (webcamRecorderRef.current?.state !== "inactive") {
      try {
        webcamRecorderRef.current?.stop();
      } catch {
        console.log("[Recording] Webcam recorder already stopped");
      }
    }
    webcamRecorderRef.current = null;
    webcamChunksRef.current = [];

    savedBlobRef.current = null;
    isActuallyRecordingRef.current = false;
    setIsRecording(false);
  }, []);

  // Cleanup on unmount - MUST be defined AFTER cleanup fn
  useEffect(() => {
    return () => {
      console.log("[Recording] Provider unmounting, running cleanup");
      cleanup();
    };
  }, [cleanup]);

  const startRecording = useCallback(
    async (onScreenShareStop?: () => void): Promise<boolean> => {
      // Prevent multiple starts
      if (isActuallyRecordingRef.current) {
        console.log("[Recording] Alredy recording, ignoring start request");
        return true;
      }

      console.log("[Recording] Starting recording...");
      setError(null);
      chunksRef.current = [];
      savedBlobRef.current = null;
      setUploadProgress(0);

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

        // C6: Reject window/tab shares — candidate must share their entire screen
        const displaySurface = (
          screenStream.getVideoTracks()[0]?.getSettings() as MediaTrackSettings & { displaySurface?: string }
        )?.displaySurface;
        if (displaySurface && displaySurface !== "monitor") {
          screenStream.getTracks().forEach((t) => t.stop());
          audioStream.getTracks().forEach((t) => t.stop());
          screenStreamRef.current = null;
          audioStreamRef.current = null;
          throw new Error(
            "Please select 'Entire Screen' (not a Window or Tab) when sharing your screen.",
          );
        }

        // The ProctoringMonitor renders the webcam as a visible UI overlay on the page,
        // so it is already captured as part of the screen recording.
        // No separate webcam composite is needed — adding one would show two camera feeds.

        // Combine screen video + mic audio (+ optional system audio)
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

        // Create recorder with REDUCED bitrate for 25 min @ 100MB
        const mediaRecorder = new MediaRecorder(combinedStream, {
          mimeType,
          videoBitsPerSecond: 600000, // 600 kbps
          audioBitsPerSecond: 64000, // 64 kbps
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

        // Handle user turning off microphone - VIOLATION
        const micTrack = audioStream.getAudioTracks()[0];
        if (micTrack) {
          micTrack.onended = () => {
            console.log("[Recording] Microphone ended by user - VIOLATION");
            setError("Microphone was turned off. This is a violation.");
            if (onScreenShareStop) {
              onScreenShareStop(); // Reuse callback for audio violation too
            }
          };

          micTrack.onmute = () => {
            console.log("[Recording] Microphone muted - VIOLATION");
            setError("Microphone was muted. This is a violation.");
            if (onScreenShareStop) {
              onScreenShareStop();
            }
          };

          micTrack.onunmute = () => {
            console.log("[Recording] Microphone unmuted");
            setError(null);
          };
        }

        // Set 25-minute timer for silent stop
        recordingTimerRef.current = setTimeout(() => {
          console.log("[Recording] 25 min reached, triggering silent stop");
          silentStop();
        }, MAX_RECORDING_DURATION_MS);

        // Start screen recording with chunks every 5 seconds
        mediaRecorder.start(5000);
        setIsRecording(true);
        console.log("[Recording] Started successfully");

        // Start dedicated webcam-only recording (parallel, non-blocking)
        // Gives reviewers a face-only track separate from the screen recording
        try {
          const webcamStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 320 },
              height: { ideal: 240 },
              frameRate: { ideal: 10, max: 15 },
            },
            audio: false,
          });
          webcamStreamRef.current = webcamStream;

          const webcamMimeType = [
            "video/webm;codecs=vp9",
            "video/webm;codecs=vp8",
            "video/webm",
          ].find((t) => MediaRecorder.isTypeSupported(t));

          const webcamRecorder = new MediaRecorder(
            new MediaStream(webcamStream.getVideoTracks()),
            { mimeType: webcamMimeType, videoBitsPerSecond: 300_000 },
          );
          webcamRecorderRef.current = webcamRecorder;
          webcamChunksRef.current = [];

          webcamRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) webcamChunksRef.current.push(e.data);
          };

          webcamRecorder.start(5000);
          console.log("[Recording] Dedicated webcam recording started");
        } catch {
          console.warn(
            "[Recording] Webcam unavailable — proceeding without dedicated webcam recording",
          );
        }

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
    // First check if we have a saved blob (from 25-min silent stop)
    if (savedBlobRef.current && savedBlobRef.current.size > 0) {
      console.log("[Recording] Using saved blob from 25-min stop");
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

  // Upload with timeout and progress.
  // isMainRecording=true  → updates progress bar, sets recordingUrl state, clears IndexedDB, reports errors.
  // isMainRecording=false → silent webcam upload; none of those side-effects.
  const uploadToCloudinary = async (
    blob: Blob,
    options: { isMainRecording?: boolean } = {},
  ): Promise<string | null> => {
    const isMainRecording = options.isMainRecording ?? true;
    const MAX_RETRIES = isMainRecording ? 5 : 2;
    const uploadTimeout = isMainRecording ? UPLOAD_TIMEOUT_MS : 60_000;

    console.log(`[Recording] Uploading ${isMainRecording ? "screen" : "webcam"} to Cloudinary, size:`, blob.size);

    // Validate blob size
    if (blob.size < MIN_BLOB_SIZE) {
      console.error("[Recording] Blob too small:", blob.size);
      if (isMainRecording) setError("Recording is too short or empty. Please try again.");
      return null;
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Try signed upload first (more secure); fall back to unsigned if signing unavailable
        const formData = new FormData();
        formData.append("file", blob);
        formData.append("resource_type", "video");

        try {
          const signResp = await fetch("/api/signCloudinaryUpload", {
            method: "POST",
            signal: AbortSignal.timeout(8000),
          });
          if (signResp.ok) {
            const { signature, timestamp, api_key, upload_preset } =
              await signResp.json();
            formData.append("signature", signature);
            formData.append("timestamp", String(timestamp));
            formData.append("api_key", api_key);
            formData.append("upload_preset", upload_preset);
            console.log("[Recording] Using signed Cloudinary upload");
          } else {
            throw new Error("Signing endpoint returned non-OK");
          }
        } catch {
          // Signing endpoint unavailable — fall back to unsigned preset
          formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
          console.warn("[Recording] Signing unavailable — using unsigned upload");
        }

        // Use XMLHttpRequest for progress tracking
        const url = await new Promise<string | null>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          // Set timeout
          xhr.timeout = uploadTimeout;

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable && isMainRecording) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(percent);
              console.log(`[Recording] Upload progress: ${percent}%`);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data.secure_url);
              } catch {
                reject(new Error("Invalid response from server"));
              }
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));
          xhr.ontimeout = () => reject(new Error("Upload timed out (2 min)"));

          xhr.open(
            "POST",
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
          );
          xhr.send(formData);
        });

        if (url) {
          console.log(`[Recording] ${isMainRecording ? "Screen" : "Webcam"} upload success:`, url);
          if (isMainRecording) {
            setRecordingUrl(url);
            setUploadProgress(100);
            await clearIndexedDB();
          }
          return url;
        }
      } catch (err) {
        console.error(`[Recording] Upload attempt ${attempt} failed:`, err);
        if (isMainRecording) setUploadProgress(0);

        if (attempt < MAX_RETRIES) {
          // Exponential backoff: 2s, 4s, 8s, 16s
          const delay = 2000 * Math.pow(2, attempt - 1);
          console.log(`[Recording] Retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    if (isMainRecording) setError(`Failed to upload recording after ${MAX_RETRIES} attempts`);
    return null;
  };

  const stopAndUpload = useCallback(async (): Promise<string | null> => {
    // If upload already in progress, wait and return the result
    // instead of returning null (which would show "upload failed")
    if (isUploadingRef.current) {
      console.log("[Recording] Upload already in progress, waiting...");
      // Wait for current upload to finish (poll every 500ms, max 3 min)
      for (let i = 0; i < 360; i++) {
        await new Promise((r) => setTimeout(r, 500));
        if (!isUploadingRef.current) {
          return recordingUrl;
        }
      }
      console.log("[Recording] Timed out waiting for upload");
      return recordingUrl;
    }

    isUploadingRef.current = true;
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    console.log("[Recording] Stop and upload...");

    try {
      // --- STEP 1: Collect webcam blob BEFORE getRecordingBlob (which may call cleanup internally) ---
      let webcamBlob: Blob | null = null;

      if (webcamSavedBlobRef.current && webcamSavedBlobRef.current.size > 0) {
        // Already saved by 25-min silentStop
        webcamBlob = webcamSavedBlobRef.current;
        console.log("[Recording] Using saved webcam blob from silentStop:", webcamBlob.size);
      } else if (webcamRecorderRef.current?.state === "recording") {
        // Webcam still recording — stop it and await the blob
        webcamBlob = await new Promise<Blob | null>((resolve) => {
          const rec = webcamRecorderRef.current!;
          rec.onstop = () => {
            const b = new Blob(webcamChunksRef.current, { type: "video/webm" });
            webcamChunksRef.current = [];
            webcamRecorderRef.current = null;
            resolve(b.size > 0 ? b : null);
          };
          try { rec.stop(); } catch { resolve(null); }
        });
        console.log("[Recording] Collected webcam blob:", webcamBlob?.size ?? 0);
      } else if (webcamChunksRef.current.length > 0) {
        // Recorder already stopped but chunks still in memory (e.g. inactive state)
        webcamBlob = new Blob(webcamChunksRef.current, { type: "video/webm" });
        webcamChunksRef.current = [];
        console.log("[Recording] Collected webcam chunks blob:", webcamBlob.size);
      }

      // --- STEP 2: Get screen recording blob (may call cleanup internally via stopRecording) ---
      const blob = await getRecordingBlob();

      if (!blob || blob.size === 0) {
        console.log("[Recording] No blob to upload");
        setError("No recording found. Please try again.");
        cleanup();
        return null;
      }

      // Save blob for potential retry
      lastBlobRef.current = blob;

      // --- STEP 3: Cleanup remaining streams (webcam already handled above) ---
      cleanup();

      // --- STEP 4: Upload screen recording (primary, shows progress bar) ---
      const url = await uploadToCloudinary(blob, { isMainRecording: true });

      // --- STEP 5: Upload webcam recording silently (secondary; failure never blocks submission) ---
      if (webcamBlob && webcamBlob.size >= MIN_BLOB_SIZE) {
        console.log("[Recording] Uploading webcam recording silently...");
        try {
          const wUrl = await uploadToCloudinary(webcamBlob, { isMainRecording: false });
          if (wUrl) {
            webcamUrlRef.current = wUrl; // Update ref immediately (readable by stale closures)
            setWebcamUrl(wUrl);
            console.log("[Recording] Webcam URL saved:", wUrl);
          } else {
            console.warn("[Recording] Webcam upload returned null — non-blocking");
          }
        } catch (err) {
          console.warn("[Recording] Webcam upload error (non-blocking):", err);
        }
      } else {
        console.warn("[Recording] No valid webcam blob to upload (size:", webcamBlob?.size ?? 0, ")");
      }

      return url;
    } finally {
      isUploadingRef.current = false;
      setIsUploading(false);
    }
  }, [getRecordingBlob, cleanup, recordingUrl]);

  // Retry upload with previously saved blob
  const retryUpload = useCallback(async (): Promise<string | null> => {
    if (isUploadingRef.current) {
      console.log("[Recording] Upload already in progress");
      return null;
    }

    // Try to get blob from various sources
    let blob = lastBlobRef.current;

    if (!blob || blob.size === 0) {
      blob = savedBlobRef.current;
    }

    if (!blob || blob.size === 0) {
      blob = await loadFromIndexedDB();
    }

    if (!blob || blob.size === 0) {
      setError("No recording found to retry");
      return null;
    }

    isUploadingRef.current = true;
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      return await uploadToCloudinary(blob);
    } finally {
      isUploadingRef.current = false;
      setIsUploading(false);
    }
  }, []);

  // Download recording locally to user's device
  const downloadRecordingLocally = useCallback(async (): Promise<boolean> => {
    try {
      console.log("[Recording] Downloading recording locally...");

      // Try to get the blob from various sources
      let blob: Blob | null = null;

      // 1. Check lastBlobRef (from failed upload)
      if (lastBlobRef.current && lastBlobRef.current.size > 0) {
        blob = lastBlobRef.current;
        console.log("[Recording] Using lastBlobRef for download");
      }

      // 2. Check savedBlobRef
      if (!blob && savedBlobRef.current && savedBlobRef.current.size > 0) {
        blob = savedBlobRef.current;
        console.log("[Recording] Using savedBlobRef for download");
      }

      // 3. Check IndexedDB
      if (!blob) {
        blob = await loadFromIndexedDB();
        if (blob) console.log("[Recording] Using IndexedDB blob for download");
      }

      // 4. Stop current recording if still running
      if (!blob && isActuallyRecordingRef.current) {
        blob = await stopRecording();
        console.log("[Recording] Stopped recording for download");
      }

      if (!blob || blob.size < MIN_BLOB_SIZE) {
        console.error("[Recording] No valid recording blob found for download");
        return false;
      }

      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      const filename = `interview_recording_${timestamp}.webm`;

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`[Recording] Downloaded locally as: ${filename}`);
      return true;
    } catch (error) {
      console.error("[Recording] Failed to download locally:", error);
      return false;
    }
  }, [stopRecording]);

  return (
    <RecordingContext.Provider
      value={{
        isRecording,
        recordingUrl,
        webcamUrl,
        getWebcamUrl: () => webcamUrlRef.current,
        error,
        uploadProgress,
        isUploading,
        startRecording,
        stopRecording,
        stopAndUpload,
        cleanup,
        getRecordingBlob,
        retryUpload,
        downloadRecordingLocally,
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
