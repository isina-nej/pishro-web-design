(() => {
  const STYLE_ID = "pishro-site-fix";

  function injectCss() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = `
/* Keep reveal content visible if observer races after SPA page switches */
[data-reveal].in{opacity:1}

@media (max-width:900px){
  html,body{overflow-x:hidden}
  header{position:static!important;top:auto!important;margin:0!important;padding:0!important}
  header > div,
  header [style*="display:flex"]{
    height:auto!important;
    min-height:0!important;
    flex-wrap:wrap!important;
    row-gap:12px!important;
    padding:14px 16px!important;
    border-radius:0!important;
  }
  header nav{
    order:3!important;
    width:100%!important;
    display:flex!important;
    flex-wrap:wrap!important;
    gap:8px 12px!important;
    font-size:13px!important;
  }
  header nav a{padding:6px 0!important}
  [style*="grid-template-columns"]{grid-template-columns:1fr!important}
  [style*="grid-column:span"],
  [style*="grid-column: span"]{grid-column:span 1!important}
  h1{font-size:clamp(28px,7.5vw,42px)!important;line-height:1.45!important;letter-spacing:-.4px!important}
  h2{font-size:clamp(22px,5.8vw,30px)!important}
  h3{font-size:clamp(17px,4.6vw,22px)!important}
  section,article,footer > div,[data-page] > section{
    padding-left:16px!important;
    padding-right:16px!important;
  }
  [style*="position:fixed"][style*="bottom"]{
    left:12px!important;
    right:12px!important;
    width:auto!important;
    max-width:none!important;
  }
  [style*="position:fixed"][style*="bottom"] > div{
    flex-wrap:wrap!important;
    row-gap:10px!important;
    height:auto!important;
    padding-top:12px!important;
    padding-bottom:12px!important;
  }
}

@media (max-width:640px){
  body{font-size:15px}
  header > div{padding:12px 14px!important;gap:10px!important}
  header nav{gap:6px 10px!important;font-size:12.5px!important}
  section,article,footer > div{padding-left:14px!important;padding-right:14px!important}
  [style*="padding: 44px"],
  [style*="padding: 46px"],
  [style*="padding: 48px"],
  [style*="padding: 52px"],
  [style*="padding: 38px"],
  [style*="padding: 36px"],
  [style*="padding: 32px"],
  [style*="padding: 30px"]{padding:22px!important}
  [style*="max-width:1180px"],
  [style*="max-width:1200px"],
  [style*="max-width:1220px"],
  [style*="max-width:1080px"]{padding-left:14px!important;padding-right:14px!important}
  footer [style*="grid-template-columns"]{gap:28px!important}
  button[onclick],
  button[style*="position:fixed"]{
    bottom:14px!important;
    left:14px!important;
    right:auto!important;
    padding:10px 14px!important;
    font-size:12.5px!important;
  }
}
`;
    document.head.appendChild(el);
  }

  function revealAllPending() {
    document.querySelectorAll("[data-reveal]:not(.in)").forEach((el) => {
      el.classList.add("in");
      el.querySelectorAll("[data-count]").forEach((c) => {
        if (c.dataset.countDone) return;
        const to = +c.dataset.count;
        if (!Number.isFinite(to)) return;
        c.dataset.countDone = "1";
        const sfx = c.dataset.suffix || "";
        const pfx = c.dataset.prefix || "";
        const fa = (n) => Math.round(n).toLocaleString("fa-IR");
        c.textContent = pfx + fa(to) + sfx;
      });
    });
  }

  function bootRevealFix() {
    // Keep watching forever so SPA page switches don't leave opacity:0 content.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target;
          el.classList.add("in");
          io.unobserve(el);
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -4% 0px" }
    );

    const scan = () => {
      document.querySelectorAll("[data-reveal]:not(.in)").forEach((el) => io.observe(el));
    };

    scan();
    setInterval(scan, 400);

    // After loading overlay / sc-if swaps, force-visible as failsafe.
    const mo = new MutationObserver(() => {
      clearTimeout(mo._t);
      mo._t = setTimeout(() => {
        scan();
        // If still pending briefly after mount into DOM, force show (nav pages).
        setTimeout(revealAllPending, 350);
      }, 40);
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });

    // Also force after clicks on in-app nav.
    document.addEventListener(
      "click",
      (e) => {
        const a = e.target && e.target.closest ? e.target.closest("a,button") : null;
        if (!a) return;
        setTimeout(revealAllPending, 550);
        setTimeout(revealAllPending, 900);
      },
      true
    );
  }

  function boot() {
    injectCss();
    bootRevealFix();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
