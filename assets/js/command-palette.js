(() => {
    const App = window.PortfolioApp = window.PortfolioApp || {};
    const performanceProfile = window.PortfolioPerformance || { commandPaletteEnabled: true };
    const prefersReducedMotion = App.prefersReducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)");

    function getUiText(key, fallback = "", replacements = {}) {
        return App.I18n?.getUiText ? App.I18n.getUiText(key, fallback, replacements) : fallback;
    }

    function getCurrentLanguage() {
        return App.I18n?.getCurrentLanguage ? App.I18n.getCurrentLanguage() : (document.documentElement.lang === "tr" ? "tr" : "en");
    }

    function setLanguage(language, options = {}) {
        App.I18n?.setLanguage?.(language, options);
    }

    function cycleThemeMode() {
        App.Theme?.cycleThemeMode?.();
    }

    function announceStatus(message) {
        App.UI?.announceStatus?.(message);
    }

    async function copyText(value, fallbackInput) {
        if (App.Contact?.copyText) return App.Contact.copyText(value, fallbackInput);
        return false;
    }

function setupCommandPalette() {
    const config = App.Config || {};
    const CV_PDF_PATH = config.CV_PDF_PATH || "assets/docs/Yasin-Engin-Network-Automation-SDN-CV.pdf";
    const CV_PDF_FILENAME = config.CV_PDF_FILENAME || "Yasin-Engin-Network-Automation-SDN-CV.pdf";
    const emailInput = document.getElementById("email-address");
    const isFixedLanguagePage = Boolean(App.I18n?.isFixedLanguagePage);
    const cmdk = document.getElementById("cmdk");
    const cmdkInput = document.getElementById("cmdkInput");
    const cmdkCloseBtn = document.getElementById("cmdkClose");
    const cmdkList = document.getElementById("cmdkList");
    const cmdkEmpty = document.getElementById("cmdkEmpty");

    if (!cmdk || !cmdkInput || !cmdkCloseBtn || !cmdkList || !cmdkEmpty) return;

    if (typeof cmdk.showModal !== "function") {
        cmdk.remove();
        return;
    }

    if (!performanceProfile.commandPaletteEnabled) {
        cmdk.remove();
        return;
    }

    cmdkInput.setAttribute("aria-expanded", "false");

    const scrollToTarget = (selector) => {
        document.querySelector(selector)?.scrollIntoView({
            behavior: prefersReducedMotion.matches ? "auto" : "smooth",
            block: "start"
        });
    };

    const downloadFile = (href, filename) => {
        const link = document.createElement("a");
        link.href = href;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const actions = [
        {
            key: "github",
            aliases: ["repo", "kod"],
            label: "GitHub",
            descriptionKey: "cmdk_desc_github",
            icon: "fab fa-github",
            run: () => window.open("https://github.com/YasinEnginn", "_blank", "noopener")
        },
        {
            key: "linkedin",
            aliases: ["profil", "profile"],
            label: "LinkedIn",
            descriptionKey: "cmdk_desc_linkedin",
            icon: "fab fa-linkedin",
            run: () => window.open("https://www.linkedin.com/in/yasin-engin/", "_blank", "noopener")
        },
        {
            key: "projects",
            aliases: ["projeler", "repos", "repo"],
            labelKey: "nav_projects",
            fallbackLabel: "Projects",
            descriptionKey: "cmdk_desc_projects",
            icon: "fas fa-diagram-project",
            run: () => scrollToTarget("#projects")
        },
        {
            key: "notes",
            aliases: ["notlar", "engineering notes"],
            labelKey: "nav_notes",
            fallbackLabel: "Notes",
            descriptionKey: "cmdk_desc_notes",
            icon: "fas fa-note-sticky",
            run: () => { window.location.href = "notes/"; }
        },
        {
            key: "case studies",
            aliases: ["vaka incelemeleri", "case", "vakalar"],
            labelKey: "hero_case_studies",
            fallbackLabel: "Case Studies",
            descriptionKey: "cmdk_desc_case_studies",
            icon: "fas fa-folder-open",
            run: () => { window.location.href = "projects/"; }
        },
        {
            key: "cv",
            aliases: ["resume", "özgeçmiş"],
            labelKey: "hero_cv_view",
            fallbackLabel: "CV",
            descriptionKey: "cmdk_desc_cv",
            icon: "fas fa-id-card",
            run: () => { window.location.href = "cv.html"; }
        },
        {
            key: "cv pdf",
            aliases: ["pdf", "resume pdf"],
            labelKey: "hero_cv_pdf",
            fallbackLabel: "Download CV",
            descriptionKey: "cmdk_desc_cv_pdf",
            icon: "fas fa-file-pdf",
            run: () => downloadFile(CV_PDF_PATH, CV_PDF_FILENAME)
        },
        {
            key: "library",
            aliases: ["kütüphane", "kitap", "papers", "books"],
            labelKey: "nav_library",
            fallbackLabel: "Library",
            descriptionKey: "cmdk_desc_library",
            icon: "fas fa-book-open",
            run: () => { window.location.href = "/research-library/"; }
        },
        {
            key: "youtube",
            aliases: ["netreka", "video"],
            labelKey: "nav_youtube",
            fallbackLabel: "YouTube",
            descriptionKey: "cmdk_desc_youtube",
            icon: "fab fa-youtube",
            run: () => scrollToTarget("#youtube")
        },
        {
            key: "contact",
            aliases: ["iletişim", "email", "mail"],
            labelKey: "nav_contact",
            fallbackLabel: "Contact",
            descriptionKey: "cmdk_desc_contact",
            icon: "fas fa-envelope",
            run: () => scrollToTarget("#contact")
        },
        {
            key: "theme",
            aliases: ["tema", "dark", "light", "night", "day"],
            labelKey: "cmdk_action_theme",
            fallbackLabel: "Change theme",
            descriptionKey: "cmdk_desc_theme",
            icon: "fas fa-circle-half-stroke",
            run: cycleThemeMode
        },
        {
            key: "focus", run: () => {
                const isEnabled = document.body.classList.toggle("focus-mode");
                announceStatus(getUiText(
                    isEnabled ? "focus_mode_enabled" : "focus_mode_disabled",
                    isEnabled ? "Focus mode enabled." : "Focus mode disabled."
                ));
            },
            aliases: ["odak", "zen"],
            labelKey: "cmdk_action_focus",
            fallbackLabel: "Focus mode",
            descriptionKey: "cmdk_desc_focus",
            icon: "fas fa-bullseye"
        },
        {
            key: "lang tr",
            aliases: ["dil tr", "türkçe"],
            labelKey: "cmdk_action_language_tr",
            fallbackLabel: "Switch to Turkish",
            descriptionKey: "cmdk_desc_language",
            icon: "fas fa-language",
            run: () => setLanguage("tr", { transition: true })
        },
        {
            key: "lang en",
            aliases: ["dil en", "english", "ingilizce"],
            labelKey: "cmdk_action_language_en",
            fallbackLabel: "Switch to English",
            descriptionKey: "cmdk_desc_language",
            icon: "fas fa-language",
            run: () => setLanguage("en", { transition: true })
        },
        { key: "projects: netreka", run: () => { window.location.href = "projects/netreka-nexus/"; } },
        { key: "projects: tolerex", run: () => { window.location.href = "projects/tolerex/"; } },
        { key: "projects: automation", run: () => { window.location.href = "projects/network-automation-labs/"; } },
        { key: "projects: go networking", run: () => { window.location.href = "projects/go-network-programming/"; } },
        { key: "projects: ndn", run: () => { window.location.href = "projects/ndn-simulation-labs/"; } },
        { key: "projects: ccnp", run: () => { window.location.href = "projects/ccnp-labs/"; } },
        {
            key: "projects: rehydrator",
            aliases: ["rehydrator", "cc1352r", "contiki", "oad"],
            label: "Rehydrator",
            description: "CC1352R OAD firmware case study",
            icon: "fas fa-microchip",
            run: () => { window.location.href = "projects/rehydrator/"; }
        },
        {
            key: "vcard", run: () => {
                const vcardData = `BEGIN:VCARD
VERSION:3.0
FN:Yasin Engin
N:Engin;Yasin;;;
TITLE:Computer Engineering Student
EMAIL;TYPE=INTERNET;TYPE=WORK:yasinenginofficial@gmail.com
URL:https://yasinenginn.github.io/
NOTE:Network Automation, SDN, NDN, Go Backend, Distributed Systems
END:VCARD`;
                const blob = new Blob([vcardData], { type: "text/vcard" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "Yasin_Engin.vcf";
                a.click();
                URL.revokeObjectURL(url);
            },
            aliases: ["contact card", "kişi kartı"],
            labelKey: "cmdk_action_vcard",
            fallbackLabel: "Download vCard",
            descriptionKey: "cmdk_desc_vcard",
            icon: "fas fa-address-card"
        },
        {
            key: "email", run: async () => {
                const mail = ["yasinenginofficial", "gmail.com"].join("@");
                const copied = await copyText(mail, emailInput);
                if (copied) {
                    announceStatus(getUiText("email_copied", "Email copied."));
                } else {
                    window.location.href = `mailto:${mail}`;
                }
            },
            aliases: ["mail", "e-posta", "copy email"],
            labelKey: "cmdk_action_email",
            fallbackLabel: "Copy email",
            descriptionKey: "cmdk_desc_email",
            icon: "fas fa-at"
        },
        { key: "instagram", aliases: ["ig"], label: "Instagram", descriptionKey: "social_hint_instagram", icon: "fab fa-instagram", run: () => window.open("https://www.instagram.com/_yengin_/", "_blank", "noopener") },
        { key: "idea", run: () => document.getElementById("ideas")?.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth" }) },
        { key: "help", run: () => document.getElementById("help-wanted")?.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth" }) },
        { key: "submit", run: () => document.getElementById("showcase")?.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth" }) },
        { key: "discuss", run: () => document.getElementById("discussion")?.scrollIntoView({ behavior: prefersReducedMotion.matches ? "auto" : "smooth" }) }
    ];

    const availableActions = isFixedLanguagePage
        ? actions.filter((action) => !String(action.key || "").startsWith("lang "))
        : actions;

    let visibleActions = [];
    let activeIndex = 0;

    const getActionLabel = (action) => getUiText(action.labelKey, action.label || action.fallbackLabel || action.key);
    const getActionDescription = (action) => getUiText(action.descriptionKey, action.description || action.key);
    const normalize = (value) => String(value || "").toLocaleLowerCase(getCurrentLanguage() === "tr" ? "tr" : "en");
    const getSearchText = (action) => normalize([
        action.key,
        ...(action.aliases || []),
        getActionLabel(action),
        getActionDescription(action)
    ].join(" "));

    const matchActions = (query) => {
        const normalizedQuery = normalize(query.trim());
        const visibleCandidates = availableActions.filter((action) => action.labelKey || action.label || action.fallbackLabel);

        if (!normalizedQuery) return visibleCandidates.slice(0, 10);

        return visibleCandidates
            .map((action) => {
                const key = normalize(action.key);
                const aliases = (action.aliases || []).map(normalize);
                const searchText = getSearchText(action);
                const starts = key.startsWith(normalizedQuery) || aliases.some((alias) => alias.startsWith(normalizedQuery));
                const includes = searchText.includes(normalizedQuery);

                return {
                    action,
                    score: starts ? 0 : includes ? 1 : 2
                };
            })
            .filter((entry) => entry.score < 2)
            .sort((a, b) => a.score - b.score || getActionLabel(a.action).localeCompare(getActionLabel(b.action)))
            .slice(0, 10)
            .map((entry) => entry.action);
    };

    const runAction = (action) => {
        if (!action) return;

        cmdk.close();
        cmdkInput.value = "";
        renderActions();
        Promise.resolve(action.run()).catch(() => {
            announceStatus(getUiText("contact_error", "Something went wrong. Please retry."));
        });
    };

    const setActiveIndex = (nextIndex) => {
        if (!visibleActions.length) {
            activeIndex = 0;
            cmdkInput.removeAttribute("aria-activedescendant");
            return;
        }

        activeIndex = (nextIndex + visibleActions.length) % visibleActions.length;
        const activeOption = cmdkList.querySelector(`[data-index="${activeIndex}"]`);

        cmdkList.querySelectorAll(".cmdk-option").forEach((option, index) => {
            const selected = index === activeIndex;
            option.setAttribute("aria-selected", String(selected));
            option.tabIndex = selected ? 0 : -1;
        });

        if (activeOption) {
            cmdkInput.setAttribute("aria-activedescendant", activeOption.id);
            activeOption.scrollIntoView({ block: "nearest" });
        }
    };

    function renderActions() {
        visibleActions = matchActions(cmdkInput.value);
        activeIndex = Math.min(activeIndex, Math.max(visibleActions.length - 1, 0));
        cmdkList.textContent = "";

        visibleActions.forEach((action, index) => {
            const option = document.createElement("button");
            option.type = "button";
            option.className = "cmdk-option";
            option.id = `cmdk-option-${index}`;
            option.dataset.index = String(index);
            option.setAttribute("role", "option");

            const icon = document.createElement("span");
            icon.className = "cmdk-option-icon";
            icon.setAttribute("aria-hidden", "true");

            const iconGlyph = document.createElement("i");
            iconGlyph.className = action.icon || "fas fa-arrow-right";
            icon.appendChild(iconGlyph);

            const body = document.createElement("span");
            body.className = "cmdk-option-body";

            const label = document.createElement("strong");
            label.textContent = getActionLabel(action);

            const description = document.createElement("span");
            description.textContent = getActionDescription(action);

            const shortcut = document.createElement("kbd");
            shortcut.className = "cmdk-shortcut";
            shortcut.textContent = action.key;

            body.append(label, description);
            option.append(icon, body, shortcut);

            option.addEventListener("pointerenter", () => setActiveIndex(index));
            option.addEventListener("click", () => runAction(action));
            cmdkList.appendChild(option);
        });

        cmdkList.hidden = visibleActions.length === 0;
        cmdkEmpty.hidden = visibleActions.length > 0;
        setActiveIndex(activeIndex);
    }

    const toggleCmdk = () => {
        if (cmdk.open) {
            cmdk.close();
            return;
        }

        activeIndex = 0;
        renderActions();
        cmdk.showModal();
        cmdkInput.setAttribute("aria-expanded", "true");
        window.requestAnimationFrame(() => cmdkInput.focus());
    };

    cmdkCloseBtn.addEventListener("click", () => cmdk.close());

    window.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            toggleCmdk();
        }
        if (event.key === "Escape" && cmdk.open) {
            cmdk.close();
        }
    });

    cmdk.addEventListener("close", () => {
        cmdkInput.value = "";
        cmdkInput.setAttribute("aria-expanded", "false");
        activeIndex = 0;
        renderActions();
    });

    cmdkInput.addEventListener("input", () => {
        activeIndex = 0;
        renderActions();
    });

    cmdkInput.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex(activeIndex + 1);
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex(activeIndex - 1);
            return;
        }

        if (event.key !== "Enter") return;

        const query = normalize(cmdkInput.value.trim());
        const exactHit = availableActions.find((action) => normalize(action.key) === query) || availableActions.find((action) => normalize(action.key).startsWith(query));
        const hit = visibleActions[activeIndex] || exactHit;

        if (hit) {
            event.preventDefault();
            runAction(hit);
        }
    });

    renderActions();
}

    App.CommandPalette = { setupCommandPalette };
})();
