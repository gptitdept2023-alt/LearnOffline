/**
 * Reward shop: spend stars on looks for Pip. Tap an item to try it on,
 * then buy or wear it. Buying asks first, because stars are hard-earned.
 */

import { h, mount, confirmDialog, toast } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { getState } from '../../core/state.js';
import { getRewards, buyShopItem, equipShopItem } from '../../data/repo.js';
import { SLOTS, itemsInSlot, itemById, lookOf } from '../../engine/shop.js';
import { walletOf } from '../../engine/rewards.js';
import { playSfx } from '../../core/sfx.js';
import { learnerBar } from '../components/common.js';
import { mascotSays, MASCOT_NAME } from '../components/mascot.js';
import { confetti } from '../components/celebrate.js';

/** A shop tab's name in the learner's label language ("color" -> slotColor). */
const slotTitle = (slot) => t(`slot${slot.id[0].toUpperCase()}${slot.id.slice(1)}`);

/** Small picture of an item for its card. */
const itemPreview = (item) => (item.slot === 'color'
  ? h(`span.shop-swatch${item.value === 'rainbow' ? '.shop-swatch-rainbow' : ''}`, { style: { '--swatch': item.value } })
  : item.slot === 'scene'
    ? h(`span.shop-scene.scene-${item.value}`)
    : h('span.shop-emoji', null, item.value));

export const renderShop = async (view) => {
  const { profile } = getState();
  let rewards = await getRewards(profile.profileId);
  let slot = SLOTS[0].id;
  let trying = null; // item being tried on (not saved)

  const header = h('div');
  const preview = h('div.shop-preview');
  const tabs = h('div.shop-tabs', { role: 'tablist' });
  const grid = h('div.shop-grid');
  const actions = h('div.shop-actions');

  const draw = () => {
    const wallet = walletOf(rewards);
    const look = { ...lookOf(rewards) };
    if (trying) look[trying.slot] = trying.value;
    const owned = new Set(rewards.owned || []);

    mount(header, learnerBar(profile, rewards, { back: '#/home' }));
    const line = trying
      ? (owned.has(trying.id) ? t('shopWear', trying.name.toLowerCase()) : t('shopPrice', trying.name, trying.price))
      : t('shopHello', wallet);
    mount(preview, h(`div.shop-stage.scene-${look.scene || 'default'}`, null, mascotSays(line, { mood: trying ? 'cheer' : 'happy', look, size: 'lg' })));

    mount(tabs, SLOTS.map((s) => h(`button.shop-tab${s.id === slot ? '.active' : ''}`, {
      type: 'button',
      role: 'tab',
      'aria-selected': String(s.id === slot),
      onclick: () => { slot = s.id; trying = null; playSfx('tap'); draw(); },
    }, h('span', { 'aria-hidden': 'true' }, s.icon), ' ', slotTitle(s))));

    mount(grid, itemsInSlot(slot).map((item) => {
      const has = owned.has(item.id);
      const wearing = rewards.equipped?.[item.slot] === item.id;
      return h(`button.shop-item${trying?.id === item.id ? '.selected' : ''}${wearing ? '.wearing' : ''}`, {
        type: 'button',
        onclick: () => { trying = item; playSfx('tap'); draw(); },
      },
      itemPreview(item),
      h('strong', null, item.name),
      h(`small.shop-price${!has && item.price > wallet ? '.too-much' : ''}`, null, wearing ? t('wearing') : has ? t('yours') : `⭐ ${item.price}`));
    }));

    // Action for the item being tried on.
    const current = trying || (rewards.equipped?.[slot] ? itemById(rewards.equipped[slot]) : null);
    if (!current) { mount(actions); return; }
    const has = owned.has(current.id);
    const wearing = rewards.equipped?.[current.slot] === current.id;
    mount(actions,
      !has && h('button.btn.btn-primary.btn-lg', {
        type: 'button',
        disabled: current.price > wallet,
        onclick: () => purchase(current),
      }, current.price > wallet ? t('needMore', current.price - wallet) : t('buyFor', current.price)),
      has && !wearing && h('button.btn.btn-primary.btn-lg', { type: 'button', onclick: () => wear(current.slot, current.id) }, t('wearIt')),
      has && wearing && h('button.btn.btn-secondary', { type: 'button', onclick: () => wear(current.slot, null) }, t('takeOff')),
      trying && h('button.btn.btn-ghost', { type: 'button', onclick: () => { trying = null; draw(); } }, t('cancel')));
  };

  const purchase = async (item) => {
    const ok = await confirmDialog({
      title: t('buyTitle', item.name.toLowerCase()),
      message: t('buyMessage', item.price, walletOf(rewards) - item.price),
      confirmText: t('buyFor', item.price),
      cancelText: t('cancel'),
    });
    if (!ok) return;
    try {
      ({ rewards } = await buyShopItem(profile.profileId, item.id));
      trying = null;
      playSfx('coin');
      confetti({ count: 40 });
      toast(t('lovesIt', MASCOT_NAME, item.name.toLowerCase()), 'success');
      draw();
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const wear = async (slotId, itemId) => {
    try {
      ({ rewards } = await equipShopItem(profile.profileId, slotId, itemId));
      trying = null;
      playSfx('tap');
      draw();
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  view.append(header, h('h1.page-title', null, t('shopTitle', MASCOT_NAME)), preview, tabs, grid, actions);
  draw();
};
