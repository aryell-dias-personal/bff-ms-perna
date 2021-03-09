'use strict';

const admin = require('firebase-admin');
const stripe = require('stripe');
const { parseDocs } = require('../../helpers/start-helper');
const { isInsertValid } = require('../../helpers/validators');
const { mountAskedPoint } = require('../../helpers/insert-asked-helper');
const { COLLECTION_NAMES, MESSAGES, USER_FIELDS } = require('../../helpers/constants');
const { authHandler } = require('../../helpers/error-handler');
const { getStripeScretKey } = require('../../helpers/payment-helper');

const simulateAskedPoint = (req, res) => authHandler(req, res, async (askedPoint, token) => {
  const userData = await admin.auth().verifyIdToken(token);
  console.log(`UID: ${userData.uid}`);
  const loggedUser = await admin.auth().getUser(userData.uid);
  console.log(`LOGGED_EMAIL: ${loggedUser.email}`);

  if (loggedUser.email !== askedPoint.email) throw new Error(MESSAGES.UNAUTHORIZED_USER);
  const isValid = await isInsertValid(askedPoint);
  if (!isValid) throw new Error(MESSAGES.BUSY_USER);

  const usersRef = admin.firestore().collection(COLLECTION_NAMES.USER);
  const userQuerySnapshot = await usersRef
    .where(USER_FIELDS.EMAIL, '==', loggedUser.email).limit(1).get();
  if (userQuerySnapshot.empty) throw new Error(MESSAGES.USER_DOESNT_EXISITS);
  const [user] = parseDocs(userQuerySnapshot);

  const stripeSecret = await getStripeScretKey();
  const customer = await stripe(stripeSecret).customers.retrieve(user.paymentId);
  const simulatedAskedPoint = mountAskedPoint(askedPoint, customer.currency);
  console.log(`SIMULATED_ASKED_POINT: ${JSON.stringify(simulatedAskedPoint)}`);

  return { simulatedAskedPoint };
});

module.exports = {
  simulateAskedPoint,
};
