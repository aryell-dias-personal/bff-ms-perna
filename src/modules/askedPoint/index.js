'use strict';

const { isInsertValid } = require('../../helpers/validators');
const { mountAskedPoint } = require('../../helpers/insert-asked-helper');
const { MESSAGES } = require('../../helpers/constants');
const { AuthException } = require('../../helpers/error');

const simulateAskedPoint = async (askedPoint, user) => {
  if (user.email !== askedPoint.email) throw new AuthException(MESSAGES.UNAUTHORIZED_USER);
  const isValid = await isInsertValid(askedPoint);
  if (!isValid) throw new Error(MESSAGES.BUSY_USER);

  const simulatedAskedPoint = mountAskedPoint(askedPoint, user.currency);
  console.log(`SIMULATED_ASKED_POINT: ${JSON.stringify(simulatedAskedPoint)}`);

  return { simulatedAskedPoint };
};

module.exports = {
  simulateAskedPoint,
};
