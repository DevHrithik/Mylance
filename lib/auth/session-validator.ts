/**
 * Session validator to check for corrupted Supabase session data
 * This should be called before any Supabase auth operations
 */

export function validateAndCleanSession(): boolean {
  if (typeof window === "undefined") return true;

  try {
    // Check localStorage for corrupted Supabase items
    const corruptedKeys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("sb-")) continue;

      try {
        const value = localStorage.getItem(key);
        if (!value) continue;

        // If it looks like JSON, try to parse it
        if (value.startsWith("{") || value.startsWith("[")) {
          JSON.parse(value);
        }

        // If it's a base64 string that should be JSON, validate it
        if (value.startsWith("base64-")) {
          const base64Data = value.replace("base64-", "");
          try {
            const decoded = atob(base64Data);
            if (decoded.startsWith("{") || decoded.startsWith("[")) {
              JSON.parse(decoded);
            }
          } catch {
            console.warn(`Corrupted base64 session data in key: ${key}`);
            corruptedKeys.push(key);
          }
        }
      } catch (error) {
        console.warn(`Corrupted session data detected in key: ${key}`, error);
        corruptedKeys.push(key);
      }
    }

    // Remove corrupted keys
    if (corruptedKeys.length > 0) {
      console.warn(
        `Removing ${corruptedKeys.length} corrupted session keys:`,
        corruptedKeys
      );
      corruptedKeys.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove corrupted key: ${key}`, e);
        }
      });
      return false; // Session was corrupted
    }

    // Check sessionStorage as well
    const sessionCorruptedKeys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key || !key.startsWith("sb-")) continue;

      try {
        const value = sessionStorage.getItem(key);
        if (!value) continue;

        if (value.startsWith("{") || value.startsWith("[")) {
          JSON.parse(value);
        }
      } catch (error) {
        console.warn(`Corrupted session storage data in key: ${key}`, error);
        sessionCorruptedKeys.push(key);
      }
    }

    if (sessionCorruptedKeys.length > 0) {
      sessionCorruptedKeys.forEach((key) => {
        try {
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn(
            `Failed to remove corrupted sessionStorage key: ${key}`,
            e
          );
        }
      });
      return false;
    }

    return true; // Session is clean
  } catch (error) {
    console.error("Error validating session:", error);
    return false;
  }
}

/**
 * Clear all Supabase session data completely
 */
export function clearAllSupabaseSession(): void {
  if (typeof window === "undefined") return;

  try {
    // Clear localStorage
    const localKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
        localKeys.push(key);
      }
    }
    localKeys.forEach((key) => localStorage.removeItem(key));

    // Clear sessionStorage
    const sessionKeys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
        sessionKeys.push(key);
      }
    }
    sessionKeys.forEach((key) => sessionStorage.removeItem(key));

    // Clear cookies
    document.cookie.split(";").forEach(function (cookie) {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

      if (name.startsWith("sb-") || name.includes("supabase")) {
        const expireDate = "Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = `${name}=; expires=${expireDate}; path=/;`;
        document.cookie = `${name}=; expires=${expireDate}; path=/; domain=${window.location.hostname};`;
        document.cookie = `${name}=; expires=${expireDate}; path=/; domain=.${window.location.hostname};`;
      }
    });

    console.log("All Supabase session data cleared");
  } catch (error) {
    console.error("Error clearing Supabase session:", error);
  }
}
