(() => {
    const profile = window.PortfolioPerformance;
    const disabled = profile?.networkCanvasEnabled === false || window.matchMedia("(max-width: 768px)").matches;
    let loaded = false;

    if (disabled) return;

    const loadNetwork = () => {
        if (loaded) return;
        loaded = true;

        import("./netsatbench-reference-model.js").catch((error) => {
            console.warn("NetSatBench reference model could not be loaded.", error);
        });
    };

    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(loadNetwork, { timeout: 1800 });
    } else {
        window.setTimeout(loadNetwork, 500);
    }
})();
