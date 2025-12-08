// server.js
// Farcaster Auditor backend + static file server (all features, 7-day window)

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// static frontend
// static frontend
const publicDir = __dirname;

// dotfiles (.well-known/farcaster.json) allow করি যেন manifest serve হয়
app.use(
  express.static(publicDir, {
    dotfiles: "allow",
  })
);


const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const PORT = process.env.PORT || 3000;

// analysis window
const WINDOW_DAYS = 7;
const WINDOW_MS = WINDOW_DAYS * 24 * 60 * 60 * 1000;

if (!NEYNAR_API_KEY) {
  console.error("❌ NEYNAR_API_KEY missing in .env");
  process.exit(1);
}

// small helper for Neynar GET
async function neynarGet(pathname, params = {}) {
  const url = new URL(`https://api.neynar.com${pathname}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
    }
  });

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-api-key": NEYNAR_API_KEY,
      "Content-Type": "application/json",
      "x-neynar-experimental": "true",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Neynar error ${res.status}: ${text}`);
  }
  return res.json();
}

// health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, message: "Farcaster Auditor backend online" });
});

// ---------- PURE HELPERS (NO NETWORK) ----------

// get a safe timestamp + age
function castTimeInfo(cast) {
  const tsRaw =
    cast.timestamp || cast.published_at || cast.created_at || null;
  if (!tsRaw) return { ts: null, ms: null, ageMs: null, ageHours: null };
  const ts = new Date(tsRaw);
  if (Number.isNaN(ts.getTime()))
    return { ts: null, ms: null, ageMs: null, ageHours: null };
  const ms = ts.getTime();
  const now = Date.now();
  const ageMs = now - ms;
  const ageHours = ageMs / (60 * 60 * 1000);
  return { ts, ms, ageMs, ageHours };
}

// total engagement for a cast
function castEngagement(cast) {
  const reactions = cast.reactions || {};
  const replies = cast.replies || {};
  const likesCount =
    typeof reactions.likes_count === "number"
      ? reactions.likes_count
      : (reactions.likes || []).length;
  const recastsCount =
    typeof reactions.recasts_count === "number"
      ? reactions.recasts_count
      : (reactions.recasts || []).length;
  const repliesCount =
    typeof replies.count === "number" ? replies.count : 0;
  return {
    likesCount,
    recastsCount,
    repliesCount,
    total: likesCount + recastsCount + repliesCount,
  };
}

// filter to last N days
function filterRecentCasts(casts, days = WINDOW_DAYS) {
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return casts.filter((cast) => {
    const { ms } = castTimeInfo(cast);
    if (!ms) return false;
    return ms >= cutoff;
  });
}

// hour-of-day (0–23) & weekday (0–6) buckets
function computeTimeBuckets(casts) {
  const hourBuckets = Array.from({ length: 24 }, () => ({
    casts: 0,
    engagement: 0,
  }));
  const dayBuckets = Array.from({ length: 7 }, () => ({
    casts: 0,
    engagement: 0,
  }));

  for (const cast of casts) {
    const { ts } = castTimeInfo(cast);
    if (!ts) continue;

    const { total: engagement } = castEngagement(cast);

    const h = ts.getUTCHours();
    const d = ts.getUTCDay(); // 0=Sun

    hourBuckets[h].casts++;
    hourBuckets[h].engagement += engagement;

    dayBuckets[d].casts++;
    dayBuckets[d].engagement += engagement;
  }

  const byHour = hourBuckets.map((b, h) => ({
    hourUTC: h,
    casts: b.casts,
    avgEngagement: b.casts > 0 ? b.engagement / b.casts : 0,
  }));
  const byWeekday = dayBuckets.map((b, d) => ({
    weekdayUTC: d,
    casts: b.casts,
    avgEngagement: b.casts > 0 ? b.engagement / b.casts : 0,
  }));

  return { byHour, byWeekday };
}

// text / image / link / frame breakdown
function computeContentTypes(casts) {
  const types = {
    text: { casts: 0, engagement: 0 },
    image: { casts: 0, engagement: 0 },
    link: { casts: 0, engagement: 0 },
    frame: { casts: 0, engagement: 0 },
    other: { casts: 0, engagement: 0 },
  };

  for (const cast of casts) {
    const { total: engagement } = castEngagement(cast);

    const embeds = cast.embeds || [];
    let key = "text";

    if (embeds.length === 0) {
      key = "text";
    } else if (
      embeds.some(
        (e) => e.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(e.url)
      )
    ) {
      key = "image";
    } else if (embeds.some((e) => e.cast_id)) {
      key = "frame";
    } else if (embeds.some((e) => e.url)) {
      key = "link";
    } else {
      key = "other";
    }

    types[key].casts++;
    types[key].engagement += engagement;
  }

  const result = {};
  for (const [k, v] of Object.entries(types)) {
    result[k] = {
      casts: v.casts,
      avgEngagement: v.casts > 0 ? v.engagement / v.casts : 0,
    };
  }
  return result;
}

// top performing casts (window days)
function computeTopCasts(casts, days = WINDOW_DAYS) {
  const now = Date.now();
  const windowMs = days * 24 * 60 * 60 * 1000;

  const scored = [];

  for (const cast of casts) {
    const { ms } = castTimeInfo(cast);
    if (!ms || now - ms > windowMs) continue;

    const { likesCount, recastsCount, repliesCount, total } =
      castEngagement(cast);

    scored.push({
      hash: cast.hash,
      text: cast.text || "",
      timestamp: cast.timestamp || cast.published_at || cast.created_at,
      likes: likesCount,
      recasts: recastsCount,
      replies: repliesCount,
      totalEngagement: total,
    });
  }

  scored.sort((a, b) => b.totalEngagement - a.totalEngagement);
  return scored.slice(0, 10);
}

// posting consistency: casts/day, streak estimate (inside window)
function computeConsistency(casts) {
  if (!casts.length) {
    return {
      totalDays: 0,
      avgCastsPerDay: 0,
      activeDays: 0,
      longestStreak: 0,
    };
  }

  const dayMap = new Map(); // yyyy-mm-dd -> count
  for (const cast of casts) {
    const { ts } = castTimeInfo(cast);
    if (!ts) continue;
    const key = ts.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) || 0) + 1);
  }

  const days = Array.from(dayMap.keys()).sort();
  const totalDays = days.length;
  const totalCasts = casts.length;
  const avgCastsPerDay = totalDays > 0 ? totalCasts / totalDays : 0;

  // longest streak (calendar days, no gaps)
  let longestStreak = totalDays > 0 ? 1 : 0;
  let currentStreak = totalDays > 0 ? 1 : 1;

  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const cur = new Date(days[i]);
    const diff =
      (cur.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);
    if (diff === 1) {
      currentStreak++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    totalDays,
    avgCastsPerDay,
    activeDays: totalDays,
    longestStreak,
  };
}

// simple sentiment trend (no AI)
function computeSentiment(casts) {
  const posWords = ["gm", "gn", "love", "bull", "up only", "pump", "bullish"];
  const negWords = ["rekt", "down bad", "rug", "bear", "scam", "shit"];

  let pos = 0;
  let neg = 0;
  let cryptoKeyword = 0;

  for (const cast of casts) {
    const text = (cast.text || "").toLowerCase();
    if (!text) continue;
    if (/(eth|btc|base|crypto|defi|nft)/.test(text)) cryptoKeyword++;

    for (const w of posWords) if (text.includes(w)) pos++;
    for (const w of negWords) if (text.includes(w)) neg++;
  }

  return { positive: pos, negative: neg, cryptoMentions: cryptoKeyword };
}

// reply-engagement (who YOU engage with most, filtered to window)
async function computeReplyEngagement(fid) {
  try {
    const resp = await neynarGet(
      "/v2/farcaster/feed/user/replies_and_recasts",
      { fid, limit: 50 }
    );

    const casts = resp.casts || [];
    const map = new Map(); // otherFid -> stats
    const now = Date.now();

    function ensure(otherFid, username) {
      if (!map.has(otherFid)) {
        map.set(otherFid, {
          fid: otherFid,
          username: username || "unknown",
          replies: 0,
          recasts: 0,
        });
      }
      return map.get(otherFid);
    }

    for (const cast of casts) {
      const { ms } = castTimeInfo(cast);
      if (!ms || now - ms > WINDOW_MS) continue;

      const parent = cast.parent_author || {};
      const otherFid = parent.fid;
      if (typeof otherFid !== "number") continue;

      const isReply =
        cast.parent_hash || cast.parent_url || cast.root_parent_url;
      const isRecast =
        (cast.reactions?.recasts || []).some(
          (r) => r && r.fid === fid
        );

      const target = ensure(
        otherFid,
        cast.parent_author?.username ||
          cast.parent_author?.display_name
      );

      if (isReply) target.replies++;
      if (isRecast) target.recasts++;
    }

    const rows = Array.from(map.values()).map((r) => ({
      ...r,
      totalInteractions: r.replies + r.recasts,
    }));
    rows.sort((a, b) => b.totalInteractions - a.totalInteractions);
    return rows.slice(0, 10);
  } catch (e) {
    console.warn("reply_engagement failed:", e.message);
    return [];
  }
}

// audience health (engaged vs ghost followers) from likes/recasts
function computeAudienceHealth(casts, followerCount) {
  const engagedFids = new Set();
  const firstSeen = new Map();
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  for (const cast of casts) {
    const { ms } = castTimeInfo(cast);
    if (!ms || ms < cutoff) continue;

    const likes = cast.reactions?.likes || [];
    const recasts = cast.reactions?.recasts || [];
    likes.forEach((l) => {
      if (l && typeof l.fid === "number") {
        engagedFids.add(l.fid);
        if (!firstSeen.has(l.fid)) firstSeen.set(l.fid, ms);
      }
    });
    recasts.forEach((r) => {
      if (r && typeof r.fid === "number") {
        engagedFids.add(r.fid);
        if (!firstSeen.has(r.fid)) firstSeen.set(r.fid, ms);
      }
    });
  }

  const engaged = engagedFids.size;
  const engagedPct =
    followerCount > 0 ? Math.min(100, (engaged / followerCount) * 100) : 0;
  const ghostPct = Math.max(0, 100 - engagedPct);

  // new vs returning engagers inside window
  let newEngagers = 0;
  let returningEngagers = 0;
  for (const [, firstMs] of firstSeen.entries()) {
    if (firstMs >= cutoff) newEngagers++;
    else returningEngagers++;
  }

  return {
    estimatedEngagedFollowers: engaged,
    engagedFollowersPercent: engagedPct,
    ghostFollowersPercent: ghostPct,
    newEngagers,
    returningEngagers,
  };
}

// roadmap score & growth suggestions
function computeRoadmapAndTips({
  metrics,
  timeBuckets,
  contentTypes,
  consistency,
  audienceHealth,
}) {
  const {
    avgEngagementPerCast,
    followerCount,
    totalCasts,
    auditorScore,
  } = metrics;

  const reachScore =
    followerCount > 0
      ? Math.min(10, (avgEngagementPerCast / followerCount) * 10 * 100)
      : 0;
  const consistencyScore = Math.min(10, (consistency.longestStreak / 7) * 10);
  const healthScore = Math.min(
    10,
    audienceHealth.engagedFollowersPercent / 10
  );

  const roadmapScore = Number(
    (
      reachScore * 0.4 +
      consistencyScore * 0.3 +
      healthScore * 0.2 +
      (auditorScore || 0) * 0.1
    ).toFixed(1)
  );

  const tips = [];

  const bestHour = [...(timeBuckets.byHour || [])].sort(
    (a, b) => b.avgEngagement - a.avgEngagement
  )[0];
  if (bestHour && bestHour.avgEngagement > 0) {
    tips.push(
      `Best posting window (UTC): around ${bestHour.hourUTC}:00 – this is where your average engagement is highest.`
    );
  }

  const bestDay = [...(timeBuckets.byWeekday || [])].sort(
    (a, b) => b.avgEngagement - a.avgEngagement
  )[0];
  if (bestDay && bestDay.avgEngagement > 0) {
    tips.push(
      `Your strongest weekday (UTC) is ${bestDay.weekdayUTC} – try to cluster your most important casts there.`
    );
  }

  const ct = Object.entries(contentTypes || {}).sort(
    (a, b) => b[1].avgEngagement - a[1].avgEngagement
  )[0];
  if (ct && ct[1].casts >= 3) {
    tips.push(
      `“${ct[0]}” posts have your best average engagement. Double-down on this format in your weekly content plan.`
    );
  }

  if (consistency.avgCastsPerDay < 1) {
    tips.push(
      "You don’t cast every day yet. A simple win is posting at least 1–2 quality casts per day to build momentum."
    );
  } else if (consistency.longestStreak < 7) {
    tips.push(
      `Your longest streak in the last ${WINDOW_DAYS} days is ${consistency.longestStreak} days. Try to push this above 7+ days – consistency compounds your reach.`
    );
  }

  if (audienceHealth.ghostFollowersPercent > 70) {
    tips.push(
      "A large portion of your followers look inactive. Use questions, polls, and open-ended casts to wake them up."
    );
  } else if (audienceHealth.engagedFollowersPercent > 20) {
    tips.push(
      "Your engagement-to-follower ratio is solid – keep interacting with people who already show up for you."
    );
  }

  if (totalCasts < 10) {
    tips.push(
      "This week is still light. Aim for at least 10 high-signal casts in a 7-day window before stressing too much about the numbers."
    );
  }

  if (tips.length === 0) {
    tips.push(
      "Stay consistent, experiment with formats, and keep talking to the people who already engage with you."
    );
  }

  return { roadmapScore, tips };
}

// ---------- NEW 10 FEATURES (all local) ----------

// 1) Engagement velocity
function computeEngagementVelocity(casts) {
  if (!casts.length) return { summary: null, perCast: [] };

  const perCast = [];
  for (const cast of casts) {
    const { ageHours } = castTimeInfo(cast);
    if (ageHours == null || ageHours <= 0) continue;
    const { total } = castEngagement(cast);
    const safeHours = Math.max(ageHours, 0.25); // avoid crazy for fresh posts
    const velocity = total / safeHours;
    perCast.push({
      hash: cast.hash,
      text: cast.text || "",
      ageHours,
      engagement: total,
      velocity,
    });
  }

  if (!perCast.length) return { summary: null, perCast: [] };

  perCast.sort((a, b) => b.velocity - a.velocity);
  const best = perCast[0];
  const avgVelocity =
    perCast.reduce((sum, c) => sum + c.velocity, 0) / perCast.length;

  return {
    summary: {
      avgVelocity,
      bestCast: best,
    },
    perCast,
  };
}

// 2) Keyword / topic performance
function computeKeywordPerformance(casts) {
  const stopwords = new Set(
    "the a an and or but of on in at for to with from this that is are was were will would should i you he she it they we my your our their me us them be as by about into out over under up down if then so not just very really have has had do did doing dont can't wont".split(
      " "
    )
  );

  const map = new Map();

  for (const cast of casts) {
    const text = (cast.text || "").toLowerCase();
    if (!text) continue;

    const { total } = castEngagement(cast);

    // hashtags
    const hashMatches = text.match(/#[a-z0-9_]+/gi) || [];
    hashMatches.forEach((tag) => {
      const key = tag;
      const v = map.get(key) || { word: key, uses: 0, totalEngagement: 0 };
      v.uses += 1;
      v.totalEngagement += total;
      map.set(key, v);
    });

    // normal words
    const words = text
      .replace(/[^a-z0-9#@\s]/gi, " ")
      .split(/\s+/)
      .filter(Boolean);

    for (const w of words) {
      if (w.startsWith("#")) continue;
      if (stopwords.has(w)) continue;
      if (w.length < 3) continue;
      const key = w;
      const v = map.get(key) || { word: key, uses: 0, totalEngagement: 0 };
      v.uses += 1;
      v.totalEngagement += total;
      map.set(key, v);
    }
  }

  let list = Array.from(map.values()).map((v) => ({
    word: v.word,
    uses: v.uses,
    totalEngagement: v.totalEngagement,
    avgEngagement: v.uses > 0 ? v.totalEngagement / v.uses : 0,
  }));

  // only words used at least 3 times
  list = list.filter((k) => k.uses >= 3);
  list.sort((a, b) => b.avgEngagement - a.avgEngagement);
  return list.slice(0, 20);
}

// 3) Lifecycle curve
function computeLifecycleCurve(casts) {
  const bucketsDef = [
    { id: "0_1", label: "0–1h", maxHours: 1 },
    { id: "1_3", label: "1–3h", maxHours: 3 },
    { id: "3_12", label: "3–12h", maxHours: 12 },
    { id: "12_24", label: "12–24h", maxHours: 24 },
    { id: "24_72", label: "1–3d", maxHours: 72 },
    { id: "72_168", label: "3–7d", maxHours: 168 },
  ];

  const buckets = {};
  for (const def of bucketsDef) {
    buckets[def.id] = {
      id: def.id,
      label: def.label,
      maxHours: def.maxHours,
      casts: 0,
      totalEngagement: 0,
    };
  }

  for (const cast of casts) {
    const { ageHours } = castTimeInfo(cast);
    if (ageHours == null || ageHours < 0) continue;
    const { total } = castEngagement(cast);

    let bucket = null;
    for (const def of bucketsDef) {
      if (ageHours <= def.maxHours) {
        bucket = buckets[def.id];
        break;
      }
    }
    if (!bucket) {
      bucket = buckets["72_168"]; // older ones treat as 3–7d
    }
    bucket.casts++;
    bucket.totalEngagement += total;
  }

  const result = bucketsDef.map((def) => {
    const b = buckets[def.id];
    return {
      id: b.id,
      label: b.label,
      casts: b.casts,
      avgEngagement: b.casts ? b.totalEngagement / b.casts : 0,
    };
  });

  return result;
}

// 4) Viral probability based on velocity + relative eng
function computeViralProbability(casts) {
  const { perCast, summary } = computeEngagementVelocity(casts);
  if (!perCast.length || !summary) return { perCast: [], candidates: [] };

  const avgVelocity = summary.avgVelocity || 0.0001;
  const avgEng =
    perCast.reduce((s, c) => s + c.engagement, 0) / perCast.length || 0.0001;

  const scored = perCast.map((c) => {
    const velFactor = c.velocity / avgVelocity;
    const engFactor = c.engagement / avgEng;
    const rawScore = 0.6 * velFactor + 0.4 * engFactor;
    const score = Math.min(5, rawScore); // clamp
    return { ...c, viralScore: score };
  });

  scored.sort((a, b) => b.viralScore - a.viralScore);
  const candidates = scored.filter((c) => c.viralScore >= 1.5).slice(0, 5);

  return { perCast: scored, candidates };
}

// 5) Optimal posting frequency
function computeFrequencyRecommendation(casts) {
  if (!casts.length) {
    return {
      actualPerDay: 0,
      recommendedMin: 1,
      recommendedMax: 3,
      activeDays: 0,
      message: "No casts in the last 7 days. Try at least 1–3 per day.",
    };
  }

  const dayMap = new Map();
  for (const cast of casts) {
    const { ts } = castTimeInfo(cast);
    if (!ts) continue;
    const key = ts.toISOString().slice(0, 10);
    dayMap.set(key, (dayMap.get(key) || 0) + 1);
  }

  const activeDays = dayMap.size;
  const actualPerDay = casts.length / Math.max(activeDays, 1);

  let recommendedMin = 1;
  let recommendedMax = 3;
  let msg = "";

  if (actualPerDay < 1) {
    recommendedMin = 1;
    recommendedMax = 3;
    msg =
      "You're posting less than once per day. Try 1–3 solid casts per day to warm up your audience.";
  } else if (actualPerDay < 2) {
    recommendedMin = 2;
    recommendedMax = 4;
    msg =
      "You're close to the sweet spot. 2–4 casts per day usually balances consistency with quality.";
  } else if (actualPerDay < 4) {
    recommendedMin = 3;
    recommendedMax = 6;
    msg =
      "High frequency – good if quality stays high. Consider focusing 3–6 of your strongest ideas per day.";
  } else {
    recommendedMin = 3;
    recommendedMax = 5;
    msg =
      "[You post a lot. Make sure performance doesn’t drop; consider consolidating into 3–5 standout casts per day.]";
  }

  return {
    actualPerDay,
    recommendedMin,
    recommendedMax,
    activeDays,
    message: msg,
  };
}

// 6) Hook effectiveness
function computeHookEffectiveness(casts) {
  const patterns = {
    question: { label: "Question hook", casts: 0, totalEngagement: 0 },
    emoji: { label: "Starts with emoji", casts: 0, totalEngagement: 0 },
    mention: { label: "Starts with @mention", casts: 0, totalEngagement: 0 },
    number: { label: "Starts with number/list", casts: 0, totalEngagement: 0 },
    short: { label: "Short (<60 chars)", casts: 0, totalEngagement: 0 },
    long: { label: "Long (≥60 chars)", casts: 0, totalEngagement: 0 },
  };

  const topHooks = [];

  for (const cast of casts) {
    const text = (cast.text || "").trim();
    if (!text) continue;
    const lower = text.toLowerCase();
    const { total } = castEngagement(cast);

    const hook = text.split(/\s+/).slice(0, 10).join(" ");
    topHooks.push({
      hash: cast.hash,
      hook,
      engagement: total,
    });

    const firstChar = text[0];
    const startsWithEmoji = /\p{Emoji}/u.test(firstChar);
    const startsWithMention = firstChar === "@";
    const startsWithNumber = /^[0-9]/.test(firstChar);
    const isQuestion = lower.endsWith("?") || /^(why|how|what|when|where|who)\b/.test(lower);
    const isShort = text.length < 60;

    function bump(key) {
      patterns[key].casts++;
      patterns[key].totalEngagement += total;
    }

    if (isQuestion) bump("question");
    if (startsWithEmoji) bump("emoji");
    if (startsWithMention) bump("mention");
    if (startsWithNumber) bump("number");
    bump(isShort ? "short" : "long");
  }

  const patternList = Object.values(patterns).map((p) => ({
    label: p.label,
    casts: p.casts,
    avgEngagement: p.casts ? p.totalEngagement / p.casts : 0,
  }));

  patternList.sort((a, b) => b.avgEngagement - a.avgEngagement);

  topHooks.sort((a, b) => b.engagement - a.engagement);
  const bestHooks = topHooks.slice(0, 10);

  return { patterns: patternList, bestHooks };
}

// 7) Weekly digest (string bullets from all metrics)
function computeWeeklyDigest({
  metrics,
  consistency,
  audienceHealth,
  timeBuckets,
  contentTypes,
  topCasts,
}) {
  const tips = [];

  tips.push(
    `Last ${WINDOW_DAYS} days: ${metrics.totalCasts} casts, ${metrics.totalEngagement} total engagements.`
  );

  tips.push(
    `Average ${metrics.avgEngagementPerCast.toFixed(
      1
    )} engagements per cast (${metrics.realEngagementPercent.toFixed(
      1
    )}% of follower base).`
  );

  tips.push(
    `You were active on ${consistency.activeDays} days with about ${consistency.avgCastsPerDay.toFixed(
      1
    )} casts/day. Longest streak inside window: ${consistency.longestStreak} days.`
  );

  tips.push(
    `Audience activation: ~${audienceHealth.engagedFollowersPercent.toFixed(
      1
    )}% of followers engaged at least once; ~${audienceHealth.ghostFollowersPercent.toFixed(
      1
    )}% look inactive.`
  );

  const bestHour = [...(timeBuckets.byHour || [])].sort(
    (a, b) => b.avgEngagement - a.avgEngagement
  )[0];
  if (bestHour && bestHour.avgEngagement > 0) {
    tips.push(
      `Best posting hour (UTC) this week: ~${String(
        bestHour.hourUTC
      ).padStart(2, "0")}:00.`
    );
  }

  const bestType = Object.entries(contentTypes || {}).sort(
    (a, b) => b[1].avgEngagement - a[1].avgEngagement
  )[0];
  if (bestType && bestType[1].casts >= 3) {
    tips.push(
      `Best performing format: ${bestType[0]} posts (~${bestType[1].avgEngagement.toFixed(
        1
      )} avg engagements).`
    );
  }

  if (topCasts && topCasts.length) {
    const best = topCasts[0];
    tips.push(
      `Top cast this week hit ${best.totalEngagement} engagements (likes ${best.likes}, replies ${best.replies}, recasts ${best.recasts}).`
    );
  }

  return tips;
}

// ---------- MAIN ENDPOINT ----------

app.get("/api/audit", async (req, res) => {
  const original = (req.query.username || "").toString().trim();
  if (!original) {
    return res.status(400).json({ error: "username query param required" });
  }

  // username normalize: @ কেটে ছোট হাতের করি
  let raw = original;
  if (raw.startsWith("@")) {
    raw = raw.slice(1);
  }
  raw = raw.toLowerCase();

  const isNumericFid = /^\d+$/.test(raw);


  try {
    // 1) Resolve user
    let userResp;
    if (isNumericFid) {
      const bulk = await neynarGet("/v2/farcaster/user/bulk", {
        fids: raw,
      });
      if (!bulk.users || bulk.users.length === 0) {
        return res
          .status(404)
          .json({ error: `User with fid ${raw} not found` });
      }
      userResp = { user: bulk.users[0] };
    } else {
      userResp = await neynarGet("/v2/farcaster/user/by_username", {
        username: raw,
      });
      if (!userResp.user) {
        return res
          .status(404)
          .json({ error: `User with username ${raw} not found` });
      }
    }

    const u = userResp.user;
    const neynarScore =
      u.experimental && typeof u.experimental.neynar_user_score === "number"
        ? u.experimental.neynar_user_score
        : null;

    const fid = u.fid;
    const followerCount = u.follower_count || 0;
    const followingCount = u.following_count || 0;

    // 2) Fetch last ~100 casts then filter to 7 days
    const castsResp = await neynarGet("/v2/farcaster/feed/user/casts", {
  fid,
  limit: 50, // <= FIXED
});

    const allCasts = castsResp.casts || [];
    const casts = filterRecentCasts(allCasts, WINDOW_DAYS); // << only last 7 days

    // base metrics (only in window)
    let totalLikes = 0;
    let totalRecasts = 0;
    let totalReplies = 0;

    const engagers = new Map();

    function ensureEngager(eFid, fname) {
      if (!engagers.has(eFid)) {
        engagers.set(eFid, {
          fid: eFid,
          username: fname || "anon",
          likes: 0,
          recasts: 0,
          replies: 0,
        });
      }
      return engagers.get(eFid);
    }

    for (const cast of casts) {
      const reactions = cast.reactions || {};
      const replies = cast.replies || {};

      const likesArr = reactions.likes || [];
      const recastsArr = reactions.recasts || [];

      const likesCount =
        typeof reactions.likes_count === "number"
          ? reactions.likes_count
          : likesArr.length;
      const recastsCount =
        typeof reactions.recasts_count === "number"
          ? reactions.recasts_count
          : recastsArr.length;
      const repliesCount =
        typeof replies.count === "number" ? replies.count : 0;

      totalLikes += likesCount;
      totalRecasts += recastsCount;
      totalReplies += repliesCount;

      for (const like of likesArr) {
        if (!like || typeof like.fid !== "number") continue;
        const e = ensureEngager(like.fid, like.fname);
        e.likes += 1;
      }
      for (const rc of recastsArr) {
        if (!rc || typeof rc.fid !== "number") continue;
        const e = ensureEngager(rc.fid, rc.fname);
        e.recasts += 1;
      }
    }

    const totalCasts = casts.length;
    const totalEngagement = totalLikes + totalRecasts + totalReplies;
    const avgEngagementPerCast =
      totalCasts > 0 ? totalEngagement / totalCasts : 0;

    const auditorScoreRaw = Math.log10(totalEngagement + 1) * 3.3;
    const auditorScore = Math.min(10, Number(auditorScoreRaw.toFixed(1)));

    const realEngagementPercent =
      followerCount > 0
        ? Math.min(100, (avgEngagementPerCast / followerCount) * 100 * 10)
        : 0;

    const topEngagers = Array.from(engagers.values())
      .map((e) => ({
        ...e,
        totalImpact: e.likes + e.recasts + e.replies,
      }))
      .sort((a, b) => b.totalImpact - a.totalImpact)
      .slice(0, 100);

    // ---------- ANALYTICS ----------
    const timeBuckets = computeTimeBuckets(casts);
    const contentTypes = computeContentTypes(casts);
    const topCasts = computeTopCasts(casts, WINDOW_DAYS);
    const consistency = computeConsistency(casts);
    const sentimentTrend = computeSentiment(casts);
    const audienceHealth = computeAudienceHealth(casts, followerCount);
    const replyEngagement = await computeReplyEngagement(fid);
    const roadmap = computeRoadmapAndTips({
      metrics: {
        followerCount,
        avgEngagementPerCast,
        totalCasts,
        totalEngagement,
        auditorScore,
      },
      timeBuckets,
      contentTypes,
      consistency,
      audienceHealth,
    });

    // new 10 features
    const velocity = computeEngagementVelocity(casts);
    const keywordPerformance = computeKeywordPerformance(casts);
    const lifecycleCurve = computeLifecycleCurve(casts);
    const viral = computeViralProbability(casts);
    const frequencyRecommendation = computeFrequencyRecommendation(casts);
    const hookEffectiveness = computeHookEffectiveness(casts);
    const weeklyDigest = computeWeeklyDigest({
      metrics: {
        followerCount,
        followingCount,
        totalCasts,
        totalLikes,
        totalRecasts,
        totalReplies,
        totalEngagement,
        avgEngagementPerCast,
        auditorScore,
        realEngagementPercent,
      },
      consistency,
      audienceHealth,
      timeBuckets,
      contentTypes,
      topCasts,
    });

    // final response
    res.json({
      window: {
        days: WINDOW_DAYS,
        castsConsidered: totalCasts,
      },
      user: {
        fid: u.fid,
        username: u.username,
        display_name: u.display_name,
        followerCount,
        followingCount,
        experimental: u.experimental,
        neynarScore,
      },
      metrics: {
        followerCount,
        followingCount,
        totalCasts,
        totalLikes,
        totalRecasts,
        totalReplies,
        totalEngagement,
        avgEngagementPerCast,
        auditorScore,
        realEngagementPercent,
        neynarScore,
      },
      topEngagers,
      timeBuckets,
      contentTypes,
      topCasts,
      audienceHealth,
      consistency,
      sentimentTrend,
      replyEngagement,
      roadmapScore: roadmap.roadmapScore,
      growthTips: roadmap.tips,

      // new sections
      velocity,
      keywordPerformance,
      lifecycleCurve,
      viral,
      frequencyRecommendation,
      hookEffectiveness,
      weeklyDigest,
    });
  } catch (err) {
    console.error("Error in /api/audit", err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
});

// fallback => index.html
app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Farcaster Auditor running at http://localhost:${PORT}`);
});
