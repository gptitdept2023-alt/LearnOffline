/**
 * Small DOM helpers shared by every screen.
 *
 * `h()` builds elements without innerHTML, so text from profiles or content
 * packs can never inject markup. Screens build their whole view in memory and
 * attach it once, which keeps layout work to a single reflow per render.
 */

/**
 * Create an element.
 * @param {string} tag Tag name, optionally with classes: "button.btn.btn-primary".
 * @param {Object|null} [attrs] Attributes, properties and `on*` event handlers.
 * @param {...(Node|string|number|false|null|undefined|Array)} children
 * @returns {HTMLElement}
 */
export const h = (tag, attrs, ...children) => {
  const [name, ...classes] = tag.split('.');
  const el = document.createElement(name || 'div');
  if (classes.length) el.classList.add(...classes);

  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === null || value === false) continue;
      if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === 'class') {
        el.classList.add(...String(value).split(/\s+/).filter(Boolean));
      } else if (key === 'dataset') {
        Object.assign(el.dataset, value);
      } else if (key === 'style' && typeof value === 'object') {
        // Only CSS custom properties are set from JS; all styling lives in CSS files.
        for (const [prop, v] of Object.entries(value)) el.style.setProperty(prop, v);
      } else if (key in el && typeof value !== 'string') {
        el[key] = value;
      } else {
        el.setAttribute(key, value === true ? '' : String(value));
      }
    }
  }
  appendChildren(el, children);
  return el;
};

/** Append children, flattening arrays and skipping empty values. */
export const appendChildren = (parent, children) => {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
};

/** Create an SVG element (bar models, charts, visuals). */
export const svg = (tag, attrs = {}, ...children) => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== null) el.setAttribute(key, String(value));
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
};

/** Replace all content of `el` with `children`. */
export const mount = (el, ...children) => {
  el.replaceChildren();
  return appendChildren(el, children);
};

/* ------------------------------------------------------------------ */
/* Toasts                                                              */
/* ------------------------------------------------------------------ */

const TOAST_MS = 3500;

/**
 * Show a short non-blocking message.
 * @param {string} message
 * @param {'info'|'success'|'error'} [kind]
 */
export const toast = (message, kind = 'info') => {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = h('div.toast-host', { id: 'toast-host', role: 'status', 'aria-live': 'polite' });
    document.body.append(host);
  }
  const item = h(`div.toast.toast-${kind}`, null, message);
  host.append(item);
  setTimeout(() => item.remove(), TOAST_MS);
};

/* ------------------------------------------------------------------ */
/* Dialogs                                                             */
/* ------------------------------------------------------------------ */

/**
 * Open a modal built on <dialog>. Resolves with the value passed to `close`.
 * @param {(close: (value: any) => void) => HTMLElement} build Builds the dialog body.
 * @returns {Promise<any>}
 */
export const openDialog = (build) => new Promise((resolve) => {
  const dialog = h('dialog.dialog');
  let settled = false;
  const close = (value) => {
    if (settled) return;
    settled = true;
    dialog.close();
    dialog.remove();
    resolve(value);
  };
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close(null);
  });
  dialog.append(build(close));
  document.body.append(dialog);
  dialog.showModal();
  const focusTarget = dialog.querySelector('[autofocus], input, button');
  if (focusTarget) focusTarget.focus();
});

/**
 * Ask the user to confirm an action. Used before every destructive step.
 * @returns {Promise<boolean>}
 */
export const confirmDialog = ({ title, message, confirmText = 'OK', cancelText = 'Cancel', danger = false }) =>
  openDialog((close) => h('div.dialog-body', null,
    h('h2.dialog-title', null, title),
    h('p', null, message),
    h('div.dialog-actions', null,
      h('button.btn.btn-ghost', { type: 'button', onclick: () => close(false) }, cancelText),
      h(`button.btn.${danger ? 'btn-danger' : 'btn-primary'}`, { type: 'button', autofocus: true, onclick: () => close(true) }, confirmText),
    ),
  )).then(Boolean);

/* ------------------------------------------------------------------ */
/* Loading indicator                                                   */
/* ------------------------------------------------------------------ */

/**
 * Show a spinner while `task` runs, then hide it. Errors propagate to the caller.
 * @template T
 * @param {() => Promise<T>} task
 * @param {string} [label]
 * @returns {Promise<T>}
 */
export const withLoading = async (task, label = 'Loading…') => {
  const overlay = h('div.loading-overlay', { role: 'alert', 'aria-busy': 'true' },
    h('div.spinner'), h('p', null, label));
  // Delay showing it so fast operations don't flash a spinner.
  const timer = setTimeout(() => document.body.append(overlay), 150);
  try {
    return await task();
  } finally {
    clearTimeout(timer);
    overlay.remove();
  }
};
