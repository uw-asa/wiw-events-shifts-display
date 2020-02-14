// map location IDs to custom icons, names, abbreviations, etc.
// create a local file named customLocationMapping.js to use this feature.

const CUSTOM_MAPPING = {
  123456: {
    emoji: '🏢',
    abbreviation: 'OA',
    name: 'office',
  },
  234568: {
    emoji: '📆',
    abbreviation: 'EA',
    name: 'offsite',
  },
};

module.exports = {
  ...CUSTOM_MAPPING,
};
