/**
 * Crew workshop: customize the learner's robot crew character. Upgrades are
 * shared by every character and come in four tiers (free, stars, stars plus a
 * level, badge-only). Owned parts fit in one tap; others are tried on first.
 * Also: emotes (preview, buy, pick the celebration emote), the 12 LED faces,
 * places, and the learner's profile card.
 */

import { h, mount, confirmDialog, toast } from '../../core/dom.js';
import { t, badgeText } from '../../core/i18n.js';
import { render } from '../../core/router.js';
import {
  getRewards, buyCrewUpgrade, wearCrewUpgrade, equipCrewEmote, renameCrewCharacter, surpriseCrewCharacter, buyShopItem, equipShopItem,
} from '../../data/repo.js';
import {
  CREW_SLOTS, EXPRESSIONS, characterById, crewItemsInSlot, crewLook, crewParts, crewEmote, itemState, tierOf, rankOf,
} from '../../engine/crew.js';
import { ROBOT_NAME_MAX } from '../../engine/robot.js';
import { itemsInSlot, lookOf } from '../../engine/shop.js';
import { walletOf, badgeById, BADGES } from '../../engine/rewards.js';
import { playSfx } from '../../core/sfx.js';
import { learnerBar } from '../components/common.js';
import { mascotSays } from '../components/mascot.js';
import { crewSvg } from '../components/crew.js';
import { crewPicker } from '../components/crewPicker.js';
import { confetti } from '../components/celebrate.js';

const TABS = [
  ...CREW_SLOTS,
  { id: 'emote', icon: '🕺' },
  { id: 'face', icon: '😎' },
  { id: 'scene', icon: '🏙️' },
  { id: 'card', icon: '🪪' },
];
/** Cards that show only the head, so the change is easy to see. */
const HEAD_SLOTS = new Set(['eyes', 'hair']);
const SWATCH_SLOTS = new Set(['colorway', 'glow']);
const NO_SCENE = Object.freeze({ id: null, slot: 'scene', name: 'Studio', value: 'default', price: 0 });
const EMOTE_ICONS = {
  jump: '🦘', wave: '👋', thumbs: '👍', nod: '🙂', laugh: '😂', flex: '💪', salute: '🫡', spin: '🌀', dance: '💃', powerup: '⚡', backflip: '🤸', victory: '🏆', hero: '🦸',
};

const tabTitle = (id) => t(`slot${id[0].toUpperCase()}${id.slice(1)}`);

/** Swatch for a colourway or glow item. */
const swatch = (item, ch) => {
  if (item.slot === 'colorway') {
    const p = item.value === 'signature' ? ch.signature : item.value;
    return h('span.shop-swatch.crew-swatch', { style: { '--a': p.main, '--b': p.trim, '--c': p.glow } });
  }
  if (item.value === 'rainbow' || item.value === 'plasma') return h(`span.shop-swatch.swatch-${item.value}`);
  if (item.value === 'colorway') return h('span.shop-swatch.crew-swatch', { style: { '--a': ch.signature.main, '--b': ch.signature.trim, '--c': ch.signature.glow } });
  return h('span.shop-swatch', { style: { '--swatch': item.value } });
};

export const renderCrewWorkshop = async (view, { profile, young, characterId }) => {
  let rewards = await getRewards(profile.profileId);
  const ch = characterById(characterId);
  let tab = TABS[0].id;
  let trying = null; // item being tried on or previewed (not saved)
  let expr = null; // face preview
  let emote = null; // emote to play on the next draw
  let line = null;

  const header = h('div');
  const title = h('h1.page-title');
  const stage = h('div');
  const picker = h('div');
  const tabs = h('div.shop-tabs', { role: 'tablist' });
  const grid = h('div');
  const actions = h('div.shop-actions');

  const save = async (task, after) => {
    try {
      ({ rewards } = await task());
      after?.();
      mount(picker, crewPicker({ profile, rewards, young, onChanged: () => render() }));
      draw();
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const nameInput = h('input.workshop-name', {
    maxlength: ROBOT_NAME_MAX,
    autocomplete: 'off',
    'aria-label': t('robotName'),
    placeholder: ch.name,
    onchange: () => save(() => renameCrewCharacter(profile.profileId, ch.id, nameInput.value)),
  });
  const tools = h('div.workshop-tools', null,
    h('label.workshop-name-field', null, h('span', null, t('robotName')), nameInput),
    h('button.btn.btn-secondary', {
      type: 'button',
      onclick: () => save(() => surpriseCrewCharacter(profile.profileId, ch.id), () => { trying = null; emote = 'spin'; playSfx('pop'); }),
    }, '🎲 ', t('surpriseMe')));

  /** Why a locked item is locked, and how to get it. */
  const lockText = (item) => {
    const state = itemState(rewards, item);
    if (state === 'level') return t('unlockLevelMsg', item.name.toLowerCase(), item.level);
    if (state === 'badge') {
      const badge = badgeById(item.badge);
      return t('unlockBadgeMsg', item.name.toLowerCase(), badge ? badgeText(badge).title : item.badge);
    }
    return '';
  };

  const statusText = (item, wearing) => {
    const state = itemState(rewards, item);
    if (wearing) return t('wearing');
    if (state === 'owned') return item.price === 0 && !item.badge ? t('free') : t('yours');
    if (state === 'level') return `🔒 ${t('levelN', item.level)}`;
    if (state === 'badge') return `🏅 ${badgeText(badgeById(item.badge) || { title: item.badge, description: '' }).title}`;
    return `⭐ ${item.price}`;
  };

  const purchase = async (item) => {
    const ok = await confirmDialog({
      title: t('buyTitle', item.name.toLowerCase()),
      message: t('buyMessage', item.price, walletOf(rewards) - item.price),
      confirmText: t('buyFor', item.price),
      cancelText: t('cancel'),
    });
    if (!ok) return;
    const isScene = item.slot === 'scene';
    await save(async () => {
      const bought = isScene ? await buyShopItem(profile.profileId, item.id) : await buyCrewUpgrade(profile.profileId, item.id);
      if (isScene) return bought;
      // Fit it straight away (or make it the celebration emote).
      return item.slot === 'emote' ? equipCrewEmote(profile.profileId, item.id) : wearCrewUpgrade(profile.profileId, ch.id, item.id);
    }, () => {
      trying = null;
      emote = item.slot === 'emote' ? item.value : 'jump';
      line = t('lovesIt', crewLook(rewards, ch.id).name, item.name.toLowerCase());
      playSfx('coin');
      confetti({ count: 50 });
    });
  };

  /** Tap on an upgrade, emote or place card. */
  const choose = (item) => {
    playSfx('tap');
    line = null;
    if (item.slot === 'scene') {
      const owned = item.id === null || (rewards.owned || []).includes(item.id);
      if (!owned) { trying = item; draw(); return; }
      save(() => equipShopItem(profile.profileId, 'scene', item.id), () => { trying = null; });
      return;
    }
    if (item.slot === 'emote') {
      emote = item.value;
      if (itemState(rewards, item) === 'owned') {
        save(() => equipCrewEmote(profile.profileId, item.id), () => { trying = null; line = t('celebrating'); });
      } else {
        trying = item;
        draw();
      }
      return;
    }
    if (itemState(rewards, item) === 'owned') {
      save(() => wearCrewUpgrade(profile.profileId, ch.id, item.id), () => { trying = null; line = t('robotWearing', item.name); });
      return;
    }
    trying = item;
    draw();
  };

  const itemCard = (item, art, wearing) => {
    const state = item.slot === 'scene' ? (item.id === null || (rewards.owned || []).includes(item.id) ? 'owned' : 'buy') : itemState(rewards, item);
    const tier = item.slot === 'scene' ? (item.price ? 'rare' : 'common') : tierOf(item);
    return h(`button.shop-item.crew-item.tier-${tier}${trying === item ? '.selected' : ''}${wearing ? '.wearing' : ''}${state === 'level' || state === 'badge' ? '.locked' : ''}`, {
      type: 'button',
      'aria-pressed': String(wearing),
      onclick: () => choose(item),
    },
    h('span.crew-tier', null, t(`tier${tier[0].toUpperCase()}${tier.slice(1)}`)),
    art,
    h('strong', null, item.name),
    h(`small.shop-price${state === 'buy' && item.price > walletOf(rewards) ? '.too-much' : ''}`, null,
      item.slot === 'scene' ? (wearing ? t('wearing') : state === 'owned' ? (item.price ? t('yours') : t('free')) : `⭐ ${item.price}`) : statusText(item, wearing)));
  };

  const profileCard = (look) => {
    const rank = rankOf(rewards.stars);
    const levelsPassed = Object.values(rewards.levels || {}).filter((s) => s > 0).length;
    const bestGame = Math.max(0, ...Object.values(rewards.gameBest || {}));
    const stat = (value, label) => h('div.stat', null, h('strong', null, value), h('small', null, label));
    return h('section.crew-profile', null,
      h('div.crew-profile-art', null, crewSvg(look, { expr: 'cool' })),
      h('div.crew-profile-body', null,
        h('small.crew-profile-rank', null, `${t('rank')} · ${rank.name}`),
        h('h2', null, look.name),
        h('p.muted', null, `${profile.name} · ${ch.name}`),
        h('div.stat-row', null,
          stat(rewards.stars, t('starsEarned')),
          stat(rewards.bestStreak, t('bestStreak')),
          stat(`${(rewards.badges || []).length}/${BADGES.length}`, t('badges')),
          stat(levelsPassed, t('levelsPassed')),
          stat(bestGame, t('bestGame')))));
  };

  const draw = () => {
    const wallet = walletOf(rewards);
    const parts = crewParts(rewards, ch.id);
    const override = trying && CREW_SLOTS.some((s) => s.id === trying.slot) ? { [trying.slot]: trying } : {};
    const look = crewLook(rewards, ch.id, override);
    const sceneLook = lookOf(rewards, young);
    const scene = trying?.slot === 'scene' ? trying.value : sceneLook.scene || 'default';

    mount(header, learnerBar(profile, rewards, { back: '#/home' }));
    mount(title, t('robotShopTitle', look.name));
    if (document.activeElement !== nameInput) nameInput.value = look.name;

    const says = trying
      ? (itemState(rewards, trying) === 'buy' || trying.slot === 'scene' ? t('shopPrice', trying.name, trying.price) : lockText(trying))
      : line || t('crewHello', wallet);
    const face = expr || (trying ? 'happy' : null);
    mount(stage, h(`div.shop-stage.workshop-stage.crew-stage.scene-${scene}`, null,
      mascotSays(says, { mood: 'happy', look: { crew: look }, size: 'xl', expr: face, emote })));
    emote = null;

    mount(tabs, TABS.map((s) => h(`button.shop-tab${s.id === tab ? '.active' : ''}`, {
      type: 'button',
      role: 'tab',
      'aria-selected': String(s.id === tab),
      onclick: () => { tab = s.id; trying = null; expr = null; playSfx('tap'); draw(); },
    }, h('span', { 'aria-hidden': 'true' }, s.icon), ' ', tabTitle(s.id))));

    if (tab === 'card') {
      mount(grid, profileCard(crewLook(rewards, ch.id)));
    } else if (tab === 'face') {
      mount(grid, h('div.shop-grid', null, EXPRESSIONS.map((e) => h(`button.shop-item${expr === e ? '.selected' : ''}`, {
        type: 'button',
        onclick: () => { expr = e; playSfx('tap'); draw(); },
      }, h('span.part-thumb', null, crewSvg(look, { headOnly: true, still: true, expr: e })), h('strong', null, t(`face${e[0].toUpperCase()}${e.slice(1)}`))))));
    } else if (tab === 'scene') {
      const sceneId = rewards.equipped?.scene || null;
      mount(grid, h('div.shop-grid', null, [NO_SCENE, ...itemsInSlot('scene')].map((item) => itemCard(item, h(`span.shop-scene.scene-${item.value}`), sceneId === item.id))));
    } else if (tab === 'emote') {
      const equipped = crewEmote(rewards).id;
      mount(grid, h('div.shop-grid', null, crewItemsInSlot('emote').map((item) => itemCard(item, h('span.part-thumb.emote-thumb', null, EMOTE_ICONS[item.value] || '✨'), equipped === item.id))));
    } else {
      mount(grid, h('div.shop-grid', null, crewItemsInSlot(tab).map((item) => {
        const tried = crewLook(rewards, ch.id, { [item.slot]: item });
        const art = SWATCH_SLOTS.has(tab)
          ? swatch(item, ch)
          : h('span.part-thumb', null, crewSvg(tried, { still: true, headOnly: HEAD_SLOTS.has(tab), expr: 'neutral' }));
        return itemCard(item, art, parts[tab]?.id === item.id);
      })));
    }

    if (!trying) { mount(actions); return; }
    const state = trying.slot === 'scene' ? 'buy' : itemState(rewards, trying);
    mount(actions,
      state === 'buy' && h('button.btn.btn-primary.btn-lg', { type: 'button', disabled: trying.price > wallet, onclick: () => purchase(trying) },
        trying.price > wallet ? t('needMore', trying.price - wallet) : t('buyFor', trying.price)),
      (state === 'level' || state === 'badge') && h('p.crew-lock', null, '🔒 ', lockText(trying)),
      h('button.btn.btn-ghost', { type: 'button', onclick: () => { trying = null; draw(); } }, t('cancel')));
  };

  mount(picker, crewPicker({ profile, rewards, young, onChanged: () => render() }));
  view.append(header, title, stage, picker, tools, tabs, grid, actions);
  draw();
};
