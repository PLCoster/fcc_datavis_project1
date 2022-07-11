// Fetches data from URL using XMLHttpRequest (for oldschool fun)
// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
function requestData(url, backup) {
  const xhr = new XMLHttpRequest();
  xhr.addEventListener('loadend', (e) => dataLoaded.call(xhr, e, backup));
  xhr.addEventListener('error', (e) => transferFailed(e));
  xhr.open('GET', url);
  xhr.send();
}

// Check that the data has loaded successfully, before trying to render graph
function dataLoaded(e, backup) {
  // If API call fails, load from file
  if (this.status !== 200 && !backup) {
    requestData('data.json', true);
  } else if (this.status !== 200) {
    // If both attempts to load data have failed, display error message
    transferFailed(
      e,
      'Error when trying to load data from API and file, please try again.'
    );
  } else {
    // Data loaded, render graph
    renderGraph(this.responseText);
  }
}

// Generate an error message where graph should display
function transferFailed(
  e,
  message = 'An error occured when trying to load data'
) {
  const graphContainer = d3.select('#graph-container');
  graphContainer.text(message);
  console.error(message);
}

function renderGraph(rawData) {
  const graphContainer = d3.select('#graph-container');
  graphContainer.text(''); // Remove 'Loading...' message

  let dataObj;
  try {
    dataObj = JSON.parse(rawData);
  } catch (err) {
    transferFailed(
      null,
      'Error occured when trying to parse JSON data, please try again.'
    );
    return;
  }

  graphContainer.append('h1').text('US Quarterly GDP 1947-2015');

  console.log(graphContainer.node().getBoundingClientRect()); // Get element width and height

  const w = 1000;
  const h = 700;
  const padding = 30;

  const graphSVG = graphContainer
    .append('svg')
    .attr('class', 'graph')
    .attr('width', w)
    .attr('height', h);

  // Create scales for x and y axes of graph:
  const gdpData = dataObj.data;
  const gdpMax = Math.ceil(d3.max(gdpData, (d) => d[1]) / 1000) * 1000;

  const yearMin = d3.min(gdpData, (d) => parseInt(d[0].slice(0, 4)));
  const yearMax = d3.max(gdpData, (d) => parseInt(d[0].slice(0, 4))) + 1;

  const xscale = d3
    .scaleLinear()
    .domain([yearMin, yearMax])
    .range([padding, w - padding]);
  const yscale = d3
    .scaleLinear()
    .domain([0, gdpMax])
    .range([h - padding, padding]);

  // Add data bars to the chart
  graphSVG
    .selectAll('rect')
    .data(gdpData)
    .enter()
    .append('rect')
    .attr('x', (d, i) => {
      console.log(d, i, xscale(parseInt(d[0].slice(0, 4)) + 0.25 * (i % 4)));
      return xscale(parseInt(d[0].slice(0, 4)) + 0.25 * (i % 4));
    })
    .attr('y', (d) => yscale(d[1]))
    .attr('width', (w - 2 * padding) / gdpData.length)
    .attr('height', (d) => yscale(gdpMax - d[1]))
    .attr('fill', 'black')
    .attr('stroke', 'white')
    .attr('stroke-width', 1);
}

// Request graph data after DOM loads
document.addEventListener('DOMContentLoaded', (e) => {
  requestData(
    'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/GDP-data.json',
    false
  );
});
