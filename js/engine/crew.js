/**
 * Robot crew: buyable characters for older learners, each customizable with
 * shared upgrades (colourways, finishes, glow, eyes, hard-light hair, back
 * gear, gear, decals, auras) and emotes.
 *
 * Every item has a tier:
 *   common    - free
 *   rare      - costs stars
 *   epic      - costs stars and needs a level passed first
 *   legendary - cannot be bought; unlocked by earning a badge
 * Items are bought once and work on every character.
 *
 * Saved on the rewards record:
 *   companion: 'pip' | 'bolt' | characterId   (who is shown)
 *   crewStarter: characterId                   (the one free character)
 *   crew: { emote, chars: { [characterId]: { name, parts: { [slot]: itemId } } } }
 * Bought characters and items go into rewards.owned, like shop items.
 *
 * Pure and DOM-free; repo.js saves, ui/components/crew.js draws.
 */

import { spendStars, currentStreak } from './rewards.js';
import { usesRobot, cleanRobotName } from './robot.js';

/* ------------------------------------------------------------------ */
/* Characters                                                          */
/* ------------------------------------------------------------------ */

/**
 * `base` picks the body drawing; `girl` picks that body's girl version.
 * `signature` is the character's own colourway (always free on it).
 */
export const CHARACTERS = Object.freeze([
  {
    id: 'vanguard', base: 'vanguard', girl: false, name: 'Vanguard', price: 150,
    blurb: 'Armoured android with a visor face.',
    signature: { main: '#e9eef5', dark: '#1a2030', trim: '#ff4d6d', glow: '#38e1ff' }, hair: 'swept', eyes: 'slit',
  },
  {
    id: 'nova', base: 'vanguard', girl: true, name: 'Nova', price: 150,
    blurb: 'Armoured android with a hard-light ponytail.',
    signature: { main: '#f3f0ff', dark: '#221a33', trim: '#b48cff', glow: '#ff7ad9' }, hair: 'ponytail', eyes: 'slit',
  },
  {
    id: 'ace', base: 'drone', girl: false, name: 'Hover Ace', price: 200,
    blurb: 'Flying drone with wing blades and a thruster.',
    signature: { main: '#eef1f6', dark: '#262b38', trim: '#7c5cff', glow: '#ffb020' }, hair: 'none', eyes: 'round',
  },
  {
    id: 'aria', base: 'drone', girl: true, name: 'Aria', price: 200,
    blurb: 'Flying drone with petal wings and hard-light buns.',
    signature: { main: '#ffe3ef', dark: '#2a2035', trim: '#ff5fa2', glow: '#7ef0ff' }, hair: 'buns', eyes: 'round',
  },
  {
    id: 'dash', base: 'street', girl: false, name: 'Dash', price: 250,
    blurb: 'Street robot in a hoodie, cargo pants and sneakers.',
    signature: { main: '#ff5a36', dark: '#2a3140', trim: '#f2f4f8', glow: '#39ff9e' }, hair: 'none', eyes: 'pixel',
  },
  {
    id: 'kira', base: 'street', girl: true, name: 'Kira', price: 250,
    blurb: 'Street robot in a hoodie, pleated skirt and long hard-light hair.',
    signature: { main: '#a78bfa', dark: '#1d2233', trim: '#ffffff', glow: '#ff7ad9' }, hair: 'long', eyes: 'pixel',
  },
]);

const CHAR_BY_ID = new Map(CHARACTERS.map((c) => [c.id, c]));
export const characterById = (id) => CHAR_BY_ID.get(id) || null;
const charOwnedId = (id) => `ch-${id}`;

/* ------------------------------------------------------------------ */
/* Upgrades                                                            */
/* ------------------------------------------------------------------ */

/** Customization slots in the order the workshop shows them. */
export const CREW_SLOTS = Object.freeze([
  { id: 'colorway', icon: '🎨' },
  { id: 'finish', icon: '✨' },
  { id: 'glow', icon: '💡' },
  { id: 'eyes', icon: '👀' },
  { id: 'hair', icon: '💇' },
  { id: 'back', icon: '🪽' },
  { id: 'gear', icon: '🛹' },
  { id: 'decal', icon: '🏷️' },
  { id: 'aura', icon: '🌟' },
]);

const P = (main, dark, trim, glow) => ({ main, dark, trim, glow });

/**
 * Catalogue. `price` in stars; `level` = must pass that level first (epic);
 * `badge` = unlocked by that badge, never sold (legendary).
 * The first item of each slot is the default and is always free.
 */
export const CREW_ITEMS = Object.freeze([
  // Colourways ('signature' = the character's own colours)
  { id: 'cw-signature', slot: 'colorway', name: 'Signature', value: 'signature', price: 0 },
  { id: 'cw-arctic', slot: 'colorway', name: 'Arctic', value: P('#e9eef5', '#1a2030', '#ff4d6d', '#38e1ff'), price: 0 },
  { id: 'cw-stealth', slot: 'colorway', name: 'Stealth', value: P('#3b4252', '#11141c', '#8b5cf6', '#b6ff3b'), price: 0 },
  { id: 'cw-midnight', slot: 'colorway', name: 'Midnight', value: P('#28324a', '#151922', '#4fd1ff', '#4fd1ff'), price: 0 },
  { id: 'cw-solar', slot: 'colorway', name: 'Solar', value: P('#f4c542', '#202432', '#e8eef6', '#ff7a1a'), price: 40 },
  { id: 'cw-sakura', slot: 'colorway', name: 'Sakura', value: P('#ffc0d9', '#3a2a40', '#ff5fa2', '#ff8fd0'), price: 40 },
  { id: 'cw-toxic', slot: 'colorway', name: 'Toxic', value: P('#26332b', '#0c120e', '#b6ff3b', '#b6ff3b'), price: 50 },
  { id: 'cw-ocean', slot: 'colorway', name: 'Ocean', value: P('#2f80ed', '#0f1c33', '#7ee8fa', '#7ee8fa'), price: 50 },
  { id: 'cw-grape', slot: 'colorway', name: 'Grape', value: P('#8b5cf6', '#1d1630', '#ffe14d', '#59ffb4'), price: 60 },
  { id: 'cw-crimson', slot: 'colorway', name: 'Crimson', value: P('#c8102e', '#1a0f14', '#f2f2f2', '#ff3b3b'), price: 120, level: 20 },
  { id: 'cw-royal', slot: 'colorway', name: 'Royal', value: P('#1f2a6b', '#0d1230', '#ffd23a', '#ffd23a'), price: 150, level: 30 },
  { id: 'cw-gold', slot: 'colorway', name: 'Prime gold', value: P('#e2b33c', '#1d1a12', '#fff1a8', '#fff1a8'), price: 0, badge: 'boss-1' },
  { id: 'cw-shadow', slot: 'colorway', name: 'Shadow legend', value: P('#17191f', '#050608', '#ff2d55', '#ff2d55'), price: 0, badge: 'streak-7' },
  { id: 'cw-diamond', slot: 'colorway', name: 'Diamond', value: P('#dff6ff', '#22324a', '#9be7ff', '#ffffff'), price: 0, badge: 'level-50' },

  // Surface finish on the main colour
  { id: 'fn-matte', slot: 'finish', name: 'Matte', value: 'matte', price: 0 },
  { id: 'fn-metal', slot: 'finish', name: 'Metal', value: 'metal', price: 60 },
  { id: 'fn-carbon', slot: 'finish', name: 'Carbon', value: 'carbon', price: 80 },
  { id: 'fn-camo', slot: 'finish', name: 'Camo', value: 'camo', price: 140, level: 25 },
  { id: 'fn-holo', slot: 'finish', name: 'Holo', value: 'holo', price: 0, badge: 'topic-complete' },

  // Glow (eyes, seams, hair). 'colorway' keeps the colourway's own glow.
  { id: 'gl-colorway', slot: 'glow', name: 'Match colours', value: 'colorway', price: 0 },
  { id: 'gl-cyan', slot: 'glow', name: 'Cyan', value: '#38e1ff', price: 0 },
  { id: 'gl-lime', slot: 'glow', name: 'Lime', value: '#b6ff3b', price: 0 },
  { id: 'gl-amber', slot: 'glow', name: 'Amber', value: '#ffb020', price: 0 },
  { id: 'gl-pink', slot: 'glow', name: 'Pink', value: '#ff7ad9', price: 0 },
  { id: 'gl-violet', slot: 'glow', name: 'Violet', value: '#b48cff', price: 25 },
  { id: 'gl-ice', slot: 'glow', name: 'Ice', value: '#eaffff', price: 25 },
  { id: 'gl-red', slot: 'glow', name: 'Red', value: '#ff3b3b', price: 30 },
  { id: 'gl-rainbow', slot: 'glow', name: 'Rainbow', value: 'rainbow', price: 160, level: 40 },
  { id: 'gl-plasma', slot: 'glow', name: 'Plasma', value: 'plasma', price: 0, badge: 'gamer' },

  // Eye style on the face screen ('auto' = the character's own)
  { id: 'ey-auto', slot: 'eyes', name: 'Default', value: 'auto', price: 0 },
  { id: 'ey-slit', slot: 'eyes', name: 'Visor slits', value: 'slit', price: 0 },
  { id: 'ey-round', slot: 'eyes', name: 'Round', value: 'round', price: 0 },
  { id: 'ey-pixel', slot: 'eyes', name: 'Pixel', value: 'pixel', price: 0 },
  { id: 'ey-heart', slot: 'eyes', name: 'Hearts', value: 'heart', price: 40 },
  { id: 'ey-star', slot: 'eyes', name: 'Stars', value: 'star', price: 50 },

  // Hard-light hair ('auto' = the character's own)
  { id: 'hr-auto', slot: 'hair', name: 'Default', value: 'auto', price: 0 },
  { id: 'hr-none', slot: 'hair', name: 'None', value: 'none', price: 0 },
  { id: 'hr-swept', slot: 'hair', name: 'Swept back', value: 'swept', price: 0 },
  { id: 'hr-ponytail', slot: 'hair', name: 'Ponytail', value: 'ponytail', price: 0 },
  { id: 'hr-bob', slot: 'hair', name: 'Bob', value: 'bob', price: 0 },
  { id: 'hr-long', slot: 'hair', name: 'Long', value: 'long', price: 30 },
  { id: 'hr-twintails', slot: 'hair', name: 'Twin tails', value: 'twintails', price: 40 },
  { id: 'hr-buns', slot: 'hair', name: 'Buns', value: 'buns', price: 40 },
  { id: 'hr-spikes', slot: 'hair', name: 'Spikes', value: 'spikes', price: 50 },
  { id: 'hr-cables', slot: 'hair', name: 'Cables', value: 'cables', price: 60 },
  { id: 'hr-flame', slot: 'hair', name: 'Flame', value: 'flame', price: 0, badge: 'quest-10' },

  // Back gear
  { id: 'bk-none', slot: 'back', name: 'None', value: 'none', price: 0 },
  { id: 'bk-scarf', slot: 'back', name: 'Scarf', value: 'scarf', price: 0 },
  { id: 'bk-cape', slot: 'back', name: 'Cape', value: 'cape', price: 70 },
  { id: 'bk-jetpack', slot: 'back', name: 'Jetpack', value: 'jetpack', price: 90 },
  { id: 'bk-rotor', slot: 'back', name: 'Rotor pack', value: 'rotor', price: 140, level: 15 },
  { id: 'bk-wings', slot: 'back', name: 'Hard-light wings', value: 'wings', price: 180, level: 30 },
  { id: 'bk-phoenix', slot: 'back', name: 'Phoenix wings', value: 'phoenix', price: 0, badge: 'level-100' },

  // Gear (no weapons)
  { id: 'gr-none', slot: 'gear', name: 'None', value: 'none', price: 0 },
  { id: 'gr-headphones', slot: 'gear', name: 'Headphones', value: 'headphones', price: 0 },
  { id: 'gr-bag', slot: 'gear', name: 'Sports bag', value: 'bag', price: 40 },
  { id: 'gr-tablet', slot: 'gear', name: 'Holo tablet', value: 'tablet', price: 60 },
  { id: 'gr-skateboard', slot: 'gear', name: 'Skateboard', value: 'skateboard', price: 80 },
  { id: 'gr-hoverboard', slot: 'gear', name: 'Hoverboard', value: 'hoverboard', price: 160, level: 20 },

  // Decals on the chest
  { id: 'dc-none', slot: 'decal', name: 'None', value: 'none', price: 0 },
  { id: 'dc-stripes', slot: 'decal', name: 'Stripes', value: 'stripes', price: 0 },
  { id: 'dc-number', slot: 'decal', name: 'Number 07', value: 'number', price: 20 },
  { id: 'dc-star', slot: 'decal', name: 'Star', value: 'star', price: 30 },
  { id: 'dc-bolt', slot: 'decal', name: 'Bolt', value: 'bolt', price: 30 },
  { id: 'dc-flame', slot: 'decal', name: 'Flames', value: 'flame', price: 90, level: 10 },
  { id: 'dc-crown', slot: 'decal', name: 'Crown crest', value: 'crown', price: 0, badge: 'first-mastered' },

  // Aura (grows with the daily streak)
  { id: 'au-none', slot: 'aura', name: 'None', value: 'none', price: 0 },
  { id: 'au-sparks', slot: 'aura', name: 'Sparks', value: 'sparks', price: 60 },
  { id: 'au-rings', slot: 'aura', name: 'Rings', value: 'rings', price: 80 },
  { id: 'au-flame', slot: 'aura', name: 'Flame', value: 'flame', price: 150, level: 30 },
  { id: 'au-lightning', slot: 'aura', name: 'Lightning', value: 'lightning', price: 0, badge: 'speedy' },
  { id: 'au-rainbow', slot: 'aura', name: 'Rainbow', value: 'rainbow', price: 0, badge: 'stars-500' },
]);

/**
 * Emotes: a move plus a face. The equipped one plays when the robot
 * celebrates (right answers, good results); any owned one can be played
 * in the workshop.
 */
export const EMOTES = Object.freeze([
  { id: 'em-jump', name: 'Jump', value: 'jump', face: 'happy', price: 0 },
  { id: 'em-wave', name: 'Wave', value: 'wave', face: 'happy', price: 0 },
  { id: 'em-thumbs', name: 'Thumbs up', value: 'thumbs', face: 'wink', price: 0 },
  { id: 'em-nod', name: 'Nod', value: 'nod', face: 'neutral', price: 0 },
  { id: 'em-laugh', name: 'Laugh', value: 'laugh', face: 'laugh', price: 30 },
  { id: 'em-flex', name: 'Flex', value: 'flex', face: 'focused', price: 40 },
  { id: 'em-salute', name: 'Salute', value: 'salute', face: 'cool', price: 40 },
  { id: 'em-spin', name: 'Spin', value: 'spin', face: 'starry', price: 60 },
  { id: 'em-dance', name: 'Dance', value: 'dance', face: 'happy', price: 80 },
  { id: 'em-powerup', name: 'Power up', value: 'powerup', face: 'focused', price: 120, level: 10 },
  { id: 'em-backflip', name: 'Backflip', value: 'backflip', face: 'starry', price: 160, level: 40 },
  { id: 'em-victory', name: 'Victory', value: 'victory', face: 'starry', price: 0, badge: 'boss-1' },
  { id: 'em-hero', name: 'Hero landing', value: 'hero', face: 'cool', price: 0, badge: 'streak-7' },
]);

/** Faces the LED screen can show. */
export const EXPRESSIONS = Object.freeze(['neutral', 'happy', 'laugh', 'focused', 'surprised', 'wink', 'sleepy', 'sad', 'love', 'starry', 'cool', 'dizzy']);

/** Which faces fit each companion mood (the robot picks one). */
const MOOD_FACES = Object.freeze({
  happy: ['neutral'],
  cheer: ['happy', 'laugh', 'starry', 'love', 'wink'],
  think: ['focused'],
  oops: ['sad', 'surprised', 'dizzy'],
  sleep: ['sleepy'],
});

export const faceForMood = (mood, rng = Math.random) => {
  const faces = MOOD_FACES[mood] || MOOD_FACES.happy;
  return faces[Math.floor(rng() * faces.length)];
};

/** Learner ranks by lifetime stars (shown on the profile card). */
export const RANKS = Object.freeze([
  { min: 0, name: 'Rookie' },
  { min: 100, name: 'Cadet' },
  { min: 300, name: 'Pilot' },
  { min: 700, name: 'Ace' },
  { min: 1500, name: 'Commander' },
  { min: 3000, name: 'Legend' },
]);

export const rankOf = (stars = 0) => [...RANKS].reverse().find((r) => stars >= r.min);

const ITEM_BY_ID = new Map([...CREW_ITEMS, ...EMOTES.map((e) => ({ ...e, slot: 'emote' }))].map((i) => [i.id, i]));
const ITEMS_BY_SLOT = new Map(CREW_SLOTS.map((s) => [s.id, CREW_ITEMS.filter((i) => i.slot === s.id)]));

export const crewItemById = (id) => ITEM_BY_ID.get(id) || null;
export const crewItemsInSlot = (slot) => (slot === 'emote' ? EMOTES.map((e) => ITEM_BY_ID.get(e.id)) : ITEMS_BY_SLOT.get(slot) || []);

/** common | rare | epic | legendary */
export const tierOf = (item) => {
  if (item.badge) return 'legendary';
  if (item.level) return 'epic';
  return item.price > 0 ? 'rare' : 'common';
};

/** Has the learner passed level n? */
const passedLevel = (rewards, n) => (rewards?.levels?.[n] || 0) > 0;

/**
 * Where the learner stands with an item:
 *   'owned'  - can use it now
 *   'buy'    - can buy it (if they have the stars)
 *   'level'  - must pass item.level first
 *   'badge'  - earn item.badge to unlock it
 */
export const itemState = (rewards, item) => {
  if (!item) return 'badge';
  if (item.badge) return (rewards?.badges || []).includes(item.badge) ? 'owned' : 'badge';
  if (item.price === 0 || (rewards?.owned || []).includes(item.id)) return 'owned';
  if (item.level && !passedLevel(rewards, item.level)) return 'level';
  return 'buy';
};

export const ownsItem = (rewards, item) => itemState(rewards, item) === 'owned';

/* ------------------------------------------------------------------ */
/* Characters: owning and choosing                                     */
/* ------------------------------------------------------------------ */

export const ownsCharacter = (rewards, id) =>
  Boolean(CHAR_BY_ID.has(id) && (rewards?.crewStarter === id || (rewards?.owned || []).includes(charOwnedId(id))));

/** True while the learner can still take one character for free. */
export const starterAvailable = (rewards) => !CHARACTERS.some((c) => ownsCharacter(rewards, c.id));

/** Take the free starter character and show it. */
export const claimStarter = (rewards, id) => {
  if (!CHAR_BY_ID.has(id)) throw new Error('That character is not in the workshop.');
  if (!starterAvailable(rewards)) throw new Error('You already took your free character.');
  return { ...rewards, crewStarter: id, companion: id };
};

/** Buy a character with stars and show it. */
export const buyCharacter = (rewards, id) => {
  const ch = characterById(id);
  if (!ch) throw new Error('That character is not in the workshop.');
  if (ownsCharacter(rewards, id)) throw new Error('You already have this.');
  return { ...spendStars(rewards, ch.price), owned: [...(rewards.owned || []), charOwnedId(id)], companion: id };
};

/**
 * Who the learner sees: their chosen companion if valid, else the old
 * default (Pip for Kinder, Bolt the build-a-robot for everyone else).
 * @returns {'pip'|'bolt'|string}
 */
export const companionOf = (rewards, young = false) => {
  const chosen = rewards?.companion;
  if (chosen === 'pip' || chosen === 'bolt') return chosen;
  if (ownsCharacter(rewards, chosen)) return chosen;
  return usesRobot(rewards, young) ? 'bolt' : 'pip';
};

/** Show Pip, Bolt or an owned crew character. */
export const chooseCompanion = (rewards, id) => {
  if (id !== 'pip' && id !== 'bolt' && !ownsCharacter(rewards, id)) throw new Error('Get this character first.');
  const robot = { ...(rewards.robot && typeof rewards.robot === 'object' ? rewards.robot : {}) };
  // Keep the older robot.on switch in step, so nothing reading it disagrees.
  if (id === 'pip') robot.on = false;
  else robot.on = true;
  return { ...rewards, companion: id, robot };
};

/* ------------------------------------------------------------------ */
/* A character's look                                                  */
/* ------------------------------------------------------------------ */

const crewRecord = (rewards) => (rewards?.crew && typeof rewards.crew === 'object' ? rewards.crew : {});
const charRecord = (rewards, id) => {
  const rec = crewRecord(rewards).chars?.[id];
  return rec && typeof rec === 'object' ? rec : {};
};

/**
 * The item worn in each slot on a character, always valid: anything unknown,
 * in the wrong slot or not owned falls back to the slot's free default.
 */
export const crewParts = (rewards, id) => {
  const chosen = charRecord(rewards, id).parts || {};
  const parts = {};
  for (const { id: slot } of CREW_SLOTS) {
    const item = crewItemById(chosen[slot]);
    parts[slot] = item && item.slot === slot && ownsItem(rewards, item) ? item : ITEMS_BY_SLOT.get(slot)[0];
  }
  return parts;
};

/** The equipped celebration emote (falls back to Jump). */
export const crewEmote = (rewards) => {
  const item = crewItemById(crewRecord(rewards).emote);
  return item && item.slot === 'emote' && ownsItem(rewards, item) ? item : crewItemById('em-jump');
};

export const crewName = (rewards, id) => cleanRobotName(charRecord(rewards, id).name) || characterById(id)?.name || '';

/**
 * Everything the renderer needs for one character, as plain values.
 * @param {Object} rewards
 * @param {string} id Character id.
 * @param {Object} [override] slot -> item, to try something on.
 */
export const crewLook = (rewards, id, override = {}) => {
  const ch = characterById(id);
  if (!ch) return null;
  const parts = { ...crewParts(rewards, id), ...override };
  const palette = parts.colorway.value === 'signature' ? ch.signature : parts.colorway.value;
  const glow = parts.glow.value === 'colorway' ? palette.glow : parts.glow.value;
  return {
    id: ch.id,
    base: ch.base,
    girl: ch.girl,
    name: crewName(rewards, id),
    palette: { ...palette },
    glow,
    finish: parts.finish.value,
    eyes: parts.eyes.value === 'auto' ? ch.eyes : parts.eyes.value,
    hair: parts.hair.value === 'auto' ? ch.hair : parts.hair.value,
    back: parts.back.value,
    gear: parts.gear.value,
    decal: parts.decal.value,
    aura: parts.aura.value,
    emote: crewEmote(rewards).value,
    streak: currentStreak(rewards || {}),
  };
};

/* ------------------------------------------------------------------ */
/* Changing a character                                                */
/* ------------------------------------------------------------------ */

const withChar = (rewards, id, change) => {
  const crew = crewRecord(rewards);
  const current = charRecord(rewards, id);
  const parts = Object.fromEntries(Object.entries(crewParts(rewards, id)).map(([slot, item]) => [slot, item.id]));
  return { ...rewards, crew: { ...crew, chars: { ...(crew.chars || {}), [id]: change({ ...current, parts }) } } };
};

/** Fit an owned item on a character. */
export const wearCrewItem = (rewards, id, itemId) => {
  if (!characterById(id)) throw new Error('That character is not in the workshop.');
  const item = crewItemById(itemId);
  if (!item || item.slot === 'emote') throw new Error('That part is not in the workshop.');
  if (!ownsItem(rewards, item)) throw new Error('Unlock it first.');
  return withChar(rewards, id, (rec) => ({ ...rec, parts: { ...rec.parts, [item.slot]: item.id } }));
};

/** Buy a rare or epic item (or emote) once, for every character. */
export const buyCrewItem = (rewards, itemId) => {
  const item = crewItemById(itemId);
  if (!item) throw new Error('That part is not in the workshop.');
  const state = itemState(rewards, item);
  if (state === 'owned') throw new Error('You already have this.');
  if (state === 'badge') throw new Error('Earn the badge to unlock this.');
  if (state === 'level') throw new Error(`Pass level ${item.level} to unlock this.`);
  return { ...spendStars(rewards, item.price), owned: [...(rewards.owned || []), item.id] };
};

/** Set the emote the robot plays when it celebrates. */
export const setCrewEmote = (rewards, emoteId) => {
  const item = crewItemById(emoteId);
  if (!item || item.slot !== 'emote') throw new Error('That emote is not in the workshop.');
  if (!ownsItem(rewards, item)) throw new Error('Unlock it first.');
  return { ...rewards, crew: { ...crewRecord(rewards), emote: item.id } };
};

/** Rename a character (empty goes back to its own name). */
export const renameCrew = (rewards, id, name) => {
  if (!characterById(id)) throw new Error('That character is not in the workshop.');
  return withChar(rewards, id, (rec) => ({ ...rec, name: cleanRobotName(name) }));
};

/** Random look for a character from what the learner owns. */
export const surpriseCrew = (rewards, id, rng = Math.random) => {
  if (!characterById(id)) throw new Error('That character is not in the workshop.');
  return withChar(rewards, id, (rec) => {
    const parts = {};
    for (const { id: slot } of CREW_SLOTS) {
      const mine = ITEMS_BY_SLOT.get(slot).filter((i) => ownsItem(rewards, i));
      parts[slot] = mine[Math.floor(rng() * mine.length)].id;
    }
    return { ...rec, parts };
  });
};
