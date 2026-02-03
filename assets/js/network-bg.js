// Global variable for orbit selection
let clickedOrbit = null;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('network-canvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    const ctx = canvas.getContext('2d');

    let width, height;

    // ═══════════════════════════════════════════════════════════════
    // LANGUAGE SYSTEM
    // ═══════════════════════════════════════════════════════════════
    const translations = {
        en: {
            systemStatus: 'PLANETARY DEFENSE: ACTIVE // SYSTEM MONITORING',
            orbits: {
                geo: {
                    name: 'GEO',
                    full: 'GEOSTATIONARY EARTH ORBIT',
                    info: 'LATENCY: ~600ms | BROADCAST, WEATHER & GLOBAL BACKBONE'
                },
                meo: {
                    name: 'MEO',
                    full: 'MEDIUM EARTH ORBIT',
                    info: 'LATENCY: ~150ms | GNSS/GPS NAVIGATION & FIBER-LIKE DATA'
                },
                leo: {
                    name: 'LEO',
                    full: 'LOW EARTH ORBIT',
                    info: 'LATENCY: <30ms | HIGH-SPEED MESH BROADBAND & OBSERVATION'
                }
            }
        },
        tr: {
            systemStatus: 'GEZEGEN SAVUNMASI: AKTİF // SİSTEM İZLEME',
            orbits: {
                geo: {
                    name: 'GEO',
                    full: 'JEOSTASYONERİ YER YÖRÜNGESİ',
                    info: 'GECİKME: ~600ms | YAYINCILIK, HAVA DURUMU & KÜRESEL OMURGA'
                },
                meo: {
                    name: 'MEO',
                    full: 'ORTA YER YÖRÜNGESİ',
                    info: 'GECİKME: ~150ms | GNSS/GPS NAVİGASYON & FİBER HIZINDA VERİ'
                },
                leo: {
                    name: 'LEO',
                    full: 'DÜŞÜK YER YÖRÜNGESİ',
                    info: 'GECİKME: <30ms | YÜKSEK HIZLI AĞ GENİŞBANT & GÖZLEM'
                }
            }
        }
    };

    let currentLang = localStorage.getItem('selectedLanguage') || 'en';

    // Update language dynamically from localStorage
    function updateLanguage() {
        currentLang = localStorage.getItem('selectedLanguage') || 'en';
    }


    // ═══════════════════════════════════════════════════════════════
    // SYSTEM CONFIGURATION
    // ═══════════════════════════════════════════════════════════════
    const config = {
        colors: {
            bgTop: '#000000', // Deep Space Black
            bgBottom: '#0a0a15', // Dark Space Horizon
            groundGrid: 'rgba(50, 60, 70, 0.3)',
            tieColor: '#445566',
            xwingColor: '#99aabb',
            falconColor: '#b0c0d0',
            deathStarColor: '#778899',
            laserEmpire: '#55ff55',
            laserRebel: '#ff5555',
            rippleEmpire: 'rgba(100, 255, 100, 0.3)',
            rippleRebel: 'rgba(255, 100, 100, 0.3)',
            meshTower: '#4a5b6c', // Structure Grey
            shipHull: '#334455',
            citySilhouette: '#2f3a42', // Darker distant city
            ssdColor: '#2a333a', // Heavy dark metal
            meshLink: 'rgba(200, 220, 255, 0.2)',
            road: '#2b353b',
            carHeadlight: 'rgba(255, 255, 200, 0.6)',
            linkStation: 'rgba(0, 255, 255, 0.5)', // Cyan for Science
            linkV2X: 'rgba(255, 200, 0, 0.4)',      // Yellow/Orange for Cars

            // NTN Layer Colors
            linkGEO: '#d946ef', // Purple/Pink (High Latency/Altitude)
            linkMEO: '#0ea5e9', // Sky Blue (Medium)
            linkLEO: '#f59e0b', // Amber (Low Latency/Fast)

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

    // ═══════════════════════════════════════════════════════════════
    // RUNTIME STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════
    let satellites = [];
    let groundNodes = [];
    let oceanShips = [];
    let cities = [];
    let scenery = [];
    let spaceStation = null;
    let packets = [];
    let ripples = [];
    let stars = [];
    let orbitRegions = []; // For interactive orbit labels
    let skylinePoints = [];
    let bgCityLayers = [];
    let marineStructures = []; // Ocean surface structures

    const rand = (min, max) => Math.random() * (max - min) + min;

    // Planetary Surface Curvature Calculation
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

    // Orbital Curve Calculation (for satellites)
    function getOrbitY(x, baseAlt) {
        const cx = width / 2;
        const dx = x - cx;
        const maxDist = width * 0.6;
        const normDist = Math.abs(dx) / maxDist;
        const curveDepth = 40;
        const yOffset = normDist * normDist * curveDepth;
        return baseAlt + yOffset;
    }


    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        init();
    }
    window.addEventListener('resize', resize);

    // User Interface Tracking
    let mouseX = 0;
    let mouseY = 0;
    // Global event listener (canvas has pointer-events disabled)
    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });


    // Click handler for orbit selection
    window.addEventListener('click', () => {
        // Detect orbit region interaction
        let found = false;
        orbitRegions.forEach(region => {
            const { x, y, w, h } = region;
            if (mouseX >= x && mouseX <= x + w + 50 && mouseY >= y - 10 && mouseY <= y + h + 10) {
                if (clickedOrbit === region.data) clickedOrbit = null; // Deselect
                else clickedOrbit = region.data; // Select
                found = true;
            }
        });
        if (!found) clickedOrbit = null; // Clear selection on external click
    });



    // ═══════════════════════════════════════════════════════════════
    // ENTITY CLASS DEFINITIONS
    // ═══════════════════════════════════════════════════════════════
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
            this.x = x; this.structures = [];
            const count = rand(3, 6); // Fewer, bigger structures
            for (let i = 0; i < count; i++) {
                const type = Math.random() > 0.6 ? 'DOME' : 'SPIRE';
                this.structures.push({
                    type: type,
                    w: type === 'DOME' ? rand(40, 80) : rand(15, 30),
                    h: type === 'DOME' ? rand(30, 50) : rand(80, 200),
                    offX: (i * 30) - (count * 30 / 2)
                });
            }
        }
        draw() {
            const baseY = getGroundY(this.x) + 30; // Anchor deeper
            this.structures.forEach(b => {
                ctx.fillStyle = '#2f3a42'; // Dark Grey Structure

                if (b.type === 'DOME') {
                    ctx.beginPath();
                    ctx.arc(this.x + b.offX, baseY, b.w / 2, Math.PI, 0);
                    ctx.fill();
                    // Dome Rings
                    ctx.strokeStyle = '#4a5b6c';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(this.x + b.offX, baseY, b.w / 2 - 5, Math.PI, 0); ctx.stroke();
                    ctx.beginPath(); ctx.arc(this.x + b.offX, baseY, b.w / 2 - 15, Math.PI, 0); ctx.stroke();
                } else {
                    // Spire
                    ctx.fillRect(this.x + b.offX, baseY - b.h, b.w, b.h);
                    // Spire details
                    ctx.fillStyle = '#3e4a52';
                    ctx.fillRect(this.x + b.offX + 5, baseY - b.h + 10, b.w - 10, b.h - 10);

                    // Antenna on top
                    ctx.beginPath(); ctx.moveTo(this.x + b.offX + b.w / 2, baseY - b.h);
                    ctx.lineTo(this.x + b.offX + b.w / 2, baseY - b.h - 30);
                    ctx.strokeStyle = '#4a5b6c'; ctx.stroke();
                }
            });
        }
    }

    // [DEPRECATED] Scenery class removed - unnecessary for orbital focus

    // [DEPRECATED] Car class removed - V2X logic not required for NTN visualization

    // [DEPRECATED] SpaceStation class removed - replaced by SuperStarDestroyer

    class SuperStarDestroyer extends Entity {
        constructor() { super(-400, height * 0.15); this.vx = config.speeds.station; }
        update() {
            this.x += this.vx;
            // Atmospheric drift simulation
            this.y = (height * 0.15) + Math.sin(this.x * 0.005) * 5;

            if (this.x > width + 400) { this.x = -400; }

            // Strategic Ground Communication Protocol
            if (Math.random() < 0.015) {
                const target = groundNodes[Math.floor(Math.random() * groundNodes.length)];
                if (target) {
                    // Transmit GEO-layer command signal
                    packets.push(new Packet(this, { x: target.x, y: target.y - target.height }, config.colors.linkGEO, 'STATION'));
                }
            }
        }
        draw() {
            ctx.save(); ctx.translate(this.x, this.y);
            ctx.fillStyle = config.colors.ssdColor;

            // Executor-Class Arrowhead
            ctx.beginPath();
            ctx.moveTo(350, 0); // Long Nose
            ctx.lineTo(-200, -50); // Tail Left
            ctx.lineTo(-180, 0);   // Engine notch
            ctx.lineTo(-200, 50);  // Tail Right
            ctx.closePath();
            ctx.fill();

            // Layered Hull Plating (Greeble)
            ctx.fillStyle = '#222';
            ctx.beginPath(); ctx.moveTo(300, 0); ctx.lineTo(-150, -30); ctx.lineTo(-150, 30); ctx.fill();

            // Cityscape / Command Tower
            ctx.fillStyle = '#3a4a5a';
            ctx.fillRect(-120, -15, 80, 30); // Base city

            // Bridge Tower (T-shape typically, but side view checks)
            ctx.fillStyle = '#445566';
            ctx.fillRect(-60, -8, 20, 16);

            // Sensor Domes (Tiny)
            ctx.fillStyle = '#667788';
            ctx.beginPath(); ctx.arc(-50, -12, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(-50, 12, 3, 0, Math.PI * 2); ctx.fill();

            // Engine Glow (Massive Array)
            ctx.shadowBlur = 15; ctx.shadowColor = '#ff4444';
            ctx.fillStyle = '#ff3333';
            const engines = [-40, -25, -10, 10, 25, 40];
            engines.forEach(ey => {
                ctx.fillRect(-205, ey - 3, 6, 6);
            });
            ctx.shadowBlur = 0;

            // Lights
            if (Math.random() > 0.5) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(Math.random() * 200 - 100, Math.random() * 20 - 10, 1, 1);
            }

            ctx.restore();
        }
    }

    class Ripple {
        constructor(x, y, color) { this.x = x; this.y = y; this.radius = 1; this.speed = 1.5; this.color = color; this.opacity = 1.0; this.finished = false; }
        update() { this.radius += this.speed; this.opacity -= 0.02; if (this.opacity <= 0) this.finished = true; }
        draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.strokeStyle = this.color; ctx.globalAlpha = this.opacity; ctx.lineWidth = 1.5; ctx.stroke(); ctx.globalAlpha = 1.0; }
    }

    class SpaceShip extends Entity {
        constructor(type, layer, speed, startX) {
            super(0, 0);
            this.type = type;
            this.layer = layer; // GEO, MEO, LEO
            this.x = startX;
            this.speed = speed;
            this.faction = (type === 'TIE' || type === 'DEATH_STAR') ? 'EMPIRE' : 'REBEL';

            // Assign orbital altitude based on layer classification
            if (layer === 'GEO') this.baseAlt = height * 0.15;
            else if (layer === 'MEO') this.baseAlt = height * 0.35;
            else this.baseAlt = height * 0.55; // LEO

            this.y = getOrbitY(this.x, this.baseAlt);
        }
        update() {
            this.x += this.speed;
            if (this.x > width + 50) this.x = -50;
            if (this.x < -50) this.x = width + 50;

            // Recalculate position along orbital curve
            this.y = getOrbitY(this.x, this.baseAlt);

            let pingChance = 0.005;
            if (this.layer === 'GEO') pingChance = 0.02; // Higher altitude = lower ping frequency

            if (Math.random() < pingChance) {
                const color = this.faction === 'EMPIRE' ? config.colors.rippleEmpire : config.colors.rippleRebel;
                ripples.push(new Ripple(this.x, this.y, color));
            }
        }
        draw() {
            ctx.save(); ctx.translate(this.x, this.y);

            if (this.type === 'DEATH_STAR') {
                // Death Star - Detailed Tech Sphere
                const size = 30;
                // Main Body
                ctx.fillStyle = '#2b2b2b'; ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.fill();
                // Trench
                ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-size, 0); ctx.lineTo(size, 0); ctx.stroke();
                // Superlaser Dish
                ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(-12, -12, 9, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#444'; ctx.lineWidth = 1; ctx.stroke();
                // Surface Greebling (Random Tech lights/details)
                ctx.fillStyle = '#444';
                for (let i = 0; i < 8; i++) {
                    ctx.fillRect(Math.random() * 40 - 20, Math.random() * 40 - 20, 2, 2);
                }
            }
            else if (this.type === 'CARGO') {
                // HEAVY FREIGHTER
                // Engine Block
                ctx.fillStyle = '#333'; ctx.fillRect(-25, -6, 8, 12);
                // Engine Glow
                ctx.fillStyle = '#00ffff'; ctx.shadowBlur = 8; ctx.shadowColor = '#00ffff';
                ctx.fillRect(-27, -4, 2, 8); ctx.shadowBlur = 0;

                // Spine
                ctx.fillStyle = '#556677'; ctx.fillRect(-17, -2, 40, 4);

                // Cargo Containers (Modular)
                ctx.fillStyle = '#8b5a2b'; ctx.fillRect(-10, -8, 12, 6); // Brown Crate
                ctx.strokeStyle = '#a06b3c'; ctx.strokeRect(-10, -8, 12, 6);

                ctx.fillStyle = '#2f4f4f'; ctx.fillRect(5, -8, 12, 6); // Dark Slate Crate
                ctx.strokeStyle = '#406060'; ctx.strokeRect(5, -8, 12, 6);

                ctx.fillStyle = '#556b2f'; ctx.fillRect(-10, 2, 12, 6); // Olive Crate
                ctx.strokeStyle = '#6b8e23'; ctx.strokeRect(-10, 2, 12, 6);

                // Command Module (Front)
                ctx.fillStyle = '#778899'; ctx.beginPath();
                ctx.moveTo(23, -3); ctx.lineTo(30, 0); ctx.lineTo(23, 3); ctx.lineTo(23, -3); ctx.fill();
                // Cockpit light
                ctx.fillStyle = '#ffcc00'; ctx.fillRect(25, -1, 2, 2);
            }
            else if (this.type === 'TIE') {
                // TIE FIGHTER - Detailed
                // Solar Panels (Left/Right) - Hexagonal-ish
                ctx.fillStyle = '#111'; ctx.strokeStyle = '#444'; ctx.lineWidth = 1;

                const drawWing = (ox) => {
                    ctx.beginPath();
                    ctx.moveTo(ox, -10); ctx.lineTo(ox + 2, -5); ctx.lineTo(ox + 2, 5); ctx.lineTo(ox, 10); ctx.lineTo(ox - 2, 5); ctx.lineTo(ox - 2, -5);
                    ctx.closePath(); ctx.fill(); ctx.stroke();
                };
                drawWing(-8);
                drawWing(8);

                // Struts
                ctx.strokeStyle = '#555'; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke();

                // Cockpit Ball
                ctx.fillStyle = '#556677'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
                // Window
                ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
                // Shiny glint
                ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(-1, -1, 1, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1.0;

                // Ion Engine Ports (tiny red dots on back)
                ctx.fillStyle = '#ff3333'; ctx.fillRect(-3, -1, 1, 2);
            }
            ctx.restore();
        }
    }

    class StaticTower extends Entity {
        constructor(x) { super(x, getGroundY(x)); this.height = 15 + Math.random() * 15; this.type = 'TOWER'; this.faction = Math.random() > 0.5 ? 'EMPIRE' : 'REBEL'; }
        draw() {
            ctx.save(); ctx.translate(this.x, this.y);

            // Base - Sci-Fi Monolith
            ctx.fillStyle = '#1a2228';
            ctx.beginPath();
            ctx.moveTo(-6, 0); ctx.lineTo(-4, -this.height); ctx.lineTo(4, -this.height); ctx.lineTo(6, 0);
            ctx.fill();

            // Structure Lines
            ctx.strokeStyle = '#4a5b6c'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -this.height); ctx.stroke();

            // Status Lights (Blinking)
            const time = Date.now();
            ctx.fillStyle = (Math.floor(time / 500) % 2 === 0) ? '#00ff00' : '#005500';
            ctx.fillRect(-2, -this.height * 0.8, 4, 2);

            ctx.fillStyle = (Math.floor(time / 300) % 2 === 0) ? '#ff0000' : '#550000';
            ctx.fillRect(-2, -this.height * 0.6, 2, 2);

            // Rotating Radar Dish on Top
            ctx.save();
            ctx.translate(0, -this.height);
            // Rotation
            const angle = (time * 0.002) % (Math.PI * 2);
            // Tilt for 3D effect: scale Y
            ctx.scale(1, 0.3);
            ctx.rotate(angle);

            // Dish Bowl
            ctx.fillStyle = '#ccc';
            ctx.beginPath(); ctx.arc(0, -10, 8, 0, Math.PI, false); ctx.fill();
            ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.stroke();

            // Dish Focus
            ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, -18); ctx.stroke();
            ctx.fillStyle = config.colors.meshLink; ctx.beginPath(); ctx.arc(0, -18, 2, 0, Math.PI * 2); ctx.fill();

            ctx.restore();

            ctx.restore();
        }
    }

    class NavalShip extends Entity {
        constructor() { super(0, 0); this.x = rand(0, width); this.speed = rand(0.05, 0.2) * (Math.random() > 0.5 ? 1 : -1); }
        update() { this.x += this.speed; if (this.x > width) this.x = 0; if (this.x < 0) this.x = width; this.y = getOceanY(this.x); }
        draw() {
            ctx.save(); ctx.translate(this.x, this.y);

            // Stealth Hull (Angular)
            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.moveTo(-15, 0); // Stern water line
            ctx.lineTo(-12, -8); // Stern deck
            ctx.lineTo(8, -6); // Mid deck
            ctx.lineTo(18, 0); // Bow
            ctx.lineTo(-10, 2); // Underwater hull hint
            ctx.fill();

            // Superstructure (Radar tower)
            ctx.fillStyle = '#34495e';
            ctx.beginPath();
            ctx.moveTo(-5, -6); ctx.lineTo(0, -14); ctx.lineTo(5, -6);
            ctx.fill();

            // Bridge Window
            ctx.fillStyle = '#00ffff'; ctx.fillRect(-2, -10, 4, 2);

            // Radar Mast
            ctx.strokeStyle = '#7f8c8d'; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, -18); ctx.stroke();
            // Blip
            if (Math.random() > 0.8) {
                ctx.fillStyle = '#00ff00'; ctx.fillRect(-1, -19, 2, 2);
            }

            // Wake Effect
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(-25, -2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(-25, 2); ctx.stroke();

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
        satellites = []; groundNodes = []; oceanShips = []; cities = []; packets = []; ripples = []; stars = []; skylinePoints = []; bgCityLayers = []; orbitRegions = []; marineStructures = [];

        for (let i = 0; i < 100; i++) stars.push(new Star());

        // Generate distant skyline silhouette
        for (let x = 0; x <= width; x += 40) {
            const h = 40 + Math.random() * 60;
            skylinePoints.push({ x: x, h: h });
        }

        // Generate parallax city layers (depth simulation)
        bgCityLayers = [];
        // Layer 1: Distant horizon (atmospheric haze effect)
        bgCityLayers.push(generateCityLayer(200, height * 0.4, '#0e141a', 0.5));
        // Layer 2: Mid-range structures (enhanced detail)
        bgCityLayers.push(generateCityLayer(100, height * 0.25, '#151d25', 0.8));
        // Layer 3: Foreground installations (maximum fidelity)
        bgCityLayers.push(generateCityLayer(50, height * 0.15, '#1c2630', 1.0));

        for (let i = 0; i < config.counts.towers; i++) {
            const x = (width / config.counts.towers) * (i + 0.5);
            groundNodes.push(new StaticTower(x));
        }
        // Initialize remaining entities
        for (let i = 0; i < config.counts.ships; i++) oceanShips.push(new NavalShip());
        for (let i = 0; i < config.counts.cities; i++) {
            const x = (width / config.counts.cities) * i + (width / 6);
            cities.push(new City(x));
        }

        // Non-Terrestrial Network (NTN) Satellite Deployment
        // Capital ship: Mon Calamari flagship (GEO layer)
        satellites.push(new SpaceShip('HOME_ONE', 'GEO', 0.03, width * 0.2));

        // Logistics fleet: Heavy cargo transports (MEO layer)
        for (let i = 0; i < 6; i++) {
            const type = 'CARGO';
            const startX = (width / 6) * i;
            const speed = 0.2 * (Math.random() > 0.5 ? 1 : -1);
            satellites.push(new SpaceShip(type, 'MEO', speed, startX));
        }

        for (let i = 0; i < 8; i++) {
            const startX = (width / 8) * i;
            const speed = 0.8 * (Math.random() > 0.5 ? 1 : -1);
            satellites.push(new SpaceShip('TIE', 'LEO', speed, startX));
        }

        spaceStation = new SuperStarDestroyer();
    }

    function generateCityLayer(count, avgHeight, color, density) {
        let layer = { color: color, buildings: [] };
        for (let i = 0; i < count; i++) {
            const w = rand(30, 120);
            const h = avgHeight * (0.5 + Math.random());
            const x = rand(-200, width + 200);
            // Types: BLOCK (Standard), SPIRE (Tall/Thin), SLANT (Angled Roof)
            let type = 'BLOCK';
            if (Math.random() > 0.7) type = 'SLANT';
            if (h > avgHeight * 1.2) type = 'SPIRE';

            layer.buildings.push({ x: x, w: w, h: h, type: type });
        }
        return layer;
    }

    function drawBackground() {
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, config.colors.bgTop); // Hazy Sky
        grad.addColorStop(1, config.colors.bgBottom); // Horizon
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Stars
        stars.forEach(s => { s.update(); s.draw(); });

        // RENDER CITY LAYERS (Back to Front)
        if (bgCityLayers) {
            bgCityLayers.forEach(layer => {
                ctx.fillStyle = layer.color;
                layer.buildings.forEach(b => {
                    const groundY = height;

                    // Shape Logic
                    if (b.type === 'SLANT') {
                        ctx.beginPath();
                        ctx.moveTo(b.x, groundY);
                        ctx.lineTo(b.x, groundY - b.h);
                        ctx.lineTo(b.x + b.w, groundY - b.h * 0.85); // Slant down
                        ctx.lineTo(b.x + b.w, groundY);
                        ctx.fill();
                    } else if (b.type === 'SPIRE') {
                        ctx.beginPath();
                        ctx.moveTo(b.x + b.w * 0.2, groundY);
                        ctx.lineTo(b.x + b.w * 0.4, groundY - b.h); // Peak
                        ctx.lineTo(b.x + b.w * 0.6, groundY - b.h); // Flat top small
                        ctx.lineTo(b.x + b.w * 0.8, groundY);
                        ctx.fill();
                        // Antenna on spire
                        ctx.beginPath(); ctx.moveTo(b.x + b.w * 0.5, groundY - b.h);
                        ctx.lineTo(b.x + b.w * 0.5, groundY - b.h - 30);
                        ctx.strokeStyle = layer.color; ctx.lineWidth = 2; ctx.stroke();
                    } else {
                        // BLOCK
                        ctx.fillRect(b.x, groundY - b.h, b.w, b.h);
                    }

                    // SUBTLE DETAILS: Removed per user request

                    ctx.fillStyle = layer.color; // Reset for next building
                });
            });
        }

        // Draw active Cities
        cities.forEach(c => c.draw());

        // FOREGROUND GROUND - Dense Metallic City Surface

        // Fill background of ground
        ctx.beginPath();
        ctx.moveTo(0, height);
        const steps = 60;
        for (let i = 0; i <= steps; i++) { const x = (width / steps) * i; ctx.lineTo(x, getGroundY(x)); }
        ctx.lineTo(width, height);
        ctx.fillStyle = '#1e252b'; // Dark metal base
        ctx.fill();

        // Draw "Greeble" Blocks on ground
        for (let i = 0; i <= steps; i++) {
            const x = (width / steps) * i;
            const y = getGroundY(x);

            // Random tech blocks on surface
            if (i % 2 === 0) {
                ctx.fillStyle = '#2a333a';
                const h = Math.random() * 20;
                ctx.fillRect(x, y, (width / steps), h);
                // Side highlight
                ctx.fillStyle = '#3e4a52';
                ctx.fillRect(x + (width / steps) - 2, y, 2, h);
            }
        }

        // Surface Grid
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) { const x = (width / steps) * i; ctx.lineTo(x, getGroundY(x)); }
        ctx.lineWidth = 1; ctx.strokeStyle = '#3e4a52'; ctx.stroke();
    }

    function drawOrbitLines() {
        // Only draws the dashed lines (Background Layer)
        ctx.save();
        const cx = width / 2;
        orbitRegions = []; // Reset and Populate for UI check

        // Define orbits properties (dynamic language support)
        const t = translations[currentLang].orbits;
        const orbits = [
            {
                name: t.geo.name,
                full: t.geo.full,
                alt: height * 0.15,
                color: "#d946ef",
                info: t.geo.info
            },
            {
                name: t.meo.name,
                full: t.meo.full,
                alt: height * 0.35,
                color: "#0ea5e9",
                info: t.meo.info
            },
            {
                name: t.leo.name,
                full: t.leo.full,
                alt: height * 0.55,
                color: "#f59e0b",
                info: t.leo.info
            }
        ];

        orbits.forEach(orbit => {
            ctx.beginPath();
            let labelY = orbit.alt;

            for (let x = 0; x <= width; x += 20) {
                const dx = (x - cx) / width;
                const curve = 150 * (dx * dx);
                const y = orbit.alt + curve;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);

                if (x >= 40 && x < 60) labelY = y;
            }
            ctx.strokeStyle = orbit.color;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 15]);
            ctx.globalAlpha = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
            ctx.setLineDash([]);

            // Store Region for UI Function
            const labelX = 30;
            const text = orbit.name + " LAYER";
            ctx.font = "bold 12px 'Courier New', monospace";
            const metrics = ctx.measureText(text);
            const w = metrics.width + 20;
            const h = 24;

            orbitRegions.push({ x: labelX, y: labelY - 15, w: w, h: h, data: orbit });
        });

        ctx.restore();
    }

    // Orbit UI Rendering (Labels and Info Panels)
    function drawOrbitUI() {
        ctx.save();
        orbitRegions.forEach(region => {
            const orbit = region.data;
            const { x, y, w, h } = region;

            // Expanded Hitbox
            const isHover = (mouseX >= x && mouseX <= x + w + 50 && mouseY >= y - 10 && mouseY <= y + h + 10);

            // Label Background
            ctx.fillStyle = isHover ? orbit.color : 'rgba(10, 20, 30, 0.8)';
            ctx.strokeStyle = orbit.color;
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + w - 10, y);
            ctx.lineTo(x + w, y + 10);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x + 10, y + h);
            ctx.lineTo(x, y + h - 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Text
            ctx.fillStyle = isHover ? '#000' : orbit.color;
            ctx.font = "bold 12px 'Courier New', monospace";
            ctx.fillText(orbit.name + " LAYER", x + 10, y + 16);

            // Tooltip on Hover OR Detailed Panel on Click
            if (isHover || clickedOrbit === orbit) {
                const boxWidth = clickedOrbit === orbit ? 380 : 280;
                const boxHeight = clickedOrbit === orbit ? 140 : 50;
                const tx = x + w + 20;
                const ty = y - 10;

                // Ensure box stays within canvas bounds
                const finalX = Math.min(tx, width - boxWidth - 20);
                const finalY = Math.max(20, Math.min(ty, height - boxHeight - 20));

                // Box
                ctx.fillStyle = 'rgba(5, 10, 15, 0.95)';
                ctx.strokeStyle = orbit.color;
                ctx.lineWidth = clickedOrbit === orbit ? 2 : 1;

                if (clickedOrbit === orbit) {
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = orbit.color;
                }

                ctx.fillRect(finalX, finalY, boxWidth, boxHeight);
                ctx.strokeRect(finalX, finalY, boxWidth, boxHeight);
                ctx.shadowBlur = 0;

                if (clickedOrbit === orbit) {
                    // Detailed Panel
                    // Header bar
                    ctx.fillStyle = orbit.color;
                    ctx.fillRect(finalX, finalY, boxWidth, 30);

                    // Header text
                    ctx.fillStyle = '#000';
                    ctx.font = "bold 14px 'Courier New', monospace";
                    ctx.fillText(orbit.full, finalX + 10, finalY + 20);

                    // Content
                    ctx.fillStyle = orbit.color;
                    ctx.font = "11px 'Courier New', monospace";

                    let details = [];
                    if (orbit.name === 'GEO') {
                        details = [
                            `ALTITUDE: 35,786 km (22,236 mi)`,
                            `ORBITAL PERIOD: 24 hours (Geostationary)`,
                            `COVERAGE: 1/3 of Earth per satellite`,
                            `USE CASES: TV Broadcast, Weather, VSAT`,
                            `LATENCY: ~600ms RTT (High)`,
                            `BANDWIDTH: Medium | STABILITY: Excellent`
                        ];
                    } else if (orbit.name === 'MEO') {
                        details = [
                            `ALTITUDE: 2,000-35,000 km`,
                            `ORBITAL PERIOD: 2-12 hours`,
                            `COVERAGE: Regional, requires handoff`,
                            `USE CASES: GPS, GLONASS, Galileo`,
                            `LATENCY: ~150ms RTT (Medium)`,
                            `BANDWIDTH: High | STABILITY: Good`
                        ];
                    } else {
                        details = [
                            `ALTITUDE: 160-2,000 km (99-1,243 mi)`,
                            `ORBITAL PERIOD: 90-120 minutes`,
                            `COVERAGE: Narrow, frequent handoffs`,
                            `USE CASES: Starlink, OneWeb, IoT`,
                            `LATENCY: <30ms RTT (Ultra-low)`,
                            `BANDWIDTH: Very High | STABILITY: Fair`
                        ];
                    }

                    details.forEach((line, idx) => {
                        ctx.fillText(line, finalX + 10, finalY + 50 + (idx * 15));
                    });
                } else {
                    // Simple Hover Tooltip
                    ctx.beginPath(); ctx.moveTo(x + w, y + 10); ctx.lineTo(finalX, finalY + 25); ctx.stroke();

                    ctx.fillStyle = orbit.color;
                    ctx.font = "bold 13px 'Courier New'";
                    ctx.fillText(orbit.full, finalX + 10, finalY + 20);

                    ctx.fillStyle = '#ccc';
                    ctx.font = "11px Inter";
                    ctx.fillText(orbit.info, finalX + 10, finalY + 38);
                }
            }
        });
        ctx.restore();
    }

    function animate() {
        updateLanguage(); // Sync with site language
        drawBackground();
        drawOrbitLines(); // Draw Lines first

        spaceStation.update(); spaceStation.draw();
        satellites.forEach(s => s.update());
        oceanShips.forEach(s => s.update());
        // scenery.forEach(s => s.draw());

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
                    // Range depends on layer (GEO covers more)
                    let range = width * 0.2;
                    if (s.layer === 'GEO') range = width * 0.8;
                    else if (s.layer === 'MEO') range = width * 0.5;

                    if (Math.abs(s.x - g.x) < range) {
                        const dist = Math.hypot(s.x - g.x, s.y - g.y);
                        if (dist < minDest) { minDest = dist; nearestShip = s; }
                    }
                }
            });
            if (nearestShip) {
                // Color based on Layer
                let color;
                if (nearestShip.layer === 'GEO') color = config.colors.linkGEO;
                else if (nearestShip.layer === 'MEO') color = config.colors.linkMEO;
                else color = config.colors.linkLEO;

                const alpha = 1 - (minDest / (height)); // Allow longer links
                if (alpha > 0) {
                    const topY = g.y - g.height; ctx.setLineDash([5, 10]); ctx.lineDashOffset = -performance.now() * 0.1;
                    ctx.beginPath(); ctx.moveTo(g.x, topY); ctx.lineTo(nearestShip.x, nearestShip.y);
                    ctx.strokeStyle = color; ctx.globalAlpha = alpha * 0.6; ctx.lineWidth = 1; ctx.stroke();
                    ctx.setLineDash([]); ctx.globalAlpha = 1.0;
                    if (Math.random() < 0.005) {
                        // Send packet
                        if (Math.random() > 0.5) {
                            packets.push(new Packet({ x: g.x, y: topY }, nearestShip, color, 'BATTLE'));
                            ripples.push(new Ripple(g.x, topY, color, false));
                        }
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
        ctx.fillText(translations[currentLang].systemStatus, 20, height * 0.08);

        drawOrbitUI(); // Draw UI last (on top)

        requestAnimationFrame(animate);
    }

    resize();
    animate();

}); // End of DOMContentLoaded
