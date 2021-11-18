// This file generates the needed HTML for an events and shifts display and is required by
// the root renderer.js file. Configuration is set via environment vars.
const pug = require('pug');
const {
  parse,
  formatISO,
  format,
  isAfter,
  isBefore,
} = require('date-fns');

const eventCardTemplateWide = pug.compileFile('./templates/eventShiftCard.pug');
const eventCardTemplateNarrow = pug.compileFile('./templates/eventShiftCardNarrow.pug');
const APIDateTimeFormat = 'EEE, d MMM yyyy HH:mm:ss xx';

function formatShiftString(name, startDateTime, endDateTime) {
  return `${name}: ${format(startDateTime, 'h:mm a')} - ${format(endDateTime, 'h:mm a')}`;
}

/** Function takes parsed and sorted json data and processes it into an array of "cards".
 * Uses a Map to store Card identities (a unique combination of event and time) against their
 * index in the array so that all shifts can be sorted into the appropriate card.
 * Sorted and processed cards are passed to a Pug template for markup.
 *
 * This variant processes data into a format for large displays
 * @param {JSON} data
 * @param {Number} windowWidth
 * @returns Processed HTML to inject into the page.
 */
function markupResults(data, windowWidth) {
  const cards = [];
  const cardIndex = new Map();
  const runDateTime = new Date();
  data.forEach((shift) => {
    const shiftStartTimeParsed = parse(shift.start_time, APIDateTimeFormat, runDateTime);
    const shiftEndTimeParsed = parse(shift.end_time, APIDateTimeFormat, runDateTime);
    if (cardIndex.has(shift.eventShiftIdentity)) {
      // we have seen this event/room combination before, append shift list
      const item = cards.splice(cardIndex.get(shift.eventShiftIdentity), 1)[0];
      item.shifts.push({
        str: formatShiftString(shift.user.name, shiftStartTimeParsed, shiftEndTimeParsed),
        now: isBefore(runDateTime, shiftEndTimeParsed) && isAfter(runDateTime, shiftStartTimeParsed),
      });
      cards.splice(cardIndex.get(shift.eventShiftIdentity), 0, item);
    } else {
      // have not seen this one before, add new card.
      const cardsLength = cards.push({
        sortShiftDate: formatISO(shiftStartTimeParsed, { representation: 'date' }),
        displayDate: format(shiftStartTimeParsed, 'EEEE MMM do'),
        location: shift.locationName,
        title: shift.notesTitle,
        shifts: [{
          str: formatShiftString(shift.user.name, shiftStartTimeParsed, shiftEndTimeParsed),
          now: isBefore(runDateTime, shiftEndTimeParsed) && isAfter(runDateTime, shiftStartTimeParsed),
        }],
      });
      // store the array index of this title for use later
      cardIndex.set(shift.eventShiftIdentity, cardsLength - 1);
    }
  });
  // console.log(cards);
  // 992 px width setting based on bootstrap Large media query breakpoint
  if (windowWidth < 992) {
    const dateIndex = new Map();
    const cardsByDate = [];
    cards.forEach((card) => {
      if (dateIndex.has(card.sortShiftDate)) {
        // have seen this date before, append event list
        const item = cardsByDate.splice(dateIndex.get(card.sortShiftDate), 1)[0];
        item.events.push({
          title: card.title,
          location: card.location,
          shifts: card.shifts,
        });
        cardsByDate.splice(dateIndex.get(card.sortShiftDate), 0, item);
      } else {
        // have not seen this date before, insert transformed card
        const cardsByDateLength = cardsByDate.push({
          sortShiftDate: card.sortShiftDate,
          displayDate: card.displayDate,
          events: [{
            title: card.title,
            location: card.location,
            shifts: card.shifts,
          }],
        });
        // store the array index of this date string for accessing later
        dateIndex.set(card.sortShiftDate, cardsByDateLength - 1);
      }
    });
    return cardsByDate.map((card) => eventCardTemplateNarrow({
      displayDate: card.displayDate,
      events: card.events,
    }));
  }
  return cards.map((card) => eventCardTemplateWide({
    title: card.title,
    displayDate: card.displayDate,
    shifts: card.shifts,
  }));
}

module.exports = markupResults;
