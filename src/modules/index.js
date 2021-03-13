'use strict';

const cors = require('cors');
const express = require('serverless-express/express');

const { startRouteCalculation } = require('./intel');
const router = require('./router');
const { eventHandler } = require('../helpers/handler');
const { errorHandler, notFoundHandler } = require('../helpers/error');

const server = express();

server.use(cors());
server.use('/', router);
server.use(errorHandler);
server.use(notFoundHandler);

module.exports = {
  startRouteCalculation: eventHandler(startRouteCalculation),
  server,
};
