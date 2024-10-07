// This file generates the needed HTML to display a summary
// listing of events by date. Required by the root renderer.js file.
// Configuration set via environment vars.

const moment = require('moment');
const pug = require('pug');

const eventDateCardTemplate = pug.compileFile('./templates/eventDateCard.pug');

// let highlight = null;
// if (process.env.MZV_STATUS_ROW_HIGHLIGHT) {
//   highlight = new Map();
//   const highlightArr = process.env.EMS_STATUS_ROW_HIGHLIGHT.split(',');
//   highlightArr.forEach((config) => {
//     const key = config.split(':')[0];
//     const color = config.split(':')[1];
//     highlight.set(key, color);
//   });
// }

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

  function getEventParamsObject(item) {
    return {
      now: moment().isBetween(item.setupStart, item.teardownEnd, 'minute'),
      room: item.room.split(' ')[1], // Display only the room number portion
      title: item.eventName, // NOTE: May need to truncate this to certain limit
      bookStart: formatTimes(item.setupStart),
      eventStart: formatTimes(item.eventStart),
      eventEnd: formatTimes(item.eventEnd),
      bookEnd: formatTimes(item.teardownEnd),
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
