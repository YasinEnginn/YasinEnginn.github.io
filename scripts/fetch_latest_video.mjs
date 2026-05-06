import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { createHash } from "node:crypto";
import process from "node:process";

const CHANNEL_HANDLE = process.env.YT_CHANNEL_HANDLE || "@Netreka_Akademi";
const OUTPUT_PATH = "assets/data/latest_video.json";
const INDEX_PATH = "index.html";
const VIDEOS_PATH = "videos/index.html";
const PERSON_ID = "https://yasinenginn.github.io/#person";
const CHANNEL_URL = `https://www.youtube.com/${CHANNEL_HANDLE}`;

function decodeEntities(text) {
  return text
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; NetrekaBot/1.0)",
      accept: "text/html,application/xml;q=0.9,*/*;q=0.8"
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  return response.text();
}

function extractChannelId(html) {
  const regexes = [
    /"channelId":"(UC[\w-]{20,30})"/,
    /https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{20,30})/,
    /"browseId":"(UC[\w-]{20,30})"/
  ];

  for (const rx of regexes) {
    const hit = html.match(rx);
    if (hit?.[1]) {
      return hit[1];
    }
  }

  return null;
}

function parseLatestEntry(feedXml) {
  const entryBlock = feedXml.match(/<entry>([\s\S]*?)<\/entry>/);
  if (!entryBlock) {
    throw new Error("No <entry> found in feed");
  }

  const block = entryBlock[1];
  const id = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] || "";
  const titleRaw = block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "Latest video";
  const published = block.match(/<published>([^<]+)<\/published>/)?.[1] || null;

  if (!id) {
    throw new Error("yt:videoId missing in latest entry");
  }

  return {
    id,
    title: decodeEntities(titleRaw.trim()),
    published,
    url: `https://www.youtube.com/watch?v=${id}`
  };
}

function fallbackPayload(errorMessage = "") {
  return {
    source: "fallback",
    channelHandle: CHANNEL_HANDLE,
    updatedAt: new Date().toISOString(),
    video: {
      id: null,
      title: "Netreka Akademi",
      published: null,
      url: `https://www.youtube.com/${CHANNEL_HANDLE}`
    },
    error: errorMessage || undefined
  };
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(text) {
  return escapeHtml(text).replaceAll("`", "&#96;");
}

function safeJson(value) {
  return JSON.stringify(value, null, 2).replaceAll("<", "\\u003c");
}

function indentJson(value, spaces = 4) {
  const pad = " ".repeat(spaces);
  return safeJson(value)
    .split("\n")
    .map((line) => `${pad}${line}`)
    .join("\n");
}

function videoThumbnailUrl(video) {
  return video?.id ? `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg` : "";
}

function videoEmbedUrl(video) {
  return video?.id ? `https://www.youtube.com/embed/${video.id}` : "";
}

function buildVideoObject(video, { includeContext = true, includePosition = false } = {}) {
  if (!video?.id || !video?.url || !video?.published) return null;

  const title = video.title || "Netreka Akademi";
  const object = {
    "@type": "VideoObject",
    ...(includePosition ? { position: 1 } : {}),
    name: title,
    description: `Netreka Akademi video by Yasin Engin: ${title}.`,
    thumbnailUrl: [videoThumbnailUrl(video)],
    uploadDate: video.published,
    contentUrl: video.url,
    embedUrl: videoEmbedUrl(video),
    publisher: {
      "@type": "Organization",
      name: "Netreka Akademi",
      url: CHANNEL_URL,
      founder: {
        "@id": PERSON_ID
      }
    },
    author: {
      "@id": PERSON_ID
    }
  };

  return includeContext ? { "@context": "https://schema.org", ...object } : object;
}

function replaceJsonLd(source, updater) {
  const rx = /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/;
  const match = source.match(rx);
  if (!match) return source;

  const json = JSON.parse(match[2]);
  const updated = updater(json);
  return source.replace(rx, `${match[1]}\n${indentJson(updated, 4)}\n  ${match[3]}`);
}

function replaceInlineScriptCspHash(source) {
  const script = source.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/);
  const csp = source.match(/(<meta[^>]+http-equiv="Content-Security-Policy"[^>]+content=")([^"]*)("[^>]*>)/i);
  if (!script || !csp) return source;

  const hash = `sha256-${createHash("sha256").update(script[1], "utf8").digest("base64")}`;
  const updatedContent = csp[2].replace(/sha256-[^'\s;]+/g, hash);
  return source.replace(csp[0], `${csp[1]}${updatedContent}${csp[3]}`);
}

function updateIndexHtml(source, video) {
  const videoObject = buildVideoObject(video);
  if (!videoObject) return source;

  let updated = replaceJsonLd(source, (json) => {
    if (!Array.isArray(json)) return json;
    const next = json.filter((item) => item?.["@type"] !== "VideoObject");
    const itemListIndex = next.findIndex((item) => item?.["@type"] === "ItemList");
    if (itemListIndex >= 0) {
      next.splice(itemListIndex, 0, videoObject);
      return next;
    }
    return [...next, videoObject];
  });

  updated = updated.replace(
    /(<a id="latest-video-link" href=")[^"]+(")/,
    `$1${escapeAttr(video.url)}$2`
  );
  updated = updated.replace(
    /(<a id="latest-video-card-link"[^>]+href=")[^"]+(")/,
    `$1${escapeAttr(video.url)}$2`
  );
  updated = updated.replace(
    /(<img id="latest-video-thumb" src=")[^"]+(")/,
    `$1${escapeAttr(videoThumbnailUrl(video))}$2`
  );
  updated = updated.replace(
    /(<h3 id="latest-video-title">)([\s\S]*?)(<\/h3>)/,
    `$1${escapeHtml(video.title || "Netreka Akademi")}$3`
  );

  return replaceInlineScriptCspHash(updated);
}

function buildVideosCollection(video) {
  const videoObject = buildVideoObject(video, { includeContext: false, includePosition: true });
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Netreka Akademi Videos by Yasin Engin",
    description: "Video series by Yasin Engin on Netreka Akademi covering Network Automation, SDN, Nokia SR Linux, CCNA, CCNP, Go backend, and network programming.",
    url: "https://yasinenginn.github.io/videos/",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: videoObject ? [videoObject] : []
    },
    author: {
      "@type": "Person",
      name: "Yasin Engin",
      alternateName: "YasinEnginn",
      url: "https://yasinenginn.github.io/",
      sameAs: [
        "https://github.com/YasinEnginn",
        "https://tr.linkedin.com/in/yasin-engin",
        CHANNEL_URL
      ]
    }
  };
}

function updateVideosHtml(source, video) {
  if (!video?.id || !video?.url) return source;

  let updated = replaceJsonLd(source, () => buildVideosCollection(video));
  updated = updated.replace(
    /(<h2>Latest Video<\/h2>\s*<p>)([\s\S]*?)(<\/p>)/,
    `$1${escapeHtml(video.title || "Netreka Akademi")}$3`
  );
  updated = updated.replace(
    /(<a class="btn" href=")[^"]+(" target="_blank" rel="noopener noreferrer">Watch on YouTube<\/a>)/,
    `$1${escapeAttr(video.url)}$2`
  );

  return updated;
}

async function updateVideoPages(payload) {
  const video = payload?.video;
  if (!video?.id || !video?.url || !video?.published) return false;

  const [indexHtml, videosHtml] = await Promise.all([
    readFile(INDEX_PATH, "utf8"),
    readFile(VIDEOS_PATH, "utf8")
  ]);

  await Promise.all([
    writeFile(INDEX_PATH, updateIndexHtml(indexHtml, video), "utf8"),
    writeFile(VIDEOS_PATH, updateVideosHtml(videosHtml, video), "utf8")
  ]);

  return true;
}

async function main() {
  let payload = fallbackPayload();

  try {
    const channelHtml = await fetchText(`https://www.youtube.com/${CHANNEL_HANDLE}`);
    const channelId = extractChannelId(channelHtml);

    if (!channelId) {
      throw new Error("Channel ID could not be extracted from handle page");
    }

    const feedXml = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
    const latest = parseLatestEntry(feedXml);

    payload = {
      source: "youtube-rss",
      channelHandle: CHANNEL_HANDLE,
      channelId,
      updatedAt: new Date().toISOString(),
      video: latest
    };
  } catch (error) {
    payload = fallbackPayload(error instanceof Error ? error.message : String(error));
  }

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  const pagesUpdated = await updateVideoPages(payload);

  const summary = payload.video?.url || `https://www.youtube.com/${CHANNEL_HANDLE}`;
  console.log(`latest_video.json written -> ${summary}`);
  if (pagesUpdated) {
    console.log("video structured data updated in index.html and videos/index.html");
  }
}

main();
