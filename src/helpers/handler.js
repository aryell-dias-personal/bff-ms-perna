'use strict';

const admin = require('firebase-admin');
const { Base64 } = require('js-base64');
const { RETURN_MESSAGES } = require('./constants');
const { parseDocs } = require('./start-helper');
const { COLLECTION_NAMES, MESSAGES, USER_FIELDS } = require('./constants');
const { AuthException } = require('./error');

const getInfoFromPubSubEvent = (event) => {
  console.log(`BODY: \n ${event.data}`);
  return event.data ? JSON.parse(Base64.decode(event.data)) : null;
};

const handler = func => async (req, res, next) => {
  try {
    console.log(`BODY: \n ${req.body}`);
    const body = JSON.parse(req.body);
    const data = await func(body);
    const response = { message: RETURN_MESSAGES.SUCCESS, ...data };
    console.log('FINAL RESULT \n', { response });
    res.status(200).send(response);
  } catch (error) {
    next(error);
  }
};

const eventHandler = func => async (event, context) => {
  try {
    console.log('EVENT: \n', { event, context });
    const body = getInfoFromPubSubEvent(event);
    const data = await func(body);
    const response = { message: RETURN_MESSAGES.SUCCESS, ...data };
    console.log('FINAL RESULT \n', { response });
  } catch (error) {
    console.log('ERROR: \n', error);
  }
};

const authHandler = func => async (req, res, next) => {
  try {
    console.log(`BODY: \n ${req.body}`);
    const body = JSON.parse(req.body);
    const { headers } = req;
    console.log('HEADERS: \n', req.headers);

    if (!headers.authorization) throw new AuthException(MESSAGES.TOKEN_REQUIRED);
    const userData = await admin.auth().verifyIdToken(headers.authorization);
    console.log(`UID: ${userData.uid}`);
    const loggedUser = await admin.auth().getUser(userData.uid);
    console.log(`LOGGED_EMAIL: ${loggedUser.email}`);
    const usersRef = admin.firestore().collection(COLLECTION_NAMES.USER);
    const userQuerySnapshot = await usersRef
      .where(USER_FIELDS.EMAIL, '==', loggedUser.email).limit(1).get();
    if (userQuerySnapshot.empty) throw new AuthException(MESSAGES.USER_DOESNT_EXISITS);
    const [user] = parseDocs(userQuerySnapshot);

    const data = await func(body, user);
    const response = { message: RETURN_MESSAGES.SUCCESS, ...data };
    console.log('FINAL RESULT \n', { response });
    res.status(200).send(response);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handler,
  eventHandler,
  authHandler,
};
