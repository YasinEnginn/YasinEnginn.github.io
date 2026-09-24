(() => {
    const profile = window.PortfolioPerformance;
    const disabled = profile?.networkCanvasEnabled === false || window.matchMedia("(max-width: 768px)").matches;
    let loaded = false;

    if (disabled) return;

    const loadNetwork = () => {
        if (loaded) return;
        loaded = true;

        import("./network/loader.js").catch((error) => {
            console.warn("Network background could not be loaded.", error);
        });
    };

    const delay = profile?.name === "desktop-full" ? 30000 : 36000;
    const interactionEvents = ["scroll", "wheel", "pointerdown", "keydown", "touchstart"];

    interactionEvents.forEach((eventName) => {
        window.addEventListener(eventName, loadNetwork, { once: true, passive: true });
    });

    window.addEventListener("load", () => {
        window.setTimeout(loadNetwork, delay);
    }, { once: true });
})();
