(() => {
    const App = window.PortfolioApp = window.PortfolioApp || {};
    const performanceProfile = window.PortfolioPerformance || App.performanceProfile || {
        compact: false,
        tablet: false
    };

    function getUiText(key, fallback = "", replacements = {}) {
        return App.I18n?.getUiText ? App.I18n.getUiText(key, fallback, replacements) : fallback;
    }

    function getCurrentLanguage() {
        return App.I18n?.getCurrentLanguage ? App.I18n.getCurrentLanguage() : (document.documentElement.lang === "tr" ? "tr" : "en");
    }

function setupLibraryExplorer() {
    const section = document.getElementById("library");
    const grid = section?.querySelector("[data-library-grid]");
    const searchInput = document.getElementById("library-search");
    const clearBtn = document.getElementById("library-clear");
    const showMoreBtn = document.getElementById("library-show-more");
    const actions = section?.querySelector("[data-library-actions]");
    const resultCount = document.getElementById("library-result-count");
    const emptyState = document.getElementById("library-empty");
    const filters = [...(section?.querySelectorAll("[data-library-filter]") || [])];
    const columns = [...(grid?.querySelectorAll(".library-col") || [])];

    if (!section || !grid || !searchInput || !showMoreBtn || !columns.length) return;

    const pageSize = performanceProfile.compact ? 4 : performanceProfile.tablet ? 6 : 8;
    let visibleLimit = pageSize;
    let activeFilter = "all";
    let query = "";

    const normalize = (value) => String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase(getCurrentLanguage() === "tr" ? "tr" : "en");

    const items = columns.map((element) => {
        const card = element.querySelector(".book-card");
        const type = card?.classList.contains("book-card--paper") ? "paper" : "book";
        const searchText = normalize([
            type,
            element.textContent,
            card?.getAttribute("href"),
            card?.dataset.track
        ].join(" "));

        return { element, card, type, searchText };
    });

    const matchesQuery = (item) => {
        const terms = normalize(query).split(/\s+/).filter(Boolean);
        return terms.every((term) => item.searchText.includes(term));
    };

    const matchesFilter = (item) => {
        if (activeFilter === "all") return true;
        if (activeFilter === item.type) return true;
        return item.searchText.includes(normalize(activeFilter));
    };

    const updateFilterButtons = () => {
        filters.forEach((button) => {
            const isActive = button.dataset.libraryFilter === activeFilter;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });
    };

    const render = () => {
        const filtered = items.filter((item) => matchesFilter(item) && matchesQuery(item));
        const visibleItems = filtered.slice(0, visibleLimit);

        items.forEach((item) => {
            const isVisible = visibleItems.includes(item);
            item.element.hidden = !isVisible;
            if (isVisible) {
                item.card?.classList.add("is-visible");
            }
        });

        const hasMore = filtered.length > visibleItems.length;
        showMoreBtn.hidden = !hasMore;
        if (actions) actions.hidden = !hasMore;
        if (emptyState) emptyState.hidden = filtered.length > 0;
        if (clearBtn) clearBtn.hidden = query.trim().length === 0;
        if (resultCount) {
            resultCount.textContent = getUiText("library_result_summary", "Showing {visible} of {total} resources", {
                visible: visibleItems.length,
                total: filtered.length
            });
        }
    };

    const resetLimit = () => {
        visibleLimit = pageSize;
    };

    searchInput.addEventListener("input", () => {
        query = searchInput.value;
        resetLimit();
        render();
    });

    clearBtn?.addEventListener("click", () => {
        searchInput.value = "";
        query = "";
        searchInput.focus();
        resetLimit();
        render();
    });

    filters.forEach((button) => {
        button.addEventListener("click", () => {
            activeFilter = button.dataset.libraryFilter || "all";
            resetLimit();
            updateFilterButtons();
            render();
        });
    });

    showMoreBtn.addEventListener("click", () => {
        visibleLimit += pageSize;
        render();
    });

    updateFilterButtons();
    render();
}

    App.Library = { setupLibraryExplorer };
})();
