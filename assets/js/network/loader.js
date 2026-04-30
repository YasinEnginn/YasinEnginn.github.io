function detectLowPower() {
    const profile = window.PortfolioPerformance;
    if (profile && typeof profile.lowPower === "boolean") return profile.lowPower;

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

    if (performanceMode === "lite") return true;
    if (performanceMode === "full") return false;

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const slowConnection = ["slow-2g", "2g", "3g"].includes(connection?.effectiveType || "");
    const saveData = Boolean(connection?.saveData);
    const lowMemory = Number(navigator.deviceMemory || 0) > 0 && Number(navigator.deviceMemory || 0) <= 2;
    const lowCpu = Number(navigator.hardwareConcurrency || 0) > 0 && Number(navigator.hardwareConcurrency || 0) <= 4;

    return window.matchMedia("(max-width: 900px)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        slowConnection ||
        saveData ||
        lowMemory ||
        lowCpu;
}

const lowPower = detectLowPower();

if (lowPower) {
    document.documentElement.dataset.lowPower = "1";
    document.documentElement.dataset.deviceTier = "lite";
} else {
    const loadNetworkScene = () => import("./main.js");

    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(loadNetworkScene, { timeout: 1200 });
    } else {
        window.setTimeout(loadNetworkScene, 200);
    }
}
