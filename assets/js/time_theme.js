(() => {
    const themeOrder = Object.freeze(["auto", "dawn", "day", "sunset", "night"]);

    const themeMeta = Object.freeze({
        auto: { label: "Otomatik", icon: "◐" },
        dawn: { label: "Sabah", icon: "◒" },
        day: { label: "Gündüz", icon: "☀" },
        sunset: { label: "Gün Batımı", icon: "◓" },
        night: { label: "Gece", icon: "☾" }
    });

    function normalizeMode(mode) {
        return themeOrder.includes(mode) ? mode : "auto";
    }

    function getThemeByHour(date = new Date()) {
        const hour = date.getHours();

        if (hour >= 5 && hour < 9) return "dawn";
        if (hour >= 9 && hour < 17) return "day";
        if (hour >= 17 && hour < 21) return "sunset";
        return "night";
    }

    function resolveSurfaceTheme(resolvedTheme) {
        return resolvedTheme === "day" ? "light" : "dark";
    }

    function getThemeState(mode = "auto", date = new Date()) {
        const normalizedMode = normalizeMode(mode);
        const resolvedTheme = normalizedMode === "auto" ? getThemeByHour(date) : normalizedMode;
        const surfaceTheme = resolveSurfaceTheme(resolvedTheme);

        return {
            mode: normalizedMode,
            resolvedTheme,
            surfaceTheme,
            currentTheme: themeMeta[normalizedMode],
            resolvedThemeMeta: themeMeta[resolvedTheme]
        };
    }

    function cycleThemeMode(currentMode = "auto") {
        const currentIndex = themeOrder.indexOf(normalizeMode(currentMode));
        return themeOrder[(currentIndex + 1) % themeOrder.length];
    }

    function getStoredMode(storage = window.localStorage) {
        try {
            const storedMode = storage.getItem("theme-mode");
            if (themeOrder.includes(storedMode)) return storedMode;

            const legacyTheme = storage.getItem("theme");
            if (legacyTheme === "light") return "day";
            if (legacyTheme === "dark") return "night";
        } catch {
            return "auto";
        }

        return "auto";
    }

    window.TimeTheme = Object.freeze({
        themeOrder,
        themeMeta,
        normalizeMode,
        getThemeByHour,
        resolveSurfaceTheme,
        getThemeState,
        cycleThemeMode,
        getStoredMode
    });
})();
