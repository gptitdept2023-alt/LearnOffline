/**
 * The reward shop: stars buy looks for Pip, the learner's companion.
 * Items are cosmetic only, so buying never changes learning.
 * Pure and DOM-free; repo.js saves the result.
 */

/** Slots Pip can wear. Each slot holds one item at a time. */
export const SLOTS = Object.freeze([
  { id: 'color', title: 'Colours', icon: '🎨' },
  { id: 'hat', title: 'Hats', icon: '🎩' },
  { id: 'pet', title: 'Pets', icon: '🐾' },
  { id: 'scene', title: 'Places', icon: '🏝️' },
]);

/**
 * Catalogue. `value` is what the mascot uses: a colour, an emoji or a scene name.
 * Prices rise slowly so there is always something close to buy.
 */
export const ITEMS = Object.freeze([
  { id: 'color-sky', slot: 'color', name: 'Sky blue', value: '#4f9dff', price: 15 },
  { id: 'color-mint', slot: 'color', name: 'Mint', value: '#3cc9a0', price: 15 },
  { id: 'color-berry', slot: 'color', name: 'Berry', value: '#e05297', price: 25 },
  { id: 'color-sun', slot: 'color', name: 'Sunshine', value: '#ffc23d', price: 25 },
  { id: 'color-grape', slot: 'color', name: 'Grape', value: '#9a6cf0', price: 40 },
  { id: 'color-rainbow', slot: 'color', name: 'Rainbow', value: 'rainbow', price: 150 },

  { id: 'hat-cap', slot: 'hat', name: 'Cap', value: '🧢', price: 20 },
  { id: 'hat-bow', slot: 'hat', name: 'Bow', value: '🎀', price: 20 },
  { id: 'hat-flower', slot: 'hat', name: 'Flower', value: '🌸', price: 30 },
  { id: 'hat-top', slot: 'hat', name: 'Top hat', value: '🎩', price: 50 },
  { id: 'hat-grad', slot: 'hat', name: 'Graduate', value: '🎓', price: 80 },
  { id: 'hat-crown', slot: 'hat', name: 'Crown', value: '👑', price: 200 },

  { id: 'pet-chick', slot: 'pet', name: 'Chick', value: '🐥', price: 30 },
  { id: 'pet-cat', slot: 'pet', name: 'Kitten', value: '🐱', price: 40 },
  { id: 'pet-dog', slot: 'pet', name: 'Puppy', value: '🐶', price: 40 },
  { id: 'pet-bunny', slot: 'pet', name: 'Bunny', value: '🐰', price: 60 },
  { id: 'pet-turtle', slot: 'pet', name: 'Turtle', value: '🐢', price: 80 },
  { id: 'pet-dino', slot: 'pet', name: 'Dino', value: '🦖', price: 120 },

  { id: 'scene-meadow', slot: 'scene', name: 'Meadow', value: 'meadow', price: 30 },
  { id: 'scene-beach', slot: 'scene', name: 'Beach', value: 'beach', price: 50 },
  { id: 'scene-space', slot: 'scene', name: 'Space', value: 'space', price: 100 },
  { id: 'scene-candy', slot: 'scene', name: 'Candy land', value: 'candy', price: 150 },
]);

const byId = new Map(ITEMS.map((i) => [i.id, i]));

export const itemById = (id) => byId.get(id) || null;

export const itemsInSlot = (slot) => ITEMS.filter((i) => i.slot === slot);

/** The mascot's look from what is equipped: { color, hat, pet, scene } values. */
export const lookOf = (rewards) => {
  const look = {};
  for (const [slot, id] of Object.entries(rewards?.equipped || {})) {
    const item = itemById(id);
    if (item && item.slot === slot) look[slot] = item.value;
  }
  return look;
};

/**
 * Buy an item and wear it straight away.
 * @throws {Error} with a child-friendly message if it cannot be bought.
 */
export const buy = (rewards, itemId) => {
  const item = itemById(itemId);
  if (!item) throw new Error('That item is not in the shop.');
  const owned = rewards.owned || [];
  if (owned.includes(itemId)) throw new Error('You already have this.');
  const wallet = rewards.stars - (rewards.spentStars || 0);
  if (wallet < item.price) throw new Error(`You need ${item.price - wallet} more stars.`);
  return {
    ...rewards,
    spentStars: (rewards.spentStars || 0) + item.price,
    owned: [...owned, itemId],
    equipped: { ...(rewards.equipped || {}), [item.slot]: itemId },
  };
};

/** Wear an owned item, or take a slot off with itemId = null. */
export const equip = (rewards, slot, itemId) => {
  const equipped = { ...(rewards.equipped || {}) };
  if (itemId === null) {
    delete equipped[slot];
  } else {
    const item = itemById(itemId);
    if (!item || item.slot !== slot) throw new Error('That does not go there.');
    if (!(rewards.owned || []).includes(itemId)) throw new Error('Buy it first.');
    equipped[slot] = itemId;
  }
  return { ...rewards, equipped };
};
