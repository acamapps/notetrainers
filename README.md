# Note Practice

Browser activities for learning to read the stave and hear how notes sound on your instrument. Plain HTML, CSS and JavaScript, with no build step and no dependencies.

Instruments so far: **trombone** (bass clef) and **tenor saxophone** (treble clef).

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Home. Choose an instrument. |
| `instrument.html?i=<id>` | The three activities for that instrument |
| `note-trainer.html?i=<id>` | Shows a note and its name, then plays it after a delay of 1 to 10 seconds. Repeats until stopped. |
| `name-the-note.html?i=<id>` | Shows a note on the stave. Pick its name. |
| `place-the-note.html?i=<id>` | Gives a note name. Tap or click where it goes on the stave. |

The activity pages are shared by every instrument. The `i` value in the address (`trombone`, `tenorsax`) picks which instrument they use, so open them from the menus rather than directly.

The two games cover each instrument's full written range by default, with the main octave and the notes inside the stave as alternatives. The Note Trainer uses the main octave.

## Run it on your computer

Unzip the folder and double-click `index.html`. Keep all the files together. It works without internet, apart from the fonts, which fall back to system fonts when offline.

## Publish on GitHub Pages

1. Create a repository and upload every file in this folder to its root, keeping `index.html` at the top level.
2. In the repository go to **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and the `/ (root)` folder, then save.
4. After a minute the site is live at `https://<your-username>.github.io/<repository-name>/`.

## Add an instrument

Everything instrument-specific is in `instruments.js`. Add an entry and add its id to `INSTRUMENT_ORDER`. The home page, the activity menu and all three activities pick it up with no other changes. Each entry sets:

- `clef`: `"bass"` or `"treble"`
- `transpose`: semitones from written to sounding pitch. Tenor sax is `-14`, a major ninth down. Use `0` for a non-transposing instrument.
- `timbre`: the playback tone, `"brass"` or `"sax"`. New tones are added in `common.js`, in `play()`.
- `ranges`: the written range as MIDI numbers (middle C = 60), for `full`, `octave` and `stave`.
- `reference`, `soundNote`, `blurb` and `demo`: the text and example notes shown on the pages.

## Notes

- Note names and the stave show written pitch. Playback is the sounding pitch, so on tenor sax the sound is a major ninth below the written note, as on the instrument.
- The tone is synthesised in the browser with the Web Audio API. It is an imitation, not a recording.
- On iPhone, web sound is silenced when the side switch is set to silent.
- The treble clef shape is taken from the GNU FreeFont serif face.
