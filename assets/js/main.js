const htmlEl = document.documentElement;
const isMobileLite = window.matchMedia("(max-width: 768px)").matches;
const themeBtn = document.getElementById("themeToken");
const langToggle = document.getElementById("langToggle");
const copyBtn = document.getElementById("copyBtn");
const emailInput = document.getElementById("email-address");

const ANALYTICS_NAMESPACE = "yasinenginn.github.io";
const CONTACT_LIMIT_KEY = "contactSubmitHistory";
const CONTACT_WINDOW_MS = 60 * 60 * 1000;
const CONTACT_MIN_GAP_MS = 60 * 1000;
const CONTACT_MAX_IN_WINDOW = 3;

const translations = {
    tr: {
        nav_about: "Hakkinda",
        nav_projects: "Projeler",
        nav_notes: "Notlar",
        nav_community: "Topluluk",
        nav_library: "Kutuphane",
        nav_game: "Oyna (Beta)",
        nav_contact: "Iletisim",
        location: "Samsun, Turkiye",
        hero_kicker: "Yasin Engin - Network Automation Engineer",
        hero_title: 'SDN & Network Automation + <br> <span class="highlight">Go Backend + Distributed Systems</span>',
        hero_bio: "Bilgisayar Muhendisligi ogrencisi. Go, gRPC, dagitik sistemler ve SDN odakli production-grade backend sistemleri ve network otomasyon araclari gelistiriyorum.",
        hero_cv_view: "CV",
        hero_cv_download: "PDF Indir",
        hero_case_studies: "Case Studies",
        projects_title: "One Cikan Projeler",
        proj_nexus_desc: "Broker pattern, RabbitMQ event-driven, gRPC logging, Docker Swarm, Caddy gateway.",
        proj_tolerex_desc: "Lider-uye, mTLS gRPC, heartbeat hata tespiti, disk kaliciligi, metrikler/logging.",
        proj_ansible_desc: "Nokia SR Linux, Ansible, Containerlab ve gNMI tabanli otomasyon is akislari.",
        proj_go_desc: "Go ile ag protokolleri, soketler ve HTTP sunuculari uygulamalari.",
        proj_restapi_desc: "REST API tabanli backend servis; temiz routing, dogrulama ve JSON yanitlari.",
        proj_cisco_desc: "Cisco sertifikalari icin kapsamli calisma notlari, lab yapilandirmalari ve otomasyon scriptleri.",
        view_repo: "Repoyu Incele",
        community_desc: "Teknoloji egitimleri.",
        last_video: "Son Video:",
        join_linkedin: "LinkedIn Grubuna Katil",
        contact_title: "Birlikte Calisalim",
        service_lab: "Lab Kurulum",
        service_group: "Calisma Grubu",
        btn_copy: "Kopyala",
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
        nav_notes: "Notes",
        nav_community: "Community",
        nav_library: "Library",
        nav_game: "Play (Beta)",
        nav_contact: "Contact",
        location: "Samsun, Turkey",
        hero_kicker: "Yasin Engin - Network Automation Engineer",
        hero_title: 'SDN & Network Automation + <br> <span class="highlight">Go Backend + Distributed Systems</span>',
        hero_bio: "Computer Engineering student building production-grade backend systems and network automation tools. Focused on Go, gRPC, distributed systems, and SDN.",
        hero_cv_view: "View CV",
        hero_cv_download: "Download PDF",
        hero_case_studies: "Case Studies",
        projects_title: "Featured Projects",
        proj_nexus_desc: "Broker pattern, RabbitMQ event-driven, gRPC logging, Docker Swarm, Caddy gateway.",
        proj_tolerex_desc: "Leader-member, mTLS gRPC, heartbeat failure detection, disk persistence, metrics/logging.",
        proj_ansible_desc: "Nokia SR Linux, Ansible, Containerlab, and gNMI based automation workflows.",
        proj_go_desc: "Implementation of network protocols, sockets, and HTTP servers using Go.",
        proj_restapi_desc: "REST API backend service with clean routing, validation, and JSON responses.",
        proj_cisco_desc: "Comprehensive study notes, lab configurations, and automation scripts for Cisco certifications.",
        view_repo: "View Repo",
        community_desc: "Tech education with the slogan \"Netreka for Everyone!\"",
        last_video: "Latest Video:",
        join_linkedin: "Join LinkedIn Group",
        contact_title: "Let's Work Together",
        service_lab: "Lab Setup",
        service_group: "Study Group",
        btn_copy: "Copy Email",
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

function setTheme(theme) {
    htmlEl.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    updateThemeIcon(theme);
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

        if (key === "hero_title" || key === "hero_bio") {
            el.innerHTML = translations[newLang][key];
        } else {
            el.textContent = translations[newLang][key];
        }
    });
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
            reason: "Too many messages in the last hour. Please try later."
        };
    }

    const latest = recent[recent.length - 1];
    if (latest && now - latest < CONTACT_MIN_GAP_MS) {
        const waitSeconds = Math.ceil((CONTACT_MIN_GAP_MS - (now - latest)) / 1000);
        return {
            ok: false,
            reason: `Please wait ${waitSeconds}s before sending another message.`
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

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        status.classList.remove("success", "error");
        status.textContent = "";

        const honey = form.querySelector("#contact-honey");
        if (honey && honey.value.trim() !== "") {
            status.classList.add("error");
            status.textContent = "Spam filter blocked this submission.";
            return;
        }

        const rate = checkContactRateLimit();
        if (!rate.ok) {
            status.classList.add("error");
            status.textContent = rate.reason;
            return;
        }

        const formData = new FormData(form);

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
            status.textContent = "Message sent successfully.";
            trackEvent("contact_submit_success");
        } catch {
            status.classList.add("error");
            status.textContent = "Message could not be sent. Please retry or use email copy.";
            trackEvent("contact_submit_error");
        }
    });
}

function setupCopyButton() {
    if (!copyBtn || !emailInput) return;

    copyBtn.addEventListener("click", async () => {
        emailInput.select();
        emailInput.setSelectionRange(0, 99999);

        try {
            await navigator.clipboard.writeText(emailInput.value);
            const originalText = copyBtn.textContent;
            const currentLang = document.documentElement.lang;
            copyBtn.textContent = currentLang === "tr" ? "Kopyalandi!" : "Copied!";
            copyBtn.style.background = "#10b981";

            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = "";
            }, 2000);
        } catch (error) {
            console.error("Copy failed:", error);
        }
    });
}

function setupMobileMenu() {
    const mobileBtn = document.querySelector(".mobile-menu-btn");
    const navLinks = document.querySelector(".nav-links");
    if (!mobileBtn || !navLinks) return;

    mobileBtn.addEventListener("click", () => {
        const isActive = navLinks.classList.toggle("active");
        mobileBtn.setAttribute("aria-expanded", String(isActive));

        const icon = mobileBtn.querySelector("i");
        if (!icon) return;

        if (isActive) {
            icon.classList.remove("fa-bars");
            icon.classList.add("fa-times");
        } else {
            icon.classList.remove("fa-times");
            icon.classList.add("fa-bars");
        }
    });

    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("active");
            mobileBtn.setAttribute("aria-expanded", "false");
            const icon = mobileBtn.querySelector("i");
            if (!icon) return;
            icon.classList.remove("fa-times");
            icon.classList.add("fa-bars");
        });
    });
}

function setupCommandPalette() {
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
        { key: "notes", run: () => { window.location.href = "notes/"; } },
        { key: "case studies", run: () => { window.location.href = "case-studies/"; } },
        { key: "cv", run: () => window.open("cv.html?print=1", "_blank", "noopener") },
        {
            key: "focus", run: () => {
                document.body.classList.toggle("focus-mode");
                alert("Focus Mode Toggled");
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
                try {
                    await navigator.clipboard.writeText(mail);
                    alert(`Email copied: ${mail}`);
                } catch {
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
    setupCommandPalette();
    setupContactForm();
    setupGiscusSync();
    bindTrackedClicks();
    trackPageView();
    updateLatestVideoLink();
}

initialize();
