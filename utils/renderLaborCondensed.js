// This file generates the needed HTML for an events-only display and is required by
// the root renderer.js file. Configuration is set via environment vars.
const moment = require('moment');
const pug = require('pug');

// const eventCardTemplate = pug.compileFile('../templates/eventShiftCard.pug');
const laborCardTemplate = pug.compileFile('./templates/laborCard.pug');

// load shift type designation from configuration
const CUSTOM_MAPPING = require('./customLocationMapping');

function markupResults(data) {
  const cards = [];
  const cardIndex = new Map();
  data.forEach((shift) => {
    const shiftDate = moment(shift.start_time).format('YYYYMMDD');
    if (cardIndex.has(shiftDate)) {
      // we have seen this shift-date before, append shift list within card
      const card = cards.splice(cardIndex.get(shiftDate), 1)[0];
      card.shifts.push({
        now: moment().isBetween(shift.start_time, shift.end_time, 'minute'),
        customIconText: CUSTOM_MAPPING[shift.locationId].abbreviation,
        personName: shift.user.name,
        locationName: shift.locationName,
        inTime: moment(shift.start_time).format('h:mm a'),
        outTime: moment(shift.end_time).format('h:mm a'),
      });
      cards.splice(cardIndex.get(shiftDate), 0, card);
    } else {
      // have not seen this one before, add new card.
      const cardsLength = cards.push({
        title: moment(shift.start_time).format('dddd MMM Do'), // sets card header
        shifts: [{
          now: moment().isBetween(shift.start_time, shift.end_time, 'minute'),
          customIconText: CUSTOM_MAPPING[shift.locationId].abbreviation,
          personName: shift.user.name,
          locationName: shift.locationName,
          inTime: moment(shift.start_time).format('h:mm a'),
          outTime: moment(shift.end_time).format('h:mm a'),
        }],
      });
      // store the array index of this title for use later
      cardIndex.set(shiftDate, cardsLength - 1);
    }
  });
  // console.log(cards);
  // Transform data into rendered HTML with pug template
  const renderedCards = cards.map((card) => laborCardTemplate({
    cardTitle: card.title,
    shifts: card.shifts,
  }));
  // console.log(renderedCards);
  return renderedCards;
}

module.exports = markupResults;
