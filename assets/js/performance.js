(() => {
const htmlEl = document.documentElement;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function getPerformanceProfile() {
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get("lite") === "1" || params.get("performance") === "lite"
        ? "lite"
        : params.get("lite") === "0" || params.get("performance") === "full"
            ? "full"
            : "";
    let storedMode = "";
    try {
        if (requestedMode) {
            localStorage.setItem("performance-mode", requestedMode);
        }
        storedMode = localStorage.getItem("performance-mode") || "";
    } catch {
        storedMode = "";
    }

    const viewportWidth = window.innerWidth || htmlEl.clientWidth || 1024;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const effectiveType = connection?.effectiveType || "";
    const slowConnection = ["slow-2g", "2g", "3g"].includes(effectiveType);
    const saveData = Boolean(connection?.saveData);
    const deviceMemory = Number(navigator.deviceMemory || 0);
    const cpuCores = Number(navigator.hardwareConcurrency || 0);
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const isTablet = window.matchMedia("(min-width: 641px) and (max-width: 1024px)").matches;
    const isDesktop = window.matchMedia("(min-width: 1025px)").matches;
    const compactViewport = window.matchMedia("(max-width: 520px)").matches;
    const reducedMotion = prefersReducedMotion.matches;
    const lowMemory = deviceMemory > 0 && deviceMemory <= 2;
    const lowCpu = cpuCores > 0 && cpuCores <= 4;
    const constrainedDevice = lowMemory || slowConnection || saveData || reducedMotion;
    let name = "desktop-full";

    if (storedMode === "lite") {
        name = "mobile-lite";
    } else if (storedMode === "full") {
        name = "desktop-full";
    } else if (isMobile || constrainedDevice) {
        name = "mobile-lite";
    } else if (isTablet) {
        name = "tablet-balanced";
    } else if (lowCpu) {
        name = "desktop-balanced";
    }

    const lowPower = name === "mobile-lite";
    const balanced = name.endsWith("balanced");
    const networkFrameInterval = name === "desktop-full"
        ? 33.3
        : name === "desktop-balanced"
            ? 41.7
            : name === "tablet-balanced"
                ? 83.3
                : Number.POSITIVE_INFINITY;
    const networkQuality = name === "desktop-full"
        ? "HIGH"
        : name === "desktop-balanced"
            ? "BALANCED"
            : name === "tablet-balanced"
                ? "LOW"
                : "NONE";

    return {
        name,
        tier: lowPower ? "lite" : balanced ? "balanced" : "full",
        mode: storedMode || "auto",
        lowPower,
        reducedEffects: lowPower || balanced,
        mobile: isMobile,
        tablet: isTablet,
        desktop: isDesktop,
        compact: compactViewport,
        viewportWidth,
        slowConnection,
        saveData,
        lowMemory,
        lowCpu,
        reducedMotion,
        limitedDevice: constrainedDevice || lowCpu,
        networkCanvasEnabled: networkQuality !== "NONE",
        networkQuality,
        networkFrameInterval,
        terminalEnabled: name.startsWith("desktop"),
        commandPaletteEnabled: name !== "mobile-lite",
        revealAnimations: name === "desktop-full",
        geometryInteractions: name === "desktop-full"
    };
}

const performanceProfile = getPerformanceProfile();
htmlEl.dataset.deviceTier = performanceProfile.tier;
htmlEl.dataset.deviceProfile = performanceProfile.name;
htmlEl.dataset.deviceClass = performanceProfile.mobile ? "mobile" : performanceProfile.tablet ? "tablet" : "desktop";
htmlEl.dataset.lowPower = performanceProfile.lowPower ? "1" : "0";
htmlEl.dataset.reducedEffects = performanceProfile.reducedEffects ? "1" : "0";
htmlEl.dataset.mobileLite = performanceProfile.lowPower ? "1" : "0";
window.PortfolioPerformance = Object.freeze(performanceProfile);

    const App = window.PortfolioApp = window.PortfolioApp || {};
    App.performanceProfile = performanceProfile;
    App.prefersReducedMotion = prefersReducedMotion;
    App.getPerformanceProfile = getPerformanceProfile;
})();
