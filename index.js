import { fetchGitHubData, loadProjects } from './lib/data.js';
import { renderDefinitionList, renderProjects } from './lib/render.js';

async function renderLatestProjects() {
  const container = document.querySelector('.projects');
  try {
    const projects = await loadProjects();
    renderProjects(projects.slice(0, 3), container);
  } catch (error) {
    container.textContent = 'Unable to load projects. Please try reloading the page.';
    console.error('Unable to load projects:', error);
  }
}

async function renderProfileStats() {
  const container = document.querySelector('#profile-stats');
  try {
    const profile = await fetchGitHubData();
    renderDefinitionList(container, [
      ['Public Repos:', profile.public_repos],
      ['Public Gists:', profile.public_gists],
      ['Followers:', profile.followers],
      ['Following:', profile.following],
    ]);
  } catch (error) {
    container.textContent = 'Unable to load GitHub stats. Please try again later.';
    console.error('Unable to load GitHub stats:', error);
  }
}

await Promise.all([renderLatestProjects(), renderProfileStats()]);
