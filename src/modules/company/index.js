'use strict';

const admin = require('firebase-admin');
const { AuthException } = require('../../helpers/error');
const { MESSAGES, COLLECTION_NAMES, AGENT_FIELDS } = require('../../helpers/constants');
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
  const { companyRef } = await verifyAccess(user, companyId);
  const today = (new Date()).setMinutes(0, 0, 0) / 1000;
  const agentsRef = admin.firestore().collection(COLLECTION_NAMES.AGENT);
  const agents = await agentsRef
    .where(AGENT_FIELDS.companyId, '==', companyId)
    .where(AGENT_FIELDS.DATE, '>=', today).get();
  if (agents.empty) {
    throw new Error(MESSAGES.THERE_ARE_EXPEDIENTS);
  }
  await companyRef.doc(companyId).delete();
};

const updateCompany =  async (company, user) => {
  const { companyRef } = await verifyAccess(user, company.id);

  const companyValid = isCompanyValid(company);
  if (!companyValid) throw new Error(MESSAGES.NOT_VALID_COMPANY);

  await companyRef.doc(company.id).set(company, { merge: true });
};

const changeBank =  async ({ companyId, bankAccount }, user) => {
  const { company } = await verifyAccess(user, companyId);
  const bankRef = admin.firestore().collection(COLLECTION_NAMES.BANK);
  const bank = bankRef.doc(company.bankAccountId).get();
  if (!bank) throw new Error(MESSAGES.NO_BANK);

  const bankValid = isBankValid(bankAccount);
  if (!bankValid) throw new Error(MESSAGES.NOT_VALID_BANK);

  await bankRef.doc(company.bankAccountId).set(bankAccount, { merge: true });
};

module.exports = {
  createCompany,
  deleteCompany,
  updateCompany,
  changeBank,
};
