import { showToast, ToastType } from "../components/Toast";

// Error code mapping to user-friendly messages
const ERROR_MESSAGES: Record<string, { message: string; type: ToastType }> = {
  // Auth Errors
  "No token found": {
    message: "Please login to Spotify first",
    type: "warning",
  },
  "Not logged in": {
    message: "Please login to Spotify first",
    type: "warning",
  },
  "Token expired": {
    message: "Session expired, please login again",
    type: "warning",
  },
  "No refresh token": {
    message: "Session expired, please login again",
    type: "warning",
  },
  "Unauthorized": {
    message: "Session expired, please login again",
    type: "error",
  },
  "Invalid token response": {
    message: "Login failed, please try again",
    type: "error",
  },
  "No PKCE verifier": {
    message: "Please click Login first, then authorize in browser",
    type: "warning",
  },
  "Token exchange failed": {
    message: "Login failed, please try again",
    type: "error",
  },

  // Spotify Playback Errors
  "No active device": {
    message: "Open Spotify on a device first, then try again",
    type: "warning",
  },
  "Playback control failed": {
    message: "Cannot control playback. Is Spotify open?",
    type: "error",
  },
  "Failed to get player state": {
    message: "Cannot connect to Spotify. Is it open?",
    type: "error",
  },
  "Next track failed": {
    message: "Cannot skip track. Is Spotify open?",
    type: "error",
  },
  "Previous track failed": {
    message: "Cannot go to previous track. Is Spotify open?",
    type: "error",
  },

  // Lyrics Errors
  "No lyrics available": {
    message: "No lyrics found for this song",
    type: "info",
  },
  "Lyrics not found": {
    message: "No lyrics found for this song",
    type: "info",
  },
  "Spotify API failed": {
    message: "Trying alternative lyrics source...",
    type: "info",
  },
  "lrclib.net failed": {
    message: "Could not fetch lyrics",
    type: "warning",
  },

  // Network Errors
  "Network error": {
    message: "Check your internet connection",
    type: "error",
  },
  "Request timeout": {
    message: "Connection timed out, please try again",
    type: "error",
  },

  // General
  "Unknown error": {
    message: "Something went wrong, please try again",
    type: "error",
  },
};

// Pattern matching for dynamic errors
const ERROR_PATTERNS: Array<{
  pattern: RegExp;
  message: string;
  type: ToastType;
}> = [
  {
    pattern: /401|unauthorized/i,
    message: "Session expired, please login again",
    type: "error",
  },
  {
    pattern: /403|forbidden/i,
    message: "Permission denied. Please login again with proper access",
    type: "error",
  },
  {
    pattern: /404|not found/i,
    message: "Content not found",
    type: "warning",
  },
  {
    pattern: /429|too many requests/i,
    message: "Too many requests. Please wait a moment",
    type: "warning",
  },
  {
    pattern: /500|502|503|internal server/i,
    message: "Spotify is having issues. Please try later",
    type: "error",
  },
  {
    pattern: /network|fetch failed|ECONNREFUSED/i,
    message: "Check your internet connection",
    type: "error",
  },
  {
    pattern: /timeout/i,
    message: "Connection timed out",
    type: "error",
  },
  {
    pattern: /device|active device/i,
    message: "Open Spotify on a device first",
    type: "warning",
  },
  {
    pattern: /premium|Premium required/i,
    message: "Spotify Premium is required for playback control",
    type: "warning",
  },
];

/**
 * Handle error with user-friendly toast notification
 */
export function handleError(error: unknown, context?: string) {
  const errorMessage = extractErrorMessage(error);
  
  console.error(`[Error]${context ? ` ${context}:` : ""}`, error);

  // Check exact match first
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (errorMessage.includes(key)) {
      showToast(value.message, value.type);
      return;
    }
  }

  // Check pattern match
  for (const { pattern, message, type } of ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      showToast(message, type);
      return;
    }
  }

  // Fallback
  showToast("Something went wrong, please try again", "error");
}

/**
 * Extract error message from various error types
 */
function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as any).message);
  }
  return String(error);
}

/**
 * Show success toast
 */
export function showSuccess(message: string) {
  showToast(message, "success");
}

/**
 * Show warning toast
 */
export function showWarning(message: string) {
  showToast(message, "warning");
}

/**
 * Show info toast
 */
export function showInfo(message: string) {
  showToast(message, "info");
}
