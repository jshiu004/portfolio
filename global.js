import { GITHUB_URL, SITE_ROOT } from './lib/site.js';

function renderNavigation() {
  const pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: GITHUB_URL, title: 'GitHub' },
    { url: 'meta/', title: 'Meta' },
    { url: 'resume/', title: 'Resume' },
  ];
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Main navigation');
  const currentPath = location.pathname.replace(/index\.html$/, '');

  for (const { url, title } of pages) {
    const link = document.createElement('a');
    link.href = new URL(url, SITE_ROOT);
    link.textContent = title;

    if (link.host === location.host && link.pathname === currentPath) {
      link.classList.add('current');
      link.setAttribute('aria-current', 'page');
    }
    if (link.host !== location.host) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    nav.append(link);
  }
  document.body.prepend(nav);
}

function initializeTheme() {
  const label = document.createElement('label');
  label.className = 'color-scheme';
  label.append('Theme: ');
  const select = document.createElement('select');
  for (const [value, text] of [
    ['light dark', 'Automatic'],
    ['light', 'Light'],
    ['dark', 'Dark'],
  ]) {
    select.add(new Option(text, value));
  }
  label.append(select);
  document.body.prepend(label);

  function applyTheme(value) {
    document.documentElement.style.setProperty('color-scheme', value);
    select.value = value;
  }

  // Theme switching still works when browser storage is unavailable.
  try {
    const savedTheme = localStorage.getItem('colorScheme');
    if (Array.from(select.options).some((option) => option.value === savedTheme)) {
      applyTheme(savedTheme);
    }
  } catch (error) {
    console.warn('Unable to read the saved theme:', error);
  }

  select.addEventListener('input', () => {
    applyTheme(select.value);
    try {
      localStorage.setItem('colorScheme', select.value);
    } catch (error) {
      console.warn('Unable to save the theme:', error);
    }
  });
}

renderNavigation();
initializeTheme();
