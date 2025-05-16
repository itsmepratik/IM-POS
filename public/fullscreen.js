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

        // Only attempt fullscreen on user interaction to avoid scrolling issues
        /*
        document.addEventListener('click', function userInteractionHandler() {
          // Only try once
          document.removeEventListener('click', userInteractionHandler);
          tryEnterFullscreen();
        }, { once: true });
        */

        // Apply CSS for status bar replacement
        forceFullscreenCSS();

        // Add a subtle notification that the app is in standalone mode
        const appRoot = document.getElementById("app-root");
        if (appRoot) {
          // Just ensure the app-root has proper scrolling
          appRoot.style.overflow = "auto";
          appRoot.style.webkitOverflowScrolling = "touch";
        }
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
