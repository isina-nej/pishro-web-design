(() => {
  const KEY = "pishro-theme";
  const BTN_ID = "pishro-theme-toggle";
  const STYLE_ID = "pishro-theme-style";

  const hex = (n) => Math.round(n).toString(16).padStart(2, "0");
  const toHex = (r, g, b) => `#${hex(r)}${hex(g)}${hex(b)}`;

  function parseColor(raw) {
    if (!raw) return null;
    const s = String(raw).trim().toLowerCase();
    if (s === "transparent" || s === "inherit" || s === "currentcolor") return null;
    let m = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(s);
    if (m) {
      let h = m[1];
      if (h.length === 3) h = h.split("").map((c) => c + c).join("");
      const n = parseInt(h.slice(0, 6), 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
    }
    m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(s);
    if (m) {
      return {
        r: +m[1],
        g: +m[2],
        b: +m[3],
        a: m[4] === undefined ? 1 : +m[4],
      };
    }
    return null;
  }

  function luma({ r, g, b }) {
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }

  function near(c, t, tol = 28) {
    return Math.abs(c.r - t.r) + Math.abs(c.g - t.g) + Math.abs(c.b - t.b) <= tol;
  }

  const NAVY = { r: 11, g: 42, b: 74 };
  const EMERALD = { r: 18, g: 164, b: 122 };
  const CREAM = { r: 245, g: 243, b: 238 };
  const PAPER = { r: 251, g: 250, b: 248 };
  const WHITE = { r: 255, g: 255, b: 255 };
  const INK = { r: 20, g: 24, b: 31 };
  const MUTED = { r: 92, g: 100, b: 115 };
  const V4_BG = { r: 6, g: 22, b: 37 };

  function mapColor(c, prop, toDark) {
    const p = prop.toLowerCase();
    const isBg = p.includes("background");
    const isBorder = p.includes("border");
    const isShadow = p.includes("shadow");
    const isTextish =
      p === "color" ||
      p.endsWith("-color") && !isBg && !isBorder ||
      p === "fill" ||
      p === "stroke";

    if (toDark) {
      if (near(c, PAPER) || near(c, CREAM) || near(c, WHITE) || luma(c) > 0.86) {
        if (isBg) return { r: 11, g: 21, b: 36, a: c.a };
        if (isBorder) return { r: 42, g: 58, b: 78, a: Math.min(1, c.a || 1) };
        return { r: 18, g: 32, b: 52, a: c.a };
      }
      if (near(c, INK) || (luma(c) < 0.22 && !near(c, NAVY) && !near(c, EMERALD))) {
        if (isBg) return { r: 18, g: 32, b: 52, a: c.a };
        return { r: 232, g: 236, b: 241, a: c.a };
      }
      if (near(c, NAVY)) {
        if (isBg || isShadow) return { r: 18, g: 58, b: 98, a: c.a };
        return { r: 214, g: 228, b: 245, a: c.a };
      }
      if (near(c, MUTED) || (luma(c) > 0.28 && luma(c) < 0.55 && !near(c, EMERALD))) {
        if (isBg) return { r: 24, g: 40, b: 60, a: c.a };
        if (isBorder) return { r: 58, g: 74, b: 96, a: c.a };
        return { r: 156, g: 167, b: 182, a: c.a };
      }
      if (isBorder && luma(c) > 0.7) return { r: 48, g: 64, b: 86, a: c.a };
      if (isShadow && luma(c) < 0.35) return { r: 0, g: 0, b: 0, a: Math.min(0.55, (c.a || 0.25) + 0.15) };
      return null;
    }

    // dark → light (for inherently dark pages like version 4)
    if (near(c, V4_BG) || (luma(c) < 0.12 && isBg)) {
      return { r: 251, g: 250, b: 248, a: c.a };
    }
    if (luma(c) > 0.82 && isTextish) {
      return { r: 11, g: 42, b: 74, a: c.a };
    }
    if (luma(c) > 0.55 && luma(c) < 0.75 && isTextish) {
      return { r: 74, g: 82, b: 97, a: c.a };
    }
    if (isBg && luma(c) < 0.25 && c.a > 0.6) {
      return { r: 255, g: 255, b: 255, a: c.a };
    }
    if (isBorder && luma(c) < 0.4) {
      return { r: 230, g: 228, b: 222, a: Math.max(c.a, 0.8) };
    }
    return null;
  }

  function formatColor(c, original) {
    const o = String(original).trim();
    if (/^rgba?\(/i.test(o) || c.a < 1) {
      const a = Math.round(c.a * 1000) / 1000;
      return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${a})`;
    }
    if (o.startsWith("#") && o.length <= 5) {
      const h = toHex(c.r, c.g, c.b);
      return `#${h[1]}${h[3]}${h[5]}`;
    }
    return toHex(c.r, c.g, c.b);
  }

  function remapValue(prop, value, toDark) {
    return value.replace(
      /#(?:[0-9a-f]{3,8})\b|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)/gi,
      (token) => {
        const c = parseColor(token);
        if (!c) return token;
        const mapped = mapColor(c, prop, toDark);
        if (!mapped) return token;
        return formatColor(mapped, token);
      }
    );
  }

  function remapCssText(cssText, toDark) {
    if (!cssText) return cssText;
    return cssText.replace(/([\w-]+)\s*:\s*([^;]+)/g, (full, prop, val) => {
      const next = remapValue(prop, val, toDark);
      return `${prop}:${next}`;
    });
  }

  function pageIsInherentlyDark() {
    try {
      const path = decodeURIComponent(location.pathname || "");
      if (/دارکمود|دارک‌مود|dark/i.test(path)) return true;
    } catch {}
    const body = document.body;
    if (!body) return false;
    const bg = getComputedStyle(body).backgroundColor;
    const c = parseColor(bg);
    return c ? luma(c) < 0.25 : false;
  }

  function desiredTheme() {
    const saved = localStorage.getItem(KEY);
    if (saved === "dark" || saved === "light") return saved;
    return pageIsInherentlyDark() ? "dark" : "light";
  }

  function ensureStyle() {
    let el = document.getElementById(STYLE_ID);
    if (el) return el;
    el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = `
      #${BTN_ID}{
        position:fixed;z-index:99999;bottom:22px;left:22px;
        display:inline-flex;align-items:center;gap:8px;
        padding:11px 16px;border-radius:999px;border:1px solid rgba(11,42,74,.14);
        background:rgba(255,255,255,.92);color:#0B2A4A;
        font:600 13.5px/1 Vazirmatn,system-ui,sans-serif;
        box-shadow:0 10px 30px rgba(11,42,74,.14);
        cursor:pointer;backdrop-filter:blur(10px);
        transition:transform .18s ease, background .18s ease, color .18s ease, border-color .18s ease;
      }
      #${BTN_ID}:hover{transform:translateY(-1px)}
      #${BTN_ID} .ico{width:16px;height:16px;display:inline-grid;place-items:center}
      html[data-theme="dark"] #${BTN_ID}{
        background:rgba(18,32,52,.92);color:#E8ECF1;border-color:rgba(255,255,255,.12);
        box-shadow:0 10px 30px rgba(0,0,0,.35);
      }
      html[data-theme="dark"]{color-scheme:dark}
      html[data-theme="light"]{color-scheme:light}
      @media (max-width:560px){
        #${BTN_ID}{bottom:16px;left:16px;padding:10px 14px;font-size:12.5px}
      }
    `;
    document.head.appendChild(el);
    return el;
  }

  function snapshot(node) {
    if (node.nodeType === 1) {
      if (node.hasAttribute("style") && node.dataset.themeOrigStyle === undefined) {
        node.dataset.themeOrigStyle = node.getAttribute("style") || "";
      }
      if (node.tagName === "STYLE" && node.dataset.themeOrigCss === undefined && node.id !== STYLE_ID) {
        node.dataset.themeOrigCss = node.textContent || "";
      }
    }
  }

  function snapshotTree(root) {
    if (!root || root.nodeType !== 1) return;
    snapshot(root);
    root.querySelectorAll("[style], style").forEach(snapshot);
  }

  function applyToTree(root, theme) {
    if (!root || root.nodeType !== 1) return;
    const inherentDark = pageIsInherentlyDark();
    // Light pages remap only for dark theme; already-dark pages remap only for light theme.
    const shouldRemap = inherentDark ? theme === "light" : theme === "dark";
    const toDarkPalette = !inherentDark;

    const applyEl = (el) => {
      if (el.id === BTN_ID || el.id === STYLE_ID) return;
      if (el.dataset.themeOrigStyle !== undefined) {
        const orig = el.dataset.themeOrigStyle;
        if (!shouldRemap) el.setAttribute("style", orig);
        else el.setAttribute("style", remapCssText(orig, toDarkPalette));
      }
      if (el.tagName === "STYLE" && el.dataset.themeOrigCss !== undefined) {
        const orig = el.dataset.themeOrigCss;
        if (!shouldRemap) el.textContent = orig;
        else el.textContent = remapCssText(orig, toDarkPalette);
      }
    };

    applyEl(root);
    root.querySelectorAll("[style], style").forEach(applyEl);
  }

  function setTheme(theme, { persist = true } = {}) {
    const next = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    if (persist) localStorage.setItem(KEY, next);
    snapshotTree(document.documentElement);
    applyToTree(document.documentElement, next);
    syncButton();
  }

  function syncButton() {
    const btn = document.getElementById(BTN_ID);
    if (!btn) return;
    const dark = document.documentElement.dataset.theme === "dark";
    btn.setAttribute("aria-pressed", dark ? "true" : "false");
    btn.innerHTML = dark
      ? `<span class="ico" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></span><span>حالت روشن</span>`
      : `<span class="ico" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"/></svg></span><span>دارک مود</span>`;
  }

  function ensureButton() {
    let btn = document.getElementById(BTN_ID);
    if (btn) return btn;
    btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.type = "button";
    btn.setAttribute("aria-label", "تغییر حالت روشن و تاریک");
    btn.addEventListener("click", () => {
      const cur = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
      setTheme(cur === "dark" ? "light" : "dark");
    });
    document.body.appendChild(btn);
    return btn;
  }

  let obs;
  function watch() {
    if (obs) return;
    obs = new MutationObserver((mutations) => {
      const theme = document.documentElement.dataset.theme || desiredTheme();
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "style" && m.target.nodeType === 1) {
          const el = m.target;
          if (el.id === BTN_ID) continue;
          if (el.dataset.themeOrigStyle === undefined) {
            el.dataset.themeOrigStyle = el.getAttribute("style") || "";
            applyToTree(el, theme);
          }
        }
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          snapshotTree(n);
          applyToTree(n, theme);
        });
      }
    });
    obs.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["style"],
    });
  }

  function boot() {
    ensureStyle();
    ensureButton();
    snapshotTree(document.documentElement);
    setTheme(desiredTheme(), { persist: !!localStorage.getItem(KEY) });
    watch();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
  // DC runtime may hydrate a bit later
  window.addEventListener("load", () => {
    snapshotTree(document.documentElement);
    setTheme(document.documentElement.dataset.theme || desiredTheme(), {
      persist: !!localStorage.getItem(KEY),
    });
  });
})();
