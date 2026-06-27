(() => {
  const normalize = (value) => String(value || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  function setupFilters() {
    const root = document.querySelector("[data-diary-index]");
    const form = root?.querySelector("[data-diary-filters]");
    const input = root?.querySelector("[data-diary-search]");
    const category = root?.querySelector("[data-diary-category]");
    const cards = [...(root?.querySelectorAll("[data-diary-card]") || [])];
    const tagButtons = [...(root?.querySelectorAll("[data-diary-tag]") || [])];
    const results = root?.querySelector("[data-diary-results]");
    const empty = root?.querySelector("[data-diary-empty]");

    if (!root || !form || !input || !category || !results || !empty) return;

    const params = new URLSearchParams(window.location.search);
    input.value = params.get("q") || "";
    category.value = params.get("category") || "";
    let activeTag = params.get("tag") || "";

    const syncTagButtons = () => {
      for (const button of tagButtons) {
        button.setAttribute("aria-pressed", String(button.dataset.diaryTag === activeTag));
      }
    };

    const updateUrl = () => {
      const next = new URLSearchParams();
      if (input.value.trim()) next.set("q", input.value.trim());
      if (category.value) next.set("category", category.value);
      if (activeTag) next.set("tag", activeTag);
      const query = next.toString();
      const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
      window.history.replaceState(null, "", url);
    };

    const applyFilters = () => {
      const query = normalize(input.value);
      const selectedCategory = category.value;
      let visible = 0;

      for (const card of cards) {
        const matchesQuery = !query || normalize(card.dataset.search).includes(query);
        const matchesCategory = !selectedCategory || card.dataset.category === selectedCategory;
        const matchesTag = !activeTag || card.dataset.tags.split(/\s+/).includes(activeTag);
        const show = matchesQuery && matchesCategory && matchesTag;
        card.hidden = !show;
        if (show) visible += 1;
      }

      results.textContent = `${visible} yazı gösteriliyor.`;
      empty.hidden = visible !== 0;
      syncTagButtons();
      updateUrl();
    };

    input.addEventListener("input", applyFilters);
    category.addEventListener("change", applyFilters);
    form.addEventListener("submit", (event) => event.preventDefault());
    form.addEventListener("reset", () => {
      activeTag = "";
      window.requestAnimationFrame(applyFilters);
    });

    for (const button of tagButtons) {
      button.addEventListener("click", () => {
        activeTag = activeTag === button.dataset.diaryTag ? "" : button.dataset.diaryTag;
        applyFilters();
      });
    }

    applyFilters();
  }

  async function copyUrl(url) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("Copy failed");
  }

  function setupSharing() {
    const status = document.querySelector("[data-share-status]");

    for (const button of document.querySelectorAll("[data-copy-url]")) {
      button.addEventListener("click", async () => {
        try {
          await copyUrl(button.dataset.copyUrl);
          if (status) status.textContent = "Bağlantı panoya kopyalandı.";
        } catch {
          if (status) status.textContent = "Bağlantı kopyalanamadı; adres çubuğundan kopyalayabilirsin.";
        }
      });
    }

    for (const button of document.querySelectorAll("[data-native-share]")) {
      button.addEventListener("click", async () => {
        const data = {
          title: button.dataset.shareTitle,
          text: button.dataset.shareTitle,
          url: button.dataset.shareUrl
        };

        try {
          if (navigator.share) {
            await navigator.share(data);
          } else {
            await copyUrl(data.url);
            if (status) status.textContent = "Bağlantı panoya kopyalandı.";
          }
        } catch (error) {
          if (error.name !== "AbortError" && status) {
            status.textContent = "Paylaşım açılamadı; bağlantıyı kopyalayabilirsin.";
          }
        }
      });
    }
  }

  setupFilters();
  setupSharing();
})();
