// Fullscreen handler for PWA
(function () {
  // Wait for React to fully hydrate before manipulating the DOM
  window.addEventListener("load", function () {
    // Add a small delay to ensure React has finished hydrating
    setTimeout(initFullscreenHandler, 300);
  });

  function initFullscreenHandler() {
    // Try to detect standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone ||
      window.location.search.includes("standalone=true");

    if (isStandalone) {
      // Check if we're on Android
      const isAndroid = /Android/.test(navigator.userAgent);

      if (isAndroid) {
        // Add a fullscreen class to the body
        document.body.classList.add("pwa-fullscreen");

        // Try multiple fullscreen approaches
        tryEnterFullscreen();

        // Listen for orientation changes to re-apply fullscreen
        window.addEventListener("orientationchange", function () {
          setTimeout(tryEnterFullscreen, 300);
        });

        // Set a listener for the fullscreenchange event
        document.addEventListener("fullscreenchange", function () {
          if (!document.fullscreenElement) {
            setTimeout(tryEnterFullscreen, 500);
          }
        });

        // Apply CSS for status bar replacement instead of inserting an element
        forceFullscreenCSS();
      }
    }
  }

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

  function forceFullscreenCSS() {
    // Apply CSS that forces fullscreen-like appearance
    const style = document.createElement("style");
    style.textContent = `
      body.pwa-fullscreen {
        position: fixed !important;
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        overflow: hidden !important;
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

      @supports (padding-top: env(safe-area-inset-top)) {
        body.pwa-fullscreen {
          padding-top: env(safe-area-inset-top) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
})();
