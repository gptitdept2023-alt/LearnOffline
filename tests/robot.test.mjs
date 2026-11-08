// Robot companion: catalogue, free and paid parts, the old Pip purchases
// carrying over, bad saved data, and the workshop's saves through the repo.
import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ROBOT_SLOTS, ROBOT_PARTS, partsInSlot, partById, ownsPart, usesRobot, robotParts, robotLook,
  wearPart, buyPart, setRobotOn, setRobotName, surpriseParts, cleanRobotName, DEFAULT_ROBOT_NAME, ROBOT_NAME_MAX,
} from '../js/engine/robot.js';
import { ITEMS, itemById, lookOf, buy } from '../js/engine/shop.js';
import { emptyRewards, walletOf, awardBadges } from '../js/engine/rewards.js';
import { seededRng } from '../js/core/random.js';
import {
  saveProfile, getRewards, buyRobotPart, wearRobotPart, chooseRobot, renameRobot, surpriseRobot, getAllRewards,
} from '../js/data/repo.js';

const rich = (stars = 1000) => ({ ...emptyRewards('p'), stars });

test('catalogue: unique ids, known slots, a free default in every slot, prices whole', () => {
  assert.equal(new Set(ROBOT_PARTS.map((p) => p.id)).size, ROBOT_PARTS.length);
  const shopIds = new Set(ITEMS.map((i) => i.id));
  for (const part of ROBOT_PARTS) {
    assert.ok(!shopIds.has(part.id), `${part.id} clashes with a shop item`);
    assert.ok(ROBOT_SLOTS.some((s) => s.id === part.slot), `${part.id}: unknown slot`);
    assert.ok(Number.isInteger(part.price) && part.price >= 0, part.id);
    if (part.legacy) {
      const old = itemById(part.legacy);
      assert.ok(old, `${part.id}: legacy item ${part.legacy} is missing`);
      assert.equal(part.price, old.price, `${part.id} costs the same as the item it replaces`);
    }
  }
  for (const slot of ROBOT_SLOTS) {
    const parts = partsInSlot(slot.id);
    assert.ok(parts.filter((p) => p.price === 0).length >= 1, `${slot.id} has a free part`);
    assert.ok(parts.some((p) => p.price > 0), `${slot.id} has an upgrade to buy`);
  }
});

test('every old colour, hat and pet comes back as a robot part', () => {
  const legacy = new Set(ROBOT_PARTS.map((p) => p.legacy).filter(Boolean));
  for (const item of ITEMS.filter((i) => ['color', 'hat', 'pet'].includes(i.slot))) {
    assert.ok(legacy.has(item.id), `${item.id} has no robot part`);
  }
});

test('Kinder learners keep Pip unless they choose; everyone else gets the robot', () => {
  const r = emptyRewards('p');
  assert.equal(usesRobot(r, true), false);
  assert.equal(usesRobot(r, false), true);
  assert.equal(usesRobot(setRobotOn(r, true), true), true);
  assert.equal(usesRobot(setRobotOn(r, false), false), false);
  assert.ok(lookOf(r, false).robot, 'older learners get a robot look');
  assert.equal(lookOf(r, true).robot, undefined, 'Kinder learners get Pip');
});

test('a new robot starts dressed like Pip was, using what the child already paid for', () => {
  let r = rich(1000);
  r = buy(r, 'color-berry');
  r = buy(r, 'hat-crown');
  r = buy(r, 'pet-dino');
  const spent = r.spentStars;
  const look = robotLook(r);
  assert.equal(look.paint, partById('rb-paint-berry').value);
  assert.equal(look.hat, 'crown');
  assert.equal(look.pet, 'dino');
  assert.ok(ownsPart(r, partById('rb-hat-crown')), 'the crown is owned through the old purchase');
  assert.throws(() => buyPart(r, 'rb-hat-crown'), /already/, 'never charged twice');
  assert.equal(wearPart(r, 'rb-hat-none').spentStars, spent);
});

test('free parts fit at no cost; upgrades cost stars and are kept', () => {
  const r = rich(100);
  const free = wearPart(r, 'rb-head-box');
  assert.equal(robotLook(free).head, 'box');
  assert.equal(walletOf(free), 100);
  assert.throws(() => wearPart(r, 'rb-head-knight'), /Buy it first/);
  assert.throws(() => buyPart({ ...emptyRewards('p'), stars: 10 }, 'rb-head-knight'), /more stars/);
  assert.throws(() => buyPart(r, 'rb-nope'), /not in the workshop/);
  const bought = buyPart(r, 'rb-arms-piston');
  assert.equal(walletOf(bought), 60);
  assert.equal(bought.stars, 100, 'lifetime stars are unchanged');
  assert.ok(bought.owned.includes('rb-arms-piston'));
  assert.equal(robotLook(bought).arms, 'piston');
  assert.ok(awardBadges(bought).newBadges.includes('first-buy'), 'buying a part earns the shop badge');
  // Changing back and forth keeps the part.
  const back = wearPart(wearPart(bought, 'rb-arms-basic'), 'rb-arms-piston');
  assert.equal(robotLook(back).arms, 'piston');
  assert.equal(walletOf(back), 60);
});

test('bad or edited saved data falls back to safe parts', () => {
  const r = {
    ...emptyRewards('p'),
    robot: { on: true, name: '  \u0007Zed\n  the   great robot  ', parts: { head: 'rb-head-knight', eyes: 'rb-hair-spikes', arms: 'nope', legs: 42 } },
  };
  const parts = robotParts(r);
  for (const slot of ROBOT_SLOTS) assert.equal(parts[slot.id].slot, slot.id);
  assert.equal(parts.head.id, 'rb-head-pod', 'an unpaid upgrade is not worn');
  assert.equal(parts.eyes.id, 'rb-eyes-round', 'a part in the wrong slot is not worn');
  assert.equal(robotLook(r).name, 'Zed the great');
  assert.equal(robotLook({ robot: 'junk' }).name, DEFAULT_ROBOT_NAME);
  assert.ok(robotLook(null).head);
});

test('robot names are cleaned and capped', () => {
  assert.equal(cleanRobotName('   '), '');
  assert.equal(robotLook(setRobotName(emptyRewards('p'), '   ')).name, DEFAULT_ROBOT_NAME);
  assert.equal([...cleanRobotName('🤖'.repeat(30))].length, ROBOT_NAME_MAX);
  assert.equal(cleanRobotName('Volt'), 'Volt');
});

test('surprise me only uses parts the child owns', () => {
  const r = buyPart(rich(500), 'rb-legs-hover');
  for (let seed = 1; seed < 40; seed += 1) {
    const s = surpriseParts(r, seededRng(seed));
    for (const [slot, id] of Object.entries(s.robot.parts)) {
      const part = partById(id);
      assert.equal(part.slot, slot);
      assert.ok(ownsPart(s, part), `${id} is not owned`);
    }
    assert.equal(walletOf(s), walletOf(r), 'surprise is free');
  }
});

test('repo: workshop changes are saved and survive a reload', async () => {
  const p = await saveProfile({ name: 'Robo', avatar: '🦊', packId: 'math-g4' });
  await assert.rejects(buyRobotPart(p.profileId, 'rb-head-fin'), /more stars/);
  await wearRobotPart(p.profileId, 'rb-head-visor');
  await renameRobot(p.profileId, 'Sparky');
  await chooseRobot(p.profileId, true);
  await surpriseRobot(p.profileId);
  await wearRobotPart(p.profileId, 'rb-eyes-sharp');
  const r = await getRewards(p.profileId);
  assert.equal(r.robot.on, true);
  assert.equal(robotLook(r).name, 'Sparky');
  assert.equal(robotLook(r).eyes, 'sharp');
  assert.equal(walletOf(r), 0);
  assert.ok((await getAllRewards()).get(p.profileId).robot);
});

test('the robot files are cached for offline use', () => {
  const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
  for (const file of ['js/engine/robot.js', 'js/ui/components/robot.js', 'js/ui/screens/workshop.js']) {
    assert.ok(sw.includes(`'./${file}'`), `${file} is not precached`);
  }
});
