/**
 * Hash router: "#/topic/add-sub" -> screen "topic" with params ["add-sub"].
 * Hash routing needs no server rules, so it works from GitHub Pages and offline.
 */

const routes = new Map();
let notFound = null;
let beforeEach = null;

/** Register a screen. `render(root, ...params)` may be async. */
export const route = (name, render) => routes.set(name, render);

export const setNotFound = (render) => { notFound = render; };

/** Guard run before every screen; return a route string to redirect. */
export const setBeforeEach = (fn) => { beforeEach = fn; };

export const navigate = (path) => {
  const target = `#/${path.replace(/^#?\/?/, '')}`;
  if (window.location.hash === target) render();
  else window.location.hash = target;
};

const parse = () => {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(safeDecode);
  return { name: parts[0] || '', params: parts.slice(1) };
};

let renderToken = 0;

/** decodeURIComponent that keeps the raw text instead of throwing on "%E0". */
function safeDecode(part) {
  try { return decodeURIComponent(part); } catch { return part; }
}

/** Render the current route into #app. Stale async renders are discarded. */
export const render = async () => {
  const root = document.getElementById('app');
  const token = ++renderToken;
  const { name, params } = parse();
  if (beforeEach) {
    const redirect = await beforeEach(name, params);
    if (token !== renderToken) return;
    if (redirect !== undefined && redirect !== null && redirect !== name) {
      navigate(redirect);
      return;
    }
  }
  const screen = routes.get(name) || notFound;
  const view = document.createElement('main');
  view.className = `screen screen-${name || 'start'}`;
  try {
    await screen(view, ...params);
  } catch (error) {
    console.error(error);
    view.replaceChildren();
    const msg = document.createElement('div');
    msg.className = 'error-panel';
    msg.innerHTML = '<h2>Something went wrong</h2><p></p><a class="btn btn-primary" href="#/">Go to start</a>';
    msg.querySelector('p').textContent = error.message || String(error);
    view.append(msg);
  }
  if (token !== renderToken) return;
  root.replaceChildren(view);
  window.scrollTo(0, 0);
  const heading = view.querySelector('h1');
  if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
};

export const startRouter = () => {
  window.addEventListener('hashchange', render);
  render();
};
