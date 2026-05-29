import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import { load } from "@tauri-apps/plugin-store";
import {
  generateCodeVerifier,
  generateCodeChallenge,
} from "../utils/pkce";

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkLoginStatus = useCallback(async () => {
    try {
      const store = await load("spotify_tokens.json");
      const token = await store.get<string>("access_token");
      const expiresAt = await store.get<number>("expires_at");
      const refreshToken = await store.get<string>("refresh_token");

      // No token at all
      if (!token) {
        console.log("[Auth] No token found");
        setIsLoggedIn(false);
        return false;
      }

      // Legacy token (no expiry info) - treat as expired
      if (!expiresAt || expiresAt === 0) {
        console.log("[Auth] Found legacy token (no expiry), need re-login");
        setIsLoggedIn(false);
        return false;
      }

      // Check if expired (with 5 min buffer)
      const now = Math.floor(Date.now() / 1000);
      const isExpired = expiresAt - 300 < now;

      if (isExpired) {
        // Can we refresh?
        if (refreshToken) {
          console.log("[Auth] Token expired, attempting refresh...");
          try {
            await invoke("refresh_token");
            console.log("[Auth] Token refreshed successfully");
            setIsLoggedIn(true);
            return true;
          } catch (e) {
            console.error("[Auth] Refresh failed:", e);
            setIsLoggedIn(false);
            return false;
          }
        } else {
          console.log("[Auth] Token expired and no refresh token, need re-login");
          setIsLoggedIn(false);
          return false;
        }
      }

      // Token is valid
      console.log("[Auth] Token is valid");
      setIsLoggedIn(true);
      return true;
    } catch {
      setIsLoggedIn(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const login = useCallback(async () => {
    try {
      console.log("[Auth] Starting PKCE login...");

      const verifier = await generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);

      console.log("[Auth] Generated PKCE challenge");
      console.log("[Auth] Verifier (first 10 chars):", verifier.substring(0, 10));

      // Store verifier in localStorage (more persistent than sessionStorage)
      localStorage.setItem("pkce_verifier", verifier);
      console.log("[Auth] Verifier saved to localStorage");

      const authUrl = await invoke<string>("spotify_login", {
        codeChallenge: challenge,
      });

      console.log("[Auth] Opening auth URL in browser...");
      await openUrl(authUrl);
    } catch (error) {
      console.error("[Auth] Login failed:", error);
    }
  }, []);

  // Listen for OAuth callback (from local HTTP server or deep link)
  useEffect(() => {
    console.log("[Auth] Setting up OAuth callback listener...");

    // Listen for oauth-callback event (from local server or deep link)
    const unlisten = listen("oauth-callback", async (event) => {
      console.log("[Auth] OAuth callback received!", event.payload);

      const code = event.payload as string;
      const verifier = localStorage.getItem("pkce_verifier");

      console.log("[Auth] Code:", code ? `${code.substring(0, 10)}...` : "MISSING");
      console.log("[Auth] Verifier:", verifier ? `${verifier.substring(0, 10)}...` : "MISSING");

      if (!verifier) {
        console.error("[Auth] No PKCE verifier found");
        alert("Error: No PKCE verifier. Please click 'Login with Spotify' first.");
        return;
      }

      try {
        console.log("[Auth] Exchanging token...");
        const tokens = await invoke<any>("exchange_token", {
          code,
          codeVerifier: verifier,
        });

        console.log("[Auth] Token exchange result:", tokens ? "success" : "failed");

        if (!tokens || !tokens.access_token) {
          console.error("[Auth] Invalid token response:", tokens);
          return;
        }

        // Save tokens
        const store = await load("spotify_tokens.json");
        await store.set("access_token", tokens.access_token);
        await store.set("refresh_token", tokens.refresh_token || "");
        await store.set("expires_at", tokens.expires_at || 0);
        await store.save();

        console.log("[Auth] Tokens saved");

        localStorage.removeItem("pkce_verifier");
        setIsLoggedIn(true);
        console.log("[Auth] Login successful!");
      } catch (error) {
        console.error("[Auth] Token exchange failed:", error);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Check login on mount
  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);

  // Manual code input (fallback for broken deep links)
  const submitManualCode = useCallback(async (code: string) => {
    const verifier = localStorage.getItem("pkce_verifier");

    console.log("[Auth] Manual code submission");
    console.log("[Auth] Code (first 10 chars):", code.substring(0, 10));
    console.log("[Auth] Verifier found:", verifier ? "YES" : "NO");

    if (!verifier) {
      console.error("[Auth] No PKCE verifier found - please click Login first");
      alert("Error: No PKCE verifier found. Please click 'Login with Spotify' first, then authorize in browser, then paste the code.");
      return;
    }

    try {
      console.log("[Auth] Calling exchange_token...");
      const tokens = await invoke<any>("exchange_token", {
        code,
        codeVerifier: verifier,
      });

      console.log("[Auth] Exchange result:", tokens);

      if (!tokens || !tokens.access_token) {
        console.error("[Auth] Invalid token response:", tokens);
        alert("Error: Invalid token response from Spotify");
        return;
      }

      console.log("[Auth] Saving tokens...");
      const store = await load("spotify_tokens.json");
      await store.set("access_token", tokens.access_token);
      await store.set("refresh_token", tokens.refresh_token || "");
      await store.set("expires_at", tokens.expires_at || 0);
      await store.save();

      console.log("[Auth] Tokens saved to store");

      localStorage.removeItem("pkce_verifier");
      setIsLoggedIn(true);
      console.log("[Auth] Login successful!");
      alert("Login successful!");
    } catch (error) {
      console.error("[Auth] Token exchange failed:", error);
      alert("Token exchange failed: " + error);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      console.log("[Auth] Logging out...");
      const store = await load("spotify_tokens.json");
      await store.clear();
      await store.save();

      localStorage.removeItem("pkce_verifier");
      setIsLoggedIn(false);
      console.log("[Auth] Logged out successfully");
    } catch (error) {
      console.error("[Auth] Logout failed:", error);
    }
  }, []);

  return {
    isLoggedIn,
    isChecking,
    login,
    logout,
    checkLoginStatus,
    submitManualCode,
  };
}
