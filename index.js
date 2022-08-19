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
      'Error when trying to load data from API and file, please try again.',
    );
  } else {
    // Data loaded, render graph and set up event listener to re-render on window resize
    const { width } = d3
      .select('#graph-container')
      .node()
      .getBoundingClientRect();
    renderGraph(this.responseText, width);
    window.addEventListener('resize', (e) => {
      const { width } = d3
        .select('#graph-container')
        .node()
        .getBoundingClientRect();
      renderGraph(this.responseText, width);
    });
  }
}

// Generate an error message where graph should display
function transferFailed(
  e,
  message = 'An error occurred when trying to load data',
) {
  const graphContainer = d3.select('#graph-container');
  graphContainer.text(message);
  console.error(message);
}

function calculateXPos(d, i, xscale) {
  return xscale(parseInt(d[0].slice(0, 4)) + 0.25 * (i % 4));
}

// Main function to build interactive graph from API data, given width available for graph
function renderGraph(rawData, width) {
  const graphContainer = d3.select('#graph-container');
  graphContainer.html(''); // Remove 'Loading...' message or any previous graph svg

  let dataObj;
  try {
    dataObj = JSON.parse(rawData);
  } catch (err) {
    transferFailed(
      null,
      'Error occurred when trying to parse JSON data, please try again.',
    );
    return;
  }

  graphContainer
    .append('h1')
    .attr('id', 'title')
    .text('US Quarterly GDP 1947-2015');

  width = Math.max(width, 540);
  const height = Math.min(0.6 * width, 740);
  const paddingLarge = 80;
  const paddingRight = 20;

  const axisFontSize = Math.max(Math.round(0.015 * width), 10);

  const svgContainer = graphContainer.append('div').attr('id', 'svg-container');

  const graphSVG = svgContainer
    .append('svg')
    .attr('class', 'graph')
    .attr('width', width)
    .attr('height', height);

  graphContainer.append('label').html(
    `Data source: <a href= http://research.stlouisfed.org/fred2/data/GDP.txt> Federal Reserve Economic Data</a>
    <br>
    For more information see <a href= http://www.bea.gov/national/pdf/nipaguid.pdf> here </a>`,
  );

  // Create scales for x and y axes of graph:
  const gdpData = dataObj.data;
  const gdpMax = Math.ceil(d3.max(gdpData, (d) => d[1]) / 1000) * 1000;

  const yearMin = d3.min(gdpData, (d) => parseInt(d[0].slice(0, 4)));
  const yearMax = d3.max(gdpData, (d) => parseInt(d[0].slice(0, 4))) + 1;

  const xscale = d3
    .scaleLinear()
    .domain([yearMin, yearMax])
    .range([paddingLarge, width - paddingRight]);

  const yscale = d3
    .scaleLinear()
    .domain([0, gdpMax])
    .range([height - paddingLarge, 0]);

  // Add axes to the chart:
  const xAxis = d3.axisBottom(xscale).tickFormat((x) => x.toString());
  graphSVG
    .append('g')
    .attr('transform', 'translate(0, ' + (height - paddingLarge) + ')')
    .attr('id', 'x-axis')
    .call(xAxis);

  const yAxis = d3.axisLeft(yscale);
  graphSVG
    .append('g')
    .attr('transform', 'translate(' + paddingLarge + ', 0)')
    .attr('id', 'y-axis')
    .call(yAxis);

  // Add axis labels
  graphSVG
    .append('text')
    .attr('transform', 'rotate(-90)')
    .text('GDP ( Billions of Dollars - Seasonally Adjusted)')
    .attr('x', -yscale(0) + height / 6)
    .attr('y', 30)
    .style('font-size', axisFontSize + 'px');

  graphSVG
    .append('text')
    .style('font-size', axisFontSize + 'px')
    .text('Fiscal Quarter')
    .attr('x', width / 2 - 45)
    .attr('y', height - 40);

  // Add data bars to the chart
  graphSVG
    .selectAll('rect')
    .data(gdpData)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('data-date', (d) => d[0])
    .attr('data-gdp', (d) => d[1])
    .attr('data-index', (d, i) => i)
    .attr('x', (d, i) => calculateXPos(d, i, xscale))
    .attr('y', (d) => yscale(d[1]))
    .attr('width', (width - 2 * paddingLarge) / gdpData.length)
    .attr('height', (d) => yscale(gdpMax - d[1]))
    .attr('fill', 'green')
    .attr('stroke', 'white')
    .attr('stroke-width', 1);

  // Add hover mouseover tool-tip display to the bars
  const tooltip = graphContainer
    .append('div')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .attr('id', 'tooltip');

  graphSVG
    .selectAll('rect')
    .data(gdpData)
    .on('mouseover', function (event, d) {
      // mouseover event takes in the mouse event and the data for the element under the mouse
      tooltip
        .html('')
        .attr('data-date', d[0])
        .attr('data-gdp', d[1])
        .style('visibility', 'visible')
        .style('top', event.pageY - 80 + 'px');

      // Position tooltip to the left or right of the cursor depending on position
      const i = parseInt(this.getAttribute('data-index'));
      if (i < gdpData.length / 2) {
        tooltip.style('left', event.pageX + 20 + 'px');
      } else {
        tooltip.style('left', event.pageX - 150 + 'px');
      }

      // Add Year and Quarter info to Tooltip
      tooltip.append('h5').text(`Q${(i % 4) + 1} ${d[0].slice(0, 4)}`);

      // Add GDP Data to Tooltip
      tooltip.append('h5').text(`$${Math.round(d[1])} Billion`);
    })
    .on('mouseout', function () {
      tooltip.style('visibility', 'hidden');
    });

  // Make graph container visible after building graph:
  graphContainer.style('opacity', 1);
}

// Request graph data from API after DOM loads
document.addEventListener('DOMContentLoaded', (e) => {
  requestData(
    'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/GDP-data.json',
    false,
  );
});
