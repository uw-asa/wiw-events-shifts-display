const should = require('chai').should();
require('dotenv').config();
/* eslint prefer-arrow-callback: off */

const {
  parseTitleFromNotes,
  parseDataForDisplay,
} = require('../utils/fetchWiwSchedule');


describe('parse title from notes', function () {
  const tests = [
    {
      notes: 'Notes without a title. There is no instance of the dash character, either, which is usually set as the separator.',
      expected: 'Notes without a title. There is no instance of the dash character, either, which is usually set as the separator.',
    },
    {
      notes: 'Event Title - Some Name - Assignee Name  (Service Order 123343) (10:45AM-12:00PM, 1h15m)',
      expected: 'Event Title',
    },
    {
      notes: '',
      expected: '',
    },
  ];

  tests.forEach(function (test) {
    it('correctly parses titles from notes', function () {
      const result = parseTitleFromNotes(test.notes);
      result.should.equal(test.expected);
    });
  });
});

describe('Data for display parses correctly', function () {
  const sampleJson = require('../utils/wiw-schedule-sample.json');

});
