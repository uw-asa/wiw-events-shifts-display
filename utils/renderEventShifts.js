// This file generates the needed HTML for an events and shifts display and is required by
// the root renderer.js file. Configuration is set via environment vars.
const moment = require('moment');
const pug = require('pug');

const eventCardTemplate = pug.compileFile('./templates/eventShiftCard.pug');


function formatShiftString(name, start, end) {
  return `${name}: ${moment(start).format('h:mm a')} - ${moment(end).format('h:mm a')}`;
}

function markupResults(data) {
  const cards = [];
  const cardIndex = new Map();
  data.forEach((shift) => {
    if (cardIndex.has(shift.eventShiftIdentity)) {
      // we have seen this event/room combination before, append shift list
      const item = cards.splice(cardIndex.get(shift.eventShiftIdentity), 1)[0];
      item.shifts.push({
        str: formatShiftString(shift.user.name, shift.start_time, shift.end_time),
        now: moment().isBetween(shift.start_time, shift.end_time, 'minute'),
      });
      cards.splice(cardIndex.get(shift.eventShiftIdentity), 0, item);
    } else {
      // have not seen this one before, add new card.
      const cardsLength = cards.push({
        title: `${moment(shift.start_time).format('ddd MMM Do')}: ${shift.locationName} - ${shift.notesTitle}`,
        shifts: [{
          str: formatShiftString(shift.user.name, shift.start_time, shift.end_time),
          now: moment().isBetween(shift.start_time, shift.end_time, 'minute'),
        }],
      });
      // store the array index of this title for use later
      cardIndex.set(shift.eventShiftIdentity, cardsLength - 1);
    }
  });
  // console.log(cards);
  const renderedCards = cards.map((card) => eventCardTemplate({
    cardTitle: card.title,
    shifts: card.shifts,
  }));
  // console.log(renderedCards);
  return renderedCards;
}

module.exports = markupResults;
