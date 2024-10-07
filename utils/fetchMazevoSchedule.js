const axios = require('axios');
const moment = require('moment');

// Setup API Context
const axiosInstance = axios.create({
  baseURL: process.env.MZV_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.MZV_API_KEY,
  },
});

// configured in env.
let buildingIDs;
let statusIDs;
let eventTypeIDs; // optional
let roomIDs; // optional, but will typically be required for sensible output
try {
  buildingIDs = process.env.MZV_BUILDINGS.split(',').map((x) => parseInt(x, 10));
  statusIDs = process.env.MZV_STATUSES.split(',').map((x) => parseInt(x, 10));
  if (process.env.MZV_EVENT_TYPES) {
    eventTypeIDs = process.env.MZV_EVENT_TYPES.split(',').map((x) => parseInt(x, 10));
  } else {
    eventTypeIDs = null;
  }
  if (process.env.MZV_ROOMS) {
    roomIDs = process.env.MZV_ROOMS.split(',').map((x) => parseInt(x, 10));
  } else {
    roomIDs = null;
  }
} catch (e) {
  throw new Error(`Unexpected Error parsing configuration: ${e}`);
}

/**
 * Transforms input jsonData into a format that eliminates the bulk of unnecessary data
 * Needed Params from data:
 * eventName, roomDescription, dateTimeStart, dateTimeEnd, setupMinutes, teardownMinutes
 * @param {JSON} jsonData - an array of objects containing upcoming events
 */
function parseDataForDisplay(jsonData) {
  // console.log(jsonData);
  let displayData = jsonData.map((item) => {
    let roomShortCode = '';
    try {
      [roomShortCode] = item.roomDescription.match(/([A-Z]{3} \w{3,4})/);
    } catch (e) {
      // didn't get good room short code (generally this will be a TypeError)
      roomShortCode = 'other room';
    }
    try {
      const start = new Date(Date.parse(item.dateTimeStart));
      const end = new Date(Date.parse(item.dateTimeEnd));
      return {
        eventDateIdentity: moment(item.dateTimeStart).format('ddd MMM Do'),
        eventName: item.eventName,
        room: roomShortCode,
        setupStart: moment(start).subtract(item.setupMinutes, 'minutes').toDate(),
        eventStart: start,
        eventEnd: end,
        teardownEnd: moment(end).add(item.teardownMinutes, 'minutes').toDate(),
        eventStatusId: item.statusId,
      };
    } catch (e) {
      return undefined;
    }
  });
  // filter out any undefined entries from above catch statement.
  displayData = displayData.filter(Boolean);
  // ensure returned data is sorted by start datetime.
  return displayData.sort((a, b) => moment(a.eventStart).diff(moment(b.eventStart)));
}

function getMazevoSchedule(days = process.env.MZV_LOOKAHEAD_DAYS || 7) {
  return new Promise((resolve, reject) => {
    const requestData = {
      start: moment().format('YYYY-MM-DDTHH:mm:ssZ'),
      end: moment().add(days, 'days').endOf('day').format('YYYY-MM-DDTHH:mm:ssZ'),
      buildingIds: buildingIDs,
      roomIds: roomIDs || [],
      eventTypeIds: eventTypeIDs || [],
      statusIds: statusIDs,
      resourceIds: [],
      bookingIds: [],
      contactId: 0,
      organizationId: 0,
      explodeComboRooms: false,
      includeRelatedRooms: false,
      minDateChanged: null,
      includeEventCoordinators: false,
    };
    // debugging request data
    // console.log(JSON.stringify(requestData));
    axiosInstance.request({
      url: 'PublicEvent/getevents',
      method: 'post',
      data: JSON.stringify(requestData),
    })
      .then((response) => {
        resolve({
          data: parseDataForDisplay(response.data),
          status: response.status,
        });
      })
      .catch((error) => {
        // from https://github.com/axios/axios#handling-errors
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(`[getMazevoSchedule] Status: ${error.response.status}: ${JSON.stringify(error.response.data)}`);
          // console.log(error.response.data);
          // console.log(error.response.status);
          // console.log(error.response.headers);
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.log(error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log('Error', error.message);
        }
        console.log(error.config);
        reject(error);
      });
  });
}

module.exports = {
  getMazevoSchedule,
  parseDataForDisplay,
};
