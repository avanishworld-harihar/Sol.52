let googleMapsPromise: Promise<typeof google.maps> | null = null;

/**
 * Loads Google Maps JavaScript API once in the browser.
 * The public browser key must be restricted to the app's domains in Google Cloud.
 */
export function loadGoogleMaps(apiKey: string): Promise<typeof google.maps> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only load in the browser."));
  }
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const callbackName = `__sol52GoogleMapsReady${Date.now()}`;
    const timeout = window.setTimeout(() => {
      cleanup();
      googleMapsPromise = null;
      reject(new Error("Google Maps timed out while loading."));
    }, 20_000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      delete (window as unknown as Record<string, unknown>)[callbackName];
    };

    (window as unknown as Record<string, unknown>)[callbackName] = () => {
      cleanup();
      if (window.google?.maps) resolve(window.google.maps);
      else {
        googleMapsPromise = null;
        reject(new Error("Google Maps loaded without the Maps library."));
      }
    };

    const script = document.createElement("script");
    script.id = "sol52-google-maps-script";
    script.async = true;
    script.defer = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}` +
      `&callback=${encodeURIComponent(callbackName)}&v=weekly&loading=async`;
    script.onerror = () => {
      cleanup();
      script.remove();
      googleMapsPromise = null;
      reject(
        new Error(
          "Google Maps could not load. Check API key, HTTP referrer restrictions, billing, and Maps JavaScript API."
        )
      );
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}
