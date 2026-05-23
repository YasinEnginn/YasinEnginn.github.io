(() => {
    const href = "assets/css/app-deferred.css";
    let loaded = false;
    let fallbackTimer = null;

    function loadDeferredCss() {
        if (loaded || document.querySelector(`link[href="${href}"]`)) return;
        loaded = true;

        if (fallbackTimer) {
            window.clearTimeout(fallbackTimer);
        }

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.dataset.deferredCss = "true";
        document.head.appendChild(link);
    }

    function scheduleFallback() {
        const delay = window.matchMedia("(max-width: 768px)").matches ? 14000 : 11000;
        fallbackTimer = window.setTimeout(loadDeferredCss, delay);
    }

    const interactionEvents = ["scroll", "wheel", "pointerdown", "keydown", "touchstart"];
    interactionEvents.forEach((eventName) => {
        window.addEventListener(eventName, loadDeferredCss, { once: true, passive: true });
    });

    window.addEventListener("load", () => {
        if ("requestIdleCallback" in window) {
            window.requestIdleCallback(scheduleFallback, { timeout: 1800 });
            return;
        }

        scheduleFallback();
    }, { once: true });
})();
