// Fullscreen handler for PWA - with mobile safety checks
(function () {
  // Wait for React to fully hydrate before manipulating the DOM
  window.addEventListener("load", function () {
    // Add a small delay to ensure React has finished hydrating
    // Increased delay for mobile devices to prevent conflicts
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const delay = isMobile ? 1000 : 300;
    
    setTimeout(function() {
      try {
        initFullscreenHandler();
      } catch (error) {
        console.warn("Fullscreen handler error:", error);
        // Fail silently on mobile to prevent breaking the app
      }
    }, delay);
  });

  /**
   * Initializes fullscreen handling for standalone Progressive Web Apps (PWAs) on Android devices.
   * This function detects if the app is running in standalone mode, applies fullscreen CSS,
   * adds a fullscreen class to the body, and ensures proper scrolling for the app root element.
   * @returns {void} This function does not return a value.
   * @throws {Error} May throw an error if there are issues with DOM manipulation or style application.
   */
  function initFullscreenHandler() {
    try {
      // Try to detect standalone mode with additional safety checks
      const isStandalone =
        window.matchMedia &&
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone ||
        window.location.search.includes("standalone=true");

      if (isStandalone) {
        // Check if we're on Android
        const isAndroid = /Android/.test(navigator.userAgent);

        if (isAndroid && document.body) {
          // Add a fullscreen class to the body with error handling
          try {
            document.body.classList.add("pwa-fullscreen");
          } catch (classListError) {
            console.warn("Could not add fullscreen class:", classListError);
          }

          // Apply CSS for status bar replacement with error handling
          try {
            forceFullscreenCSS();
          } catch (cssError) {
            console.warn("Could not apply fullscreen CSS:", cssError);
          }

          // Add a subtle notification that the app is in standalone mode
          const appRoot = document.getElementById("app-root");
          if (appRoot) {
            try {
              // Just ensure the app-root has proper scrolling
              appRoot.style.overflow = "auto";
              appRoot.style.webkitOverflowScrolling = "touch";
            } catch (styleError) {
              console.warn("Could not apply app-root styles:", styleError);
            }
          }
        }
      }
    } catch (error) {
      console.warn("Error in initFullscreenHandler:", error);
    }
  }

  /**
   * Attempts to enter fullscreen mode for the document.
   * First tries the standard method, then falls back to alternative methods if necessary.
   * @returns {void} This method doesn't return a value.
   * @throws {Error} May throw an error if fullscreen mode cannot be entered.
   */
  function tryEnterFullscreen() {
    // Try the standard way first
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(function (err) {
        console.log("Couldn't enter fullscreen:", err);
        tryAlternativeFullscreen();
      });
    } else {
      tryAlternativeFullscreen();
    }
  }

  /**
   * Attempts to enter fullscreen mode using vendor-specific methods.
   * This function tries different browser-specific fullscreen APIs to maximize compatibility.
   * It checks for webkit, mozilla, and microsoft implementations sequentially.
   * @returns {void} This function does not return a value.
   */
  function tryAlternativeFullscreen() {
    // Try vendor-specific methods
    const docEl = document.documentElement;

    if (docEl.webkitRequestFullscreen) {
      docEl.webkitRequestFullscreen();
    } else if (docEl.mozRequestFullScreen) {
      docEl.mozRequestFullScreen();
    } else if (docEl.msRequestFullscreen) {
      docEl.msRequestFullscreen();
    }
  }

  /**
   * Applies CSS styles to force a fullscreen-like appearance for Progressive Web Apps (PWAs).
   * This function creates and appends a style element to the document head with CSS rules that:
   * - Make the body take up the full viewport
   * - Add a safe area inset at the top for mobile devices
   * - Ensure content is scrollable in PWA mode
   * - Fix any fixed containers that might block scrolling
   * - Apply flexbox display where needed
   * @returns {void} This function does not return a value.
   */
  function forceFullscreenCSS() {
    // Apply CSS that forces fullscreen-like appearance
    const style = document.createElement("style");
    style.textContent = `
      body.pwa-fullscreen {
        position: relative !important;
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        overflow: auto !important;
        -webkit-overflow-scrolling: touch !important;
        background-color: #ffffff !important;
      }
      
      body.pwa-fullscreen::before {
        content: "";
        display: block;
        width: 100%;
        height: 24px; /* Fallback height */
        height: env(safe-area-inset-top, 24px);
        background-color: #ffffff !important;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
      }

      /* Make sure content is scrollable in PWA mode */
      #app-root {
        height: 100% !important;
        overflow: auto !important;
        -webkit-overflow-scrolling: touch !important;
      }

      .flex {
        display: flex !important;
      }

      /* Fix any fixed containers that might block scrolling */
      div[class*="overflow-hidden"] {
        overflow: auto !important;
        -webkit-overflow-scrolling: touch !important;
      }

      @supports (padding-top: env(safe-area-inset-top)) {
        body.pwa-fullscreen {
          padding-top: env(safe-area-inset-top) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
})();
