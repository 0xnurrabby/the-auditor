// script.js

document.addEventListener("DOMContentLoaded", () => {
  // --- Intro animation ---
  const introText =
    "Initializing Farcaster Protocol... Tracking Influence... Ready.";
  const typewriterElement = document.getElementById("typewriter");
  let i = 0;

  function typeWriter() {
    if (!typewriterElement) return;
    if (i < introText.length) {
      typewriterElement.innerHTML += introText.charAt(i);
      i++;
      setTimeout(typeWriter, 30);
    }
  }
  typeWriter();

  // --- Core DOM refs ---
  const usernameInput = document.getElementById("usernameInput");
  const analyzeButton = document.getElementById("analyzeButton");
  const loadingScreen = document.getElementById("loadingScreen");
  const dashboard = document.getElementById("dashboard");

  const dispUsername = document.getElementById("disp_username");
  const dispFollowers = document.getElementById("disp_followers");
  const dispFollowing = document.getElementById("disp_following");
  const dispScore = document.getElementById("disp_score");
  const dispEng = document.getElementById("disp_eng");
  const dispNeynarScore = document.getElementById("disp_neynar_score");

  // analytics DOM
  const bestTimeHour = document.getElementById("best_time_hour");
  const bestTimeWeekday = document.getElementById("best_time_weekday");
  const bestTimeNote = document.getElementById("best_time_note");

  const audienceEngaged = document.getElementById("audience_engaged");
  const audienceGhost = document.getElementById("audience_ghost");
  const audienceNote = document.getElementById("audience_note");

  const consPerWeek = document.getElementById("consistency_per_week");
  const consStreak = document.getElementById("consistency_streak");
  const consistencyNote = document.getElementById("consistency_note");

  const roadmapScoreValue = document.getElementById("roadmap_score_value");
  const roadmapScoreNote = document.getElementById("roadmap_score_note");

  const contentTypeBody = document.getElementById("content_type_body");
  const contentTypeNote = document.getElementById("content_type_note");

  const sentimentPos = document.getElementById("sentiment_pos");
  const sentimentNeg = document.getElementById("sentiment_neg");
  const sentimentCrypto = document.getElementById("sentiment_crypto");
  const sentimentNote = document.getElementById("sentiment_note");

  const topCastsBody = document.getElementById("top_casts_body");
  const topCastsNote = document.getElementById("top_casts_note");

  const replyEngBody = document.getElementById("reply_engagement_body");
  const replyNote = document.getElementById("reply_note");

  const growthTipsList = document.getElementById("growth_tips_list");

  // NEW UI refs (10 features)
  const windowSummaryEl = document.getElementById("window_summary");

  const velocityAvgEl = document.getElementById("velocity_avg");
  const velocityBestHookEl = document.getElementById("velocity_best_hook");
  const velocityBestScoreEl = document.getElementById("velocity_best_score");

  const keywordBody = document.getElementById("keyword_body");
  const keywordNote = document.getElementById("keyword_note");

  const lifecycleBody = document.getElementById("lifecycle_body");

  const viralBody = document.getElementById("viral_body");
  const viralNote = document.getElementById("viral_note");

  const freqActualEl = document.getElementById("freq_actual");
  const freqRecoEl = document.getElementById("freq_reco");
  const freqMsgEl = document.getElementById("freq_msg");

  const hookPatternsBody = document.getElementById("hook_patterns_body");
  const hookBestBody = document.getElementById("hook_best_body");

  const weeklyDigestList = document.getElementById("weekly_digest_list");

  // helpers
  function setLoading(isLoading) {
    if (!loadingScreen || !dashboard) return;
    if (isLoading) {
      loadingScreen.classList.remove("hidden");
      dashboard.classList.add("hidden");
    } else {
      loadingScreen.classList.add("hidden");
      dashboard.classList.remove("hidden");
    }
  }

  function resetDashboard() {
    if (dispUsername) dispUsername.textContent = "--";
    if (dispFollowers) dispFollowers.textContent = "0";
    if (dispFollowing) dispFollowing.textContent = "0";
    if (dispScore) dispScore.textContent = "0.0";
    if (dispEng) dispEng.textContent = "0%";
    if (dispNeynarScore) dispNeynarScore.textContent = "--";

    if (bestTimeHour) bestTimeHour.textContent = "--";
    if (bestTimeWeekday) bestTimeWeekday.textContent = "--";
    if (bestTimeNote)
      bestTimeNote.textContent =
        "[based on engagement from last 7 days of posts]";

    if (audienceEngaged) audienceEngaged.textContent = "--";
    if (audienceGhost) audienceGhost.textContent = "--";
    if (audienceNote)
      audienceNote.textContent =
        "[Rough split of active vs silent followers (7-day window)]";

    if (consPerWeek) consPerWeek.textContent = "--";
    if (consStreak) consStreak.textContent = "--";
    if (consistencyNote)
      consistencyNote.textContent =
        "[More consistent posting → better growth]";

    if (roadmapScoreValue) roadmapScoreValue.textContent = "--";
    if (roadmapScoreNote)
      roadmapScoreNote.textContent = "[Consolidated growth metric]";

    if (contentTypeBody) contentTypeBody.innerHTML = "";
    if (contentTypeNote)
      contentTypeNote.textContent =
        "[Which format performs best for you (7 days)]";

    if (sentimentPos) sentimentPos.textContent = "--";
    if (sentimentNeg) sentimentNeg.textContent = "--";
    if (sentimentCrypto) sentimentCrypto.textContent = "--";
    if (sentimentNote)
      sentimentNote.textContent =
        "[Simple keyword-based mood tracker (7 days)]";

    if (topCastsBody) topCastsBody.innerHTML = "";
    if (topCastsNote)
      topCastsNote.textContent =
        "[Which casts actually hit your audience]";

    if (replyEngBody) replyEngBody.innerHTML = "";
    if (replyNote)
      replyNote.textContent =
        "[Who shows up most in your conversations]";

    if (growthTipsList) growthTipsList.innerHTML = "";

    if (windowSummaryEl) windowSummaryEl.textContent = "Last 7 days.";

    // new sections
    if (velocityAvgEl) velocityAvgEl.textContent = "--";
    if (velocityBestHookEl) velocityBestHookEl.textContent = "--";
    if (velocityBestScoreEl) velocityBestScoreEl.textContent = "--";

    if (keywordBody) keywordBody.innerHTML = "";
    if (keywordNote)
      keywordNote.textContent =
        "[Needs repeated topics/hashtags in this 7-day window]";

    if (lifecycleBody) lifecycleBody.innerHTML = "";

    if (viralBody) viralBody.innerHTML = "";
    if (viralNote)
      viralNote.textContent =
        "[Viral candidates: fast engagement vs your normal baseline]";

    if (freqActualEl) freqActualEl.textContent = "--";
    if (freqRecoEl) freqRecoEl.textContent = "--";
    if (freqMsgEl) freqMsgEl.textContent = "";

    if (hookPatternsBody) hookPatternsBody.innerHTML = "";
    if (hookBestBody) hookBestBody.innerHTML = "";

    if (weeklyDigestList) weeklyDigestList.innerHTML = "";
  }

  function showError(message) {
    setLoading(false);
    alert(message);
  }

  function shortHandle(username) {
    if (!username) return "";
    const parts = username.split(".");
    return parts[0] || username;
  }

  // --- network ---
  async function handleAnalyze() {
    if (!usernameInput) return;

    // ইনপুট থেকে space কেটে, @ থাকলে সরিয়ে, সব lowercase করি
    let raw = usernameInput.value.trim();
    if (!raw) return;

    if (raw.startsWith("@")) {
      raw = raw.slice(1);
    }
    raw = raw.toLowerCase();

    resetDashboard();
    setLoading(true);

    try {
      const res = await fetch(
        `/api/audit?username=${encodeURIComponent(raw)}`
      );

      let data = null;
      try {
        data = await res.json();
      } catch {
        // ignore parse error
      }

      if (!res.ok) {
        const msg =
          (data && (data.error || data.details)) ||
          `Backend error (${res.status}). Check server console.`;
        throw new Error(msg);
      }

      updateDashboard(data || {});
    } catch (err) {
      console.error(err);
      showError(err.message || "Unexpected error while talking to backend.");
    }
  }

  // --- UI updater ---
  function updateDashboard(payload) {
    const user = payload.user || {};
    const metrics = payload.metrics || {};

    // window summary
    if (windowSummaryEl && payload.window) {
      const d = payload.window.days || 7;
      const c = payload.window.castsConsidered || 0;
      windowSummaryEl.textContent = `Last ${d} days · ${c} casts analyzed`;
    }

    // basic stats
    if (dispUsername) {
      const handle = shortHandle(user.username);
      const fidLabel =
        typeof user.fid !== "undefined" ? ` [fid_${user.fid}]` : "";
      dispUsername.textContent = `${handle}${fidLabel}`;
    }
    if (dispFollowers) {
      dispFollowers.textContent = (metrics.followerCount || 0).toLocaleString();
    }
    if (dispFollowing) {
      dispFollowing.textContent = (metrics.followingCount || 0).toLocaleString();
    }
    if (dispScore) {
      const score =
        typeof metrics.auditorScore === "number"
          ? metrics.auditorScore.toFixed(1)
          : "0.0";
      dispScore.textContent = score;
    }
    if (dispEng) {
      const pct =
        typeof metrics.realEngagementPercent === "number"
          ? metrics.realEngagementPercent
          : 0;
      dispEng.textContent = `${pct.toFixed(1)}%`;
    }

    // Neynar user score
    if (dispNeynarScore) {
      let ns =
        typeof user.neynarScore === "number"
          ? user.neynarScore
          : typeof metrics.neynarScore === "number"
          ? metrics.neynarScore
          : user.experimental &&
            typeof user.experimental.neynar_user_score === "number"
          ? user.experimental.neynar_user_score
          : null;

      dispNeynarScore.textContent =
        ns !== null ? ns.toFixed(2) : "--";
    }

    // ======== Existing analytics ========

    // Best time to post
    const byHour = Array.isArray(payload.timeBuckets?.byHour)
      ? payload.timeBuckets.byHour
      : [];
    const byWeekday = Array.isArray(payload.timeBuckets?.byWeekday)
      ? payload.timeBuckets.byWeekday
      : [];

    if (byHour.length && bestTimeHour) {
      const topHour = [...byHour].sort(
        (a, b) => (b.avgEngagement || 0) - (a.avgEngagement || 0)
      )[0];
      if (topHour && Number.isFinite(topHour.hourUTC)) {
        bestTimeHour.textContent = `${String(topHour.hourUTC).padStart(
          2,
          "0"
        )}:00`;
      } else {
        bestTimeHour.textContent = "--";
      }
    } else if (bestTimeHour && bestTimeNote) {
      bestTimeHour.textContent = "--";
      bestTimeNote.textContent =
        "// not enough recent casts to estimate posting hour";
    }

    if (byWeekday.length && bestTimeWeekday) {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const topDay = [...byWeekday].sort(
        (a, b) => (b.avgEngagement || 0) - (a.avgEngagement || 0)
      )[0];

      const label =
        typeof topDay.weekdayUTC === "number"
          ? days[topDay.weekdayUTC]
          : topDay.label || topDay.weekday;

      bestTimeWeekday.textContent = label || "--";
    } else if (bestTimeWeekday && bestTimeNote) {
      bestTimeWeekday.textContent = "--";
    }

    // Audience health
    const ah = payload.audienceHealth || {};
    const engaged =
      typeof ah.engagedFollowersPercent === "number"
        ? ah.engagedFollowersPercent
        : null;
    const ghost =
      typeof ah.ghostFollowersPercent === "number"
        ? ah.ghostFollowersPercent
        : null;

    if (audienceEngaged) {
      audienceEngaged.textContent =
        engaged !== null ? `${engaged.toFixed(1)}%` : "--";
    }
    if (audienceGhost) {
      audienceGhost.textContent =
        ghost !== null ? `${ghost.toFixed(1)}%` : "--";
    }
    if (audienceNote && engaged === null && ghost === null) {
      audienceNote.textContent =
        "// audience breakdown not available for this profile yet";
    }

    // Consistency
    const c = payload.consistency || {};
    const castsPerWeek =
      typeof c.avgCastsPerDay === "number"
        ? c.avgCastsPerDay * 7
        : null;

    if (consPerWeek) {
      consPerWeek.textContent =
        castsPerWeek !== null ? castsPerWeek.toFixed(1) : "--";
    }
    if (consStreak) {
      consStreak.textContent =
        typeof c.longestStreak === "number"
          ? `${c.longestStreak} days`
          : "--";
    }
    if (consistencyNote && castsPerWeek === null) {
      consistencyNote.textContent =
        "// not enough history to measure posting pattern";
    }

    // Roadmap score
    const rs = payload.roadmapScore;
    if (roadmapScoreValue) {
      if (typeof rs === "number") {
        roadmapScoreValue.textContent = rs.toFixed(1);
      } else if (rs && typeof rs.value === "number") {
        roadmapScoreValue.textContent = rs.value.toFixed(1);
      } else {
        roadmapScoreValue.textContent = "--";
      }
    }

    // Content types
    if (contentTypeBody) {
      contentTypeBody.innerHTML = "";
      const ct = payload.contentTypes || {};
      const map = [
        ["Text-only", ct.text],
        ["Image", ct.image],
        ["Link", ct.link],
        ["Frame", ct.frame],
      ];
      let anyRow = false;
      map.forEach(([label, obj]) => {
        if (!obj) return;
        const tr = document.createElement("tr");
        const engVal =
          typeof obj.avgEngagement === "number"
            ? obj.avgEngagement.toFixed(1)
            : "--";
        const count =
          typeof obj.casts === "number" ? obj.casts.toString() : "--";
        tr.innerHTML = `
          <td>${label}</td>
          <td>${engVal}</td>
          <td>${count}</td>
        `;
        contentTypeBody.appendChild(tr);
        anyRow = true;
      });
      if (!anyRow) {
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td colspan=\"3\">// no content breakdown available</td>";
        contentTypeBody.appendChild(tr);
      }
    }

    // Sentiment
    const st = payload.sentimentTrend || {};
    if (sentimentPos) {
      sentimentPos.textContent =
        typeof st.positive === "number" ? st.positive : "--";
    }
    if (sentimentNeg) {
      sentimentNeg.textContent =
        typeof st.negative === "number" ? st.negative : "--";
    }
    if (sentimentCrypto) {
      sentimentCrypto.textContent =
        typeof st.cryptoMentions === "number" ? st.cryptoMentions : "--";
    }
    if (sentimentNote && !st.positive && !st.negative) {
      sentimentNote.textContent =
        "[Sentiment analysis not available (text-only casts required)]";
    }

    // Top casts
    if (topCastsBody) {
      topCastsBody.innerHTML = "";
      const arr = Array.isArray(payload.topCasts) ? payload.topCasts : [];
      if (!arr.length) {
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td colspan=\"6\">// no standout casts in this 7-day window</td>";
        topCastsBody.appendChild(tr);
      } else {
        arr.slice(0, 20).forEach((cast, idx) => {
          const snippet = (cast.text || "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 80);
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>#${idx + 1}</td>
            <td>${snippet || "(no text)"}</td>
            <td>${cast.likes ?? 0}</td>
            <td>${cast.replies ?? 0}</td>
            <td>${cast.recasts ?? 0}</td>
            <td>${cast.totalEngagement ?? 0}</td>
          `;
          topCastsBody.appendChild(tr);
        });
      }
    }

    // Reply engagement
    if (replyEngBody) {
      replyEngBody.innerHTML = "";
      const arr = Array.isArray(payload.replyEngagement)
        ? payload.replyEngagement
        : [];
      if (!arr.length) {
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td colspan=\"4\">// no reply-engagement data in this window</td>";
        replyEngBody.appendChild(tr);
      } else {
        arr.slice(0, 15).forEach((u) => {
          const name = u.username || `fid_${u.fid ?? "??"}`;
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${name}</td>
            <td>${u.replies ?? 0}</td>
            <td>${u.recasts ?? 0}</td>
            <td>${u.quotes ?? 0}</td>
          `;
          replyEngBody.appendChild(tr);
        });
      }
    }

    // Growth tips (roadmap)
    if (growthTipsList) {
      growthTipsList.innerHTML = "";
      const tips = Array.isArray(payload.growthTips)
        ? payload.growthTips
        : [];
      if (!tips.length) {
        const li = document.createElement("li");
        li.textContent =
          "// no specific tips generated from current data";
        growthTipsList.appendChild(li);
      } else {
        tips.forEach((t) => {
          const li = document.createElement("li");
          li.textContent = t;
          growthTipsList.appendChild(li);
        });
      }
    }

    // ======== NEW 10 FEATURES ========

    // 1) Engagement velocity
    const vel = payload.velocity || {};
    if (velocityAvgEl) {
      const avg =
        vel.summary && typeof vel.summary.avgVelocity === "number"
          ? vel.summary.avgVelocity.toFixed(2)
          : "--";
      velocityAvgEl.textContent = avg;
    }
    if (vel.summary && vel.summary.bestCast) {
      const best = vel.summary.bestCast;
      const snippet = (best.text || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      if (velocityBestHookEl) velocityBestHookEl.textContent = snippet || "(no text)";
      if (velocityBestScoreEl)
        velocityBestScoreEl.textContent = best.velocity.toFixed(2);
    } else {
      if (velocityBestHookEl) velocityBestHookEl.textContent = "--";
      if (velocityBestScoreEl) velocityBestScoreEl.textContent = "--";
    }

    // 2) Keyword / topic performance
    if (keywordBody) {
      keywordBody.innerHTML = "";
      const list = Array.isArray(payload.keywordPerformance)
        ? payload.keywordPerformance
        : [];
      if (!list.length) {
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td colspan=\"4\">// need repeated topics (3+ uses) to show stats</td>";
        keywordBody.appendChild(tr);
      } else {
        list.forEach((k) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${k.word}</td>
            <td>${k.uses}</td>
            <td>${k.avgEngagement.toFixed(1)}</td>
            <td>${k.totalEngagement}</td>
          `;
          keywordBody.appendChild(tr);
        });
      }
    }

    // 3) Lifecycle curve
    if (lifecycleBody) {
      lifecycleBody.innerHTML = "";
      const arr = Array.isArray(payload.lifecycleCurve)
        ? payload.lifecycleCurve
        : [];
      if (!arr.length) {
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td colspan=\"3\">// not enough data to shape a lifecycle curve</td>";
        lifecycleBody.appendChild(tr);
      } else {
        arr.forEach((b) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${b.label}</td>
            <td>${b.casts}</td>
            <td>${b.avgEngagement.toFixed(1)}</td>
          `;
          lifecycleBody.appendChild(tr);
        });
      }
    }

    // 4) Viral probability
    if (viralBody) {
      viralBody.innerHTML = "";
      const candidates = (payload.viral && payload.viral.candidates) || [];
      if (!candidates.length) {
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td colspan=\"4\">// no obvious viral candidates yet</td>";
        viralBody.appendChild(tr);
      } else {
        candidates.forEach((c) => {
          const snippet = (c.text || "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 80);
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${snippet || "(no text)"}</td>
            <td>${c.engagement}</td>
            <td>${c.velocity.toFixed(2)}</td>
            <td>${c.viralScore.toFixed(2)}</td>
          `;
          viralBody.appendChild(tr);
        });
      }
    }

    // 5) Frequency recommendation
    const freq = payload.frequencyRecommendation || {};
    if (freqActualEl) {
      const actual =
        typeof freq.actualPerDay === "number"
          ? freq.actualPerDay.toFixed(2)
          : "--";
      const days =
        typeof freq.activeDays === "number" ? freq.activeDays : 0;
      freqActualEl.textContent = `${actual} casts/day (${days} active days)`;
    }
    if (freqRecoEl) {
      if (
        typeof freq.recommendedMin === "number" &&
        typeof freq.recommendedMax === "number"
      ) {
        freqRecoEl.textContent = `${freq.recommendedMin}–${freq.recommendedMax} casts/day`;
      } else {
        freqRecoEl.textContent = "--";
      }
    }
    if (freqMsgEl) {
      freqMsgEl.textContent = freq.message || "";
    }

    // 6) Hook effectiveness
    const hooks = payload.hookEffectiveness || {};
    if (hookPatternsBody) {
      hookPatternsBody.innerHTML = "";
      const patterns = Array.isArray(hooks.patterns)
        ? hooks.patterns
        : [];
      if (!patterns.length) {
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td colspan=\"3\">// need more casts to analyze hooks</td>";
        hookPatternsBody.appendChild(tr);
      } else {
        patterns.forEach((p) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${p.label}</td>
            <td>${p.casts}</td>
            <td>${p.avgEngagement.toFixed(1)}</td>
          `;
          hookPatternsBody.appendChild(tr);
        });
      }
    }

    if (hookBestBody) {
      hookBestBody.innerHTML = "";
      const bestHooks = Array.isArray(hooks.bestHooks)
        ? hooks.bestHooks
        : [];
      if (!bestHooks.length) {
        const tr = document.createElement("tr");
        tr.innerHTML =
          "<td colspan=\"2\">// no standout hooks yet</td>";
        hookBestBody.appendChild(tr);
      } else {
        bestHooks.forEach((h) => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${h.hook}</td>
            <td>${h.engagement}</td>
          `;
          hookBestBody.appendChild(tr);
        });
      }
    }

    // 7) Weekly digest
    if (weeklyDigestList) {
      weeklyDigestList.innerHTML = "";
      const items = Array.isArray(payload.weeklyDigest)
        ? payload.weeklyDigest
        : [];
      if (!items.length) {
        const li = document.createElement("li");
        li.textContent = "// no digest generated";
        weeklyDigestList.appendChild(li);
      } else {
        items.forEach((line) => {
          const li = document.createElement("li");
          li.textContent = line;
          weeklyDigestList.appendChild(li);
        });
      }
    }

    setLoading(false);
  }

  // events
  if (analyzeButton) {
    analyzeButton.addEventListener("click", (e) => {
      e.preventDefault();
      handleAnalyze();
    });
  }
  if (usernameInput) {
    usernameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAnalyze();
      }
    });
  }
});
