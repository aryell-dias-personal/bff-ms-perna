'use strict';

const admin = require('firebase-admin');
const stripe = require('stripe');
const { parseDocs } = require('../../helpers/start-helper');
const { authHandler } = require('../../helpers/error-handler');
const { isInsertValid } = require('../../helpers/validators');
const { mountAskedPoint } = require('../../helpers/insert-asked-helper');
const { COLLECTION_NAMES, MESSAGES, USER_FIELDS } = require('../../helpers/constants');
const { getStripeScretKey } = require('../../helpers/payment-helper');

const listCreditCard = (req, res) => authHandler(req, res, async (_, token) => {
  const userData = await admin.auth().verifyIdToken(token);
  console.log(`UID: ${userData.uid}`);
  const loggedUser = await admin.auth().getUser(userData.uid);
  console.log(`LOGGED_EMAIL: ${loggedUser.email}`);
  const usersRef = admin.firestore().collection(COLLECTION_NAMES.USER);
  const userQuerySnapshot = await usersRef
    .where(USER_FIELDS.EMAIL, '==', loggedUser.email).limit(1).get();
  if (userQuerySnapshot.empty) throw new Error(MESSAGES.USER_DOESNT_EXISITS);
  const [user] = parseDocs(userQuerySnapshot);

  const stripeSecret = await getStripeScretKey();
  const cards = await stripe(stripeSecret).customers
    .listSources(user.paymentId, { object: 'card', limit: 10 });

  if (!cards || !cards.data || !cards.data.length) {
    return { retrivedCards: [] };
  }

  const retrivedCards = cards.data.map((card) => {
    const month = `${card.exp_month}`.length === 2 ? `${card.exp_month}` : `0${card.exp_month}`;
    const year = `${card.exp_year}`.substring(2);
    return {
      id: card.id,
      cardNumber: `**** **** **** ${card.last4}`,
      expiryDate: `${month}/${year}`,
      cardHolderName: card.name,
      cvvCode: '***',
      brand: card.brand,
    };
  });

  return { retrivedCards };
});

const insertCreditCard = (req, res) => authHandler(req, res, async (source, token) => {
  const userData = await admin.auth().verifyIdToken(token);
  console.log(`UID: ${userData.uid}`);
  const loggedUser = await admin.auth().getUser(userData.uid);
  console.log(`LOGGED_EMAIL: ${loggedUser.email}`);
  const usersRef = admin.firestore().collection(COLLECTION_NAMES.USER);
  const userQuerySnapshot = await usersRef
    .where(USER_FIELDS.EMAIL, '==', loggedUser.email).limit(1).get();
  if (userQuerySnapshot.empty) throw new Error(MESSAGES.USER_DOESNT_EXISITS);
  const [user] = parseDocs(userQuerySnapshot);

  const stripeSecret = await getStripeScretKey();
  const card = await stripe(stripeSecret).customers.createSource(user.paymentId, source);

  return { cardId: card.id };
});

const confirmAskedPointPayment = (req, res) => {
  authHandler(req, res, async (askedPoint, token) => {
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
    const stripeInstance = stripe(stripeSecret);

    const customer = await stripeInstance.customers.retrieve(user.paymentId);
    const newAskedPoint = mountAskedPoint(askedPoint, user.currency);
    console.log(`NEW_ASKED_POINT: ${JSON.stringify(newAskedPoint)}`);

    const charge = await stripeInstance.charges.create({
      amount: newAskedPoint.amount,
      currency: user.currency,
      source: customer.default_source,
      description: `Pedido do usuário com nome ${user.name}`,
      customer: user.paymentId,
    });

    if (charge.paid) {
      const askedPointsRef = admin.firestore().collection(COLLECTION_NAMES.ASKED_POINT);
      await askedPointsRef.add({
        ...newAskedPoint,
        chargeObject: charge.id,
      });
    }

    return { paid: charge.paid };
  });
};

const deleteCreditCard = (req, res) => authHandler(req, res, async (card, token) => {
  const userData = await admin.auth().verifyIdToken(token);
  console.log(`UID: ${userData.uid}`);
  const loggedUser = await admin.auth().getUser(userData.uid);
  console.log(`LOGGED_EMAIL: ${loggedUser.email}`);
  const usersRef = admin.firestore().collection(COLLECTION_NAMES.USER);
  const userQuerySnapshot = await usersRef
    .where(USER_FIELDS.EMAIL, '==', loggedUser.email).limit(1).get();
  if (userQuerySnapshot.empty) throw new Error(MESSAGES.USER_DOESNT_EXISITS);
  const [user] = parseDocs(userQuerySnapshot);

  const stripeSecret = await getStripeScretKey();
  const response = await stripe(stripeSecret).customers.deleteSource(
    user.paymentId,
    card.creditCardId
  );

  return { deleted: response.deleted };
});

const turnDefaultCreditCard = (req, res) => authHandler(req, res, async (card, token) => {
  const userData = await admin.auth().verifyIdToken(token);
  console.log(`UID: ${userData.uid}`);
  const loggedUser = await admin.auth().getUser(userData.uid);
  console.log(`LOGGED_EMAIL: ${loggedUser.email}`);
  const usersRef = admin.firestore().collection(COLLECTION_NAMES.USER);
  const userQuerySnapshot = await usersRef
    .where(USER_FIELDS.EMAIL, '==', loggedUser.email).limit(1).get();
  if (userQuerySnapshot.empty) throw new Error(MESSAGES.USER_DOESNT_EXISITS);
  const [user] = parseDocs(userQuerySnapshot);

  const stripeSecret = await getStripeScretKey();
  await stripe(stripeSecret).customers.update(
    user.paymentId,
    { default_source: card.creditCardId }
  );

  return { defaultSource: card.creditCardId };
});

module.exports = {
  listCreditCard,
  insertCreditCard,
  confirmAskedPointPayment,
  deleteCreditCard,
  turnDefaultCreditCard,
};
