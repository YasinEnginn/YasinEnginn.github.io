import { config, updateLanguage, QUALITY, runtime, detectLowPower, applyRuntimeProfile } from "./config.js";
import {
    rand,
    clamp,
    getGroundY,
    computeLinkAlpha,
    orbitCoverageWidth,
    packetColorByLayer,
    estimateLinkTelemetry,
    arcControlPoint,
    quadraticPoint,
} from "./helpers.js";
import * as Entities from "./entities.js";
import { drawStaticBackground, drawStars, drawOceanVolume, drawOrbitLines, drawOrbitUI, drawTelemetryBadges } from "./render.js";

(() => {
const LOG_PREFIX = "[network-canvas]";
const DEBUG_LOGS = (() => {
    try {
        return localStorage.getItem("debugNetworkCanvas") === "1";
    } catch {
        return false;
    }
})();
const logInfo = (msg, data) => {
    if (!DEBUG_LOGS) return;
    if (data !== undefined) console.info(`${LOG_PREFIX} ${msg}`, data);
    else console.info(`${LOG_PREFIX} ${msg}`);
};
const logWarn = (msg, data) => {
    if (!DEBUG_LOGS) return;
    if (data !== undefined) console.warn(`${LOG_PREFIX} ${msg}`, data);
    else console.warn(`${LOG_PREFIX} ${msg}`);
};
const logError = (msg, data) => {
    if (data !== undefined) console.error(`${LOG_PREFIX} ${msg}`, data);
    else console.error(`${LOG_PREFIX} ${msg}`);
};

const canvas = document.getElementById("network-canvas");
if (!canvas) {
    logError("Canvas element not found: #network-canvas");
    return;
}

const ctx = canvas.getContext("2d");
if (!ctx) {
    logError("2D context unavailable for #network-canvas.");
    return;
}

const staticCanvas = document.createElement("canvas");
const staticCtx = staticCanvas.getContext("2d");
if (!staticCtx) {
    logError("2D context unavailable for static canvas.");
    return;
}

let width = 0;
let height = 0;
let qSettings = QUALITY.BALANCED;
let orbitRegions = [];
let selectedOrbitId = null;
let mouseX = -9999;
let mouseY = -9999;
let lastTime = 0;
let resizeTimer = null;
let loggedReady = false;
let animationFrameId = null;
let canvasVisible = true;

let lastLang = localStorage.getItem("selectedLanguage") || document.documentElement.lang;
let lastQuality = localStorage.getItem("quality");
applyRuntimeProfile();
const canvasDisabled = !(runtime.canvasEnabled ?? !detectLowPower());
const profileName = runtime.profile || "desktop-balanced";
const motion = config.motion;

const FRAME_INTERVAL = Number.isFinite(runtime.frameInterval) ? runtime.frameInterval : 41.7;

function requestNextFrame() {
    animationFrameId = requestAnimationFrame(animate);
}

function stopAnimation() {
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    lastTime = 0;
}

function startAnimation() {
    if (canvasDisabled || document.hidden || !canvasVisible || animationFrameId !== null) return;
    requestNextFrame();
}

function normalizeRatio(index, total, phase = 0) {
    const safeTotal = Math.max(total, 1);
    const raw = ((index + 0.5) / safeTotal + phase) % 1;
    return raw < 0 ? raw + 1 : raw;
}

function harmonyWave(index, phase = 0, frequency = 1.61803398875) {
    return Math.sin((index + 1) * frequency + phase * Math.PI * 2);
}

function harmonicX(min, max, index, total, phase = 0, amplitude = 0.04) {
    const span = Math.max(max - min, 0);
    if (!span) return min;
    const ratio = normalizeRatio(index, total, phase);
    const offset = harmonyWave(index, phase) * amplitude;
    return clamp(min + span * (ratio + offset), min, max);
}

function harmonicSpeed(base, index, variance = 0.06, phase = 0) {
    return base * (1 + harmonyWave(index, phase) * variance);
}

function alternatingDirection(index, phase = 0) {
    return ((index + phase) % 2 === 0) ? 1 : -1;
}

function phaseAngle(index, total, phase = 0) {
    return normalizeRatio(index, total, phase) * Math.PI * 2;
}

function pickSpacedX(min, max, radius, occupied, attempts = 40, pattern = {}) {
    if (max <= min) return min;
    const candidateTotal = pattern.total ?? Math.max(occupied.length + attempts, 1);
    const baseIndex = pattern.index ?? occupied.length;
    const phase = pattern.phase ?? 0;
    const amplitude = pattern.amplitude ?? 0.04;
    for (let i = 0; i < attempts; i++) {
        const x = harmonicX(min, max, baseIndex + i, candidateTotal, phase, amplitude);
        let ok = true;
        for (let j = 0; j < occupied.length; j++) {
            const other = occupied[j];
            if (Math.abs(x - other.x) < radius + other.r) {
                ok = false;
                break;
            }
        }
        if (ok) return x;
    }
    return harmonicX(min, max, baseIndex, candidateTotal, phase, amplitude * 0.5);
}

let stars = [];
let satellites = [];
let towers = [];
let homes = [];
let cars = [];
let marineRelays = [];
let subseaHabitats = [];
let ships = [];
let fibers = [];
let cities = [];
let outposts = [];
let edgeHubs = [];
let microwaveRelays = [];
let smallCells = [];
let telecomBuildings = [];
let darkFibers = [];
let spaceGateway = null;
let oceanCaustics = [];
let skyTraffic = [];
let factionShips = [];
let skirmishers = [];
const satelliteBuckets = {
    GEO: [],
    MEO: [],
    LEO: [],
};

const packetPool = [];
const freePackets = [];
const MAX_PACKETS = profileName === "desktop-full" ? 72 : profileName === "desktop-balanced" ? 52 : profileName === "tablet-balanced" ? 24 : 0;

const ripplePool = [];
const freeRipples = [];
const MAX_RIPPLES = profileName === "desktop-full" ? 28 : profileName === "desktop-balanced" ? 18 : profileName === "tablet-balanced" ? 8 : 0;

const trafficTimers = {
    mesh: 0,
    uplinkLEO: 0,
    uplinkMEO: 0,
    uplinkGEO: 0,
    interLayer: 0,
    subsea: 0,
    access: 0,
};

for (let i = 0; i < MAX_PACKETS; i++) {
    const packet = new Entities.Packet();
    packet._free = true;
    packetPool.push(packet);
    freePackets.push(packet);
}
for (let i = 0; i < MAX_RIPPLES; i++) {
    const ripple = new Entities.Ripple();
    ripple._free = true;
    ripplePool.push(ripple);
    freeRipples.push(ripple);
}

function getTopPoint(tower) {
    return { x: tower.x, y: tower.y - tower.height };
}

function generateSkylineLayer(count, avgHeight, color) {
    const layer = {
        color,
        baseY: height,
        windowColor: config.colors.cityWindow,
        bandColor: config.colors.cityBand,
        buildings: [],
        bands: [],
    };
    const totalWidth = width + 240;
    const moduleBase = totalWidth / Math.max(1, count);
    let x = -120;
    const typePattern = ["BLOCK", "TIER", "SLANT", "SPIRE", "PLATFORM", "DOME", "BLOCK", "TIER"];

    for (let i = 0; i < count && x < width + 140; i++) {
        const waveA = Math.sin((i + 1) * 0.62) * 0.5 + Math.sin((i + 1) * 1.7) * 0.35;
        const waveB = Math.cos((i + 1) * 0.38) * 0.18;
        const heightFactor = 0.68 + 0.38 * (0.5 + waveA * 0.5) + waveB;
        const widthFactor = 0.78 + 0.35 * (0.5 + Math.sin((i + 1) * 0.9) * 0.5);
        const w = Math.max(26, moduleBase * widthFactor);
        const h = Math.max(avgHeight * 0.45, avgHeight * heightFactor);
        const type = typePattern[i % typePattern.length];
        const windowRows = Math.max(2, Math.floor(h / 22));

        layer.buildings.push({
            x,
            w,
            h,
            type,
            windowRows,
            bandInset: 0.12,
            capH: h * 0.22,
            capW: w * 0.58,
            deckH: Math.max(4, h * 0.08),
        });

        x += w * 0.88;
    }

    const bandCount = 2 + (count % 2);
    for (let i = 0; i < bandCount; i++) {
        layer.bands.push({
            offset: avgHeight * (0.28 + i * 0.18 + Math.sin(i * 1.4) * 0.03),
            alpha: 0.18 - i * 0.04,
        });
    }

    return layer;
}

function pickLayerForRole(role, index = 0) {
    if (role === "freighter" || role === "cruiser") return index % 2 === 0 ? "MEO" : "GEO";
    if (role === "corvette" || role === "bomber") return index % 2 === 0 ? "LEO" : "MEO";
    if (role === "shuttle") return index % 2 === 0 ? "MEO" : "LEO";
    return index % 3 === 0 ? "MEO" : "LEO";
}

function reclaimPools() {
    freePackets.length = 0;
    for (const packet of packetPool) {
        packet.active = false;
        packet.finished = false;
        packet._free = true;
        freePackets.push(packet);
    }

    freeRipples.length = 0;
    for (const ripple of ripplePool) {
        ripple.active = false;
        ripple._free = true;
        freeRipples.push(ripple);
    }
}

function resetSatelliteBuckets() {
    satelliteBuckets.GEO.length = 0;
    satelliteBuckets.MEO.length = 0;
    satelliteBuckets.LEO.length = 0;
}

function registerSatellite(sat) {
    satellites.push(sat);
    if (sat?.layer && satelliteBuckets[sat.layer]) {
        satelliteBuckets[sat.layer].push(sat);
    }
}

function getSatellitesByLayer(layer) {
    return satelliteBuckets[layer] || [];
}

function spawnPacket(start, end, color, type = "TRANSIT") {
    if (freePackets.length === 0 || !start || !end) return;
    const packet = freePackets.pop();
    packet._free = false;
    packet.spawn(start, end, color, type);
}

function spawnRipple(x, y, color) {
    if (freeRipples.length === 0) return;
    const ripple = freeRipples.pop();
    ripple._free = false;
    ripple.spawn(x, y, color);
}

function getQualitySettings() {
    const fromStorage = localStorage.getItem("quality");
    if (fromStorage && QUALITY[fromStorage]) return { name: fromStorage, settings: QUALITY[fromStorage] };
    if (runtime.quality && QUALITY[runtime.quality]) return { name: runtime.quality, settings: QUALITY[runtime.quality] };
    if (canvasDisabled) return { name: "LOW", settings: QUALITY.LOW };
    return { name: "BALANCED", settings: QUALITY.BALANCED };
}

function buildScene() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    staticCanvas.width = Math.floor(width * dpr);
    staticCanvas.height = Math.floor(height * dpr);
    staticCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const quality = getQualitySettings();
    runtime.quality = quality.name;
    qSettings = quality.settings;
    lastQuality = quality.name;

    updateLanguage();
    reclaimPools();

    stars = [];
    satellites = [];
    towers = [];
    homes = [];
    cars = [];
    marineRelays = [];
    subseaHabitats = [];
    ships = [];
    fibers = [];
    cities = [];
    outposts = [];
    edgeHubs = [];
    microwaveRelays = [];
    smallCells = [];
    telecomBuildings = [];
    darkFibers = [];
    oceanCaustics = [];
    orbitRegions = [];
    selectedOrbitId = null;
    skyTraffic = [];
    factionShips = [];
    skirmishers = [];
    resetSatelliteBuckets();

    for (let i = 0; i < qSettings.stars; i++) stars.push(new Entities.Star(width, height));

    const skirmishScale = qSettings.skylineScale || 1;
    const skirmishCount = Math.max(8, Math.floor((config.counts.skirmishers || 14) * skirmishScale));
    const skirmishBounds = {
        xMin: width * 0.08,
        xMax: width * 0.92,
        yMin: height * 0.08,
        yMax: height * 0.3,
    };
    for (let i = 0; i < skirmishCount; i++) {
        const faction = i % 2 === 0 ? "JEDI" : "SITH";
        skirmishers.push(new Entities.DistantSkirmisher(width, height, faction, skirmishBounds));
    }

    const skylineScale = qSettings.skylineScale || 1;
    const skylineFar = generateSkylineLayer(Math.floor(180 * skylineScale), height * 0.42, config.colors.skylineFar);
    skylineFar.baseY = height * 0.9;
    const skylineMid = generateSkylineLayer(Math.floor(120 * skylineScale), height * 0.3, config.colors.skylineMid);
    skylineMid.baseY = height * 0.95;
    const skylineNear = generateSkylineLayer(Math.floor(72 * skylineScale), height * 0.2, config.colors.skylineNear);
    skylineNear.baseY = height * 0.99;
    const skyline = [skylineFar, skylineMid, skylineNear];

    const groundBlocks = [];
    for (let i = 0; i <= qSettings.groundSteps; i++) {
        if (i % 2 === 0) {
            groundBlocks.push({
                i,
                h: 4 + Math.abs(Math.sin((i + 1) * 1.17)) * 14,
            });
        }
    }
    const landmarkScale = Math.min(width, height);
    const landmarks = [
        {
            type: "SENATE_DOME",
            x: width * 0.62,
            baseY: height * 0.9,
            w: Math.max(120, landmarkScale * 0.18),
            h: Math.max(70, landmarkScale * 0.14),
            glow: config.colors.landmarkGlow,
        },
        {
            type: "TWIN_TEMPLE",
            x: width * 0.28,
            baseY: height * 0.9,
            w: Math.max(80, landmarkScale * 0.12),
            h: Math.max(130, landmarkScale * 0.22),
        },
        {
            type: "RING_TOWER",
            x: width * 0.76,
            baseY: height * 0.9,
            w: Math.max(70, landmarkScale * 0.1),
            h: Math.max(160, landmarkScale * 0.24),
        },
        {
            type: "PLATFORM_CORE",
            x: width * 0.48,
            baseY: height * 0.92,
            w: Math.max(110, landmarkScale * 0.16),
            h: Math.max(70, landmarkScale * 0.12),
        },
        {
            type: "SPIRE_CLUSTER",
            x: width * 0.14,
            baseY: height * 0.9,
            w: Math.max(90, landmarkScale * 0.12),
            h: Math.max(120, landmarkScale * 0.2),
        },
    ];
    drawStaticBackground(staticCtx, width, height, skyline, groundBlocks, qSettings.groundSteps, landmarks);

    const coastX = width * config.geometry.ground.coastlineRatio;
    const landOccupied = [];
    const seaOccupied = [];
    const addOccupied = (list, x, r) => list.push({ x, r });
    const landRadius = {
        tower: 30,
        city: 70,
        telecom: 56,
        edgeHub: 52,
        outpost: 44,
        microwave: 34,
        smallCell: 24,
        home: 20,
    };
    const seaRadius = {
        relay: 46,
        habitat: 60,
    };

    for (let i = 0; i < config.counts.cities; i++) {
        const x = coastX * ((i + 1) / (config.counts.cities + 1));
        cities.push(new Entities.City(x));
        addOccupied(landOccupied, x, landRadius.city);
    }

    const towerCount = config.counts.towers;
    for (let i = 0; i < towerCount; i++) {
        const segStart = (coastX * i) / towerCount + 20;
        const segEnd = (coastX * (i + 1)) / towerCount - 20;
        const x = pickSpacedX(segStart, segEnd, landRadius.tower, landOccupied, 30, {
            index: i * 3,
            total: towerCount * 4,
            phase: 0.08,
            amplitude: 0.03,
        });
        towers.push(new Entities.StaticTower(x, width, height));
        addOccupied(landOccupied, x, landRadius.tower);
    }

    for (let i = 0; i < config.counts.telecomBuildings; i++) {
        const x = pickSpacedX(70, coastX - 70, landRadius.telecom, landOccupied, 40, {
            index: i * 2,
            total: Math.max(config.counts.telecomBuildings * 4, 1),
            phase: 0.14,
            amplitude: 0.035,
        });
        telecomBuildings.push(new Entities.TelecomBuilding(x, width, height));
        addOccupied(landOccupied, x, landRadius.telecom);
    }

    for (let i = 0; i < config.counts.edgeHubs; i++) {
        const x = pickSpacedX(70, coastX - 70, landRadius.edgeHub, landOccupied, 40, {
            index: i * 2,
            total: Math.max(config.counts.edgeHubs * 4, 1),
            phase: 0.31,
            amplitude: 0.035,
        });
        edgeHubs.push(new Entities.EdgeHub(x, width, height));
        addOccupied(landOccupied, x, landRadius.edgeHub);
    }

    for (let i = 0; i < config.counts.outposts; i++) {
        const x = pickSpacedX(60, coastX - 60, landRadius.outpost, landOccupied, 40, {
            index: i * 2,
            total: Math.max(config.counts.outposts * 5, 1),
            phase: 0.52,
            amplitude: 0.04,
        });
        outposts.push(new Entities.LandOutpost(x, width, height));
        addOccupied(landOccupied, x, landRadius.outpost);
    }

    for (let i = 0; i < config.counts.microwaveRelays; i++) {
        const x = pickSpacedX(50, coastX - 50, landRadius.microwave, landOccupied, 40, {
            index: i * 3,
            total: Math.max(config.counts.microwaveRelays * 5, 1),
            phase: 0.67,
            amplitude: 0.045,
        });
        microwaveRelays.push(new Entities.MicrowaveRelay(x, width, height));
        addOccupied(landOccupied, x, landRadius.microwave);
    }

    for (let i = 0; i < config.counts.smallCells; i++) {
        const x = pickSpacedX(40, coastX - 40, landRadius.smallCell, landOccupied, 32, {
            index: i * 2,
            total: Math.max(config.counts.smallCells * 5, 1),
            phase: 0.22,
            amplitude: 0.05,
        });
        smallCells.push(new Entities.SmallCell(x, width, height));
        addOccupied(landOccupied, x, landRadius.smallCell);
    }

    for (let i = 0; i < config.counts.homes; i++) {
        const x = pickSpacedX(40, coastX - 40, landRadius.home, landOccupied, 40, {
            index: i * 2,
            total: Math.max(config.counts.homes * 6, 1),
            phase: 0.42,
            amplitude: 0.055,
        });
        homes.push(new Entities.SmartHome(x, width, height));
        addOccupied(landOccupied, x, landRadius.home);
    }

    const convoyColors = ["#e67e22", "#3498db", "#f1c40f", "#ecf0f1", "#2ecc71"];
    for (let i = 0; i < config.counts.cars; i++) {
        const x = harmonicX(16, coastX - 16, i, config.counts.cars, 0.09, 0.04);
        const direction = alternatingDirection(i);
        cars.push(new Entities.SmartCar(x, width, height, {
            speed: direction * harmonicSpeed(config.speeds.car * 0.92, i, 0.08, 0.12),
            color: convoyColors[i % convoyColors.length],
        }));
    }

    for (let i = 0; i < config.counts.marineRelays; i++) {
        const x = pickSpacedX(coastX + 40, width - 40, seaRadius.relay, seaOccupied, 40, {
            index: i * 2,
            total: Math.max(config.counts.marineRelays * 5, 1),
            phase: 0.18,
            amplitude: 0.035,
        });
        marineRelays.push(new Entities.MarineRelay(x, width, height));
        addOccupied(seaOccupied, x, seaRadius.relay);
    }
    for (let i = 0; i < config.counts.subseaHabitats; i++) {
        const x = pickSpacedX(coastX + 50, width - 50, seaRadius.habitat, seaOccupied, 40, {
            index: i * 2,
            total: Math.max(config.counts.subseaHabitats * 5, 1),
            phase: 0.58,
            amplitude: 0.035,
        });
        subseaHabitats.push(new Entities.SubseaHabitat(x, width, height));
        addOccupied(seaOccupied, x, seaRadius.habitat);
    }
    let cruiseIndex = 0;
    for (let i = 0; i < config.counts.ships; i++) {
        const navalX = harmonicX(coastX + 34, width - 28, i, config.counts.ships, 0.06, 0.03);
        const navalDirection = alternatingDirection(i, 1);
        ships.push(new Entities.NavalShip(width, height, {
            startX: navalX,
            speed: navalDirection * harmonicSpeed(config.speeds.ship * 0.94, i, 0.06, 0.22),
            length: 48 + (i % 3) * 8,
            depthOffset: 18 + (i % 4) * 12,
        }));

        if (i % 2 === 0) {
            const cruiseTotal = Math.max(1, Math.ceil(config.counts.ships / 2));
            const cruiseX = harmonicX(coastX + 40, width - 24, cruiseIndex, cruiseTotal, 0.36, 0.03);
            const cruiseDirection = alternatingDirection(cruiseIndex);
            ships.push(new Entities.CruiseShip(cruiseX, width, height, {
                speed: cruiseDirection * harmonicSpeed(config.speeds.ship * 0.74, cruiseIndex, 0.05, 0.44),
                length: 62 + (cruiseIndex % 3) * 7,
            }));
            cruiseIndex += 1;
        }
    }

    for (let i = 0; i < config.counts.fibers; i++) {
        fibers.push(new Entities.UndergroundFiber(width, height));
    }
    for (let i = 0; i < config.counts.darkFibers; i++) {
        darkFibers.push(new Entities.SubseaDarkFiber(width, height));
    }

    const satCounts = config.counts.satellites;
    const orbitProfiles = {
        GEO: { phase: 0.04, speed: config.speeds.satellite.GEO, wobble: 0.9, phaseSpeed: 0.52 },
        MEO: { phase: 0.24, speed: config.speeds.satellite.MEO, wobble: 2.05, phaseSpeed: 0.64 },
        LEO: { phase: 0.56, speed: config.speeds.satellite.LEO, wobble: 3.1, phaseSpeed: 0.78 },
    };
    for (let i = 0; i < satCounts.GEO; i++) {
        const profile = orbitProfiles.GEO;
        const start = harmonicX(-30, width + 30, i, satCounts.GEO, profile.phase, 0.02);
        const direction = alternatingDirection(i);
        registerSatellite(new Entities.SpaceShip("GEO-NODE", "GEO", direction * harmonicSpeed(profile.speed, i, 0.04, profile.phase), start, width, height, {
            phase: phaseAngle(i, satCounts.GEO, profile.phase),
            phaseSpeed: profile.phaseSpeed + (i % 2) * 0.04,
            wobble: profile.wobble,
            id: `GEO-${String(i + 1).padStart(2, "0")}`,
        }));
    }
    for (let i = 0; i < satCounts.MEO; i++) {
        const profile = orbitProfiles.MEO;
        const start = harmonicX(-30, width + 30, i, satCounts.MEO, profile.phase, 0.024);
        const direction = alternatingDirection(i, 1);
        registerSatellite(new Entities.SpaceShip("MEO-NODE", "MEO", direction * harmonicSpeed(profile.speed, i, 0.04, profile.phase), start, width, height, {
            phase: phaseAngle(i, satCounts.MEO, profile.phase),
            phaseSpeed: profile.phaseSpeed + (i % 2) * 0.05,
            wobble: profile.wobble,
            id: `MEO-${String(i + 1).padStart(2, "0")}`,
        }));
    }
    for (let i = 0; i < satCounts.LEO; i++) {
        const profile = orbitProfiles.LEO;
        const start = harmonicX(-30, width + 30, i, satCounts.LEO, profile.phase, 0.026);
        const direction = alternatingDirection(i);
        registerSatellite(new Entities.SpaceShip("LEO-NODE", "LEO", direction * harmonicSpeed(profile.speed, i, 0.045, profile.phase), start, width, height, {
            phase: phaseAngle(i, satCounts.LEO, profile.phase),
            phaseSpeed: profile.phaseSpeed + (i % 3) * 0.04,
            wobble: profile.wobble,
            id: `LEO-${String(i + 1).padStart(2, "0")}`,
        }));
    }

    const factionRoles = {
        SITH: ["interceptor", "bomber", "cruiser"],
        JEDI: ["fighter", "shuttle", "corvette"],
        SEPARATIST: ["bomber", "cruiser", "interceptor"],
        BOUNTY: ["fighter", "corvette", "interceptor"],
        TRADER: ["freighter", "shuttle", "corvette"],
        REBEL: ["fighter", "bomber", "corvette"],
    };
    const factionCounts = config.counts.factionShips || {};
    const factionKeys = Object.keys(factionCounts);
    for (const faction of factionKeys) {
        const roles = factionRoles[faction] || ["fighter"];
        const count = factionCounts[faction] || 0;
        const factionPhase = ((faction.charCodeAt(0) % 7) + 1) * 0.07;
        for (let i = 0; i < count; i++) {
            const role = roles[i % roles.length];
            const layer = pickLayerForRole(role, i);
            const baseSpeed = config.speeds.factionShip?.[layer] ?? config.speeds.satellite[layer];
            const roleSpeed = role === "interceptor" ? 1.25 : role === "fighter" ? 1.1 : role === "freighter" ? 0.7 : role === "cruiser" ? 0.75 : 0.9;
            const direction = alternatingDirection(i, faction.length);
            const start = harmonicX(-36, width + 36, i, Math.max(count, 1), factionPhase, 0.028);
            factionShips.push(new Entities.FactionShip(faction, role, layer, direction * harmonicSpeed(baseSpeed * roleSpeed, i, 0.05, factionPhase), start, width, height, {
                phase: phaseAngle(i, Math.max(count, 1), factionPhase),
                phaseSpeed: 0.74 + (i % 3) * 0.08,
                id: `${faction}-${role}-${i + 1}`,
            }));
        }
    }

    const trafficScale = qSettings.skylineScale || 1;
    const trafficTotal = Math.max(8, Math.floor(config.counts.skyTraffic * trafficScale));
    const laneA = {
        altRatio: 0.46,
        speed: config.speeds.skyTraffic * 0.9,
        direction: 1,
        color: config.colors.trafficWarm,
        size: 2.2,
        rhythm: {
            phaseOffset: 0.08,
            speedVariance: 0.035,
            wobbleBase: 1.65,
            wobbleVariance: 0.3,
            trailBase: 11,
            trailVariance: 4,
            phaseSpeed: 0.68,
        },
    };
    const laneB = {
        altRatio: 0.26,
        speed: config.speeds.skyTraffic * 0.7,
        direction: -1,
        color: config.colors.trafficCool,
        size: 2.0,
        rhythm: {
            phaseOffset: 0.44,
            speedVariance: 0.03,
            wobbleBase: 1.3,
            wobbleVariance: 0.26,
            trailBase: 9,
            trailVariance: 3,
            phaseSpeed: 0.62,
        },
    };
    const laneACount = Math.max(4, Math.round(trafficTotal * 0.55));
    const laneBCount = Math.max(3, trafficTotal - laneACount);

    for (let i = 0; i < laneACount; i++) {
        skyTraffic.push(new Entities.SkyLaneTraffic(laneA, i, laneACount, width, height));
    }
    for (let i = 0; i < laneBCount; i++) {
        skyTraffic.push(new Entities.SkyLaneTraffic(laneB, i, laneBCount, width, height));
    }

    spaceGateway = new Entities.SuperStarDestroyer(width, height);

    for (let i = 0; i < qSettings.caustics; i++) {
        oceanCaustics.push({
            x: harmonicX(coastX + 16, width - 18, i, Math.max(qSettings.caustics, 1), 0.16, 0.035),
            w: 28 + (i % 4) * 10,
            speed: harmonicSpeed(9, i, 0.22, 0.21),
        });
    }

    trafficTimers.mesh = 0;
    trafficTimers.uplinkLEO = 0;
    trafficTimers.uplinkMEO = 0;
    trafficTimers.uplinkGEO = 0;
    trafficTimers.interLayer = 0;
    trafficTimers.subsea = 0;
    trafficTimers.access = 0;
    lastTime = 0;

    if (!loggedReady) {
        loggedReady = true;
        logInfo("Initialized", {
            width,
            height,
            dpr,
            quality: runtime.quality,
        });
    }
}

function nearestSatelliteForTower(tower) {
    const top = getTopPoint(tower);
    let best = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const sat of satellites) {
        const horizontalLimit = orbitCoverageWidth(sat.layer, width);
        const dx = Math.abs(top.x - sat.x);
        if (dx > horizontalLimit) continue;
        const dist = Math.hypot(top.x - sat.x, top.y - sat.y);
        if (dist < bestDist) {
            bestDist = dist;
            best = sat;
        }
    }
    return { sat: best, distance: bestDist, top };
}

function nearestSatelliteForTowerLayer(tower, layer) {
    const top = getTopPoint(tower);
    let best = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const sat of getSatellitesByLayer(layer)) {
        const horizontalLimit = orbitCoverageWidth(sat.layer, width);
        const dx = Math.abs(top.x - sat.x);
        if (dx > horizontalLimit) continue;
        const dist = Math.hypot(top.x - sat.x, top.y - sat.y);
        if (dist < bestDist) {
            bestDist = dist;
            best = sat;
        }
    }
    return { sat: best, distance: bestDist, top };
}

function nearestSatelliteForNode(node, layer = node?.layer) {
    if (!node || !layer) return { sat: null, distance: Number.POSITIVE_INFINITY };
    let best = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const sat of getSatellitesByLayer(layer)) {
        const horizontalLimit = orbitCoverageWidth(layer, width);
        const dx = Math.abs((node.x || 0) - sat.x);
        if (dx > horizontalLimit) continue;
        const dist = Math.hypot((node.x || 0) - sat.x, (node.y || 0) - sat.y);
        if (dist < bestDist) {
            bestDist = dist;
            best = sat;
        }
    }
    return { sat: best, distance: bestDist };
}

function drainCadence(key, interval, callback) {
    if (trafficTimers[key] < interval) return;
    trafficTimers[key] -= interval;
    callback();
}

function pushTelemetryBadge(target, badge) {
    if (!badge || !badge.title) return;
    if (target.length >= 9) return;
    target.push(badge);
}

function formatTelemetryBadge(prefix, metrics) {
    return {
        title: `${prefix} ${metrics.oneWayMs.toFixed(1)} ms`,
        subtitle: `RTT ${metrics.rttMs.toFixed(1)} | jitter ${metrics.jitterMs.toFixed(1)} | ${metrics.throughputGbps.toFixed(0)} Gbps`,
    };
}

function drawCurvedCommLink(start, end, color, metrics, timestamp, alpha = 1, bendScale = 0.12) {
    const control = arcControlPoint(start, end, bendScale);
    const pulseT = (timestamp * motion.commPulseSpeed * metrics.cadenceHz + metrics.distanceKm * 0.0004) % 1;
    const pulse = quadraticPoint(start, control, end, pulseT);
    const center = quadraticPoint(start, control, end, 0.5);

    ctx.save();
    ctx.globalAlpha = Math.min(0.46, computeLinkAlpha(metrics.distancePx, width * 0.5, 0.05, 0.32) * alpha);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    ctx.lineDashOffset = -timestamp * 0.012 * Math.max(metrics.cadenceHz, 0.12);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.globalAlpha = Math.min(0.9, 0.28 + alpha * 0.5);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pulse.x, pulse.y, 1.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    return center;
}

function drawOrbitalCommTelemetry(timestamp, telemetryBadges) {
    const representativeByLayer = new Map();
    const orbitalLayers = ["GEO", "MEO", "LEO"];

    for (const layer of orbitalLayers) {
        const nodes = getSatellitesByLayer(layer)
            .slice()
            .sort((left, right) => left.x - right.x);

        if (layer === "GEO" && spaceGateway) {
            nodes.push(spaceGateway);
            nodes.sort((left, right) => left.x - right.x);
        }

        for (let index = 0; index < nodes.length - 1; index++) {
            const start = nodes[index];
            const end = nodes[index + 1];
            const metrics = estimateLinkTelemetry(layer, start, end, width);
            const center = drawCurvedCommLink(start, end, start.color || config.colors[`link${layer}`] || config.colors.linkLEO, metrics, timestamp, 0.88, 0.14);
            const centerBias = Math.abs(center.x - width * 0.5);
            const current = representativeByLayer.get(layer);
            if (!current || centerBias < current.centerBias) {
                representativeByLayer.set(layer, { center, centerBias, metrics });
            }
        }
    }

    for (const [layer, sample] of representativeByLayer.entries()) {
        const badge = formatTelemetryBadge(`${layer} sync`, sample.metrics);
        pushTelemetryBadge(telemetryBadges, {
            x: sample.center.x,
            y: sample.center.y,
            color: config.colors[`link${layer}`] || config.colors.linkLEO,
            alpha: 0.92,
            ...badge,
        });
    }
}

function drawShipCommTelemetry(timestamp, telemetryBadges) {
    const representativeByLayer = new Map();

    for (const ship of factionShips) {
        const nearest = nearestSatelliteForNode(ship, ship.layer);
        if (!nearest.sat) continue;
        const maxDistance = orbitCoverageWidth(ship.layer, width) * 0.74;
        if (nearest.distance > maxDistance) continue;

        const metrics = estimateLinkTelemetry(ship.layer, ship, nearest.sat, width);
        const color = config.colors[`link${ship.layer}`] || config.colors.linkLEO;
        const center = drawCurvedCommLink(ship, nearest.sat, color, metrics, timestamp, 0.52, 0.08);
        const centerBias = Math.abs(ship.x - width * 0.5);
        const current = representativeByLayer.get(ship.layer);

        if (!current || centerBias < current.centerBias) {
            representativeByLayer.set(ship.layer, { center, centerBias, metrics, ship });
        }
    }

    for (const [layer, sample] of representativeByLayer.entries()) {
        const badge = formatTelemetryBadge(`${layer} escort`, sample.metrics);
        pushTelemetryBadge(telemetryBadges, {
            x: sample.center.x,
            y: sample.center.y + 8,
            color: config.colors[`link${layer}`] || config.colors.linkLEO,
            alpha: 0.74,
            ...badge,
        });
    }
}

function animate(timestamp) {
    if (canvasDisabled) {
        if (!loggedReady) {
            loggedReady = true;
            logInfo("Network canvas disabled by device profile");
        }
        animationFrameId = null;
        return;
    }
    if (document.hidden || !canvasVisible) {
        animationFrameId = null;
        return;
    }
    if (!lastTime) lastTime = timestamp;
    if (timestamp - lastTime < FRAME_INTERVAL) {
        requestNextFrame();
        return;
    }
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    const world = { width, height, dt, t: timestamp, quality: qSettings };
    const linkOpacityScale = motion.linkAlphaScale || 1;
    const spawnIntervalScale = motion.spawnIntervalScale || 1;
    const telemetryBadges = [];

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(staticCanvas, 0, 0, width, height);
    drawStars(ctx, stars, world);

    for (const skirmisher of skirmishers) {
        skirmisher.update(world);
        skirmisher.draw(ctx, world);
    }

    for (const c of oceanCaustics) {
        c.x += c.speed * dt;
        if (c.x > width + 60) c.x = width * config.geometry.ground.coastlineRatio;
    }

    orbitRegions = drawOrbitLines(ctx, width, height, timestamp, qSettings.orbitStep);

    for (const traffic of skyTraffic) {
        traffic.update(world);
        traffic.draw(ctx, world);
    }

    if (spaceGateway) {
        spaceGateway.update(world);
        spaceGateway.draw(ctx, world);
    }

    for (const sat of satellites) {
        sat.update(world);
        sat.draw(ctx, world);
    }

    for (const ship of factionShips) {
        ship.update(world);
        ship.draw(ctx, world);
    }

    drawOrbitalCommTelemetry(timestamp, telemetryBadges);
    drawShipCommTelemetry(timestamp, telemetryBadges);

    for (const fiber of fibers) {
        fiber.update(world);
        fiber.draw(ctx, world);
    }
    for (const cable of darkFibers) {
        cable.update(world);
        cable.draw(ctx, world);
    }

    for (const city of cities) {
        city.draw(ctx, world);
    }
    for (const building of telecomBuildings) {
        building.update(world);
        building.draw(ctx, world);
    }
    for (const outpost of outposts) {
        outpost.update(world);
        outpost.draw(ctx, world);
    }
    for (const hub of edgeHubs) {
        hub.update(world);
        hub.draw(ctx, world);
    }
    for (const relay of microwaveRelays) {
        relay.update(world);
        relay.draw(ctx, world);
    }
    for (const cell of smallCells) {
        cell.update(world);
        cell.draw(ctx, world);
    }

    drawOceanVolume(ctx, width, height, oceanCaustics, qSettings.oceanSteps);

    for (const relay of marineRelays) {
        relay.update(world);
        relay.draw(ctx, world);
    }
    for (const habitat of subseaHabitats) {
        habitat.update(world);
        habitat.draw(ctx, world);
    }
    for (const ship of ships) {
        ship.update(world);
        ship.draw(ctx, world);
    }
    for (const home of homes) {
        home.update(world);
        home.draw(ctx, world);
    }
    for (const car of cars) {
        car.update(world);
        car.draw(ctx, world);
    }
    for (const tower of towers) {
        tower.update(world);
        tower.draw(ctx, world);
    }

    trafficTimers.mesh += dt;
    trafficTimers.uplinkLEO += dt;
    trafficTimers.uplinkMEO += dt;
    trafficTimers.uplinkGEO += dt;
    trafficTimers.interLayer += dt;
    trafficTimers.subsea += dt;
    trafficTimers.access += dt;
    const cadenceStep = {
        mesh: Math.floor(timestamp / (340 * spawnIntervalScale)),
        uplink: Math.floor(timestamp / (220 * spawnIntervalScale)),
        interLayer: Math.floor(timestamp / (620 * spawnIntervalScale)),
        subsea: Math.floor(timestamp / (420 * spawnIntervalScale)),
        access: Math.floor(timestamp / (300 * spawnIntervalScale)),
    };

    for (let i = 0; i < towers.length - 1; i++) {
        const a = getTopPoint(towers[i]);
        const b = getTopPoint(towers[i + 1]);
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        const alpha = computeLinkAlpha(dist, width * 0.26, 0.1, 0.42) * linkOpacityScale;

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = config.colors.meshLink;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

    }

    drainCadence("mesh", 0.34 * spawnIntervalScale, () => {
        if (towers.length < 2) return;
        const linkCount = towers.length - 1;
        const step = cadenceStep.mesh % linkCount;
        const start = getTopPoint(towers[step]);
        const end = getTopPoint(towers[step + 1]);
        spawnPacket(start, end, config.colors.packetMEO, "MESH");
    });

    const uplinkCandidates = { LEO: [], MEO: [], GEO: [] };
    const uplinkRepresentatives = {};
    for (const tower of towers) {
        const layers = ["LEO", "MEO", "GEO"];
        for (const layer of layers) {
            const nearest = nearestSatelliteForTowerLayer(tower, layer);
            if (!nearest.sat) continue;

            const color = packetColorByLayer(layer, config.colors);
            const alpha = computeLinkAlpha(nearest.distance, height * 0.95, 0.08, 0.42) * linkOpacityScale;
            const dash = layer === "LEO" ? [5, 8] : layer === "MEO" ? [6, 10] : [8, 14];
            const speed = layer === "LEO" ? 0.09 : layer === "MEO" ? 0.07 : 0.05;
            const metrics = estimateLinkTelemetry(layer, nearest.top, nearest.sat, width);

            ctx.globalAlpha = alpha;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.setLineDash(dash);
            ctx.lineDashOffset = -timestamp * speed;
            ctx.beginPath();
            ctx.moveTo(nearest.top.x, nearest.top.y);
            ctx.lineTo(nearest.sat.x, nearest.sat.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;

            uplinkCandidates[layer].push({ top: nearest.top, sat: nearest.sat, color, metrics });

            const bias = Math.abs(nearest.top.x - width * 0.5);
            if (!uplinkRepresentatives[layer] || bias < uplinkRepresentatives[layer].bias) {
                uplinkRepresentatives[layer] = {
                    bias,
                    x: (nearest.top.x + nearest.sat.x) * 0.5,
                    y: (nearest.top.y + nearest.sat.y) * 0.5,
                    color,
                    metrics,
                };
            }
        }
    }

    for (const layer of ["LEO", "MEO", "GEO"]) {
        const rep = uplinkRepresentatives[layer];
        if (!rep) continue;
        const badge = formatTelemetryBadge(`${layer} uplink`, rep.metrics);
        pushTelemetryBadge(telemetryBadges, {
            x: rep.x,
            y: rep.y,
            color: rep.color,
            alpha: 0.78,
            ...badge,
        });
    }

    drainCadence("uplinkLEO", 0.18 * spawnIntervalScale, () => {
        if (!uplinkCandidates.LEO.length) return;
        const index = cadenceStep.uplink % uplinkCandidates.LEO.length;
        const link = uplinkCandidates.LEO[index];
        if ((cadenceStep.uplink % 2) === 0) spawnPacket(link.top, link.sat, link.color, "UPLINK-LEO");
        else spawnPacket(link.sat, link.top, link.color, "DOWNLINK-LEO");
        spawnRipple(link.top.x, link.top.y, config.colors.ripple);
    });
    drainCadence("uplinkMEO", 0.28 * spawnIntervalScale, () => {
        if (!uplinkCandidates.MEO.length) return;
        const index = (cadenceStep.uplink + 1) % uplinkCandidates.MEO.length;
        const link = uplinkCandidates.MEO[index];
        if ((Math.floor(cadenceStep.uplink / 2) % 2) === 0) spawnPacket(link.top, link.sat, link.color, "UPLINK-MEO");
        else spawnPacket(link.sat, link.top, link.color, "DOWNLINK-MEO");
        spawnRipple(link.top.x, link.top.y, config.colors.ripple);
    });
    drainCadence("uplinkGEO", 0.4 * spawnIntervalScale, () => {
        if (!uplinkCandidates.GEO.length) return;
        const index = (cadenceStep.uplink + 2) % uplinkCandidates.GEO.length;
        const link = uplinkCandidates.GEO[index];
        if ((Math.floor(cadenceStep.uplink / 3) % 2) === 0) spawnPacket(link.top, link.sat, link.color, "UPLINK-GEO");
        else spawnPacket(link.sat, link.top, link.color, "DOWNLINK-GEO");
        spawnRipple(link.top.x, link.top.y, config.colors.ripple);
    });

    drainCadence("interLayer", 0.6 * spawnIntervalScale, () => {
        const geoSats = getSatellitesByLayer("GEO");
        const meoSats = getSatellitesByLayer("MEO");
        if (geoSats.length && meoSats.length) {
            const geo = geoSats[cadenceStep.interLayer % geoSats.length];
            const meo = meoSats[(cadenceStep.interLayer + 1) % meoSats.length];
            const dist = Math.hypot(geo.x - meo.x, geo.y - meo.y);
            const alpha = computeLinkAlpha(dist, height * 0.9, 0.06, 0.36) * linkOpacityScale;
            const metrics = estimateLinkTelemetry("GEO", geo, meo, width);

            ctx.globalAlpha = alpha;
            ctx.strokeStyle = config.colors.linkGEO;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 8]);
            ctx.beginPath();
            ctx.moveTo(geo.x, geo.y);
            ctx.lineTo(meo.x, meo.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;

            const badge = formatTelemetryBadge("inter-layer", metrics);
            pushTelemetryBadge(telemetryBadges, {
                x: (geo.x + meo.x) * 0.5,
                y: (geo.y + meo.y) * 0.5,
                color: config.colors.linkGEO,
                alpha: 0.72,
                ...badge,
            });

            if ((cadenceStep.interLayer % 2) === 0) spawnPacket(geo, meo, config.colors.packetGEO, "INTERLAYER");
            else spawnPacket(meo, geo, config.colors.packetMEO, "INTERLAYER");
        }
    });

    drainCadence("subsea", 0.4 * spawnIntervalScale, () => {
        if (!marineRelays.length || !subseaHabitats.length) return;
        const relay = marineRelays[cadenceStep.subsea % marineRelays.length];
        let nearestHab = null;
        let best = Number.POSITIVE_INFINITY;
        for (const hab of subseaHabitats) {
            const d = Math.hypot(hab.x - relay.x, hab.y - relay.y);
            if (d < best) {
                best = d;
                nearestHab = hab;
            }
        }
        if (nearestHab) {
            const metrics = estimateLinkTelemetry("SUBSEA", { x: relay.x, y: relay.y - 8 }, nearestHab, width);
            ctx.strokeStyle = config.colors.linkSubsea;
            ctx.globalAlpha = computeLinkAlpha(best, width * 0.5, 0.12, 0.34) * linkOpacityScale;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(relay.x, relay.y - 8);
            ctx.lineTo(nearestHab.x, nearestHab.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
            const badge = formatTelemetryBadge("subsea", metrics);
            pushTelemetryBadge(telemetryBadges, {
                x: (relay.x + nearestHab.x) * 0.5,
                y: (relay.y + nearestHab.y) * 0.5,
                color: config.colors.linkSubsea,
                alpha: 0.78,
                ...badge,
            });
            spawnPacket({ x: relay.x, y: relay.y - 8 }, nearestHab, config.colors.packetSubsea, "SUBSEA");
        }
    });

    drainCadence("access", 0.26 * spawnIntervalScale, () => {
        if (!homes.length || !towers.length) return;
        const home = homes[cadenceStep.access % homes.length];
        const tower = towers[(cadenceStep.access * 2) % towers.length];
        if (home && tower) {
            const target = getTopPoint(tower);
            const metrics = estimateLinkTelemetry("ACCESS", { x: home.x, y: home.y + 6 }, target, width);
            ctx.strokeStyle = config.colors.carLink;
            ctx.globalAlpha = 0.24;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(home.x, home.y + 6);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
            const badge = formatTelemetryBadge("access", metrics);
            pushTelemetryBadge(telemetryBadges, {
                x: (home.x + target.x) * 0.5,
                y: (home.y + target.y) * 0.5,
                color: config.colors.packetLEO,
                alpha: 0.62,
                ...badge,
            });
            spawnPacket({ x: home.x, y: home.y + 6 }, target, config.colors.packetLEO, "ACCESS");
        }
    });

    for (const packet of packetPool) {
        if (packet.active) {
            packet.update(world);
            packet.draw(ctx, world);
        }

        if (!packet.active && !packet._free) {
            if (packet.finished) {
                spawnRipple(packet.x, packet.y, config.colors.ripple);
                packet.finished = false;
            }
            packet._free = true;
            freePackets.push(packet);
        }
    }

    for (const ripple of ripplePool) {
        if (ripple.active) {
            ripple.update(world);
            ripple.draw(ctx, world);
        }
        if (!ripple.active && !ripple._free) {
            ripple._free = true;
            freeRipples.push(ripple);
        }
    }

    drawTelemetryBadges(ctx, telemetryBadges);
    drawOrbitUI(ctx, width, height, orbitRegions, mouseX, mouseY, selectedOrbitId);
    requestNextFrame();
}

function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildScene, 140);
}

function onMouseMove(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function onClick() {
    let hit = null;
    for (const region of orbitRegions) {
        const inside = mouseX >= region.x && mouseX <= region.x + region.w + 50 && mouseY >= region.y - 10 && mouseY <= region.y + region.h + 12;
        if (inside) {
            hit = region.data.id;
            break;
        }
    }
    selectedOrbitId = hit && selectedOrbitId !== hit ? hit : null;

    if (!hit) return;

}

function onStorage(event) {
    if (event.key === "selectedLanguage") updateLanguage();
    if (event.key === "quality") {
        const next = event.newValue;
        if (next && QUALITY[next]) {
            runtime.quality = next;
            buildScene();
        }
    }
}

window.addEventListener("resize", onResize);
window.addEventListener("mousemove", onMouseMove);
window.addEventListener("click", onClick);
window.addEventListener("storage", onStorage);
window.addEventListener("focus", () => {
    syncSettings();
    startAnimation();
});
window.addEventListener("pageshow", () => {
    syncSettings();
    startAnimation();
});
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        stopAnimation();
    } else {
        syncSettings();
        startAnimation();
    }
});

if ("IntersectionObserver" in window) {
    const canvasObserver = new IntersectionObserver((entries) => {
        canvasVisible = entries.some((entry) => entry.isIntersecting);
        if (canvasVisible) {
            startAnimation();
        } else {
            stopAnimation();
        }
    }, { threshold: 0.1 });
    canvasObserver.observe(canvas);
}

const langObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type !== "attributes" || mutation.attributeName !== "lang") continue;
        const next = document.documentElement.lang;
        if (next && next !== lastLang) {
            lastLang = next;
            updateLanguage();
        }
    }
});
langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

function syncSettings() {
    const nextLang = localStorage.getItem("selectedLanguage");
    if (nextLang && nextLang !== lastLang) {
        lastLang = nextLang;
        updateLanguage();
    }

    const nextQuality = localStorage.getItem("quality");
    if (nextQuality && nextQuality !== lastQuality) {
        lastQuality = nextQuality;
        if (QUALITY[nextQuality]) {
            runtime.quality = nextQuality;
            buildScene();
        } else {
            logWarn("Ignored unknown quality setting.", nextQuality);
        }
    }
}

buildScene();
startAnimation();
})();
