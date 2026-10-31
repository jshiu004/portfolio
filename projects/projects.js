import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');

const projectCount = projects.length;

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

const projectsTitle = document.querySelector('.projects-title');

projectsTitle.textContent = `My Projects (${projectCount})`;

function renderPieChart(projectsGiven) {
  let selectedIndex = -1;
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });
  let newArcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => newArcGenerator(d));
  const colors = d3.scaleOrdinal(d3.schemeTableau10);
  let newSVG = d3.select('svg');
  newSVG.selectAll('path').remove();

  const legend = d3.select('.legend');
  legend.selectAll('li').remove();

  newArcs.forEach((arc, i) => {
    newSVG
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        newSVG
          .selectAll('path')
          .attr('class', (_, idx) => (
            idx === selectedIndex ? 'selected' : ''
          ));

        legend
          .selectAll('li')
          .attr('class', (_, idx) => (
            idx === selectedIndex ? 'legend-item selected' : 'legend-item'
          ));

        if (selectedIndex === -1) {
          renderProjects(projects, projectsContainer, 'h2');
        } else {
          const filteredProjects = projects.filter((project) => project.year === newData[selectedIndex].label);
          renderProjects(filteredProjects, projectsContainer, 'h2');
        }
      });
  });

  newData.forEach((d, idx) => {
    legend
      .append('li')
      .attr('class', 'legend-item')
      .attr('style', `--color:${colors(idx)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

renderPieChart(projects);

let query = '';

let searchInput = document.querySelector('.searchBar');

function setQuery(value) {
  query = value;

  return projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

searchInput.addEventListener('input', (event) => {
  let filteredProjects = setQuery(event.target.value);
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});

