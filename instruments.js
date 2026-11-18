/* The instruments offered by Note Practice.

   To add an instrument, add an entry below and its id to INSTRUMENT_ORDER.
   The home page, the activity menu and all three activities are built from this list.

   clef        "bass" or "treble"
   transpose   semitones from written pitch to sounding pitch (0 = sounds as written)
   timbre      "brass" or "sax", the tone used for playback
   ranges      written range as MIDI numbers (middle C = 60 = C4), with a menu label and a short form.
               Every instrument needs "full", "octave" and "stave".
   demo        [letter, accidental, octave] shown in the menu pictures
*/
(function () {
  "use strict";
  var FLAT = "♭", SHARP = "♯";

  window.TN = window.TN || {};

  TN.INSTRUMENTS = {
    trombone: {
      id: "trombone",
      name: "Trombone 🪊",
      clef: "bass",
      transpose: 0,
      timbre: "brass",
      ranges: {
        full:   { lo: 40, hi: 72, label: "Full range (E2 to C5)",       short: "E2 to C5" },
        octave: { lo: 48, hi: 60, label: "Main octave (C3 to C4)",      short: "C3 to C4" },
        stave:  { lo: 43, hi: 57, label: "Inside the stave (G2 to A3)", short: "G2 to A3" }
      },
      defaultRange: "full",
      trainerRange: "octave",
      blurb: "Read in bass clef. Written range E2 to C5.",
      reference: "The bottom line is G2, the top line is A3, and middle C is C4.",
      soundNote: "Notes sound at concert pitch, which is also the written pitch for trombone.",
      demo: { trainer: ["F", "", 3], name: ["A", "", 2], place: ["B", "b", 3] }
    },

    tenorsax: {
      id: "tenorsax",
      name: "Tenor saxophone 🎷",
      clef: "treble",
      transpose: -14,
      timbre: "sax",
      ranges: {
        full:   { lo: 58, hi: 90, label: "Full range (B" + FLAT + "3 to F" + SHARP + "6)", short: "B" + FLAT + "3 to F" + SHARP + "6" },
        octave: { lo: 60, hi: 72, label: "Main octave (C4 to C5)",      short: "C4 to C5" },
        stave:  { lo: 64, hi: 77, label: "Inside the stave (E4 to F5)", short: "E4 to F5" }
      },
      defaultRange: "full",
      trainerRange: "octave",
      blurb: "Read in treble clef. Written range B" + FLAT + "3 to F" + SHARP + "6, sounding a major ninth lower.",
      reference: "The bottom line is E4, the top line is F5, and middle C (C4) sits on a ledger line below the stave.",
      soundNote: "Written pitch for B" + FLAT + " tenor saxophone. Each note sounds a major ninth (an octave and a tone) lower than written, as it does on the instrument.",
      demo: { trainer: ["G", "", 4], name: ["C", "", 5], place: ["B", "b", 4] }
    }
  };

  TN.INSTRUMENT_ORDER = ["trombone", "tenorsax"];
})();
