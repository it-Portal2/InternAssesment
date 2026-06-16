import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect, // Added useEffect
  type ReactNode,
} from "react";
import fixWebmDuration from "fix-webm-duration";

const CLOUDINARY_CLOUD_NAME = "duusiq4ws";
const CLOUDINARY_UPLOAD_PRESET = "InternAssesment";
const MAX_RECORDING_DURATION_MS = 25 * 60 * 1000; // 25 minutes
const CHUNK_SIZE = 6 * 1024 * 1024; // 6 MB per chunk (Cloudinary requires >5MB except the last)
const CHUNK_TIMEOUT_MS = 2 * 60 * 1000; // per-chunk upload timeout
const MIN_BLOB_SIZE = 10000; // 10KB minimum
const DB_NAME = "InterviewRecordingDB";
const STORE_NAME = "recordings";

// Verbose recording logs are silenced in production. Flip to true to debug.
const DEBUG_RECORDING = false;
const rlog = (...args: unknown[]) => {
  if (DEBUG_RECORDING) console["log"](...args);
};

// MediaRecorder timeslice blobs carry no Duration in their EBML header, so a raw
// download plays only a few seconds. Inject the real duration before saving/uploading.
async function finalizeWebm(chunks: Blob[], durationMs: number): Promise<Blob> {
  const raw = new Blob(chunks, { type: "video/webm" });
  if (!durationMs || durationMs <= 0) return raw;
  try {
    return await fixWebmDuration(raw, durationMs, { logger: false });
  } catch (e) {
    console.warn("[Recording] Duration fix failed, using raw blob:", e);
    return raw;
  }
}

interface RecordingContextType {
  isRecording: boolean; // UI state - stays true even after silent stop
  recordingUrl: string | null;
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
        rlog("[Recording] Saved to IndexedDB:", blob.size, "bytes");
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
    rlog("[Recording] Failed to clear IndexedDB:", e);
  }
}

export function RecordingProvider({ children }: { children: ReactNode }) {
  const [isRecording, setIsRecording] = useState(false); // UI state
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const savedBlobRef = useRef<Blob | null>(null); // Saved blob after 25 min
  const recordingStartRef = useRef<number>(0); // Date.now() when recording started (for duration metadata)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isActuallyRecordingRef = useRef(false); // Actual recording state
  const isUploadingRef = useRef(false); // Prevent race condition
  const lastBlobRef = useRef<Blob | null>(null); // For retry functionality

  // Silent stop - stops MediaRecorder but keeps streams active
  const silentStop = useCallback(async (): Promise<Blob | null> => {
    rlog("[Recording] Silent stop at 25 min...");

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;

      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        resolve(null);
        return;
      }

      mediaRecorder.onstop = async () => {
        const durationMs = recordingStartRef.current
          ? Date.now() - recordingStartRef.current
          : MAX_RECORDING_DURATION_MS;
        const blob = await finalizeWebm(chunksRef.current, durationMs);
        rlog("[Recording] Silent stop complete, blob size:", blob.size);

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
    rlog("[Recording] Cleanup called");

    // Clear timer
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Stop all tracks
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        rlog("[Recording] Stopping track:", track.kind);
        track.stop();
      });
      screenStreamRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    // Reset screen recorder
    if (mediaRecorderRef.current?.state !== "inactive") {
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        rlog("[Recording] Recorder already stopped");
      }
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];

    savedBlobRef.current = null;
    isActuallyRecordingRef.current = false;
    setIsRecording(false);
  }, []);

  // Cleanup on unmount - MUST be defined AFTER cleanup fn
  useEffect(() => {
    return () => {
      rlog("[Recording] Provider unmounting, running cleanup");
      cleanup();
    };
  }, [cleanup]);

  const startRecording = useCallback(
    async (onScreenShareStop?: () => void): Promise<boolean> => {
      // Prevent multiple starts
      if (isActuallyRecordingRef.current) {
        rlog("[Recording] Alredy recording, ignoring start request");
        return true;
      }

      rlog("[Recording] Starting recording...");
      setError(null);
      chunksRef.current = [];
      savedBlobRef.current = null;
      setUploadProgress(0);

      // Clear any previous IndexedDB data
      await clearIndexedDB();

      try {
        // Get audio stream
        rlog("[Recording] Requesting audio...");
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioStreamRef.current = audioStream;
        rlog("[Recording] Audio obtained");

        // Get screen stream with reduced frame rate
        rlog("[Recording] Requesting screen...");
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "monitor",
            frameRate: { ideal: 10, max: 15 }, // Reduced for smaller file
          },
          audio: true,
        });
        screenStreamRef.current = screenStream;
        rlog("[Recording] Screen obtained");

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

        rlog("[Recording] Using codec:", mimeType);

        // Create recorder with REDUCED bitrate for 25 min @ 100MB
        const mediaRecorder = new MediaRecorder(combinedStream, {
          mimeType,
          videoBitsPerSecond: 500000, // 500 kbps
          audioBitsPerSecond: 64000, // 64 kbps
        });

        mediaRecorderRef.current = mediaRecorder;
        isActuallyRecordingRef.current = true;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunksRef.current.push(event.data);
            rlog(
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
          rlog("[Recording] Screen share ended by user - VIOLATION");
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
            rlog("[Recording] Microphone ended by user - VIOLATION");
            setError("Microphone was turned off. This is a violation.");
            if (onScreenShareStop) {
              onScreenShareStop(); // Reuse callback for audio violation too
            }
          };

          micTrack.onmute = () => {
            rlog("[Recording] Microphone muted - VIOLATION");
            setError("Microphone was muted. This is a violation.");
            if (onScreenShareStop) {
              onScreenShareStop();
            }
          };

          micTrack.onunmute = () => {
            rlog("[Recording] Microphone unmuted");
            setError(null);
          };
        }

        // Set 25-minute timer for silent stop
        recordingTimerRef.current = setTimeout(() => {
          rlog("[Recording] 25 min reached, triggering silent stop");
          silentStop();
        }, MAX_RECORDING_DURATION_MS);

        // Start screen recording with chunks every 5 seconds.
        // The candidate's webcam is shown by the on-screen ProctoringMonitor overlay,
        // which the screen capture records — so the face is already in this recording.
        mediaRecorder.start(5000);
        recordingStartRef.current = Date.now();
        setIsRecording(true);
        rlog("[Recording] Started successfully");

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
    rlog("[Recording] Stopping recording...");

    // Clear timer if still running
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;

      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        rlog("[Recording] No active recorder");
        cleanup();
        resolve(null);
        return;
      }

      mediaRecorder.onstop = async () => {
        rlog("[Recording] Stopped, chunks:", chunksRef.current.length);
        const durationMs = recordingStartRef.current
          ? Date.now() - recordingStartRef.current
          : 0;
        // Build + duration-fix the blob BEFORE cleanup (cleanup clears chunksRef)
        const blob = await finalizeWebm(chunksRef.current, durationMs);
        rlog("[Recording] Blob size:", blob.size, "bytes");
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
      rlog("[Recording] Using saved blob from 25-min stop");
      return savedBlobRef.current;
    }

    // Check IndexedDB backup
    const indexedDBBlob = await loadFromIndexedDB();
    if (indexedDBBlob && indexedDBBlob.size > 0) {
      rlog("[Recording] Using blob from IndexedDB");
      return indexedDBBlob;
    }

    // Otherwise stop current recording
    if (isActuallyRecordingRef.current) {
      return await stopRecording();
    }

    return null;
  }, [stopRecording]);

  // Chunked (resumable) upload to Cloudinary.
  // The file is sent in 6MB chunks; a failed chunk retries on its own without
  // restarting the whole upload, so large videos finish reliably on slow links.
  const uploadToCloudinary = async (blob: Blob): Promise<string | null> => {
    rlog(
      "[Recording] Uploading recording to Cloudinary (chunked), size:",
      blob.size,
    );

    // Validate blob size
    if (blob.size < MIN_BLOB_SIZE) {
      console.error("[Recording] Blob too small:", blob.size);
      setError("Recording is too short or empty. Please try again.");
      return null;
    }

    // Unsigned upload with the account's upload preset — proven to work with the
    // duusiq4ws cloud. (Signed uploads need a valid api_key/secret for THIS cloud;
    // re-enable them only once those credentials are confirmed correct.)
    const uploadParams: Record<string, string> = {
      upload_preset: CLOUDINARY_UPLOAD_PRESET,
    };

    const total = blob.size;
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`; // unique per file, same for all chunks
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`;

    // Upload one chunk. Resolves with the parsed response (final chunk carries secure_url).
    const uploadChunk = (
      chunkBlob: Blob,
      start: number,
      end: number,
    ): Promise<Record<string, unknown>> => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", chunkBlob);
        formData.append("resource_type", "video");
        for (const [k, v] of Object.entries(uploadParams)) formData.append(k, v);

        const xhr = new XMLHttpRequest();
        xhr.timeout = CHUNK_TIMEOUT_MS;

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round(((start + event.loaded) / total) * 100);
            setUploadProgress(Math.min(percent, 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(xhr.responseText ? JSON.parse(xhr.responseText) : {});
            } catch {
              reject(new Error("Invalid response from server"));
            }
          } else {
            reject(
              new Error(
                `Chunk upload failed: ${xhr.status} ${xhr.responseText?.slice(0, 200) || ""}`,
              ),
            );
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.ontimeout = () => reject(new Error("Chunk upload timed out"));

        xhr.open("POST", uploadUrl);
        // Cloudinary chunked-upload headers (must be set after open, before send)
        xhr.setRequestHeader("X-Unique-Upload-Id", uploadId);
        xhr.setRequestHeader("Content-Range", `bytes ${start}-${end}/${total}`);
        xhr.send(formData);
      });
    };

    const CHUNK_RETRIES = 3;
    let secureUrl: string | null = null;

    for (let start = 0; start < total; start += CHUNK_SIZE) {
      const end = Math.min(start + CHUNK_SIZE, total) - 1; // inclusive byte index
      const chunkBlob = blob.slice(start, end + 1);

      let chunkOk = false;
      for (let attempt = 1; attempt <= CHUNK_RETRIES; attempt++) {
        try {
          const resp = await uploadChunk(chunkBlob, start, end);
          if (resp && typeof resp.secure_url === "string") {
            secureUrl = resp.secure_url as string;
          }
          chunkOk = true;
          break;
        } catch (err) {
          console.error(
            `[Recording] Chunk ${start}-${end} attempt ${attempt}/${CHUNK_RETRIES} failed:`,
            err,
          );
          if (attempt < CHUNK_RETRIES) {
            await new Promise((r) => setTimeout(r, 2000 * attempt)); // 2s, 4s
          }
        }
      }

      // A chunk that exhausts its retries fails the whole upload; the outer
      // fallback (retry / local download / UPLOAD_FAILED) then takes over.
      if (!chunkOk) {
        setUploadProgress(0);
        setError("Failed to upload recording. Please retry or use the download option.");
        return null;
      }
    }

    if (secureUrl) {
      rlog("[Recording] Recording upload success:", secureUrl);
      setRecordingUrl(secureUrl);
      setUploadProgress(100);
      await clearIndexedDB();
      return secureUrl;
    }

    // All chunks sent but Cloudinary never returned a URL — treat as failure.
    setError("Upload finished but no URL was returned. Please retry.");
    return null;
  };

  const stopAndUpload = useCallback(async (): Promise<string | null> => {
    // If upload already in progress, wait and return the result
    // instead of returning null (which would show "upload failed")
    if (isUploadingRef.current) {
      rlog("[Recording] Upload already in progress, waiting...");
      // Wait for current upload to finish (poll every 500ms, max 3 min)
      for (let i = 0; i < 360; i++) {
        await new Promise((r) => setTimeout(r, 500));
        if (!isUploadingRef.current) {
          return recordingUrl;
        }
      }
      rlog("[Recording] Timed out waiting for upload");
      return recordingUrl;
    }

    isUploadingRef.current = true;
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    rlog("[Recording] Stop and upload...");

    try {
      // Get screen recording blob (may call cleanup internally via stopRecording)
      const blob = await getRecordingBlob();

      if (!blob || blob.size === 0) {
        rlog("[Recording] No blob to upload");
        setError("No recording found. Please try again.");
        cleanup();
        return null;
      }

      // Save blob for potential retry
      lastBlobRef.current = blob;

      // Cleanup streams now that we have the blob
      cleanup();

      // Upload the screen recording (which already contains the webcam overlay)
      return await uploadToCloudinary(blob);
    } finally {
      isUploadingRef.current = false;
      setIsUploading(false);
    }
  }, [getRecordingBlob, cleanup, recordingUrl]);

  // Retry upload with previously saved blob
  const retryUpload = useCallback(async (): Promise<string | null> => {
    if (isUploadingRef.current) {
      rlog("[Recording] Upload already in progress");
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
      rlog("[Recording] Downloading recording locally...");

      // Try to get the blob from various sources
      let blob: Blob | null = null;

      // 1. Check lastBlobRef (from failed upload)
      if (lastBlobRef.current && lastBlobRef.current.size > 0) {
        blob = lastBlobRef.current;
        rlog("[Recording] Using lastBlobRef for download");
      }

      // 2. Check savedBlobRef
      if (!blob && savedBlobRef.current && savedBlobRef.current.size > 0) {
        blob = savedBlobRef.current;
        rlog("[Recording] Using savedBlobRef for download");
      }

      // 3. Check IndexedDB
      if (!blob) {
        blob = await loadFromIndexedDB();
        if (blob) rlog("[Recording] Using IndexedDB blob for download");
      }

      // 4. Stop current recording if still running
      if (!blob && isActuallyRecordingRef.current) {
        blob = await stopRecording();
        rlog("[Recording] Stopped recording for download");
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

      rlog(`[Recording] Downloaded locally as: ${filename}`);
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
