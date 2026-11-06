import { SITE_ROOT } from './site.js';

export function renderDefinitionList(container, entries) {
  const fragment = document.createDocumentFragment();
  for (const [label, value] of entries) {
    const item = document.createElement('div');
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    item.append(term, description);
    fragment.append(item);
  }
  container.replaceChildren(fragment);
}

export function renderProjects(projects, container, headingLevel = 'h2') {
  if (typeof headingLevel !== 'string' || !/^h[1-6]$/.test(headingLevel)) {
    throw new RangeError('headingLevel must be h1 through h6');
  }

  const fragment = document.createDocumentFragment();
  for (const project of projects) {
    const article = document.createElement('article');
    const heading = document.createElement(headingLevel);
    const image = document.createElement('img');
    const details = document.createElement('div');
    const description = document.createElement('p');
    const year = document.createElement('p');

    heading.textContent = project.title;
    image.src = new URL(project.image, SITE_ROOT);
    image.alt = project.title;
    description.textContent = project.description;
    year.className = 'project-year';
    year.textContent = project.year;
    details.append(description, year);
    article.append(heading, image, details);
    fragment.append(article);
  }
  container.replaceChildren(fragment);
}
