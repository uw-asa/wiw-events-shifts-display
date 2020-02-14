// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const moment = require('moment');
const pug = require('pug');

// always rendered elements
const clockTemplate = pug.compileFile('./templates/clock.pug');
// set corner title
document.getElementById('title').firstElementChild.innerHTML = process.env.DISPLAY_CORNER_TITLE || 'Events Display';

// pull utilities into renderer scope
const { getWiwSchedule } = require('./utils/fetchWiwSchedule');
const getEmsSchedule = require('./utils/fetchEmsSchedule');
const markupEventShiftResults = require('./utils/renderEventShifts');
const markupLaborResults = require('./utils/renderLaborCondensed');
const markupEventListResults = require('./utils/renderEventList');

// main template global
let renderModeSingle = true;

// Configure rendering mode and constants for control:
// options for DISPLAY_RENDER_MODEs: "LABOR", "EVENTS", or "EMS-EVENTS"
// LABOR = When I Work Labor (condensed view)
// EVENTS = When I Work labor events associated with an event
// EMS-EVENTS = Events scheduled in EMS (regardless of labor assignment)
const ACCEPTABLE_SETTINGS = ['LABOR', 'EVENTS', 'EMS-EVENTS'];
const SETTINGS_DATA_MAPPING = {
  LABOR: 'WIW',
  EVENTS: 'WIW',
  'EMS-EVENTS': 'EMS',
};
const renderModeSettingLeft = process.env.DISPLAY_RENDER_MODE_LEFT;
const renderModeSettingRight = process.env.DISPLAY_RENDER_MODE_RIGHT;
const dualSourceTemplate = pug.compileFile('./templates/body2column-DualSource.pug');
const singleSourceTemplate = pug.compileFile('./templates/body2column-SingleSource.pug');
if (renderModeSettingLeft !== renderModeSettingRight) {
  renderModeSingle = false;
}
if (!ACCEPTABLE_SETTINGS.includes(renderModeSettingLeft) || !ACCEPTABLE_SETTINGS.includes(renderModeSettingRight)) {
  throw new Error(`IMPROPER CONFIGURATION; RENDER MODE NOT SET TO ONE OF ${ACCEPTABLE_SETTINGS.toString()}`);
}

/**
 * Uses the passed data function to gather data. Handles a couple of error conditions.
 *
 * @param {*} dataFn - Data handling function to call to gather data. Data function
 * should do some preprocessing of the initial data returned from that specific API.
 * @returns - result.data payload from data function.
 */
function getDataFromEndpoint(dataFn) {
  return new Promise((resolve, reject) => {
    dataFn().then((result) => {
      if (result.status === 200) {
        resolve(result.data);
      } else {
        // axios success, but non-200 status code
        reject(new Error('Received non-200 status'));
      }
    })
      .catch((e) => {
        // Axios request failure / promise rejection handling
        reject(e);
      });
  });
}


/** Function handles calling and marking up data from given data source.
 * Accepts a data fetching function and a markup function. Used when rendering single-mode.
 *
 * @param {function} dataFn - data fetch and initial processing function
 * @param {function} markupFn - template to use on each piece of data
 * @returns {Promise} marked up HTML on success
 */
function renderDataHtmlSingle(dataFn, markupFn) {
  return new Promise((resolve, reject) => {
    getDataFromEndpoint(dataFn).then((data) => {
      resolve(singleSourceTemplate({
        content: markupFn(data).join(''),
      }));
    }).catch((e) => reject(e));
  });
}

/**
 * Function handles dual data source rendering. Uses given data function and markup functions
 * to fire off asynchronous fetches and then renders the resulting data into a single HTML
 * block using the dual rendering template.
 *
 * @param {*} lDataFn - Data fetching function to gather information for the left column
 * @param {*} lMarkupFn - Data markup function for left column cards using data from lDataFn
 * @param {*} rDataFn - Data fetching function to gather information for the right column
 * @param {*} rMarkupFn - Data markup function for right column cards using data from rDataFn
 * @returns {Promise} Promise that will resolve with the combined HTML content to be injected
 *  into the main content of the display
 */
function renderDataHtmlDual(lDataFn, lMarkupFn, rDataFn, rMarkupFn) {
  const lResult = getDataFromEndpoint(lDataFn);
  const rResult = getDataFromEndpoint(rDataFn);
  return Promise.all([lResult, rResult]).then((values) => dualSourceTemplate({
    contentLeft: lMarkupFn(values[0]).join(''),
    leftHeader: process.env.DISPLAY_LEFT_COLUMN_TITLE,
    contentRight: rMarkupFn(values[1]).join(''),
    rightHeader: process.env.DISPLAY_RIGHT_COLUMN_TITLE,
  }));
}

/**
 * Helper function that uses configuration options to determine which functions to use
 * for data gathering and markup of that resulting data.
 *
 * @param {String} modeSetting - the mode setting pulled from Config Vars
 * @returns [{dataFunction}, {markupFunction}]
 */
function determineSideModeRenderFunctions(modeSetting) {
  if (SETTINGS_DATA_MAPPING[modeSetting] === 'WIW' && modeSetting === ACCEPTABLE_SETTINGS[0]) {
    // set Labor
    return [getWiwSchedule, markupLaborResults];
  }
  if (SETTINGS_DATA_MAPPING[modeSetting] === 'WIW') {
    // set Events/labor
    return [getWiwSchedule, markupEventShiftResults];
  }
  if (SETTINGS_DATA_MAPPING[modeSetting] === 'EMS') {
    // set EMS events list
    return [getEmsSchedule, markupEventListResults];
  }
  throw new Error('Mode setting error; unable to determine mode setting from env vars.');
}

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
      Math.max(interval + initialInterval, parseInt(process.env.MAX_REFRESH_INTERVAL, 10)),
      initialInterval,
    );
  }

  setTimeout(() => {
    if (renderModeSingle) {
      // don't have to consider which side is which -- left setting takes precedence
      const renderFunctions = determineSideModeRenderFunctions(renderModeSettingLeft);
      renderDataHtmlSingle(renderFunctions[0], renderFunctions[1]).then((result) => {
        target.innerHTML = result;
        handleReload(initialInterval, initialInterval);
      })
        .catch((e) => errorBackOff(e));
    } else {
      // Dual Render mode - one thing per side
      const leftRenderFns = determineSideModeRenderFunctions(renderModeSettingLeft);
      const rightRenderFns = determineSideModeRenderFunctions(renderModeSettingRight);
      renderDataHtmlDual(leftRenderFns[0], leftRenderFns[1], rightRenderFns[0], rightRenderFns[1]).then((result) => {
        target.innerHTML = result;
        handleReload(initialInterval, initialInterval);
      })
        .catch((e) => errorBackOff(e));
    }
  }, interval);
}


/**
 * Helper function that renders time data into HTML
 */
function markupClock() {
  return clockTemplate({ time: moment().format('dddd, MMMM Do YYYY, h:mm:ss a') });
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
