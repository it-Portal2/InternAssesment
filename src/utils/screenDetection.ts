export const checkMultipleScreens = async (): Promise<boolean> => {
  try {
    // Method 1: window.getScreenDetails() - Chrome 100+
    // Note: This triggers a permission prompt if not already granted
    if ("getScreenDetails" in window) {
      try {
        const screenDetails = await (window as any).getScreenDetails();
        if (screenDetails.screens && screenDetails.screens.length > 1) {
          return true;
        }
        // If specific API works and returns 1 screen, we can trust it more than other methods
        // But for safety/fallback we might still check others if this didn't explicitly return false?
        // Actually if this API is available and works, it's the source of truth.
        return false;
      } catch (err) {
        // Permission denied or other error, fall back to other methods
        console.warn("getScreenDetails denied/failed:", err);
      }
    }

    // Method 2: Check screen.isExtended (Chrome 93+)
    if ("isExtended" in window.screen && (window.screen as any).isExtended) {
      return true;
    }

    // Method 3: Screen dimensions check
    // If available width is much larger, might indicate extended display
    const screenWidth = window.screen.width;
    const availWidth = window.screen.availWidth;

    if (availWidth > screenWidth * 1.5) {
      return true;
    }

    return false;
  } catch (e) {
    console.error("Screen check error:", e);
    return false;
  }
};
