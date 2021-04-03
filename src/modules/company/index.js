'use strict';

const admin = require('firebase-admin');
const { AuthException } = require('../../helpers/error');
const {
  MESSAGES,
  COLLECTION_NAMES,
  AGENT_FIELDS,
  USER_FIELDS,
} = require('../../helpers/constants');
const { parseDocs } = require('../../helpers/start-helper');
const { verifyAccess } = require('../../helpers/company-helper');
const { isCompanyValid, isBankValid } = require('../../helpers/validators');

const createCompany =  async ({ company, bankAccount }, user) => {
  if (user.email !== company.manager) throw new AuthException(MESSAGES.UNAUTHORIZED_USER);

  const companyValid = isCompanyValid(company);
  const bankValid = isBankValid(bankAccount);

  if (!companyValid) throw new Error(MESSAGES.NOT_VALID_COMPANY);
  if (!bankValid) throw new Error(MESSAGES.NOT_VALID_BANK);

  const bankRef = admin.firestore().collection(COLLECTION_NAMES.BANK);
  const bankRes = await bankRef.add(bankAccount);
  const companyRef = admin.firestore().collection(COLLECTION_NAMES.COMPANY);
  await companyRef.add({
    ...company,
    bankAccountId: bankRes.id,
  });
};

const deleteCompany =  async ({ companyId }, user) => {
  const { companyRef, company } = await verifyAccess(user, companyId);
  const today = (new Date()).setMinutes(0, 0, 0) / 1000;
  console.log(`TODAY: ${today}`);
  const agentsRef = admin.firestore().collection(COLLECTION_NAMES.AGENT);
  const agents = await agentsRef
    .where(AGENT_FIELDS.COMPANY_ID, '==', companyId)
    .where(AGENT_FIELDS.DATE, '>=', today).get();
  console.log(`AGENTS: ${JSON.stringify(agents)}`);
  if (!agents.empty) {
    throw new Error(MESSAGES.THERE_ARE_EXPEDIENTS);
  }
  const bankRef = admin.firestore().collection(COLLECTION_NAMES.BANK);
  await bankRef.doc(company.bankAccountId).delete();
  await companyRef.doc(companyId).delete();
};

const updateCompany =  async (company, user) => {
  const { companyRef } = await verifyAccess(user, company.id);

  const companyValid = isCompanyValid(company);
  if (!companyValid) throw new Error(MESSAGES.NOT_VALID_COMPANY);

  await companyRef.doc(company.id).set(company, { merge: true });
};

const answerManager = async ({ companyId, accepted }, user) => {
  const companyRef = admin.firestore().collection(COLLECTION_NAMES.COMPANY);
  const company = await companyRef.doc(companyId).get();
  const { employes, askedEmployes } = company.data();

  if (askedEmployes && askedEmployes.length && askedEmployes.includes(user.email)) {
    throw new Error(MESSAGES.EMPLOYEE_NOT_ASKED);
  }

  const usersRef = admin.firestore().collection(COLLECTION_NAMES.USER);
  const userQuerySnapshot = await usersRef.where(USER_FIELDS.EMAIL, '==', user.email)
    .where(USER_FIELDS.IS_PROVIDER, '==', true).get();
  const [userData] = parseDocs(userQuerySnapshot);

  if (accepted) {
    await companyRef.doc(companyId).set({
      employes: [
        ...employes,
        userData.email,
      ],
      askedEmployes: askedEmployes.filter(email => email !== userData.email),
    }, { merge: true });
  }

  const emoji = `${accepted ? '👍' : '👎'}`;
  const promisses = userData.messagingTokens.map(async (token) => {
    await admin.messaging().sendToDevice(token, {
      notification: {
        title: 'Cadastro de funcionário',
        body:
          `O ${userData.name} ${accepted ? '' : 'não'} aceitou ser seu funcionário ${emoji}`,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    });
  });
  await Promise.all(promisses);

  return { accepted };
};

const askEmploye = async ({ companyId, employe }, user) => {
  const { companyRef, company } = await verifyAccess(user, companyId);

  await companyRef.doc(companyId).set({
    askedEmployes: [
      ...company.askedEmployes,
      employe,
    ],
  }, { merge: true });

  const usersRef = admin.firestore().collection(COLLECTION_NAMES.USER);
  const userQuerySnapshot = await usersRef.where(USER_FIELDS.EMAIL, '==', user.email)
    .where(USER_FIELDS.IS_PROVIDER, '==', true).get();
  const [userData] = parseDocs(userQuerySnapshot);

  const promisses = userData.messagingTokens.map(async (token) => {
    await admin.messaging().sendToDevice(token, {
      notification: {
        title: 'Cadastro de funcionário',
        body: `O ${
          userData.name
        } esta te pedindo para você se tornar funcionário de sua empresa, vem dar um olhada 🔍`,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      data: {
        companyId,
      },
    });
  });
  await Promise.all(promisses);
  return { companyId };
};

const changeBank =  async ({ companyId, bankAccount }, user) => {
  const { company } = await verifyAccess(user, companyId);
  const bankRef = admin.firestore().collection(COLLECTION_NAMES.BANK);
  const bank = await bankRef.doc(company.bankAccountId).get();
  const bankData = bank.data();
  if (!bankData) throw new Error(MESSAGES.NO_BANK);

  const bankValid = isBankValid(bankAccount);
  if (!bankValid) throw new Error(MESSAGES.NOT_VALID_BANK);

  await bankRef.doc(company.bankAccountId).set(bankAccount, { merge: true });
};

module.exports = {
  createCompany,
  deleteCompany,
  updateCompany,
  changeBank,
  answerManager,
  askEmploye,
};
