(() => {
    const App = window.PortfolioApp = window.PortfolioApp || {};
    const copyBtn = document.getElementById("copyBtn");
    const emailInput = document.getElementById("email-address");

    const CONTACT_LIMIT_KEY = "contactSubmitHistory";
    const CONTACT_WINDOW_MS = 60 * 60 * 1000;
    const CONTACT_MIN_GAP_MS = 60 * 1000;
    const CONTACT_MAX_IN_WINDOW = 3;

    function getUiText(key, fallback = "", replacements = {}) {
        return App.I18n?.getUiText ? App.I18n.getUiText(key, fallback, replacements) : fallback;
    }

    function announceStatus(message) {
        App.UI?.announceStatus?.(message);
    }

    function trackEvent(eventName, detail = {}) {
        App.Projects?.trackEvent?.(eventName, detail);
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
            announceStatus(getUiText("copy_error", "Copy failed. You can select the email address manually."));
        }
    });
}

    function setupEmailAddress() {
        if (!emailInput) return;
        const part1 = "yasinenginofficial";
        const part2 = "gmail.com";
        emailInput.value = part1 + "@" + part2;
    }

    App.Contact = {
        copyText,
        setupEmailAddress,
        setupCopyButton,
        setupContactForm
    };
})();
