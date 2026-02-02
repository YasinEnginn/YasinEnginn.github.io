const canvas = document.getElementById('network-canvas');
const ctx = canvas.getContext('2d');

let width, height;

// --- Configuration ---
const config = {
    colors: {
        bgTop: '#050510',
        bgBottom: '#0e1a2b',
        groundGrid: 'rgba(0, 255, 150, 0.1)',
        tieColor: '#a0a0a0',
        xwingColor: '#d0d0d0',
        falconColor: '#e0e0e0',
        deathStarColor: '#808080',
        laserEmpire: '#00ff00',
        laserRebel: '#ff0000',
        rippleEmpire: 'rgba(0, 255, 0, 0.3)',
        rippleRebel: 'rgba(255, 50, 50, 0.3)',
        meshTower: '#88d64c',
        shipHull: '#5577aa',
        citySilhouette: '#0a1520',
        spaceStation: '#99aabb',
        meshLink: 'rgba(136, 214, 76, 0.3)',
        road: '#222',
        carHeadlight: 'rgba(255, 255, 200, 0.6)',
        linkStation: 'rgba(0, 255, 255, 0.5)', // Cyan for Science
        linkV2X: 'rgba(255, 200, 0, 0.4)',      // Yellow/Orange for Cars
        text: 'rgba(255,255,255,0.5)'
    },
    counts: {
        leo: 12,
        meo: 6,
        gso: 1,
        towers: 6,
        ships: 4,
        cities: 3,
        cars: 10,
        scenery: 8
    },
    speeds: {
        leo: 0.001,
        meo: 0.0004,
        falcon: 0.0007,
        gso: 0.00002,
        ship: 0.15,
        station: 0.1,
        car: 0.8
    }
};

// --- State ---
let satellites = [];
let groundNodes = [];
let oceanShips = [];
let cities = [];
let cars = [];
let scenery = [];
let spaceStation = null;
let packets = [];
let ripples = [];
let stars = [];

const rand = (min, max) => Math.random() * (max - min) + min;

// Horizon Calculation
function getGroundY(x) {
    const midX = width / 2;
    const curveHeight = 120;
    const baseY = height - 40;
    const normX = (x - midX) / (width * 0.6);
    const yOffset = normX * normX * curveHeight;
    return baseY - curveHeight + yOffset;
}

function getOceanY(x) {
    return getGroundY(x) + 15;
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    init();
}
window.addEventListener('resize', resize);


// Classes (Entities)
class Entity {
    constructor(x, y) { this.x = x; this.y = y; }
}

class Star {
    constructor() {
        this.x = Math.random() * width; this.y = Math.random() * (height * 0.8);
        this.size = Math.random() * 1.5; this.alpha = Math.random(); this.flickerSpeed = 0.02 + Math.random() * 0.05;
    }
    update() { this.alpha += this.flickerSpeed; if (this.alpha > 1 || this.alpha < 0.2) this.flickerSpeed *= -1; }
    draw() { ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
}

class City {
    constructor(x) {
        this.x = x; this.buildings = [];
        const count = rand(5, 12);
        for (let i = 0; i < count; i++) {
            this.buildings.push({ w: rand(10, 30), h: rand(30, 80), offX: (i * 15) - (count * 15 / 2) });
        }
    }
    draw() {
        const baseY = getGroundY(this.x);
        ctx.fillStyle = config.colors.citySilhouette;
        this.buildings.forEach(b => {
            ctx.fillRect(this.x + b.offX, baseY - b.h, b.w, b.h + 20);
            if (Math.random() > 0.95) { ctx.fillStyle = '#ffff00'; ctx.fillRect(this.x + b.offX + 4, baseY - b.h + 4, 2, 2); ctx.fillStyle = config.colors.citySilhouette; }
        });
    }
}

class Scenery extends Entity {
    constructor(x) { super(x, 0); this.type = Math.random() > 0.7 ? 'SCHOOL' : 'PARK'; this.y = getGroundY(this.x); }
    draw() {
        ctx.save(); ctx.translate(this.x, this.y);
        if (this.type === 'PARK') {
            ctx.fillStyle = '#1e4d2b'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-4, -12); ctx.lineTo(4, -12); ctx.fill();
            ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(2, -10); ctx.lineTo(10, -10); ctx.fill();
            ctx.fillStyle = '#225533'; ctx.beginPath(); ctx.ellipse(0, 0, 15, 3, 0, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.fillStyle = '#554433'; ctx.fillRect(-10, -10, 20, 10);
            ctx.beginPath(); ctx.moveTo(-12, -10); ctx.lineTo(0, -16); ctx.lineTo(12, -10); ctx.fill();
            ctx.strokeStyle = '#888'; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(0, -22); ctx.stroke();
            ctx.fillStyle = '#ff0000'; ctx.fillRect(0, -22, 5, 3);
        }
        ctx.restore();
    }
}

class Car extends Entity {
    constructor() {
        super(0, 0); this.x = rand(0, width); this.speed = config.speeds.car * (Math.random() > 0.5 ? 1 : -1);
        this.color = `hsl(${Math.random() * 360}, 60%, 50%)`; this.y = getGroundY(this.x);
        this.lastV2X = 0;
    }
    update() {
        this.x += this.speed; if (this.x > width) this.x = 0; if (this.x < 0) this.x = width; this.y = getGroundY(this.x);
        this.lastV2X++;

        // V2X Logic
        if (this.lastV2X > 60 && Math.random() < 0.05) { // Periodic check
            // Find nearest tower
            let nearest = null; let minD = 150; // Close range
            groundNodes.forEach(t => {
                const d = Math.abs(t.x - this.x);
                if (d < minD) { minD = d; nearest = t; }
            });

            if (nearest) {
                // Send V2X Packet
                packets.push(new Packet(this, { x: nearest.x, y: nearest.y - nearest.height }, config.colors.linkV2X, 'V2X'));
                this.lastV2X = 0;
            }
        }
    }
    draw() {
        ctx.save(); ctx.translate(this.x, this.y); const roadOffset = -2;
        if (Math.abs(this.speed) > 0.1) {
            ctx.fillStyle = config.colors.carHeadlight; ctx.beginPath(); const beamDir = this.speed > 0 ? 1 : -1;
            ctx.moveTo(beamDir * 4, roadOffset - 2); ctx.lineTo(beamDir * 20, roadOffset + 4); ctx.lineTo(beamDir * 20, roadOffset - 5); ctx.fill();
        }
        ctx.fillStyle = this.color; ctx.fillRect(-4, roadOffset - 4, 8, 4);
        ctx.fillStyle = '#111'; ctx.fillRect(-3, roadOffset, 2, 2); ctx.fillRect(1, roadOffset, 2, 2);
        ctx.restore();
    }
}

class SpaceStation extends Entity {
    constructor() { super(-200, height * 0.2); this.vx = config.speeds.station; }
    update() {
        this.x += this.vx; this.y = (height * 0.2) + Math.sin(this.x * 0.01) * 20;
        if (this.x > width + 200) { this.x = -200; this.y = rand(height * 0.15, height * 0.3); }

        // Downlink Logic
        if (Math.random() < 0.01) {
            const target = groundNodes[Math.floor(Math.random() * groundNodes.length)];
            // Long range link check?
            if (target) {
                // Beam Duration handled by packet travel, but let's draw a quick line here or manage beams better
                // For now, spawn a packet which draws its own tail?
                // Or just spawn a packet
                packets.push(new Packet(this, { x: target.x, y: target.y - target.height }, config.colors.linkStation, 'STATION'));
            }
        }
    }
    draw() {
        ctx.save(); ctx.translate(this.x, this.y); ctx.fillStyle = config.colors.spaceStation;
        ctx.fillRect(-40, -10, 80, 20); ctx.fillRect(-10, -30, 20, 60);
        ctx.beginPath(); ctx.arc(-30, 0, 15, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#334455'; ctx.fillRect(40, -25, 10, 50); ctx.fillRect(-50, -25, 10, 50);
        ctx.fillStyle = '#00ff00'; if (Math.floor(Date.now() / 500) % 2 === 0) ctx.fillRect(0, 0, 5, 5);
        ctx.restore();
    }
}

class Ripple {
    constructor(x, y, color) { this.x = x; this.y = y; this.radius = 1; this.speed = 1.5; this.color = color; this.opacity = 1.0; this.finished = false; }
    update() { this.radius += this.speed; this.opacity -= 0.02; if (this.opacity <= 0) this.finished = true; }
    draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.strokeStyle = this.color; ctx.globalAlpha = this.opacity; ctx.lineWidth = 1.5; ctx.stroke(); ctx.globalAlpha = 1.0; }
}

class SpaceShip extends Entity {
    constructor(type, orbitRadius, speed, angleOffset) {
        super(0, 0); this.type = type; this.orbitRadius = orbitRadius; this.angle = angleOffset; this.speed = speed;
        this.faction = (type === 'TIE' || type === 'DEATH_STAR') ? 'EMPIRE' : 'REBEL';
    }
    update() {
        this.angle += this.speed;
        const cx = width / 2; const eccentricity = this.type === 'FALCON' ? 1.3 : 1.1;
        this.x = cx + Math.cos(this.angle) * (width * 0.9) * (this.type === 'DEATH_STAR' ? 1.0 : eccentricity);
        const tiltAmp = this.type === 'FALCON' ? 0.25 : 0.15; const tilt = Math.sin(this.angle) * (height * tiltAmp);
        this.y = (height * (1 - this.orbitRadius)) + tilt;
        let pingChance = 0.01; if (this.type === 'FALCON') pingChance = 0.03;
        if (Math.random() < pingChance) {
            const color = this.faction === 'EMPIRE' ? config.colors.rippleEmpire : config.colors.rippleRebel;
            ripples.push(new Ripple(this.x, this.y, color));
        }
    }
    draw() {
        ctx.save(); ctx.translate(this.x, this.y);
        // Draw logic same as before...
        if (this.type === 'DEATH_STAR') {
            const size = 30; ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.fillStyle = '#666'; ctx.fill();
            ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.strokeStyle = '#444'; ctx.lineWidth = 2; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-size, 0); ctx.lineTo(size, 0); ctx.strokeStyle = '#333'; ctx.stroke();
            ctx.beginPath(); ctx.arc(-10, -10, 8, 0, Math.PI * 2); ctx.fillStyle = '#555'; ctx.fill(); ctx.stroke();
        } else if (this.type === 'TIE') {
            ctx.fillStyle = config.colors.tieColor; ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#333'; ctx.fillRect(-6, -6, 2, 12); ctx.fillRect(4, -6, 2, 12);
            ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.stroke();
        } else if (this.type === 'XWING') {
            ctx.fillStyle = config.colors.xwingColor; ctx.rotate(0.2); ctx.fillRect(-2, -8, 4, 16); ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(8, 4); ctx.moveTo(8, -4); ctx.lineTo(-8, 4);
            ctx.strokeStyle = '#d0d0d0'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#ffa500'; ctx.fillRect(-4, 4, 2, 2); ctx.fillRect(2, 4, 2, 2);
        } else if (this.type === 'FALCON') {
            ctx.fillStyle = '#ccc'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillRect(2, -4, 10, 3); ctx.fillRect(2, 1, 10, 3);
            ctx.beginPath(); ctx.arc(-2, 6, 3, 0, Math.PI * 2); ctx.moveTo(-2, 6); ctx.lineTo(4, 8); ctx.fill();
            ctx.fillStyle = '#00ffff'; ctx.shadowBlur = 5; ctx.shadowColor = '#00ffff'; ctx.fillRect(-8, -2, 2, 4); ctx.shadowBlur = 0;
        }
        ctx.restore();
    }
}

class StaticTower extends Entity {
    constructor(x) { super(x, getGroundY(x)); this.height = 15 + Math.random() * 15; this.type = 'TOWER'; this.faction = Math.random() > 0.5 ? 'EMPIRE' : 'REBEL'; }
    draw() {
        ctx.save(); ctx.translate(this.x, this.y);
        ctx.strokeStyle = config.colors.meshTower; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -this.height); ctx.stroke();
        ctx.fillStyle = '#333'; ctx.fillRect(-3, -2, 6, 2);
        ctx.beginPath(); ctx.moveTo(-4, -this.height); ctx.lineTo(4, -this.height); ctx.stroke();
        if (Math.floor(performance.now() / 500) % 2 === 0) { ctx.fillStyle = this.faction === 'EMPIRE' ? '#00ff00' : '#ff0000'; ctx.fillRect(-1, -this.height - 2, 2, 2); }
        ctx.restore();
    }
}

class NavalShip extends Entity {
    constructor() { super(0, 0); this.x = rand(0, width); this.speed = rand(0.05, 0.2) * (Math.random() > 0.5 ? 1 : -1); }
    update() { this.x += this.speed; if (this.x > width) this.x = 0; if (this.x < 0) this.x = width; this.y = getOceanY(this.x); }
    draw() {
        ctx.save(); ctx.translate(this.x, this.y); ctx.fillStyle = config.colors.shipHull;
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.lineTo(8, 4); ctx.lineTo(-8, 4); ctx.fill();
        ctx.fillStyle = '#8899aa'; ctx.fillRect(-4, -4, 5, 4);
        ctx.strokeStyle = '#99aa99'; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -10); ctx.stroke();
        ctx.restore();
    }
}

class Packet {
    constructor(p1, p2, color, type) {
        this.p1 = p1; this.p2 = p2; this.t = 0;
        this.type = type || 'MESH'; // MESH, STATION, V2X, BATTLE
        this.speed = (type === 'STATION') ? 0.015 : ((type === 'V2X') ? 0.08 : 0.05);
        this.finished = false; this.color = color;
    }
    update() { this.t += this.speed; if (this.t >= 1) this.finished = true; }
    draw() {
        const cx = this.p1.x + (this.p2.x - this.p1.x) * this.t;
        const cy = this.p1.y + (this.p2.y - this.p1.y) * this.t;
        ctx.fillStyle = this.color;

        if (this.type === 'V2X') {
            // Tiny Packets
            ctx.beginPath(); ctx.arc(cx, cy, 1, 0, Math.PI * 2); ctx.fill();
        } else if (this.type === 'STATION') {
            // Big Data Beam tip
            ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
            // Trail
            ctx.beginPath(); ctx.moveTo(this.p1.x, this.p1.y); ctx.lineTo(cx, cy);
            ctx.strokeStyle = this.color; ctx.globalAlpha = 0.2; ctx.stroke(); ctx.globalAlpha = 1.0;
        } else {
            // Standard
            const angle = Math.atan2(this.p2.y - this.p1.y, this.p2.x - this.p1.x);
            ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
            ctx.fillRect(-4, -1, 8, 2); ctx.restore();
        }
    }
}


function init() {
    satellites = []; groundNodes = []; oceanShips = []; cities = []; cars = []; scenery = []; packets = []; ripples = []; stars = [];

    for (let i = 0; i < 100; i++) stars.push(new Star());

    for (let i = 0; i < config.counts.towers; i++) {
        const x = (width / config.counts.towers) * (i + 0.5);
        groundNodes.push(new StaticTower(x));
    }
    for (let i = 0; i < config.counts.ships; i++) oceanShips.push(new NavalShip());
    for (let i = 0; i < config.counts.cities; i++) {
        const x = (width / config.counts.cities) * i + (width / 6);
        cities.push(new City(x));
    }
    for (let i = 0; i < config.counts.cars; i++) cars.push(new Car());
    for (let i = 0; i < config.counts.scenery; i++) scenery.push(new Scenery(rand(0, width)));

    satellites.push(new SpaceShip('DEATH_STAR', 0.85, config.speeds.gso, 0));
    satellites.push(new SpaceShip('FALCON', 0.55, config.speeds.falcon, Math.PI));
    for (let i = 0; i < config.counts.meo; i++) satellites.push(new SpaceShip('XWING', 0.60, config.speeds.meo, (Math.PI * 2 / config.counts.meo) * i));
    for (let i = 0; i < config.counts.leo; i++) satellites.push(new SpaceShip('TIE', 0.35, config.speeds.leo, (Math.PI * 2 / config.counts.leo) * i));
    spaceStation = new SpaceStation();
}

function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#020408');
    grad.addColorStop(1, '#1b2938');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    stars.forEach(s => { s.update(); s.draw(); });
    cities.forEach(c => c.draw());

    // FOREGROUND GROUND
    ctx.beginPath();
    ctx.moveTo(0, height);
    const steps = 20;
    for (let i = 0; i <= steps; i++) { const x = (width / steps) * i; ctx.lineTo(x, getGroundY(x)); }
    ctx.lineTo(width, height);
    ctx.fillStyle = '#08101a'; ctx.fill(); ctx.strokeStyle = '#008800'; ctx.lineWidth = 1; ctx.stroke();

    // ROAD
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) { const x = (width / steps) * i; ctx.lineTo(x, getGroundY(x)); }
    ctx.lineWidth = 6; ctx.strokeStyle = '#222'; ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) { const x = (width / steps) * i; ctx.lineTo(x, getGroundY(x)); }
    ctx.lineWidth = 1; ctx.setLineDash([10, 15]); ctx.strokeStyle = '#555'; ctx.stroke(); ctx.setLineDash([]);
}

function animate() {
    drawBackground();

    spaceStation.update(); spaceStation.draw();
    satellites.forEach(s => s.update());
    oceanShips.forEach(s => s.update());
    cars.forEach(c => { c.update(); c.draw(); });
    scenery.forEach(s => s.draw());

    ripples.forEach((r, idx) => { r.update(); r.draw(); if (r.finished) ripples.splice(idx, 1); });

    // Mesh
    ctx.lineWidth = 1;
    for (let i = 0; i < groundNodes.length - 1; i++) {
        const t1 = groundNodes[i]; const t2 = groundNodes[i + 1];
        ctx.beginPath(); ctx.moveTo(t1.x, t1.y - t1.height); ctx.lineTo(t2.x, t2.y - t2.height);
        ctx.strokeStyle = config.colors.meshLink; ctx.setLineDash([2, 2]); ctx.stroke(); ctx.setLineDash([]);
        if (Math.random() < 0.01) packets.push(new Packet({ x: t1.x, y: t1.y - t1.height }, { x: t2.x, y: t2.y - t2.height }, '#ffffff', 'MESH'));
    }

    // Space Logic
    groundNodes.forEach(g => {
        let nearestShip = null; let minDest = 99999;
        satellites.forEach(s => {
            if (s.faction === g.faction) {
                const range = s.type === 'FALCON' ? width * 0.35 : width * 0.2;
                if (Math.abs(s.x - g.x) < range) {
                    const dist = Math.hypot(s.x - g.x, s.y - g.y);
                    if (dist < minDest) { minDest = dist; nearestShip = s; }
                }
            }
        });
        if (nearestShip) {
            const color = g.faction === 'EMPIRE' ? config.colors.laserEmpire : config.colors.laserRebel;
            const alpha = 1 - (minDest / (height * 0.8));
            if (alpha > 0) {
                const topY = g.y - g.height; ctx.setLineDash([5, 10]); ctx.lineDashOffset = -performance.now() * 0.1;
                ctx.beginPath(); ctx.moveTo(g.x, topY); ctx.lineTo(nearestShip.x, nearestShip.y);
                ctx.strokeStyle = color; ctx.globalAlpha = alpha * 0.6; ctx.lineWidth = 2; ctx.stroke();
                ctx.setLineDash([]); ctx.globalAlpha = 1.0;
                if (Math.random() < 0.01) {
                    if (Math.random() > 0.5) { packets.push(new Packet({ x: g.x, y: topY }, nearestShip, color, 'BATTLE')); ripples.push(new Ripple(g.x, topY, color, false)); }
                    else packets.push(new Packet(nearestShip, { x: g.x, y: topY }, color, 'BATTLE'));
                }
            }
        }
    });

    groundNodes.forEach(g => g.draw());
    oceanShips.forEach(s => s.draw());
    satellites.forEach(s => s.draw());
    packets.forEach((p, idx) => { p.update(); p.draw(); if (p.finished) packets.splice(idx, 1); });

    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = '10px Inter';
    ctx.fillText('INTEGRATED NTN-V2X MESH ACTIVE', 20, height * 0.08);

    requestAnimationFrame(animate);
}

resize();
animate();
