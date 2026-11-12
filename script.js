// Website pricing calculator — Sarah Itafa. No framework or third-party scripts needed.

// ---------- Light / dark theme ----------
// The small script in <head> has already set data-theme before the page painted;
// this part runs the switch in the header and remembers the visitor's choice.
// It uses the same saved key ('theme') as the portfolio, so one choice carries across both pages.
const html = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const themeButton = document.querySelector('.theme-toggle');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const THEME_COLORS = { light: '#f8edf2', dark: '#070a1a' };

function showTheme(theme) {
  html.setAttribute('data-theme', theme);
  if (themeColorMeta) themeColorMeta.setAttribute('content', THEME_COLORS[theme]);
  if (themeButton) {
    const next = theme === 'dark' ? 'light' : 'dark';
    themeButton.setAttribute('aria-label', 'Switch to ' + next + ' mode');
    themeButton.setAttribute('title', 'Switch to ' + next + ' mode');
  }
}

// If the <head> script is missing (for example the page was embedded), read the saved choice here, else use light.
let savedTheme = null;
try { savedTheme = localStorage.getItem('theme'); } catch (e) {}
showTheme(html.getAttribute('data-theme') || (savedTheme === 'dark' ? 'dark' : 'light'));

if (themeButton) {
  themeButton.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', next); } catch (e) { /* private mode: the choice just isn't remembered */ }

    if (document.startViewTransition && !reducedMotion) {
      // the new theme spreads out from the button like a ripple
      const box = themeButton.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const transition = document.startViewTransition(() => showTheme(next));
      transition.ready.then(() => {
        html.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 700, easing: 'cubic-bezier(.22, .8, .3, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      }).catch(() => {});
    } else {
      // no View Transitions: let the colours fade instead
      html.classList.add('theme-fade');
      showTheme(next);
      setTimeout(() => html.classList.remove('theme-fade'), 450);
    }
  });
}

// ---------- Pricing ----------
// Each option is [label, price change]. The first option in every group is the default.
// To change a price or add an option, edit this list only.
const groups = [
  { id: 'service',   title: 'SERVICE',             options: [['Design & development', 0], ['Design only', -40], ['Development only', -25]] },
  { id: 'pages',     title: 'NUMBER OF PAGES',     options: [['Landing page', 0], ['2 pages', 95], ['3 pages', 195], ['4 pages', 290], ['5 pages', 385]] },
  { id: 'languages', title: 'NUMBER OF LANGUAGES', options: [['1 language', 0], ['2 languages', 65], ['3 languages', 130]] },
  { id: 'method',    title: 'BUILD METHOD',        options: [['Coded', 0], ['No-code', -20]] },
  { id: 'animation', title: 'ANIMATION LEVEL',     options: [['No animation', 0], ['Light', 45], ['Medium', 95]] }
];

const selections = Object.fromEntries(groups.map(g => [g.id, 0]));
const questions = document.querySelector('#questions');
const priceEl = document.querySelector('#price');
const tierEl = document.querySelector('#tier');
const whatsappEl = document.querySelector('#whatsapp');
const copyButton = document.querySelector('#copy');

// build the questions from the list above
for (const group of groups) {
  const section = document.createElement('section');
  section.className = 'question';

  const title = document.createElement('h3');
  title.id = 'q-' + group.id;
  title.textContent = group.title;
  section.append(title);

  const choices = document.createElement('div');
  choices.className = 'options';
  choices.setAttribute('role', 'group');
  choices.setAttribute('aria-labelledby', title.id);

  group.options.forEach(([label], index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option';
    button.textContent = label;
    button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
    button.addEventListener('click', () => {
      selections[group.id] = index;
      choices.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(i === index)));
      update();
    });
    choices.append(button);
  });

  section.append(choices);
  questions.append(section);
}

const fmt = n => '$' + n.toLocaleString('en-US');
let summary = '';

function update() {
  let score = 360;
  for (const group of groups) score += group.options[selections[group.id]][1];

  const low = Math.max(300, Math.min(1000, Math.round((score - 30) / 10) * 10));
  const high = Math.max(low, Math.min(1000, Math.round((score + 30) / 10) * 10));
  const category = high <= 650 ? 'Simple website' : 'Custom website';

  priceEl.textContent = fmt(low) + ' – ' + fmt(high);
  tierEl.textContent = category;

  summary = 'Website estimate: ' + fmt(low) + ' – ' + fmt(high) + ' USD\n' +
    groups.map(g => g.title + ': ' + g.options[selections[g.id]][0]).join('\n');

  whatsappEl.href = 'https://wa.me/18674459179?text=' + encodeURIComponent(
    'Hi Sarah! I used your website pricing calculator.\n\n' + summary + '\n\nI would like to discuss my project.'
  );
}
update();

// ---------- Copy estimate ----------
function copyWithSelection(text) {
  // older browsers and some embedded views have no navigator.clipboard
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.append(area);
  area.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) {}
  area.remove();
  return ok;
}

let copyTimer;
copyButton.addEventListener('click', async () => {
  let ok = false;
  try {
    await navigator.clipboard.writeText(summary);
    ok = true;
  } catch (e) {
    ok = copyWithSelection(summary);
  }
  copyButton.textContent = ok ? 'Copied!' : 'Copy unavailable';
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => { copyButton.textContent = 'Copy estimate'; }, 1800);
});

document.querySelector('#year').textContent = new Date().getFullYear();
