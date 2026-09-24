import { config } from "./config.js";

export const rand = (min, max) => Math.random() * (max - min) + min;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (start, end, t) => start + (end - start) * t;
export const distanceBetweenPoints = (a, b) => Math.hypot((b.x || 0) - (a.x || 0), (b.y || 0) - (a.y || 0));

export function isOceanX(x, width) {
    return x > width * config.geometry.ground.coastlineRatio;
}

export function getGroundY(x, width, height) {
    const g = config.geometry.ground;
    const midX = width * 0.5;
    const baseY = height - g.baseOffset;
    const denom = Math.max(width * g.curveWidthFactor, 1);
    const norm = clamp((x - midX) / denom, -1.25, 1.25);
    const curve = norm * norm * g.curveHeight;
    return baseY - g.curveHeight + curve;
}

export function getOceanY(x, width, height) {
    return getGroundY(x, width, height) + config.geometry.ocean.surfaceOffset;
}

export function getOrbitY(x, baseAltitude, width) {
    const orbitCfg = config.geometry.orbit;
    const centerX = width * 0.5;
    const maxDistance = Math.max(width * orbitCfg.curveWidthFactor, 1);
    const normalized = clamp(Math.abs(x - centerX) / maxDistance, 0, 1.5);
    return baseAltitude + normalized * normalized * orbitCfg.curveDepth;
}

export function computeLinkAlpha(distance, maxDistance, min = 0.15, max = 0.72) {
    if (maxDistance <= 0) return min;
    const ratio = clamp(1 - distance / maxDistance, 0, 1);
    return lerp(min, max, ratio);
}

export function orbitCoverageWidth(layer, width) {
    if (layer === "GEO") return width * 0.82;
    if (layer === "MEO") return width * 0.52;
    return width * 0.24;
}

export function packetColorByLayer(layer, colors) {
    if (layer === "GEO") return colors.packetGEO;
    if (layer === "MEO") return colors.packetMEO;
    if (layer === "LEO") return colors.packetLEO;
    return colors.packetSubsea;
}

export function arcControlPoint(start, end, bendScale = 0.12) {
    const dx = (end.x || 0) - (start.x || 0);
    const dy = (end.y || 0) - (start.y || 0);
    const length = Math.hypot(dx, dy) || 1;
    const mx = ((start.x || 0) + (end.x || 0)) * 0.5;
    const my = ((start.y || 0) + (end.y || 0)) * 0.5;
    const normalX = -dy / length;
    const normalY = dx / length;
    const bend = Math.min(34, length * bendScale);

    return {
        x: mx + normalX * bend,
        y: my + normalY * bend,
    };
}

export function quadraticPoint(start, control, end, t) {
    const inv = 1 - t;
    return {
        x: inv * inv * start.x + 2 * inv * t * control.x + t * t * end.x,
        y: inv * inv * start.y + 2 * inv * t * control.y + t * t * end.y,
    };
}

function telemetryReferenceWidth(layer, width) {
    if (layer === "SUBSEA") {
        return Math.max(width * (1 - config.geometry.ground.coastlineRatio), 1);
    }
    if (layer === "ACCESS") {
        return Math.max(width * config.geometry.ground.coastlineRatio, 1);
    }
    if (layer === "MESH") {
        return Math.max(width * 0.26, 1);
    }
    return Math.max(orbitCoverageWidth(layer, width), 1);
}

export function estimateLinkTelemetry(layer, start, end, width) {
    const model = config.network.layers[layer] || config.network.layers.ACCESS;
    const distancePx = distanceBetweenPoints(start, end);
    const refWidth = telemetryReferenceWidth(layer, width);
    const kmPerPx = model.coverageKm / refWidth;
    const distanceKm = distancePx * kmPerPx;
    const propagationMs = distanceKm / model.propagationKmPerMs;
    const oneWayMs = Math.max(model.floorLatencyMs, propagationMs + model.processingMs);
    const jitterMs = model.jitterMs + (distanceKm / 1000) * model.jitterPer1000Km;
    const throughputGbps = model.throughputGbps * clamp(1 - distanceKm / (model.coverageKm * 1.25), 0.48, 1);

    return {
        layer,
        distancePx,
        distanceKm,
        oneWayMs,
        rttMs: oneWayMs * 2,
        jitterMs,
        throughputGbps,
        cadenceHz: model.cadenceHz,
        propagationKmPerMs: model.propagationKmPerMs,
    };
}
