'use strict';

const agent = require('./agent');
const askedPoint = require('./askedPoint');
const intel = require('./intel');
const payment = require('./payment');
const user = require('./user');

module.exports = {
  ...agent,
  ...askedPoint,
  ...intel,
  ...payment,
  ...user,
};
