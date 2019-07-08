const axios = require('axios');
const moment = require('moment');

const axiosInstance = axios.create({
  baseURL: 'https://api.wheniwork.com/2/',
});

function parseTitleFromNotes(notes) {
  return notes.split(process.env.NOTES_TITLE_SEPARATOR)[0].trim();
}

/**
 * Transforms input jsonData into a format that eliminates the bulk of unnecessary data
 *
 * @param {*} jsonData
 */
function parseDataForDisplay(jsonData) {
  const displayData = jsonData.shifts.map((shift) => {
    const title = parseTitleFromNotes(shift.notes);
    const shiftUser = jsonData.users.filter(user => user.id === shift.user_id)[0];
    const shiftSite = jsonData.sites.filter(site => site.id === shift.site_id)[0];
    return {
      title,
      uid: [shift.site_id, title, moment(shift.start_time).format('YYYYMMDD')].join('\n'),
      location: shiftSite.name,
      user: {
        name: shiftUser.first_name.concat(' ', shiftUser.last_name),
        netid: shiftUser.employee_code,
      },
      start_time: shift.start_time,
      end_time: shift.end_time,
    };
  });
  // console.log(displayData);
  return displayData.sort((a, b) => moment(a.start_time).diff(moment(b.start_time)));
}

function getSchedule(days = process.env.WIW_LOOKAHEAD_DAYS || 7) {
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
      .catch(error => reject(error));
  });
}

module.exports = getSchedule;
