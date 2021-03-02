'use strict';

const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY);
const {
  mountGetRoutePayload, enqueue, listQueues, createQueue, parseDocs, updatePernaQueues,
} = require('./src/helpers/start-helper');
const { isInsertValid } = require('./src/helpers/validators');
const { mountAskedPoint } = require('./src/helpers/insert-asked-helper');
const { mountAgent } = require('./src/helpers/insert-agent-helper');
const { COLLECTION_NAMES, MESSAGES, USER_FIELDS } = require('./src/helpers/constants');
const { handler, authHandler, eventHandler } = require('./src/helpers/error-handler');

admin.initializeApp();
const { PERNA_QUEUE } = process.env;


module.exports.startRouteCalculation = (event, context) => eventHandler(event, context, async () => {
  await updatePernaQueues();
  const getRoutePayload = await mountGetRoutePayload();
  console.log(`GET_ROUTE_PAYLOAD: \n${JSON.stringify(getRoutePayload)}`);
  let taskResponse;
  if (getRoutePayload.agents.length
      && getRoutePayload.matrix.askedPoints.length
      && getRoutePayload.matrix.askedPoints.length) {
    const queueNames = await listQueues();
    console.log(`QUEUE_NAMES: \n${JSON.stringify(queueNames)}`);
    if (!queueNames.includes(PERNA_QUEUE)) {
      await createQueue();
    }
    taskResponse = await enqueue(getRoutePayload);
  }
  return {
    getRoutePayload: JSON.stringify(getRoutePayload),
    taskResponse,
  };
});

module.exports.insertCreditCard = (req, res) => authHandler(req, res, async (source, token) => {
  const userData = await admin.auth().verifyIdToken(token);
  console.log(`UID: ${userData.uid}`);
  const loggedUser = await admin.auth().getUser(userData.uid);
  console.log(`LOGGED_EMAIL: ${loggedUser.email}`);
  const usersRef = admin.firestore().collection(COLLECTION_NAMES.USER);
  const userQuerySnapshot = await usersRef.where(USER_FIELDS.EMAIL, '==', loggedUser.email).limit(1).get();
  if (userQuerySnapshot.empty) throw new Error(MESSAGES.USER_DOESNT_EXISITS);
  const [user] = parseDocs(userQuerySnapshot);

  await stripe.customers.createSource(user.paymentId, source);

  return { sucess: true };
});

module.exports.listCreditCard = (req, res) => authHandler(req, res, async (source, token) => {
  const userData = await admin.auth().verifyIdToken(token);
  console.log(`UID: ${userData.uid}`);
  const loggedUser = await admin.auth().getUser(userData.uid);
  console.log(`LOGGED_EMAIL: ${loggedUser.email}`);
  const usersRef = admin.firestore().collection(COLLECTION_NAMES.USER);
  const userQuerySnapshot = await usersRef.where(USER_FIELDS.EMAIL, '==', loggedUser.email).limit(1).get();
  if (userQuerySnapshot.empty) throw new Error(MESSAGES.USER_DOESNT_EXISITS);
  const [user] = parseDocs(userQuerySnapshot);

  const cards = await stripe.customers.listSources(user.paymentId, { object: 'card', limit: 10 });

  if (!cards || !cards.data || !cards.data.length) {
    return { retrivedCards: [] };
  }

  const retrivedCards = cards.data.map((card) => {
    const month = `${card.month}`.length === 2 ? `${card.month}` : `0${card.month}`;
    const year = `${card.year}`.substring(2);
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

module.exports.insertAskedPoint = (req, res) => authHandler(req, res, async (askedPoint, token) => {
  const userData = await admin.auth().verifyIdToken(token);
  console.log(`UID: ${userData.uid}`);
  const loggedUser = await admin.auth().getUser(userData.uid);
  console.log(`LOGGED_EMAIL: ${loggedUser.email}`);
  if (loggedUser.email !== askedPoint.email) throw new Error(MESSAGES.UNAUTHORIZED_USER);
  const isValid = await isInsertValid(askedPoint);
  if (!isValid) throw new Error(MESSAGES.BUSY_USER);
  const askedPointsRef = admin.firestore().collection(COLLECTION_NAMES.ASKED_POINT);
  const newAskedPoint = mountAskedPoint(askedPoint);
  await askedPointsRef.add(newAskedPoint);

  return { newAskedPoint: JSON.stringify(newAskedPoint) };
});

module.exports.insertAgent = (req, res) => authHandler(req, res, async (agent, token) => {
  const userData = await admin.auth().verifyIdToken(token);
  console.log(`UID: ${userData.uid}`);
  const loggedUser = await admin.auth().getUser(userData.uid);
  console.log(`LOGGED_EMAIL: ${loggedUser.email}`);
  if (loggedUser.email !== agent.email) throw new Error(MESSAGES.UNAUTHORIZED_USER);
  const usersRef = admin.firestore().collection(COLLECTION_NAMES.USER);
  const userQuerySnapshot = await usersRef.where(USER_FIELDS.EMAIL, '==', agent.email)
    .where(USER_FIELDS.IS_PROVIDER, '==', true).limit(1).get();
  const [user] = parseDocs(userQuerySnapshot);
  if (!user) throw new Error(MESSAGES.MUST_BE_PROVIDER);
  const isValid = await isInsertValid(agent);
  if (!isValid) throw new Error(MESSAGES.BUSY_USER);

  const agentRef = admin.firestore().collection(COLLECTION_NAMES.AGENT);
  const newAgent = mountAgent(agent);
  await agentRef.add(newAgent);

  return { newAgent: JSON.stringify(newAgent) };
});

module.exports.insertUser = (req, res) => handler(req, res, async (user) => {
  const userRef = admin.firestore().collection(COLLECTION_NAMES.USER);
  const userQuerySnapshot = await userRef.where(USER_FIELDS.EMAIL, '==', user.email)
    .limit(1).get();
  if (!userQuerySnapshot.empty) throw new Error(MESSAGES.USER_EXISITS);

  const customer = await stripe.customers.create({
    description: `Customer with email: ${user.email}`,
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
});

module.exports.getUser = (req, res) => handler(req, res, async ({ email, messagingToken }) => {
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
});

module.exports.logout = (req, res) => handler(req, res, async ({ email, messagingToken }) => {
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
});

module.exports.askNewAgent = (req, res) => handler(req, res, async (agent) => {
  const usersRef = admin.firestore().collection(COLLECTION_NAMES.USER);
  const toUserQuerySnapshot = await usersRef.where(USER_FIELDS.EMAIL, '==', agent.email)
    .where(USER_FIELDS.IS_PROVIDER, '==', true).get();
  const fromUserQuerySnapshot = await usersRef.where(USER_FIELDS.EMAIL, '==', agent.fromEmail)
    .where(USER_FIELDS.IS_PROVIDER, '==', true).get();
  const users = parseDocs(toUserQuerySnapshot).concat(parseDocs(fromUserQuerySnapshot));
  console.log(`Users: ${JSON.stringify(users)}`);
  if (!users || users.length !== 2) throw new Error(MESSAGES.MUST_BE_TWO_PROVIDERS);
  const [toUser, fromUser] = users;
  if (toUser.messagingTokens.length === 0) throw new Error(MESSAGES.NO_DEVICE);
  const promisses = toUser.messagingTokens.map(async (token) => {
    await admin.messaging().sendToDevice(token, {
      notification: {
        title: 'Pedido de expediente',
        body: `O ${fromUser.name} esta te pedindo um expediente, vem dar um olhada 🔍`,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      data: {
        agent: JSON.stringify(agent),
      },
    });
  });
  await Promise.all(promisses);
  return { newAgent: agent };
});

module.exports.answerNewAgent = (req, res) => handler(req, res, async ({ fromEmail, toEmail, accepted }) => {
  const usersRef = admin.firestore().collection(COLLECTION_NAMES.USER);
  const toUserQuerySnapshot = await usersRef.where(USER_FIELDS.EMAIL, '==', toEmail)
    .where(USER_FIELDS.IS_PROVIDER, '==', true).get();
  const fromUserQuerySnapshot = await usersRef.where(USER_FIELDS.EMAIL, '==', fromEmail)
    .where(USER_FIELDS.IS_PROVIDER, '==', true).get();
  const users = parseDocs(toUserQuerySnapshot).concat(parseDocs(fromUserQuerySnapshot));
  console.log(`Users: ${JSON.stringify(users)}`);
  if (!users || users.length !== 2) throw new Error(MESSAGES.MUST_BE_TWO_PROVIDERS);
  const [toUser, fromUser] = users;
  if (toUser.messagingTokens.length === 0) throw new Error(MESSAGES.NO_DEVICE);
  const promisses = fromUser.messagingTokens.map(async (token) => {
    await admin.messaging().sendToDevice(token, {
      notification: {
        title: 'Pedido de expediente',
        body: `O ${toUser.name} ${accepted ? '' : 'não'} aceitou seu pedindo de expediente ${accepted ? '👍' : '👎'}`,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    });
  });
  await Promise.all(promisses);
  return { accepted };
});
