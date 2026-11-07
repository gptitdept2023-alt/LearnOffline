/**
 * Topics beyond number work: measurement, time, money, geometry and graphs
 * (Grade 4), English for early readers and Grades 1–3, and the Grade 5–6 topics (fractions,
 * decimals and percentages, ratio and algebra, triangles, volume and circles). Each module exports `generators`
 * (question makers) and `methods` (worked solutions); this index merges them so generators.js and
 * techniques.js can register them without knowing every module.
 */

import * as measurement from './measurement.js';
import * as time from './time.js';
import * as money from './money.js';
import * as geometry from './geometry.js';
import * as graphs from './graphs.js';
import * as english from './english.js';
import * as englishPlus from './englishPlus.js';
import * as fractionsPlus from './fractionsPlus.js';
import * as decimalsPercent from './decimalsPercent.js';
import * as ratioAlgebra from './ratioAlgebra.js';
import * as solids from './solids.js';

const MODULES = [measurement, time, money, geometry, graphs, english, englishPlus, fractionsPlus, decimalsPercent, ratioAlgebra, solids];

export const TOPIC_GENERATORS = Object.assign({}, ...MODULES.map((m) => m.generators));
export const TOPIC_METHODS = Object.assign({}, ...MODULES.map((m) => m.methods));
