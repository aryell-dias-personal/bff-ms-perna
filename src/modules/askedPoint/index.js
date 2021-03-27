'use strict';

const { isInsertEventValid } = require('../../helpers/validators');
const { mountAskedPoint } = require('../../helpers/insert-asked-helper');
const { MESSAGES, EVENT_TYPE } = require('../../helpers/constants');
const { AuthException } = require('../../helpers/error');

const simulateAskedPoint = async (askedPoint, user) => {
  if (user.email !== askedPoint.email) throw new AuthException(MESSAGES.UNAUTHORIZED_USER);
  const isValid = await isInsertEventValid(askedPoint, EVENT_TYPE.ASKED_POINT);
  if (!isValid) throw new Error(MESSAGES.NOT_VALID_EVENT);

  const simulatedAskedPoint = mountAskedPoint(askedPoint, user.currency);
  console.log(`SIMULATED_ASKED_POINT: ${JSON.stringify(simulatedAskedPoint)}`);

  return { simulatedAskedPoint };
};

module.exports = {
  simulateAskedPoint,
};
