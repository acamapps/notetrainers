/* Place the Note: a note name is given, the player puts it on the stave. */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var inst = TN.getInstrument();
  TN.pageSetup(inst, "Place the Note");
  var svg = $("stave");
  var stave = TN.buildStave(svg, { clef: inst.clef, view: TN.viewFor(inst, "full", true) });
  var bounds = TN.stepBounds(inst);
  var DN_MIN = bounds.min, DN_MAX = bounds.max, START_DN = stave.midStep;   // selectable steps; start on the middle line
  svg.setAttribute("aria-label", inst.clef.charAt(0).toUpperCase() + inst.clef.slice(1) +
    " clef stave. Use the up and down arrow keys to choose a pitch, then press Enter to place the note.");
  $("hint").textContent = "Reference: " + inst.reference +
    " Keyboard: Tab to the stave, up and down arrows to move, Enter to place and again for the next note.";
  $("footnote").textContent = "Octave numbers follow scientific pitch notation: middle C is C4. " + inst.soundNote;
  var labelEl = $("noteName"), msgEl = $("msg"), nextBtn = $("next"), scoreEl = $("score"), srEl = $("sr");
  var rangeEl = $("range"), accSw = $("accidentals"), soundSw = $("sound"), accField = $("accField");

  var pool, current = null, answered = false, acc = "";
  var ghostDn = null, pressed = false;
  var score = 0, total = 0, streak = 0, timer = null;

  function clamp(dn) { return Math.max(DN_MIN, Math.min(DN_MAX, dn)); }
  function buildPool() {
    var r = inst.ranges[rangeEl.value];
    pool = TN.notesInRange(r.lo, r.hi, accSw.checked);
  }
  function renderScore() {
    scoreEl.textContent = "Score " + score + " / " + total + " · Streak " + streak;
  }
  function say(text, cls) { msgEl.textContent = text; msgEl.className = "msg" + (cls ? " " + cls : ""); }

  function setAcc(a) {
    acc = a;
    Array.prototype.forEach.call(accField.querySelectorAll("button"), function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-acc") === a));
    });
    if (ghostDn !== null && !answered) showGhost(ghostDn, false);
  }

  /* ----- pointer to stave step ----- */
  // Touch is steadied in two ways, because a fingertip is wide and rolls a little as it lifts:
  //  - the preview only moves to a new step once the finger is clearly past the halfway line
  //    (STICKY steps beyond it), so it does not flicker between two neighbouring lines;
  //  - the note placed is the step shown LIFT_MS before the finger left the screen, not wherever
  //    the finger happened to be on the final frame.
  // Both numbers can be changed: a bigger STICKY or LIFT_MS makes touch less sensitive.
  var STICKY = 0.35, LIFT_MS = 80;
  var curDn = null, samples = [];

  function floatStep(e) {
    var pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    var p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return (48 - p.y) / 6 + stave.midStep - 4;      // midStep is the middle line, 4 steps above the bottom line
  }
  function track(e, first) {
    var f = floatStep(e);
    if (first || e.pointerType === "mouse" || Math.abs(f - curDn) > 0.5 + STICKY) curDn = clamp(Math.round(f));
    samples.push({ t: performance.now(), dn: curDn });
    if (samples.length > 40) samples.shift();
    return curDn;
  }
  function settledDn(e) {
    if (e.pointerType === "mouse") return clamp(Math.round(floatStep(e)));
    var cutoff = performance.now() - LIFT_MS, dn = samples.length ? samples[0].dn : curDn;
    for (var i = 0; i < samples.length; i++) { if (samples[i].t <= cutoff) dn = samples[i].dn; }
    return dn;
  }
  function showGhost(dn, speak) {
    ghostDn = dn;
    var n = TN.noteFromStep(dn, acc);
    stave.ghost.innerHTML = "";
    stave.draw(stave.ghost, n, { cls: "ghost" });
    if (speak) srEl.textContent = TN.noteName(n, true);
  }
  function clearGhost() { ghostDn = null; stave.ghost.innerHTML = ""; }

  /* ----- rounds ----- */
  function next() {
    clearTimeout(timer);
    current = TN.pick(pool, current);
    answered = false;
    stave.layer.innerHTML = "";
    clearGhost();
    labelEl.innerHTML = TN.labelHTML(current, true);
    say("Tap or click the stave to place the note.");
    nextBtn.hidden = true;
    setAcc("");
  }

  function commit(dn) {
    if (answered) return;
    answered = true;
    var placed = TN.noteFromStep(dn, acc);
    var ok = TN.sameNote(placed, current);
    total++;
    if (ok) { score++; streak++; } else { streak = 0; }

    clearGhost();
    stave.layer.innerHTML = "";
    var name = TN.noteName(current, true), mine = TN.noteName(placed, true);
    if (ok) {
      stave.draw(stave.layer, placed, { cls: "good" });
      say("Correct. That is " + name + ".", "good");
    } else {
      stave.draw(stave.layer, placed, { cls: "bad", cx: 118 });
      stave.draw(stave.layer, current, { cls: "good", cx: 190 });
      if (placed.midi === current.midi) {
        say("Same pitch as " + mine + ", but " + name + " is written as shown on the right.", "bad");
      } else {
        say("Not quite. You placed " + mine + ". " + name + " goes on the right.", "bad");
      }
    }

    if (soundSw.checked) TN.audio.play(current, 1.6, inst);
    renderScore();
    nextBtn.hidden = false;
    if (ok) timer = setTimeout(next, 1800);
  }

  /* ----- events ----- */
  svg.addEventListener("pointermove", function (e) {
    if (answered) return;
    if (e.pointerType === "mouse" || pressed) showGhost(track(e, false), false);
  });
  svg.addEventListener("pointerdown", function (e) {
    if (answered) return;
    pressed = true;
    samples = [];
    if (svg.setPointerCapture) { try { svg.setPointerCapture(e.pointerId); } catch (err) {} }
    showGhost(track(e, true), false);
  });
  svg.addEventListener("pointerup", function (e) {
    if (!pressed) return;
    pressed = false;
    if (!answered) commit(settledDn(e));
  });
  svg.addEventListener("pointercancel", function () { pressed = false; clearGhost(); });
  svg.addEventListener("pointerleave", function (e) {
    if (!pressed && e.pointerType === "mouse" && !answered) clearGhost();
  });

  accField.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (b && !answered) setAcc(b.getAttribute("data-acc"));
  });
  nextBtn.addEventListener("click", next);
  $("reset").addEventListener("click", function () { score = 0; total = 0; streak = 0; renderScore(); });
  rangeEl.addEventListener("change", function () { buildPool(); next(); });
  accSw.addEventListener("change", function () {
    accField.hidden = !accSw.checked;
    buildPool();
    next();
  });

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key, t = e.target;
    if (t.closest && t.closest("select")) return;
    if (t === svg && !answered) {
      if (k === "ArrowUp" || k === "ArrowDown") {
        e.preventDefault();
        showGhost(clamp(ghostDn === null ? START_DN : ghostDn + (k === "ArrowUp" ? 1 : -1)), true);
        return;
      }
      if (k === "Enter" || k === " ") {
        e.preventDefault();
        if (ghostDn !== null) commit(ghostDn);
        return;
      }
    }
    if ((k === "Enter" || k === " ") && answered && !(t.closest && t.closest("button"))) {
      e.preventDefault();
      next();
      return;
    }
    if (!answered && !accField.hidden) {
      if (k === "#" || k === "+") setAcc("#");
      else if (k === "-") setAcc("b");
      else if (k === "0" || k === "=") setAcc("");
    }
  });

  buildPool();
  next();
  renderScore();
})();
