/**
 * 100 levels, generated from a pack's skills (no hand-written levels), so
 * the same plan works for every grade and grows with new content.
 *
 *  - 10 worlds of 10 levels. Every 10th level is a BOSS: a longer, mixed
 *    set over the whole world, no hints, and a 70% pass mark.
 *  - Regular levels walk through the skills in course order (each skill
 *    gets a few levels), and later worlds mix in earlier skills for review,
 *    which is harder than one skill at a time (interleaving).
 *  - Sets get a little longer in later worlds; Challenge-zone skills come
 *    last, and bosses from world 2 on include one.
 *
 * Pure and DOM-free.
 */

export const LEVEL_COUNT = 100;
export const WORLD_SIZE = 10;

export const WORLDS = Object.freeze([
  { name: 'Sunny Meadow', icon: '🌼', boss: { name: 'Bumble the Bee', icon: '🐝' } },
  { name: 'Sandy Beach', icon: '🏖️', boss: { name: 'Captain Crab', icon: '🦀' } },
  { name: 'Whisper Woods', icon: '🌲', boss: { name: 'Professor Owl', icon: '🦉' } },
  { name: 'Dune Desert', icon: '🏜️', boss: { name: 'Sly Scorpion', icon: '🦂' } },
  { name: 'Misty Mountains', icon: '🏔️', boss: { name: 'Big Bear', icon: '🐻' } },
  { name: 'Deep Ocean', icon: '🌊', boss: { name: 'Sharky', icon: '🦈' } },
  { name: 'Jungle Ruins', icon: '🌴', boss: { name: 'King Gorilla', icon: '🦍' } },
  { name: 'Frosty Peaks', icon: '❄️', boss: { name: 'Snow Yeti', icon: '☃️' } },
  { name: 'Fire Mountain', icon: '🌋', boss: { name: 'Dragon Flare', icon: '🐉' } },
  { name: 'Star Galaxy', icon: '🚀', boss: { name: 'Robo Brain', icon: '🤖' } },
]);

/** Pass marks: share of answers right needed for 1, 2 and 3 stars. */
export const STAR_MARKS = [0.5, 0.7, 0.9];
export const BOSS_PASS = 0.7;
/** Bonus stars the first time a level is passed. */
export const LEVEL_BONUS = { regular: 2, boss: { young: 20, older: 30 } };

export const worldOf = (n) => Math.ceil(n / WORLD_SIZE);
export const isBoss = (n) => n % WORLD_SIZE === 0;

/**
 * Build all levels for a pack.
 * @param {{pack: {young: boolean, topics: Object[]}, skillById: Map}} indexed
 * @returns {{n: number, world: number, boss: boolean, skillIds: string[], size: number, pass: number, title: string}[]}
 */
export const buildLevels = (indexed) => {
  const { young } = indexed.pack;
  const regular = [];
  const challenge = [];
  for (const topic of indexed.pack.topics) {
    for (const s of topic.skills) (topic.challenge ? challenge : regular).push(s.skillId);
  }
  const skills = [...regular, ...challenge];
  if (!skills.length) return [];
  const regularCount = LEVEL_COUNT - LEVEL_COUNT / WORLD_SIZE; // 90
  const baseSize = young ? 6 : 10;
  const title = (id) => indexed.skillById.get(id)?.title || id;
  const levels = [];
  let worldFocus = [];

  for (let n = 1; n <= LEVEL_COUNT; n += 1) {
    const world = worldOf(n);
    if (isBoss(n)) {
      const finalBoss = n === LEVEL_COUNT;
      const reached = skills.indexOf(worldFocus[worldFocus.length - 1]) + 1;
      const ids = finalBoss ? [] : [...new Set(worldFocus)];
      if (world >= 2 && challenge.length && !finalBoss) ids.push(challenge[(world - 2) % challenge.length]);
      // At least 3 skills (6 for the final boss), spread over everything learned so far.
      const want = finalBoss ? 6 : 3;
      for (let k = 0; new Set(ids).size < Math.min(want, reached) && k < want * 2; k += 1) {
        ids.push(skills[Math.floor((k * reached) / want) % reached]);
      }
      levels.push({
        n, world, boss: true,
        skillIds: [...new Set(ids)],
        size: finalBoss ? (young ? 12 : 20) : young ? 10 : 15,
        pass: BOSS_PASS,
        title: WORLDS[world - 1].boss.name,
      });
      worldFocus = [];
      continue;
    }
    const r = n - Math.floor(n / WORLD_SIZE); // 1..90, regular levels only
    const focusIdx = Math.min(skills.length - 1, Math.floor(((r - 1) * skills.length) / regularCount));
    const focus = skills[focusIdx];
    worldFocus.push(focus);
    // Review skills from earlier in the course, more of them in later worlds.
    const reviews = world >= 7 ? 2 : world >= 3 ? 1 : 0;
    const ids = [focus];
    for (let j = 0; j < reviews && focusIdx > 0; j += 1) ids.push(skills[(n * 7 + j * 13) % focusIdx]);
    const unique = [...new Set(ids)];
    levels.push({
      n, world, boss: false,
      skillIds: unique,
      size: baseSize + Math.floor((world - 1) / 3),
      pass: STAR_MARKS[0],
      title: unique.length > 1 ? `${title(focus)} + review` : title(focus),
    });
  }
  return levels;
};

/** Stars (0–3) for a finished level. Bosses need 70% to pass at all. */
export const levelStars = (level, correct, total) => {
  const acc = total ? correct / total : 0;
  if (acc < level.pass) return 0;
  return STAR_MARKS.filter((m) => acc >= m).length;
};

/**
 * The suggested level to play next: the first one without stars (or 100 when all done).
 * All levels are open, so this only places Pip on the map; it never blocks a level.
 */
export const currentLevel = (levelStarsMap = {}) => {
  for (let n = 1; n <= LEVEL_COUNT; n += 1) if (!(levelStarsMap[n] > 0)) return n;
  return LEVEL_COUNT;
};

/**
 * Save a level result into a rewards record. Bonus stars only the first time it is passed.
 * @returns {{rewards: Object, bonus: number, firstClear: boolean, best: number}}
 */
export const applyLevel = (rewards, n, stars, young) => {
  const levels = { ...(rewards.levels || {}) };
  const before = levels[n] || 0;
  const best = Math.max(before, stars);
  levels[n] = best;
  const firstClear = before === 0 && stars > 0;
  const bonus = firstClear ? (isBoss(n) ? LEVEL_BONUS.boss[young ? 'young' : 'older'] : LEVEL_BONUS.regular) : 0;
  return {
    rewards: { ...rewards, levels, stars: rewards.stars + bonus, bossesBeaten: (rewards.bossesBeaten || 0) + (firstClear && isBoss(n) ? 1 : 0) },
    bonus, firstClear, best,
  };
};
