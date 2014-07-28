var S = require('string');

var filterFloat = function (value) {
  if (/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/
    .test(value)) {
    return Number(value);
  }
  return NaN;
};

var extractTheNumber = function (stringToModify) {
  stringToModify = S(stringToModify).stripTags().s;
  var output = filterFloat(stringToModify);
  return output;
};

module.exports = {
  extractTheNumber: extractTheNumber
};
