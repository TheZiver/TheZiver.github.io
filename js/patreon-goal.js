// Patreon live goal bar – fetches one-liner from Gist raw URL.
// Expected formats:
//   "My goal is to get $100 / month, currently I'm at $52, I'm 52% there :D"
//   "My goal is to get $100 / month, currently I'm at $100, I HAVE REACHED MY GOAL YAY! :D"
(function () {
  var GIST_RAW_URL = "https://gist.githubusercontent.com/TheZiver/58c8aec7bf60605487648f507597f882/raw/patreon-goal.txt";

  function parseGoalText(text) {
    var clean = (text || "").trim().replace(/\s+/g, " ");
    // Find all $ amounts: first = goal, second = current
    var money = clean.match(/\$([\d,]+(?:\.\d+)?)/g) || [];
    var toNum = function (s) { return parseFloat(String(s).replace(/[$,]/g, "")); };
    var goal = money.length > 0 ? toNum(money[0]) : 100;
    var current = money.length > 1 ? toNum(money[1]) : 0;

    var pctMatch = clean.match(/(\d+)\s*%/);
    var pct;
    if (/REACHED MY GOAL/i.test(clean)) {
      pct = 100;
    } else if (pctMatch) {
      pct = parseInt(pctMatch[1], 10);
    } else if (goal > 0) {
      pct = Math.floor((current / goal) * 100);
    } else {
      pct = 0;
    }
    pct = Math.max(0, Math.min(100, pct));
    var reached = /REACHED MY GOAL/i.test(clean) || (goal > 0 && current >= goal);
    if (reached) pct = 100;
    return { goal: goal, current: current, pct: pct, reached: reached, raw: clean };
  }

  function fmt(n) {
    // Drop decimals when whole (e.g. 52 not 52.00)
    return (Math.round(n * 100) / 100).toString();
  }

  async function load() {
    var fillEl = document.getElementById("patreon-goal-fill");
    var barTextEl = document.getElementById("patreon-goal-bar-text");
    var descEl = document.getElementById("patreon-goal-desc");
    var wrapEl = document.getElementById("patreon-goal");
    if (!fillEl) return;

    try {
      var res = await fetch(GIST_RAW_URL + "?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var text = (await res.text()).trim();
      if (!text) throw new Error("empty");
      var p = parseGoalText(text);

      fillEl.style.width = p.pct + "%";
      fillEl.setAttribute("aria-valuenow", String(p.pct));

      if (barTextEl) barTextEl.textContent = "currently I'm at $" + fmt(p.current);
      if (descEl) descEl.textContent = "My goal is to get $" + fmt(p.goal) + " / month";

      if (p.reached && wrapEl) wrapEl.classList.add("goal-reached");
    } catch (e) {
      if (barTextEl) barTextEl.textContent = "goal unavailable";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
