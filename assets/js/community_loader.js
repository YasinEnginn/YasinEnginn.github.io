document.addEventListener("DOMContentLoaded", () => {
const isMobileLite = window.matchMedia("(max-width: 768px)").matches;
if (isMobileLite) {
return;
}
const STAR_CACHE_KEY = "githubRepoStars:v1";
const STAR_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const repos = [
{ id: "stars-ansible", repo: "YasinEnginn/my-ansible-lab" },
{ id: "stars-go", repo: "YasinEnginn/Go_Network_Programming" },
{ id: "stars-nexus", repo: "YasinEnginn/Netreka-Nexus" }
];

function readCache() {
try {
return JSON.parse(localStorage.getItem(STAR_CACHE_KEY) || "{}");
} catch {
return {};
}
}

function writeCache(cache) {
try {
localStorage.setItem(STAR_CACHE_KEY, JSON.stringify(cache));
} catch {
// Ignore storage quota and privacy-mode failures.
}
}

function isFresh(entry) {
return Boolean(entry && Number.isFinite(entry.stars) && Number.isFinite(entry.fetchedAt) && (Date.now() - entry.fetchedAt) < STAR_CACHE_TTL_MS);
}

function renderStars(element, stars) {
element.textContent = `${stars} stars`;
element.title = `${stars} Stars on GitHub`;
}

const targets = repos
.map(item => ({ ...item, element: document.getElementById(item.id) }))
.filter(item => item.element);

if (!targets.length) {
return;
}

const cache = readCache();

targets.forEach(item => {
const cached = cache[item.repo];
if (isFresh(cached)) {
renderStars(item.element, cached.stars);
}
});

targets.forEach(item => {
const cached = cache[item.repo];
if (isFresh(cached)) {
return;
}

fetch(`https://api.github.com/repos/${item.repo}`)
.then(response => {
if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
return response.json();
})
.then(data => {
if (!Number.isFinite(data.stargazers_count)) {
throw new Error("Invalid stargazer count");
}

cache[item.repo] = {
stars: data.stargazers_count,
fetchedAt: Date.now()
};
writeCache(cache);
renderStars(item.element, data.stargazers_count);
})
.catch(error => {
console.warn(`Could not fetch stars for ${item.repo}`, error);
if (isFresh(cached)) {
renderStars(item.element, cached.stars);
}
});
});
});
