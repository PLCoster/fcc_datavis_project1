// Fetches data from URL using XMLHttpRequest (for oldschool fun)
// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
function requestData(url, backup) {
  const xhr = new XMLHttpRequest();
  xhr.addEventListener('loadend', dataLoaded);
  xhr.addEventListener('error', transferFailed);
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
    transferFailed();
  } else {
    // Data loaded, render graph
    renderGraph(this.responseText);
  }
}

// Generate an error message where graph should display
function transferFailed(e) {
  console.log('Error occured when trying to load graph data');
}

function renderGraph(rawData) {
  console.log(rawData);
}

// Request graph data after DOM loads
document.addEventListener('DOMContentLoaded', (e) => {
  requestData(
    'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/GDP-data.json',
    false
  );
});
