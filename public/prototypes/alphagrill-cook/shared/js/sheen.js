/* Sheen — one shimmer for every label that says something is under way: v19 (and the v0 reached from it) — the 간이 청소 pill
   ("간이 청소 중"), 마감 청소's "이동 중" button. It replaces the app's TextShimmer (components/motion-primitives/text-shimmer.tsx,
   a gradient painted through the text with background-clip), which here read as off: a band darker than the text on the pill
   (a passing shadow) and a bright one on the button, sweeping non-stop, its pace and width tied to the text's length (a thin,
   quick stripe on short Korean labels), and the text drawn softer than the labels around it.

   Now: the label is drawn as usual in its own (base) colour; a copy of it in the highlight colour lies on top and shows through a
   soft 80px window (clear → full → clear) that sweeps left → right at a set pace — 240 px/s, ease-in-out, whatever the length —
   then rests 0.8s before the next sweep. Reduced motion: the label alone, no sweep. The copy takes the label's padding (its box
   is the label's padding box), so a padded label — the English cook steps', 0.2em on the left against their tracking — keeps
   the two in register (without it the copy sat 6.4 left of "PRESSING", a doubled word).

   ProtoSheen.set(el, text, { base, hl }) — base / hl are CSS colours (default white 70 % / white). Calling it again with the same
   text keeps the running sweep. */
(function () {
  'use strict';
  const BAND = 80, SPEED = 240, REST = 800;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  const st = document.createElement('style');
  st.textContent = `
    .sheen { position: relative; display: inline-block; }
    .sheen-hl { position: absolute; inset: 0; padding: inherit; pointer-events: none; white-space: inherit;
      -webkit-mask-image: linear-gradient(90deg, transparent, #000 50%, transparent); mask-image: linear-gradient(90deg, transparent, #000 50%, transparent);
      -webkit-mask-size: ${BAND}px 100%; mask-size: ${BAND}px 100%; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
      -webkit-mask-position: -${BAND}px 0; mask-position: -${BAND}px 0; }
  `;
  document.head.appendChild(st);

  function set(el, text, opts = {}) {
    if (!el) return;
    el.style.color = opts.base || 'rgb(255 255 255 / 70%)';
    if (el.dataset.sheenText === text && el._sheenHl && el._sheenHl.isConnected) {
      el._sheenHl.style.color = opts.hl || '#fff';
      return;
    }
    el.dataset.sheenText = text;
    el.classList.add('sheen');
    el.textContent = text;
    const hl = document.createElement('span');
    hl.className = 'sheen-hl';
    hl.setAttribute('aria-hidden', 'true');
    hl.style.color = opts.hl || '#fff';
    hl.textContent = text;
    el.appendChild(hl);
    el._sheenHl = hl;
    if (el._sheen) el._sheen.cancel();
    el._sheen = null;
    if (reduce.matches) return;
    const w = el.offsetWidth || text.length * 22;   // hidden at the moment: a rough width
    const sweep = ((w + BAND) / SPEED) * 1000;
    el._sheen = hl.animate([
      { maskPosition: `-${BAND}px 0`, offset: 0, easing: 'ease-in-out' },
      { maskPosition: `calc(100% + ${BAND}px) 0`, offset: sweep / (sweep + REST) },
      { maskPosition: `calc(100% + ${BAND}px) 0`, offset: 1 },
    ], { duration: sweep + REST, iterations: Infinity });
  }

  window.ProtoSheen = { set };
})();
