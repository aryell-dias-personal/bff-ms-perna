'use strict';

const admin = require('firebase-admin');
const stripe = require('stripe');
const { parseDocs } = require('../../helpers/start-helper');
const { COLLECTION_NAMES, MESSAGES, USER_FIELDS } = require('../../helpers/constants');
const { getStripeScretKey } = require('../../helpers/payment-helper');

const insertUser = async (user) => {
  const userRef = admin.firestore().collection(COLLECTION_NAMES.USER);
  const userQuerySnapshot = await userRef.where(USER_FIELDS.EMAIL, '==', user.email)
    .limit(1).get();
  if (!userQuerySnapshot.empty) throw new Error(MESSAGES.USER_EXISITS);

  const stripeSecret = await getStripeScretKey();
  const customer = await stripe(stripeSecret).customers.create({
    email: user.email,
    name: user.name,
  });

  await userRef.add({
    ...user,
    paymentId: customer.id,
  });
  return {
    user: JSON.stringify({
      ...user,
      paymentId: undefined,
      messagingTokens: undefined,
    }),
  };
};

const getUser = async ({ email, messagingToken }) => {
  const userRef = admin.firestore().collection(COLLECTION_NAMES.USER);
  const userQuerySnapshot = await userRef.where(USER_FIELDS.EMAIL, '==', email)
    .limit(1).get();
  const [user] = parseDocs(userQuerySnapshot);
  if (!user) throw new Error(MESSAGES.NO_USER);
  const newMessagingTokens = [messagingToken, ...user.messagingTokens];
  await userRef.doc(user._id).set({ messagingTokens: newMessagingTokens }, { merge: true });

  return {
    user: JSON.stringify({
      ...user,
      paymentId: undefined,
      messagingTokens: undefined,
    }),
  };
};

const logout = async ({ email, messagingToken }) => {
  const userRef = admin.firestore().collection(COLLECTION_NAMES.USER);
  const userQuerySnapshot = await userRef.where(USER_FIELDS.EMAIL, '==', email)
    .limit(1).get();
  const [user] = parseDocs(userQuerySnapshot);
  if (!user) throw new Error(MESSAGES.NO_USER);
  const newMessagingTokens = user.messagingTokens.filter(token => token !== messagingToken);
  await userRef.doc(user._id).set({ messagingTokens: newMessagingTokens }, { merge: true });

  return {
    user: JSON.stringify({
      ...user,
      paymentId: undefined,
      messagingTokens: undefined,
    }),
  };
};

module.exports = {
  insertUser,
  getUser,
  logout,
};
