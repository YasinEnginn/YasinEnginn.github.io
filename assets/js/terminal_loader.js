(() => {
    const profile = window.PortfolioPerformance;
    let performanceMode = "";
    try {
        const params = new URLSearchParams(window.location.search);
        performanceMode = params.get("lite") === "1" || params.get("performance") === "lite"
            ? "lite"
            : params.get("lite") === "0" || params.get("performance") === "full"
                ? "full"
                : localStorage.getItem("performance-mode") || "";
    } catch {
        performanceMode = "";
    }
    const terminalEnabled = profile?.terminalEnabled ?? !(
        profile?.tablet ||
        profile?.mobile ||
        profile?.lowPower
    );
    const isMobileLite = !terminalEnabled || (
        performanceMode === "lite" ||
        (performanceMode !== "full" && (
            window.matchMedia("(max-width: 640px)").matches ||
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ))
    );
    const terminalOverlay = document.getElementById("terminal-overlay");
    const terminalToggleBtn = document.getElementById("terminal-toggle-btn");

    if (isMobileLite) {
        if (terminalOverlay) terminalOverlay.style.display = "none";
        if (terminalToggleBtn) terminalToggleBtn.style.display = "none";
        return;
    }

    if (!terminalToggleBtn || !terminalOverlay) return;

    let loadingPromise = null;

    function loadTerminal({ open = false } = {}) {
        if (window.NetrekaTerminal) {
            if (open) window.NetrekaTerminal.open();
            return Promise.resolve();
        }

        if (open) {
            window.__netrekaTerminalOpenRequested = true;
        }

        if (!loadingPromise) {
            loadingPromise = new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "assets/js/terminal.js";
                script.defer = true;
                script.onload = resolve;
                script.onerror = () => reject(new Error("Terminal module failed to load"));
                document.head.appendChild(script);
            }).catch((error) => {
                console.warn(error.message);
                loadingPromise = null;
            });
        }

        return loadingPromise;
    }

    terminalToggleBtn.addEventListener("click", (event) => {
        if (window.NetrekaTerminal) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        loadTerminal({ open: true });
    }, { capture: true });

    terminalToggleBtn.addEventListener("pointerenter", () => {
        loadTerminal();
    }, { once: true });

    terminalToggleBtn.addEventListener("focus", () => {
        loadTerminal();
    }, { once: true });
})();
