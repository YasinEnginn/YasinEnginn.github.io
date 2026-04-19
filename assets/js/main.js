const htmlEl = document.documentElement;
const isMobileLite = window.matchMedia("(max-width: 768px)").matches;
const themeBtn = document.getElementById("themeToken");
const langToggle = document.getElementById("langToggle");
const copyBtn = document.getElementById("copyBtn");
const emailInput = document.getElementById("email-address");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

const ANALYTICS_NAMESPACE = "yasinenginn.github.io";
const CONTACT_LIMIT_KEY = "contactSubmitHistory";
const CONTACT_WINDOW_MS = 60 * 60 * 1000;
const CONTACT_MIN_GAP_MS = 60 * 1000;
const CONTACT_MAX_IN_WINDOW = 3;

const translations = {
    tr: {
        nav_about: "Hakkinda",
        nav_projects: "Projeler",
        nav_community: "Topluluk",
        nav_library: "Kutuphane",
        nav_contact: "Iletisim",
        location: "Samsun, Turkiye",
        hero_kicker: "Yasin Engin - Network Automation Engineer",
        hero_title: 'SDN & Network Automation + <br> <span class="highlight">Go Backend + Distributed Systems</span>',
        hero_bio: "Bilgisayar Muhendisligi ogrencisi. Go, gRPC, dagitik sistemler ve SDN odakli production-grade backend sistemleri ve network otomasyon araclari gelistiriyorum.",
        hero_cv_view: "CV",
        hero_case_studies: "Vaka Incelemeleri",
        projects_title: "One Cikan Projeler",
        library_title: "Kutuphane / Akademik Okumalar",
        skill_networking: "Networking",
        skill_programmability: "SDN ve Programlanabilirlik",
        skill_wireless: "Kablosuz",
        skill_automation: "Otomasyon",
        proj_nexus_desc: "Broker pattern, RabbitMQ event-driven, gRPC logging, Docker Swarm, Caddy gateway.",
        proj_tolerex_desc: "Lider-uye, mTLS gRPC, heartbeat hata tespiti, disk kaliciligi, metrikler/logging.",
        proj_ansible_desc: "Nokia SR Linux, Ansible, Containerlab ve gNMI tabanli otomasyon is akislari.",
        proj_go_desc: "Go ile ag protokolleri, soketler ve HTTP sunuculari uygulamalari.",
        proj_restapi_desc: "REST API tabanli backend servis; temiz routing, dogrulama ve JSON yanitlari.",
        proj_cisco_desc: "Cisco sertifikalari icin kapsamli calisma notlari, lab yapilandirmalari ve otomasyon scriptleri.",
        view_repo: "Repoyu Incele",
        community_desc: "\"Herkes Icin Netreka!\" sloganiyla teknoloji egitimleri.",
        community_chip_focus: "Ag Otomasyonu ve SDN",
        last_video: "Son Video:",
        join_linkedin: "LinkedIn Grubuna Katil",
        community_hub_open: "Topluluk Merkezi",
        community_hub_ideas: "Fikir Gonder",
        community_hub_showcase: "Proje Vitrini",
        contact_title: "Birlikte Calisalim",
        service_lab: "Lab Kurulum",
        service_automation: "Ag Otomasyonu",
        service_group: "Calisma Grubu",
        btn_copy: "Kopyala",
        form_name: "Isim",
        form_email: "E-posta",
        form_message: "Mesaj",
        contact_submit: "Mesaj Gonder",
        contact_sending: "Gonderiliyor...",
        contact_success: "Mesaj basariyla gonderildi.",
        contact_error: "Mesaj gonderilemedi. Lutfen tekrar deneyin veya e-posta adresini kopyalayin.",
        contact_spam: "Spam filtresi bu gonderimi engelledi.",
        contact_required: "Lutfen tum alanlari doldurun.",
        contact_rate_limit_window: "Son bir saat icinde cok fazla mesaj gonderildi. Lutfen daha sonra tekrar deneyin.",
        contact_rate_limit_gap: "Yeni bir mesaj gondermeden once {seconds}s bekleyin.",
        copy_success: "Kopyalandi!",
        email_copied: "E-posta kopyalandi.",
        focus_mode_enabled: "Odak modu acildi.",
        focus_mode_disabled: "Odak modu kapandi.",
        cv_preview_kicker: "Resmi CV",
        cv_preview_title: "Yuklenen Ozgecmis Goruntuleyici",
        cv_preview_open_fullscreen: "Tam Ekran Ac",
        cv_preview_close: "Kapat",
        cv_preview_opened: "CV goruntuleyici acildi.",
        cmdk_placeholder: "Yaz: github / vaka incelemeleri / cv / projeler",
        cmdk_hint: "Acmak icin Enter • Kapatmak icin Esc • Gecis icin Ctrl+K",
        community_hero_title: "Topluluk Merkezi",
        community_hero_desc: "Birlikte uretelim, paylasalim ve gelistirelim.",
        community_ideas: "Fikirler",
        community_help: "Yardim",
        community_showcase: "Vitrin",
        section_ideas_title: "Proje Fikirleri",
        section_help_title: "Yardim Bekleyenler",
        section_showcase_title: "Proje Vitrini"
    },
    en: {
        nav_about: "About",
        nav_projects: "Projects",
        nav_community: "Community",
        nav_library: "Library",
        nav_contact: "Contact",
        location: "Samsun, Turkey",
        hero_kicker: "Yasin Engin - Network Automation Engineer",
        hero_title: 'SDN & Network Automation + <br> <span class="highlight">Go Backend + Distributed Systems</span>',
        hero_bio: "Computer Engineering student building production-grade backend systems and network automation tools. Focused on Go, gRPC, distributed systems, and SDN.",
        hero_cv_view: "View CV",
        hero_case_studies: "Case Studies",
        projects_title: "Featured Projects",
        library_title: "Library / Academic Reading",
        skill_networking: "Networking",
        skill_programmability: "SDN & Programmability",
        skill_wireless: "Wireless",
        skill_automation: "Automation",
        proj_nexus_desc: "Broker pattern, RabbitMQ event-driven, gRPC logging, Docker Swarm, Caddy gateway.",
        proj_tolerex_desc: "Leader-member, mTLS gRPC, heartbeat failure detection, disk persistence, metrics/logging.",
        proj_ansible_desc: "Nokia SR Linux, Ansible, Containerlab, and gNMI based automation workflows.",
        proj_go_desc: "Implementation of network protocols, sockets, and HTTP servers using Go.",
        proj_restapi_desc: "REST API backend service with clean routing, validation, and JSON responses.",
        proj_cisco_desc: "Comprehensive study notes, lab configurations, and automation scripts for Cisco certifications.",
        view_repo: "View Repo",
        community_desc: "Tech education with the slogan \"Netreka for Everyone!\"",
        community_chip_focus: "Network Automation & SDN",
        last_video: "Latest Video:",
        join_linkedin: "Join LinkedIn Group",
        community_hub_open: "Community Hub",
        community_hub_ideas: "Submit Idea",
        community_hub_showcase: "Project Showcase",
        contact_title: "Let's Work Together",
        service_lab: "Lab Setup",
        service_automation: "Network Automation",
        service_group: "Study Group",
        btn_copy: "Copy Email",
        form_name: "Name",
        form_email: "Email",
        form_message: "Message",
        contact_submit: "Send Message",
        contact_sending: "Sending...",
        contact_success: "Message sent successfully.",
        contact_error: "Message could not be sent. Please retry or use email copy.",
        contact_spam: "Spam filter blocked this submission.",
        contact_required: "Please fill in all fields.",
        contact_rate_limit_window: "Too many messages in the last hour. Please try later.",
        contact_rate_limit_gap: "Please wait {seconds}s before sending another message.",
        copy_success: "Copied!",
        email_copied: "Email copied.",
        focus_mode_enabled: "Focus mode enabled.",
        focus_mode_disabled: "Focus mode disabled.",
        cv_preview_kicker: "Official CV",
        cv_preview_title: "Uploaded Resume Viewer",
        cv_preview_open_fullscreen: "Open Fullscreen",
        cv_preview_close: "Close",
        cv_preview_opened: "CV viewer opened.",
        cmdk_placeholder: "Type: github / case studies / cv / projects",
        cmdk_hint: "Enter to open • Esc to close • Ctrl+K to toggle",
        community_hero_title: "Community Hub",
        community_hero_desc: "Let's create, share, and grow together.",
        community_ideas: "Ideas",
        community_help: "Help",
        community_showcase: "Showcase",
        section_ideas_title: "Project Ideas",
        section_help_title: "Help Wanted",
        section_showcase_title: "Project Showcase"
    }
};

function getCurrentLanguage() {
    return document.documentElement.lang === "tr" ? "tr" : "en";
}

function getUiText(key, fallback = "", replacements = {}) {
    const lang = getCurrentLanguage();
    let text = translations[lang]?.[key] || translations.en?.[key] || fallback;

    Object.entries(replacements).forEach(([token, value]) => {
        text = text.replaceAll(`{${token}}`, String(value));
    });

    return text;
}

function updateThemeIcon(theme) {
    if (!themeBtn) return;
    const icon = themeBtn.querySelector("i");
    if (!icon) return;

    if (theme === "dark") {
        icon.classList.remove("fa-sun");
        icon.classList.add("fa-moon");
    } else {
        icon.classList.remove("fa-moon");
        icon.classList.add("fa-sun");
    }
}

function updateThemeMeta(theme) {
    if (!themeColorMeta) return;
    themeColorMeta.setAttribute("content", theme === "light" ? "#efe9dc" : "#04070f");
}

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

async function copyText(value, fallbackInput) {
    try {
        await navigator.clipboard.writeText(value);
        return true;
    } catch {
        if (!fallbackInput || typeof document.execCommand !== "function") {
            return false;
        }

        fallbackInput.focus();
        fallbackInput.select();
        fallbackInput.setSelectionRange(0, 99999);

        try {
            return document.execCommand("copy");
        } catch {
            return false;
        }
    }
}

function setTheme(theme) {
    htmlEl.setAttribute("data-theme", theme);
    htmlEl.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
    updateThemeIcon(theme);
    updateThemeMeta(theme);
}

function setLanguage(newLang) {
    if (!translations[newLang]) return;

    document.documentElement.lang = newLang;
    localStorage.setItem("selectedLanguage", newLang);

    if (langToggle) {
        langToggle.textContent = newLang === "tr" ? "EN" : "TR";
    }

    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        if (!key || !translations[newLang][key]) return;

        if (key === "hero_title") {
            el.innerHTML = translations[newLang][key];
        } else {
            el.textContent = translations[newLang][key];
        }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (!key || !translations[newLang][key]) return;
        el.setAttribute("placeholder", translations[newLang][key]);
    });

    const cmdkHint = document.getElementById("cmdkHint");
    if (cmdkHint) {
        cmdkHint.textContent = getUiText("cmdk_hint", "Enter to open • Esc to close • Ctrl+K to toggle");
    }
}

function trackEvent(eventName) {
    if (!eventName) return;
    const safeName = String(eventName).toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 64);
    const url = `https://api.countapi.xyz/hit/${ANALYTICS_NAMESPACE}/${safeName}`;
    fetch(url, { method: "GET", mode: "cors", keepalive: true }).catch(() => { });
}

function trackPageView() {
    const pageKey = `pv:${window.location.pathname}`;
    if (sessionStorage.getItem(pageKey)) return;
    sessionStorage.setItem(pageKey, "1");
    trackEvent("page_view");
}

function bindTrackedClicks() {
    document.querySelectorAll("[data-track]").forEach((el) => {
        el.addEventListener("click", () => {
            const eventName = el.getAttribute("data-track");
            trackEvent(eventName);
        });
    });
}

async function updateLatestVideoLink() {
    const videoLink = document.getElementById("latest-video-link");
    if (!videoLink) return;

    try {
        const response = await fetch("assets/data/latest_video.json", { cache: "no-store" });
        if (!response.ok) throw new Error("latest video payload missing");
        const payload = await response.json();
        const latest = payload?.video;
        if (!latest?.url) throw new Error("invalid latest video payload");

        videoLink.href = latest.url;
        videoLink.textContent = latest.title ? `Netreka Akademi: ${latest.title}` : "Netreka Akademi";
    } catch {
        videoLink.href = "https://www.youtube.com/@Netreka_Akademi";
        videoLink.textContent = "Netreka Akademi";
    }
}

function getContactHistory() {
    try {
        const parsed = JSON.parse(localStorage.getItem(CONTACT_LIMIT_KEY) || "[]");
        if (!Array.isArray(parsed)) return [];
        return parsed.filter((value) => Number.isFinite(value));
    } catch {
        return [];
    }
}

function storeContactHistory(history) {
    localStorage.setItem(CONTACT_LIMIT_KEY, JSON.stringify(history));
}

function checkContactRateLimit() {
    const now = Date.now();
    const recent = getContactHistory().filter((stamp) => now - stamp <= CONTACT_WINDOW_MS);

    if (recent.length >= CONTACT_MAX_IN_WINDOW) {
        return {
            ok: false,
            reason: getUiText("contact_rate_limit_window", "Too many messages in the last hour. Please try later.")
        };
    }

    const latest = recent[recent.length - 1];
    if (latest && now - latest < CONTACT_MIN_GAP_MS) {
        const waitSeconds = Math.ceil((CONTACT_MIN_GAP_MS - (now - latest)) / 1000);
        return {
            ok: false,
            reason: getUiText("contact_rate_limit_gap", `Please wait ${waitSeconds}s before sending another message.`, { seconds: waitSeconds })
        };
    }

    return { ok: true, recent };
}

function registerContactSubmit(recentHistory) {
    const updated = [...recentHistory, Date.now()];
    storeContactHistory(updated);
}

function setupContactForm() {
    const form = document.getElementById("contact-form");
    const status = document.getElementById("contact-form-status");
    if (!form || !status) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const defaultSubmitLabel = submitBtn?.textContent?.trim() || getUiText("contact_submit", "Send Message");
    let isSubmitting = false;

    const updateSubmitState = (busy) => {
        if (!submitBtn) return;
        submitBtn.disabled = busy;
        submitBtn.textContent = busy ? getUiText("contact_sending", "Sending...") : getUiText("contact_submit", defaultSubmitLabel);
    };

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (isSubmitting) return;

        status.classList.remove("success", "error");
        status.textContent = "";

        if (!form.reportValidity()) {
            return;
        }

        const honey = form.querySelector("#contact-honey");
        if (honey && honey.value.trim() !== "") {
            status.classList.add("error");
            status.textContent = getUiText("contact_spam", "Spam filter blocked this submission.");
            return;
        }

        const rate = checkContactRateLimit();
        if (!rate.ok) {
            status.classList.add("error");
            status.textContent = rate.reason;
            return;
        }

        const formData = new FormData(form);
        ["name", "email", "message"].forEach((field) => {
            const value = formData.get(field);
            if (typeof value === "string") {
                formData.set(field, value.trim());
            }
        });

        const requiredFieldOrder = ["name", "email", "message"];
        const missingField = requiredFieldOrder.find((field) => {
            const value = formData.get(field);
            return typeof value !== "string" || value.length === 0;
        });

        if (missingField) {
            status.classList.add("error");
            status.textContent = getUiText("contact_required", "Please fill in all fields.");
            form.querySelector(`[name="${missingField}"]`)?.focus();
            return;
        }

        isSubmitting = true;
        form.setAttribute("aria-busy", "true");
        updateSubmitState(true);

        try {
            const response = await fetch(form.action, {
                method: "POST",
                body: formData,
                headers: {
                    Accept: "application/json"
                }
            });

            if (!response.ok) throw new Error(`Contact form request failed (${response.status})`);

            registerContactSubmit(rate.recent || []);
            form.reset();
            status.classList.add("success");
            status.textContent = getUiText("contact_success", "Message sent successfully.");
            trackEvent("contact_submit_success");
        } catch {
            status.classList.add("error");
            status.textContent = getUiText("contact_error", "Message could not be sent. Please retry or use email copy.");
            trackEvent("contact_submit_error");
        } finally {
            isSubmitting = false;
            form.setAttribute("aria-busy", "false");
            updateSubmitState(false);
        }
    });
}

function setupCopyButton() {
    if (!copyBtn || !emailInput) return;
    let resetTimer = null;

    copyBtn.addEventListener("click", async () => {
        const copied = await copyText(emailInput.value, emailInput);

        if (copied) {
            copyBtn.textContent = getUiText("copy_success", "Copied!");
            announceStatus(getUiText("email_copied", "Email copied."));

            if (resetTimer) {
                window.clearTimeout(resetTimer);
            }

            resetTimer = window.setTimeout(() => {
                copyBtn.textContent = getUiText("btn_copy", "Copy Email");
            }, 2000);
        } else {
            const error = new Error("Clipboard unavailable");
            console.error("Copy failed:", error);
        }
    });
}

function setupMobileMenu() {
    const mobileBtn = document.querySelector(".mobile-menu-btn");
    const navLinks = document.querySelector(".nav-links");
    if (!mobileBtn || !navLinks) return;

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
        navLinks.classList.toggle("active", isActive);
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
        const nextState = !navLinks.classList.contains("active");
        setMenuState(nextState);
    });

    backdrop.addEventListener("click", closeMenu);

    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && navLinks.classList.contains("active")) {
            closeMenu();
        }
    });

    const desktopQuery = window.matchMedia("(min-width: 769px)");
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
    };

    const sections = sectionLinks
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);

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

    const initialTarget = window.location.hash?.slice(1) || sections[0].id;
    setActiveLink(initialTarget);
}

function setupHeaderState() {
    const updateHeaderState = () => {
        htmlEl.setAttribute("data-scrolled", window.scrollY > 12 ? "1" : "0");
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

function setupRevealAnimations() {
    const revealTargets = [
        ...document.querySelectorAll(".hero-content > *:not(.visually-hidden)"),
        ...document.querySelectorAll(".section-title"),
        ...document.querySelectorAll(".skill-category, .project-card, .book-card, .community-card, .community-panel, .community-guide-card, .community-channel-card, .hall-of-fame, .notice-card, .contact-cta, .socials a, .footer-meta")
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

class CvPreviewController {
    #dialog;
    #frame;
    #closeButton;
    #externalLink;
    #triggers;
    #pdfUrl;
    #pdfPreviewUrl;
    #abortController = new AbortController();
    #reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    #hasLoadedFrame = false;
    #lastTrigger = null;

    constructor() {
        this.#dialog = document.getElementById("cvPreviewDialog");
        this.#frame = document.getElementById("cvPreviewFrame");
        this.#closeButton = document.getElementById("cvPreviewClose");
        this.#externalLink = document.getElementById("cvPreviewExternal");
        this.#triggers = [...document.querySelectorAll("[data-cv-trigger]")];
        this.#pdfUrl = new URL("assets/docs/yasin_engin_cv.pdf", window.location.href);
        this.#pdfPreviewUrl = new URL(this.#pdfUrl);
        this.#pdfPreviewUrl.hash = "toolbar=0&navpanes=0&view=FitH";
    }

    get ready() {
        return Boolean(this.#dialog && this.#frame && this.#closeButton && this.#externalLink && this.#triggers.length);
    }

    connect() {
        if (!this.ready) return;

        this.#externalLink.href = this.#pdfUrl.href;
        this.#dialog.dataset.state = "idle";

        for (const trigger of this.#triggers) {
            trigger.addEventListener("click", this.#handleTriggerClick, { signal: this.#abortController.signal });
        }

        this.#closeButton.addEventListener("click", this.close, { signal: this.#abortController.signal });
        this.#dialog.addEventListener("close", this.#handleDialogClose, { signal: this.#abortController.signal });
        this.#dialog.addEventListener("cancel", this.#handleDialogCancel, { signal: this.#abortController.signal });
        this.#reducedMotionQuery.addEventListener?.("change", this.#handleMotionChange, { signal: this.#abortController.signal });

        const scheduleWarmup = window.requestIdleCallback
            ? window.requestIdleCallback(() => this.#warmFrame(), { timeout: 1200 })
            : window.setTimeout(() => this.#warmFrame(), 700);

        this.#abortController.signal.addEventListener("abort", () => {
            if (typeof scheduleWarmup === "number") {
                window.clearTimeout(scheduleWarmup);
            } else if (typeof window.cancelIdleCallback === "function") {
                window.cancelIdleCallback(scheduleWarmup);
            }
        }, { once: true });
    }

    open = (trigger = null) => {
        if (!this.ready) return;

        this.#lastTrigger = trigger instanceof HTMLElement ? trigger : document.activeElement;
        this.#dialog.dataset.state = "opening";
        this.#warmFrame();

        const showDialog = () => {
            if (!this.#dialog.open) {
                this.#dialog.showModal();
            }

            this.#dialog.dataset.state = "open";
            announceStatus(getUiText("cv_preview_opened", "CV viewer opened."));
            window.requestAnimationFrame(() => this.#closeButton.focus({ preventScroll: true }));
        };

        if (typeof document.startViewTransition === "function" && !this.#reducedMotionQuery.matches) {
            document.startViewTransition(showDialog);
        } else {
            showDialog();
        }
    };

    close = () => {
        if (!this.#dialog?.open) return;
        this.#dialog.dataset.state = "closing";
        this.#dialog.close();
    };

    #warmFrame() {
        if (this.#hasLoadedFrame) return;
        this.#frame.src = this.#pdfPreviewUrl.href;
        this.#hasLoadedFrame = true;
    }

    #restoreFocus() {
        if (this.#lastTrigger instanceof HTMLElement && this.#lastTrigger.isConnected) {
            this.#lastTrigger.focus({ preventScroll: true });
        }
    }

    #handleTriggerClick = (event) => {
        event.preventDefault();
        this.open(event.currentTarget);
    };

    #handleDialogCancel = (event) => {
        event.preventDefault();
        this.close();
    };

    #handleDialogClose = () => {
        this.#dialog.dataset.state = "idle";
        this.#restoreFocus();
    };

    #handleMotionChange = () => {
        this.#dialog?.style.setProperty("--cv-motion-scale", this.#reducedMotionQuery.matches ? "1" : "0");
    };
}

function setupCvExperience() {
    const controller = new CvPreviewController();
    if (!controller.ready) return null;
    controller.connect();
    return controller;
}

function setupCommandPalette(cvPreviewController) {
    const cmdk = document.getElementById("cmdk");
    const cmdkInput = document.getElementById("cmdkInput");
    const cmdkCloseBtn = document.getElementById("cmdkClose");

    if (!cmdk || !cmdkInput || !cmdkCloseBtn) return;

    if (isMobileLite) {
        cmdk.remove();
        return;
    }

    cmdkCloseBtn.addEventListener("click", () => cmdk.close());

    const actions = [
        { key: "github", run: () => window.open("https://github.com/YasinEnginn", "_blank", "noopener") },
        { key: "linkedin", run: () => window.open("https://www.linkedin.com/in/yasin-engin-696890289/", "_blank", "noopener") },
        { key: "youtube", run: () => window.open("https://www.youtube.com/@Netreka_Akademi", "_blank", "noopener") },
        { key: "projects", run: () => document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" }) },
        { key: "projeler", run: () => document.querySelector("#projects")?.scrollIntoView({ behavior: "smooth" }) },
        { key: "case studies", run: () => { window.location.href = "case-studies/"; } },
        { key: "vaka incelemeleri", run: () => { window.location.href = "case-studies/"; } },
        { key: "cv", run: () => cvPreviewController?.open() },
        { key: "cv pdf", run: () => cvPreviewController?.open() },
        {
            key: "focus", run: () => {
                const isEnabled = document.body.classList.toggle("focus-mode");
                announceStatus(getUiText(
                    isEnabled ? "focus_mode_enabled" : "focus_mode_disabled",
                    isEnabled ? "Focus mode enabled." : "Focus mode disabled."
                ));
            }
        },
        { key: "lang tr", run: () => setLanguage("tr") },
        { key: "lang en", run: () => setLanguage("en") },
        { key: "projects: netreka", run: () => window.open("https://github.com/YasinEnginn/Netreka-Nexus", "_blank") },
        { key: "projects: tolerex", run: () => window.open("https://github.com/YasinEnginn/Tolerex", "_blank") },
        { key: "projects: rest-api", run: () => window.open("https://github.com/YasinEnginn/REST-API", "_blank") },
        {
            key: "vcard", run: () => {
                const vcardData = `BEGIN:VCARD
VERSION:3.0
FN:Yasin Engin
N:Engin;Yasin;;;
TITLE:Network Engineer & Automation Developer
EMAIL;TYPE=INTERNET;TYPE=WORK:yasinenginoffical@gmail.com
URL:https://yasinenginn.github.io/
NOTE:SDN, Go, Distributed Systems, Network Automation
END:VCARD`;
                const blob = new Blob([vcardData], { type: "text/vcard" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "Yasin_Engin.vcf";
                a.click();
                URL.revokeObjectURL(url);
            }
        },
        {
            key: "email", run: async () => {
                const mail = ["yasinenginoffical", "gmail.com"].join("@");
                const copied = await copyText(mail, emailInput);
                if (copied) {
                    announceStatus(getUiText("email_copied", "Email copied."));
                } else {
                    window.location.href = `mailto:${mail}`;
                }
            }
        },
        { key: "idea", run: () => document.getElementById("ideas")?.scrollIntoView({ behavior: "smooth" }) },
        { key: "help", run: () => document.getElementById("help-wanted")?.scrollIntoView({ behavior: "smooth" }) },
        { key: "submit", run: () => document.getElementById("showcase")?.scrollIntoView({ behavior: "smooth" }) },
        { key: "discuss", run: () => document.getElementById("discussion")?.scrollIntoView({ behavior: "smooth" }) }
    ];

    const toggleCmdk = () => {
        if (cmdk.open) {
            cmdk.close();
            return;
        }
        cmdk.showModal();
        setTimeout(() => cmdkInput.focus(), 50);
    };

    window.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            toggleCmdk();
        }
        if (event.key === "Escape" && cmdk.open) {
            cmdk.close();
        }
    });

    cmdkInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;

        const query = cmdkInput.value.trim().toLowerCase();
        const hit = actions.find((action) => action.key === query) || actions.find((action) => action.key.startsWith(query));
        if (!hit) return;

        cmdk.close();
        hit.run();
        cmdkInput.value = "";
    });
}

function setupGiscusSync() {
    function updateGiscusTheme() {
        const theme = document.documentElement.getAttribute("data-theme") || "dark";
        const lang = document.documentElement.lang || "tr";
        const giscusFrame = document.querySelector("iframe.giscus-frame");

        if (!giscusFrame) return;

        const message = {
            setConfig: {
                theme,
                lang
            }
        };

        giscusFrame.contentWindow.postMessage({ giscus: message }, "https://giscus.app");
    }

    setTimeout(updateGiscusTheme, 2000);
    setTimeout(updateGiscusTheme, 5000);

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === "attributes" && (mutation.attributeName === "data-theme" || mutation.attributeName === "lang")) {
                updateGiscusTheme();
            }
        });
    });

    observer.observe(document.documentElement, { attributes: true });
}

function initialize() {
    const currentTheme = localStorage.getItem("theme") || "dark";
    setTheme(currentTheme);

    const storedLang = localStorage.getItem("selectedLanguage");
    const defaultLang = (storedLang && translations[storedLang]) ? storedLang : (document.documentElement.lang || "tr");
    setLanguage(defaultLang);

    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            const next = htmlEl.getAttribute("data-theme") === "dark" ? "light" : "dark";
            setTheme(next);
        });
    }

    if (langToggle) {
        langToggle.addEventListener("click", () => {
            const next = document.documentElement.lang === "tr" ? "en" : "tr";
            setLanguage(next);
        });
    }

    if (emailInput) {
        const part1 = "yasinenginoffical";
        const part2 = "gmail.com";
        emailInput.value = `${part1}@${part2}`;
    }

    setupCopyButton();
    setupMobileMenu();
    setupActiveNav();
    setupHeaderState();
    const cvPreviewController = setupCvExperience();
    setupRevealAnimations();
    setupCommandPalette(cvPreviewController);
    setupContactForm();
    setupGiscusSync();
    bindTrackedClicks();
    trackPageView();
    updateLatestVideoLink();
}

initialize();
