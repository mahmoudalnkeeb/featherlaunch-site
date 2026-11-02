// Docs search, the "on this page" highlight and copy buttons on code. Search needs no prebuilt index:
// it reads the pages listed in the sidebar the first time someone focuses the field.
const input = document.getElementById('docs-search');
const pages = [...document.querySelectorAll('[data-doc-link]')].map(link => ({ url: link.getAttribute('href'), title: (link.querySelector('h3') ?? link).textContent }));

let sections;
async function loadIndex() {
  sections ??= Promise.all(pages.map(async page => {
    const html = await (await fetch(page.url)).text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const found = [{ url: page.url, title: page.title, heading: '', text: doc.querySelector('.docs-intro')?.textContent ?? '' }];
    for (const node of doc.querySelector('.prose')?.children ?? []) {
      if (node.tagName === 'H2') found.push({ url: `${page.url}#${node.id}`, title: page.title, heading: node.firstChild.textContent, text: '' });
      else found.at(-1).text += ` ${node.innerHTML.replace(/<[^>]+>/g, ' ')}`;
    }
    return found;
  })).then(all => all.flat());
  return sections;
}

function score(section, terms) {
  const heading = section.heading.toLowerCase();
  const title = section.title.toLowerCase();
  const text = section.text.toLowerCase();
  let total = 0;
  for (const term of terms) {
    const value = (heading.includes(term) ? 6 : 0) + (title.includes(term) ? 3 : 0) + (text.includes(term) ? 1 : 0);
    if (!value) return 0;
    total += value;
  }
  return total;
}

const escape = text => text.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
function snippet(text, terms) {
  const clean = text.replace(/\s+/g, ' ').trim();
  const at = Math.max(0, Math.min(...terms.map(t => { const i = clean.toLowerCase().indexOf(t); return i < 0 ? Infinity : i; })) - 30);
  const cut = (at ? '…' : '') + clean.slice(at === Infinity ? 0 : at, (at === Infinity ? 0 : at) + 110);
  const pattern = new RegExp(`(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return escape(cut).replace(pattern, '<mark>$1</mark>');
}

if (input) {
  const box = document.createElement('div');
  box.className = 'search-results';
  box.id = 'search-results';
  box.hidden = true;
  document.body.append(box);
  input.setAttribute('aria-controls', box.id);

  const place = () => {
    const rect = input.getBoundingClientRect();
    box.style.top = `${rect.bottom + 6}px`;
    box.style.left = `${Math.max(16, Math.min(rect.left, innerWidth - box.offsetWidth - 16))}px`;
  };
  const close = () => { box.hidden = true; input.setAttribute('aria-expanded', 'false'); };
  let active = -1;
  const mark = () => [...box.querySelectorAll('a')].forEach((link, i) => {
    link.classList.toggle('on', i === active);
    if (i === active) link.scrollIntoView({ block: 'nearest' });
  });

  const run = async () => {
    const terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return close();
    const all = await loadIndex();
    const hits = all.map(section => [score(section, terms), section]).filter(hit => hit[0]).sort((a, b) => b[0] - a[0]).slice(0, 8);
    box.innerHTML = hits.length
      ? hits.map(([, s]) => `<a href="${s.url}"><b>${escape(s.heading || s.title)}</b><span>${s.heading ? `${escape(s.title)} · ` : ''}${snippet(s.text, terms)}</span></a>`).join('')
      : '<p class="search-empty">Nothing found. Try another word, or <a href="https://github.com/mahmoudalnkeeb/featherlaunch/issues">ask on GitHub</a>.</p>';
    active = -1;
    box.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    place();
  };

  input.addEventListener('focus', () => { loadIndex(); if (input.value) run(); });
  input.addEventListener('input', run);
  input.addEventListener('keydown', event => {
    const links = [...box.querySelectorAll('a')];
    if (event.key === 'Escape') { close(); input.blur(); return; }
    if (box.hidden || !links.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (event.key === 'ArrowDown') active = (active + 1) % links.length;
      else active = active <= 0 ? links.length - 1 : active - 1;
      mark();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      location.href = (links[active] ?? links[0]).href;
    }
  });
  addEventListener('resize', () => { if (!box.hidden) place(); });
  addEventListener('scroll', () => { if (!box.hidden) place(); }, { passive: true });
  document.addEventListener('click', event => { if (event.target !== input && !box.contains(event.target)) close(); });
  document.addEventListener('keydown', event => {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
    event.preventDefault();
    input.focus();
  });
}

// Marks the section being read.
const tocLinks = [...document.querySelectorAll('.toc a')];
if (tocLinks.length) {
  const targets = tocLinks.map(link => document.getElementById(link.hash.slice(1)));
  const update = () => {
    const line = 120;
    let current = 0;
    targets.forEach((target, i) => { if (target.getBoundingClientRect().top <= line) current = i; });
    tocLinks.forEach((link, i) => link.classList.toggle('on', i === current));
  };
  addEventListener('scroll', update, { passive: true });
  update();
}

document.querySelectorAll('.prose pre').forEach(block => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy';
  button.textContent = 'Copy';
  button.setAttribute('aria-label', 'Copy this command');
  block.append(button);
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(block.querySelector('code').textContent);
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Press Ctrl+C';
    }
    setTimeout(() => { button.textContent = 'Copy'; }, 2000);
  });
});
