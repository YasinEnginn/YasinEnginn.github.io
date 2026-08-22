(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const DEG = 180 / Math.PI;

  // Calibrated circular-reference scenario used by the project. These are
  // model inputs, not live constellation telemetry or operator specifications.
  const INPUT = Object.freeze({
    earthRadiusKm: 6378.137,
    altitudeKm: 1200,
    gravitationalParameterKm3S2: 398600.4418,
    speedOfLightKmS: 299792.458,
    satelliteCount: 8,
    minimumElevationDeg: 25,
    visualTimeScale: 64
  });

  const orbitRadiusKm = INPUT.earthRadiusKm + INPUT.altitudeKm;
  const orbitalPeriodS = TAU * Math.sqrt(
    (orbitRadiusKm ** 3) / INPUT.gravitationalParameterKm3S2
  );
  const meanMotionRadS = Math.sqrt(
    INPUT.gravitationalParameterKm3S2 / (orbitRadiusKm ** 3)
  );
  const phaseSpacingRad = TAU / INPUT.satelliteCount;
  const phaseTimeS = orbitalPeriodS / INPUT.satelliteCount;
  const adjacentIslDistanceKm = 2 * orbitRadiusKm * Math.sin(Math.PI / INPUT.satelliteCount);
  const adjacentIslClearanceKm = orbitRadiusKm * Math.cos(Math.PI / INPUT.satelliteCount)
    - INPUT.earthRadiusKm;
  const adjacentIslOwltMs = (adjacentIslDistanceKm / INPUT.speedOfLightKmS) * 1000;

  const DERIVED = Object.freeze({
    orbitRadiusKm,
    orbitalPeriodS,
    meanMotionRadS,
    phaseSpacingRad,
    phaseTimeS,
    adjacentIslDistanceKm,
    adjacentIslClearanceKm,
    adjacentIslOwltMs
  });

  // Exposed read-only for the site's lightweight numerical smoke test.
  window.NetSatBenchReferenceModel = Object.freeze({ input: INPUT, derived: DERIVED });

  const copy = {
    en: {
      model: "CALIBRATED CIRCULAR REFERENCE",
      accelerated: "accelerated model time ×64 · not live telemetry",
      groundA: "reference ground A",
      groundB: "reference ground B",
      contact: "CONTACT",
      stored: "STORED",
      stages: [
        ["Scenario inputs", "orbit · ground · RF"],
        ["Geometry", "AOS/LOS · ρ/c · rate"],
        ["Synchronized plans", "epochs · contact/range"],
        ["Shared T₀", "one time reference"],
        ["Runtime", "NetSatBench + ION-DTN"],
        ["Evidence", "logs · PCAP · results"]
      ]
    },
    tr: {
      model: "KALİBRE DAİRESEL REFERANS",
      accelerated: "hızlandırılmış model zamanı ×64 · canlı telemetri değildir",
      groundA: "referans yer A",
      groundB: "referans yer B",
      contact: "TEMAS",
      stored: "SAKLANIYOR",
      stages: [
        ["Senaryo girdileri", "yörünge · yer · RF"],
        ["Geometri", "AOS/LOS · ρ/c · hız"],
        ["Eşzamanlı planlar", "epoch · contact/range"],
        ["Ortak T₀", "tek zaman referansı"],
        ["Çalışma zamanı", "NetSatBench + ION-DTN"],
        ["Kanıt", "log · PCAP · sonuç"]
      ]
    }
  };

  function language() {
    return document.documentElement.lang?.toLowerCase().startsWith("tr") ? "tr" : "en";
  }

  function palette() {
    const light = document.documentElement.dataset.theme === "light"
      || document.documentElement.dataset.bsTheme === "light";
    return light
      ? {
          background: "#edf3f7",
          grid: "rgba(31, 72, 104, 0.08)",
          earth: "#dbe8ef",
          earthLine: "rgba(24, 92, 126, 0.58)",
          land: "rgba(42, 125, 134, 0.24)",
          orbit: "rgba(24, 92, 126, 0.34)",
          satellite: "#0f6f92",
          ground: "#a5630b",
          link: "rgba(15, 111, 146, 0.58)",
          isl: "rgba(74, 105, 126, 0.24)",
          text: "rgba(17, 42, 59, 0.78)",
          muted: "rgba(17, 42, 59, 0.54)",
          panel: "rgba(255, 255, 255, 0.66)",
          panelLine: "rgba(24, 92, 126, 0.22)",
          bundle: "#bd720d"
        }
      : {
          background: "#030711",
          grid: "rgba(113, 212, 255, 0.055)",
          earth: "#0b2131",
          earthLine: "rgba(113, 212, 255, 0.62)",
          land: "rgba(73, 170, 156, 0.2)",
          orbit: "rgba(113, 212, 255, 0.3)",
          satellite: "#71d4ff",
          ground: "#f6c453",
          link: "rgba(113, 212, 255, 0.66)",
          isl: "rgba(165, 194, 214, 0.2)",
          text: "rgba(232, 242, 255, 0.8)",
          muted: "rgba(176, 198, 216, 0.58)",
          panel: "rgba(5, 14, 24, 0.62)",
          panelLine: "rgba(113, 212, 255, 0.2)",
          bundle: "#f6c453"
        };
  }

  function satelliteState(index, modelTimeS) {
    const argument = meanMotionRadS * modelTimeS + index * phaseSpacingRad;
    return {
      index,
      argument,
      xKm: orbitRadiusKm * Math.cos(argument),
      yKm: orbitRadiusKm * Math.sin(argument)
    };
  }

  function groundState(angle) {
    return {
      xKm: INPUT.earthRadiusKm * Math.cos(angle),
      yKm: INPUT.earthRadiusKm * Math.sin(angle),
      angle
    };
  }

  function observe(satellite, ground) {
    const dx = satellite.xKm - ground.xKm;
    const dy = satellite.yKm - ground.yKm;
    const rangeKm = Math.hypot(dx, dy);
    const upX = ground.xKm / INPUT.earthRadiusKm;
    const upY = ground.yKm / INPUT.earthRadiusKm;
    const elevationRatio = (dx * upX + dy * upY) / rangeKm;
    const elevationDeg = Math.asin(Math.max(-1, Math.min(1, elevationRatio))) * DEG;
    return {
      rangeKm,
      elevationDeg,
      owltMs: (rangeKm / INPUT.speedOfLightKmS) * 1000,
      visible: elevationDeg >= INPUT.minimumElevationDeg
    };
  }

  function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawGrid(ctx, width, height, colors, dense) {
    const step = dense ? 36 : 64;
    ctx.save();
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    for (let x = 0.5; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0.5; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawArrow(ctx, fromX, fromY, toX, toY, color) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - 5 * Math.cos(angle - Math.PI / 6), toY - 5 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - 5 * Math.cos(angle + Math.PI / 6), toY - 5 * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function inactivePanelColor(colors) {
    return colors.panel.includes("0.66")
      ? colors.panel.replace("0.66", "0.34")
      : colors.panel.replace("0.62", "0.34");
  }

  function drawPipeline(ctx, box, nowMs, colors, labels, compact) {
    const stages = labels.stages;
    const active = Math.floor(nowMs / 2600) % stages.length;
    const gap = compact ? 7 : 10;
    const grid = compact && box.height >= 105;
    const vertical = !grid && box.height > box.width * 0.55;
    const gridPath = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 2], [1, 2]];
    const itemWidth = grid
      ? (box.width - gap) / 2
      : vertical
        ? box.width
        : (box.width - gap * (stages.length - 1)) / stages.length;
    const itemHeight = grid
      ? (box.height - gap * 2) / 3
      : vertical
        ? (box.height - gap * (stages.length - 1)) / stages.length
        : box.height;
    const items = stages.map((stage, index) => {
      const gridPosition = gridPath[index];
      return {
        stage,
        index,
        x: grid
          ? box.x + gridPosition[0] * (itemWidth + gap)
          : vertical ? box.x : box.x + index * (itemWidth + gap),
        y: grid
          ? box.y + gridPosition[1] * (itemHeight + gap)
          : vertical ? box.y + index * (itemHeight + gap) : box.y,
        width: itemWidth,
        height: itemHeight
      };
    });

    items.forEach((item, index) => {
      const { stage, x, y, width, height } = item;
      const highlighted = index === active;

      ctx.save();
      roundRect(ctx, x, y, width, height, 8);
      ctx.fillStyle = highlighted ? colors.panel : inactivePanelColor(colors);
      ctx.fill();
      ctx.strokeStyle = highlighted ? colors.link : colors.panelLine;
      ctx.lineWidth = highlighted ? 1.3 : 1;
      ctx.stroke();

      roundRect(ctx, x + 1, y + 1, width - 2, height - 2, 7);
      ctx.clip();
      ctx.fillStyle = colors.text;
      ctx.font = `${compact ? 600 : 650} ${compact ? 9 : 11}px Inter, system-ui, sans-serif`;
      ctx.fillText(stage[0], x + 9, y + (compact ? 17 : 20), Math.max(1, width - 18));
      if (!compact || height > 36) {
        ctx.fillStyle = colors.muted;
        ctx.font = `${compact ? 8 : 9.5}px ui-monospace, SFMono-Regular, Consolas, monospace`;
        ctx.fillText(stage[1], x + 9, y + (compact ? 31 : 36), Math.max(1, width - 18));
      }
      ctx.restore();
    });

    items.slice(0, -1).forEach((item, index) => {
      const next = items[index + 1];
      if (Math.abs(item.y - next.y) < 1) {
        const movingRight = next.x > item.x;
        drawArrow(
          ctx,
          movingRight ? item.x + item.width : item.x,
          item.y + item.height / 2,
          movingRight ? next.x - 2 : next.x + next.width + 2,
          next.y + next.height / 2,
          colors.muted
        );
      } else {
        drawArrow(
          ctx,
          item.x + item.width / 2,
          item.y + item.height,
          next.x + next.width / 2,
          next.y - 2,
          colors.muted
        );
      }
    });
  }

  function drawTravelingBundle(ctx, points, progress, colors) {
    const lengths = points.slice(1).map((point, index) => Math.hypot(
      point.x - points[index].x,
      point.y - points[index].y
    ));
    const totalLength = lengths.reduce((sum, length) => sum + length, 0);
    let remaining = (0.5 - Math.cos(progress * Math.PI) / 2) * totalLength;
    let x = points[0].x;
    let y = points[0].y;
    for (let index = 0; index < lengths.length; index += 1) {
      const length = lengths[index];
      if (remaining <= length || index === lengths.length - 1) {
        const ratio = length > 0 ? Math.min(1, remaining / length) : 0;
        x = points[index].x + (points[index + 1].x - points[index].x) * ratio;
        y = points[index].y + (points[index + 1].y - points[index].y) * ratio;
        break;
      }
      remaining -= length;
    }
    ctx.save();
    ctx.shadowColor = colors.bundle;
    ctx.shadowBlur = 12;
    ctx.fillStyle = colors.bundle;
    roundRect(ctx, x - 3.5, y - 3.5, 7, 7, 2);
    ctx.fill();
    ctx.restore();
  }

  function drawStoredBundle(ctx, point, colors) {
    ctx.save();
    ctx.fillStyle = colors.bundle;
    for (let i = 0; i < 3; i += 1) {
      roundRect(ctx, point.x + i * 7 - 9, point.y - 18, 5, 5, 1.5);
      ctx.fill();
    }
    ctx.restore();
  }

  function shortestRingPath(startIndex, endIndex, count) {
    const clockwise = (endIndex - startIndex + count) % count;
    const counterClockwise = (startIndex - endIndex + count) % count;
    const step = clockwise <= counterClockwise ? 1 : -1;
    const path = [startIndex];
    let current = startIndex;
    while (current !== endIndex) {
      current = (current + step + count) % count;
      path.push(current);
    }
    return path;
  }

  function strokePath(ctx, points, color, width) {
    if (points.length < 2) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.stroke();
    ctx.restore();
  }

  function drawReferenceOrbit(ctx, bounds, modelTimeS, nowMs, colors, labels, detailed) {
    const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    const orbitPx = Math.min(bounds.width, bounds.height) * (detailed ? 0.39 : 0.38);
    const earthPx = orbitPx * (INPUT.earthRadiusKm / orbitRadiusKm);
    const pxPerKm = orbitPx / orbitRadiusKm;
    const project = (point) => ({
      x: center.x + point.xKm * pxPerKm,
      y: center.y - point.yKm * pxPerKm
    });
    const satellites = Array.from(
      { length: INPUT.satelliteCount },
      (_, index) => satelliteState(index, modelTimeS)
    );
    const grounds = [
      { ...groundState(0), label: labels.groundA },
      { ...groundState(Math.PI), label: labels.groundB }
    ];
    const groundPoints = grounds.map(project);
    const bestContacts = grounds.map((ground) => satellites
      .map((satellite) => ({ satellite, observation: observe(satellite, ground) }))
      .filter((item) => item.observation.visible)
      .sort((a, b) => b.observation.elevationDeg - a.observation.elevationDeg)[0] || null);

    ctx.save();
    ctx.strokeStyle = colors.orbit;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 7]);
    ctx.beginPath();
    ctx.arc(center.x, center.y, orbitPx, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);

    const earthGradient = ctx.createRadialGradient(
      center.x - earthPx * 0.28,
      center.y - earthPx * 0.3,
      earthPx * 0.12,
      center.x,
      center.y,
      earthPx
    );
    earthGradient.addColorStop(0, colors.land);
    earthGradient.addColorStop(1, colors.earth);
    ctx.fillStyle = earthGradient;
    ctx.strokeStyle = colors.earthLine;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, earthPx, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = colors.grid;
    [-0.45, 0, 0.45].forEach((offset) => {
      ctx.beginPath();
      ctx.ellipse(center.x, center.y + earthPx * offset, earthPx * Math.cos(offset), earthPx * 0.16, 0, 0, TAU);
      ctx.stroke();
    });

    if (adjacentIslClearanceKm >= 0) {
      satellites.forEach((satellite, index) => {
        const next = satellites[(index + 1) % satellites.length];
        const a = project(satellite);
        const b = project(next);
        ctx.strokeStyle = colors.isl;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
    }

    const sourceContact = bestContacts[0];
    const destinationContact = bestContacts[1];
    if (sourceContact && destinationContact && adjacentIslClearanceKm >= 0) {
      const satelliteIndices = shortestRingPath(
        sourceContact.satellite.index,
        destinationContact.satellite.index,
        satellites.length
      );
      const routePoints = [
        groundPoints[0],
        ...satelliteIndices.map((index) => project(satellites[index])),
        groundPoints[1]
      ];
      strokePath(ctx, routePoints, colors.link, detailed ? 2.1 : 1.35);
      drawTravelingBundle(ctx, routePoints, (nowMs / 5200) % 1, colors);
    } else {
      drawStoredBundle(ctx, groundPoints[0], colors);
    }

    grounds.forEach((ground, groundIndex) => {
      const groundPoint = groundPoints[groundIndex];
      const best = bestContacts[groundIndex];

      if (best) {
        const satellitePoint = project(best.satellite);
        ctx.strokeStyle = colors.link;
        ctx.lineWidth = detailed ? 1.8 : 1.15;
        ctx.beginPath();
        ctx.moveTo(groundPoint.x, groundPoint.y);
        ctx.lineTo(satellitePoint.x, satellitePoint.y);
        ctx.stroke();

        if (detailed) {
          ctx.fillStyle = colors.link;
          ctx.font = "600 9px ui-monospace, SFMono-Regular, Consolas, monospace";
          ctx.textAlign = groundIndex === 0 ? "right" : "left";
          ctx.fillText(
            `${labels.contact} · ε ${best.observation.elevationDeg.toFixed(1)}° · ${best.observation.owltMs.toFixed(2)} ms`,
            groundPoint.x + (groundIndex === 0 ? -8 : 8),
            groundPoint.y + (groundIndex === 0 ? 30 : -24)
          );
          ctx.textAlign = "left";
        }
      } else if (detailed && groundIndex === 0) {
        ctx.fillStyle = colors.muted;
        ctx.font = "600 9px ui-monospace, SFMono-Regular, Consolas, monospace";
        ctx.textAlign = "right";
        ctx.fillText(labels.stored, groundPoint.x - 8, groundPoint.y + 30);
        ctx.textAlign = "left";
      }

      ctx.fillStyle = colors.ground;
      ctx.beginPath();
      ctx.arc(groundPoint.x, groundPoint.y, detailed ? 4.2 : 3.3, 0, TAU);
      ctx.fill();
      if (detailed) {
        ctx.fillStyle = colors.muted;
        ctx.font = "9px Inter, system-ui, sans-serif";
        ctx.textAlign = groundIndex === 0 ? "right" : "left";
        ctx.fillText(ground.label, groundPoint.x + (groundIndex === 0 ? -8 : 8), groundPoint.y + 4);
        ctx.textAlign = "left";
      }
    });

    satellites.forEach((satellite) => {
      const point = project(satellite);
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.rotate(-satellite.argument);
      ctx.fillStyle = colors.satellite;
      roundRect(ctx, -4.5, -3.2, 9, 6.4, 1.6);
      ctx.fill();
      ctx.strokeStyle = colors.satellite;
      ctx.globalAlpha = 0.72;
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(-4.5, 0);
      ctx.moveTo(4.5, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();
      ctx.restore();
    });

    ctx.fillStyle = colors.text;
    ctx.font = `${detailed ? 650 : 600} ${detailed ? 10 : 9}px ui-monospace, SFMono-Regular, Consolas, monospace`;
    ctx.fillText(`N = ${INPUT.satelliteCount} · h = ${INPUT.altitudeKm} km · εmin = ${INPUT.minimumElevationDeg}°`, bounds.x + 6, bounds.y + 14);
    ctx.fillStyle = colors.muted;
    ctx.fillText(`T = ${orbitalPeriodS.toFixed(3)} s · dISL = ${adjacentIslDistanceKm.toFixed(3)} km`, bounds.x + 6, bounds.y + 29);
    ctx.restore();
  }

  class ModelCanvas {
    constructor(canvas, requestDraw) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      this.mode = canvas.dataset.nsbModel || "diagram";
      this.requestDraw = requestDraw;
      this.visible = true;
      this.width = 0;
      this.height = 0;
      this.dpr = 1;
      this.resize = this.resize.bind(this);
      this.resize();

      if ("ResizeObserver" in window) {
        this.resizeObserver = new ResizeObserver(this.resize);
        this.resizeObserver.observe(canvas);
      } else {
        window.addEventListener("resize", this.resize, { passive: true });
      }

      if ("IntersectionObserver" in window) {
        this.intersectionObserver = new IntersectionObserver((entries) => {
          this.visible = entries.some((entry) => entry.isIntersecting);
          if (this.visible) this.requestDraw();
        }, { threshold: 0.01 });
        this.intersectionObserver.observe(canvas);
      }
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width || window.innerWidth));
      const height = Math.max(1, Math.round(rect.height || window.innerHeight));
      const dprLimit = this.mode === "ambient" ? 1.5 : 2;
      const dpr = Math.min(window.devicePixelRatio || 1, dprLimit);
      if (width === this.width && height === this.height && dpr === this.dpr) return;
      this.width = width;
      this.height = height;
      this.dpr = dpr;
      this.canvas.width = Math.round(width * dpr);
      this.canvas.height = Math.round(height * dpr);
      this.requestDraw();
    }

    draw(nowMs, staticFrame) {
      if (!this.ctx || !this.visible) return;
      const ctx = this.ctx;
      const colors = palette();
      const labels = copy[language()];
      const width = this.width;
      const height = this.height;
      const modelTimeS = staticFrame ? orbitalPeriodS * 0.08 : nowMs / 1000 * INPUT.visualTimeScale;

      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, width, height);
      drawGrid(ctx, width, height, colors, this.mode === "diagram");

      if (this.mode === "ambient") {
        ctx.save();
        ctx.globalAlpha = 0.76;
        const orbitSize = Math.min(width * 0.34, height * 0.57);
        const orbitBox = {
          x: Math.max(18, width * 0.03),
          y: Math.max(90, height * 0.16),
          width: orbitSize,
          height: orbitSize
        };
        drawReferenceOrbit(ctx, orbitBox, modelTimeS, nowMs, colors, labels, false);

        ctx.fillStyle = colors.text;
        ctx.font = "650 10px ui-monospace, SFMono-Regular, Consolas, monospace";
        ctx.fillText(labels.model, width * 0.55, Math.max(110, height * 0.17));
        ctx.fillStyle = colors.muted;
        ctx.font = "9px ui-monospace, SFMono-Regular, Consolas, monospace";
        ctx.fillText(labels.accelerated, width * 0.55, Math.max(127, height * 0.17 + 17));
        ctx.fillText("a = Rₑ + h   ·   T = 2π√(a³/μₑ)   ·   OWLT = ρ/c", width * 0.55, Math.max(144, height * 0.17 + 34));

        drawPipeline(ctx, {
          x: width * 0.27,
          y: height * 0.76,
          width: width * 0.69,
          height: 42
        }, nowMs, colors, labels, true);
        ctx.restore();
      } else {
        const narrow = width < 720;
        const orbitBox = narrow
          ? { x: width * 0.08, y: 42, width: width * 0.84, height: Math.min(height * 0.42, width * 0.72) }
          : { x: 22, y: 44, width: width * 0.48, height: height - 64 };
        drawReferenceOrbit(ctx, orbitBox, modelTimeS, nowMs, colors, labels, true);

        if (narrow) {
          const pipelineY = orbitBox.y + orbitBox.height + 14;
          drawPipeline(ctx, {
            x: width * 0.05,
            y: pipelineY,
            width: width * 0.9,
            height: Math.max(44, height - pipelineY - 14)
          }, nowMs, colors, labels, true);
        } else {
          drawPipeline(ctx, { x: width * 0.55, y: 52, width: width * 0.4, height: height - 92 }, nowMs, colors, labels, false);
        }

        ctx.fillStyle = colors.text;
        ctx.font = "650 10px ui-monospace, SFMono-Regular, Consolas, monospace";
        ctx.fillText(labels.model, 18, 20);
        ctx.fillStyle = colors.muted;
        ctx.font = "9px ui-monospace, SFMono-Regular, Consolas, monospace";
        ctx.fillText(labels.accelerated, 18, 35);
      }
    }
  }

  function populateDerivedValues() {
    const values = {
      radius: `${orbitRadiusKm.toFixed(3)} km`,
      period: `${orbitalPeriodS.toFixed(3)} s`,
      spacing: `${(phaseSpacingRad * DEG).toFixed(0)}°`,
      phaseTime: `${phaseTimeS.toFixed(3)} s`,
      islDistance: `${adjacentIslDistanceKm.toFixed(3)} km`,
      islClearance: `${adjacentIslClearanceKm.toFixed(3)} km`,
      islOwlt: `${adjacentIslOwltMs.toFixed(3)} ms`
    };
    document.querySelectorAll("[data-nsb-value]").forEach((node) => {
      const value = values[node.dataset.nsbValue];
      if (value) node.textContent = value;
    });
  }

  function init() {
    const canvases = [...document.querySelectorAll("canvas[data-nsb-model]")];
    if (!canvases.length) return;
    populateDerivedValues();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const staticFrame = () => media.matches || Boolean(navigator.connection?.saveData);
    let frameId = null;
    let lastFrame = -Infinity;
    const intervalMs = 1000 / 15;
    let requestDraw = () => {};
    const renderers = canvases.map((canvas) => new ModelCanvas(canvas, () => requestDraw()));
    const hasVisibleRenderer = () => renderers.some((renderer) => renderer.visible);

    const frame = (nowMs) => {
      frameId = null;
      if (document.hidden || !hasVisibleRenderer()) return;
      if (nowMs - lastFrame >= intervalMs) {
        renderers.forEach((renderer) => renderer.draw(nowMs, staticFrame()));
        lastFrame = nowMs;
      }
      if (!staticFrame()) frameId = window.requestAnimationFrame(frame);
    };

    const start = () => {
      if (frameId !== null || document.hidden || !hasVisibleRenderer()) return;
      frameId = window.requestAnimationFrame(frame);
    };
    requestDraw = start;
    const stop = () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      frameId = null;
    };

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });
    media.addEventListener?.("change", start);
    new MutationObserver(start).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang", "data-theme", "data-bs-theme"]
    });
    window.addEventListener("pageshow", start);
    start();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
