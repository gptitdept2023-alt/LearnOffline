// Robot crew: buyable characters, the free starter, tiers (free, stars,
// level-gated, badge-only), emotes, companion choice, bad saved data, and
// the repo saves the workshop makes.
import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CHARACTERS, CREW_SLOTS, CREW_ITEMS, EMOTES, EXPRESSIONS, crewItemById, crewItemsInSlot, itemState, tierOf,
  ownsCharacter, starterAvailable, claimStarter, buyCharacter, companionOf, chooseCompanion, crewLook, crewParts,
  wearCrewItem, buyCrewItem, setCrewEmote, crewEmote, renameCrew, surpriseCrew, faceForMood, rankOf,
} from '../js/engine/crew.js';
import { ITEMS, lookOf, buy } from '../js/engine/shop.js';
import { emptyRewards, walletOf, BADGES } from '../js/engine/rewards.js';
import { setRobotOn } from '../js/engine/robot.js';
import { seededRng } from '../js/core/random.js';
import {
  saveProfile, getRewards, claimCrewStarter, buyCrewCharacter, chooseCompanionFor, buyCrewUpgrade, wearCrewUpgrade,
  equipCrewEmote, renameCrewCharacter, surpriseCrewCharacter,
} from '../js/data/repo.js';

const rich = (stars = 5000) => ({ ...emptyRewards('p'), stars });
const allItems = [...CREW_ITEMS, ...EMOTES];

test('catalogue: unique ids, boys and girls of each body, a free default per slot, sane tiers', () => {
  const ids = [...allItems.map((i) => i.id), ...ITEMS.map((i) => i.id), ...CHARACTERS.map((c) => `ch-${c.id}`)];
  assert.equal(new Set(ids).size, ids.length, 'ids are unique across shop, crew and characters');
  for (const base of ['vanguard', 'drone', 'street']) {
    assert.deepEqual(CHARACTERS.filter((c) => c.base === base).map((c) => c.girl).sort(), [false, true], `${base} has a boy and a girl version`);
  }
  const badgeIds = new Set(BADGES.map((b) => b.id));
  for (const slot of CREW_SLOTS) {
    const items = crewItemsInSlot(slot.id);
    assert.equal(items[0].price, 0, `${slot.id}: first item is free`);
    assert.ok(!items[0].badge && !items[0].level, `${slot.id}: default needs nothing`);
  }
  for (const item of allItems) {
    assert.ok(Number.isInteger(item.price) && item.price >= 0, item.id);
    if (item.badge) {
      assert.ok(badgeIds.has(item.badge), `${item.id}: unknown badge ${item.badge}`);
      assert.equal(item.price, 0, `${item.id}: legendary items are never sold`);
    }
    if (item.level) assert.ok(item.price > 0 && item.level >= 1 && item.level <= 100, `${item.id}: epic items cost stars and need a real level`);
  }
  const tiers = new Set(allItems.map(tierOf));
  assert.deepEqual([...tiers].sort(), ['common', 'epic', 'legendary', 'rare']);
  assert.ok(EMOTES.length >= 12 && EXPRESSIONS.length === 12);
});

test('the first character is free, the rest cost stars', () => {
  const r = emptyRewards('p');
  assert.ok(starterAvailable(r));
  const s = claimStarter(r, 'nova');
  assert.ok(ownsCharacter(s, 'nova'));
  assert.equal(companionOf(s, false), 'nova');
  assert.equal(walletOf(s), 0);
  assert.throws(() => claimStarter(s, 'ace'), /already took/);
  assert.throws(() => buyCharacter(s, 'ace'), /more stars/);
  const b = buyCharacter({ ...s, stars: 300 }, 'ace');
  assert.equal(walletOf(b), 100);
  assert.equal(companionOf(b, false), 'ace');
  assert.throws(() => buyCharacter(b, 'ace'), /already/);
  assert.throws(() => claimStarter(emptyRewards('p'), 'nope'), /not in the workshop/);
});

test('companion choice: old saves keep their Pip or Bolt, invalid picks fall back', () => {
  const r = emptyRewards('p');
  assert.equal(companionOf(r, true), 'pip', 'Kinder keeps Pip');
  assert.equal(companionOf(r, false), 'bolt', 'older learners keep Bolt until they pick');
  assert.equal(companionOf(setRobotOn(r, false), false), 'pip', 'a saved Pip choice is kept');
  assert.equal(companionOf({ ...r, companion: 'kira' }, false), 'bolt', 'an unowned character is never shown');
  assert.throws(() => chooseCompanion(r, 'kira'), /Get this character first/);
  const pip = chooseCompanion(r, 'pip');
  assert.equal(pip.robot.on, false);
  assert.equal(lookOf(pip, false).crew, undefined);
  const s = claimStarter(r, 'dash');
  assert.equal(lookOf(s, true).crew.id, 'dash', 'a chosen character shows even for Kinder');
  assert.equal(lookOf(chooseCompanion(s, 'bolt'), false).robot.name, 'Bolt');
});

test('tiers: rare costs stars, epic also needs a level, legendary needs a badge', () => {
  let r = rich();
  const rare = crewItemById('fn-metal');
  const epic = crewItemById('bk-wings');
  const legend = crewItemById('cw-gold');
  assert.equal(itemState(r, rare), 'buy');
  assert.equal(itemState(r, epic), 'level');
  assert.throws(() => buyCrewItem(r, epic.id), /Pass level 30/);
  assert.equal(itemState(r, legend), 'badge');
  assert.throws(() => buyCrewItem(r, legend.id), /Earn the badge/);
  r = { ...r, levels: { 30: 2 } };
  assert.equal(itemState(r, epic), 'buy');
  const bought = buyCrewItem(r, epic.id);
  assert.equal(walletOf(bought), 5000 - epic.price);
  assert.equal(itemState(bought, epic), 'owned');
  assert.equal(itemState({ ...r, badges: ['boss-1'] }, legend), 'owned', 'the badge unlocks it for free');
  assert.throws(() => buyCrewItem(bought, epic.id), /already/);
});

test('upgrades are bought once and work on every character', () => {
  let r = claimStarter(rich(), 'vanguard');
  r = buyCharacter(r, 'kira');
  r = buyCrewItem(r, 'hr-twintails');
  r = wearCrewItem(r, 'vanguard', 'hr-twintails');
  r = wearCrewItem(r, 'kira', 'hr-twintails');
  assert.equal(crewLook(r, 'vanguard').hair, 'twintails');
  assert.equal(crewLook(r, 'kira').hair, 'twintails');
  assert.equal(crewLook(r, 'nova').hair, 'ponytail', 'other characters keep their own look');
  assert.throws(() => wearCrewItem(r, 'kira', 'bk-wings'), /Unlock it first/);
  assert.throws(() => wearCrewItem(r, 'kira', 'em-flex'), /not in the workshop/);
});

test('looks: signature colours, defaults, glow and streak', () => {
  const r = claimStarter(emptyRewards('p'), 'aria');
  const look = crewLook(r, 'aria');
  const aria = CHARACTERS.find((c) => c.id === 'aria');
  assert.deepEqual(look.palette, aria.signature);
  assert.equal(look.glow, aria.signature.glow);
  assert.equal(look.hair, 'buns');
  assert.equal(look.eyes, 'round');
  assert.equal(look.girl, true);
  const lime = wearCrewItem(r, 'aria', 'gl-lime');
  assert.equal(crewLook(lime, 'aria').glow, '#b6ff3b');
  assert.equal(crewLook(r, 'nope'), null);
});

test('emotes: free ones work, others are bought or earned; the chosen one celebrates', () => {
  let r = rich();
  assert.equal(crewEmote(r).value, 'jump');
  r = setCrewEmote(r, 'em-wave');
  assert.equal(crewEmote(r).value, 'wave');
  assert.throws(() => setCrewEmote(r, 'em-dance'), /Unlock it first/);
  r = setCrewEmote(buyCrewItem(r, 'em-dance'), 'em-dance');
  assert.equal(crewEmote(r).value, 'dance');
  assert.throws(() => buyCrewItem(r, 'em-victory'), /Earn the badge/);
  assert.equal(crewEmote({ ...r, crew: { emote: 'em-victory' } }).value, 'jump', 'an unearned emote is not used');
  assert.throws(() => setCrewEmote(r, 'hr-bob'), /not in the workshop/);
});

test('bad or edited saved data falls back to safe parts', () => {
  const r = {
    ...claimStarter(emptyRewards('p'), 'nova'),
    crew: { emote: 42, chars: { nova: { name: '\u0007  Zap  ', parts: { colorway: 'cw-gold', finish: 'hr-bob', hair: 'nope', aura: null } } } },
  };
  const parts = crewParts(r, 'nova');
  for (const slot of CREW_SLOTS) assert.equal(parts[slot.id].slot, slot.id);
  assert.equal(parts.colorway.id, 'cw-signature', 'an unearned legendary is not worn');
  assert.equal(crewLook(r, 'nova').name, 'Zap');
  assert.equal(crewLook({ crew: 'junk', crewStarter: 'nova' }, 'nova').name, 'Nova');
  assert.equal(companionOf({ companion: { evil: true } }, false), 'bolt');
});

test('names, surprise, moods and ranks', () => {
  let r = claimStarter(rich(), 'dash');
  r = renameCrew(r, 'dash', '  Turbo  ');
  assert.equal(crewLook(r, 'dash').name, 'Turbo');
  assert.equal(crewLook(renameCrew(r, 'dash', ''), 'dash').name, 'Dash');
  for (let seed = 1; seed < 30; seed += 1) {
    const s = surpriseCrew(r, 'dash', seededRng(seed));
    for (const item of Object.values(crewParts(s, 'dash'))) assert.equal(itemState(s, item), 'owned');
    assert.equal(walletOf(s), walletOf(r));
  }
  for (const mood of ['happy', 'cheer', 'think', 'oops', 'sleep', 'unknown']) assert.ok(EXPRESSIONS.includes(faceForMood(mood)));
  assert.equal(rankOf(0).name, 'Rookie');
  assert.equal(rankOf(320).name, 'Pilot');
  assert.equal(rankOf(99999).name, 'Legend');
});

test('old Pip purchases and the Bolt robot still work next to the crew', () => {
  let r = buy(rich(), 'hat-crown');
  r = claimStarter(r, 'ace');
  assert.ok(r.owned.includes('hat-crown'));
  assert.equal(lookOf(chooseCompanion(r, 'pip'), false).hat, '👑');
});

test('repo: crew changes are saved and survive a reload', async () => {
  const p = await saveProfile({ name: 'Crew', avatar: '🦊', packId: 'math-g5' });
  await claimCrewStarter(p.profileId, 'kira');
  await assert.rejects(claimCrewStarter(p.profileId, 'ace'), /already took/);
  await assert.rejects(buyCrewCharacter(p.profileId, 'ace'), /more stars/);
  await assert.rejects(buyCrewUpgrade(p.profileId, 'fn-metal'), /more stars/);
  await wearCrewUpgrade(p.profileId, 'kira', 'gl-pink');
  await equipCrewEmote(p.profileId, 'em-thumbs');
  await renameCrewCharacter(p.profileId, 'kira', 'Kiki');
  await surpriseCrewCharacter(p.profileId, 'kira');
  await chooseCompanionFor(p.profileId, 'pip');
  await chooseCompanionFor(p.profileId, 'kira');
  const r = await getRewards(p.profileId);
  assert.equal(companionOf(r, false), 'kira');
  assert.equal(crewLook(r, 'kira').name, 'Kiki');
  assert.equal(crewEmote(r).value, 'thumbs');
  assert.equal(r.crewStarter, 'kira');
});

test('the crew files are cached for offline use', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  for (const file of ['js/engine/crew.js', 'js/ui/components/crew.js', 'js/ui/components/crewPicker.js', 'js/ui/screens/crewWorkshop.js']) {
    assert.ok(sw.includes(`'./${file}'`), `${file} is not precached`);
  }
});
