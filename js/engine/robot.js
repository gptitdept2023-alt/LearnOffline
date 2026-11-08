/**
 * Robot companion: an original, build-your-own robot for older learners.
 * Each slot (head, eyes, arms...) holds one part. Free parts are always
 * available; upgrades cost stars from the same wallet as the shop.
 *
 * Saved on the rewards record as `robot`:
 *   { on?: boolean, name?: string, parts?: { [slot]: partId } }
 * Bought parts go into rewards.owned next to shop items, so badges, backups
 * and the wallet all keep working unchanged.
 *
 * Pure and DOM-free; repo.js saves the result, ui/components/robot.js draws it.
 */

import { spendStars } from './rewards.js';

export const DEFAULT_ROBOT_NAME = 'Bolt';
export const ROBOT_NAME_MAX = 14;

/** Slots in the order the creator shows them. `icon` labels the tab. */
export const ROBOT_SLOTS = Object.freeze([
  { id: 'head', icon: '🤖' },
  { id: 'eyes', icon: '👀' },
  { id: 'eyeColor', icon: '💡' },
  { id: 'hair', icon: '💇' },
  { id: 'paint', icon: '🎨' },
  { id: 'trim', icon: '✨' },
  { id: 'arms', icon: '💪' },
  { id: 'legs', icon: '🦿' },
  { id: 'hat', icon: '🎩' },
  { id: 'back', icon: '🎒' },
  { id: 'pet', icon: '🐾' },
]);

/**
 * Catalogue. `value` is what the renderer draws (a style name or a colour).
 * `legacy` is the old Pip shop item that already pays for this part, so
 * stars a child spent before the robot arrived are never lost.
 * The first price-0 part of each slot is that slot's default.
 */
export const ROBOT_PARTS = Object.freeze([
  // Head shapes
  { id: 'rb-head-pod', slot: 'head', name: 'Pod', value: 'pod', price: 0 },
  { id: 'rb-head-box', slot: 'head', name: 'Block', value: 'box', price: 0 },
  { id: 'rb-head-visor', slot: 'head', name: 'Sleek visor', value: 'visor', price: 0 },
  { id: 'rb-head-fin', slot: 'head', name: 'Fin ears', value: 'fin', price: 40 },
  { id: 'rb-head-dome', slot: 'head', name: 'Glass dome', value: 'dome', price: 80 },
  { id: 'rb-head-knight', slot: 'head', name: 'Knight helm', value: 'knight', price: 120 },

  // Eye styles on the face screen
  { id: 'rb-eyes-round', slot: 'eyes', name: 'Round', value: 'round', price: 0 },
  { id: 'rb-eyes-pixel', slot: 'eyes', name: 'Pixel', value: 'pixel', price: 0 },
  { id: 'rb-eyes-sharp', slot: 'eyes', name: 'Sharp', value: 'sharp', price: 0 },
  { id: 'rb-eyes-heart', slot: 'eyes', name: 'Hearts', value: 'heart', price: 50 },
  { id: 'rb-eyes-star', slot: 'eyes', name: 'Stars', value: 'star', price: 60 },
  { id: 'rb-eyes-cyclops', slot: 'eyes', name: 'Big lens', value: 'cyclops', price: 100 },

  // Eye glow colour
  { id: 'rb-eye-cyan', slot: 'eyeColor', name: 'Cyan', value: '#35e0ff', price: 0 },
  { id: 'rb-eye-lime', slot: 'eyeColor', name: 'Lime', value: '#9dff4a', price: 0 },
  { id: 'rb-eye-amber', slot: 'eyeColor', name: 'Amber', value: '#ffb52e', price: 0 },
  { id: 'rb-eye-pink', slot: 'eyeColor', name: 'Pink', value: '#ff6bd3', price: 0 },
  { id: 'rb-eye-violet', slot: 'eyeColor', name: 'Violet', value: '#b98bff', price: 25 },
  { id: 'rb-eye-white', slot: 'eyeColor', name: 'Ice white', value: '#f2fbff', price: 25 },
  { id: 'rb-eye-rainbow', slot: 'eyeColor', name: 'Rainbow', value: 'rainbow', price: 120 },

  // Hair: metal plates and cables, coloured with the glow (trim) colour
  { id: 'rb-hair-antenna', slot: 'hair', name: 'Antenna', value: 'antenna', price: 0 },
  { id: 'rb-hair-none', slot: 'hair', name: 'None', value: 'none', price: 0 },
  { id: 'rb-hair-spikes', slot: 'hair', name: 'Spikes', value: 'spikes', price: 0 },
  { id: 'rb-hair-ponytail', slot: 'hair', name: 'Cable ponytail', value: 'ponytail', price: 40 },
  { id: 'rb-hair-buns', slot: 'hair', name: 'Twin buns', value: 'buns', price: 40 },
  { id: 'rb-hair-mohawk', slot: 'hair', name: 'Fin mohawk', value: 'mohawk', price: 60 },
  { id: 'rb-hair-cables', slot: 'hair', name: 'Long cables', value: 'cables', price: 80 },

  // Body paint
  { id: 'rb-paint-steel', slot: 'paint', name: 'Steel', value: '#b9c4d2', price: 0 },
  { id: 'rb-paint-white', slot: 'paint', name: 'Snow', value: '#eef2f7', price: 0 },
  { id: 'rb-paint-carbon', slot: 'paint', name: 'Carbon', value: '#3a4150', price: 0 },
  { id: 'rb-paint-navy', slot: 'paint', name: 'Navy', value: '#2f4a7a', price: 0 },
  { id: 'rb-paint-sky', slot: 'paint', name: 'Sky blue', value: '#4f9dff', price: 15, legacy: 'color-sky' },
  { id: 'rb-paint-mint', slot: 'paint', name: 'Mint', value: '#3cc9a0', price: 15, legacy: 'color-mint' },
  { id: 'rb-paint-berry', slot: 'paint', name: 'Berry', value: '#e05297', price: 25, legacy: 'color-berry' },
  { id: 'rb-paint-sun', slot: 'paint', name: 'Sunshine', value: '#ffc23d', price: 25, legacy: 'color-sun' },
  { id: 'rb-paint-grape', slot: 'paint', name: 'Grape', value: '#9a6cf0', price: 40, legacy: 'color-grape' },
  { id: 'rb-paint-chrome', slot: 'paint', name: 'Chrome', value: 'chrome', price: 120 },
  { id: 'rb-paint-rainbow', slot: 'paint', name: 'Rainbow', value: 'rainbow', price: 150, legacy: 'color-rainbow' },
  { id: 'rb-paint-gold', slot: 'paint', name: 'Gold', value: 'gold', price: 180 },

  // Glow trim: joints, chest core, hair
  { id: 'rb-trim-cyan', slot: 'trim', name: 'Cyan', value: '#22c7e8', price: 0 },
  { id: 'rb-trim-orange', slot: 'trim', name: 'Orange', value: '#ff8a2a', price: 0 },
  { id: 'rb-trim-purple', slot: 'trim', name: 'Purple', value: '#8a5cff', price: 0 },
  { id: 'rb-trim-red', slot: 'trim', name: 'Red', value: '#ff4d5e', price: 0 },
  { id: 'rb-trim-green', slot: 'trim', name: 'Green', value: '#3ed67a', price: 20 },
  { id: 'rb-trim-yellow', slot: 'trim', name: 'Yellow', value: '#ffd23a', price: 20 },
  { id: 'rb-trim-black', slot: 'trim', name: 'Shadow', value: '#20242e', price: 30 },

  // Arms
  { id: 'rb-arms-basic', slot: 'arms', name: 'Standard', value: 'basic', price: 0 },
  { id: 'rb-arms-piston', slot: 'arms', name: 'Pistons', value: 'piston', price: 40 },
  { id: 'rb-arms-gauntlet', slot: 'arms', name: 'Power gauntlets', value: 'gauntlet', price: 70 },
  { id: 'rb-arms-wrench', slot: 'arms', name: 'Tool arm', value: 'wrench', price: 90 },
  { id: 'rb-arms-thruster', slot: 'arms', name: 'Thruster arms', value: 'thruster', price: 130 },

  // Legs
  { id: 'rb-legs-basic', slot: 'legs', name: 'Standard', value: 'basic', price: 0 },
  { id: 'rb-legs-spring', slot: 'legs', name: 'Springs', value: 'spring', price: 40 },
  { id: 'rb-legs-boots', slot: 'legs', name: 'Mech boots', value: 'boots', price: 70 },
  { id: 'rb-legs-hover', slot: 'legs', name: 'Hover jet', value: 'hover', price: 100 },
  { id: 'rb-legs-treads', slot: 'legs', name: 'Tank treads', value: 'treads', price: 120 },

  // Headgear
  { id: 'rb-hat-none', slot: 'hat', name: 'None', value: 'none', price: 0 },
  { id: 'rb-hat-headphones', slot: 'hat', name: 'Headphones', value: 'headphones', price: 0 },
  { id: 'rb-hat-cap', slot: 'hat', name: 'Cap', value: 'cap', price: 20, legacy: 'hat-cap' },
  { id: 'rb-hat-bow', slot: 'hat', name: 'Bow', value: 'bow', price: 20, legacy: 'hat-bow' },
  { id: 'rb-hat-flower', slot: 'hat', name: 'Flower', value: 'flower', price: 30, legacy: 'hat-flower' },
  { id: 'rb-hat-top', slot: 'hat', name: 'Top hat', value: 'tophat', price: 50, legacy: 'hat-top' },
  { id: 'rb-hat-grad', slot: 'hat', name: 'Graduate', value: 'grad', price: 80, legacy: 'hat-grad' },
  { id: 'rb-hat-halo', slot: 'hat', name: 'Halo', value: 'halo', price: 100 },
  { id: 'rb-hat-crown', slot: 'hat', name: 'Crown', value: 'crown', price: 200, legacy: 'hat-crown' },

  // Back and neck gear
  { id: 'rb-back-none', slot: 'back', name: 'None', value: 'none', price: 0 },
  { id: 'rb-back-scarf', slot: 'back', name: 'Scarf', value: 'scarf', price: 0 },
  { id: 'rb-back-cape', slot: 'back', name: 'Cape', value: 'cape', price: 60 },
  { id: 'rb-back-jetpack', slot: 'back', name: 'Jetpack', value: 'jetpack', price: 90 },
  { id: 'rb-back-wings', slot: 'back', name: 'Energy wings', value: 'wings', price: 150 },

  // Robot pets: the old pets came back as robots
  { id: 'rb-pet-none', slot: 'pet', name: 'None', value: 'none', price: 0 },
  { id: 'rb-pet-orb', slot: 'pet', name: 'Orb drone', value: 'orb', price: 0 },
  { id: 'rb-pet-chick', slot: 'pet', name: 'Robo chick', value: 'chick', price: 30, legacy: 'pet-chick' },
  { id: 'rb-pet-cat', slot: 'pet', name: 'Robo kitten', value: 'cat', price: 40, legacy: 'pet-cat' },
  { id: 'rb-pet-dog', slot: 'pet', name: 'Robo puppy', value: 'dog', price: 40, legacy: 'pet-dog' },
  { id: 'rb-pet-bunny', slot: 'pet', name: 'Robo bunny', value: 'bunny', price: 60, legacy: 'pet-bunny' },
  { id: 'rb-pet-turtle', slot: 'pet', name: 'Robo turtle', value: 'turtle', price: 80, legacy: 'pet-turtle' },
  { id: 'rb-pet-spider', slot: 'pet', name: 'Spider bot', value: 'spider', price: 90 },
  { id: 'rb-pet-dino', slot: 'pet', name: 'Robo dino', value: 'dino', price: 120, legacy: 'pet-dino' },
]);

const byId = new Map(ROBOT_PARTS.map((p) => [p.id, p]));
const byLegacy = new Map(ROBOT_PARTS.filter((p) => p.legacy).map((p) => [p.legacy, p]));
const bySlot = new Map(ROBOT_SLOTS.map((s) => [s.id, ROBOT_PARTS.filter((p) => p.slot === s.id)]));
const DEFAULTS = Object.freeze(Object.fromEntries(ROBOT_SLOTS.map((s) => [s.id, bySlot.get(s.id).find((p) => p.price === 0)])));

/** Old Pip slot -> robot slot, used to dress a brand-new robot like Pip was. */
const LEGACY_SLOT = Object.freeze({ color: 'paint', hat: 'hat', pet: 'pet' });

export const partById = (id) => byId.get(id) || null;

export const partsInSlot = (slot) => bySlot.get(slot) || [];

export const isRobotSlot = (slot) => bySlot.has(slot);

/** True when the child may use this part: it is free, bought, or paid for by an old Pip item. */
export const ownsPart = (rewards, part) => {
  if (!part) return false;
  if (part.price === 0) return true;
  const owned = rewards?.owned || [];
  return owned.includes(part.id) || Boolean(part.legacy && owned.includes(part.legacy));
};

/**
 * Should this learner see the robot? Their own choice wins; otherwise
 * Kinder (young) learners keep Pip and everyone else gets the robot.
 */
export const usesRobot = (rewards, young = false) =>
  (typeof rewards?.robot?.on === 'boolean' ? rewards.robot.on : !young);

/** A clean robot name: trimmed, single-spaced, no control characters, at most ROBOT_NAME_MAX letters. */
export const cleanRobotName = (name) => {
  // eslint-disable-next-line no-control-regex
  const text = String(name ?? '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  return [...text].slice(0, ROBOT_NAME_MAX).join('').trim();
};

export const robotName = (rewards) => cleanRobotName(rewards?.robot?.name) || DEFAULT_ROBOT_NAME;

/**
 * The part worn in each slot, always valid. Anything missing, unknown, in the
 * wrong slot or not owned (for example from an edited backup) falls back to
 * what Pip wore, then to the slot's free default.
 * @returns {Object<string, Object>} slot -> part
 */
export const robotParts = (rewards) => {
  const chosen = rewards?.robot?.parts && typeof rewards.robot.parts === 'object' ? rewards.robot.parts : {};
  const fromPip = {};
  for (const [legacySlot, slot] of Object.entries(LEGACY_SLOT)) {
    const part = byLegacy.get(rewards?.equipped?.[legacySlot]);
    if (part && part.slot === slot) fromPip[slot] = part;
  }
  const parts = {};
  for (const { id: slot } of ROBOT_SLOTS) {
    const part = partById(chosen[slot]);
    parts[slot] = part && part.slot === slot && ownsPart(rewards, part)
      ? part
      : (fromPip[slot] && ownsPart(rewards, fromPip[slot]) ? fromPip[slot] : DEFAULTS[slot]);
  }
  return parts;
};

/** What the renderer needs: { name, head, eyes, eyeColor, ... } as drawable values. */
export const robotLook = (rewards) => {
  const look = { name: robotName(rewards) };
  for (const [slot, part] of Object.entries(robotParts(rewards))) look[slot] = part.value;
  return look;
};

/** The robot record with the current (valid) parts written out, ready to change. */
const robotRecord = (rewards) => ({
  ...(rewards.robot && typeof rewards.robot === 'object' ? rewards.robot : {}),
  parts: Object.fromEntries(Object.entries(robotParts(rewards)).map(([slot, part]) => [slot, part.id])),
});

/** Wear a part the child owns (free parts included). */
export const wearPart = (rewards, partId) => {
  const part = partById(partId);
  if (!part) throw new Error('That part is not in the workshop.');
  if (!ownsPart(rewards, part)) throw new Error('Buy it first.');
  const robot = robotRecord(rewards);
  return { ...rewards, robot: { ...robot, parts: { ...robot.parts, [part.slot]: part.id } } };
};

/** Buy an upgrade and fit it straight away. */
export const buyPart = (rewards, partId) => {
  const part = partById(partId);
  if (!part) throw new Error('That part is not in the workshop.');
  if (ownsPart(rewards, part)) throw new Error('You already have this.');
  const paid = spendStars(rewards, part.price);
  return wearPart({ ...paid, owned: [...(rewards.owned || []), part.id] }, part.id);
};

/** Switch between the robot (true) and Pip (false). */
export const setRobotOn = (rewards, on) => ({ ...rewards, robot: { ...robotRecord(rewards), on: Boolean(on) } });

/** Rename the robot. An empty name goes back to the default. */
export const setRobotName = (rewards, name) => ({ ...rewards, robot: { ...robotRecord(rewards), name: cleanRobotName(name) } });

/**
 * A random robot from the parts the child owns ("Surprise me").
 * @param {() => number} [rng]
 */
export const surpriseParts = (rewards, rng = Math.random) => {
  const robot = robotRecord(rewards);
  const parts = {};
  for (const { id: slot } of ROBOT_SLOTS) {
    const mine = partsInSlot(slot).filter((p) => ownsPart(rewards, p));
    parts[slot] = mine[Math.floor(rng() * mine.length)].id;
  }
  return { ...rewards, robot: { ...robot, parts } };
};
