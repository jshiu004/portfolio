import * as d3 from '../lib/d3.js';
import { loadProjects } from '../lib/data.js';
import { renderProjects } from '../lib/render.js';

function initializeProjects(projects) {
  const container = document.querySelector('.projects');
  const searchInput = document.querySelector('.searchBar');
  const chart = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');
  const colors = d3.scaleOrdinal(d3.schemeTableau10)
    .domain([...new Set(projects.map((d) => d.year))]);
  const arc = d3.arc().innerRadius(0).outerRadius(50);
  const pie = d3.pie().value((d) => d.value);
  let visibleProjects = projects;
  let selectedYear = null;

  document.querySelector('.projects-title').textContent = `My Projects (${projects.length})`;

  function renderSelection() {
    const selectedProjects = selectedYear === null
      ? visibleProjects
      : visibleProjects.filter((project) => project.year === selectedYear);
    renderProjects(selectedProjects, container);
    chart.selectAll('path').classed('selected', (d) => d.data.label === selectedYear);
    legend.selectAll('li').classed('selected', (d) => d.label === selectedYear);
  }

  function renderPieChart() {
    const yearData = d3.rollups(visibleProjects, (group) => group.length, (d) => d.year)
      .map(([label, value]) => ({ label, value }));

    chart.selectAll('path')
      .data(pie(yearData), (d) => d.data.label)
      .join('path')
      .attr('d', arc)
      .attr('fill', (d) => colors(d.data.label))
      .on('click', (event, d) => {
        selectedYear = selectedYear === d.data.label ? null : d.data.label;
        renderSelection();
      });

    const items = legend.selectAll('li')
      .data(yearData, (d) => d.label)
      .join((enter) => {
        const item = enter.append('li').attr('class', 'legend-item');
        item.append('span').attr('class', 'swatch');
        item.append('span').attr('class', 'legend-label');
        item.append('em');
        return item;
      })
      .style('--color', (d) => colors(d.label));
    items.select('.legend-label').text((d) => d.label);
    items.select('em').text((d) => `(${d.value})`);
  }

  function updateSearch() {
    const query = searchInput.value.toLowerCase();
    visibleProjects = projects.filter((project) =>
      Object.values(project).join('\n').toLowerCase().includes(query),
    );
    selectedYear = null;
    renderPieChart();
    renderSelection();
  }

  searchInput.addEventListener('input', updateSearch);
  updateSearch();
}

try {
  initializeProjects(await loadProjects());
} catch (error) {
  document.querySelector('.projects').textContent = 'Unable to load projects. Please try reloading the page.';
  console.error('Unable to load projects:', error);
}
