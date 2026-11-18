/* Note Trainer: show a note, then play it after a delay. Repeats until stopped. */
(function () {
  "use strict";

  var NOTE_LEN = 2.2;   // seconds the tone is held
  var REST_MS = 1200;   // pause before the next note appears
  var $ = function (id) { return document.getElementById(id); };
  var inst = TN.getInstrument();
  TN.pageSetup(inst, "Note Trainer");
  var R = inst.ranges[inst.trainerRange];
  var svg = $("stave");
  var stave = TN.buildStave(svg, { clef: inst.clef, view: TN.viewFor(inst, inst.trainerRange) });
  svg.setAttribute("aria-label", inst.clef.charAt(0).toUpperCase() + inst.clef.slice(1) + " clef stave showing the current note");
  $("footnote").textContent = "Range " + R.short + ". " + inst.soundNote;
  var labelEl = $("noteName"), stateEl = $("stateText"), countEl = $("count"), barEl = $("barFill");
  var startBtn = $("startBtn"), delayEl = $("delay"), delayOut = $("delayOut");
  var accEl = $("accidentals"), staveEl = $("showStave");

  var running = false, runId = 0, current = null, ticker = null, pending = null;

  function showNote(n) {
    current = n;
    stave.layer.innerHTML = "";
    stave.draw(stave.layer, n, { cls: "fade" });
    labelEl.innerHTML = TN.labelHTML(n, false);
  }
  function pick() {
    return TN.pick(TN.notesInRange(R.lo, R.hi, accEl.checked), current);
  }

  function wait(ms) {
    return new Promise(function (res) {
      var t = setTimeout(function () { pending = null; res(); }, ms);
      pending = { t: t, res: res };
    });
  }
  function cancelWait() {
    if (pending) { clearTimeout(pending.t); var r = pending.res; pending = null; r(); }
  }
  function setStatus(text, count) {
    stateEl.textContent = text;
    if (count === null) { countEl.hidden = true; }
    else { countEl.hidden = false; countEl.textContent = count; }
  }
  function runBar(sec) {
    barEl.style.transition = "none";
    barEl.style.width = "0%";
    void barEl.offsetWidth;
    barEl.style.transition = "width " + sec + "s linear";
    barEl.style.width = "100%";
  }
  function resetBar() {
    barEl.style.transition = "none";
    barEl.style.width = "0%";
  }

  async function cycle(id) {
    function alive() { return running && id === runId; }
    try {
      while (alive()) {
        var n = pick();
        showNote(n);
        var sec = parseInt(delayEl.value, 10) || 5;
        setStatus("Name it. Sounds in", sec);
        runBar(sec);
        var end = performance.now() + sec * 1000;
        ticker = setInterval(function () {
          countEl.textContent = Math.max(0, Math.ceil((end - performance.now()) / 1000));
        }, 100);
        await wait(sec * 1000);
        clearInterval(ticker);
        if (!alive()) return;

        setStatus("Listen", null);
        svg.classList.add("sounding");
        TN.audio.play(n, NOTE_LEN, inst);
        await wait(NOTE_LEN * 1000);
        svg.classList.remove("sounding");
        if (!alive()) return;

        setStatus("Next note", null);
        resetBar();
        await wait(REST_MS);
      }
    } finally {
      clearInterval(ticker);
    }
  }

  function setButton(isRunning) {
    startBtn.textContent = isRunning ? "Stop" : "Start";
    startBtn.classList.toggle("running", isRunning);
  }
  function start() {
    TN.audio.ensure();           // created inside the click so the browser allows sound
    running = true; runId++;
    setButton(true);
    cycle(runId);
  }
  function stop() {
    running = false; runId++;
    cancelWait();
    clearInterval(ticker);
    TN.audio.stop();
    svg.classList.remove("sounding");
    resetBar();
    setStatus("Stopped. Press Start for more.", null);
    setButton(false);
  }

  staveEl.addEventListener("change", function () { svg.classList.toggle("off", !staveEl.checked); });
  startBtn.addEventListener("click", function () { running ? stop() : start(); });
  delayEl.addEventListener("input", function () { delayOut.textContent = delayEl.value + " s"; });
  delayOut.textContent = delayEl.value + " s";

  // opening state: a random note from the range
  showNote(pick());
})();
