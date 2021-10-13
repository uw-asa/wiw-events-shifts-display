// This file is required by the index.html file and will
// be executed in the renderer process for that window.

// Pull in environment variables exposed by preload
const {
  DISPLAY_CORNER_TITLE,
  MAX_REFRESH_INTERVAL,
} = window.preload.envVars;

// set corner title
document.getElementById('title').firstElementChild.innerHTML = DISPLAY_CORNER_TITLE || 'Events Display';

// pull in IPC function references
const {
  updateApiContent,
} = window.preload.ipc;

// pull template processors
const {
  clockTemplate,
} = window.preload.templates;

// pull in utility functions
const {
  format,
} = window.preload.utils;

/** Infinite loop. Uses render mode flag to call relevant render functions and handles setting the
 * interval between when the data is refreshed. Will render less frequently in the case of errors
 * being detected. Once a successful render happens, the render interval is reset to it's initial
 * value.
 *
 * @param {*} interval - Time till next render cycle (ms)
 * @param {*} initialInterval - Original / base render interval (ms)
 */
function handleReload(interval, initialInterval) {
  // Display the active reload interval in the page footer
  const reloadSpan = document.getElementById('reload-interval');
  reloadSpan.innerHTML = `Reloading every ${interval / 1000}s`;
  const target = document.getElementById('main');

  // Local helper function
  function errorBackOff(e) {
    console.error(e);
    handleReload(
      Math.min(interval + initialInterval, parseInt(MAX_REFRESH_INTERVAL * 1000, 10)),
      initialInterval,
    );
  }

  setTimeout(() => {
    // This call initiates a fetch to configured API server(s) in main.
    updateApiContent().then(async (result) => {
      // handle returned stuff from main
      target.innerHTML = await result;
      // successful update; reset reload interval to initial state
      handleReload(initialInterval, initialInterval);
    })
      .catch((e) => errorBackOff(e));
  }, interval);
}

/**
 * Helper function that renders time data into HTML
 */
function markupClock() {
  return clockTemplate({ time: format(new Date(), 'EEEE, MMMM do yyyy, h:mm:ss a') });
}

/**
 * Infinite loop. Updates the displayed time every second (1000ms)
 */
function showClock() {
  setTimeout(() => {
    const target = document.getElementById('clock');
    target.innerHTML = markupClock();
    showClock();
  }, 1000);
}

/**
 * Initial starting point for data display on the screen.
 * Sets the initial interval and hands off control to handleReload and starts up the clock.
 */
window.onload = () => {
  const initialInterval = 30000; // milliseconds
  handleReload(5000, initialInterval); // set short initial interval to get quick first load time.
  showClock();
};
