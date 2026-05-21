(() => {
    const App = window.PortfolioApp = window.PortfolioApp || {};
    const htmlEl = document.documentElement;
    const themeBtn = document.getElementById("themeToken");
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const timeTheme = window.TimeTheme;

    const THEME_MODE_LABEL_KEYS = Object.freeze({
        auto: "theme_mode_auto",
        dawn: "theme_mode_dawn",
        day: "theme_mode_day",
        sunset: "theme_mode_sunset",
        night: "theme_mode_night"
    });

    let themeRefreshTimer = null;
    let themeState = {
        mode: "auto",
        resolvedTheme: "night",
        surfaceTheme: "dark",
        currentTheme: { label: "Auto", icon: "\u25cf" },
        resolvedThemeMeta: { label: "Night", icon: "\u263e" }
    };

    function getUiText(key, fallback = "", replacements = {}) {
        return App.I18n?.getUiText ? App.I18n.getUiText(key, fallback, replacements) : fallback;
    }

    function runViewTransition(update, transitionType = "ui") {
        if (App.I18n?.runViewTransition) return App.I18n.runViewTransition(update, transitionType);
        return typeof update === "function" ? update() : undefined;
    }

    function announceStatus(message) {
        App.UI?.announceStatus?.(message);
    }

function getThemeState(mode = "auto") {
    if (timeTheme?.getThemeState) {
        return timeTheme.getThemeState(mode);
    }

    const normalizedMode = THEME_MODE_LABEL_KEYS[mode] ? mode : "auto";
    const resolvedTheme = normalizedMode === "auto" ? "night" : normalizedMode;

    return {
        mode: normalizedMode,
        resolvedTheme,
        surfaceTheme: resolvedTheme === "day" ? "light" : "dark",
        currentTheme: { label: normalizedMode, icon: "◐" },
        resolvedThemeMeta: { label: resolvedTheme, icon: "☾" }
    };
}

function getThemeModeLabel(mode) {
    const key = THEME_MODE_LABEL_KEYS[mode];
    return key ? getUiText(key, mode) : mode;
}

function updateThemeButton() {
    if (!themeBtn) return;

    const glyph = themeBtn.querySelector(".theme-mode-glyph");
    const currentLabel = getThemeModeLabel(themeState.mode);
    const resolvedLabel = getThemeModeLabel(themeState.resolvedTheme);

    if (glyph) {
        glyph.textContent = themeState.currentTheme?.icon || "◐";
    }

    themeBtn.setAttribute("aria-label", getUiText("theme_button_label", `Change theme. Current mode: ${currentLabel}`, { mode: currentLabel }));
    themeBtn.setAttribute("title", getUiText("theme_button_title", `Theme: ${currentLabel} / Active palette: ${resolvedLabel}`, {
        mode: currentLabel,
        resolved: resolvedLabel
    }));
    themeBtn.dataset.themeMode = themeState.mode;
    themeBtn.dataset.resolvedTheme = themeState.resolvedTheme;
}

function updateThemeMeta(resolvedTheme, surfaceTheme) {
    if (!themeColorMeta) return;

    const themeColors = {
        dawn: "#102536",
        day: "#1a3f5f",
        sunset: "#331c30",
        night: "#04070f"
    };

    themeColorMeta.setAttribute("content", themeColors[resolvedTheme] || (surfaceTheme === "light" ? "#efe9dc" : "#04070f"));
}

function clearThemeRefreshTimer() {
    if (themeRefreshTimer) {
        window.clearInterval(themeRefreshTimer);
        themeRefreshTimer = null;
    }
}

function applyThemeState(nextState, { persistMode = true } = {}) {
    themeState = nextState;

    htmlEl.setAttribute("data-theme", themeState.surfaceTheme);
    htmlEl.setAttribute("data-bs-theme", themeState.surfaceTheme);
    htmlEl.setAttribute("data-theme-mode", themeState.mode);
    htmlEl.setAttribute("data-time-theme", themeState.resolvedTheme);

    if (persistMode) {
        localStorage.setItem("theme-mode", themeState.mode);
    }

    localStorage.setItem("theme", themeState.surfaceTheme);
    updateThemeButton();
    updateThemeMeta(themeState.resolvedTheme, themeState.surfaceTheme);
}

function scheduleThemeRefresh() {
    clearThemeRefreshTimer();

    if (themeState.mode !== "auto") return;

    themeRefreshTimer = window.setInterval(() => {
        applyThemeState(getThemeState(themeState.mode), { persistMode: false });
    }, 60 * 1000);
}

function setThemeMode(mode, options = {}) {
    const { transition = false, ...themeOptions } = options;
    const updateTheme = () => {
        applyThemeState(getThemeState(mode), themeOptions);
        scheduleThemeRefresh();
    };

    if (transition) {
        runViewTransition(updateTheme, "theme");
        return;
    }

    updateTheme();
}

function cycleThemeMode() {
    const nextMode = timeTheme?.cycleThemeMode ? timeTheme.cycleThemeMode(themeState.mode) : "auto";
    setThemeMode(nextMode, { transition: true });

    const modeLabel = getThemeModeLabel(themeState.mode);
    const resolvedLabel = getThemeModeLabel(themeState.resolvedTheme);
    announceStatus(getUiText("theme_button_announce", `Theme mode: ${modeLabel}. Active palette: ${resolvedLabel}.`, {
        mode: modeLabel,
        resolved: resolvedLabel
    }));
}

    function setupThemeControls() {
        if (themeBtn) {
            themeBtn.addEventListener("click", cycleThemeMode);
        }

        window.addEventListener("portfolio:languagechange", updateThemeButton);
    }

    App.Theme = {
        get state() { return themeState; },
        getThemeState,
        getThemeModeLabel,
        updateThemeButton,
        setThemeMode,
        cycleThemeMode,
        setupThemeControls
    };
})();
