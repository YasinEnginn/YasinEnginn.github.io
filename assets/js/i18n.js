(() => {
    const App = window.PortfolioApp = window.PortfolioApp || {};
    const htmlEl = document.documentElement;
    const prefersReducedMotion = App.prefersReducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)");
    const langToggle = document.getElementById("langToggle");
    const pageLanguageMode = htmlEl.dataset.languageMode || "bilingual";
    const pageDefaultLanguage = htmlEl.dataset.defaultLang || htmlEl.lang || "en";
    const isFixedLanguagePage = pageLanguageMode === "fixed";
    const scriptUrl = document.currentScript?.src || new URL("i18n.js", document.baseURI).href;
    const translationsUrl = new URL("../data/translations.json", scriptUrl).href;
    let translations = { en: {}, tr: {} };

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

function runViewTransition(update, transitionType = "ui") {
    if (typeof update !== "function") return undefined;

    if (!document.startViewTransition || prefersReducedMotion.matches) {
        return update();
    }

    htmlEl.dataset.transition = transitionType;
    const transition = document.startViewTransition(() => {
        update();
    });

    transition.finished.finally(() => {
        delete htmlEl.dataset.transition;
    });

    return transition;
}

    async function loadTranslations() {
        try {
            const response = await fetch(translationsUrl, { cache: "default" });
            if (!response.ok) throw new Error("Translations request failed (" + response.status + ")");
            const payload = await response.json();
            translations = payload && typeof payload === "object" ? payload : translations;
        } catch (error) {
            console.warn("Portfolio translations could not be loaded.", error);
        }

        return translations;
    }

    function hasLanguage(language) {
        return Boolean(translations[language]);
    }

function setLanguage(newLang, options = {}) {
    if (!translations[newLang]) return;

    const { transition = false } = options;
    const updateLanguage = () => {
        document.documentElement.lang = newLang;
        if (!isFixedLanguagePage) {
            localStorage.setItem("selectedLanguage", newLang);
        }

        if (langToggle) {
            langToggle.textContent = newLang === "tr" ? "EN" : "TR";
            const nextLanguageKey = newLang === "tr" ? "language_english" : "language_turkish";
            const nextLanguageFallback = newLang === "tr" ? "English" : "Türkçe";
            const nextLanguage = getUiText(nextLanguageKey, nextLanguageFallback);
            const label = getUiText("lang_button_label", `Change language. Next: ${nextLanguage}`, { language: nextLanguage });
            langToggle.setAttribute("aria-label", label);
            langToggle.setAttribute("title", label);
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

        document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
            const key = el.getAttribute("data-i18n-aria-label");
            if (!key || !translations[newLang][key]) return;
            el.setAttribute("aria-label", translations[newLang][key]);
        });

        const cmdkHint = document.getElementById("cmdkHint");
        if (cmdkHint) {
            cmdkHint.textContent = getUiText("cmdk_hint", "Enter to open | Esc to close | Ctrl+K to toggle");
        }

        window.dispatchEvent(new CustomEvent("portfolio:languagechange", { detail: { language: newLang } }));
    };

    if (transition) {
        runViewTransition(updateLanguage, "language");
        return;
    }

    updateLanguage();
}

    function setupLanguageToggle() {
        if (langToggle && isFixedLanguagePage) {
            langToggle.hidden = true;
            langToggle.setAttribute("aria-hidden", "true");
        }

        if (langToggle && !isFixedLanguagePage) {
            langToggle.addEventListener("click", () => {
                const next = document.documentElement.lang === "tr" ? "en" : "tr";
                setLanguage(next, { transition: true });
            });
        }
    }

    const ready = loadTranslations();

    App.I18n = {
        ready,
        get translations() { return translations; },
        get pageLanguageMode() { return pageLanguageMode; },
        get pageDefaultLanguage() { return pageDefaultLanguage; },
        get isFixedLanguagePage() { return isFixedLanguagePage; },
        getCurrentLanguage,
        getUiText,
        runViewTransition,
        hasLanguage,
        setLanguage,
        setupLanguageToggle
    };
})();
