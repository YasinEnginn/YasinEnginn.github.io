const lowPower =
    window.matchMedia("(max-width: 900px)").matches ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (lowPower) {
    document.documentElement.dataset.lowPower = "1";
} else {
    import("./main.js");
}
