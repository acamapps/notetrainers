/* Name the Note: a note appears on the stave, the player picks its name. */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var inst = TN.getInstrument();
  TN.pageSetup(inst, "Name the Note");
  var stave = TN.buildStave($("stave"), { clef: inst.clef, view: TN.viewFor(inst, "full") });
  $("stave").setAttribute("aria-label", inst.clef.charAt(0).toUpperCase() + inst.clef.slice(1) + " clef stave showing a note to name");
  $("footnote").textContent = "Octave numbers follow scientific pitch notation: middle C is C4. " + inst.soundNote;
  var labelEl = $("noteName"), msgEl = $("msg"), nextBtn = $("next"), scoreEl = $("score");
  var rangeEl = $("range"), accSw = $("accidentals"), soundSw = $("sound");
  var accField = $("accField"), lettersEl = $("letters");

  var pool, current = null, answered = false, acc = "";
  var score = 0, total = 0, streak = 0, timer = null;

  function buildPool() {
    var r = inst.ranges[rangeEl.value];
    pool = TN.notesInRange(r.lo, r.hi, accSw.checked);
  }
  function setAcc(a) {
    acc = a;
    Array.prototype.forEach.call(accField.querySelectorAll("button"), function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-acc") === a));
    });
  }
  function renderScore() {
    scoreEl.textContent = "Score " + score + " / " + total + " · Streak " + streak;
  }
  function say(text, cls) { msgEl.textContent = text; msgEl.className = "msg" + (cls ? " " + cls : ""); }

  function next() {
    clearTimeout(timer);
    current = TN.pick(pool, current);
    answered = false;
    stave.layer.innerHTML = "";
    stave.draw(stave.layer, current, { cls: "fade" });
    labelEl.textContent = "?";
    say("Which note is this?");
    nextBtn.hidden = true;
    lettersEl.classList.remove("locked");
    setAcc("");
  }

  function answer(letter) {
    if (answered) return;
    answered = true;
    var ok = letter === current.l && acc === current.a;
    total++;
    if (ok) { score++; streak++; } else { streak = 0; }

    var name = TN.noteName(current, true);
    var said = letter + TN.accSymbol(acc);
    labelEl.innerHTML = TN.labelHTML(current, false);
    stave.layer.innerHTML = "";
    stave.draw(stave.layer, current, { cls: ok ? "good" : "bad" });

    if (ok) {
      say("Correct. That is " + name + ".", "good");
    } else if (TN.pitchClass(letter, acc) === TN.pitchClass(current.l, current.a)) {
      say("Same pitch as " + said + ", but this note is written as " + name + ".", "bad");
    } else {
      say("Not quite. You said " + said + ", this is " + name + ".", "bad");
    }

    if (soundSw.checked) TN.audio.play(current, 1.6, inst);
    renderScore();
    lettersEl.classList.add("locked");
    nextBtn.hidden = false;
    nextBtn.focus({ preventScroll: true });
    if (ok) timer = setTimeout(next, 1800);
  }

  lettersEl.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (b) answer(b.getAttribute("data-letter"));
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
    if (k === "Enter") {
      if (answered && !(t.closest && t.closest("button"))) { e.preventDefault(); next(); }
      return;
    }
    if (/^[a-gA-G]$/.test(k)) { answer(k.toUpperCase()); return; }
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
