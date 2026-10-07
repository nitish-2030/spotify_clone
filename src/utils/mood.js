// Mood of a song. It drives the colour theme of the whole app (see index.css, [data-mood]).
// A song gets its mood from (1) an explicit `song.mood` set by the source (e.g. a "Devotional" row),
// otherwise (2) keywords in the title / genre. No match = null = the normal green theme.

export const MOODS = [
  { id: "romantic", label: "Romantic", glyph: "♥" },
  { id: "devotional", label: "Devotional", glyph: "✦" },
  { id: "phonk", label: "Phonk & BGM", glyph: "◆" },
  { id: "sad", label: "Sad", glyph: "☂" },
];

export const MOOD_IDS = MOODS.map((m) => m.id);
export const moodInfo = (id) => MOODS.find((m) => m.id === id) ?? null;

// Checked in this order: "dil toot gaya" must be Sad, not Romantic.
const KEYWORDS = [
  [
    "devotional",
    /\b(bhajan|bhakti|aarti|aarti|arti|mantra|chalisa|stotra|stotram|shlok|kirtan|krishna|krishn|govind|gopal|hanuman|bajrang|shiv|shiva|shankar|mahadev|bholenath|ganesh|ganpati|durga|mata|sai baba|ram|sita|jai|namah|namo|om|waheguru|ardas|devi|maiya)\b/i,
  ],
  [
    "phonk",
    /\b(phonk|drift|bgm|montagem|funk|sigma|brazilian|cowbell|trap)\b/i,
  ],
  [
    "sad",
    /\b(sad|dard|judai|judaai|judaiyan|bewafa|bewafai|alvida|tanha|tanhai|rona|roya|royi|aansu|ansu|broken|tears|cry|lonely|goodbye|bikhar|toota|toot|tut|dukh|gum|ghum|bichhad|bichad|yaadein|yaad|kho|khoya|ashq|tadap|tadpa|zakhm|rulana|rulaya)\b/i,
  ],
  [
    "romantic",
    /\b(love|lovers|pyaar|pyar|ishq|ishqe|mohabbat|muhabbat|dil|sanam|jaanam|jaan|saajna|saajan|sajna|kesariya|tum hi ho|hum tum|romantic|heart|hearts|kiss|raataan|mehbooba|dilbar|bairiya|ishaara|chahun|chahat|rang|barsaat)\b/i,
  ],
];

const DEVOTIONAL_GENRE = /devotion|spiritual|bhajan|religious|gospel|mantra|kirtan/i;

export function detectMood(song) {
  if (!song) return null;
  if (song.genre && DEVOTIONAL_GENRE.test(song.genre)) return "devotional";
  const text = `${song.title ?? ""}`;
  for (const [id, re] of KEYWORDS) if (re.test(text)) return id;
  return null;
}

export function moodOf(song) {
  if (!song) return null;
  return MOOD_IDS.includes(song.mood) ? song.mood : detectMood(song);
}