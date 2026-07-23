(() => {
    const href = "assets/css/app-deferred.css";
    let loaded = false;

    function loadDeferredCss() {
        if (loaded || document.querySelector(`link[href="${href}"]`)) return;
        loaded = true;

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.dataset.deferredCss = "true";
        document.head.appendChild(link);
    }

    function scheduleLoad() {
        if ("requestIdleCallback" in window) {
            window.requestIdleCallback(loadDeferredCss, { timeout: 1200 });
            return;
        }

        window.setTimeout(loadDeferredCss, 300);
    }

    const interactionEvents = ["scroll", "wheel", "pointerdown", "keydown", "touchstart"];
    interactionEvents.forEach((eventName) => {
        window.addEventListener(eventName, loadDeferredCss, { once: true, passive: true });
    });

    if (document.readyState === "complete") {
        scheduleLoad();
    } else {
        window.addEventListener("load", scheduleLoad, { once: true });
    }
})();
