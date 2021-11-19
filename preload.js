// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const { format } = require('date-fns');
const pug = require('pug');
const { contextBridge, ipcRenderer } = require('electron');

const clockTemplate = pug.compileFile('./templates/clock.pug');

const {
  DISPLAY_CORNER_TITLE,
  DISPLAY_RENDER_MODE_LEFT,
  DISPLAY_RENDER_MODE_RIGHT,
  MAX_REFRESH_INTERVAL,
} = process.env;

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
if (DISPLAY_RENDER_MODE_LEFT !== DISPLAY_RENDER_MODE_RIGHT) {
  renderModeSingle = false;
}
if (!ACCEPTABLE_SETTINGS.includes(DISPLAY_RENDER_MODE_LEFT)
  || !ACCEPTABLE_SETTINGS.includes(DISPLAY_RENDER_MODE_RIGHT)) {
  throw new Error(`IMPROPER CONFIGURATION; RENDER MODE NOT SET TO ONE OF ${ACCEPTABLE_SETTINGS.toString()}`);
}

// ContextBridge exposes functions, IPC, utilities, variables to the renderer context
contextBridge.exposeInMainWorld('preload', {
  templates: {
    clockTemplate,
  },
  // IPC functions
  ipc: {
    updateApiContent: () => ipcRenderer.invoke(
      'load-api-data',
      renderModeSingle,
      SETTINGS_DATA_MAPPING,
      ACCEPTABLE_SETTINGS,
    ),
  },
  utils: {
    format,
  },
  envVars: {
    DISPLAY_CORNER_TITLE,
    MAX_REFRESH_INTERVAL,
  },
});
