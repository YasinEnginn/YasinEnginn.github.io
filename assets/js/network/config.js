function deepFreeze(obj) {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach((prop) => {
        const value = obj[prop];
        if (value && typeof value === "object" && !Object.isFrozen(value)) {
            deepFreeze(value);
        }
    });
    return obj;
}

export const config = deepFreeze({
    colors: {
        skyTop: "#030711",
        skyBottom: "#0c1424",
        binarySunA: "#fbbf24",
        binarySunB: "#f97316",
        binarySunGlow: "rgba(251, 191, 36, 0.25)",
        deathStar: "#9ca3af",
        deathStarTrench: "#6b7280",
        deathStarCrater: "rgba(75, 85, 99, 0.7)",
        horizonDust: "rgba(255, 186, 120, 0.12)",
        text: "rgba(230, 240, 255, 0.72)",
        skylineNear: "#1a2f42",
        skylineMid: "#152838",
        skylineFar: "#10212f",
        cityGlow: "rgba(255, 190, 120, 0.12)",
        cityBand: "rgba(255, 200, 150, 0.14)",
        cityWindow: "rgba(255, 220, 170, 0.22)",
        trafficWarm: "rgba(255, 205, 145, 0.7)",
        trafficCool: "rgba(140, 225, 255, 0.66)",
        battleSith: "rgba(255, 90, 90, 0.42)",
        battleJedi: "rgba(120, 210, 255, 0.42)",
        battleDotSith: "rgba(255, 160, 160, 0.3)",
        battleDotJedi: "rgba(170, 230, 255, 0.3)",
        landmarkMain: "rgba(34, 56, 78, 0.95)",
        landmarkTrim: "rgba(140, 210, 255, 0.55)",
        landmarkGlow: "rgba(255, 210, 160, 0.14)",
        groundFill: "#1b2a35",
        groundLine: "#2f495e",
        oceanTop: "rgba(16, 90, 130, 0.34)",
        oceanBottom: "rgba(4, 16, 36, 0.9)",
        meshLink: "rgba(120, 220, 255, 0.22)",
        carLink: "rgba(255, 190, 70, 0.24)",
        towerColor: "#8aa9bf",
        relayColor: "#7ee3ff",
        homeColor: "#c5d6e8",
        shipColor: "#6f879b",
        hubColor: "#9bd7ff",
        hubGlow: "rgba(120, 210, 255, 0.32)",
        cellColor: "#f59e0b",
        dishColor: "#cfe6f8",
        outpostColor: "rgba(30, 55, 75, 0.9)",
        telecomCore: "rgba(24, 40, 58, 0.95)",
        telecomTrim: "rgba(120, 200, 255, 0.65)",
        darkFiber: "rgba(30, 80, 110, 0.28)",
        darkFiberGlow: "rgba(120, 200, 255, 0.1)",
        packetSubsea: "#00e5ff",
        packetLEO: "#f59e0b",
        packetMEO: "#0ea5e9",
        packetGEO: "#d946ef",
        linkLEO: "#f59e0b",
        linkMEO: "#0ea5e9",
        linkGEO: "#d946ef",
        linkSubsea: "#00e5ff",
        ripple: "rgba(135, 230, 255, 0.18)",
        telemetryPanel: "rgba(5, 14, 24, 0.72)",
        telemetryStroke: "rgba(120, 210, 255, 0.42)",
        telemetryText: "rgba(232, 242, 255, 0.88)",
        telemetryMuted: "rgba(170, 196, 220, 0.74)",
    },
    counts: {
        satellites: { LEO: 7, MEO: 3, GEO: 2 },
        towers: 5,
        homes: 8,
        cars: 4,
        ships: 2,
        marineRelays: 3,
        subseaHabitats: 3,
        cities: 4,
        fibers: 6,
        edgeHubs: 3,
        microwaveRelays: 4,
        smallCells: 7,
        outposts: 3,
        telecomBuildings: 4,
        darkFibers: 5,
        skyTraffic: 10,
        factionShips: {
            SITH: 2,
            JEDI: 2,
            SEPARATIST: 2,
            BOUNTY: 1,
            TRADER: 2,
            REBEL: 2,
        },
        skirmishers: 6,
    },
    speeds: {
        satellite: { LEO: 92, MEO: 44, GEO: 14 },
        station: 9,
        ship: 12,
        car: 22,
        packet: 0.88,
        skyTraffic: 26,
        factionShip: { LEO: 82, MEO: 44, GEO: 16 },
    },
    geometry: {
        ground: {
            baseOffset: 46,
            curveHeight: 120,
            curveWidthFactor: 0.62,
            coastlineRatio: 0.58,
        },
        ocean: { surfaceOffset: 15 },
        orbit: { curveDepth: 42, curveWidthFactor: 0.63 },
    },
    ui: {
        fontMono: "600 12px 'Courier New', monospace",
        fontBody: "11px Inter, sans-serif",
        panel: { hoverWidth: 320, hoverHeight: 64, selectedWidth: 460, selectedHeight: 214 },
    },
    motion: {
        ambientSpeedScale: 0.74,
        wobbleScale: 0.72,
        twinkleScale: 0.58,
        packetSpeedScale: 0.82,
        packetCurveScale: 0.62,
        packetTrailAlpha: 0.26,
        rippleScale: 0.7,
        linkAlphaScale: 0.82,
        spawnIntervalScale: 1.45,
        orbitDashSpeed: 0.018,
        orbitLineAlpha: 0.34,
        commPulseSpeed: 0.000085,
        commBadgeAlpha: 0.8,
    },
    network: {
        layers: {
            GEO: { coverageKm: 9000, propagationKmPerMs: 119, floorLatencyMs: 296, processingMs: 18, jitterMs: 14, jitterPer1000Km: 0.46, throughputGbps: 42, cadenceHz: 0.18 },
            MEO: { coverageKm: 4500, propagationKmPerMs: 167, floorLatencyMs: 72, processingMs: 10, jitterMs: 5.8, jitterPer1000Km: 0.34, throughputGbps: 58, cadenceHz: 0.34 },
            LEO: { coverageKm: 1700, propagationKmPerMs: 204, floorLatencyMs: 16, processingMs: 4, jitterMs: 2.2, jitterPer1000Km: 0.18, throughputGbps: 86, cadenceHz: 0.62 },
            SUBSEA: { coverageKm: 10000, propagationKmPerMs: 204, floorLatencyMs: 31, processingMs: 7, jitterMs: 3.2, jitterPer1000Km: 0.14, throughputGbps: 132, cadenceHz: 1.35 },
            ACCESS: { coverageKm: 180, propagationKmPerMs: 198, floorLatencyMs: 9, processingMs: 8, jitterMs: 2.6, jitterPer1000Km: 0.9, throughputGbps: 12, cadenceHz: 7.5 },
            MESH: { coverageKm: 420, propagationKmPerMs: 201, floorLatencyMs: 6, processingMs: 4, jitterMs: 1.4, jitterPer1000Km: 0.38, throughputGbps: 24, cadenceHz: 4.2 },
        },
    },
});

export const QUALITY = deepFreeze({
    HIGH: { stars: 160, groundSteps: 96, oceanSteps: 84, orbitStep: 10, caustics: 10, skylineScale: 1.05 },
    BALANCED: { stars: 120, groundSteps: 72, oceanSteps: 56, orbitStep: 14, caustics: 7, skylineScale: 0.98 },
    LOW: { stars: 70, groundSteps: 48, oceanSteps: 36, orbitStep: 22, caustics: 3, skylineScale: 0.76 },
});

export const runtime = {
    quality: "LOW",
    profile: "mobile-lite",
    canvasEnabled: false,
    frameInterval: Number.POSITIVE_INFINITY,
    lowPower: true,
};

const QUALITY_BY_PROFILE = {
    "desktop-full": "HIGH",
    "desktop-balanced": "BALANCED",
    "tablet-balanced": "LOW",
    "mobile-lite": "LOW",
};

const FRAME_INTERVAL_BY_PROFILE = {
    "desktop-full": 33.3,
    "desktop-balanced": 41.7,
    "tablet-balanced": 83.3,
    "mobile-lite": Number.POSITIVE_INFINITY,
};

export function detectLowPower() {
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

    const slow = ["slow-2g", "2g", "3g"];
    const conn = navigator.connection?.effectiveType;
    return window.matchMedia("(max-width: 640px)").matches
        || window.matchMedia("(prefers-reduced-motion: reduce)").matches
        || navigator.connection?.saveData
        || (Number(navigator.deviceMemory || 0) > 0 && Number(navigator.deviceMemory || 0) <= 2)
        || slow.includes(conn);
}

export function applyRuntimeProfile() {
    const profile = window.PortfolioPerformance;
    const fallbackName = detectLowPower()
        ? "mobile-lite"
        : window.matchMedia("(min-width: 641px) and (max-width: 1024px)").matches
            ? "tablet-balanced"
            : (Number(navigator.hardwareConcurrency || 0) > 0 && Number(navigator.hardwareConcurrency || 0) <= 4)
                ? "desktop-balanced"
                : "desktop-full";
    const name = profile?.name || fallbackName;

    runtime.profile = name;
    runtime.lowPower = Boolean(profile?.lowPower ?? name === "mobile-lite");
    runtime.canvasEnabled = Boolean(profile?.networkCanvasEnabled ?? name !== "mobile-lite");
    runtime.quality = QUALITY_BY_PROFILE[name] || "BALANCED";
    runtime.frameInterval = Number(profile?.networkFrameInterval || FRAME_INTERVAL_BY_PROFILE[name] || 41.7);

    return runtime;
}

applyRuntimeProfile();

export const translations = deepFreeze({
    en: {
        systemStatus: "GLOBAL NETWORK TELEMETRY: ONLINE",
        orbits: {
            geo: {
                name: "GEO",
                full: "GEOSTATIONARY BACKBONE",
                info: "One-way ~296 ms | sigma-jitter ~14 ms | stable broadcast and backhaul",
            },
            meo: {
                name: "MEO",
                full: "MIDDLE EARTH NETWORK",
                info: "One-way ~72 ms | sigma-jitter ~5.8 ms | regional timing and transit",
            },
            leo: {
                name: "LEO",
                full: "LOW EARTH CONSTELLATION",
                info: "One-way ~16 ms | sigma-jitter ~2.2 ms | edge broadband and fast handoff",
            },
            subsea: {
                name: "SUBSEA",
                full: "SUBSEA FIBER CORE",
                info: "One-way ~31 ms / 10,000km | optical backbone with low jitter envelope",
            },
        },
    },
    tr: {
        systemStatus: "KÜRESEL AĞ TELEMETRİSİ: AKTİF",
        orbits: {
            geo: {
                name: "GEO",
                full: "JEOSTASYONER OMURGA",
                info: "Tek yön ~296 ms | sigma-jitter ~14 ms | kararlı yayın ve geri taşıma",
            },
            meo: {
                name: "MEO",
                full: "ORTA YÖRÜNGE AĞI",
                info: "Tek yön ~72 ms | sigma-jitter ~5.8 ms | bölgesel zamanlama ve transit",
            },
            leo: {
                name: "LEO",
                full: "ALÇAK YÖRÜNGE TAKIMYILDIZI",
                info: "Tek yön ~16 ms | sigma-jitter ~2.2 ms | hızlı uç erişim ve geniş bant bağlantısı",
            },
            subsea: {
                name: "SUBSEA",
                full: "DENİZ ALTI FİBER OMURGA",
                info: "Tek yön ~31 ms / 10.000 km | düşük jitter'lı optik omurga",
            },
        },
    },
});

export const SUPPORTED_LANGS = ["en", "tr"];
export const DEFAULT_LANG = "en";

let currentLang = DEFAULT_LANG;

export function readLang() {
    const value = localStorage.getItem("selectedLanguage");
    return SUPPORTED_LANGS.includes(value) ? value : DEFAULT_LANG;
}

export function setLang(lang) {
    const safe = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
    currentLang = safe;
    localStorage.setItem("selectedLanguage", safe);
}

export function updateLanguage() {
    currentLang = readLang();
}

export function getCurrentLang() {
    return currentLang;
}

export function getOrbits(lang) {
    const t = translations[lang]?.orbits || translations[DEFAULT_LANG].orbits;
    const models = config.network.layers;
    return [
        {
            id: "GEO",
            name: t.geo.name,
            full: t.geo.full,
            info: t.geo.info,
            altRatio: 0.16,
            color: config.colors.linkGEO,
            latencyMs: models.GEO.floorLatencyMs,
            rttMs: Math.round(models.GEO.floorLatencyMs * 2),
            jitterMs: models.GEO.jitterMs,
            throughputGbps: models.GEO.throughputGbps,
            cadenceHz: models.GEO.cadenceHz,
            propagationKmPerMs: models.GEO.propagationKmPerMs,
            coverageKm: models.GEO.coverageKm,
        },
        {
            id: "MEO",
            name: t.meo.name,
            full: t.meo.full,
            info: t.meo.info,
            altRatio: 0.36,
            color: config.colors.linkMEO,
            latencyMs: models.MEO.floorLatencyMs,
            rttMs: Math.round(models.MEO.floorLatencyMs * 2),
            jitterMs: models.MEO.jitterMs,
            throughputGbps: models.MEO.throughputGbps,
            cadenceHz: models.MEO.cadenceHz,
            propagationKmPerMs: models.MEO.propagationKmPerMs,
            coverageKm: models.MEO.coverageKm,
        },
        {
            id: "LEO",
            name: t.leo.name,
            full: t.leo.full,
            info: t.leo.info,
            altRatio: 0.56,
            color: config.colors.linkLEO,
            latencyMs: models.LEO.floorLatencyMs,
            rttMs: Math.round(models.LEO.floorLatencyMs * 2),
            jitterMs: models.LEO.jitterMs,
            throughputGbps: models.LEO.throughputGbps,
            cadenceHz: models.LEO.cadenceHz,
            propagationKmPerMs: models.LEO.propagationKmPerMs,
            coverageKm: models.LEO.coverageKm,
        },
        {
            id: "SUBSEA",
            name: t.subsea.name,
            full: t.subsea.full,
            info: t.subsea.info,
            altRatio: 0.9,
            color: config.colors.linkSubsea,
            latencyMs: models.SUBSEA.floorLatencyMs,
            rttMs: Math.round(models.SUBSEA.floorLatencyMs * 2),
            jitterMs: models.SUBSEA.jitterMs,
            throughputGbps: models.SUBSEA.throughputGbps,
            cadenceHz: models.SUBSEA.cadenceHz,
            propagationKmPerMs: models.SUBSEA.propagationKmPerMs,
            coverageKm: models.SUBSEA.coverageKm,
        },
    ];
}
