function getFallbackProfile() {
    let performanceMode = "";
    try {
        const params = new URLSearchParams(window.location.search);
        performanceMode = params.get("lite") === "1" || params.get("performance") === "lite"
            ? "lite"
            : params.get("lite") === "0" || params.get("performance") === "full"
                ? "full"
                : localStorage.getItem("performance-mode") || "";
    } catch {
        performanceMode = "";
    }

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const slowConnection = ["slow-2g", "2g", "3g"].includes(connection?.effectiveType || "");
    const saveData = Boolean(connection?.saveData);
    const lowMemory = Number(navigator.deviceMemory || 0) > 0 && Number(navigator.deviceMemory || 0) <= 2;
    const lowCpu = Number(navigator.hardwareConcurrency || 0) > 0 && Number(navigator.hardwareConcurrency || 0) <= 4;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 640px)").matches;
    const tablet = window.matchMedia("(min-width: 641px) and (max-width: 1024px)").matches;
    const constrained = slowConnection || saveData || lowMemory || reducedMotion;
    let name = "desktop-full";

    if (performanceMode === "lite") name = "mobile-lite";
    else if (performanceMode === "full") name = "desktop-full";
    else if (mobile || constrained) name = "mobile-lite";
    else if (tablet) name = "tablet-balanced";
    else if (lowCpu) name = "desktop-balanced";

    return {
        name,
        lowPower: name === "mobile-lite",
        networkCanvasEnabled: name !== "mobile-lite"
    };
}

const profile = window.PortfolioPerformance || getFallbackProfile();

if (!profile.networkCanvasEnabled) {
    document.documentElement.dataset.lowPower = profile.lowPower ? "1" : document.documentElement.dataset.lowPower || "0";
    document.documentElement.dataset.deviceTier = profile.lowPower ? "lite" : document.documentElement.dataset.deviceTier || "balanced";
    document.documentElement.dataset.deviceProfile = profile.name || document.documentElement.dataset.deviceProfile || "mobile-lite";
} else {
    const loadNetworkScene = () => import("./main.js");
    const idleTimeout = profile.name === "tablet-balanced" ? 1800 : 1200;

    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(loadNetworkScene, { timeout: idleTimeout });
    } else {
        window.setTimeout(loadNetworkScene, profile.name === "tablet-balanced" ? 500 : 200);
    }
}
