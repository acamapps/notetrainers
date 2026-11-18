/* Shared notation, note selection, page setup and sound for Note Practice.
   Instrument details (clef, ranges, transposition, tone) live in instruments.js. */
(function () {
  "use strict";

  var LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
  var SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  var ACC = { "": 0, "#": 1, "b": -1 };
  var SPELL = [
    [["C", ""]], [["C", "#"], ["D", "b"]], [["D", ""]], [["D", "#"], ["E", "b"]],
    [["E", ""]], [["F", ""]], [["F", "#"], ["G", "b"]], [["G", ""]],
    [["G", "#"], ["A", "b"]], [["A", ""]], [["A", "#"], ["B", "b"]], [["B", ""]]
  ];

  /* Diatonic step of the bottom stave line (C0 = 0): G2 for bass clef, E4 for treble clef.
     top / low: vertical extent of the clef drawing, used to size the picture. */
  var CLEFS = {
    bass:   { bottom: 18, top: -2,  low: 52 },
    treble: { bottom: 30, top: -17, low: 68 }
  };
  var CLEF_ART = {
    bass:
      '<circle class="clef-fill" cx="13" cy="12" r="5.8"/>' +
      '<path class="clef-stroke" d="M13 12 C13 0 36 0 36 15 C36 30 24 42 6 50"/>' +
      '<circle class="clef-fill" cx="46" cy="6" r="2.4"/>' +
      '<circle class="clef-fill" cx="46" cy="18" r="2.4"/>',
    // Outline of the treble clef glyph in the GNU FreeFont serif face, scaled to the stave.
    treble:
      '<path class="clef-fill" d="M22.2 46.9Q24.3 54.3 24.3 59Q24.3 62.8 21.7 65.2Q19.1 67.6 15.4 67.6Q11.8 67.6 9.2 65.5Q6.6 63.4 6.6 60.5Q6.6 58.3 8 56.5Q9.5 54.6 11.6 54.6Q13.7 54.6 15 56.1Q16.3 57.6 16.3 59.6Q16.3 64 11.3 64Q12.6 66 15.4 66Q16.5 66 17.6 65.7Q18.7 65.3 19.9 64.6Q21.1 63.8 21.8 62.1Q22.6 60.5 22.6 58.1Q22.6 56.6 20.6 47.4Q19 47.9 16.7 47.9Q9.8 47.9 4.9 42.8Q0 37.7 0 30.6Q0 28.1 0.8 25.6Q1.6 23 2.7 21.1Q3.7 19.1 5.7 16.7Q7.7 14.2 9.1 12.8Q10.5 11.3 13 8.9Q11.3 3 11.3 -1.8Q11.3 -8.1 13.7 -12.4Q16 -16.7 18.3 -16.7Q19 -16.7 19.9 -15.8Q20.8 -14.9 21.7 -13.2Q22.5 -11.6 23.1 -8.9Q23.7 -6.3 23.7 -3.3Q23.7 8 15.7 15.4L17.6 23.7Q18.7 23.5 19.6 23.5Q23.9 23.5 26.9 27Q29.9 30.5 29.9 35.5Q29.9 43.9 22.2 46.9ZM21.7 -5.8Q21.7 -9.7 19.4 -9.7Q16.8 -9.7 15.1 -5.9Q13.3 -2.2 13.3 2.4Q13.3 5.4 14.2 7.6Q16.9 5.9 19.3 1.7Q21.7 -2.5 21.7 -5.8ZM26.8 37.9Q26.8 34 24.5 31.7Q22.2 29.4 18.6 29.4L21.8 45.4Q26.8 43.3 26.8 37.9ZM20.3 45.8 17.1 29.5Q15.1 29.9 13.6 31.9Q12 33.8 12 35.8Q12 36.9 12.4 37.9Q12.8 38.9 13.4 39.6Q14 40.3 14.7 40.9Q15.3 41.5 15.7 41.7Q16.1 42 16.1 42L15.6 42.3Q13.2 41.7 11.1 39.5Q9.1 37.3 9.1 34Q9.1 30.7 11.1 27.9Q13.2 25.1 15.8 24.1L14.5 16.6Q3.4 25.8 3.4 34.5Q3.4 39.6 7.3 43.1Q11.2 46.6 16.1 46.6Q17.3 46.6 20.3 45.8Z"/>'
  };

  /* ---------- note model ---------- */
  function pitchClass(l, a) { return (((SEMI[l] + ACC[a]) % 12) + 12) % 12; }
  function makeNote(l, a, oct) {
    return { l: l, a: a, oct: oct, midi: 12 * (oct + 1) + SEMI[l] + ACC[a] };
  }
  function stepOf(n) { return n.oct * 7 + LETTERS.indexOf(n.l); }
  function yOfStep(step, clef) { return 48 - (step - CLEFS[clef].bottom) * 6; }
  function stepAtY(y, clef) { return Math.round((48 - y) / 6 + CLEFS[clef].bottom); }
  function noteFromStep(step, a) {
    return makeNote(LETTERS[((step % 7) + 7) % 7], a, Math.floor(step / 7));
  }
  function sameNote(x, y) { return x.l === y.l && x.a === y.a && x.oct === y.oct; }

  function accSymbol(a) {
    return a === "#" ? "♯" : a === "b" ? "♭" : a === "n" ? "♮" : "";
  }
  function noteName(n, withOct) { return n.l + accSymbol(n.a) + (withOct ? n.oct : ""); }
  function labelHTML(n, withOct) {
    return n.l +
      (n.a ? '<span class="acc">' + accSymbol(n.a) + "</span>" : "") +
      (withOct ? '<span class="oct">' + n.oct + "</span>" : "");
  }

  function spellings(midi) {
    var pc = ((midi % 12) + 12) % 12;
    return SPELL[pc].map(function (s) {
      return makeNote(s[0], s[1], (midi - SEMI[s[0]] - ACC[s[1]]) / 12 - 1);
    });
  }
  function notesInRange(lo, hi, accidentals) {
    var out = [];
    for (var m = lo; m <= hi; m++) {
      spellings(m).forEach(function (n) { if (accidentals || n.a === "") out.push(n); });
    }
    return out;
  }
  // Every pitch is equally likely; sharps and flats are then chosen at random.
  function pick(pool, prev) {
    var mids = [];
    pool.forEach(function (n) { if (mids.indexOf(n.midi) < 0) mids.push(n.midi); });
    if (prev && mids.length > 1) mids = mids.filter(function (m) { return m !== prev.midi; });
    var m = mids[Math.floor(Math.random() * mids.length)];
    var opts = pool.filter(function (n) { return n.midi === m; });
    return opts[Math.floor(Math.random() * opts.length)];
  }

  /* ---------- picture size ---------- */
  function glyphExtent(a) { return a === "#" ? [13, 12] : a === "b" ? [17, 6] : [7, 7]; }   // [above, below]

  // Lowest and highest stave steps the player can choose on, one past the written range.
  function stepBounds(inst) {
    var r = inst.ranges.full, lo = 1e9, hi = -1e9;
    for (var m = r.lo; m <= r.hi; m++) {
      spellings(m).forEach(function (n) { var s = stepOf(n); lo = Math.min(lo, s); hi = Math.max(hi, s); });
    }
    return { min: lo - 1, max: hi + 1 };
  }
  // [top, height] of the drawing, so every note, accidental, ledger line and the clef fit.
  function viewFor(inst, key, withClick) {
    var clef = inst.clef, c = CLEFS[clef], r = inst.ranges[key];
    var top = c.top, bottom = c.low;
    for (var m = r.lo; m <= r.hi; m++) {
      spellings(m).forEach(function (n) {
        var y = yOfStep(stepOf(n), clef), g = glyphExtent(n.a);
        top = Math.min(top, y - g[0]);
        bottom = Math.max(bottom, y + g[1]);
      });
    }
    if (withClick) {
      var b = stepBounds(inst);
      top = Math.min(top, yOfStep(b.max, clef) - 17);      // room for a flat sign on the top step
      bottom = Math.max(bottom, yOfStep(b.min, clef) + 12);  // and a sharp sign on the bottom step
    }
    top = Math.floor(top - 6);
    bottom = Math.ceil(bottom + 6);
    return [top, bottom - top];
  }

  /* ---------- drawing ---------- */
  function ledger(cx, ly) {
    return '<line class="ledger" x1="' + (cx - 13) + '" x2="' + (cx + 13) +
      '" y1="' + ly + '" y2="' + ly + '"/>';
  }

  // opts.cx: horizontal position (default 150). opts.cls: extra classes such as
  // "fade", "ghost", "good" or "bad".
  function drawNote(layer, n, opts, clef) {
    opts = opts || {};
    var cx = opts.cx || 150, y = yOfStep(stepOf(n), clef), h = "", ly;
    for (ly = -12; ly >= y - 0.5; ly -= 12) h += ledger(cx, ly);
    for (ly = 60; ly <= y + 0.5; ly += 12) h += ledger(cx, ly);

    if (n.a === "#") {
      h += '<g transform="translate(' + (cx - 21) + ',' + y + ')">' +
        '<path class="accm" stroke-width="1.5" d="M-2.8 -11 V12 M2.8 -13 V10"/>' +
        '<path class="accm" stroke-width="3" d="M-6.5 -1.2 L6.5 -4.2 M-6.5 5.2 L6.5 2.2"/></g>';
    } else if (n.a === "b") {
      h += '<g transform="translate(' + (cx - 21) + ',' + y + ')">' +
        '<path class="accm" stroke-width="1.8" d="M0 -17 V5 M0 5 C7 1 11 -2.5 9 -6.5 C7.5 -9.5 2 -9 0 -4"/></g>';
    }

    h += '<ellipse class="nh" cx="' + cx + '" cy="' + y + '" rx="8.2" ry="6" transform="rotate(-18 ' + cx + ' ' + y + ')"/>';
    if (y > 24) {
      h += '<line class="stem" x1="' + (cx + 7.6) + '" x2="' + (cx + 7.6) + '" y1="' + (y - 1) + '" y2="' + (y - 38) + '"/>';
    } else {
      h += '<line class="stem" x1="' + (cx - 7.6) + '" x2="' + (cx - 7.6) + '" y1="' + (y + 1) + '" y2="' + (y + 38) + '"/>';
    }
    layer.insertAdjacentHTML("beforeend", '<g class="note ' + (opts.cls || "") + '">' + h + "</g>");
  }

  // opts.clef: "bass" (default) or "treble". opts.view: [top, height] from viewFor().
  function buildStave(svg, opts) {
    opts = opts || {};
    var clef = opts.clef || "bass", c = CLEFS[clef];
    var v = opts.view || [-34, 120];
    svg.setAttribute("viewBox", "0 " + v[0] + " 300 " + v[1]);
    svg.innerHTML =
      '<g>' +
      [0, 12, 24, 36, 48].map(function (y) {
        return '<line class="line" x1="4" x2="296" y1="' + y + '" y2="' + y + '"/>';
      }).join("") +
      '<line class="line" x1="4" x2="4" y1="0" y2="48"/>' +
      '<line class="line" x1="296" x2="296" y1="0" y2="48"/>' +
      '</g>' +
      '<g transform="translate(14,0)">' + CLEF_ART[clef] + '</g>' +
      '<g class="notes"></g><g class="ghosts"></g>';
    return {
      svg: svg,
      clef: clef,
      layer: svg.querySelector(".notes"),
      ghost: svg.querySelector(".ghosts"),
      midStep: c.bottom + 4,                                   // the middle line
      stepAt: function (y) { return stepAtY(y, clef); },
      draw: function (layer, n, o) { drawNote(layer, n, o, clef); }
    };
  }

  // A small illustration for the menus: a stave with a label above and one note.
  function mini(svg, inst, demo, label, cls) {
    var s = buildStave(svg, { clef: inst.clef, view: [-62, 148] });
    svg.insertAdjacentHTML("beforeend", '<text class="mini-label" x="150" y="-30">' + label + "</text>");
    s.draw(s.layer, makeNote(demo[0], demo[1], demo[2]), { cls: cls || "" });
    return s;
  }

  /* ---------- instrument and page setup ---------- */
  function getInstrument() {
    var id = null;
    try { id = new URLSearchParams(window.location.search).get("i"); } catch (e) {}
    var reg = window.TN.INSTRUMENTS;
    return (id && reg[id]) || reg[window.TN.INSTRUMENT_ORDER[0]];
  }
  function byId(id) { return document.getElementById(id); }
  function pageSetup(inst, title) {
    document.title = title + " · " + inst.name;
    var e = byId("eyebrow");
    if (e) e.textContent = inst.name + " · " + inst.clef + " clef";
    var b = byId("back");
    if (b) { b.href = "instrument.html?i=" + inst.id; b.textContent = "← " + inst.name + " activities"; }
    var sel = byId("range");
    if (sel) {
      sel.innerHTML = "";
      Object.keys(inst.ranges).forEach(function (k) {
        var o = document.createElement("option");
        o.value = k; o.textContent = inst.ranges[k].label;
        sel.appendChild(o);
      });
      sel.value = inst.defaultRange;
    }
  }

  /* ---------- sound ---------- */
  var audio = (function () {
    var ctx = null, voice = null;

    function ensure() {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }
    function stop() {
      if (!voice || !ctx) { voice = null; return; }
      var v = voice; voice = null;
      try {
        var t = ctx.currentTime;
        v.out.gain.cancelScheduledValues(t);
        v.out.gain.setValueAtTime(v.out.gain.value, t);
        v.out.gain.linearRampToValueAtTime(0.0001, t + 0.06);
        v.oscs.forEach(function (o) { try { o.stop(t + 0.08); } catch (e) {} });
      } catch (e) {}
    }

    // Plays the note as the instrument sounds it: written pitch plus inst.transpose semitones.
    function play(n, dur, inst) {
      var c = ensure();
      if (!c) return;
      stop();
      var sax = !!(inst && inst.timbre === "sax");
      var T = dur || 2.2;
      var t = c.currentTime + 0.02;
      var f = 440 * Math.pow(2, (n.midi + ((inst && inst.transpose) || 0) - 69) / 12);

      var att = sax ? 0.05 : 0.1, level = sax ? 0.34 : 0.3;
      var out = c.createGain();
      out.gain.setValueAtTime(0.0001, t);
      out.gain.linearRampToValueAtTime(level, t + att);
      out.gain.setValueAtTime(level, t + T - 0.4);
      out.gain.linearRampToValueAtTime(0.0001, t + T);

      var lp = c.createBiquadFilter();
      lp.type = "lowpass";
      if (sax) {
        lp.Q.value = 0.8;
        lp.frequency.setValueAtTime(Math.max(f * 4, 1000), t);
        lp.frequency.linearRampToValueAtTime(Math.max(f * 7, 2400), t + 0.12);
        lp.frequency.linearRampToValueAtTime(Math.max(f * 5.5, 1900), t + T);
      } else {
        lp.Q.value = 1.4;
        lp.frequency.setValueAtTime(f * 2.2, t);
        lp.frequency.linearRampToValueAtTime(f * 8, t + 0.18);
        lp.frequency.linearRampToValueAtTime(f * 5, t + T);
      }
      lp.connect(out); out.connect(c.destination);

      var head = lp;
      if (sax) {   // a gentle body resonance around 1.1 kHz
        var pk = c.createBiquadFilter();
        pk.type = "peaking"; pk.frequency.value = 1100; pk.Q.value = 1.1; pk.gain.value = 5;
        pk.connect(lp); head = pk;
      }

      var oscs = [];
      var lfo = c.createOscillator();
      lfo.frequency.value = sax ? 5.8 : 5.3;
      var lfoGain = c.createGain();
      lfoGain.gain.setValueAtTime(0, t);
      if (sax) {                                   // vibrato arrives late and stays light
        lfoGain.gain.setValueAtTime(0, t + 0.5);
        lfoGain.gain.linearRampToValueAtTime(5, t + 1.1);
      } else {
        lfoGain.gain.linearRampToValueAtTime(7, t + 0.9);
      }
      lfo.connect(lfoGain);
      lfo.start(t); lfo.stop(t + T + 0.05); oscs.push(lfo);

      var mix = sax
        ? [["sawtooth", 3, 0.5], ["sawtooth", -3, 0.3], ["square", 0, 0.2]]
        : [["sawtooth", -4, 0.5], ["sawtooth", 5, 0.4], ["square", 0, 0.12]];
      mix.forEach(function (p) {
        var o = c.createOscillator();
        o.type = p[0]; o.frequency.value = f; o.detune.value = p[1];
        lfoGain.connect(o.detune);
        var g = c.createGain(); g.gain.value = p[2];
        o.connect(g); g.connect(head);
        o.start(t); o.stop(t + T + 0.05); oscs.push(o);
      });

      if (sax) {   // a little breath noise
        var nb = c.createBuffer(1, c.sampleRate, c.sampleRate), d = nb.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        var ns = c.createBufferSource();
        ns.buffer = nb; ns.loop = true;
        var bp = c.createBiquadFilter();
        bp.type = "bandpass"; bp.frequency.value = 2800; bp.Q.value = 0.8;
        var ng = c.createGain(); ng.gain.value = 0.04;
        ns.connect(bp); bp.connect(ng); ng.connect(out);
        ns.start(t); ns.stop(t + T + 0.05); oscs.push(ns);
      }
      voice = { out: out, oscs: oscs };
    }
    return { ensure: ensure, play: play, stop: stop };
  })();

  window.TN = window.TN || {};
  var api = {
    LETTERS: LETTERS, CLEFS: CLEFS,
    pitchClass: pitchClass, makeNote: makeNote, stepOf: stepOf,
    noteFromStep: noteFromStep, sameNote: sameNote,
    accSymbol: accSymbol, noteName: noteName, labelHTML: labelHTML,
    notesInRange: notesInRange, pick: pick,
    stepBounds: stepBounds, viewFor: viewFor,
    buildStave: buildStave, mini: mini,
    getInstrument: getInstrument, pageSetup: pageSetup,
    audio: audio
  };
  for (var k in api) { if (api.hasOwnProperty(k)) window.TN[k] = api[k]; }
})();
