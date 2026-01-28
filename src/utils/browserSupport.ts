/**
 * Browser Support Utility
 * Checks if browser supports screen recording for proctoring
 */

export interface BrowserSupportResult {
  supported: boolean;
  reason?: string;
  browserName: string;
  isIOS: boolean;
  isSafari: boolean;
}

/**
 * Detect browser and OS
 */
function detectBrowser(): { name: string; isIOS: boolean; isSafari: boolean } {
  const ua = navigator.userAgent;

  // iOS detection (all browsers on iOS use WebKit)
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  // Safari detection
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

  // Browser name detection
  let name = "Unknown";
  if (/Edg\//.test(ua)) name = "Edge";
  else if (/OPR\//.test(ua)) name = "Opera";
  else if (/Brave/.test(ua)) name = "Brave";
  else if (/Chrome\//.test(ua)) name = "Chrome";
  else if (/Firefox\//.test(ua)) name = "Firefox";
  else if (isSafari) name = "Safari";

  return { name, isIOS, isSafari };
}

/**
 * Check if browser supports all required APIs for screen recording
 */
export function checkBrowserSupport(): BrowserSupportResult {
  const { name, isIOS, isSafari } = detectBrowser();

  // iOS doesn't support getDisplayMedia at all
  if (isIOS) {
    return {
      supported: false,
      reason:
        "Screen recording is not supported on iOS devices. Please use a desktop/laptop computer with Chrome, Firefox, or Edge browser.",
      browserName: name,
      isIOS,
      isSafari,
    };
  }

  // Block Safari on ALL platforms - has unreliable screen recording
  if (isSafari) {
    return {
      supported: false,
      reason:
        "Safari does not reliably support recording for proctoring. Please use Chrome, Firefox, or Edge browser.",
      browserName: name,
      isIOS,
      isSafari,
    };
  }

  // Check getDisplayMedia support
  if (!navigator.mediaDevices?.getDisplayMedia) {
    return {
      supported: false,
      reason:
        "Your browser does not support screen sharing. Please use Chrome, Firefox, Edge, or Brave browser.",
      browserName: name,
      isIOS,
      isSafari,
    };
  }

  // Check getUserMedia support (camera/mic)
  if (!navigator.mediaDevices?.getUserMedia) {
    return {
      supported: false,
      reason:
        "Your browser does not support camera/microphone access. Please use Chrome, Firefox, Edge, or Brave browser.",
      browserName: name,
      isIOS,
      isSafari,
    };
  }

  // Check MediaRecorder support
  if (typeof MediaRecorder === "undefined") {
    return {
      supported: false,
      reason:
        "Your browser does not support video recording. Please use Chrome, Firefox, Edge, or Brave browser.",
      browserName: name,
      isIOS,
      isSafari,
    };
  }

  // Check for supported codecs
  const codecs = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  const hasCodecSupport = codecs.some((codec) =>
    MediaRecorder.isTypeSupported(codec),
  );

  if (!hasCodecSupport) {
    return {
      supported: false,
      reason:
        "Your browser does not support the required video format. Please use Chrome, Firefox, Edge, or Brave browser.",
      browserName: name,
      isIOS,
      isSafari,
    };
  }

  // All checks passed
  return {
    supported: true,
    browserName: name,
    isIOS,
    isSafari,
  };
}

/**
 * Get list of recommended browsers
 */
export function getRecommendedBrowsers(): string[] {
  return ["Google Chrome", "Mozilla Firefox", "Microsoft Edge", "Brave"];
}
