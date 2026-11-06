import { GITHUB_USERNAME } from './site.js';

export async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export function loadProjects() {
  return fetchJSON(new URL('projects.json', import.meta.url));
}

export function fetchGitHubData(username = GITHUB_USERNAME) {
  return fetchJSON(`https://api.github.com/users/${username}`);
}
