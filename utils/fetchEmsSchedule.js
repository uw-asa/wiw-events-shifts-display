const axios = require('axios');
const moment = require('moment');
const pug = require('pug');
const { DOMParser } = require('@xmldom/xmldom');

const axiosInstance = axios.create({
  baseURL: process.env.EMS_API_URL,
  headers: {
    'Content-Type': 'text/xml',
  },
});

const emsApiRequestXMLTemplate = pug.compileFile('./templates/emsAPI-GetBookings.pug');

// configured in env.
let buildingIDs;
let statusIDs;
let eventTypeIDs; // optional
try {
  buildingIDs = process.env.EMS_BUILDINGS.split(',').map((x) => parseInt(x, 10));
  statusIDs = process.env.EMS_STATUSES.split(',').map((x) => parseInt(x, 10));
  if (process.env.EMS_EVENT_TYPES) {
    eventTypeIDs = process.env.EMS_EVENT_TYPES.split(',').map((x) => parseInt(x, 10));
  } else {
    eventTypeIDs = null;
  }
} catch (e) {
  throw new Error(`Unexpected Error parsing configuration: ${e}`);
}

/** Takes the terrible data returned from the EMS API, which is Soap/XML, but only
 * on the outer wrapper. All the actual returned data that we care about is returned
 * escaped (ie, all angle brackets '<' and '>' are returned as '&lt;' and '&gt;').
 * This function strips off the outer layer of good XML, processes the inner text
 * into HTML nodes, then the inner text of that into usable structured XML nodes.
 *
 * @param {String} xmlHell The whole XML response from the EMS API
 * @param {String} targetWrapperNode Target outer node containing escaped XML
 * @returns Array of XML 'Data' nodes
 */
function processEmsApiXml(xmlHell, targetWrapperNode) {
  // Create a parser to process returned data from EMS XML API.
  const parser = new DOMParser();
  // First pass; Gets an XML document, but only with the outer real XML processed.
  const xmlGarbageDoc = parser.parseFromString(xmlHell, 'text/xml');
  // Get the inner XML data returned from the server
  const xmlText = xmlGarbageDoc.getElementsByTagName(targetWrapperNode)[0].textContent;
  // Now convert the text content of the converted document into XML DOM Nodes
  const xmlData = parser.parseFromString(xmlText, 'text/xml');
  // xmlData at this point can be queried as normal XML Document.
  // Return an array of the 'Data' nodes from the API for actual parsing for display.
  const dataArray = [].slice.call(xmlData.getElementsByTagName('Data'));
  return dataArray;
}

function parseDataForDisplay(xmlHell) {
  const bookings = processEmsApiXml(xmlHell, 'GetBookingsResult');
  let displayData = bookings.map((bookingElements) => {
    try {
      const bookStart = bookingElements.getElementsByTagName('TimeBookingStart')[0].textContent;
      return {
        eventDateIdentity: moment(bookStart).format('ddd MMM Do'),
        eventName: bookingElements.getElementsByTagName('EventName')[0].textContent,
        room: bookingElements.getElementsByTagName('RoomCode')[0].textContent,
        eventStatusId: bookingElements.getElementsByTagName('StatusID')[0].textContent,
        bookStart,
        eventStart: bookingElements.getElementsByTagName('TimeEventStart')[0].textContent,
        eventEnd: bookingElements.getElementsByTagName('TimeEventEnd')[0].textContent,
        bookEnd: bookingElements.getElementsByTagName('TimeBookingEnd')[0].textContent,
      };
    } catch (e) {
      return undefined;
    }
  });
  displayData = displayData.filter(Boolean);
  return displayData.sort((a, b) => moment(a.bookStart).diff(moment(b.bookStart)));
}

function getEmsSchedule(days = process.env.EMS_LOOKAHEAD_DAYS || 7) {
  return new Promise((resolve, reject) => {
    const requestXML = emsApiRequestXMLTemplate({
      username: process.env.EMS_API_USER,
      password: process.env.EMS_API_PASS,
      startDateTime: moment().format(), // defaults to ISO string format in local timezone
      endDateTime: moment().add(days, 'days').format(),
      buildings: buildingIDs,
      statuses: statusIDs,
      eventTypes: eventTypeIDs,
      viewComboRooms: 'false',
    });
    // console.log(requestXML);
    axiosInstance({
      url: 'Service.asmx',
      method: 'post',
      data: requestXML,
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
          console.log(`[getSchedule] Status: ${error.response.status}: ${JSON.stringify(error.response.data)}`);
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

module.exports = getEmsSchedule;
