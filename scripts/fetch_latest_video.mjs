import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import process from "node:process";

const CHANNEL_HANDLE = process.env.YT_CHANNEL_HANDLE || "@Netreka_Akademi";
const OUTPUT_PATH = "assets/data/latest_video.json";

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

  const summary = payload.video?.url || `https://www.youtube.com/${CHANNEL_HANDLE}`;
  console.log(`latest_video.json written -> ${summary}`);
}

main();
