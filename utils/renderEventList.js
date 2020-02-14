// This file generates the needed HTML to display a summary
// listing of events by date. Required by the root renderer.js file.
// Configuration set via environment vars.

const moment = require('moment');
const pug = require('pug');

const eventDateCardTemplate = pug.compileFile('./templates/eventDateCard.pug');

/**
 *
 *
 * @param {*} data array of event data sorted by start time ascending
 */
function markupResults(data) {
  // store an array of html elements marked up for display
  // each card holds header and content for as single date's events
  const cards = [];
  // store an index of which dates go where in the array for events to be
  // appended to.
  const cardIndex = new Map();

  // helper function that formats times for display.
  function formatTimes(timestamp) {
    // slice here takes off the 'm' from 'am' or 'pm'
    return moment(timestamp).format('h:mma').slice(0, -1);
  }

  function getEventParamsObject(event) {
    return {
      now: moment().isBetween(event.bookStart, event.bookEnd, 'minute'),
      room: event.room,
      title: event.eventName.replace('&amp;', '&'), // NOTE: May need to truncate this to certain limit
      bookStart: formatTimes(event.bookStart),
      eventStart: formatTimes(event.eventStart),
      eventEnd: formatTimes(event.eventEnd),
      bookEnd: formatTimes(event.bookEnd),
    };
  }

  data.forEach((event) => {
    if (cardIndex.has(event.eventDateIdentity)) {
      // seen this date before. Append event list within card.
      const card = cards.splice(cardIndex.get(event.eventDateIdentity), 1)[0];
      card.events.push(getEventParamsObject(event));
      cards.splice(cardIndex.get(event.eventDateIdentity), 0, card);
    } else {
      // have not seen this date before. Create new card.
      const cardsLength = cards.push({
        cardTitle: event.eventDateIdentity, // this case relatively simple and can just use the identity string itself
        events: [getEventParamsObject(event)],
      });
      // Store array index of this card for lookup later
      cardIndex.set(event.eventDateIdentity, cardsLength - 1);
    }
  });
  // console.log(cards);
  const renderedCards = cards.map((card) => eventDateCardTemplate({
    cardTitle: card.cardTitle,
    events: card.events,
  }));
  // console.log(renderedCards);
  return renderedCards;
}

module.exports = markupResults;
