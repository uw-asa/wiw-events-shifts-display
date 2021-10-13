// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  session,
  ipcMain,
} = require('electron');
const pug = require('pug');
const path = require('path');
require('dotenv').config();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: false,
    // fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

  // Open the DevTools. ⚠ ONLY use during local development. Do not include in production builds.
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  const filter = {
    urls: [`${process.env.EMS_API_URL}*`, `${process.env.WIW_API_URL}*`],
  };

  session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy-':
          [`default-src 'self'; script-src 'self'; connect-src ${process.env.EMS_API_URL} ${process.env.WIW_API_URL}`],
      },
    });
  });

  // capture and print chromium logs to main process window log
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[${level}] ${message} @ ${sourceId} (${line})`);
  });
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// pull utilities into scope
const { getWiwSchedule } = require('./utils/fetchWiwSchedule');
const getEmsSchedule = require('./utils/fetchEmsSchedule');
const markupEventShiftResults = require('./utils/renderEventShifts');
const markupLaborResults = require('./utils/renderLaborCondensed');
const markupEventListResults = require('./utils/renderEventList');

// pull in template renderers
const dualSourceTemplate = pug.compileFile('./templates/body2column-DualSource.pug');
const singleSourceTemplate = pug.compileFile('./templates/body2column-SingleSource.pug');

const {
  DISPLAY_LEFT_COLUMN_TITLE,
  DISPLAY_RIGHT_COLUMN_TITLE,
  DISPLAY_RENDER_MODE_LEFT,
  DISPLAY_RENDER_MODE_RIGHT,
} = process.env;

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
    leftHeader: DISPLAY_LEFT_COLUMN_TITLE,
    contentRight: rMarkupFn(values[1]).join(''),
    rightHeader: DISPLAY_RIGHT_COLUMN_TITLE,
  }));
}

/**
 * Helper function that uses configuration options to determine which functions to use
 * for data gathering and markup of that resulting data.
 *
 * @param {String} modeSetting - the mode setting pulled from Config Vars
 * @returns [{dataFunction}, {markupFunction}]
 */
function determineSideModeRenderFunctions(modeSetting, SETTINGS_DATA_MAPPING, ACCEPTABLE_SETTINGS) {
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

/**
 * Handler function. Called by the reload timer in the renderer process.
 * Parameters are set in preload, and the call is simply initiated by the renderer process.
 * Must be async as the render functions make HTTP API requests, returning promises.
 *
 * Some variables shortened here for readability:
 * SDM = SETTINGS_DATA_MAPPING
 * AS = ACCEPTABLE_SETTINGS
 */
ipcMain.handle('load-api-data', async (event, renderModeSingle, SDM, AS) => {
  if (renderModeSingle) {
    // don't have to consider which side is which -- left setting takes precedence
    const renderFunctions = determineSideModeRenderFunctions(DISPLAY_RENDER_MODE_LEFT, SDM, AS);
    return renderDataHtmlSingle(renderFunctions[0], renderFunctions[1]);
  }
  // Dual Render mode - one thing per side
  const leftRenderFns = determineSideModeRenderFunctions(DISPLAY_RENDER_MODE_LEFT, SDM, AS);
  const rightRenderFns = determineSideModeRenderFunctions(DISPLAY_RENDER_MODE_RIGHT, SDM, AS);
  return renderDataHtmlDual(leftRenderFns[0], leftRenderFns[1], rightRenderFns[0], rightRenderFns[1]);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});
