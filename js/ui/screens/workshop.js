/**
 * Robot workshop: build and dress the learner's robot. Free parts are fitted
 * with one tap; upgrades are tried on first and bought with stars (asks first,
 * because stars are hard-earned). Places (backgrounds) are shared with Pip's shop.
 */

import { h, mount, confirmDialog, toast } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { render } from '../../core/router.js';
import {
  getRewards, buyRobotPart, wearRobotPart, chooseRobot, renameRobot, surpriseRobot, buyShopItem, equipShopItem,
} from '../../data/repo.js';
import { ROBOT_SLOTS, ROBOT_NAME_MAX, partsInSlot, ownsPart, robotLook, robotParts } from '../../engine/robot.js';
import { itemsInSlot, lookOf } from '../../engine/shop.js';
import { walletOf } from '../../engine/rewards.js';
import { playSfx } from '../../core/sfx.js';
import { learnerBar } from '../components/common.js';
import { mascotSays, MASCOT_NAME } from '../components/mascot.js';
import { robotSvg, robotPetSvg } from '../components/robot.js';
import { confetti } from '../components/celebrate.js';

const SCENE_TAB = { id: 'scene', icon: '🏙️' };
const TABS = [...ROBOT_SLOTS, SCENE_TAB];
const COLOUR_SLOTS = new Set(['eyeColor', 'paint', 'trim']);
const HEAD_SLOTS = new Set(['head', 'eyes', 'hair', 'hat']);
/** The free "no background" choice in the Places tab. */
const NO_SCENE = Object.freeze({ id: null, slot: 'scene', name: 'Studio', value: 'default', price: 0 });

/** Tab name in the learner's label language ("eyeColor" -> slotEyeColor). */
const slotTitle = (slotId) => t(`slot${slotId[0].toUpperCase()}${slotId.slice(1)}`);

/** Small picture of a part on its card: a swatch, the pet, or the robot wearing it. */
const partPreview = (part, robot) => {
  if (COLOUR_SLOTS.has(part.slot)) {
    const special = part.value.startsWith('#') ? '' : `.swatch-${part.value}`;
    return h(`span.shop-swatch${special}`, { style: { '--swatch': part.value } });
  }
  // Head and hair cards take the hat off, so the part itself is what you see.
  const bare = part.slot === 'head' || part.slot === 'hair' ? { hat: 'none' } : {};
  const tried = { ...robot, ...bare, [part.slot]: part.value };
  if (part.slot === 'pet') return h('span.part-thumb', null, robotPetSvg(tried) || h('span.part-none', null, '—'));
  return h('span.part-thumb', null, robotSvg(tried, { headOnly: HEAD_SLOTS.has(part.slot) }));
};

export const renderWorkshop = async (view, { profile, young }) => {
  let rewards = await getRewards(profile.profileId);
  let slot = TABS[0].id;
  let trying = null; // part or scene item being tried on (not saved)
  let line = null; // what the robot says next

  const header = h('div');
  const title = h('h1.page-title');
  const preview = h('div');
  const tabs = h('div.shop-tabs', { role: 'tablist' });
  const grid = h('div.shop-grid');
  const actions = h('div.shop-actions');

  /** Run a save, keep the new rewards, redraw; show a friendly error if it fails. */
  const save = async (change, after) => {
    try {
      ({ rewards } = await change());
      after?.();
      draw();
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const nameInput = h('input.workshop-name', {
    maxlength: ROBOT_NAME_MAX,
    autocomplete: 'off',
    'aria-label': t('robotName'),
    placeholder: t('robotName'),
    onchange: () => save(() => renameRobot(profile.profileId, nameInput.value), () => { nameInput.value = robotLook(rewards).name; }),
  });

  const tools = h('div.workshop-tools', null,
    h('label.workshop-name-field', null, h('span', null, t('robotName')), nameInput),
    h('button.btn.btn-secondary', {
      type: 'button',
      onclick: () => save(() => surpriseRobot(profile.profileId), () => { trying = null; line = null; playSfx('pop'); }),
    }, '🎲 ', t('surpriseMe')),
    h('button.btn.btn-ghost', {
      type: 'button',
      onclick: () => save(() => chooseRobot(profile.profileId, false), () => render()),
    }, t('usePip', MASCOT_NAME)));

  const purchase = async (item, isScene) => {
    const ok = await confirmDialog({
      title: t('buyTitle', item.name.toLowerCase()),
      message: t('buyMessage', item.price, walletOf(rewards) - item.price),
      confirmText: t('buyFor', item.price),
      cancelText: t('cancel'),
    });
    if (!ok) return;
    await save(() => (isScene ? buyShopItem(profile.profileId, item.id) : buyRobotPart(profile.profileId, item.id)), () => {
      trying = null;
      line = t('lovesIt', robotLook(rewards).name, item.name.toLowerCase());
      playSfx('coin');
      confetti({ count: 40 });
    });
  };

  /** Tap on a card: fit it if it is free or owned, otherwise try it on. */
  const choose = (item) => {
    playSfx('tap');
    if (slot === 'scene') {
      const owned = item.id === null || (rewards.owned || []).includes(item.id);
      if (!owned) { trying = item; draw(); return; }
      save(() => equipShopItem(profile.profileId, 'scene', item.id), () => { trying = null; line = t('robotWearing', item.name); });
      return;
    }
    if (!ownsPart(rewards, item)) { trying = item; draw(); return; }
    save(() => wearRobotPart(profile.profileId, item.id), () => { trying = null; line = t('robotWearing', item.name); });
  };

  const draw = () => {
    const wallet = walletOf(rewards);
    const look = lookOf(rewards, young);
    // lookOf() gives the robot when it is on; the workshop always shows it.
    const robot = { ...robotLook(rewards) };
    if (trying && slot !== 'scene') robot[trying.slot] = trying.value;
    const scene = trying && slot === 'scene' ? trying.value : look.scene || 'default';
    const parts = robotParts(rewards);
    const sceneId = rewards.equipped?.scene || null;

    mount(header, learnerBar(profile, rewards, { back: '#/home' }));
    mount(title, t('robotShopTitle', robot.name));
    if (document.activeElement !== nameInput) nameInput.value = robot.name;

    const says = trying ? t('shopPrice', trying.name, trying.price) : line || t('robotHello', wallet);
    mount(preview, h(`div.shop-stage.workshop-stage.scene-${scene}`, null,
      mascotSays(says, { mood: trying ? 'cheer' : 'happy', look: { robot }, size: 'xl' })));

    mount(tabs, TABS.map((s) => h(`button.shop-tab${s.id === slot ? '.active' : ''}`, {
      type: 'button',
      role: 'tab',
      'aria-selected': String(s.id === slot),
      onclick: () => { slot = s.id; trying = null; playSfx('tap'); draw(); },
    }, h('span', { 'aria-hidden': 'true' }, s.icon), ' ', slotTitle(s.id))));

    const items = slot === 'scene' ? [NO_SCENE, ...itemsInSlot('scene')] : partsInSlot(slot);
    mount(grid, items.map((item) => {
      const isScene = slot === 'scene';
      const has = isScene ? item.id === null || (rewards.owned || []).includes(item.id) : ownsPart(rewards, item);
      const wearing = isScene ? sceneId === item.id : parts[slot].id === item.id;
      const priceText = wearing ? t('wearing') : item.price === 0 ? t('free') : has ? t('yours') : `⭐ ${item.price}`;
      return h(`button.shop-item${trying === item ? '.selected' : ''}${wearing ? '.wearing' : ''}`, {
        type: 'button',
        'aria-pressed': String(wearing),
        onclick: () => choose(item),
      },
      isScene ? h(`span.shop-scene.scene-${item.value}`) : partPreview(item, robot),
      h('strong', null, item.name),
      h(`small.shop-price${!has && item.price > wallet ? '.too-much' : ''}`, null, priceText));
    }));

    if (!trying) { mount(actions); return; }
    mount(actions,
      h('button.btn.btn-primary.btn-lg', {
        type: 'button',
        disabled: trying.price > wallet,
        onclick: () => purchase(trying, slot === 'scene'),
      }, trying.price > wallet ? t('needMore', trying.price - wallet) : t('buyFor', trying.price)),
      h('button.btn.btn-ghost', { type: 'button', onclick: () => { trying = null; draw(); } }, t('cancel')));
  };

  view.append(header, title, preview, tools, tabs, grid, actions);
  draw();
};
