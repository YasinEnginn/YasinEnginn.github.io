(() => {
    const App = window.PortfolioApp = window.PortfolioApp || {};
    const htmlEl = document.documentElement;
    const performanceProfile = window.PortfolioPerformance || App.performanceProfile || {
        lowPower: true,
        tablet: false,
        revealAnimations: false,
        geometryInteractions: false
    };
    const timeTheme = window.TimeTheme;
    const CV_PDF_PATH = "assets/docs/Yasin-Engin-Network-Automation-SDN-CV.pdf";
    const CV_PDF_FILENAME = "Yasin-Engin-Network-Automation-SDN-CV.pdf";

    App.Config = {
        CV_PDF_PATH,
        CV_PDF_FILENAME
    };

    let appStatusRegion = null;
    let appStatusTimer = null;

function getAppStatusRegion() {
    if (appStatusRegion?.isConnected) return appStatusRegion;

    appStatusRegion = document.getElementById("app-status-region");

    if (!appStatusRegion) {
        appStatusRegion = document.createElement("p");
        appStatusRegion.id = "app-status-region";
        appStatusRegion.className = "visually-hidden";
        appStatusRegion.setAttribute("aria-live", "polite");
        appStatusRegion.setAttribute("aria-atomic", "true");
        document.body.appendChild(appStatusRegion);
    }

    return appStatusRegion;
}

function announceStatus(message) {
    if (!message) return;

    const region = getAppStatusRegion();
    if (appStatusTimer) {
        window.clearTimeout(appStatusTimer);
    }

    region.textContent = "";
    window.requestAnimationFrame(() => {
        region.textContent = message;
    });

    appStatusTimer = window.setTimeout(() => {
        if (region.textContent === message) {
            region.textContent = "";
        }
    }, 2400);
}

function requestIdleWork(callback, timeout = 1500) {
    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(callback, { timeout });
        return;
    }

    window.setTimeout(callback, Math.min(timeout, 600));
}

function setupMobileMenu() {
    const mobileBtn = document.querySelector(".mobile-menu-btn");
    const navPanel = document.getElementById("primary-navigation");
    if (!mobileBtn || !navPanel) return;

    const icon = mobileBtn.querySelector("i");
    const existingBackdrop = document.querySelector(".mobile-nav-backdrop");
    const backdrop = existingBackdrop || document.createElement("button");

    if (!existingBackdrop) {
        backdrop.type = "button";
        backdrop.className = "mobile-nav-backdrop";
        backdrop.tabIndex = -1;
        backdrop.setAttribute("aria-hidden", "true");
        document.body.appendChild(backdrop);
    }

    const setMenuState = (isActive) => {
        navPanel.classList.toggle("active", isActive);
        document.body.classList.toggle("menu-open", isActive);
        mobileBtn.setAttribute("aria-expanded", String(isActive));

        if (!icon) return;

        if (isActive) {
            icon.classList.remove("fa-bars");
            icon.classList.add("fa-times");
        } else {
            icon.classList.remove("fa-times");
            icon.classList.add("fa-bars");
        }
    };

    const closeMenu = () => setMenuState(false);

    mobileBtn.addEventListener("click", () => {
        const nextState = !navPanel.classList.contains("active");
        setMenuState(nextState);
    });

    backdrop.addEventListener("click", closeMenu);

    navPanel.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && navPanel.classList.contains("active")) {
            closeMenu();
        }
    });

    const desktopQuery = window.matchMedia("(min-width: 821px)");
    const handleViewportChange = (event) => {
        if (event.matches) {
            closeMenu();
        }
    };

    if (typeof desktopQuery.addEventListener === "function") {
        desktopQuery.addEventListener("change", handleViewportChange);
    } else if (typeof desktopQuery.addListener === "function") {
        desktopQuery.addListener(handleViewportChange);
    }
}

function setupActiveNav() {
    const sectionLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
    const homeLink = document.querySelector('.top-dock-logo[href^="#"]');
    if (!sectionLinks.length) return;

    const setActiveLink = (targetId) => {
        sectionLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${targetId}`;
            link.classList.toggle("active", isActive);

            if (isActive) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });

        if (homeLink) {
            const isHomeActive = homeLink.getAttribute("href") === `#${targetId}`;
            homeLink.classList.toggle("is-active", isHomeActive);

            if (isHomeActive) {
                homeLink.setAttribute("aria-current", "page");
            } else {
                homeLink.removeAttribute("aria-current");
            }
        }
    };

    const homeTargetId = homeLink?.getAttribute("href")?.slice(1);
    const homeSection = homeTargetId ? document.getElementById(homeTargetId) : null;
    const sections = [
        homeSection,
        ...sectionLinks.map((link) => document.querySelector(link.getAttribute("href")))
    ].filter(Boolean);

    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
        const visibleEntry = entries
            .filter((entry) => entry.isIntersecting)
            .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (!visibleEntry?.target?.id) return;
        setActiveLink(visibleEntry.target.id);
    }, {
        rootMargin: "-35% 0px -45% 0px",
        threshold: [0.2, 0.45, 0.7]
    });

    sections.forEach((section) => observer.observe(section));

    sectionLinks.forEach((link) => {
        link.addEventListener("click", () => {
            const targetId = link.getAttribute("href")?.slice(1);
            if (targetId) setActiveLink(targetId);
        });
    });

    const initialTarget = window.location.hash?.slice(1) || homeSection?.id || sections[0].id;
    setActiveLink(initialTarget);
}

function setupHeaderState() {
    const updateHeaderState = () => {
        htmlEl.setAttribute("data-scrolled", window.scrollY > 28 ? "1" : "0");
    };

    let ticking = false;
    window.addEventListener("scroll", () => {
        if (ticking) return;
        ticking = true;

        window.requestAnimationFrame(() => {
            updateHeaderState();
            ticking = false;
        });
    }, { passive: true });

    updateHeaderState();
}

function setupScrollProgress() {
    const progressBar = document.querySelector(".scroll-progress span");
    if (!progressBar) return;

    const updateProgress = () => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollable > 0 ? Math.min(Math.max(window.scrollY / scrollable, 0), 1) : 0;
        progressBar.style.setProperty("--scroll-progress", progress.toFixed(4));
    };

    let ticking = false;
    const requestUpdate = () => {
        if (ticking) return;
        ticking = true;

        window.requestAnimationFrame(() => {
            updateProgress();
            ticking = false;
        });
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    updateProgress();
}

function setupRevealAnimations() {
    if (!performanceProfile.revealAnimations) {
        htmlEl.classList.add("js-ready");
        return;
    }

    const revealTargets = [
        ...document.querySelectorAll(".hero-content > *:not(.visually-hidden)"),
        ...document.querySelectorAll(".section-title"),
        ...document.querySelectorAll(".mission-shell, .mission-quote, .mission-pillar, .skill-category, .project-card, .book-card, .community-card, .community-panel, .community-guide-card, .community-channel-card, .hall-of-fame, .notice-card, .contact-cta, .socials a, .footer-meta")
    ];

    const uniqueTargets = [...new Set(revealTargets.filter(Boolean))];
    if (!uniqueTargets.length) return;

    uniqueTargets.forEach((element, index) => {
        element.classList.add("reveal-up");
        const delay = element.closest(".hero") ? Math.min(index * 70, 420) : Math.min((index % 6) * 80, 320);
        element.style.setProperty("--reveal-delay", `${delay}ms`);
    });

    window.requestAnimationFrame(() => {
        htmlEl.classList.add("js-ready");
    });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        uniqueTargets.forEach((element) => element.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.16,
        rootMargin: "0px 0px -10% 0px"
    });

    uniqueTargets.forEach((element) => {
        if (element.closest(".hero")) {
            element.classList.add("is-visible");
            return;
        }

        observer.observe(element);
    });
}

function setupGeometricInteractions() {
    if (!performanceProfile.geometryInteractions) return;

    const targets = [
        ...document.querySelectorAll(".skill-category, .project-card, .book-card--link, .mission-pillar, .community-card, .social-card")
    ].filter(Boolean);

    if (!targets.length) return;

    targets.forEach((element) => element.classList.add("is-geometry-live"));

    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reduceMotion) return;

    targets.forEach((element) => {
        element.addEventListener("pointermove", (event) => {
            const rect = element.getBoundingClientRect();
            const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
            const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
            const tiltX = (0.5 - y) * 6;
            const tiltY = (x - 0.5) * 6;

            element.style.setProperty("--pointer-x", `${Math.round(x * 100)}%`);
            element.style.setProperty("--pointer-y", `${Math.round(y * 100)}%`);
            element.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
            element.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
        }, { passive: true });

        element.addEventListener("pointerleave", () => {
            element.style.setProperty("--pointer-x", "50%");
            element.style.setProperty("--pointer-y", "50%");
            element.style.setProperty("--tilt-x", "0deg");
            element.style.setProperty("--tilt-y", "0deg");
        });
    });
}

    App.UI = {
        announceStatus,
        requestIdleWork
    };

    async function initialize() {
        await App.I18n?.ready;

        const hasTopDock = Boolean(document.querySelector(".site-nav"));
        document.body.classList.toggle("has-top-dock", hasTopDock);
        htmlEl.classList.toggle("has-top-dock", hasTopDock);

        const currentThemeMode = timeTheme?.getStoredMode ? timeTheme.getStoredMode() : (localStorage.getItem("theme") || "auto");
        App.Theme?.setThemeMode?.(currentThemeMode);
        App.Theme?.setupThemeControls?.();

        const isFixedLanguagePage = Boolean(App.I18n?.isFixedLanguagePage);
        const storedLang = !isFixedLanguagePage ? localStorage.getItem("selectedLanguage") : "";
        const defaultLang = isFixedLanguagePage
            ? App.I18n?.pageDefaultLanguage || document.documentElement.lang || "en"
            : (storedLang && App.I18n?.hasLanguage?.(storedLang)) ? storedLang : (document.documentElement.lang || "en");
        App.I18n?.setLanguage?.(defaultLang);
        App.I18n?.setupLanguageToggle?.();

        App.Contact?.setupEmailAddress?.();
        App.Contact?.setupCopyButton?.();
        setupMobileMenu();
        setupActiveNav();
        setupHeaderState();
        setupScrollProgress();
        App.Library?.setupLibraryExplorer?.();
        setupRevealAnimations();
        setupGeometricInteractions();
        App.CommandPalette?.setupCommandPalette?.();
        App.Contact?.setupContactForm?.();
        App.Projects?.bindTrackedClicks?.();
        App.Projects?.trackPageView?.();
        App.Projects?.setupLatestVideo?.();
    }

    initialize().catch((error) => {
        console.error("Portfolio initialization failed.", error);
    });
})();
