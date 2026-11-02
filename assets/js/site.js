// Enhancements for every page. Each block leaves the page working without it.
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

document.documentElement.classList.add('js');

// The header gets its line only once the page has moved.
const bar = document.querySelector('.bar');
if (bar) {
  const mark = () => bar.classList.toggle('stuck', scrollY > 8);
  addEventListener('scroll', mark, { passive: true });
  mark();
}

// Copy buttons appear only here, since the text stays selectable without them.
const status = document.getElementById('copy-status');
function copyButton(button, text) {
  let timer;
  const label = button.textContent;
  button.hidden = false;
  button.addEventListener('click', async () => {
    clearTimeout(timer);
    try {
      await navigator.clipboard.writeText(text());
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Press Ctrl+C';
    }
    if (status) status.textContent = button.textContent;
    timer = setTimeout(() => {
      button.textContent = label;
      if (status) status.textContent = '';
    }, 2000);
  });
}
$$('.check').forEach(box => {
  const code = box.querySelector('code');
  copyButton(box.querySelector('.copy'), () => code.textContent);
});

// The Linux build is x86-64 only, so only a matching system changes which download is primary.
if (document.documentElement.classList.contains('linux')) {
  $$('.dl .btn').forEach(button => button.classList.toggle('primary'));
}

// The product tour. Without this script every panel simply shows, one after another.
const tabs = $$('.tour-tab');
if (tabs.length) {
  const select = (tab, focus) => {
    tabs.forEach(other => {
      const on = other === tab;
      other.setAttribute('aria-selected', on);
      other.tabIndex = on ? 0 : -1;
      document.getElementById(other.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', event => {
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      select(tabs[(i + step + tabs.length) % tabs.length], true);
    });
  });
  select(tabs[0]);
}

// The weigh-in. Figures are the starting points from the "Running well on an old PC" guide.
const planner = document.getElementById('planner');
if (planner) {
  const LAUNCHER_GB = 50 / 1024;
  const plans = {
    4: {
      light: { show: '1.5–2 GB', gb: 2, tip: 'Close your browser before you play. It is often the biggest memory user on the PC.' },
      packs: { show: '2 GB', gb: 2, tip: 'Stick to small packs, and leave out shaders and other heavy extras.' },
    },
    8: {
      light: { show: '2 GB', gb: 2, tip: 'Add Sodium on Fabric or Quilt. It is often the single biggest boost.' },
      packs: { show: '3–4 GB', gb: 4, tip: 'Fabulously Optimized is a good pack to start from.' },
    },
    16: {
      light: { show: '2–3 GB', gb: 3, tip: 'More memory will not add frames here. A smaller window can.' },
      packs: { show: '4–6 GB', gb: 6, tip: 'More is not always better. Stop where brief freezes go away.' },
    },
  };
  const part = name => planner.querySelector(`[data-part="${name}"]`);
  const format = gb => `${String(+gb.toFixed(1))} GB`;
  const render = () => {
    const ram = +planner.elements.ram.value;
    const plan = plans[ram][planner.elements.play.value];
    const left = ram - plan.gb - LAUNCHER_GB;
    part('launcher').style.width = `${LAUNCHER_GB / ram * 100}%`;
    part('game').style.width = `${plan.gb / ram * 100}%`;
    part('give').textContent = plan.show;
    part('left').textContent = `About ${format(left)}`;
    part('tip').textContent = plan.tip;
    $$('[data-tick]', planner).forEach((tick, i, all) => { tick.textContent = i ? format(ram * i / (all.length - 1)) : '0'; });
  };
  // navigator.deviceMemory is coarse and stays on this page. It only picks the starting button.
  const memory = navigator.deviceMemory;
  if (memory) planner.elements.ram.value = memory <= 4 ? '4' : memory >= 16 ? '16' : '8';
  planner.addEventListener('change', render);
  planner.addEventListener('submit', event => event.preventDefault());
  render();

  // The feather lands once, the first time the scale is on screen.
  const scale = planner.querySelector('.scale');
  new IntersectionObserver((entries, observer) => {
    if (entries[0].isIntersecting) {
      scale.classList.add('drop');
      observer.disconnect();
    }
  }, { threshold: .6 }).observe(scale);
}

// What this page actually cost to load, measured by the browser rather than written down.
const weight = document.getElementById('weight');
if (weight) {
  addEventListener('load', () => setTimeout(() => {
    const entries = [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')];
    const bytes = entries.reduce((sum, entry) => sum + (entry.transferSize || entry.encodedBodySize || 0), 0);
    if (bytes) weight.textContent = `This page loaded ${Math.round(bytes / 1000)} KB, with no web fonts and no framework.`;
  }, 800));
}
