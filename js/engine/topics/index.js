/**
 * Topics beyond number work: measurement, time, money, geometry and graphs
 * (Grade 4), and English for early readers. Each module exports `generators`
 * (question makers) and `methods` (worked solutions); this index merges them so generators.js and
 * techniques.js can register them without knowing every module.
 */

import * as measurement from './measurement.js';
import * as time from './time.js';
import * as money from './money.js';
import * as geometry from './geometry.js';
import * as graphs from './graphs.js';
import * as english from './english.js';

const MODULES = [measurement, time, money, geometry, graphs, english];

export const TOPIC_GENERATORS = Object.assign({}, ...MODULES.map((m) => m.generators));
export const TOPIC_METHODS = Object.assign({}, ...MODULES.map((m) => m.methods));
