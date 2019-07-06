// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const getSchedule = require('./utils/fetch_schedule');
const moment = require('moment');
const pug = require('pug');

const cardTemplate = pug.compileFile('./templates/card.pug');
const clockTemplate = pug.compileFile('./templates/clock.pug');

function formatShiftString(name, start, end) {
  return `${name}: ${moment(start).format('h:mm a')} - ${moment(end).format('h:mm a')}`;
}

function markupResults(data) {
  const cards = [];
  const cardIndex = new Map();
  data.forEach((shift) => {
    if (cardIndex.has(shift.uid)) {
      // we have seen this event/room combination before, append shift list
      const item = cards.splice(cardIndex.get(shift.uid), 1)[0];
      item.shifts.push({
        str: formatShiftString(shift.user.name, shift.start_time, shift.end_time),
        now: moment().isBetween(shift.start_time, shift.end_time, 'minute'),
      });
      cards.splice(cardIndex.get(shift.uid), 0, item);
    } else {
      // have not seen this one before, add new card.
      const cardsLength = cards.push({
        title: `${moment(shift.start_time).format('ddd MMM D')}: ${shift.location} - ${shift.title}`,
        shifts: [{
          str: formatShiftString(shift.user.name, shift.start_time, shift.end_time),
          now: moment().isBetween(shift.start_time, shift.end_time, 'minute'),
        }],
      });
      // store the array index of this title for use later
      cardIndex.set(shift.uid, cardsLength - 1);
    }
  });
  // console.log(cards);
  const renderedCards = cards.map(card =>
    cardTemplate({
      cardTitle: card.title,
      shifts: card.shifts,
    }));
  // console.log(renderedCards);
  return renderedCards;
}

function handleReload(interval, initialInterval) {
  // Display the active reload interval in the page footer
  const reloadSpan = document.getElementById('reload-interval');
  reloadSpan.innerHTML = `Reloading every ${interval / 1000}s`;
  setTimeout(() => {
    getSchedule().then((result) => {
      if (result.status === 200) {
        const target = document.getElementById('content');
        target.innerHTML = markupResults(result.data).join('');
        handleReload(initialInterval, initialInterval);
      } else {
        // Axios success, but not a 200 return status
        handleReload(interval * 2, initialInterval);
      }
    })
      .catch(() => {
        // Axios request failure / promise rejection handling
        handleReload(interval * 2, initialInterval);
      });
  }, interval);
}

function markupClock() {
  return clockTemplate({ time: moment().format('dddd, MMMM Do YYYY, h:mm:ss a') });
}

function showClock() {
  setTimeout(() => {
    const target = document.getElementById('clock-row');
    target.innerHTML = markupClock();
    showClock();
  }, 1000);
}

window.onload = () => {
  const initialInterval = 10000; // milliseconds
  handleReload(initialInterval, initialInterval);
  showClock();
};
