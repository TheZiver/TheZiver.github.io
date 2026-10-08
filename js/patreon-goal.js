// Patreon fish jar – live goal from a Gist one-liner.
// Expected formats:
//   "My goal is to get $100 / month, currently I'm at $52, I'm 52% there :D"
//   "My goal is to get $100 / month, currently I'm at $100, I HAVE REACHED MY GOAL YAY! :D"
//
// Simple jar: canvas water fills to the goal %, and 1 fish per $1 pours in
// from the faucet. Fish bounce off the glass and each other, float on the
// water, and mill around forever. Everything is laid out in pixels at load,
// so crossing the mobile size breakpoint rebuilds the whole pour cleanly.
(function () {
  var GIST_RAW_URL = "https://gist.githubusercontent.com/TheZiver/58c8aec7bf60605487648f507597f882/raw/patreon-goal.txt";
  var FISH_VISUAL_CAP = 150;
  var jarGen = 0; // bumped per rebuild; stale animation loops exit on mismatch

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

  // Big fish, simple size tiers (heap height grows with fish area, the
  // flat water collider keeps every heap hugging the surface regardless).
  function fishSizeForCount(count) {
    if (count <= 12) return 52;
    if (count <= 30) return 42;
    if (count <= 60) return 30;
    if (count <= 100) return 26;
    return 22;
  }

  function makeSwimFishAt(x, y, size) {
    var s = document.createElement("span");
    s.textContent = "\uD83D\uDC1F"; // only one fish type
    s.style.left = x.toFixed(1) + "px";
    s.style.top = y.toFixed(1) + "px";
    s.style.fontSize = size + "px";
    if (Math.random() < 0.5) s.style.scale = "-1 1"; // face left/right
    s.style.animationDuration = (2.2 + Math.random() * 2.2).toFixed(2) + "s";
    s.style.animationDelay = (-Math.random() * 3).toFixed(2) + "s";
    return s;
  }

  // Fluid-meter-style water on a canvas: two drifting sine-wave layers over
  // a depth gradient, filled to displayH px from the bottom. The level rises
  // in sync with the fish touching down: more fish = higher water.
  function startWater(canvas, sizer, displayH, gold, reduceMotion, progress, level, gen) {
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var W = 0, H = 0, dpr = 1, gradCache = null, gradLvl = -9999;
    function fit() {
      W = sizer.clientWidth || 194;
      H = sizer.clientHeight || 257;
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      gradCache = null; // rebuilt lazily on next draw
    }
    fit();
    if (!canvas._fitWatched) { canvas._fitWatched = true; window.addEventListener("resize", fit); }

    // Water starts empty and rises toward the goal level as fish land
    var lvl = reduceMotion ? displayH : 0;

    var front = gold ? "#ffd94d" : "#29abe0";
    var frontDeep = gold ? "#9a7400" : "#0d5478";
    var frontTop = gold ? "#ffec8b" : "#6fcefa";
    var back = gold ? "rgba(255, 240, 170, 0.5)" : "rgba(140, 215, 250, 0.5)";
    var R = 18; // bottom corner radius matches the jar

    function waveY(x, t, amp, k, phase) {
      return (H - lvl) + amp * Math.sin((x / W) * Math.PI * 2 * k + t + phase);
    }

    function draw(now) {
      var tt = now / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // back wave (lighter, drifts its own way)
      ctx.beginPath();
      ctx.moveTo(0, waveY(0, tt * 0.9, 6, 2, 1.7));
      for (var x = 0; x <= W; x += 4) ctx.lineTo(x, waveY(x, tt * 0.9, 6, 2, 1.7));
      ctx.lineTo(W, H - R);
      ctx.quadraticCurveTo(W, H, W - R, H);
      ctx.lineTo(R, H);
      ctx.quadraticCurveTo(0, H, 0, H - R);
      ctx.closePath();
      ctx.fillStyle = back;
      ctx.fill();
      // front water with depth gradient (cached; rebuilt only as it rises)
      if (!gradCache || Math.abs(lvl - gradLvl) > 8) {
        gradCache = ctx.createLinearGradient(0, H - lvl - 8, 0, H);
        gradCache.addColorStop(0, frontTop);
        gradCache.addColorStop(0.35, front);
        gradCache.addColorStop(1, frontDeep);
        gradLvl = lvl;
      }
      ctx.beginPath();
      ctx.moveTo(0, waveY(0, tt * 1.3, 4.5, 2, 0));
      for (var x2 = 0; x2 <= W; x2 += 4) ctx.lineTo(x2, waveY(x2, tt * 1.3, 4.5, 2, 0));
      ctx.lineTo(W, H - R);
      ctx.quadraticCurveTo(W, H, W - R, H);
      ctx.lineTo(R, H);
      ctx.quadraticCurveTo(0, H, 0, H - R);
      ctx.closePath();
      ctx.fillStyle = gradCache;
      ctx.fill();
    }

    if (reduceMotion) { level.h = displayH; draw(0); return; } // one static frame, no loop
    var last = performance.now();
    var waterTick = 0;
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // In sync with the falling fish: water level follows touchdown count
      var target = displayH * (progress.total > 0 ? progress.landed / progress.total : 0);
      lvl += (target - lvl) * Math.min(1, dt * 4);
      if (Math.abs(target - lvl) < 0.5) lvl = target;
      level.h = lvl;
      if ((waterTick++ % 2) === 0) draw(now); // 30fps is plenty for slow waves
      if (gen === jarGen) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function dropFishWithPhysics(fallLayer, fishesEl, bodyEl, fillEl, count, pct, reached, gen) {
    fishesEl.innerHTML = "";
    fallLayer.innerHTML = "";
    if (count <= 0) {
      startWater(fillEl, fishesEl, 0, reached, window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches, { landed: 0, total: 0 }, { h: 0 }, gen);
      return;
    }

    var visualCount = Math.min(count, FISH_VISUAL_CAP);

    var bodyW = bodyEl ? bodyEl.clientWidth : 200;
    var bodyH = bodyEl ? bodyEl.clientHeight : 260;
    var fallW = fallLayer.clientWidth || (bodyW + 120);
    var fallH = fallLayer.clientHeight || (220 + bodyH);

    // Smaller jars get proportionally smaller fish so the school fits
    var size = Math.max(8, Math.round(fishSizeForCount(visualCount) * (bodyW >= 220 ? 1 : 0.78)));

    // Water height stays truthful, except a minimum so bigger fish always
    // have room to swim instead of poking out. Labels / aria keep the true
    // pct. The water itself is painted by startWater (waves) on
    // the canvas passed as fillEl.
    var trueH = bodyH * (pct / 100);
    var displayH = Math.max(trueH, 24 + size);

    // Jar collider in fall-layer coordinates (top-left based fish boxes).
    // Matches the drawn glass: straight walls up top, rounded bottom
    // corners (inner radius matches the CSS border-radius minus border).
    var sidePad = (fallW - bodyW) / 2;
    var wallL = sidePad + 3;                 // inner left wall
    var wallR = sidePad + 3 + (bodyW - 6);   // inner right wall
    var floorTop = fallH - 3;                // inner floor = the bottom of the jar
    var CORN = 21;                           // inner corner radius of the glass
    function glassInset(cy) { // how far the side glass curves inward at height cy
      var t = cy - (floorTop - CORN);
      if (t <= 0) return 0;
      if (t >= CORN) return CORN;
      return CORN - Math.sqrt(CORN * CORN - t * t);
    }
    function floorAt(cx) { // glass floor height under a fish centre x
      var fl = floorTop;
      var dd = Math.max((wallL + CORN) - cx, cx - (wallR - CORN));
      if (dd > 0) {
        var c = Math.min(CORN, dd);
        fl = Math.min(fl, (floorTop - CORN) + Math.sqrt(CORN * CORN - c * c));
      }
      return fl;
    }
    var fishesTopInFall = fallH - (bodyEl && bodyEl.offsetHeight ? bodyEl.offsetHeight : bodyH + 3); // open jar: no top border
    var contW = fishesEl.clientWidth || (bodyW - 6);
    var contH = fishesEl.clientHeight || bodyH;

    // Live water level (written by startWater). Buoyancy below reads it so
    // fish always float right at the surface, rising with it.
    var level = { h: 0 };

    // Landed fish count paces the rising water (1 fish touches = 1 step up).
    var progress = { landed: 0, total: visualCount };

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    startWater(fillEl, fishesEl, displayH, reached, reduceMotion, progress, level, gen);
    if (reduceMotion) {
      // Instant, static: scattered through the water, no animation at all
      progress.landed = visualCount;
      for (var ri = 0; ri < visualCount; ri++) {
        var rx = Math.random() * Math.max(1, contW - size);
        var ry = Math.max(contH - displayH, 0) + Math.random() * Math.max(1, displayH - size);
        ry = Math.max(0, Math.min(contH - size, ry));
        // keep clear of the rounded bottom corners too
        var ryMax = floorAt(rx + wallL + size / 2) - fishesTopInFall - size;
        if (ry > ryMax) ry = Math.max(0, ryMax);
        fishesEl.appendChild(makeSwimFishAt(rx, ry, size));
      }
      return;
    }

    // Fish pour from the faucet spout: measure its tip, fall back to the
    // jar mouth centre if measuring fails.
    var spoutX = fallW / 2, spoutY = fallH - bodyH - 40;
    try {
      var spoutEl = document.getElementById("patreon-spout");
      if (spoutEl) {
        var sr = spoutEl.getBoundingClientRect();
        var fr = fallLayer.getBoundingClientRect();
        if (fr.width > 0) {
          spoutX = sr.left + sr.width / 2 - fr.left;
          spoutY = sr.bottom - fr.top + 2;
        }
      }
    } catch (e) { /* keep fallback */ }

    // Pointer poke: hovering or touching the jar scatters nearby fish.
    // Works for mouse + touch; coordinates are mapped into fall-layer space.
    var poke = { x: 0, y: 0, active: false };
    (function watchPointer() {
      var jarEl = fallLayer.parentElement;
      if (!jarEl || !jarEl.addEventListener || jarEl._pokeWatched) return;
      jarEl._pokeWatched = true;
      function toFall(cx, cy) {
        var r = fallLayer.getBoundingClientRect();
        return [cx - r.left, cy - r.top];
      }
      function press(cx, cy) {
        var p = toFall(cx, cy);
        poke.x = p[0]; poke.y = p[1]; poke.active = true;
      }
      function release() {
        poke.active = false;
      }
      jarEl.addEventListener("mousemove", function (e) { press(e.clientX, e.clientY); });
      jarEl.addEventListener("mouseleave", release);
      function touch(e) {
        if (e.touches && e.touches.length > 0) press(e.touches[0].clientX, e.touches[0].clientY);
      }
      try {
        jarEl.addEventListener("touchstart", touch, { passive: true });
        jarEl.addEventListener("touchmove", touch, { passive: true });
      } catch (err) {
        jarEl.addEventListener("touchstart", touch);
        jarEl.addEventListener("touchmove", touch);
      }
      jarEl.addEventListener("touchend", release);
    })();

    var stagger = Math.min(280, 4400 / visualCount); // half-speed pour
    var fishes = [];
    var respawnAt = []; // timestamps: an escaped fish drops again from the head
    var spawned = 0;

    function spawnFish(extra) {
      var el = document.createElement("span");
      el.textContent = "\uD83D\uDC1F";
      el.style.fontSize = size + "px";
      el.style.opacity = "0"; // hidden until its staggered drop starts
      fallLayer.appendChild(el);
      fishes.push({
        el: el,
        x: Math.max(wallL, Math.min(wallR - size, spoutX - 9 + (Math.random() - 0.5) * 2)),
        y: spoutY - Math.random() * 20,
        vx: (Math.random() - 0.5) * 0.4, // straight down out of the head
        vy: 0,
        lane: ((spawned) * 0.618034) % 1, // depth lane: spread through the water, biased to the top
        rot: (Math.random() - 0.5) * 70, vr: (Math.random() - 0.5) * 8,
        born: performance.now() + (extra ? 900 + Math.random() * 900 : 300 + (spawned++) * stagger),
        bounces: 0,
        poked: false,
        counted: !!extra, // replacements never count toward the water again
        fading: false,
        done: false,
        face: 1
      });
    }

    for (var k = 0; k < visualCount; k++) spawnFish(false);

    var GRAV = 0.55, MAXV = 10;
    var last = performance.now();
    var sweepTick = 0, frameNo = 0;

    function normRot(r) {
      while (r > 180) r -= 360;
      while (r < -180) r += 360;
      return r;
    }

    // Mid-air collisions: falling fish bounce off each other (positions and
    // velocities only). Radius is generous so fish keep their distance and
    // don't stack on each other.
    var FR = size * 0.45; // collision radius (roomier than the visible ink)
    function pairBouncePass(now) {
      for (var i = 0; i < fishes.length; i++) {
        var A = fishes[i];
        if (A.done || now < A.born) continue;
        var ax = A.x + size / 2, ay = A.y + size / 2;
        for (var j = i + 1; j < fishes.length; j++) {
          var B = fishes[j];
          if (B.done || now < B.born) continue;
          var dx = (B.x + size / 2) - ax, dy = (B.y + size / 2) - ay;
          var minD = FR * 2;
          var d2 = dx * dx + dy * dy;
          if (d2 >= minD * minD || d2 < 0.0001) continue;
          var d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
          // Gentle separation (capped): deep spawn overlaps ease apart over
          // frames instead of teleporting fish away from each other.
          var corr = Math.min(1.5, Math.max(0, (minD - d) - 0.5) / 2);
          A.x -= nx * corr; A.y -= ny * corr;
          B.x += nx * corr; B.y += ny * corr;
          var rvn = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
          if (rvn < -4.0) {
            // Hard slam: capped nudge so nobody gets pinballed over the rim
            var imp = Math.min(1.5, -(1 + 0.1) * rvn / 2);
            A.vx -= imp * nx; A.vy -= imp * ny;
            B.vx += imp * nx; B.vy += imp * ny;
          } else if (rvn < 0) {
            var im2 = -rvn * 0.25;
            A.vx -= im2 * nx; A.vy -= im2 * ny;
            B.vx += im2 * nx; B.vy += im2 * ny;
          }
          for (var q = 0; q < 2; q++) {
            var S = q === 0 ? A : B;
            var sp = Math.hypot(S.vx, S.vy);
            if (sp > MAXV) { S.vx *= MAXV / sp; S.vy *= MAXV / sp; }
          }
          ax = A.x + size / 2; ay = A.y + size / 2;
        }
      }
    }

    function frame(now) {
      var dt = (now - last) / 16.67;
      last = now;
      if (dt > 2.5) dt = 2.5;
      if (dt < 0.25) dt = 0.25;
      var i, f;
      // Sweep out long-gone fish so the array never grows without bound
      // (spillover + respawns would otherwise accumulate done bodies forever).
      if ((sweepTick = (sweepTick + 1) % 300) === 0 && fishes.length > visualCount) {
        fishes = fishes.filter(function (b) { return !b.done; });
      }
      while (respawnAt.length && respawnAt[0] <= now) { respawnAt.shift(); spawnFish(true); }
      for (i = 0; i < fishes.length; i++) {
        f = fishes[i];
        if (f.done) continue;
        if (now < f.born) continue;
        if (!f.counted && now - f.born > 12000) { // safety net: count it so the water finishes
          f.counted = true;
          progress.landed++;
          continue;
        }
        if (!f.fading && f.el.style.opacity !== "1") f.el.style.opacity = "1";
      }
      // Two small substeps per frame: integrate everything, bounce fish off
      // each other, then resolve the jar + water contacts. Small steps mean
      // no tunneling and no deep embeds, so fish never visibly teleport.
      var h = dt / 2;
      for (var sub = 0; sub < 2; sub++) {
        var subMax2 = 0; // fastest fish this substep (squared) — skips the pair pass when all calm
        for (i = 0; i < fishes.length; i++) {
          f = fishes[i];
          if (f.done || now < f.born) continue;
          var inM = (f.x + size > wallL && f.x < wallR);
          var waterY = fallH - level.h;
          f.pb = f.y + size; // bottom before integrating (for arrival detection)
          f.poked = false; // re-detected below every substep
          f.vy = Math.min(MAXV, f.vy + GRAV * h);
          if (inM && f.y + size >= waterY) {
            // Buoyancy: each fish floats at its own lane depth (biased to the
            // top), so the school fills the water instead of piling on one
            // line. Full strength near its line for a crisp bob, gentler when
            // deep so plunges glide back up instead of rocketing. Catches
            // falls, never lets fish sink through. (Fish outside the glass
            // get no buoyancy — they just fall out.) Held fish (poked) get a
            // soft spring so the cursor can actually shove them around.
            var laneY = waterY - size * 0.35 + Math.pow(f.lane, 1.4) * Math.max(0, level.h - size * 0.65);
            var laneFloor = floorAt(f.x + size / 2) - size; // rounded corners included
            if (laneY > laneFloor) laneY = laneFloor;
            var floatY = laneY;
            var dyB = floatY - f.y;
            f.vy += dyB * (f.poked ? 0.25 : 1.1) * h / (1 + Math.abs(dyB) / 40);
            f.vy *= (1 - 0.25 * h);
            if (f.vy < 0) f.vy *= (1 - 0.3 * h); // water resists upward motion: graceful rises
            if (f.vy > MAXV) f.vy = MAXV;
            if (f.vy < -MAXV) f.vy = -MAXV; // deep plunges must not slingshot back up
            f.vx *= (1 - 0.04 * h);
            f.vr *= (1 - 0.05 * h);
            // Gentle submerged drift: floaters slowly mill around forever.
            // (Falling fish are still in air here, so the pour stays straight.)
            f.vx += (Math.sin(now * 0.0007 + f.y * 0.02) * 1.2 + (Math.random() - 0.5) * 0.3) * h;
          }
          f.x += f.vx * h;
          f.y += f.vy * h;
          f.rot += f.vr * h;
          var spd2 = f.vx * f.vx + f.vy * f.vy;
          if (spd2 > subMax2) subMax2 = spd2;
          if (Math.hypot(f.vx, f.vy) < 1.5) { // slow fish right themselves
            f.rot = normRot(f.rot);
            f.rot += (0 - f.rot) * Math.min(1, 0.2 * h);
          }
          if (poke.active) {
            // Poke! Big circular collider shoves nearby fish away from the
            // cursor with a lively upward toss.
            var pdx = (f.x + size / 2) - poke.x;
            var pdy = (f.y + size / 2) - poke.y;
            var pd = Math.sqrt(pdx * pdx + pdy * pdy);
            var PR = size * 3; // six fish across
            if (pd < PR && pd > 0.01) {
              var pf = (1 - pd / PR) * 10 * h;
              f.vx += (pdx / pd) * pf;
              f.vy += (pdy / pd) * pf - 2.5 * h;
              f.vr += (Math.random() - 0.5) * 12 * h;
              var ps = Math.hypot(f.vx, f.vy);
              if (ps > 18) { f.vx *= 18 / ps; f.vy *= 18 / ps; }
              f.poked = true; // held fish get a soft spring (see buoyancy)
            }
          }
        }
        // Pair collisions only matter while something is actually moving
        // (or while poking) — a calm school skips ~22k checks/frame at 150 fish.
        if (subMax2 > 0.36 || poke.active) pairBouncePass(now);
        for (i = 0; i < fishes.length; i++) {
          f = fishes[i];
          if (f.done || now < f.born) continue;
          if (f.vy < -6) f.vy = -6; // rise gracefully, never rocket upward
          var inMouth = (f.x + size > wallL && f.x < wallR);
          var belowRim = (f.y + size * 0.5 > fishesTopInFall);
          if (!inMouth && f.y + size * 0.5 > fishesTopInFall) {
            // Spilled over the edge: slide down the outer glass and fade out
            // on the way (never camp on the wall). Spilling out is allowed.
            f.vy = Math.min(7, f.vy + 1.0 * h);
            if (!f.fading) f.fading = true;
            f.el.style.opacity = Math.max(0, 1 - (f.y - fishesTopInFall) / 220).toFixed(2);
            if (f.y > floorTop + 120) {
              if (f.el.parentNode) f.el.parentNode.removeChild(f.el);
              if (!f.counted) { progress.landed++; f.counted = true; }
              respawnAt.push(now + 900 + Math.random() * 900); // escaped fish drops again
              f.done = true;
              continue;
            }
            continue;
          }
          if (inMouth) {
            f.fading = false; // back inside: fully visible again
            if (belowRim) {
            // Glass walls, curving inward near the rounded bottom corners
            var gIn = glassInset(f.y + size / 2);
            if (f.x < wallL + gIn) { f.x = wallL + gIn; f.vx = Math.abs(f.vx) * 0.4; f.vr *= 0.7; }
            if (f.x + size > wallR - gIn) { f.x = wallR - gIn - size; f.vx = -Math.abs(f.vx) * 0.4; f.vr *= 0.7; }
            }
          }
          if (inMouth) {
            // Floor follows the rounded bottom corners (by fish centre x)
            var flNow = floorAt(f.x + size / 2);
            if (f.y + size > flNow) f.y = flNow - size; // hard floor, never tunnels
          }
          // Flat water collider: crossing the live surface downward counts
          // the fish (1 step of rising water). Touching the bare floor counts
          // too — otherwise, with an empty jar, fish would rest 3px short of
          // the line and the water would stall until the safety net fires.
          // Hard slams get one small hop; buoyancy below does the rest, so
          // nothing ever needs to snap or freeze.
          var surfNow = fallH - level.h;
          var solidY = Math.min(surfNow, floorTop);
          if (inMouth && f.vy > 0 && f.pb < solidY && f.y + size >= solidY) {
            if (!f.counted) { progress.landed++; f.counted = true; }
            if (f.vy > 6 && f.bounces < 2) {
              f.y = solidY - size; // impact frame: exact contact point
              f.vy = -f.vy * 0.12; // small hop, not a big jump
              f.vx *= 0.7;
              f.vr = f.vr * 0.5 + (Math.random() - 0.5) * 6;
              f.bounces++;
            }
          }
        }
      }
      for (i = 0; i < fishes.length; i++) {
        f = fishes[i];
        if (f.done) continue;
        if (Math.abs(f.vx) > 1.5) f.face = f.vx > 0 ? 1 : -1;
        // DOM writes at 30fps: halves style recalc, motion stays smooth.
        if ((frameNo & 1) === 0) f.el.style.transform = "translate(" + f.x.toFixed(1) + "px," + f.y.toFixed(1) + "px) rotate(" + f.rot.toFixed(1) + "deg) scaleX(" + f.face + ")";
      }
      frameNo++;
      // The school stays alive forever (colliding, jostling) — exits when
      // a rebuild supersedes this generation.
      if (gen === jarGen) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  async function load() {
    var gen = ++jarGen; // supersedes any previous pour's animation loops
    var waterEl = document.getElementById("patreon-water");
    var barTextEl = document.getElementById("patreon-goal-bar-text");
    var descEl = document.getElementById("patreon-goal-desc");
    var wrapEl = document.getElementById("patreon-goal");
    var barEl = document.getElementById("patreon-goal-bar");
    var fishesEl = document.getElementById("patreon-goal-fishes");
    var fallEl = document.getElementById("patreon-goal-fall");
    if (!waterEl) return;

    try {
      var res = await fetch(GIST_RAW_URL + "?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var text = (await res.text()).trim();
      if (!text) throw new Error("empty");
      var p = parseGoalText(text);

      // Jar fills by height; 1 fish per $1 of current earnings
      var fishCount = Math.max(0, Math.floor(p.current));
      var bodyEl = fallEl && fallEl.parentElement ? fallEl.parentElement.querySelector(".fish-jar-body") : null;
      if (barEl) barEl.setAttribute("aria-valuenow", String(p.pct));

      dropFishWithPhysics(fallEl, fishesEl, bodyEl, waterEl, fishCount, p.pct, p.reached, gen);

      // Count the dollars up from $0 to the current amount (goal stays put)
      (function countUp() {
        if (!barTextEl) return;
        var showFinal = function () {
          barTextEl.textContent = "$" + fmt(p.current) + " / $" + fmt(p.goal) + " (" + p.pct + "%)";
        };
        if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          showFinal();
          return;
        }
        var DUR = 1500, t0 = performance.now();
        function tick(now) {
          if (gen !== jarGen) return; // superseded by a rebuild
          var e = Math.min(1, (now - t0) / DUR);
          e = 1 - Math.pow(1 - e, 3);
          var cur = Math.floor(p.current * e);
          var pc = p.goal > 0 ? Math.min(100, Math.floor(cur / p.goal * 100)) : 0;
          barTextEl.textContent = "$" + cur + " / $" + fmt(p.goal) + " (" + pc + "%)";
          if (e < 1) requestAnimationFrame(tick);
          else showFinal();
        }
        requestAnimationFrame(tick);
      })();
      if (descEl) descEl.textContent = "My goal is to get $" + fmt(p.goal) + " / month";

      if (p.reached && wrapEl) wrapEl.classList.add("goal-reached");

      lastTierScale = tierScale();
      watchResize();
    } catch (e) {
      if (barTextEl) barTextEl.textContent = "goal unavailable";
    }
  }

  // The jar only ever has two sizes (desktop/mobile breakpoint), and every
  // fish is laid out in pixels at load — so when a resize actually changes
  // the size tier, rebuild the whole pour cleanly instead of stretching it.
  // Height-only resizes (mobile URL bar etc.) never match, so they do nothing.
  var resizeWatched = false;
  var lastTierScale = 0;
  function tierScale() {
    var b = document.querySelector(".fish-jar-body");
    var w = b ? b.clientWidth : 0;
    return w >= 220 ? 1 : 0.78;
  }
  function watchResize() {
    if (resizeWatched) return;
    resizeWatched = true;
    var rt = null;
    window.addEventListener("resize", function () {
      if (rt) clearTimeout(rt);
      rt = setTimeout(function () {
        rt = null;
        if (tierScale() !== lastTierScale) load();
      }, 300);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
