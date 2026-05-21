(() => {
    const App = window.PortfolioApp = window.PortfolioApp || {};

function trackEvent(eventName, detail = {}) {
    if (!eventName) return;
    const safeName = String(eventName).toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 64);
    if (!safeName) return;

    const payload = {
        name: safeName,
        path: window.location.pathname,
        ts: new Date().toISOString(),
        detail
    };

    window.dispatchEvent(new CustomEvent("portfolio:track", { detail: payload }));

    if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: safeName, ...payload });
    }

    window.portfolioAnalytics?.track?.(safeName, payload);
}

function trackPageView() {
    const pageKey = `pv:${window.location.pathname}`;
    try {
        if (sessionStorage.getItem(pageKey)) return;
        sessionStorage.setItem(pageKey, "1");
    } catch {
        // Analytics should never block the portfolio experience.
    }
    trackEvent("page_view");
}

function bindTrackedClicks() {
    document.addEventListener("click", (event) => {
        const tracked = event.target instanceof Element ? event.target.closest("[data-track]") : null;
        if (!tracked) return;
        trackEvent(tracked.getAttribute("data-track"));
    });
}

async function updateLatestVideoLink() {
    const videoLink = document.getElementById("latest-video-link");
    const videoCardLink = document.getElementById("latest-video-card-link");
    const videoCardTitle = document.getElementById("latest-video-title");
    const videoCardThumb = document.getElementById("latest-video-thumb");
    if (!videoLink && !videoCardLink && !videoCardTitle && !videoCardThumb) return;

    try {
        const response = await fetch("assets/data/latest_video.json", { cache: "default" });
        if (!response.ok) throw new Error("latest video payload missing");
        const payload = await response.json();
        const latest = payload?.video;
        if (!latest?.url) throw new Error("invalid latest video payload");

        if (videoLink) {
            videoLink.href = latest.url;
            videoLink.textContent = latest.title ? `Netreka Akademi: ${latest.title}` : "Netreka Akademi";
        }

        if (videoCardLink) {
            videoCardLink.href = latest.url;
        }

        if (videoCardTitle && latest.title) {
            videoCardTitle.textContent = latest.title;
        }

        if (videoCardThumb && latest.id) {
            videoCardThumb.src = `https://i.ytimg.com/vi/${latest.id}/hqdefault.jpg`;
        }
    } catch {
        if (videoLink) {
            videoLink.href = "https://www.youtube.com/@Netreka_Akademi";
            videoLink.textContent = "Netreka Akademi";
        }

        if (videoCardLink) {
            videoCardLink.href = "https://www.youtube.com/@Netreka_Akademi";
        }
    }
}

function requestIdleWork(callback, timeout = 1500) {
    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(callback, { timeout });
        return;
    }

    window.setTimeout(callback, Math.min(timeout, 600));
}

function setupLatestVideo() {
    const youtubeSection = document.getElementById("youtube");
    let loaded = false;
    const load = () => {
        if (loaded) return;
        loaded = true;
        requestIdleWork(updateLatestVideoLink, (window.PortfolioPerformance || {}).lowPower ? 2200 : 1400);
    };

    if (!youtubeSection || !("IntersectionObserver" in window)) {
        load();
        return;
    }

    if (!(window.PortfolioPerformance || {}).lowPower && !(window.PortfolioPerformance || {}).tablet) {
        load();
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        load();
    }, { rootMargin: "320px 0px" });

    observer.observe(youtubeSection);
}

    App.Projects = {
        trackEvent,
        trackPageView,
        bindTrackedClicks,
        updateLatestVideoLink,
        setupLatestVideo
    };
})();
