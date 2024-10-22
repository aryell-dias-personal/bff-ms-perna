'use strict';

const admin = require('firebase-admin');
const { parseDocs } = require('../../helpers/start-helper');
const { COLLECTION_NAMES, MESSAGES, USER_FIELDS } = require('../../helpers/constants');
const { isInsertValid } = require('../../helpers/validators');
const { mountAgent } = require('../../helpers/insert-agent-helper');
const { AuthException } = require('../../helpers/error');

const askNewAgent = async (agent) => {
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
};

const answerNewAgent = async ({ fromEmail, toEmail, accepted }) => {
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
  const emoji = `${accepted ? '👍' : '👎'}`;
  const promisses = fromUser.messagingTokens.map(async (token) => {
    await admin.messaging().sendToDevice(token, {
      notification: {
        title: 'Pedido de expediente',
        body:
          `O ${toUser.name} ${accepted ? '' : 'não'} aceitou seu pedindo de expediente ${emoji}`,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    });
  });
  await Promise.all(promisses);
  return { accepted };
};

const insertAgent = async (agent, user) => {
  if (user.email !== agent.email) throw new AuthException(MESSAGES.UNAUTHORIZED_USER);
  if (!user) throw new Error(MESSAGES.MUST_BE_PROVIDER);
  const isValid = await isInsertValid(agent);
  if (!isValid) throw new Error(MESSAGES.BUSY_USER);

  const agentRef = admin.firestore().collection(COLLECTION_NAMES.AGENT);
  const newAgent = mountAgent(agent);
  await agentRef.add(newAgent);

  return { newAgent: JSON.stringify(newAgent) };
};

module.exports = {
  answerNewAgent,
  askNewAgent,
  insertAgent,
};
