const axios = require('axios');
const moment = require('moment');

const axiosInstance = axios.create({
  baseURL: process.env.WIW_API_URL,
});

/**
 * Event titles and operator notes are all one string from When I Work. This method separates out
 * the event title from the private notes. The separator is controlled via env variable,
 * as well as how to handle the separator: whether or not the separator is surrounded by
 * whitespace, or if it is expected to be all one piece eg:
 *   - "Event Title|Notes"
 *   - "Event Title | Notes"
 *
 * @param {String} notes The notes containing a title which will be separated from the notes
 * @returns {String} The title, whitespace trimmed, without any content following the separator
 */
function parseTitleFromNotes(notes) {
  const separator = process.env.NOTES_TITLE_SEPARATOR;
  const whitespace = !!process.env.SEPARATOR_WHITESPACE;
  return whitespace ? notes.split(` ${separator} `)[0].trim() : notes.split(separator)[0].trim();
}

/**
 * Transforms input jsonData into a format that eliminates the bulk of unnecessary data
 *
 * @param {*} jsonData
 */
function parseDataForDisplay(jsonData) {
  // console.log(jsonData);
  let displayData = jsonData.shifts.map((shift) => {
    try {
      const notesTitle = parseTitleFromNotes(shift.notes);
      const shiftUser = jsonData.users.filter((user) => user.id === shift.user_id)[0];
      const shiftSite = jsonData.sites.filter((site) => site.id === shift.site_id)[0];
      return {
        notesTitle,
        eventShiftIdentity: [shift.site_id, notesTitle, moment(shift.start_time).format('YYYYMMDD')].join('\n'),
        locationName: shiftSite.name,
        locationId: shift.location_id,
        user: {
          name: shiftUser.first_name.concat(' ', shiftUser.last_name),
          netid: shiftUser.employee_code,
        },
        start_time: shift.start_time,
        end_time: shift.end_time,
      };
    } catch (e) {
      // Uncomment to debug parsing issues.
      // Expected: spitting out an unending stream of "cannot read property 'name' of undefined"
      // console.warn('ParseData|Malformed shift information: ' + e);
      return undefined;
    }
  });
  // Filter out undefined data by using the Boolean constructor on array elements
  // (rejects all falsy values)
  displayData = displayData.filter(Boolean);
  // console.log(displayData);
  return displayData.sort((a, b) => moment(a.start_time).diff(moment(b.start_time)));
}

function getWiwSchedule(days = process.env.WIW_LOOKAHEAD_DAYS || 7) {
  return new Promise((resolve, reject) => {
    axiosInstance.request({
      url: 'shifts',
      method: 'get',
      params: {
        location_id: process.env.WIW_API_LOCATION,
        start: moment().format('YYYY-MM-DD HH:mm:ss'),
        end: moment().add(days, 'days').endOf('day').format('YYYY-MM-DD HH:mm:ss'),
      },
      headers: {
        'W-Token': process.env.WIW_API_TOKEN,
      },
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
      })
      .then((response) => {
        resolve({
          data: parseDataForDisplay(response.data),
          status: response.status,
        });
      })
      .catch((error) => reject(error));
  });
}

module.exports = {
  getWiwSchedule,
  parseDataForDisplay,
  parseTitleFromNotes,
};
