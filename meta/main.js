import * as d3 from '../lib/d3.js';
import { renderDefinitionList } from '../lib/render.js';
import { REPOSITORY_URL } from '../lib/site.js';

const formatNumber = d3.format(',');

async function loadData() {
  return d3.csv(new URL('loc.csv', import.meta.url), (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(`${row.date}T00:00${row.timezone}`),
    datetime: new Date(row.datetime),
  }));
}

function processCommits(data) {
  return d3.groups(data, (d) => d.commit).map(([id, lines]) => {
    const { author, date, time, timezone, datetime } = lines[0];
    const commit = {
      id,
      url: `${REPOSITORY_URL}/commit/${id}`,
      author,
      date,
      time,
      timezone,
      datetime,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
      totalLines: lines.length,
    };

    // Keep the source lines accessible without cluttering the commit's fields.
    Object.defineProperty(commit, 'lines', {
      value: lines,
      enumerable: false,
      writable: false,
      configurable: false,
    });

    return commit;
  });
}

function renderCommitInfo(data, commits) {
  const fileLengths = d3.rollups(
    data,
    (lines) => d3.max(lines, (d) => d.line),
    (d) => d.file,
  );
  const workByPeriod = d3.rollups(
    data,
    (lines) => lines.length,
    (d) => d.datetime.toLocaleString('en', { dayPeriod: 'short' }),
  );
  renderDefinitionList(document.getElementById('stats'), [
    ['Total lines of code', formatNumber(data.length)],
    ['Total commits', commits.length],
    ['Total files', fileLengths.length],
    ['Average file length', d3.mean(fileLengths, (d) => d[1])?.toFixed(1) ?? 'N/A'],
    ['Most active time of day', d3.greatest(workByPeriod, (d) => d[1])?.[0] ?? 'N/A'],
    ['Maximum depth', d3.max(data, (d) => d.depth) ?? 'N/A'],
  ]);
}

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  link.href = commit.url;
  link.textContent = commit.id;

  const fields = {
    'commit-date': commit.datetime.toLocaleDateString('en', { dateStyle: 'full' }),
    'commit-time': commit.datetime.toLocaleTimeString('en', { timeStyle: 'short' }),
    'commit-author': commit.author,
    'commit-lines': formatNumber(commit.totalLines),
  };

  for (const [id, value] of Object.entries(fields)) {
    document.getElementById(id).textContent = value;
  }
}

function showTooltip(commit, position) {
  renderTooltipContent(commit);
  updateTooltipVisibility(true);
  updateTooltipPosition(position);
}

function updateTooltipVisibility(isVisible) {
  document.getElementById('commit-tooltip').hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  const offset = 12;
  const { width, height } = tooltip.getBoundingClientRect();
  const left = Math.max(offset, Math.min(event.clientX + offset, innerWidth - width - offset));
  const top = Math.max(offset, Math.min(event.clientY + offset, innerHeight - height - offset));
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function isCommitSelected(selection, commit, xScale, yScale) {
  if (!selection) return false;

  const [[x0, y0], [x1, y1]] = selection;
  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderSelectionCount(selectedCommits) {
  const count = selectedCommits.length;
  d3.select('#selection-count').text(
    count ? `${count} commit${count === 1 ? '' : 's'} selected` : 'No commits selected',
  );
}

function renderLanguageBreakdown(selectedCommits) {
  const lines = selectedCommits.flatMap((d) => d.lines);
  const breakdown = d3.rollups(lines, (group) => group.length, (d) => d.type);
  const entries = d3.sort(breakdown, ([language]) => language).map(([language, count]) => [
    language,
    `${formatNumber(count)} lines (${d3.format('.1~%')(count / lines.length)})`,
  ]);
  renderDefinitionList(document.getElementById('language-breakdown'), entries);
}

function createBrushSelector(svg, usableArea, brushed) {
  const brush = d3.brush()
    .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
    .on('start brush end', brushed);
  const brushGroup = svg.append('g').attr('class', 'brush').call(brush);

  // Dots stay above the overlay so hover and keyboard focus still work.
  svg.select('.dots').raise();
  d3.select('#clear-selection').on('click', () => brushGroup.call(brush.move, null));
}

function renderScatterPlot(commits) {
  const chart = d3.select('#chart');
  chart.selectAll('*').remove();
  if (commits.length === 0) {
    chart.append('p').text('No commit data available.');
    return;
  }

  const width = 1000;
  const height = 600;
  const margin = { top: 40, right: 40, bottom: 40, left: 60 };
  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
  };
  const svg = chart.append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('aria-labelledby', 'chart-title chart-description');

  let [firstDate, lastDate] = d3.extent(commits, (d) => d.datetime);
  if (+firstDate === +lastDate) {
    firstDate = d3.timeDay.offset(firstDate, -1);
    lastDate = d3.timeDay.offset(lastDate, 1);
  }
  const xScale = d3.scaleTime()
    .domain([firstDate, lastDate])
    .range([usableArea.left, usableArea.right])
    .nice();
  const yScale = d3.scaleLinear().domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);
  const rScale = d3.scaleSqrt()
    .domain(d3.extent(commits, (d) => d.totalLines))
    .range([3, 30]);

  svg.append('g').attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
  svg.append('g').attr('class', 'x-axis')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(d3.axisBottom(xScale).ticks(6));
  svg.append('g').attr('class', 'y-axis')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat((d) => `${String(d % 24).padStart(2, '0')}:00`));

  const circles = svg.append('g').attr('class', 'dots')
    .selectAll('circle')
    .data(d3.sort(commits, (d) => -d.totalLines), (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('tabindex', 0)
    .attr('aria-describedby', 'commit-tooltip')
    .attr('aria-label', (d) => `Commit ${d.id}, ${d.totalLines} lines, by ${d.author}`)
    .on('mouseenter', (event, commit) => {
      showTooltip(commit, event);
    })
    .on('mousemove', updateTooltipPosition)
    .on('focus', (event, commit) => {
      const { right, top } = event.currentTarget.getBoundingClientRect();
      showTooltip(commit, { clientX: right, clientY: top });
    })
    .on('mouseleave blur', () => updateTooltipVisibility(false))
    .on('keydown', (event) => {
      if (event.key === 'Escape') updateTooltipVisibility(false);
    });

  function brushed(event) {
    updateTooltipVisibility(false);
    // Compute the selection once and share it with all the displays.
    const selectedCommits = commits.filter((d) => isCommitSelected(event.selection, d, xScale, yScale));
    const selectedIds = new Set(selectedCommits.map((d) => d.id));
    circles.classed('selected', (d) => selectedIds.has(d.id));
    renderSelectionCount(selectedCommits);
    renderLanguageBreakdown(selectedCommits);
  }

  createBrushSelector(svg, usableArea, brushed);
}

try {
  const data = await loadData();
  const commits = processCommits(data);
  renderCommitInfo(data, commits);
  renderScatterPlot(commits);
  renderSelectionCount([]);
  renderLanguageBreakdown([]);
} catch (error) {
  d3.select('#chart').text('Unable to load commit data. Please try reloading the page.');
  console.error('Unable to render the meta page:', error);
}
