'use strict';

const randomstring = require('randomstring');
const { ENCODED_NAMES } = require('./constants');

module.exports.mountAskedPoint = (askedPoint) => {
  let { queue, date } = askedPoint;
  if (queue != null) {
    const fullQueue = [date, ...queue];
    const orderedFullQueue = fullQueue.sort((first, second) => first - second);
    ([date, ...queue] = orderedFullQueue);
  }
  return {
    ...askedPoint,
    queue,
    date,
    origin: `${askedPoint.origin}${ENCODED_NAMES.SEPARETOR}${randomstring.generate()}`,
    destiny: `${askedPoint.destiny}${ENCODED_NAMES.SEPARETOR}${randomstring.generate()}`,
  };
};
