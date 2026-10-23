import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectCount = projects.length;

const projectContainer = document.querySelector('.projects');

renderProjects(projects, projectContainer, 'h2');

const projectsTitle = document.querySelector('.projects-title');

projectsTitle.textContent = `My Projects (${projectCount})`;