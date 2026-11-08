/**
 * "Your crew": a row of every companion the learner can show (the six robot
 * crew characters, then Bolt and Pip). Tapping an owned one switches to it in one
 * tap; tapping a locked one opens a preview with its price, or the free pick
 * when the learner has not taken a starter yet. Buying asks first.
 */

import { h, mount, confirmDialog, toast } from '../../core/dom.js';
import { t } from '../../core/i18n.js';
import { claimCrewStarter, buyCrewCharacter, chooseCompanionFor } from '../../data/repo.js';
import { CHARACTERS, characterById, ownsCharacter, starterAvailable, companionOf, crewLook } from '../../engine/crew.js';
import { robotLook } from '../../engine/robot.js';
import { walletOf } from '../../engine/rewards.js';
import { playSfx } from '../../core/sfx.js';
import { mascot, MASCOT_NAME } from './mascot.js';
import { crewSvg } from './crew.js';
import { robotSvg } from './robot.js';
import { confetti } from './celebrate.js';

/**
 * @param {{profile: Object, rewards: Object, young: boolean, onChanged: (rewards: Object) => void}} options
 *   onChanged is called after a switch, buy or free pick, with the saved rewards.
 */
export const crewPicker = ({ profile, rewards, young, onChanged }) => {
  const current = companionOf(rewards, young);
  const free = starterAvailable(rewards);
  const detail = h('div.crew-detail');
  let looking = null;

  const save = async (task, after) => {
    try {
      const result = await task();
      after?.();
      onChanged(result.rewards);
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const choose = (id) => {
    playSfx('tap');
    if (id === current) return;
    save(() => chooseCompanionFor(profile.profileId, id));
  };

  const get = async (ch) => {
    if (free) {
      await save(() => claimCrewStarter(profile.profileId, ch.id), () => { playSfx('fanfare'); confetti({ count: 70 }); });
      return;
    }
    const ok = await confirmDialog({
      title: t('buyTitle', ch.name),
      message: t('buyMessage', ch.price, walletOf(rewards) - ch.price),
      confirmText: t('buyFor', ch.price),
      cancelText: t('cancel'),
    });
    if (!ok) return;
    await save(() => buyCrewCharacter(profile.profileId, ch.id), () => { playSfx('coin'); confetti({ count: 70 }); });
  };

  const showDetail = () => {
    if (!looking) { mount(detail); return; }
    const ch = looking;
    const wallet = walletOf(rewards);
    const short = !free && ch.price > wallet;
    mount(detail, h('div.crew-detail-card', null,
      h('div.crew-detail-art', null, crewSvg(crewLook(rewards, ch.id), { expr: 'happy', emote: 'wave' })),
      h('div.crew-detail-text', null,
        h('h3', null, t('crewMeet', ch.name)),
        h('p', null, ch.blurb),
        h('div.shop-actions', null,
          h('button.btn.btn-primary.btn-lg', { type: 'button', disabled: short, onclick: () => get(ch) },
            free ? t('takeFree') : short ? t('needMore', ch.price - wallet) : t('buyFor', ch.price)),
          h('button.btn.btn-ghost', { type: 'button', onclick: () => { looking = null; draw(); } }, t('cancel'))))));
  };

  const card = (id, name, art, status, owned) => h(`button.crew-card${id === current ? '.using' : ''}${looking?.id === id ? '.selected' : ''}`, {
    type: 'button',
    'aria-pressed': String(id === current),
    onclick: () => {
      if (owned) { looking = null; choose(id); return; }
      playSfx('tap');
      looking = characterById(id);
      draw();
    },
  }, h('span.crew-card-art', null, art), h('strong', null, name), h('small.shop-price', null, status));

  const row = h('div.crew-row');
  const draw = () => {
    const status = (id, owned, price) => (id === current ? t('usingNow') : owned ? t('yours') : free ? t('starterFree') : `⭐ ${price}`);
    mount(row,
      CHARACTERS.map((ch) => {
        const owned = ownsCharacter(rewards, ch.id);
        return card(ch.id, owned ? crewLook(rewards, ch.id).name : ch.name, crewSvg(crewLook(rewards, ch.id), { still: true }), status(ch.id, owned, ch.price), owned);
      }),
      card('bolt', robotLook(rewards).name, robotSvg(robotLook(rewards)), status('bolt', true), true),
      card('pip', MASCOT_NAME, mascot({ mood: 'happy', look: {}, size: 'sm' }), status('pip', true), true));
    showDetail();
  };
  draw();

  return h('section.crew-picker', null,
    h('div.crew-picker-head', null, h('h2.section-title', null, t('crewTitle')), free && h('span.crew-free', null, t('crewStarterHint'))),
    row,
    detail);
};
